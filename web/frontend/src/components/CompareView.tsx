"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo } from "react";
import type { DistrictProfile } from "@/lib/types";
import type { Distribution, PeerSummary } from "@/lib/peers";
import { buildCompareHref, COMPARE_COLORS, parseCompareParam } from "@/lib/compare";
import { dfs, num, pct } from "@/lib/format";
import { AISummary } from "./AISummary";
import { SectionHead } from "./SectionHead";
import { Term } from "./Term";
import { CompareDistribution, type CompareMarker } from "./charts/CompareDistribution";

/** A selected district paired with its assigned marker color. */
type Picked = { profile: DistrictProfile; color: string };

/** Rescale a distribution (e.g. fraction 0–1 → percent 0–100). */
function scaleDist(d: Distribution, f: number): Distribution {
  return {
    values: d.values.map((v) => v * f),
    min: d.min * f,
    max: d.max * f,
    q1: d.q1 * f,
    median: d.median * f,
    q3: d.q3 * f,
    count: d.count,
  };
}

/** A peer-distribution chart row: a metric drawn once across all districts. */
type ChartSpec = {
  key: string;
  eyebrow: React.ReactNode;
  title: string;
  unit: string;
  /** Distance-from-standard rows get a symmetric, zero-centered axis. */
  dfsLike?: boolean;
  /** Multiply both peer values and district values into chart units. */
  scale: number;
  dist: Distribution | undefined;
  get: (p: DistrictProfile) => number | null;
  footnote: React.ReactNode;
};

