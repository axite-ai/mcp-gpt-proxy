import { NextRequest } from "next/server";
import { getMcpBase, withSearch, proxyOAuthRequest } from "@/lib/proxy/oauth-proxy";

/**
 * Authorization endpoint forwards to upstream
 * No URL rewriting needed - this is a redirect endpoint
 */
export async function GET(request: NextRequest) {
  const target = withSearch(`${getMcpBase()}/authorize`, request.nextUrl.search);

  return proxyOAuthRequest(request, target, {
    rewriteUrls: false, // Don't rewrite - this handles redirects
  });
}

export async function POST(request: NextRequest) {
  const target = `${getMcpBase()}/authorize`;

  return proxyOAuthRequest(request, target, {
    rewriteUrls: false,
  });
}
