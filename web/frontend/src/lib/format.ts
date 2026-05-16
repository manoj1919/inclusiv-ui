/** Display helpers for sourced fields, percentages, and distance-from-standard. */

import type { Sourced } from "./types";

export function pct(value: number | null | undefined, digits = 0): string {
  if (value === null || value === undefined) return "—";
  return `${(value * 100).toFixed(digits)}%`;
}

export function num(value: number | null | undefined): string {
  if (value === null || value === undefined) return "—";
  return value.toLocaleString();
}

/** Distance From Standard rendering: e.g., "12.4 above" / "44.3 below". */
export function dfs(value: number | null | undefined): string {
  if (value === null || value === undefined) return "—";
  const v = Math.abs(value).toFixed(1);
  if (value > 0) return `+${v} above`;
  if (value < 0) return `−${v} below`;
  return "at standard";
}

export function sourceValue<T>(s: Sourced<T> | undefined): T | null | undefined {
  return s?.value ?? undefined;
}

export function provenanceLabel<T>(s: Sourced<T> | undefined): string {
  if (!s) return "";
  return `Source: ${s.source} • as of ${s.as_of}`;
}
