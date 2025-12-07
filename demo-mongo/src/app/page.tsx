import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen p-8 max-w-4xl mx-auto">
      <div className="space-y-8">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="heading-2xl">MCP GPT Proxy</h1>
          <p className="text-lg text-secondary">
            Add GPT Apps SDK widgets to any MCP server without modifying it.
          </p>
        </div>

        {/* Status Card */}
        <div className="rounded-xl border border-default bg-surface-secondary p-6 space-y-4">
          <h2 className="heading-md">Quick Start</h2>
          <ol className="list-decimal list-inside space-y-2 text-sm">
            <li>
              Configure your upstream MCP server URL in{" "}
              <code className="px-1.5 py-0.5 rounded bg-surface-tertiary font-mono text-xs">
                .env
              </code>
            </li>
            <li>
              Add widget mappings in{" "}
              <code className="px-1.5 py-0.5 rounded bg-surface-tertiary font-mono text-xs">
                src/lib/config/proxy.config.ts
              </code>
            </li>
            <li>
              Create widgets in{" "}
              <code className="px-1.5 py-0.5 rounded bg-surface-tertiary font-mono text-xs">
                src/app/widgets/
              </code>
            </li>
            <li>
              Point ChatGPT to{" "}
              <code className="px-1.5 py-0.5 rounded bg-surface-tertiary font-mono text-xs">
                your-proxy.com/mcp
              </code>
            </li>
          </ol>
        </div>

        {/* Architecture */}
        <div className="space-y-4">
          <h2 className="heading-md">How It Works</h2>
          <div className="rounded-xl border border-default bg-surface-secondary p-6">
            <pre className="text-xs overflow-x-auto whitespace-pre font-mono text-secondary">
              {`ChatGPT (OpenAI)
       │
       ▼
┌──────────────────────────────┐
│  MCP GPT Proxy (this app)    │
│  ┌────────────────────────┐  │
│  │ /mcp endpoint          │  │
│  │  - Forwards requests   │  │
│  │  - Injects widget meta │  │
│  │  - Serves widget HTML  │  │
│  └────────────────────────┘  │
└──────────────────────────────┘
       │
       ▼
Your Existing MCP Server`}
            </pre>
          </div>
        </div>

        {/* Widget Preview */}
        <div className="space-y-4">
          <h2 className="heading-md">Example Widget</h2>
          <p className="text-sm text-secondary">
            Preview your widgets during development:
          </p>
          <Link
            href="/widgets/example"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-background-primary-solid text-white hover:bg-background-primary-solid-hover transition-colors"
          >
            View Example Widget
            <span aria-hidden="true">→</span>
          </Link>
        </div>

        {/* Environment */}
        <div className="space-y-4">
          <h2 className="heading-md">Environment Variables</h2>
          <div className="rounded-xl border border-default bg-surface-secondary p-4">
            <pre className="text-xs font-mono text-secondary">
              {`# .env
MCP_SERVER_URL=http://localhost:3001/mcp`}
            </pre>
          </div>
        </div>

        {/* Links */}
        <div className="pt-4 border-t border-subtle">
          <p className="text-sm text-tertiary">
            Built with{" "}
            <a
              href="https://developers.openai.com/apps-sdk"
              className="text-text-info hover:underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              OpenAI Apps SDK
            </a>{" "}
            and{" "}
            <a
              href="https://openai.github.io/apps-sdk-ui/"
              className="text-text-info hover:underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              Apps SDK UI
            </a>
          </p>
        </div>
      </div>
    </main>
  );
}
