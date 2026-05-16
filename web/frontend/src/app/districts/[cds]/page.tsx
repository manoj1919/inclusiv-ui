import Link from "next/link";
import { notFound } from "next/navigation";
import { AISummary } from "@/components/AISummary";
import { MetricRow } from "@/components/MetricRow";
import { listDistrictCdsCodes, loadDistrict } from "@/lib/districts";
import { dfs, num, pct } from "@/lib/format";

export async function generateStaticParams() {
  const codes = await listDistrictCdsCodes();
  return codes.map((cds) => ({ cds }));
}

export const dynamicParams = false;

export default async function DistrictPage({
  params,
}: {
  params: Promise<{ cds: string }>;
}) {
  const { cds } = await params;
  const profile = await loadDistrict(cds);
  if (!profile) notFound();

  const enroll = profile.enrollment ?? {};
  const incl = profile.inclusion_metrics ?? {};
  const outc = profile.outcome_metrics ?? {};
  const ai = profile.ai_summaries ?? {};
  const iepValue = enroll.students_with_iep?.value ?? null;

  return (
    <article className="space-y-8">
      <header>
        <div className="text-sm text-zinc-500 dark:text-zinc-500">
          <Link href="/" className="hover:underline">
            ← All districts
          </Link>
        </div>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">{profile.name}</h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          CDS {profile.cds_code} • {profile.county} County • {profile.region} • {profile.district_type}
        </p>
        <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-500">
          Data sources: {(profile.data_sources_used ?? []).join(", ") || "—"} • Last built {profile.last_updated}
        </p>
      </header>

      {ai.overview && <AISummary title="Overview" summary={ai.overview} />}

      <section>
        <h2 className="mb-3 text-lg font-semibold">Enrollment</h2>
        <div className="rounded-lg border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
          <MetricRow label="Students with IEP" field={enroll.students_with_iep} format={num} />
          <MetricRow
            label="Students with autism"
            field={enroll.students_with_autism}
            format={num}
            context={
              iepValue && enroll.students_with_autism?.value
                ? `${((enroll.students_with_autism.value / iepValue) * 100).toFixed(0)}% of IEP`
                : undefined
            }
          />
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold">Inclusion (Least Restrictive Environment)</h2>
        <p className="mb-3 text-sm text-zinc-600 dark:text-zinc-400">
          Share of students who spend at least 80% of the day in general-education classrooms.
          Higher generally means more inclusive placement.
        </p>
        <div className="rounded-lg border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
          <MetricRow
            label="All students with disabilities"
            field={incl.lre_80pct_plus_gen_ed_all_disabilities}
            format={(v) => pct(v, 1)}
          />
          <MetricRow
            label="Autism specifically"
            field={incl.lre_80pct_plus_gen_ed_autism}
            format={(v) => pct(v, 1)}
          />
          <MetricRow
            label="Separate setting (autism)"
            field={incl.lre_separate_setting_autism}
            format={(v) => pct(v, 1)}
          />
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold">Outcomes — SWD vs. all students</h2>
        <p className="mb-3 text-sm text-zinc-600 dark:text-zinc-400">
          SWD = Students with Disabilities (includes autism, not autism-specific). DFS = Distance
          From Standard, in points; negative = below grade level.
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-lg border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
            <h3 className="mb-2 text-sm font-semibold text-zinc-700 dark:text-zinc-300">
              Chronic absenteeism
            </h3>
            <MetricRow label="All students" field={outc.chronic_absenteeism_rate_all} format={(v) => pct(v, 1)} />
            <MetricRow label="SWD" field={outc.chronic_absenteeism_rate_swd} format={(v) => pct(v, 1)} />
          </div>
          <div className="rounded-lg border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
            <h3 className="mb-2 text-sm font-semibold text-zinc-700 dark:text-zinc-300">Suspension</h3>
            <MetricRow label="All students" field={outc.suspension_rate_all} format={(v) => pct(v, 1)} />
            <MetricRow label="SWD" field={outc.suspension_rate_swd} format={(v) => pct(v, 1)} />
          </div>
          <div className="rounded-lg border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
            <h3 className="mb-2 text-sm font-semibold text-zinc-700 dark:text-zinc-300">ELA distance from standard</h3>
            <MetricRow label="All students" field={outc.ela_distance_from_standard_all} format={dfs} />
            <MetricRow label="SWD" field={outc.ela_distance_from_standard_swd} format={dfs} />
          </div>
          <div className="rounded-lg border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
            <h3 className="mb-2 text-sm font-semibold text-zinc-700 dark:text-zinc-300">Math distance from standard</h3>
            <MetricRow label="All students" field={outc.math_distance_from_standard_all} format={dfs} />
            <MetricRow label="SWD" field={outc.math_distance_from_standard_swd} format={dfs} />
          </div>
        </div>
      </section>

      {ai.what_this_means_for_parents && (
        <AISummary
          title="What this might mean for parents"
          summary={ai.what_this_means_for_parents}
        />
      )}
    </article>
  );
}
