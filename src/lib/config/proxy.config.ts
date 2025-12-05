/**
 * Proxy Configuration
 *
 * Configure which MCP tools should have widgets attached to their responses.
 * Add your tool→widget mappings here.
 */

export interface WidgetMapping {
  /** The name of the MCP tool to enhance */
  toolName: string;

  /** Path to the widget page (e.g., "/widgets/weather") */
  widgetPath: string;

  /** Description for the model to understand the widget */
  description?: string;

  /** Whether to render the widget with a border (default: true) */
  prefersBorder?: boolean;

  /** Status text shown while the tool is running */
  invokingText?: string;

  /** Status text shown after the tool completes */
  invokedText?: string;

  /** Content Security Policy for the widget */
  csp?: {
    connect_domains?: string[];
    resource_domains?: string[];
  };
}

export interface ProxyConfig {
  /** URL of the upstream MCP server */
  mcpServerUrl: string;

  /** Widget mappings for tool responses */
  widgets: WidgetMapping[];
}

/**
 * Default proxy configuration
 *
 * Modify this to add your own widget mappings.
 */
export const config: ProxyConfig = {
  mcpServerUrl: process.env.MCP_SERVER_URL || "http://localhost:3001/mcp",

  widgets: [
    // Example: Map a weather tool to a weather widget
    // {
    //   toolName: "get_weather",
    //   widgetPath: "/widgets/weather",
    //   description: "Displays weather information with icons and forecast",
    //   prefersBorder: true,
    //   invokingText: "Fetching weather...",
    //   invokedText: "Weather loaded",
    // },

    // Example: Map a database query tool to a data table widget
    // {
    //   toolName: "query_database",
    //   widgetPath: "/widgets/data-table",
    //   description: "Shows query results in an interactive table",
    // },

    // Add your widget mappings here:
    {
      toolName: "example_tool",
      widgetPath: "/widgets/example",
      description: "Example widget demonstrating data binding",
      prefersBorder: true,
      invokingText: "Loading...",
      invokedText: "Ready",
    },
  ],
};

/**
 * Get widget configuration for a tool
 */
export function getWidgetConfig(toolName: string): WidgetMapping | undefined {
  return config.widgets.find((w) => w.toolName === toolName);
}

/**
 * Check if a tool has a widget configured
 */
export function hasWidgetConfig(toolName: string): boolean {
  return config.widgets.some((w) => w.toolName === toolName);
}

/**
 * Get all widget paths (for resource registration)
 */
export function getAllWidgetPaths(): string[] {
  return config.widgets.map((w) => w.widgetPath);
}
