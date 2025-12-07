# MCP GPT Proxy — MongoDB Demo

This copy is scoped for a MongoDB MCP server so you can prove the widget flow end-to-end and take screenshots without touching the base template.

## What’s included
- `/mcp` proxy route forwarding to your MongoDB MCP server and injecting widget metadata.
- `mongo-table` widget that renders query/aggregation results (ships with mock data for local preview).
- Ready-to-run steps for ChatGPT MCP + curl checks + deploy options.

## Prerequisites
- Node 20+, PNPM
- MongoDB MCP server running locally or remotely (default assumes `http://localhost:3001/mcp`)
- ChatGPT MCP access

## Quick start
```bash
pnpm install
cp .env.example .env
```
Set your upstream MCP URL (default for local Mongo MCP):
```env
MCP_SERVER_URL=http://localhost:3001/mcp
```

Run the proxy:
```bash
pnpm dev
# App: http://localhost:3000
# MCP endpoint: http://localhost:3000/mcp
```

## Map the Mongo tool to the widget
File: `src/lib/config/proxy.config.ts`
```ts
{
  toolName: "mongo_query",          // update if your tool is named run_query/aggregate/etc.
  widgetPath: "/widgets/mongo-table",
  description: "Renders MongoDB query or aggregation results in a table",
  prefersBorder: true,
  invokingText: "Running MongoDB query…",
  invokedText: "MongoDB results ready",
}
```

## Widget: `mongo-table`
File: `src/app/widgets/mongo-table/page.tsx`
- Uses `useWidgetProps` to read MCP tool output.
- Includes `MOCK_DATA` so it renders in the browser before MCP is wired (for screenshots).
- Renders any array of flat objects; keys become columns.

Preview locally (mock data):
```
http://localhost:3000/widgets/mongo-table
```

Expected MCP payload shape (example):
```json
{
  "content": [],
  "structuredContent": {
    "title": "MongoDB Aggregation",
    "rows": [
      { "customer": "Acme", "country": "US", "total": 12850, "orders": 12 },
      { "customer": "Globex", "country": "DE", "total": 9800, "orders": 9 }
    ]
  }
}
```

## Prove it with curl
List tools (confirm tool name):
```bash
curl -X POST http://localhost:3000/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}'
```

Call the Mongo tool (adjust name/args for your server):
```bash
curl -X POST http://localhost:3000/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc":"2.0",
    "id":2,
    "method":"tools/call",
    "params":{
      "name":"mongo_query",
      "arguments":{"collection":"orders","pipeline":[]}
    }
  }'
```
The response should include `_meta.openai/outputTemplate = "ui://widget/widgets/mongo-table.html"`, proving widget injection.

## Connect in ChatGPT
- Add MCP server: `http://localhost:3000/mcp` (or your ngrok/Vercel URL).
- Call the Mongo tool; the `mongo-table` widget renders the results inline.

## Deploy options
- **ngrok:** `ngrok http 3000` → use the https URL in ChatGPT.
- **Vercel:** `pnpm build && vercel` (set `MCP_SERVER_URL` env var).
- **Docker:** build with the included Dockerfile; set `MCP_SERVER_URL` when running.

## OAuth Support

This demo includes full OAuth 2.0 support for protected MongoDB MCP servers (e.g., MongoDB Atlas with OAuth enabled).

### Configuration

Set `MCP_SERVER_URL` to your OAuth-protected MongoDB MCP endpoint:

```env
MCP_SERVER_URL=https://data.mongodb-api.com/app/<app-id>/endpoint/data/v1/mcp
```

The proxy will automatically:
1. Proxy OAuth discovery endpoints from root level (`/.well-known/*`)
2. Rewrite upstream URLs to point back to the proxy
3. Forward authorization and token requests
4. Convert HEAD requests to GET for upstream compatibility

### Removed Deprecated Endpoints

Previous versions had OAuth endpoints at both root and `/mcp/` levels. Per the [MCP Authorization specification](https://modelcontextprotocol.io/specification/draft/basic/authorization), OAuth discovery **MUST** be at root level. The nested `/mcp/.well-known/*` endpoints have been removed.

### Testing OAuth

```bash
# Test OAuth discovery endpoint
curl -i http://localhost:3000/.well-known/oauth-protected-resource

# Verify URL rewriting (should show localhost:3000, not upstream URL)
curl -s http://localhost:3000/.well-known/oauth-protected-resource | jq .

# Test HEAD request support
curl -I http://localhost:3000/.well-known/oauth-protected-resource
```

For more details, see the [OAuth Support section](../CLAUDE.md#oauth-support) in the main CLAUDE.md.

## Screenshot cues
- Mock preview: `http://localhost:3000/widgets/mongo-table`
- Proof of injection: curl output showing `openai/outputTemplate`
- In-ChatGPT render: call the Mongo tool and capture the widget output
