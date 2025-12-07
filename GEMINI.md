# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

MCP GPT Proxy is a Next.js application that acts as a transparent proxy between ChatGPT and any existing MCP (Model Context Protocol) server. It enables adding rich UI widgets to MCP tool responses without modifying the original MCP server.

**Core flow:**
```
ChatGPT → MCP Proxy (this app) → Upstream MCP Server
                ↓
         Inject widget metadata
                ↓
         Serve widget HTML
```

## Development Commands

```bash
# Install dependencies
pnpm install

# Development server (runs on http://localhost:3000)
pnpm dev

# Production build
pnpm build

# Start production server
pnpm start

# Lint
pnpm lint
```

## Environment Setup

Copy `.env.example` to `.env` and configure:
- `MCP_SERVER_URL`: URL of the upstream MCP server (default: `http://localhost:3001/mcp`)

## Architecture

### 1. Proxy Route (`src/app/mcp/route.ts`)

The main proxy endpoint handles three types of requests:

- **GET requests**: Health check endpoint returning status
- **OPTIONS requests**: CORS preflight handling
- **POST requests**: MCP JSON-RPC protocol proxy with widget metadata injection

**Key proxy behavior:**
1. Receives MCP requests from ChatGPT
2. Intercepts widget resource reads (`resources/read` for `ui://widget/*` URIs) and serves them locally
3. Forwards all other requests to upstream MCP server
4. Intercepts `tools/call` responses and injects widget metadata when tool has configured widget
5. Preserves authentication headers (`Authorization`, `WWW-Authenticate`) for auth flows

### 2. Widget Configuration (`src/lib/config/proxy.config.ts`)

Central configuration file defining tool→widget mappings:

```typescript
export const config: ProxyConfig = {
  mcpServerUrl: process.env.MCP_SERVER_URL,
  widgets: [
    {
      toolName: "example_tool",        // MCP tool name to enhance
      widgetPath: "/widgets/example",  // Next.js widget route
      description: "...",              // Widget description for model
      prefersBorder: true,             // Render with border (default: true)
      invokingText: "Loading...",      // Status while running
      invokedText: "Ready",            // Status after completion
      csp: {                           // Optional CSP for external resources
        connect_domains: ["api.example.com"],
        resource_domains: ["cdn.example.com"]
      }
    }
  ]
}
```

### 3. Metadata Injection (`src/lib/proxy/inject-meta.ts`)

Transforms MCP tool responses by adding OpenAI widget metadata:
- Converts widget paths to `ui://widget/*` URIs
- Injects `openai/outputTemplate`, `openai/widgetDescription`, etc.
- Sets widget domain to `https://chatgpt.com`

### 4. Widget Server (`src/lib/proxy/widget-server.ts`)

Handles serving widget HTML for `resources/read` requests:
- Detects `ui://widget/*` URIs
- Fetches HTML from Next.js app routes (`/widgets/*`)
- Wraps HTML in proper MCP resource format with `text/html+skybridge` MIME type

### 5. Widget Components (`src/app/widgets/*/page.tsx`)

React components that render in ChatGPT. Must:
- Be client components (`"use client"`)
- Use `useWidgetProps<T>()` to access MCP tool output data
- Use `useThemeSync()` to sync with ChatGPT theme (light/dark)
- Include mock data for local preview/development

**Available hooks:**
- `useWidgetProps<T>(defaultState?)`: Get tool output from `window.openai.toolOutput`
- `useThemeSync()`: Auto-sync document theme with ChatGPT
- `useTheme()`: Read theme without auto-applying
- `useToolInput<T>()`: Get tool input arguments
- `useToolResponseMetadata<T>()`: Get tool response metadata

**Available `window.openai` API methods:**
- `callTool(name, args)`: Call MCP tools from widget
- `sendFollowUpMessage({ prompt })`: Trigger ChatGPT conversation turn
- `openExternal({ href })`: Open external links
- `requestDisplayMode({ mode })`: Request fullscreen/pip/inline mode
- `setWidgetState(state)`: Persist state with conversation

