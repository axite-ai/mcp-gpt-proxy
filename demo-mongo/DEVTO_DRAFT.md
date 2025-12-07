# Building a Production-Ready MongoDB MCP GPT App in 15 Minutes

This tutorial uses the `demo-mongo` copy of the MCP GPT Proxy to connect ChatGPT to a MongoDB MCP server and render results with a data-table widget. Everything is scoped to the `demo-mongo/` directory so the base template stays clean. Use this as your publish-ready draft (aim ~1,500 words); swap your own screenshots where noted.

---

## What we’ll build (with time estimates)
- Proxy MCP endpoint that injects widget metadata (2–3 min)
- Map the Mongo tool to the widget (1–2 min)
- Build/preview the `mongo-table` widget (5–7 min)
- Run locally and verify with curl + ChatGPT (4–5 min)
- Optional deploy (Vercel, Docker, or ngrok) (3–5 min)

Total: ~15–20 minutes.

## Prerequisites
- Node 20+, PNPM
- MongoDB MCP server (assume `http://localhost:3001/mcp`; change if needed)
- ChatGPT MCP access

---

## 1) Clone the demo and install (2–3 min)

```bash
cd demo-mongo
pnpm install
```

Why this repo? It’s a copy of the MCP GPT Proxy but already set up for MongoDB with a data-table widget and mock data so you can screenshot the UI even before MCP is connected.

Repo layout:
```
src/
├─ app/
│  ├─ mcp/route.ts          # MCP proxy endpoint
│  ├─ widgets/mongo-table/  # Mongo data-table widget
│  ├─ widgets/example/      # Reference widget
│  └─ hooks/                # useWidgetProps, theme helpers
└─ lib/
   ├─ config/proxy.config.ts # Tool→widget mapping
   └─ proxy/                 # Metadata injection + widget server
```

---

## 2) Point the proxy at your Mongo MCP server (1–2 min)

```bash
cp .env.example .env
```
Set the upstream:
```env
MCP_SERVER_URL=http://localhost:3001/mcp
```
Swap in any other URL if your Mongo MCP server is remote. The proxy simply forwards and injects metadata; you don’t touch the MCP server code.

---

## 3) Map the Mongo tool to the widget (1–2 min)

File: `src/lib/config/proxy.config.ts`
```ts
{
  toolName: "mongo_query",          // change if your tool is run_query/aggregate/etc.
  widgetPath: "/widgets/mongo-table",
  description: "Renders MongoDB query or aggregation results in a table",
  prefersBorder: true,
  invokingText: "Running MongoDB query…",
  invokedText: "MongoDB results ready",
}
```
Make sure `toolName` matches exactly what `tools/list` returns from your Mongo MCP server.

---

## 4) How the proxy wires in the widget (1 min)

```
ChatGPT → http://localhost:3000/mcp → Mongo MCP server
              │
              └─ injects openai/outputTemplate = ui://widget/widgets/mongo-table.html
```

When your tool returns, the proxy appends widget metadata so ChatGPT renders the `mongo-table` widget instead of plain text.

---

## 5) Build + preview the `mongo-table` widget (5–7 min)

File: `src/app/widgets/mongo-table/page.tsx`

Key pieces:
- `useWidgetProps` reads tool output; accepts mock payload for local preview.
- `useThemeSync` keeps light/dark mode aligned with ChatGPT.
- Renders any flat object rows; keys become columns automatically.

Snippet:
```tsx
const MOCK_DATA = {
  title: "MongoDB Aggregation (sample)",
  rows: [
    { customer: "Acme", country: "US", total: 12850, orders: 12 },
    { customer: "Globex", country: "DE", total: 9800, orders: 9 },
  ],
};

export default function MongoTableWidget() {
  useThemeSync();
  const data = useWidgetProps<TablePayload>(MOCK_DATA);
  ...
}
```

**Screenshot cue #1:** run `pnpm dev`, open `http://localhost:3000/widgets/mongo-table`, and capture the mock render. Works before connecting to Mongo.

---

## 6) Run locally (2–3 min)

```bash
pnpm dev
# Next.js on http://localhost:3000
# MCP endpoint at http://localhost:3000/mcp
```

Start your Mongo MCP server separately at the URL you set in `.env`.

---

## 7) Verify with curl (3 min)

List tools (confirm the tool name):
```bash
curl -X POST http://localhost:3000/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}'
```

Call the Mongo tool (adjust `name`/`arguments` to your server):
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

The response should include `_meta.openai/outputTemplate` pointing to `ui://widget/widgets/mongo-table.html`, proving widget injection.

---

## 8) Connect in ChatGPT (2–3 min)

1) Create a Custom GPT.  
2) Add MCP server: `http://localhost:3000/mcp` (or your ngrok/Vercel URL).  
3) Call the Mongo tool; the table widget renders inline.

**Screenshot cue #2:** capture the widget rendering inside ChatGPT with real Mongo data.

---

## 9) Shape your Mongo tool output for the widget (2 min)

The widget renders any array of flat objects. A good response shape:
```json
{
  "content": [],
  "structuredContent": {
    "title": "Top Customers",
    "rows": [
      { "customer": "Acme", "orders": 12, "total": 12850 },
      { "customer": "Globex", "orders": 9, "total": 9800 }
    ]
  }
}
```
If your MCP server returns nested objects, flatten before returning to keep columns readable.

---

## 10) Deployment options (3–5 min)

- **ngrok (dev sharing)**
  ```bash
  ngrok http 3000
  # use the https URL in ChatGPT
  ```
- **Vercel**
  ```bash
  pnpm build
  vercel
  # set MCP_SERVER_URL in Vercel env vars
  ```
- **Docker**
  ```bash
  docker build -t mcp-gpt-proxy .
  docker run -p 3000:3000 \
    -e MCP_SERVER_URL=http://host.docker.internal:3001/mcp \
    mcp-gpt-proxy
  ```

---

## 11) Troubleshooting (1–2 min)

- Widget doesn’t render: ensure `toolName` matches exactly; reload the Custom GPT.
- Empty table: ensure your tool returns `structuredContent.rows` as an array of flat objects.
- Theme mismatch: verify `useThemeSync()` is called in the widget.
- External fetches: add `csp` in `proxy.config.ts` if your widget hits outside domains.

---

## 12) What to screenshot/share
- Local mock preview: `http://localhost:3000/widgets/mongo-table`
- Proxy proof: `curl tools/call` showing `openai/outputTemplate`
- In-ChatGPT render: Mongo tool output in the table widget

---

## Wrap-up

In ~15 minutes you can turn a MongoDB MCP server into a polished GPT app: proxy, widget metadata injection, and a reusable data-table widget that feels native in ChatGPT. Swap in your tool names, tweak the columns you send, and keep layering widgets as your MCP surface grows. The `demo-mongo` repo is isolated from the base template—point it at your Mongo MCP URL and hit run.
