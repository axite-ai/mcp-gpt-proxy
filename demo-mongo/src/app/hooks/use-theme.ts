"use client";

/**
 * useTheme Hook
 *
 * Syncs the widget theme with ChatGPT's theme (light/dark mode).
 * Uses the @openai/apps-sdk-ui theme utilities.
 */

import { useEffect } from "react";
import { useSyncExternalStore } from "react";
import { applyDocumentTheme } from "@openai/apps-sdk-ui/theme";
import { SET_GLOBALS_EVENT_TYPE, type Theme } from "@/lib/types/openai";

/**
 * Hook to sync the document theme with ChatGPT's theme
 *
 * This hook:
 * 1. Reads the current theme from window.openai
 * 2. Listens for theme changes via the openai:set_globals event
 * 3. Applies the theme to the document using applyDocumentTheme
 *
 * @returns The current theme ("light" or "dark")
 *
 * @example
 * ```tsx
 * function MyWidget() {
 *   const theme = useThemeSync();
 *   return <div>Current theme: {theme}</div>;
 * }
 * ```
 */
export function useThemeSync(): Theme {
  const theme = useSyncExternalStore<Theme>(
    (onChange) => {
      const handler = (e: CustomEvent) => {
        if (e.detail?.globals?.theme !== undefined) {
          onChange();
        }
      };

      window.addEventListener(
        SET_GLOBALS_EVENT_TYPE,
        handler as EventListener,
        { passive: true }
      );

      return () => {
        window.removeEventListener(
          SET_GLOBALS_EVENT_TYPE,
          handler as EventListener
        );
      };
    },
    // Client snapshot
    () => (window.openai?.theme as Theme) ?? "light",
    // Server snapshot (SSR)
    () => "light" as Theme
  );

  // Apply theme to document when it changes
  useEffect(() => {
    applyDocumentTheme(theme);
  }, [theme]);

  return theme;
}

/**
 * Hook to get the current theme without syncing
 *
 * Use this if you only need to read the theme value without
 * automatically applying it to the document.
 *
 * @returns The current theme ("light" or "dark")
 */
export function useTheme(): Theme {
  return useSyncExternalStore<Theme>(
    (onChange) => {
      const handler = (e: CustomEvent) => {
        if (e.detail?.globals?.theme !== undefined) {
          onChange();
        }
      };

      window.addEventListener(
        SET_GLOBALS_EVENT_TYPE,
        handler as EventListener,
        { passive: true }
      );

      return () => {
        window.removeEventListener(
          SET_GLOBALS_EVENT_TYPE,
          handler as EventListener
        );
      };
    },
    () => (window.openai?.theme as Theme) ?? "light",
    () => "light" as Theme
  );
}
