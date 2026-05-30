/**
 * Peer-set distribution math. Built at request time from all loaded profiles,
 * so the "where does this district sit among its peers" framing stays honest
 * even as we add more districts.
 *
 * The peer-set is whatever districts are currently in the dataset. The label
 * (e.g., "among 42 San Diego County districts") is rendered by the consumer
 * so the visualization can never claim a wider comparison than the data.
 */

import type { DistrictProfile } from "./types";

export type Distribution = {
  values: number[];   // sorted ascending; suppressed-null entries dropped
  min: number;
  q1: number;
  median: number;
  q3: number;
  max: number;
  count: number;
};

/** Linear interpolation between sorted samples — standard quartile method. */
function quantile(sorted: number[], p: number): number {
  if (sorted.length === 0) return NaN;
  if (sorted.length === 1) return sorted[0];
  const idx = (sorted.length - 1) * p;
  const lo = Math.floor(idx);
  const hi = Math.ceil(idx);
  if (lo === hi) return sorted[lo];
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (idx - lo);
}

export function computeDistribution(values: (number | null | undefined)[]): Distribution | null {
  const clean = values.filter((v): v is number => typeof v === "number" && Number.isFinite(v));
  if (clean.length === 0) return null;
  const sorted = [...clean].sort((a, b) => a - b);
  return {
    values: sorted,
    min: sorted[0],
    q1: quantile(sorted, 0.25),
    median: quantile(sorted, 0.5),
    q3: quantile(sorted, 0.75),
    max: sorted[sorted.length - 1],
    count: sorted.length,
  };
}

/** Rank position (1-indexed) of `value` among the peer-set, ties broken by
 *  greater-than-or-equal. Returns null if value isn't comparable. */
export function rank(value: number | null | undefined, dist: Distribution): number | null {
  if (typeof value !== "number" || !Number.isFinite(value)) return null;
  let r = 1;
  for (const v of dist.values) {
    if (v < value) r += 1;
  }
  return r;
}

/** A neutral phrase for "where does this district sit": no good/bad framing. */
export function percentilePhrase(value: number | null | undefined, dist: Distribution): string | null {
  const r = rank(value, dist);
  if (r === null) return null;
  // 1-indexed position. r=1 means lowest, r=count means highest.
  return `position ${r} of ${dist.count}`;
}

/** Pick out one numeric metric across all profiles via a getter. */
export function metricSeries(
  profiles: DistrictProfile[],
  pick: (p: DistrictProfile) => number | null | undefined,
): Distribution | null {
  return computeDistribution(profiles.map(pick));
}

/**
 * Build all peer distributions we visualize. Keep the keys tight — every key
 * here has a matching chart somewhere. Add entries as the chart set grows.
 */
export type PeerKey =
  // Structure — staffing density
  | "teachers_per_100_iep"
  | "pupil_services_per_1k_students"
  | "pupil_services_per_100_iep"
  // Process — LRE
  | "autism_inclusion"
  | "all_swd_inclusion"
  // Outcome — academics
  | "ela_dfs_all"
  | "ela_dfs_swd"
  | "math_dfs_all"
  | "math_dfs_swd"
  // Outcome — behavior
  | "chronic_absent_all"
  | "chronic_absent_swd"
  | "suspension_all"
  | "suspension_swd";

export type PeerSummary = Partial<Record<PeerKey, Distribution>>;

export function buildPeerSummary(profiles: DistrictProfile[]): PeerSummary {
  const get = (k: PeerKey) => {
    switch (k) {
      case "teachers_per_100_iep":
        return (p: DistrictProfile) => p.structure?.staffing?.teachers_per_100_iep?.value;
      case "pupil_services_per_1k_students":
        return (p: DistrictProfile) => p.structure?.staffing?.pupil_services_per_1k_students?.value;
      case "pupil_services_per_100_iep":
        return (p: DistrictProfile) => p.structure?.staffing?.pupil_services_per_100_iep?.value;
      case "autism_inclusion":
        return (p: DistrictProfile) => p.process?.lre?.lre_80pct_plus_gen_ed_autism?.value;
      case "all_swd_inclusion":
        return (p: DistrictProfile) => p.process?.lre?.lre_80pct_plus_gen_ed_all_disabilities?.value;
      case "ela_dfs_all":
        return (p: DistrictProfile) => p.outcome?.academics?.ela_distance_from_standard_all?.value;
      case "ela_dfs_swd":
        return (p: DistrictProfile) => p.outcome?.academics?.ela_distance_from_standard_swd?.value;
      case "math_dfs_all":
        return (p: DistrictProfile) => p.outcome?.academics?.math_distance_from_standard_all?.value;
      case "math_dfs_swd":
        return (p: DistrictProfile) => p.outcome?.academics?.math_distance_from_standard_swd?.value;
      case "chronic_absent_all":
        return (p: DistrictProfile) => p.outcome?.behavior?.chronic_absenteeism_rate_all?.value;
      case "chronic_absent_swd":
        return (p: DistrictProfile) => p.outcome?.behavior?.chronic_absenteeism_rate_swd?.value;
      case "suspension_all":
        return (p: DistrictProfile) => p.outcome?.behavior?.suspension_rate_all?.value;
      case "suspension_swd":
        return (p: DistrictProfile) => p.outcome?.behavior?.suspension_rate_swd?.value;
    }
  };
  const keys: PeerKey[] = [
    "teachers_per_100_iep",
    "pupil_services_per_1k_students",
    "pupil_services_per_100_iep",
    "autism_inclusion",
    "all_swd_inclusion",
    "ela_dfs_all",
    "ela_dfs_swd",
    "math_dfs_all",
    "math_dfs_swd",
    "chronic_absent_all",
    "chronic_absent_swd",
    "suspension_all",
    "suspension_swd",
  ];
  const out: PeerSummary = {};
  for (const k of keys) {
    const d = metricSeries(profiles, get(k));
    if (d) out[k] = d;
  }
  return out;
}
