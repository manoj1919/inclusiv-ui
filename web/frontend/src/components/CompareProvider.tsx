"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { COMPARE_STORAGE_KEY, MAX_COMPARE } from "@/lib/compare";

/**
 * Pulse · CompareProvider — holds the pinned-district set for the whole app.
 *
 * Mounted once in the root layout so the directory cards (PinButton) and the
 * floating CompareTray share one source of truth. State is persisted to
 * localStorage and starts empty on the server; `hydrated` flips true after
 * the first client effect, so consumers can avoid rendering a flash of the
 * pre-hydration empty state.
 */
type CompareContextValue = {
  pinned: string[];
  hydrated: boolean;
  isPinned: (cds: string) => boolean;
  /** Pin if room, unpin if already pinned. No-op when adding past the cap. */
  toggle: (cds: string) => void;
  remove: (cds: string) => void;
  clear: () => void;
  /** True when another district can still be pinned. */
  canPin: boolean;
};

const CompareContext = createContext<CompareContextValue | null>(null);

function readStored(): string[] {
  try {
    const raw = window.localStorage.getItem(COMPARE_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((x): x is string => typeof x === "string").slice(0, MAX_COMPARE);
  } catch {
    return [];
  }
}

export function CompareProvider({ children }: { children: React.ReactNode }) {
  const [pinned, setPinned] = useState<string[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setPinned(readStored());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(COMPARE_STORAGE_KEY, JSON.stringify(pinned));
    } catch {
      /* private-mode or quota — pinning just won't persist */
    }
  }, [pinned, hydrated]);

  const toggle = useCallback((cds: string) => {
    setPinned((prev) => {
      if (prev.includes(cds)) return prev.filter((c) => c !== cds);
      if (prev.length >= MAX_COMPARE) return prev;
      return [...prev, cds];
    });
  }, []);

  const remove = useCallback((cds: string) => {
    setPinned((prev) => prev.filter((c) => c !== cds));
  }, []);

  const clear = useCallback(() => setPinned([]), []);

  const value = useMemo<CompareContextValue>(
    () => ({
      pinned,
      hydrated,
      isPinned: (cds) => pinned.includes(cds),
      toggle,
      remove,
      clear,
      canPin: pinned.length < MAX_COMPARE,
    }),
    [pinned, hydrated, toggle, remove, clear],
  );

  return <CompareContext.Provider value={value}>{children}</CompareContext.Provider>;
}

export function useCompare(): CompareContextValue {
  const ctx = useContext(CompareContext);
  if (!ctx) {
    throw new Error("useCompare must be used within a CompareProvider");
  }
  return ctx;
}
