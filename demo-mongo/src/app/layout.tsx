import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MCP GPT Proxy",
  description: "Add GPT Apps SDK widgets to any MCP server",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-theme="light" suppressHydrationWarning>
      <body className="bg-surface text-default">{children}</body>
    </html>
  );
}
