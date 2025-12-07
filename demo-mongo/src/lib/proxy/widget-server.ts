/**
 * Widget Server
 *
 * Handles serving widget HTML for MCP resources/read requests.
 */

import type { ResourceContent, McpResponseMeta } from "@/lib/types/mcp";
import { getWidgetConfig, getAllWidgetPaths } from "@/lib/config/proxy.config";

/**
 * Check if a URI is a widget resource that we should handle
 */
export function isWidgetUri(uri: string): boolean {
  return uri.startsWith("ui://widget/");
}

/**
 * Extract the widget path from a widget URI
 * e.g., "ui://widget/widgets/weather.html" -> "/widgets/weather"
 */
export function extractWidgetPath(uri: string): string {
  const path = uri.replace("ui://widget/", "").replace(".html", "");
  return `/${path}`;
}

/**
 * Fetch widget HTML from the Next.js app
 */
export async function fetchWidgetHtml(
  widgetPath: string,
  baseUrl: string = "http://localhost:3000"
): Promise<string> {
  const url = `${baseUrl}${widgetPath}`;

  try {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(
        `Failed to fetch widget: ${response.status} ${response.statusText}`
      );
    }

    return await response.text();
  } catch (error) {
    console.error(`[Widget Server] Failed to fetch widget from ${url}:`, error);
    throw error;
  }
}

/**
 * Create a resource content response for a widget
 */
export function createWidgetResourceContent(
  uri: string,
  html: string,
  widgetPath: string
): ResourceContent {
  // Try to find widget config for additional metadata
  const config = getWidgetConfigByPath(widgetPath);

  const meta: McpResponseMeta = {
    "openai/widgetPrefersBorder": config?.prefersBorder ?? true,
    "openai/widgetDomain": "https://chatgpt.com",
  };

  if (config?.description) {
    meta["openai/widgetDescription"] = config.description;
  }

  if (config?.csp) {
    meta["openai/widgetCSP"] = config.csp;
  }

  return {
    uri,
    mimeType: "text/html+skybridge",
    text: html,
    _meta: meta,
  };
}

/**
 * Get widget config by path (reverse lookup)
 */
function getWidgetConfigByPath(widgetPath: string) {
  const allPaths = getAllWidgetPaths();
  const normalizedPath = widgetPath.startsWith("/")
    ? widgetPath
    : `/${widgetPath}`;

  // Find the toolName for this path
  const { config } = require("@/lib/config/proxy.config");
  return config.widgets.find(
    (w: { widgetPath: string }) => w.widgetPath === normalizedPath
  );
}

/**
 * Handle a widget resource read request
 * Returns null if the URI is not a widget we handle
 */
export async function handleWidgetResourceRead(
  uri: string,
  baseUrl?: string
): Promise<ResourceContent | null> {
  if (!isWidgetUri(uri)) {
    return null;
  }

  const widgetPath = extractWidgetPath(uri);

  try {
    const html = await fetchWidgetHtml(widgetPath, baseUrl);
    return createWidgetResourceContent(uri, html, widgetPath);
  } catch (error) {
    console.error(`[Widget Server] Failed to serve widget ${uri}:`, error);
    return null;
  }
}
