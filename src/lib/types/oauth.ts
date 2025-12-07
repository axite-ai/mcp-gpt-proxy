/**
 * OAuth Discovery Document Types
 * Based on RFC 8414 (Authorization Server Metadata)
 * and RFC 9728 (OAuth 2.0 Protected Resource Metadata)
 */

// Protected Resource Metadata (RFC 9728)
export interface OAuthProtectedResourceMetadata {
  resource: string;
  authorization_servers?: string[];
  bearer_methods_supported?: string[];
  resource_signing_alg_values_supported?: string[];
  resource_documentation?: string;
  [key: string]: unknown;
}

// Authorization Server Metadata (RFC 8414)
export interface OAuthAuthorizationServerMetadata {
  issuer: string;
  authorization_endpoint?: string;
  token_endpoint?: string;
  jwks_uri?: string;
  registration_endpoint?: string;
  scopes_supported?: string[];
  response_types_supported?: string[];
  response_modes_supported?: string[];
  grant_types_supported?: string[];
  token_endpoint_auth_methods_supported?: string[];
  revocation_endpoint?: string;
  introspection_endpoint?: string;
  code_challenge_methods_supported?: string[];
  [key: string]: unknown; // Additional endpoints
}

// Type guard for Protected Resource Metadata
export function isProtectedResourceMetadata(
  obj: unknown
): obj is OAuthProtectedResourceMetadata {
  return (
    typeof obj === "object" &&
    obj !== null &&
    "resource" in obj &&
    typeof (obj as { resource: unknown }).resource === "string"
  );
}

// Type guard for Authorization Server Metadata
export function isAuthorizationServerMetadata(
  obj: unknown
): obj is OAuthAuthorizationServerMetadata {
  return (
    typeof obj === "object" &&
    obj !== null &&
    "issuer" in obj &&
    typeof (obj as { issuer: unknown }).issuer === "string"
  );
}
