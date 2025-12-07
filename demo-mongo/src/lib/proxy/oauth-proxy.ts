import { NextRequest } from "next/server";
import { rewriteOAuthUrls, extractMcpBase } from "./oauth-rewrite";

const MCP_ENDPOINT = process.env.MCP_SERVER_URL || "http://localhost:3001/mcp";

/**
 * Returns the upstream base URL (MCP endpoint with trailing /mcp removed).
 */
export function getMcpBase(): string {
  return extractMcpBase(MCP_ENDPOINT);
}

/**
 * Get proxy base URL from request
 */
export function getProxyBase(request: NextRequest): string {
  const protocol = request.headers.get("x-forwarded-proto") || "http";
  const host = request.headers.get("host") || "localhost:3000";
  return `${protocol}://${host}`;
}

/**
 * In this demo, the auth base is the same as the MCP base.
 * Adjust here if your auth server lives elsewhere.
 */
export function getAuthBase(): string {
  return getMcpBase();
}

function filterRequestHeaders(headers: Headers): Headers {
  const out = new Headers();
  headers.forEach((value, key) => {
    const lower = key.toLowerCase();
    if (["authorization", "content-type", "accept"].includes(lower)) {
      out.set(key, value);
    }
  });
  return out;
}

function filterResponseHeaders(headers: Headers): Headers {
  const out = new Headers();
  headers.forEach((value, key) => {
    const lower = key.toLowerCase();
    if (
      [
        "content-type",
        "www-authenticate",
        "cache-control",
        "pragma",
        "expires",
        "location", // preserve redirects (307 from upstream discovery)
      ].includes(lower)
    ) {
      out.set(key, value);
    }
  });
  return out;
}

export function withSearch(url: string, search: string): string {
  if (!search) return url;
  const u = new URL(url);
  u.search = search;
  return u.toString();
}

/**
 * Proxy an OAuth request to upstream with optional URL rewriting
 */
export async function proxyOAuthRequest(
  req: NextRequest,
  targetUrl: string,
  options: {
    rewriteUrls?: boolean;
    upstreamBase?: string;
    proxyBase?: string;
  } = {}
): Promise<Response> {
  try {
    // Upstream (Mongo MCP gateway) does not support HEAD on well-known.
    // For HEAD, perform a GET upstream and return headers/status with empty body.
    const upstreamMethod = req.method === "HEAD" ? "GET" : req.method;

    const init: RequestInit = {
      method: upstreamMethod,
      headers: filterRequestHeaders(req.headers),
      redirect: "manual", // Don't follow redirects - pass them through to client
    };

    if (upstreamMethod !== "GET" && upstreamMethod !== "HEAD") {
      init.body = await req.text();
    }

    const upstream = await fetch(targetUrl, init);

    // For HEAD, drop body but keep status/headers.
    if (req.method === "HEAD") {
      return new Response(null, {
        status: upstream.status,
        statusText: upstream.statusText,
        headers: filterResponseHeaders(upstream.headers),
      });
    }

    // If URL rewriting is disabled, return as-is
    if (!options.rewriteUrls) {
      return new Response(upstream.body, {
        status: upstream.status,
        statusText: upstream.statusText,
        headers: filterResponseHeaders(upstream.headers),
      });
    }

    // For JSON responses, rewrite URLs in discovery documents
    const contentType = upstream.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      const text = await upstream.text();
      try {
        const json = JSON.parse(text);
        const rewritten = rewriteOAuthUrls(
          json as Record<string, unknown>,
          options.upstreamBase || getMcpBase(),
          options.proxyBase || ""
        );

        const headers = filterResponseHeaders(upstream.headers);
        headers.set("Content-Type", "application/json");

        return new Response(JSON.stringify(rewritten), {
          status: upstream.status,
          statusText: upstream.statusText,
          headers,
        });
      } catch (error) {
        console.error("[OAuth Proxy] Failed to parse/rewrite JSON:", error);
        // Fall back to raw text response
        return new Response(text, {
          status: upstream.status,
          statusText: upstream.statusText,
          headers: filterResponseHeaders(upstream.headers),
        });
      }
    }

    // Non-JSON response, return as-is
    return new Response(upstream.body, {
      status: upstream.status,
      statusText: upstream.statusText,
      headers: filterResponseHeaders(upstream.headers),
    });
  } catch (error) {
    console.error("[OAuth Proxy] Failed to reach upstream", targetUrl, error);
    return new Response("Upstream auth server unreachable", { status: 502 });
  }
}

/**
 * Proxy an incoming request to the target URL, preserving status/body and
 * forwarding only auth/content headers.
 *
 * @deprecated Use proxyOAuthRequest instead
 */
export async function proxyRequest(req: NextRequest, targetUrl: string) {
  return proxyOAuthRequest(req, targetUrl, { rewriteUrls: false });
}
