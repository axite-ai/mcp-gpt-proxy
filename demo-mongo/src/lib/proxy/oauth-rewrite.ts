/**
 * OAuth URL Rewriting
 *
 * Rewrites upstream OAuth URLs in discovery documents to point back
 * to the proxy, ensuring OAuth flows complete correctly.
 */

/**
 * Extract base URL from MCP endpoint
 * Removes /mcp suffix if present
 */
export function extractMcpBase(mcpUrl: string): string {
  try {
    const url = new URL(mcpUrl);
    if (url.pathname.endsWith("/mcp")) {
      url.pathname = url.pathname.slice(0, -4) || "/";
    }
    return url.toString().replace(/\/$/, "");
  } catch {
    return mcpUrl.replace(/\/mcp$/, "");
  }
}

/**
 * Rewrite OAuth URLs in discovery document
 * Replaces all occurrences of upstream base URL with proxy base URL
 */
export function rewriteOAuthUrls(
  document: Record<string, unknown>,
  upstreamBase: string,
  proxyBase: string
): Record<string, unknown> {
  const rewritten = { ...document };

  for (const [key, value] of Object.entries(document)) {
    // Handle string fields
    if (typeof value === "string" && value.startsWith(upstreamBase)) {
      rewritten[key] = value.replace(upstreamBase, proxyBase);
    }
    // Handle arrays of URLs (like authorization_servers)
    if (Array.isArray(value)) {
      rewritten[key] = value.map((item) =>
        typeof item === "string" && item.startsWith(upstreamBase)
          ? item.replace(upstreamBase, proxyBase)
          : item
      );
    }
  }

  return rewritten;
}
