/**
 * Lens engine — discovery view for the directory.
 *
 * A lens is a *named family preference* (e.g. "inclusion-oriented") expressed
 * as a weighted bundle of metrics with directions. Each district is scored by
 * percentile rank within the loaded peer set, weights are renormalized over
 * the inputs that actually have data, and the composite is bucketed.
 *
 * Bucketing is deliberate: districts cluster by qualitative fit, not by a
 * single number. Within a bucket, order is alphabetical — we never claim a
 * 4th-best vs 5th-best ranking that the data cannot defend.
 */
import type { DistrictProfile } from "./types";

export type LensId = "inclusion" | "academic" | "behavioral" | "personalized";

export type Bucket = "strong" | "mixed" | "moderate" | "below" | "insufficient";

export type LensInput = {
  id: string;
  label: string;
  getter: (p: DistrictProfile) => number | null;
  /** Direction in which higher percentile = better fit *for this lens*. */
  direction: "higher" | "lower";
  weight: number;
};

export type LensDefinition = {
  id: LensId;
  label: string;
  shortLabel: string;
  description: string;
  limitations: string;
  inputs: LensInput[];
};

const num = (v: number | null | undefined): number | null =>
  typeof v === "number" && Number.isFinite(v) ? v : null;

const gap = (a: number | null, b: number | null): number | null =>
  a === null || b === null ? null : a - b;

export const LENSES: Record<LensId, LensDefinition> = {
  inclusion: {
    id: "inclusion",
    label: "Inclusion-oriented",
    shortLabel: "Inclusion",
    description:
      "Districts where autistic students are most often in regular classrooms, with the smallest within-district gaps in absenteeism and discipline.",
    limitations:
      "Inclusion rate alone does not measure quality of supports inside the classroom. Small districts can have noisy gap values when subgroup counts are tiny.",
    inputs: [
      {
        id: "autism_inclusion",
        label: "Autism · time in general-ed classrooms (80%+ of day)",
        getter: (p) => num(p.process?.lre?.lre_80pct_plus_gen_ed_autism?.value),
        direction: "higher",
        weight: 0.5,
      },
      {
        id: "absenteeism_gap",
        label: "Chronic-absenteeism gap (SWD vs all)",
        getter: (p) =>
          gap(
            num(p.outcome?.behavior?.chronic_absenteeism_rate_swd?.value),
            num(p.outcome?.behavior?.chronic_absenteeism_rate_all?.value),
          ),
        direction: "lower",
        weight: 0.25,
      },
      {
        id: "suspension_gap",
        label: "Suspension-rate gap (SWD vs all)",
        getter: (p) =>
          gap(
            num(p.outcome?.behavior?.suspension_rate_swd?.value),
            num(p.outcome?.behavior?.suspension_rate_all?.value),
          ),
        direction: "lower",
        weight: 0.25,
      },
    ],
  },
  academic: {
    id: "academic",
    label: "Academic support for SWD",
    shortLabel: "Academics",
    description:
      "Districts where students with disabilities perform closer to grade-level in ELA and math, with the smallest within-district disparity vs. peers without IEPs.",
    limitations:
      "Distance From Standard is a single year of statewide testing. It does not capture instructional approach, IEP-specific progress, or curriculum alignment.",
    inputs: [
      {
        id: "ela_dfs_swd",
        label: "ELA · Distance From Standard (SWD)",
        getter: (p) => num(p.outcome?.academics?.ela_distance_from_standard_swd?.value),
        direction: "higher",
        weight: 0.4,
      },
      {
        id: "math_dfs_swd",
        label: "Math · Distance From Standard (SWD)",
        getter: (p) => num(p.outcome?.academics?.math_distance_from_standard_swd?.value),
        direction: "higher",
        weight: 0.4,
      },
      {
        id: "dfs_gap",
        label: "ELA + Math DFS gap (all vs SWD)",
        getter: (p) => {
          const elaAll = num(p.outcome?.academics?.ela_distance_from_standard_all?.value);
          const elaSwd = num(p.outcome?.academics?.ela_distance_from_standard_swd?.value);
          const mathAll = num(p.outcome?.academics?.math_distance_from_standard_all?.value);
          const mathSwd = num(p.outcome?.academics?.math_distance_from_standard_swd?.value);
          const gaps: number[] = [];
          if (elaAll !== null && elaSwd !== null) gaps.push(elaAll - elaSwd);
          if (mathAll !== null && mathSwd !== null) gaps.push(mathAll - mathSwd);
          if (gaps.length === 0) return null;
          return gaps.reduce((s, x) => s + x, 0) / gaps.length;
        },
        direction: "lower",
        weight: 0.2,
      },
    ],
  },
  behavioral: {
    id: "behavioral",
    label: "Behavioral stability for SWD",
    shortLabel: "Stability",
    description:
      "Districts with the lowest suspension and chronic-absenteeism rates among students with disabilities, and the smallest share of autistic students placed in fully separate settings.",
    limitations:
      "Low suspension rates can reflect classroom support OR under-reporting. Separate-setting share is not inherently good or bad — some families specifically seek it.",
    inputs: [
      {
        id: "suspension_swd",
        label: "Suspension rate (SWD)",
        getter: (p) => num(p.outcome?.behavior?.suspension_rate_swd?.value),
        direction: "lower",
        weight: 0.4,
      },
      {
        id: "absenteeism_swd",
        label: "Chronic-absenteeism rate (SWD)",
        getter: (p) => num(p.outcome?.behavior?.chronic_absenteeism_rate_swd?.value),
        direction: "lower",
        weight: 0.3,
      },
      {
        id: "autism_separate",
        label: "Autism · separate-setting share",
        getter: (p) => num(p.process?.lre?.lre_separate_setting_autism?.value),
        direction: "lower",
        weight: 0.3,
      },
    ],
  },
  personalized: {
    id: "personalized",
    label: "Smaller & personalized",
    shortLabel: "Personalized",
    description:
      "Smaller districts with a notable autism share of the IEP population — settings where many families report being known by name and where autism-specific programming is more likely to be visible.",
    limitations:
      "Size and autism share say nothing about staff training or program depth. Tiny districts may not offer full age-band programming; this lens is a heuristic, not a recommendation.",
    inputs: [
      {
        id: "total_enrollment",
        label: "Total enrollment",
        getter: (p) => num(p.enrollment?.total?.value),
        direction: "lower",
        weight: 0.6,
      },
      {
        id: "autism_share_iep",
        label: "Autism · share of IEPs",
        getter: (p) => {
          const autism = num(p.enrollment?.students_with_autism?.value);
          const iep = num(p.enrollment?.students_with_iep?.value);
          if (autism === null || iep === null || iep === 0) return null;
          return autism / iep;
        },
        direction: "higher",
        weight: 0.4,
      },
    ],
  },
};

