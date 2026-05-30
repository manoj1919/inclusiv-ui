import Link from "next/link";
import { notFound } from "next/navigation";
import { AISummary } from "@/components/AISummary";
import { CompliancePanel } from "@/components/CompliancePanel";
import { NotMeasured } from "@/components/NotMeasured";
import { ProgramsPanel } from "@/components/ProgramsPanel";
import { SectionHead } from "@/components/SectionHead";
import { SectionNav, type Chapter } from "@/components/SectionNav";
import { SourcesPanel } from "@/components/SourcesPanel";
import { StaffingPanel } from "@/components/StaffingPanel";
import { StatTile } from "@/components/StatTile";
import { Term } from "@/components/Term";
import { DFSDivergence } from "@/components/charts/DFSDivergence";
import { MetricBars } from "@/components/charts/MetricBars";
import { PeerDistribution } from "@/components/charts/PeerDistribution";
import { listDistrictCdsCodes, loadAllDistricts, loadDistrict } from "@/lib/districts";
import { loadSchoolsForDistrict } from "@/lib/schools";
import { num } from "@/lib/format";
import { buildPeerSummary } from "@/lib/peers";

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

  const all = await loadAllDistricts();
  const schools = await loadSchoolsForDistrict(cds);
  const peers = buildPeerSummary(all);

  // Population context.
  const enroll = profile.enrollment ?? {};
  const ai = profile.ai_summaries ?? {};
  const totalEnroll = enroll.total?.value ?? null;
  const iepValue = enroll.students_with_iep?.value ?? null;
  const autismValue = enroll.students_with_autism?.value ?? null;
  const iepPct = enroll.pct_iep?.value != null ? enroll.pct_iep.value * 100 : null;
  const autismPct = enroll.pct_autism?.value != null ? enroll.pct_autism.value * 100 : null;
  const autismShareOfIep =
    autismValue !== null && iepValue ? (autismValue / iepValue) * 100 : null;

  // PROCESS — Least Restrictive Environment (SPP Indicator 5).
  const lre = profile.process?.lre ?? {};
  const autismIncl = lre.lre_80pct_plus_gen_ed_autism?.value ?? null;
  const swdIncl = lre.lre_80pct_plus_gen_ed_all_disabilities?.value ?? null;
  const autismSep = lre.lre_separate_setting_autism?.value ?? null;

  // OUTCOME — academics (SPP Indicator 3).
  const ac = profile.outcome?.academics ?? {};
  const elaAll = ac.ela_distance_from_standard_all?.value ?? null;
  const elaSwd = ac.ela_distance_from_standard_swd?.value ?? null;
  const mathAll = ac.math_distance_from_standard_all?.value ?? null;
  const mathSwd = ac.math_distance_from_standard_swd?.value ?? null;

  // OUTCOME — behavior (SPP Indicator 4 + chronic absenteeism).
  const beh = profile.outcome?.behavior ?? {};
  const absAll = beh.chronic_absenteeism_rate_all?.value ?? null;
  const absSwd = beh.chronic_absenteeism_rate_swd?.value ?? null;
  const suspAll = beh.suspension_rate_all?.value ?? null;
  const suspSwd = beh.suspension_rate_swd?.value ?? null;

  // Pulse charts take values in natural % scale (28.1 not 0.281).
  const to100 = (v: number | null) => (v === null ? null : v * 100);
  const absAllN = to100(absAll);
  const absSwdN = to100(absSwd);
  const suspAllN = to100(suspAll);
  const suspSwdN = to100(suspSwd);

  const dfsValues = [elaAll, elaSwd, mathAll, mathSwd].filter(
    (v): v is number => typeof v === "number",
  );
  const dfsExtreme = dfsValues.length
    ? Math.max(...dfsValues.map((v) => Math.abs(v)))
    : 60;
  const dfsRange = Math.max(60, Math.ceil((dfsExtreme + 10) / 10) * 10);

  // Three Donabedian chapters + Overview wrapper + Sources + Schools appendix.
  // The chapter count is fixed at three forever; see docs/framework.md
  // for the closure principle.
  const chapters: Chapter[] = [
    { n: "—", id: "overview", label: "Overview", count: "AI summary" },
    { n: "01", id: "structure", label: "Structure", count: "What's in place" },
    { n: "02", id: "process", label: "Process", count: "What happens" },
    { n: "03", id: "outcome", label: "Outcome", count: "What results" },
    { n: "—", id: "sources", label: "Sources", count: "Datasets" },
    { n: "—", id: "schools", label: "Schools", count: `${schools.length} schools` },
  ];

  // Peer scaling — PeerDistribution expects natural-scale values.
  const inclusionDist = peers.autism_inclusion
    ? {
        ...peers.autism_inclusion,
        values: peers.autism_inclusion.values.map((v) => v * 100),
        min: peers.autism_inclusion.min * 100,
        q1: peers.autism_inclusion.q1 * 100,
        median: peers.autism_inclusion.median * 100,
        q3: peers.autism_inclusion.q3 * 100,
        max: peers.autism_inclusion.max * 100,
      }
    : null;

  return (
    <article className="space-y-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 pt-1 text-[12px] font-medium text-[var(--ink-soft)]">
        <Link href="/" className="hover:text-[var(--accent)]">
          Districts
        </Link>
        <span aria-hidden style={{ opacity: 0.5 }}>/</span>
        <span>{profile.county} County</span>
        <span aria-hidden style={{ opacity: 0.5 }}>/</span>
        <span style={{ color: "var(--ink)", fontWeight: 600 }}>{profile.name}</span>
      </div>

      {/* Page header */}
      <header
        className="grid gap-6"
        style={{ gridTemplateColumns: "1fr auto", alignItems: "end" }}
      >
        <div>
          <h1 className="text-[56px] font-bold leading-[0.95] tracking-[-0.035em] text-[var(--ink)]">
            {profile.name}
          </h1>
          <p className="mt-3.5 max-w-[580px] text-[16px] leading-[1.55] text-[var(--ink-mid)]">
            {profile.district_type} district in {profile.county} County
            {totalEnroll && (
              <>
                {" "}serving{" "}
                <span className="tnum font-semibold text-[var(--ink)]">
                  {totalEnroll.toLocaleString()}
                </span>{" "}
                students
              </>
            )}
            .
            {iepValue && (
              <>
                {" "}Roughly{" "}
                <span className="tnum font-semibold text-[var(--ink)]">
                  {iepValue.toLocaleString()}
                </span>{" "}
                have an active <Term>IEP</Term>
                {autismValue ? (
                  <>
                    , of which{" "}
                    <span className="tnum font-semibold text-[var(--ink)]">
                      {autismValue.toLocaleString()}
                    </span>{" "}
                    have a primary <Term>ASD</Term> eligibility.
                  </>
                ) : (
                  <>.</>
                )}
              </>
            )}
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2">
          <Pill>2024–25</Pill>
          <Pill>{profile.district_type}</Pill>
          <Pill mono>{profile.cds_code}</Pill>
        </div>
      </header>

      {/* KPI Grid (population context — not quality measures) */}
      <section className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile
          label="Enrollment"
          value={num(totalEnroll)}
          sub={totalEnroll ? "students · 2024–25" : undefined}
        />
        <StatTile
          focal
          label={<>With disabilities (<Term>IEP</Term>)</>}
          value={num(iepValue)}
          sub={iepPct !== null ? `${iepPct.toFixed(1)}% of total` : undefined}
        />
        <StatTile
          focal
          label={<>Autism (<Term>ASD</Term>)</>}
          value={num(autismValue)}
          sub={autismPct !== null ? `${autismPct.toFixed(1)}% of total` : undefined}
        />
        <StatTile
          label="Autism · share of IEPs"
          value={autismShareOfIep === null ? "—" : `${autismShareOfIep.toFixed(0)}%`}
          sub={
            autismShareOfIep === null
              ? undefined
              : <>of the <Term>IEP</Term> population</>
          }
        />
      </section>

      <SectionNav sections={chapters} />

      {/* Overview — AI summary if available */}
      <section id="overview" className="scroll-mt-24 space-y-5">
        <SectionHead
          num="—"
          title="In brief"
          sub={
            <>
              An AI-generated summary of this district&apos;s special-education enrollment,
              inclusion patterns, and outcome indicators. Verify before quoting.
            </>
          }
        />
        {ai.overview ? (
          <AISummary summary={ai.overview} />
        ) : (
          <EmptyCard>
            No AI overview generated for this district yet. The chapters below are still authoritative.
          </EmptyCard>
        )}
      </section>

      {/* ============================================================== */}
      {/* CHAPTER 01 — STRUCTURE: what the district has in place            */}
      {/* ============================================================== */}
      <section id="structure" className="scroll-mt-24 space-y-5">
        <SectionHead
          num="01"
          title="Structure"
          sub={
            <>
              What this district has <strong>in place</strong> to deliver
              special education: staffing density, named programs, and
              related services. Donabedian&apos;s Structure layer — the
              precondition for service quality. See{" "}
              <Link href="/glossary" className="font-medium" style={{ color: "var(--accent)" }}>
                framework
              </Link>{" "}
              for the closure principle that fixes this chapter set at three.
            </>
          }
        />

        <StaffingPanel
          profile={profile}
          pupilServicesPer1k={peers.pupil_services_per_1k_students}
          teachersPer100Iep={peers.teachers_per_100_iep}
          pupilServicesPer100Iep={peers.pupil_services_per_100_iep}
        />

        <ProgramsPanel profile={profile} />

        <NotMeasured
          items={[
            {
              label: "Special‑education teachers, SLPs, OTs, BCBAs by role",
              why: "CDE discontinued the granular CBEDS Staff Assignment file after 2018-19; the per-role district counts are no longer published.",
            },
            {
              label: "Special‑education expenditure per SWD",
              why: "Available in SACS unaudited actuals — not yet ingested.",
            },
            {
              label: "FCMAT and CDE compliance review findings",
              why: "FCMAT publishes reviews per district in PDF form — not yet scraped.",
            },
            {
              label: "Staff turnover and retention",
              why: "Sometimes appears in LCAP narratives, not in a structured statewide file.",
            },
            {
              label: "Caseload ratios (students per SLP, students per OT)",
              why: "Only inferable when both role counts and IEP receipts are published; uneven district-by-district.",
            },
          ]}
        />
      </section>

      {/* ============================================================== */}
      {/* CHAPTER 02 — PROCESS: what happens during service delivery        */}
      {/* ============================================================== */}
      <section id="process" className="scroll-mt-24 space-y-5">
        <SectionHead
          num="02"
          title="Process"
          sub={
            <>
              What this district <strong>does</strong> with that structure:
              where students with disabilities spend the day and how formal
              disputes are reaching agencies. Donabedian&apos;s Process layer.
            </>
          }
        />

        {/* Placement — SPP Indicator 5 */}
        {inclusionDist ? (
          <PeerDistribution
            eyebrow={<>
              2024–25 · <Term>SWD</Term> · {inclusionDist.count} OF {all.length} DISTRICTS REPORTING
            </>}
            title="Autism — time in general-education classrooms (80%+ of day)"
            dist={inclusionDist}
            ours={autismIncl === null ? null : autismIncl * 100}
            districtName={profile.name}
            domain={{ min: 0, max: 100 }}
            unit="%"
            ariaLabel={`${profile.name}: autism inclusion rate compared with ${inclusionDist.count} peer districts`}
            footnote={
              <>
                Each dot is one district&apos;s autism inclusion rate. The marker shows where{" "}
                {profile.name} sits — not a rank. High inclusion is{" "}
                <strong>not</strong> the same as good program — tiny rural districts often have
                very high inclusion percentages because they don&apos;t have specialized
                placement options. Source: <Term>CDE</Term> SPED-PS · 2024–25.
              </>
            }
          />
        ) : (
          <EmptyCard>Peer set unavailable — too few districts reporting comparable values.</EmptyCard>
        )}

        <div className="grid gap-3.5 sm:grid-cols-2">
          <StatTile
            focal
            label="All SWD · 80%+ gen-ed"
            value={swdIncl === null ? "—" : `${Math.round(swdIncl * 100)}%`}
            sub={<>Includes autism and every other <Term>SWD</Term> category.</>}
          />
          <StatTile
            focal
            label="Autism · separate setting"
            value={autismSep === null ? "—" : `${(autismSep * 100).toFixed(1)}%`}
            sub="Self-contained classroom or separate school for most of the day."
          />
        </div>

        {/* Disputes — process volume measure */}
        <CompliancePanel profile={profile} />

        <NotMeasured
          items={[
            {
              label: "Parent‑involvement survey (SPP Indicator 8)",
              why: "CDE publishes statewide rollups; district‑level access requires CDE Special Education Division contact and is not yet ingested.",
            },
            {
              label: "Secondary‑transition IEPs with measurable post‑secondary goals (SPP Indicator 13)",
              why: "CDE compliance‑monitoring data; not yet ingested.",
            },
            {
              label: "Preschool LRE (SPP Indicator 6)",
              why: "CDE DataQuest district‑level; not yet ingested.",
            },
            {
              label: "Service intensity (minutes/week of OT/PT/SLP per student)",
              why: "Typically only in district plans, not state datasets.",
            },
          ]}
        />
      </section>

      {/* ============================================================== */}
      {/* CHAPTER 03 — OUTCOME: what results for students                   */}
      {/* ============================================================== */}
      <section id="outcome" className="scroll-mt-24 space-y-5">
        <SectionHead
          num="03"
          title="Outcome"
          sub={
            <>
              What <strong>results</strong> for students with disabilities — academic proficiency
              and behavior. Donabedian&apos;s Outcome layer. Read the gap to{" "}
              <em>all students</em>, not the absolute level, since district baselines vary
              dramatically.
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
          ariaLabel={`${profile.name}: ELA and math Distance From Standard for all students vs SWD subgroup`}
          footnote={
            <>
              The gap between the all‑students line and the SWD subgroup is what the framework
              calls the within‑district outcome disparity. Same color extends in both directions
              — direction encodes the signal (above vs. below grade level), not quality. Source:
              California School Dashboard · 2024–25.
            </>
          }
        />

        <div className="grid gap-3.5 lg:grid-cols-2">
          <MetricBars
            eyebrow="CHRONIC ABSENTEEISM"
            title="Days missed at a rate of 10% or more"
            swd={absSwdN === null ? null : Number(absSwdN.toFixed(1))}
            all={absAllN === null ? null : Number(absAllN.toFixed(1))}
            max={40}
            focalLabel={<>Students with disabilities (<Term>SWD</Term>)</>}
            ariaLabel={`${profile.name}: chronic absenteeism, all students vs SWD`}
            footnote={
              <>
                A higher rate is not evaluated as worse — it is descriptive. Source:{" "}
                <Term>CDE</Term> · 2024–25.
              </>
            }
          />
          <MetricBars
            eyebrow="SUSPENSION RATE"
            title="Share of students suspended at least once"
            swd={suspSwdN === null ? null : Number(suspSwdN.toFixed(1))}
            all={suspAllN === null ? null : Number(suspAllN.toFixed(1))}
            max={15}
            focalLabel={<>Students with disabilities (<Term>SWD</Term>)</>}
            ariaLabel={`${profile.name}: suspension rate, all students vs SWD`}
            footnote={
              <>
                Direction (longer/shorter bar) is descriptive, not evaluative. Source:{" "}
                <Term>CDE</Term> · 2024–25.
              </>
            }
          />
        </div>

        {ai.what_this_means_for_parents && (
          <AISummary summary={ai.what_this_means_for_parents} />
        )}

        <NotMeasured
          items={[
            {
              label: "Graduation rate for SWD (SPP Indicator 1)",
              why: "CDE DataQuest district‑level; not yet ingested.",
            },
            {
              label: "Dropout rate for SWD (SPP Indicator 2)",
              why: "CDE DataQuest district‑level; not yet ingested.",
            },
            {
              label: "Post‑school employment / education / training (SPP Indicator 14)",
              why: "CDE publishes district aggregates with a one‑year delay; not yet ingested.",
            },
            {
              label: "Disproportionate representation by race/ethnicity (SPP Indicators 9, 10)",
              why: "CDE special‑education data files; not yet ingested.",
            },
            {
              label: "Individual progress on IEP goals",
              why: "Not measurable from public data — only the IEP team and family know.",
            },
          ]}
        />
      </section>

      {/* Sources appendix */}
      <section id="sources" className="scroll-mt-24 space-y-5">
        <SectionHead
          num="—"
          title="Sources & dates"
          sub="Every number on this page traces to a public California or federal dataset. Click to expand full provenance with as-of dates."
        />
        <SourcesPanel profile={profile} />
      </section>

      {/* Schools appendix */}
      <section id="schools" className="scroll-mt-24 space-y-5">
        <SectionHead
          num="—"
          title="Schools in this district"
          sub={
            <>
              Each school&apos;s profile covers all students with disabilities
              (<Term>SWD</Term>) — inclusion, outcomes, enrollment. Autism-specific data is
              reported at the district level only (above).
            </>
          }
        />
        {schools.length === 0 ? (
          <EmptyCard>No school-level records for this district.</EmptyCard>
        ) : (
          <ul className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
            {schools.map((sc) => (
              <li key={sc.cds_code}>
                <Link
                  href={`/schools/${sc.cds_code}`}
                  className="card district-card block px-4 py-3"
                >
                  <div className="text-[14px] font-semibold leading-[1.3] text-[var(--ink)]">
                    {sc.name}
                  </div>
                  <div className="mt-1 text-[11.5px] leading-[1.4] text-[var(--ink-soft)]">
                    {sc.enrollment?.students_with_iep?.value != null
                      ? `${sc.enrollment.students_with_iep.value.toLocaleString()} students with disabilities`
                      : "—"}
                    {sc.charter && " · charter"}
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </article>
  );
}

function Pill({ children, mono = false }: { children: React.ReactNode; mono?: boolean }) {
  return (
    <span
      className="inline-flex items-center rounded-full"
      style={{
        background: "var(--card)",
        border: "1px solid var(--card-border)",
        padding: "7px 14px",
        font: mono
          ? '500 11px/1 var(--font-mono)'
          : '500 12px/1 var(--font-sans)',
        color: "var(--ink-mid)",
        letterSpacing: mono ? "0.06em" : "-0.005em",
      }}
    >
      {children}
    </span>
  );
}

function EmptyCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="card px-6 py-5 text-[14px] leading-[1.55] text-[var(--ink-mid)]">
      {children}
    </div>
  );
}
