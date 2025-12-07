"use client";

import { useWidgetProps } from "@/app/hooks/use-widget-props";
import { useThemeSync } from "@/app/hooks/use-theme";

type Row = Record<string, string | number | boolean | null>;

type TablePayload = {
  title?: string;
  rows: Row[];
};

// Mock data so the widget renders in the browser before MCP is wired up.
const MOCK_DATA: TablePayload = {
  title: "MongoDB Aggregation (sample)",
  rows: [
    { customer: "Acme", country: "US", total: 12850, orders: 12 },
    { customer: "Globex", country: "DE", total: 9800, orders: 9 },
    { customer: "Initech", country: "US", total: 7450, orders: 6 },
  ],
};

export default function MongoTableWidget() {
  useThemeSync(); // Keep styling aligned with ChatGPT

  // Falls back to mock data for local preview.
  const data = useWidgetProps<TablePayload>(MOCK_DATA);

  if (!data?.rows?.length) {
    return <div className="p-4">No rows returned.</div>;
  }

  const columns = Object.keys(data.rows[0]);

  return (
    <div className="p-4 rounded-xl border border-default bg-surface">
      {data.title && <div className="font-semibold mb-3">{data.title}</div>}
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="text-left text-muted border-b">
            <tr>
              {columns.map((col) => (
                <th key={col} className="pr-4 py-2">
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.rows.map((row, i) => (
              <tr key={i} className="border-b last:border-b-0">
                {columns.map((col) => (
                  <td key={col} className="pr-4 py-2">
                    {String(row[col] ?? "")}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