export function CompareView({
  profiles,
  peers,
}: {
  profiles: DistrictProfile[];
  peers: PeerSummary;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const picked = useMemo<Picked[]>(() => {
    const codes = parseCompareParam(searchParams.get("d"));
    const byCds = new Map(profiles.map((p) => [p.cds_code, p]));
    return codes
      .map((cds) => byCds.get(cds))
      .filter((p): p is DistrictProfile => p !== undefined)
      .map((profile, i) => ({ profile, color: COMPARE_COLORS[i] }));
  }, [searchParams, profiles]);

  function removeDistrict(cds: string) {
    const next = picked.map((p) => p.profile.cds_code).filter((c) => c !== cds);
    router.replace(buildCompareHref(next));
  }

  if (picked.length === 0) {
    return (
      <div className="card px-6 py-8 text-center">
        <p className="text-[15px] leading-[1.6] text-[var(--ink-mid)]">
          No districts selected to compare. Open the directory, pin two or more
          districts with <span className="font-semibold text-[var(--ink)]">+ Compare</span>,
          then return here.
        </p>
        <Link
          href="/"
          className="mt-4 inline-flex rounded-full px-4 py-2 text-[13px] font-semibold text-white"
          style={{ background: "var(--accent)" }}
        >
          Browse districts →
        </Link>
      </div>
    );
  }

  const charts: ChartSpec[] = [
    {
      key: "autism_inclusion",
      eyebrow: <>INCLUSION · <Term>LRE</Term> 80%+ GEN-ED</>,
      title: "Autism · time in general-education classrooms",
      unit: "%",
      scale: 100,
      dist: peers.autism_inclusion,
      get: (p) => p.process?.lre?.lre_80pct_plus_gen_ed_autism?.value ?? null,
      footnote: (
        <>Higher share = more time alongside non-disabled peers. Source: <Term>CDE</Term>{" "}
        Special Education enrollment by program setting · 2024–25.</>
      ),
    },
    {
      key: "ela_dfs_swd",
      eyebrow: <><Term>ELA</Term> · <Term>DFS</Term> · <Term>SWD</Term></>,
      title: "English · Distance From Standard (students with disabilities)",
      unit: "",
      dfsLike: true,
      scale: 1,
      dist: peers.ela_dfs_swd,
      get: (p) => p.outcome?.academics?.ela_distance_from_standard_swd?.value ?? null,
      footnote: <>Zero is grade level; negative is below. Source: California School Dashboard · 2024–25.</>,
    },
    {
      key: "math_dfs_swd",
      eyebrow: <>MATH · <Term>DFS</Term> · <Term>SWD</Term></>,
      title: "Mathematics · Distance From Standard (students with disabilities)",
      unit: "",
      dfsLike: true,
      scale: 1,
      dist: peers.math_dfs_swd,
      get: (p) => p.outcome?.academics?.math_distance_from_standard_swd?.value ?? null,
      footnote: <>Zero is grade level; negative is below. Source: California School Dashboard · 2024–25.</>,
    },
    {
      key: "chronic_absent_swd",
      eyebrow: <>CHRONIC ABSENTEEISM · <Term>SWD</Term></>,
      title: "Students with disabilities missing 10%+ of school days",
      unit: "%",
      scale: 100,
      dist: peers.chronic_absent_swd,
      get: (p) => p.outcome?.behavior?.chronic_absenteeism_rate_swd?.value ?? null,
      footnote: <>Descriptive, not evaluated as better or worse. Source: <Term>CDE</Term> · 2024–25.</>,
    },
    {
      key: "suspension_swd",
      eyebrow: <>SUSPENSION RATE · <Term>SWD</Term></>,
      title: "Students with disabilities suspended at least once",
      unit: "%",
      scale: 100,
      dist: peers.suspension_swd,
      get: (p) => p.outcome?.behavior?.suspension_rate_swd?.value ?? null,
      footnote: <>Descriptive, not evaluated as better or worse. Source: <Term>CDE</Term> · 2024–25.</>,
    },
  ];

  return (
    <div className="space-y-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 pt-1 text-[12px] font-medium text-[var(--ink-soft)]">
        <Link href="/" className="hover:text-[var(--accent)]">Districts</Link>
        <span aria-hidden style={{ opacity: 0.5 }}>/</span>
        <span style={{ color: "var(--ink)", fontWeight: 600 }}>Compare</span>
      </div>

      {/* Header */}
      <header className="space-y-3">
        <h1 className="text-[44px] font-bold leading-[1.0] tracking-[-0.03em] text-[var(--ink)]">
          Comparing {picked.length} district{picked.length === 1 ? "" : "s"}
        </h1>
        <p className="max-w-[640px] text-[15px] leading-[1.55] text-[var(--ink-mid)]">
          Every district carries its own color below. Charts place each one in the
          full San Diego County peer set — markers show position, never a rank.
          This page is shareable: the districts live in the URL.
        </p>
        <ul className="flex flex-wrap gap-2 pt-1">
          {picked.map(({ profile, color }) => (
            <li
              key={profile.cds_code}
              className="inline-flex items-center gap-2 rounded-full"
              style={{
                background: "var(--card)",
                border: "1px solid var(--card-border)",
                padding: "6px 8px 6px 12px",
              }}
            >
              <span
                aria-hidden
                className="inline-block"
                style={{ width: 10, height: 10, borderRadius: 999, background: color }}
              />
              <span className="text-[13px] font-semibold text-[var(--ink)]">
                {profile.name}
              </span>
              <button
                type="button"
                onClick={() => removeDistrict(profile.cds_code)}
                aria-label={`Remove ${profile.name}`}
                className="ml-0.5 text-[var(--ink-soft)] transition-colors hover:text-[var(--accent)]"
                style={{ font: '500 15px/1 var(--font-sans)' }}
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      </header>

      {/* Peer-distribution charts */}
      <section className="space-y-5">
        <SectionHead
          num="01"
          title="Where each district sits among its peers"
          sub={
            <>
              One chart per metric. Light dots are all San Diego County districts that
              reported the value; the colored markers are your selection.
            </>
          }
        />
        {charts.map((spec) => {
          if (!spec.dist) {
            return (
              <div
                key={spec.key}
                className="card px-6 py-5 text-[13px] text-[var(--ink-mid)]"
              >
                {spec.title} — peer set unavailable for this metric.
              </div>
            );
          }
          const dist = scaleDist(spec.dist, spec.scale);
          const markers: CompareMarker[] = picked.map(({ profile, color }) => {
            const raw = spec.get(profile);
            return {
              cds: profile.cds_code,
              name: profile.name,
              color,
              value: raw === null ? null : raw * spec.scale,
            };
          });
          const present = [
            ...dist.values,
            ...markers.map((m) => m.value).filter((v): v is number => v !== null),
          ];
          let domain: { min: number; max: number };
          if (spec.dfsLike) {
            const extreme = Math.max(60, ...present.map((v) => Math.abs(v)));
            const r = Math.ceil((extreme + 10) / 10) * 10;
            domain = { min: -r, max: r };
          } else {
            const hi = Math.max(0, ...present);
            const floor = spec.key === "autism_inclusion" ? 100 : 20;
            domain = { min: 0, max: Math.max(floor, Math.ceil(hi / 10) * 10) };
          }
          return (
            <CompareDistribution
              key={spec.key}
              eyebrow={spec.eyebrow}
              title={spec.title}
              dist={dist}
              markers={markers}
              domain={domain}
              unit={spec.unit}
              ariaLabel={`${spec.title}: ${picked.length} districts compared against the San Diego County peer set`}
              footnote={spec.footnote}
            />
          );
        })}
      </section>

      {/* Raw numbers grid */}
      <section className="space-y-5">
        <SectionHead
          num="02"
          title="Every number, side by side"
          sub="The exact source values behind the charts. A dash means the district did not report that metric."
        />
        <NumbersGrid picked={picked} />
      </section>

      {/* AI summaries */}
      <section className="space-y-5">
        <SectionHead
          num="03"
          title="What this might mean for parents"
          sub="AI-generated and clearly labeled. The underlying numbers are government data; the narrative is not. Verify before quoting."
        />
        <div className="grid gap-3.5 sm:grid-cols-2">
          {picked.map(({ profile, color }) => {
            const summary =
              profile.ai_summaries?.what_this_means_for_parents ??
              profile.ai_summaries?.overview;
            return (
              <div key={profile.cds_code}>
                <div className="mb-2 flex items-center gap-2">
                  <span
                    aria-hidden
                    className="inline-block"
                    style={{ width: 10, height: 10, borderRadius: 999, background: color }}
                  />
                  <Link
                    href={`/districts/${profile.cds_code}`}
                    className="text-[14px] font-semibold text-[var(--ink)] hover:text-[var(--accent)]"
                  >
                    {profile.name} →
                  </Link>
                </div>
                {summary ? (
                  <AISummary summary={summary} />
                ) : (
                  <div className="card px-6 py-5 text-[13px] leading-[1.55] text-[var(--ink-mid)]">
                    No AI summary generated for this district yet.
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}

/* ------------------------------------------------------------------ */

type GridRow = {
  label: React.ReactNode;
  cell: (p: DistrictProfile) => string;
};

function NumbersGrid({ picked }: { picked: Picked[] }) {
  const autismShare = (p: DistrictProfile) => {
    const a = p.enrollment?.students_with_autism?.value ?? null;
    const i = p.enrollment?.students_with_iep?.value ?? null;
    return a === null || !i ? null : a / i;
  };

  const rows: GridRow[] = [
    { label: "Total enrollment", cell: (p) => num(p.enrollment?.total?.value) },
    { label: <>With disabilities (<Term>IEP</Term>)</>, cell: (p) => num(p.enrollment?.students_with_iep?.value) },
    { label: <>Autism (<Term>ASD</Term>)</>, cell: (p) => num(p.enrollment?.students_with_autism?.value) },
    { label: <>Autism · share of <Term>IEP</Term>s</>, cell: (p) => pct(autismShare(p), 0) },
    { label: <>Autism · 80%+ gen-ed (<Term>LRE</Term>)</>, cell: (p) => pct(p.process?.lre?.lre_80pct_plus_gen_ed_autism?.value, 0) },
    { label: <>All <Term>SWD</Term> · 80%+ gen-ed</>, cell: (p) => pct(p.process?.lre?.lre_80pct_plus_gen_ed_all_disabilities?.value, 0) },
    { label: "Autism · separate setting", cell: (p) => pct(p.process?.lre?.lre_separate_setting_autism?.value, 1) },
    { label: <><Term>ELA</Term> · <Term>DFS</Term> · all students</>, cell: (p) => dfs(p.outcome?.academics?.ela_distance_from_standard_all?.value) },
    { label: <><Term>ELA</Term> · <Term>DFS</Term> · <Term>SWD</Term></>, cell: (p) => dfs(p.outcome?.academics?.ela_distance_from_standard_swd?.value) },
    { label: <>Math · <Term>DFS</Term> · all students</>, cell: (p) => dfs(p.outcome?.academics?.math_distance_from_standard_all?.value) },
    { label: <>Math · <Term>DFS</Term> · <Term>SWD</Term></>, cell: (p) => dfs(p.outcome?.academics?.math_distance_from_standard_swd?.value) },
    { label: "Chronic absenteeism · all", cell: (p) => pct(p.outcome?.behavior?.chronic_absenteeism_rate_all?.value, 1) },
    { label: <>Chronic absenteeism · <Term>SWD</Term></>, cell: (p) => pct(p.outcome?.behavior?.chronic_absenteeism_rate_swd?.value, 1) },
    { label: "Suspension rate · all", cell: (p) => pct(p.outcome?.behavior?.suspension_rate_all?.value, 1) },
    { label: <>Suspension rate · <Term>SWD</Term></>, cell: (p) => pct(p.outcome?.behavior?.suspension_rate_swd?.value, 1) },
  ];

  const cols = `minmax(170px, 1.5fr) repeat(${picked.length}, minmax(0, 1fr))`;

  return (
    <div className="card overflow-x-auto px-1 py-1">
      <div style={{ minWidth: 360 }}>
        {/* header */}
        <div
          className="grid items-center gap-3 px-4 py-3"
          style={{ gridTemplateColumns: cols, borderBottom: "1px solid var(--rule)" }}
        >
          <span
            className="text-[var(--ink-soft)]"
            style={{ font: '600 10px/1 var(--font-mono)', letterSpacing: "0.08em", textTransform: "uppercase" }}
          >
            Metric
          </span>
          {picked.map(({ profile, color }) => (
            <span key={profile.cds_code} className="flex items-center gap-1.5">
              <span
                aria-hidden
                className="inline-block shrink-0"
                style={{ width: 9, height: 9, borderRadius: 999, background: color }}
              />
              <span className="truncate text-[12px] font-semibold leading-[1.25] text-[var(--ink)]">
                {profile.name}
              </span>
            </span>
          ))}
        </div>
        {/* rows */}
        {rows.map((row, ri) => (
          <div
            key={ri}
            className="grid items-center gap-3 px-4 py-2.5"
            style={{
              gridTemplateColumns: cols,
              borderBottom: ri < rows.length - 1 ? "1px solid var(--rule)" : "none",
            }}
          >
            <span className="text-[12.5px] leading-[1.35] text-[var(--ink-mid)]">
              {row.label}
            </span>
            {picked.map(({ profile }) => (
              <span
                key={profile.cds_code}
                className="tnum text-[13.5px] font-semibold leading-none text-[var(--ink)]"
                style={{ fontVariantNumeric: "tabular-nums" }}
              >
                {row.cell(profile)}
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
