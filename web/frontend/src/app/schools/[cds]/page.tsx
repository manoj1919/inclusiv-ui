import Link from "next/link";
import { notFound } from "next/navigation";
import { SectionHead } from "@/components/SectionHead";
import { StatTile } from "@/components/StatTile";
import { Term } from "@/components/Term";
import { DFSDivergence } from "@/components/charts/DFSDivergence";
import { MetricBars } from "@/components/charts/MetricBars";
import { listSchoolCdsCodes, loadSchool } from "@/lib/schools";
import { num } from "@/lib/format";

export async function generateStaticParams() {
  const codes = await listSchoolCdsCodes();
  return codes.map((cds) => ({ cds }));
}

export const dynamicParams = false;

export default async function SchoolPage({
  params,
}: {
  params: Promise<{ cds: string }>;
}) {
  const { cds } = await params;
  const s = await loadSchool(cds);
  if (!s) notFound();

  const enr = s.enrollment ?? {};
  const incl = s.inclusion_metrics ?? {};
  const outc = s.outcome_metrics ?? {};
  const total = enr.total?.value ?? null;
  const swd = enr.students_with_iep?.value ?? null;
  const pctIep = enr.pct_iep?.value != null ? enr.pct_iep.value * 100 : null;

  const lre80 = incl.lre_80pct_plus_gen_ed_all_disabilities?.value ?? null;
  const lreSep = incl.lre_separate_setting_all_disabilities?.value ?? null;

  const elaAll = outc.ela_distance_from_standard_all?.value ?? null;
  const elaSwd = outc.ela_distance_from_standard_swd?.value ?? null;
  const mathAll = outc.math_distance_from_standard_all?.value ?? null;
  const mathSwd = outc.math_distance_from_standard_swd?.value ?? null;
  const hasDfs = [elaAll, elaSwd, mathAll, mathSwd].some((v) => v !== null);
  const dfsExtreme = Math.max(
    60,
    ...[elaAll, elaSwd, mathAll, mathSwd].filter((v): v is number => v !== null).map(Math.abs),
  );
  const dfsRange = Math.ceil((dfsExtreme + 10) / 10) * 10;

  const to100 = (v: number | null) => (v === null ? null : Number((v * 100).toFixed(1)));
  const absAll = to100(outc.chronic_absenteeism_rate_all?.value ?? null);
  const absSwd = to100(outc.chronic_absenteeism_rate_swd?.value ?? null);
  const suspAll = to100(outc.suspension_rate_all?.value ?? null);
  const suspSwd = to100(outc.suspension_rate_swd?.value ?? null);
  const hasDiscipline = [absAll, absSwd, suspAll, suspSwd].some((v) => v !== null);

  return (
    <article className="space-y-8">
      {/* Breadcrumb */}
      <div className="flex flex-wrap items-center gap-2 pt-1 text-[12px] font-medium text-[var(--ink-soft)]">
        <Link href="/" className="hover:text-[var(--accent)]">Districts</Link>
        <span aria-hidden style={{ opacity: 0.5 }}>/</span>
        <Link href={`/districts/${s.district_cds}`} className="hover:text-[var(--accent)]">
          {s.district_name}
        </Link>
        <span aria-hidden style={{ opacity: 0.5 }}>/</span>
        <span style={{ color: "var(--ink)", fontWeight: 600 }}>{s.name}</span>
      </div>

      {/* Header */}
      <header className="space-y-3.5">
        <h1 className="text-[44px] font-bold leading-[1.0] tracking-[-0.03em] text-[var(--ink)]">
          {s.name}
        </h1>
        <p className="max-w-[600px] text-[15px] leading-[1.55] text-[var(--ink-mid)]">
          A school in{" "}
          <Link href={`/districts/${s.district_cds}`} className="font-semibold text-[var(--ink)] hover:text-[var(--accent)]">
            {s.district_name}
          </Link>
          , {s.county} County.
        </p>
        {s.charter && (
          <span
            className="inline-flex items-center rounded-full"
            style={{
              background: "var(--card)", border: "1px solid var(--card-border)",
              padding: "5px 12px", font: '500 11px/1 var(--font-mono)',
              letterSpacing: "0.06em", color: "var(--ink-mid)", textTransform: "uppercase",
            }}
          >
            Charter school
          </span>
        )}
      </header>

      {/* All-SWD scope note */}
      <div
        className="card px-5 py-4 text-[13px] leading-[1.55] text-[var(--ink-mid)]"
        style={{ background: "var(--subtle-bg)", boxShadow: "none" }}
      >
        Every figure on this page covers <strong>all students with disabilities</strong>{" "}
        (<Term>SWD</Term>). California does not publish autism-specific data below the
        district level — for <Term>ASD</Term> inclusion, counts, and the discovery lenses,
        see the{" "}
        <Link href={`/districts/${s.district_cds}`} className="font-medium" style={{ color: "var(--accent)" }}>
          {s.district_name} profile
        </Link>.
      </div>

      {/* KPIs */}
      <section className="grid gap-3.5 sm:grid-cols-3">
        <StatTile label="Enrollment" value={num(total)} sub={total ? "students · 2024–25" : undefined} />
        <StatTile
          focal
          label={<>With disabilities (<Term>IEP</Term>)</>}
          value={num(swd)}
          sub={pctIep !== null ? `${pctIep.toFixed(1)}% of enrollment` : undefined}
        />
        <StatTile
          label="Share with disabilities"
          value={pctIep === null ? "—" : `${pctIep.toFixed(1)}%`}
          sub={pctIep === null ? "enrollment basis unavailable" : "of total enrollment"}
        />
      </section>

      {/* Inclusion */}
      <section className="space-y-5">
        <SectionHead
          num="01"
          title="Where do students with disabilities spend the day?"
          sub={
            <>
              The share of all <Term>SWD</Term> in a regular classroom 80%+ of the day
              (<Term>LRE</Term>), and the share in a fully separate setting. 2024–25.
            </>
          }
        />
        <div className="grid gap-3.5 sm:grid-cols-2">
          <StatTile
            focal
            label="80%+ in general education"
            value={lre80 === null ? "—" : `${Math.round(lre80 * 100)}%`}
            sub="All students with disabilities, this school."
          />
          <StatTile
            focal
            label="Separate setting"
            value={lreSep === null ? "—" : `${(lreSep * 100).toFixed(1)}%`}
            sub="Self-contained or separate-school placement."
          />
        </div>
      </section>

      {/* Academics */}
      {hasDfs && (
        <section className="space-y-5">
          <SectionHead
            num="02"
            title="State assessment results"
            sub={
              <>
                <Term>DFS</Term> (Distance From Standard) — points above (positive) or below
                (negative) grade level, all students vs. the <Term>SWD</Term> subgroup.
              </>
            }
          />
          <DFSDivergence
            eyebrow={<>DISTANCE FROM STANDARD · <Term>CAASPP</Term></>}
            title="Points from grade-level expectation"
            range={dfsRange}
            rows={[
              { label: <>English (<Term>ELA</Term>)</>, all: elaAll, swd: elaSwd },
              { label: "Mathematics", all: mathAll, swd: mathSwd },
            ]}
            ariaLabel={`${s.name}: ELA and math Distance From Standard, all students vs SWD`}
            footnote={<>Source: California School Dashboard · 2024–25.</>}
          />
        </section>
      )}

      {/* Discipline */}
      {hasDiscipline && (
        <section className="space-y-5">
          <SectionHead
            num="03"
            title="Absence & suspension"
            sub={
              <>
                Chronic absenteeism (missing 10%+ of school days) and suspension rate, all
                students vs. the <Term>SWD</Term> subgroup. Descriptive, not evaluative.
              </>
            }
          />
          <div className="grid gap-3.5 lg:grid-cols-2">
            <MetricBars
              eyebrow="CHRONIC ABSENTEEISM"
              title="Days missed at a rate of 10% or more"
              swd={absSwd}
              all={absAll}
              max={40}
              focalLabel={<>Students with disabilities (<Term>SWD</Term>)</>}
              ariaLabel={`${s.name}: chronic absenteeism, all students vs SWD`}
              footnote={<>Source: <Term>CDE</Term> · 2024–25.</>}
            />
            <MetricBars
              eyebrow="SUSPENSION RATE"
              title="Share of students suspended at least once"
              swd={suspSwd}
              all={suspAll}
              max={15}
              focalLabel={<>Students with disabilities (<Term>SWD</Term>)</>}
              ariaLabel={`${s.name}: suspension rate, all students vs SWD`}
              footnote={<>Source: <Term>CDE</Term> · 2024–25.</>}
            />
          </div>
        </section>
      )}

      {/* Footer */}
      <div
        className="border-t border-[var(--rule)] pt-5 text-[12px] leading-[1.6] text-[var(--ink-soft)]"
      >
        Sources: CDE Special Education Enrollment by Program Setting, CDE Census Day
        Enrollment, California School Dashboard — all 2024–25. School CDS code{" "}
        <span style={{ fontFamily: "var(--font-mono)" }}>{s.cds_code}</span>.
        <div className="mt-2">
          <Link href={`/districts/${s.district_cds}`} className="font-medium" style={{ color: "var(--accent)" }}>
            ← Back to {s.district_name}
          </Link>
        </div>
      </div>
    </article>
  );
}
