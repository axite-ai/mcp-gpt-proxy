import { NextRequest } from "next/server";
import { getMcpBase, proxyRequest, withSearch } from "@/lib/proxy/oauth-proxy";

export async function GET(request: NextRequest) {
  const target = withSearch(
    `${getMcpBase()}/.well-known/oauth-protected-resource/mcp`,
    request.nextUrl.search
  );
  return proxyRequest(request, target);
}

export async function HEAD(request: NextRequest) {
  return GET(request);
}
