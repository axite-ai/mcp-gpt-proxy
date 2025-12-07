import { NextRequest } from "next/server";
import { getMcpBase, proxyOAuthRequest } from "@/lib/proxy/oauth-proxy";

/**
 * Token endpoint forwards to upstream
 * No URL rewriting needed - returns access tokens
 */
export async function POST(request: NextRequest) {
  const target = `${getMcpBase()}/token`;

  return proxyOAuthRequest(request, target, {
    rewriteUrls: false, // Token responses don't contain URLs to rewrite
  });
}
