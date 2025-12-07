/**
 * MCP Protocol Types
 *
 * Types for the Model Context Protocol (MCP) JSON-RPC messages.
 * These types are used by the proxy to intercept and modify MCP traffic.
 */

// JSON-RPC 2.0 Base Types
export interface JsonRpcRequest {
  jsonrpc: "2.0";
  id: string | number;
  method: string;
  params?: Record<string, unknown>;
}

export interface JsonRpcResponse {
  jsonrpc: "2.0";
  id: string | number | null;
  result?: unknown;
  error?: JsonRpcError;
}

export interface JsonRpcError {
  code: number;
  message: string;
  data?: unknown;
}

// MCP Method Names
export const MCP_METHODS = {
  INITIALIZE: "initialize",
  TOOLS_LIST: "tools/list",
  TOOLS_CALL: "tools/call",
  RESOURCES_LIST: "resources/list",
  RESOURCES_READ: "resources/read",
  PING: "ping",
} as const;

export type McpMethod = (typeof MCP_METHODS)[keyof typeof MCP_METHODS];

// Tools/Call Request
export interface ToolsCallRequest extends JsonRpcRequest {
  method: "tools/call";
  params: {
    name: string;
    arguments?: Record<string, unknown>;
    _meta?: Record<string, unknown>;
  };
}

// Tools/Call Response
export interface ToolsCallResult {
  content: McpContent[];
  structuredContent?: Record<string, unknown>;
  isError?: boolean;
  _meta?: McpResponseMeta;
}

export interface McpContent {
  type: "text" | "image" | "resource";
  text?: string;
  data?: string;
  mimeType?: string;
  uri?: string;
}

export interface McpResponseMeta {
  "openai/outputTemplate"?: string;
  "openai/widgetDescription"?: string;
  "openai/widgetPrefersBorder"?: boolean;
  "openai/widgetDomain"?: string;
  "openai/widgetCSP"?: {
    connect_domains?: string[];
    resource_domains?: string[];
  };
  "openai/toolInvocation/invoking"?: string;
  "openai/toolInvocation/invoked"?: string;
  "openai/locale"?: string;
  [key: string]: unknown;
}

// Resources/Read Request
export interface ResourcesReadRequest extends JsonRpcRequest {
  method: "resources/read";
  params: {
    uri: string;
  };
}

// Resources/Read Response
export interface ResourcesReadResult {
  contents: ResourceContent[];
}

export interface ResourceContent {
  uri: string;
  mimeType: string;
  text?: string;
  blob?: string;
  _meta?: McpResponseMeta;
}

// Type Guards
export function isToolsCallRequest(
  request: JsonRpcRequest
): request is ToolsCallRequest {
  return request.method === MCP_METHODS.TOOLS_CALL;
}

export function isResourcesReadRequest(
  request: JsonRpcRequest
): request is ResourcesReadRequest {
  return request.method === MCP_METHODS.RESOURCES_READ;
}

export function isToolsCallResponse(
  response: JsonRpcResponse
): response is JsonRpcResponse & { result: ToolsCallResult } {
  return (
    response.result !== undefined &&
    typeof response.result === "object" &&
    response.result !== null &&
    "content" in response.result
  );
}
