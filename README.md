# MCP GPT Proxy

Add GPT Apps SDK widgets to **any** MCP server without modifying it.

## Why This Template?

If you have an existing MCP server (or are using a third-party one like the SQLite or Postgres MCP servers), and want to add rich UI widgets to tool responses in ChatGPT, this proxy lets you do that without touching the original server.

**How it works:**

```
ChatGPT (OpenAI)
       │
       ▼
┌──────────────────────────────┐
│  MCP GPT Proxy (this app)    │
│  - Forwards MCP requests     │
│  - Injects widget metadata   │
│  - Serves widget HTML        │
└──────────────────────────────┘
       │
       ▼
Your Existing MCP Server
```

## Quick Start

### 1. Clone and Install

```bash
git clone https://github.com/your-org/mcp-gpt-proxy.git
cd mcp-gpt-proxy
pnpm install
```

### 2. Configure Environment

```bash
cp .env.example .env
```

Edit `.env` to point to your upstream MCP server:

```env
MCP_SERVER_URL=http://localhost:3001/mcp
```

### 3. Add Widget Mappings

Edit `src/lib/config/proxy.config.ts` to map tools to widgets:

```typescript
export const config: ProxyConfig = {
  mcpServerUrl: process.env.MCP_SERVER_URL || "http://localhost:3001/mcp",

  widgets: [
    {
      toolName: "get_weather",
      widgetPath: "/widgets/weather",
      description: "Displays weather information",
      prefersBorder: true,
    },
    {
      toolName: "query_database",
      widgetPath: "/widgets/data-table",
      description: "Shows query results in a table",
    },
  ],
};
```

### 4. Create Widgets

Create a new widget in `src/app/widgets/[name]/page.tsx`:

```tsx
"use client";

import { useWidgetProps } from "@/app/hooks/use-widget-props";
import { useThemeSync } from "@/app/hooks/use-theme";
import { Badge } from "@openai/apps-sdk-ui/components/Badge";
import { Button } from "@openai/apps-sdk-ui/components/Button";

interface MyData {
  title: string;
  items: string[];
}

export default function MyWidget() {
  useThemeSync(); // Sync with ChatGPT theme
  const data = useWidgetProps<MyData>();

  if (!data) return <div>Loading...</div>;

  return (
    <div className="p-4 rounded-xl border border-default bg-surface">
      <h2 className="heading-lg">{data.title}</h2>
      <ul className="mt-4 space-y-2">
        {data.items.map((item, i) => (
          <li key={i}>{item}</li>
        ))}
      </ul>
    </div>
  );
}
```

### 5. Run the Proxy

```bash
pnpm dev
```

The proxy runs on `http://localhost:3000`. Point ChatGPT to `http://localhost:3000/mcp` (or use ngrok for external access).

## Available Hooks

### `useWidgetProps<T>()`

Get tool output data from the ChatGPT context:

```tsx
const data = useWidgetProps<WeatherData>();
```

### `useThemeSync()`

Sync widget theme with ChatGPT (light/dark mode):

```tsx
useThemeSync(); // Automatically applies theme to document
```

### `useTheme()`

Read theme without auto-applying:

```tsx
const theme = useTheme(); // "light" or "dark"
```

## Widget Configuration Options

| Option          | Type     | Description                                |
| --------------- | -------- | ------------------------------------------ |
| `toolName`      | string   | MCP tool name to enhance                   |
| `widgetPath`    | string   | Path to widget (e.g., "/widgets/weather")  |
| `description`   | string?  | Widget description for the model           |
| `prefersBorder` | boolean? | Render with border (default: true)         |
| `invokingText`  | string?  | Status text while tool runs                |
| `invokedText`   | string?  | Status text after tool completes           |
| `csp`           | object?  | Content Security Policy for external fetch |

## Using Apps SDK UI Components

This template includes [@openai/apps-sdk-ui](https://openai.github.io/apps-sdk-ui/) for building widgets. Available components:

- `Badge` - Status indicators
- `Button` - Interactive buttons
- `Icon` - Icon library (Calendar, Checkmark, etc.)
- And more...

```tsx
import { Badge } from "@openai/apps-sdk-ui/components/Badge";
import { Button } from "@openai/apps-sdk-ui/components/Button";
import { Calendar } from "@openai/apps-sdk-ui/components/Icon";
```

## Deployment

### Vercel

```bash
vercel
```

### Docker

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY . .
RUN pnpm install --frozen-lockfile
RUN pnpm build
CMD ["pnpm", "start"]
```

### ngrok (Development)

```bash
ngrok http 3000
# Use the ngrok URL in ChatGPT: https://xxx.ngrok.app/mcp
```

## Project Structure

```
src/
├── app/
│   ├── mcp/
│   │   └── route.ts          # Proxy endpoint
│   ├── widgets/
│   │   └── example/
│   │       └── page.tsx      # Example widget
│   ├── hooks/
│   │   ├── use-widget-props.ts
│   │   └── use-theme.ts
│   ├── layout.tsx
│   └── page.tsx              # Landing page
├── lib/
│   ├── config/
│   │   └── proxy.config.ts   # Widget mappings
│   ├── proxy/
│   │   ├── inject-meta.ts    # Metadata injection
│   │   └── widget-server.ts  # Widget serving
│   └── types/
│       ├── mcp.ts            # MCP protocol types
│       └── openai.ts         # window.openai types
```

## Related Projects

- [axite-mcp-template](https://github.com/axite-ai/apps-sdk-template) - Full MCP server + widgets template (for building from scratch)
- [OpenAI Apps SDK](https://developers.openai.com/apps-sdk) - Official documentation
- [Apps SDK UI](https://openai.github.io/apps-sdk-ui/) - Component library

## License

MIT
