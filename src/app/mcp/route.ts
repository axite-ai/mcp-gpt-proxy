/**
 * MCP Proxy Route
 *
 * Main proxy endpoint that:
 * 1. Receives MCP requests from ChatGPT
 * 2. Forwards them to the upstream MCP server
 * 3. Intercepts responses and injects widget metadata for configured tools
 * 4. Handles widget resource requests directly
 */

import { NextRequest } from "next/server";
import type {
  JsonRpcRequest,
  JsonRpcResponse,
  ToolsCallResult,
  ResourcesReadResult,
} from "@/lib/types/mcp";
import {
  isToolsCallRequest,
  isResourcesReadRequest,
  isToolsCallResponse,
} from "@/lib/types/mcp";
import { config, getWidgetConfig } from "@/lib/config/proxy.config";
import { injectWidgetMeta } from "@/lib/proxy/inject-meta";
import {
  isWidgetUri,
  handleWidgetResourceRead,
} from "@/lib/proxy/widget-server";

const MCP_SERVER_URL = config.mcpServerUrl;

/**
 * Handle GET requests (Health Check)
 */
export async function GET(request: NextRequest) {
  try {
    // Extract base URL by removing /mcp suffix if present
    const baseUrl = MCP_SERVER_URL.replace(/\/mcp$/, "");

    // Check if the actual MCP server is reachable
    const healthCheck = await fetch(`${baseUrl}/health`, {
      method: "GET",
      signal: AbortSignal.timeout(5000), // 5 second timeout
    });

    if (healthCheck.ok) {
      const serverStatus = await healthCheck.json();
      return Response.json({
        status: "healthy",
        proxy: "active",
        server: serverStatus,
        timestamp: new Date().toISOString(),
      });
    } else {
      return Response.json(
        {
          status: "degraded",
          proxy: "active",
          server: "unreachable",
          serverStatus: healthCheck.status,
          timestamp: new Date().toISOString(),
        },
        { status: 503 }
      );
    }
  } catch (error) {
    return Response.json(
      {
        status: "unhealthy",
        proxy: "active",
        server: "down",
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 503 }
    );
  }
}

/**
 * Handle OPTIONS requests (CORS)
 */
export async function OPTIONS(request: NextRequest) {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}

/**
 * Handle MCP POST requests
 */
export async function POST(request: NextRequest) {
  let body: JsonRpcRequest;

  try {
    body = await request.json();
  } catch {
    return Response.json(
      {
        jsonrpc: "2.0",
        error: { code: -32700, message: "Parse error" },
        id: null,
      },
      { status: 400 }
    );
  }

  // Handle widget resource reads locally
  if (isResourcesReadRequest(body)) {
    const uri = body.params.uri;

    if (isWidgetUri(uri)) {
      const baseUrl = getBaseUrl(request);
      const widgetContent = await handleWidgetResourceRead(uri, baseUrl);

      if (widgetContent) {
        const response: JsonRpcResponse = {
          jsonrpc: "2.0",
          id: body.id,
          result: {
            contents: [widgetContent],
          } as ResourcesReadResult,
        };
        return Response.json(response);
      }

      // Widget not found
      return Response.json({
        jsonrpc: "2.0",
        id: body.id,
        error: { code: -32002, message: `Widget not found: ${uri}` },
      });
    }
  }

  // Forward request to upstream MCP server
  try {
    // Construct robust headers for upstream
    const headers = new Headers();
    headers.set("Content-Type", "application/json");
    // Forward Auth
    const auth = request.headers.get("Authorization");
    if (auth) headers.set("Authorization", auth);
    // Forward Accept
    const accept = request.headers.get("Accept");
    if (accept) headers.set("Accept", accept);

    const response = await fetch(MCP_SERVER_URL, {
      method: "POST",
      headers: headers,
      body: JSON.stringify(body),
    });

    // If upstream returns error (e.g. 401 Unauthorized), pass it through directly
    // This allows OAuth challenges (WWW-Authenticate) to reach the client
    if (!response.ok) {
      const responseHeaders = new Headers();
      response.headers.forEach((value, key) => {
        if (["content-type", "www-authenticate"].includes(key.toLowerCase())) {
          responseHeaders.set(key, value);
        }
      });

      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: responseHeaders,
      });
    }

    const data: JsonRpcResponse = await response.json();

    // Intercept tool call responses and inject widget metadata
    if (isToolsCallRequest(body) && isToolsCallResponse(data)) {
      const toolName = body.params.name;
      const widgetConfig = getWidgetConfig(toolName);

      if (widgetConfig) {
        const enhancedResult = injectWidgetMeta(
          data.result as ToolsCallResult,
          widgetConfig
        );
        data.result = enhancedResult;

        console.log(
          `[MCP Proxy] Injected widget metadata for tool: ${toolName}`
        );
      }
    }

    // Construct robust headers for downstream (client)
    const responseHeaders = new Headers();
    responseHeaders.set("Content-Type", "application/json");

    return new Response(JSON.stringify(data), {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
    });
  } catch (error) {
    console.error("[MCP Proxy] Failed to forward request:", error);

    return Response.json(
      {
        jsonrpc: "2.0",
        error: {
          code: -32603,
          message: "MCP server unavailable",
        },
        id: body.id,
      },
      { status: 503 }
    );
  }
}

/**
 * Get the base URL for fetching widgets
 */
function getBaseUrl(request: NextRequest): string {
  const protocol = request.headers.get("x-forwarded-proto") || "http";
  const host = request.headers.get("host") || "localhost:3000";
  return `${protocol}://${host}`;
}
