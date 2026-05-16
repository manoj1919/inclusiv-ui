import type { DistrictProfile } from "@/lib/types";

/**
 * Topline numbers for the directory landing page. Numbers are derived from
 * the data we already shipped — no separate aggregation pipeline. Districts
 * with suppressed (null) values are excluded from min/max/sum calculations.
 */
export function DirectoryStats({ profiles }: { profiles: DistrictProfile[] }) {
  const iepCounts = profiles
    .map((p) => p.enrollment?.students_with_iep?.value)
    .filter((v): v is number => typeof v === "number");
  const autismCounts = profiles
    .map((p) => p.enrollment?.students_with_autism?.value)
    .filter((v): v is number => typeof v === "number");
  const autismInclRates = profiles
    .map((p) => p.inclusion_metrics?.lre_80pct_plus_gen_ed_autism?.value)
    .filter((v): v is number => typeof v === "number");

  const sumIep = iepCounts.reduce((a, b) => a + b, 0);
  const sumAutism = autismCounts.reduce((a, b) => a + b, 0);
  const inclMin = autismInclRates.length ? Math.min(...autismInclRates) : null;
  const inclMax = autismInclRates.length ? Math.max(...autismInclRates) : null;

  const cells: { label: string; value: string; sub?: string }[] = [
    { label: "Districts indexed", value: profiles.length.toLocaleString() },
    { label: "Students with IEPs", value: sumIep.toLocaleString(), sub: "across all districts" },
    { label: "Students with autism", value: sumAutism.toLocaleString(), sub: "across all districts" },
    {
      label: "Autism inclusion (80%+ gen-ed)",
      value:
        inclMin !== null && inclMax !== null
          ? `${(inclMin * 100).toFixed(0)}% – ${(inclMax * 100).toFixed(0)}%`
          : "—",
      sub: "range across districts",
    },
  ];

  return (
    <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {cells.map((c) => (
        <div
          key={c.label}
          className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900"
        >
          <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-500">
            {c.label}
          </dt>
          <dd className="mt-1 font-mono text-2xl font-semibold tabular-nums text-zinc-900 dark:text-zinc-100">
            {c.value}
          </dd>
          {c.sub && <dd className="text-xs text-zinc-500 dark:text-zinc-500">{c.sub}</dd>}
        </div>
      ))}
    </dl>
  );
}
