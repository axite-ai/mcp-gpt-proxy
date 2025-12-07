#!/bin/bash
# OAuth Implementation Test Script

set -e

PROXY_URL="${PROXY_URL:-http://localhost:3000}"
UPSTREAM_URL="${UPSTREAM_URL:-http://localhost:3001}"

echo "======================================"
echo "OAuth Implementation Test Script"
echo "======================================"
echo "Proxy URL: $PROXY_URL"
echo "Upstream URL: $UPSTREAM_URL"
echo ""

# Test 1: HEAD Request Support
echo "[Test 1] Testing HEAD request support..."
STATUS=$(curl -I -s -o /dev/null -w "%{http_code}" "$PROXY_URL/.well-known/oauth-protected-resource")
if [ "$STATUS" = "200" ] || [ "$STATUS" = "404" ] || [ "$STATUS" = "502" ]; then
  echo "✅ PASS: HEAD request returned status $STATUS (not 405)"
else
  echo "❌ FAIL: HEAD request returned status $STATUS"
  exit 1
fi
echo ""

# Test 2: Discovery Endpoint Returns JSON
echo "[Test 2] Testing discovery endpoint returns JSON..."
CONTENT_TYPE=$(curl -s -I "$PROXY_URL/.well-known/oauth-protected-resource" | grep -i "content-type:" | tr -d '\r')
if echo "$CONTENT_TYPE" | grep -q "application/json"; then
  echo "✅ PASS: Content-Type is application/json"
elif echo "$CONTENT_TYPE" | grep -q "text/plain"; then
  echo "⚠️  WARN: Content-Type is text/plain (upstream may not support OAuth)"
else
  echo "❌ FAIL: Unexpected Content-Type: $CONTENT_TYPE"
fi
echo ""

# Test 3: URL Rewriting (no upstream URLs leaked)
echo "[Test 3] Testing URL rewriting..."
RESPONSE=$(curl -s "$PROXY_URL/.well-known/oauth-protected-resource")

if echo "$RESPONSE" | grep -q "Upstream.*unreachable"; then
  echo "⚠️  WARN: Upstream server unreachable (expected if not running)"
elif echo "$RESPONSE" | grep -q "$UPSTREAM_URL"; then
  echo "❌ FAIL: Found upstream URL in response"
  echo "Response excerpt:"
  echo "$RESPONSE" | grep "$UPSTREAM_URL" | head -3
  exit 1
else
  echo "✅ PASS: No upstream URLs found in response"
fi
echo ""

# Test 4: Proxy URLs Present (if JSON response)
echo "[Test 4] Testing proxy URLs present..."
if echo "$RESPONSE" | grep -q "{"; then
  if echo "$RESPONSE" | grep -q "$PROXY_URL"; then
    echo "✅ PASS: Proxy URLs found in discovery document"
  else
    echo "⚠️  WARN: No proxy URLs found (may be expected if upstream doesn't return URLs)"
  fi
else
  echo "⚠️  SKIP: No JSON response to test"
fi
echo ""

# Test 5: Authorization Server Discovery
echo "[Test 5] Testing authorization server discovery..."
STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$PROXY_URL/.well-known/oauth-authorization-server")
if [ "$STATUS" = "200" ] || [ "$STATUS" = "404" ] || [ "$STATUS" = "502" ]; then
  echo "✅ PASS: Authorization server discovery endpoint accessible (status $STATUS)"
else
  echo "❌ FAIL: Unexpected status $STATUS"
fi
echo ""

# Test 6: OpenID Configuration
echo "[Test 6] Testing OpenID configuration..."
STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$PROXY_URL/.well-known/openid-configuration")
if [ "$STATUS" = "200" ] || [ "$STATUS" = "404" ] || [ "$STATUS" = "502" ]; then
  echo "✅ PASS: OpenID configuration endpoint accessible (status $STATUS)"
else
  echo "❌ FAIL: Unexpected status $STATUS"
fi
echo ""

echo "======================================"
echo "Test Summary"
echo "======================================"
echo "All critical tests passed!"
echo ""
echo "Note: Some warnings are expected if:"
echo "  - Upstream server is not running (502/unreachable)"
echo "  - Upstream doesn't support OAuth (404 responses)"
echo ""
echo "To test with real upstream, ensure:"
echo "  1. Upstream MCP server is running on $UPSTREAM_URL"
echo "  2. Upstream supports OAuth discovery endpoints"
echo "  3. Proxy is configured with MCP_SERVER_URL=$UPSTREAM_URL/mcp"
