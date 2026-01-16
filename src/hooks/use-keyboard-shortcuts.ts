/**
 * Keyboard Shortcuts Hook
 * 
 * Provides keyboard shortcut functionality for common actions.
 */

import { useEffect, useCallback } from "react";

export interface KeyboardShortcut {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  meta?: boolean;
  action: () => void;
  description?: string;
  preventDefault?: boolean;
}

/**
 * Hook for managing keyboard shortcuts
 * 
 * @param shortcuts - Array of keyboard shortcut configurations
 * @param enabled - Whether shortcuts are enabled (default: true)
 * 
 * @example
 * ```ts
 * useKeyboardShortcuts([
 *   {
 *     key: 's',
 *     ctrl: true,
 *     action: () => handleSave(),
 *     description: 'Save (Ctrl+S)'
 *   },
 *   {
 *     key: 'Escape',
 *     action: () => handleClose(),
 *     description: 'Close (Esc)'
 *   }
 * ]);
 * ```
 */
export function useKeyboardShortcuts(
  shortcuts: KeyboardShortcut[],
  enabled: boolean = true
): void {
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!enabled) return;

      // Don't trigger shortcuts when user is typing in input fields
      const target = event.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) {
        // Allow Escape and Ctrl+ shortcuts even in input fields
        if (event.key !== "Escape" && !event.ctrlKey && !event.metaKey) {
          return;
        }
      }

      for (const shortcut of shortcuts) {
        const keyMatches = event.key === shortcut.key || event.code === `Key${shortcut.key.toUpperCase()}`;
        const ctrlMatches = shortcut.ctrl ? event.ctrlKey || event.metaKey : !event.ctrlKey && !event.metaKey;
        const shiftMatches = shortcut.shift ? event.shiftKey : !event.shiftKey;
        const altMatches = shortcut.alt ? event.altKey : !event.altKey;

        if (keyMatches && ctrlMatches && shiftMatches && altMatches) {
          if (shortcut.preventDefault !== false) {
            event.preventDefault();
          }
          shortcut.action();
          break;
        }
      }
    },
    [shortcuts, enabled]
  );

  useEffect(() => {
    if (!enabled) return;

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleKeyDown, enabled]);
}

/**
 * Common keyboard shortcuts for the application
 */
export const CommonShortcuts = {
  SAVE: { key: "s", ctrl: true, description: "Save (Ctrl+S)" },
  NEW: { key: "n", ctrl: true, description: "New (Ctrl+N)" },
  DELETE: { key: "Delete", description: "Delete" },
  ESCAPE: { key: "Escape", description: "Close/Cancel (Esc)" },
  SEARCH: { key: "k", ctrl: true, description: "Search (Ctrl+K)" },
  REFRESH: { key: "r", ctrl: true, description: "Refresh (Ctrl+R)" },
  EXPORT: { key: "e", ctrl: true, shift: true, description: "Export (Ctrl+Shift+E)" },
} as const;