### 6. Type System

**MCP Protocol Types (`src/lib/types/mcp.ts`):**
- JSON-RPC request/response types
- MCP method constants (`tools/call`, `resources/read`, etc.)
- Tool call result structure with `_meta` field
- Type guards for request/response validation

**OpenAI Types (`src/lib/types/openai.ts`):**
- `window.openai` global API types
- Theme, display mode, user agent types
- Event types for `openai:set_globals` events

## Creating New Widgets

1. **Add widget mapping** in `src/lib/config/proxy.config.ts`:
```typescript
{
  toolName: "your_mcp_tool_name",
  widgetPath: "/widgets/your-widget",
  description: "What this widget displays",
  prefersBorder: true
}
```

2. **Create widget component** at `src/app/widgets/your-widget/page.tsx`:
```tsx
"use client";
import { useWidgetProps } from "@/app/hooks/use-widget-props";
import { useThemeSync } from "@/app/hooks/use-theme";

interface YourData {
  // Match the structure from MCP tool's structuredContent
}

const MOCK_DATA: YourData = { /* for local preview */ };

export default function YourWidget() {
  useThemeSync();
  const data = useWidgetProps<YourData>(MOCK_DATA);
  if (!data) return <div>Loading...</div>;

  return <div>{/* your UI */}</div>;
}
```

3. **Use Apps SDK UI components** from `@openai/apps-sdk-ui`:
   - Import from `@openai/apps-sdk-ui/components/*`
   - Use design system classes (`heading-lg`, `text-secondary`, `border-default`, etc.)
   - Components: Badge, Button, Icon (Calendar, Check, ExternalLink, etc.)

## MCP Tool Response Structure

MCP tools should return data in `structuredContent` for widget consumption:

```json
{
  "content": [{ "type": "text", "text": "..." }],
  "structuredContent": {
    "your": "data",
    "nested": { "objects": "supported" }
  },
  "_meta": {}  // Will be populated by proxy
}
```

The widget receives `structuredContent` via `useWidgetProps()`.

## Testing Widget Metadata Injection

Use curl to verify widget metadata is injected:

```bash
# List tools
curl -X POST http://localhost:3000/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}'

# Call tool and check for widget metadata
curl -X POST http://localhost:3000/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc":"2.0",
    "id":2,
    "method":"tools/call",
    "params":{"name":"your_tool_name","arguments":{}}
  }'
```

Response should include `_meta["openai/outputTemplate"]` with `ui://widget/*` URI.

## Demo MongoDB Implementation

The `demo-mongo/` directory contains a production-ready example with:
- MongoDB MCP server proxy configuration
- `mongo-table` widget for rendering query/aggregation results
- Mock data for local preview
- Deployment examples (ngrok, Vercel, Docker)

Refer to `demo-mongo/README.md` for MongoDB-specific setup.

## Key Implementation Details

- **Widget URIs**: Internal format is `ui://widget/widgets/name.html`, mapped from `/widgets/name`
- **MIME type**: Widgets use `text/html+skybridge` for ChatGPT compatibility
- **Theme sync**: Widgets listen to `openai:set_globals` events via `useSyncExternalStore`
- **SSR handling**: Hooks provide server snapshots for Next.js SSR (return defaults)
- **Authentication**: Proxy forwards `Authorization` headers and `WWW-Authenticate` challenges
- **Error handling**: Returns proper JSON-RPC error responses with appropriate codes

## Deployment Considerations

- Set `MCP_SERVER_URL` environment variable for upstream server
- Use ngrok for development: `ngrok http 3000` → configure ChatGPT with `https://xxx.ngrok.app/mcp`
- For production: Deploy to Vercel or containerize with Docker
- Health check available at GET `/mcp` endpoint
- CORS enabled for ChatGPT origin
