"use client";

/**
 * useWidgetProps Hook
 *
 * Retrieves tool output data from the ChatGPT window.openai context.
 * This is the primary way for widgets to access data from MCP tool responses.
 */

import { useSyncExternalStore } from "react";
import { SET_GLOBALS_EVENT_TYPE } from "@/lib/types/openai";

/**
 * Hook to get the tool output from window.openai
 *
 * @param defaultState - Optional default state to use when no tool output is available
 * @returns The tool output data, or defaultState if not available
 *
 * @example
 * ```tsx
 * interface WeatherData {
 *   temperature: number;
 *   condition: string;
 * }
 *
 * function WeatherWidget() {
 *   const data = useWidgetProps<WeatherData>();
 *   if (!data) return <div>Loading...</div>;
 *   return <div>{data.temperature}°F - {data.condition}</div>;
 * }
 * ```
 */
export function useWidgetProps<T>(defaultState?: T): T | null {
  return useSyncExternalStore(
    (onChange) => {
      const handler = (e: CustomEvent) => {
        if (e.detail?.globals?.toolOutput !== undefined) {
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
    () => (window.openai?.toolOutput as T) ?? defaultState ?? null,
    // Server snapshot (SSR)
    () => defaultState ?? null
  );
}

/**
 * Hook to get the tool input from window.openai
 *
 * @returns The tool input arguments, or null if not available
 */
export function useToolInput<T>(): T | null {
  return useSyncExternalStore(
    (onChange) => {
      const handler = (e: CustomEvent) => {
        if (e.detail?.globals?.toolInput !== undefined) {
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
    () => (window.openai?.toolInput as T) ?? null,
    () => null
  );
}

/**
 * Hook to get the tool response metadata from window.openai
 *
 * @returns The tool response metadata, or null if not available
 */
export function useToolResponseMetadata<T>(): T | null {
  return useSyncExternalStore(
    (onChange) => {
      const handler = (e: CustomEvent) => {
        if (e.detail?.globals?.toolResponseMetadata !== undefined) {
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
    () => (window.openai?.toolResponseMetadata as T) ?? null,
    () => null
  );
}