/** Mid-rank percentile (handles ties), then inverted for `lower` direction. */
export function percentileRank(
  value: number,
  peers: number[],
  direction: "higher" | "lower",
): number {
  if (peers.length === 0) return 50;
  let below = 0;
  let equal = 0;
  for (const p of peers) {
    if (p < value) below++;
    else if (p === value) equal++;
  }
  const pct = ((below + 0.5 * equal) / peers.length) * 100;
  return direction === "higher" ? pct : 100 - pct;
}

export type InputContribution = {
  id: string;
  label: string;
  weight: number;
  value: number | null;
  percentile: number | null;
};

export type DistrictScore = {
  cds: string;
  name: string;
  composite: number | null;
  inputs: InputContribution[];
  bucket: Bucket;
  /** 1–2 labels of strongest contributing inputs (most influence on score). */
  matchedOn: string[];
  /** Label of any input with percentile < 25 — only set when bucket = mixed. */
  weakInput?: string;
  /** Fraction of lens inputs that had a value for this district (0–1). */
  confidence: number;
};

const STRONG_THRESHOLD = 70;
const MODERATE_THRESHOLD = 40;
const WEAK_INPUT_THRESHOLD = 25;
const MIN_COMPLETENESS = 0.5;

export function scoreLens(
  profiles: DistrictProfile[],
  lensId: LensId,
): DistrictScore[] {
  const lens = LENSES[lensId];

  // One peer array per input — values of every district for that metric.
  const peerArrays = lens.inputs.map((inp) => {
    const xs: number[] = [];
    for (const p of profiles) {
      const v = inp.getter(p);
      if (v !== null) xs.push(v);
    }
    return xs;
  });

  return profiles.map((profile) => {
    const inputs: InputContribution[] = lens.inputs.map((inp, i) => {
      const v = inp.getter(profile);
      const percentile =
        v === null ? null : percentileRank(v, peerArrays[i], inp.direction);
      return { id: inp.id, label: inp.label, weight: inp.weight, value: v, percentile };
    });

    const present = inputs.filter(
      (x): x is InputContribution & { percentile: number } => x.percentile !== null,
    );
    const completeness = inputs.length === 0 ? 0 : present.length / inputs.length;

    let composite: number | null = null;
    if (completeness >= MIN_COMPLETENESS && present.length > 0) {
      const totalWeight = present.reduce((s, x) => s + x.weight, 0);
      composite = present.reduce(
        (s, x) => s + (x.weight / totalWeight) * x.percentile,
        0,
      );
    }

    let bucket: Bucket;
    if (composite === null) {
      bucket = "insufficient";
    } else if (composite >= STRONG_THRESHOLD) {
      bucket = present.some((x) => x.percentile < WEAK_INPUT_THRESHOLD)
        ? "mixed"
        : "strong";
    } else if (composite >= MODERATE_THRESHOLD) {
      bucket = "moderate";
    } else {
      bucket = "below";
    }

    const ranked = [...present].sort(
      (a, b) => b.weight * b.percentile - a.weight * a.percentile,
    );
    const matchedOn = ranked.slice(0, 2).map((x) => x.label);
    const weakInput =
      bucket === "mixed"
        ? present.find((x) => x.percentile < WEAK_INPUT_THRESHOLD)?.label
        : undefined;

    return {
      cds: profile.cds_code,
      name: profile.name,
      composite,
      inputs,
      bucket,
      matchedOn,
      weakInput,
      confidence: completeness,
    };
  });
}

const BUCKET_ORDER: Record<Bucket, number> = {
  strong: 0,
  mixed: 1,
  moderate: 2,
  below: 3,
  insufficient: 4,
};

/** Score every district for a lens; group by bucket, alphabetical within. */
export function applyLens(
  profiles: DistrictProfile[],
  lensId: LensId,
): DistrictScore[] {
  const scored = scoreLens(profiles, lensId);
  return [...scored].sort((a, b) => {
    const bd = BUCKET_ORDER[a.bucket] - BUCKET_ORDER[b.bucket];
    if (bd !== 0) return bd;
    return a.name.localeCompare(b.name);
  });
}

export const BUCKET_LABELS: Record<Bucket, string> = {
  strong: "Strong match",
  mixed: "Mixed signal",
  moderate: "Moderate match",
  below: "Below the median",
  insufficient: "Not enough data",
};

export const LENS_ORDER: LensId[] = [
  "inclusion",
  "academic",
  "behavioral",
  "personalized",
];
