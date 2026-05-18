"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";
import { COMPARE_STORAGE_KEY, MAX_COMPARE } from "@/lib/compare";

/**
 * Pulse · compare store — the pinned-district set shared across the app.
 *
 * Backed by localStorage and exposed through `useSyncExternalStore`, the
 * React-recommended pattern for external/browser state: the server snapshot
 * is always empty, the client snapshot is the persisted set, and React
 * reconciles the two after hydration without a mismatch (so no `hydrated`
 * flag is needed). `CompareProvider` is kept as a no-op wrapper so the root
 * layout's tree is unchanged.
 */

let pinned: string[] = [];
const EMPTY: readonly string[] = [];
const listeners = new Set<() => void>();

function persist(): void {
  try {
    window.localStorage.setItem(COMPARE_STORAGE_KEY, JSON.stringify(pinned));
  } catch {
    /* private mode / quota — pinning just won't persist */
  }
}

function setPinned(next: string[]): void {
  pinned = next;
  persist();
  for (const listener of listeners) listener();
}

// Load the persisted set once, when this module first runs in the browser.
if (typeof window !== "undefined") {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(COMPARE_STORAGE_KEY) || "[]");
    if (Array.isArray(parsed)) {
      pinned = parsed
        .filter((x): x is string => typeof x === "string")
        .slice(0, MAX_COMPARE);
    }
  } catch {
    /* corrupt value — start empty */
  }
}

const subscribe = (cb: () => void): (() => void) => {
  listeners.add(cb);
  return () => listeners.delete(cb);
};
const getSnapshot = (): readonly string[] => pinned;
const getServerSnapshot = (): readonly string[] => EMPTY;

export function CompareProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

export type CompareApi = {
  pinned: readonly string[];
  isPinned: (cds: string) => boolean;
  toggle: (cds: string) => void;
  remove: (cds: string) => void;
  clear: () => void;
  /** True when another district can still be pinned. */
  canPin: boolean;
};

export function useCompare(): CompareApi {
  const current = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const toggle = useCallback((cds: string) => {
    if (pinned.includes(cds)) {
      setPinned(pinned.filter((c) => c !== cds));
    } else if (pinned.length < MAX_COMPARE) {
      setPinned([...pinned, cds]);
    }
  }, []);
  const remove = useCallback((cds: string) => {
    setPinned(pinned.filter((c) => c !== cds));
  }, []);
  const clear = useCallback(() => setPinned([]), []);

  return useMemo<CompareApi>(
    () => ({
      pinned: current,
      isPinned: (cds) => current.includes(cds),
      toggle,
      remove,
      clear,
      canPin: current.length < MAX_COMPARE,
    }),
    [current, toggle, remove, clear],
  );
}
