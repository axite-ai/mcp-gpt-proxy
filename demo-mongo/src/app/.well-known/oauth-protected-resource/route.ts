import { NextRequest } from "next/server";
import {
  getMcpBase,
  getProxyBase,
  withSearch,
  proxyOAuthRequest,
} from "@/lib/proxy/oauth-proxy";

export async function GET(request: NextRequest) {
  const target = withSearch(
    `${getMcpBase()}/.well-known/oauth-protected-resource`,
    request.nextUrl.search
  );

  return proxyOAuthRequest(request, target, {
    rewriteUrls: true,
    upstreamBase: getMcpBase(),
    proxyBase: getProxyBase(request),
  });
}

export async function HEAD(request: NextRequest) {
  return GET(request);
}
