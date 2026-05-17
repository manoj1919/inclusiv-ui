/**
 * Compare-set constants and URL helpers.
 *
 * The compare flow lets a family pin a handful of districts and view them
 * side by side. Pinning is a *discovery* aid (held in localStorage); the
 * /compare page itself is driven entirely by the `?d=` URL param so a
 * comparison stays shareable and bookmarkable.
 *
 * Pure module — safe to import from server or client components.
 */

/** localStorage key for the pinned-district set. */
export const COMPARE_STORAGE_KEY = "inclusiv:compare:v1";

/** Side-by-side comparison is only legible up to a handful of districts. */
export const MAX_COMPARE = 4;

/**
 * Per-district marker colors. Okabe–Ito categorical palette — chosen because
 * it stays distinct under protan/deutan/tritan color-blindness. Color here
 * encodes *which district*, never quality, consistent with the Pulse tokens.
 */
export const COMPARE_COLORS = ["#0072B2", "#D55E00", "#009E73", "#CC79A7"];

/** Parse a `?d=` value into a clean, de-duplicated, capped CDS-code list. */
export function parseCompareParam(d: string | null | undefined): string[] {
  if (!d) return [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of d.split(",")) {
    const cds = raw.trim();
    if (cds && !seen.has(cds)) {
      seen.add(cds);
      out.push(cds);
    }
    if (out.length >= MAX_COMPARE) break;
  }
  return out;
}

/** Build a `/compare?d=…` href from a list of CDS codes. */
export function buildCompareHref(codes: string[]): string {
  const capped = codes.slice(0, MAX_COMPARE);
  return capped.length ? `/compare?d=${capped.join(",")}` : "/compare";
}
