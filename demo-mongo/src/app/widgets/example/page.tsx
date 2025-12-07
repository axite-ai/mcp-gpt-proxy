"use client";

/**
 * Example Widget
 *
 * Demonstrates how to build a widget using @openai/apps-sdk-ui components.
 * This widget shows:
 * - Reading tool output with useWidgetProps
 * - Theme synchronization with useThemeSync
 * - Using Apps SDK UI components (Badge, Button, Icons)
 */

import { useWidgetProps } from "@/app/hooks/use-widget-props";
import { useThemeSync } from "@/app/hooks/use-theme";
import { Badge } from "@openai/apps-sdk-ui/components/Badge";
import { Button } from "@openai/apps-sdk-ui/components/Button";
import {
  Calendar,
  ExternalLink,
  Check,
} from "@openai/apps-sdk-ui/components/Icon";

/**
 * Example data structure from the MCP tool
 */
interface ExampleData {
  title: string;
  status: "confirmed" | "pending" | "cancelled";
  items: Array<{
    id: string;
    name: string;
    date: string;
    completed?: boolean;
  }>;
}

/**
 * Mock data for development/preview
 */
const MOCK_DATA: ExampleData = {
  title: "My Tasks",
  status: "confirmed",
  items: [
    { id: "1", name: "Review PR #42", date: "Dec 5", completed: true },
    { id: "2", name: "Deploy to staging", date: "Dec 6", completed: false },
    { id: "3", name: "Write documentation", date: "Dec 7", completed: false },
  ],
};

export default function ExampleWidget() {
  // Sync theme with ChatGPT (light/dark mode)
  useThemeSync();

  // Get tool output data (falls back to mock data in development)
  const data = useWidgetProps<ExampleData>(MOCK_DATA);

  if (!data) {
    return (
      <div className="p-4 text-secondary text-center">No data available</div>
    );
  }

  const statusColor =
    data.status === "confirmed"
      ? "success"
      : data.status === "pending"
        ? "warning"
        : "danger";

  return (
    <div className="w-full rounded-2xl border border-default bg-surface shadow-lg p-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <h2 className="heading-lg">{data.title}</h2>
        <Badge color={statusColor}>{data.status}</Badge>
      </div>

      {/* Items List */}
      <ul className="mt-4 space-y-2">
        {data.items.map((item) => (
          <li
            key={item.id}
            className="flex items-center gap-3 p-2 rounded-lg hover:bg-surface-secondary transition-colors"
          >
            <div
              className={`flex-shrink-0 size-5 rounded-full border-2 flex items-center justify-center ${
                item.completed
                  ? "bg-background-success-solid border-transparent"
                  : "border-border-strong"
              }`}
            >
              {item.completed && <Check className="size-3 text-white" />}
            </div>
            <span
              className={`flex-1 ${item.completed ? "line-through text-tertiary" : ""}`}
            >
              {item.name}
            </span>
            <div className="flex items-center gap-1 text-xs text-secondary">
              <Calendar className="size-3" />
              <span>{item.date}</span>
            </div>
          </li>
        ))}
      </ul>

      {/* Footer */}
      <div className="mt-4 pt-4 border-t border-subtle">
        <Button
          color="primary"
          block
          onClick={() => {
            // Example: Use window.openai.callTool to interact with MCP
            window.openai?.sendFollowUpMessage({
              prompt: "Show me more details about these tasks",
            });
          }}
        >
          <ExternalLink /> View Details
        </Button>
      </div>
    </div>
  );
}
