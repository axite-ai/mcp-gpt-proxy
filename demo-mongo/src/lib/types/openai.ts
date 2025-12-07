/**
 * OpenAI/ChatGPT Window Types
 *
 * Types for the window.openai API available in ChatGPT widget contexts.
 * These types describe the globals and methods available to widget components.
 */

export type Theme = "light" | "dark";
export type DisplayMode = "pip" | "inline" | "fullscreen";
export type DeviceType = "mobile" | "tablet" | "desktop" | "unknown";

export interface SafeAreaInsets {
  top: number;
  bottom: number;
  left: number;
  right: number;
}

export interface SafeArea {
  insets: SafeAreaInsets;
}

export interface UserAgent {
  device: { type: DeviceType };
  capabilities: {
    hover: boolean;
    touch: boolean;
  };
}

export interface CallToolResponse {
  content: Array<{ type: string; text?: string }>;
  structuredContent?: Record<string, unknown>;
  _meta?: Record<string, unknown>;
}

export interface OpenAiGlobals<
  TToolInput extends Record<string, unknown> = Record<string, unknown>,
  TToolOutput extends Record<string, unknown> = Record<string, unknown>,
  TToolResponseMetadata extends Record<string, unknown> = Record<
    string,
    unknown
  >,
  TWidgetState extends Record<string, unknown> = Record<string, unknown>
> {
  theme: Theme;
  userAgent: UserAgent;
  locale: string;

  // Layout
  maxHeight: number;
  displayMode: DisplayMode;
  safeArea: SafeArea;

  // State
  toolInput: TToolInput;
  toolOutput: TToolOutput | null;
  toolResponseMetadata: TToolResponseMetadata | null;
  widgetState: TWidgetState | null;
}

export interface OpenAiApi<
  TWidgetState extends Record<string, unknown> = Record<string, unknown>
> {
  /** Calls a tool on your MCP server. Returns the full response. */
  callTool: (
    name: string,
    args: Record<string, unknown>
  ) => Promise<CallToolResponse>;

  /** Triggers a followup turn in the ChatGPT conversation */
  sendFollowUpMessage: (args: { prompt: string }) => Promise<void>;

  /** Opens an external link, redirects web page or mobile app */
  openExternal: (payload: { href: string }) => void;

  /** For transitioning an app from inline to fullscreen or pip */
  requestDisplayMode: (args: { mode: DisplayMode }) => Promise<{
    /** The granted display mode. The host may reject the request. */
    mode: DisplayMode;
  }>;

  /** Persists widget state that travels with the conversation */
  setWidgetState: (state: TWidgetState) => Promise<void>;
}

export type OpenAi<
  TToolInput extends Record<string, unknown> = Record<string, unknown>,
  TToolOutput extends Record<string, unknown> = Record<string, unknown>,
  TToolResponseMetadata extends Record<string, unknown> = Record<
    string,
    unknown
  >,
  TWidgetState extends Record<string, unknown> = Record<string, unknown>
> = OpenAiApi<TWidgetState> &
  OpenAiGlobals<TToolInput, TToolOutput, TToolResponseMetadata, TWidgetState>;

// Event Types
export const SET_GLOBALS_EVENT_TYPE = "openai:set_globals";

export interface SetGlobalsEventDetail {
  globals: Partial<OpenAiGlobals>;
}

// Extend global Window interface
declare global {
  interface Window {
    openai?: OpenAi;
  }

  interface WindowEventMap {
    [SET_GLOBALS_EVENT_TYPE]: CustomEvent<SetGlobalsEventDetail>;
  }
}
