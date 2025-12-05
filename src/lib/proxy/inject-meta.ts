/**
 * Metadata Injection
 *
 * Functions for injecting OpenAI widget metadata into MCP responses.
 */

import type { ToolsCallResult, McpResponseMeta } from "@/lib/types/mcp";
import type { WidgetMapping } from "@/lib/config/proxy.config";

/**
 * Convert a widget path to a widget URI
 * e.g., "/widgets/weather" -> "ui://widget/widgets/weather.html"
 */
export function toWidgetUri(widgetPath: string): string {
  // Remove leading slash if present for the URI
  const path = widgetPath.startsWith("/") ? widgetPath.slice(1) : widgetPath;
  return `ui://widget/${path}.html`;
}

/**
 * Inject widget metadata into a tool response
 */
export function injectWidgetMeta(
  result: ToolsCallResult,
  widgetConfig: WidgetMapping
): ToolsCallResult {
  const meta: McpResponseMeta = {
    ...result._meta,
    "openai/outputTemplate": toWidgetUri(widgetConfig.widgetPath),
  };

  // Add optional metadata if provided
  if (widgetConfig.description) {
    meta["openai/widgetDescription"] = widgetConfig.description;
  }

  if (widgetConfig.prefersBorder !== undefined) {
    meta["openai/widgetPrefersBorder"] = widgetConfig.prefersBorder;
  } else {
    // Default to true
    meta["openai/widgetPrefersBorder"] = true;
  }

  if (widgetConfig.invokingText) {
    meta["openai/toolInvocation/invoking"] = widgetConfig.invokingText;
  }

  if (widgetConfig.invokedText) {
    meta["openai/toolInvocation/invoked"] = widgetConfig.invokedText;
  }

  if (widgetConfig.csp) {
    meta["openai/widgetCSP"] = widgetConfig.csp;
  }

  // Set the widget domain to ChatGPT
  meta["openai/widgetDomain"] = "https://chatgpt.com";

  return {
    ...result,
    _meta: meta,
  };
}
