import Link from "next/link";
import { notFound } from "next/navigation";
import { AISummary } from "@/components/AISummary";
import { SectionHead } from "@/components/SectionHead";
import { SectionNav, type Chapter } from "@/components/SectionNav";
import { SourcesPanel } from "@/components/SourcesPanel";
import { StatTile } from "@/components/StatTile";
import { Term } from "@/components/Term";
import { DFSDivergence } from "@/components/charts/DFSDivergence";
import { MetricBars } from "@/components/charts/MetricBars";
import { PeerDistribution } from "@/components/charts/PeerDistribution";
import { listDistrictCdsCodes, loadAllDistricts, loadDistrict } from "@/lib/districts";
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
  const peers = buildPeerSummary(all);

  const enroll = profile.enrollment ?? {};
  const incl = profile.inclusion_metrics ?? {};
  const outc = profile.outcome_metrics ?? {};
  const ai = profile.ai_summaries ?? {};
  const totalEnroll = enroll.total?.value ?? null;
  const iepValue = enroll.students_with_iep?.value ?? null;
  const autismValue = enroll.students_with_autism?.value ?? null;
  const iepPct =
    iepValue !== null && totalEnroll ? (iepValue / totalEnroll) * 100 : null;
  const autismPct =
    autismValue !== null && totalEnroll ? (autismValue / totalEnroll) * 100 : null;
  const autismShareOfIep =
    autismValue !== null && iepValue ? (autismValue / iepValue) * 100 : null;

  const autismIncl = incl.lre_80pct_plus_gen_ed_autism?.value ?? null;
  const swdIncl = incl.lre_80pct_plus_gen_ed_all_disabilities?.value ?? null;
  const autismSep = incl.lre_separate_setting_autism?.value ?? null;

  const elaAll = outc.ela_distance_from_standard_all?.value ?? null;
  const elaSwd = outc.ela_distance_from_standard_swd?.value ?? null;
  const mathAll = outc.math_distance_from_standard_all?.value ?? null;
  const mathSwd = outc.math_distance_from_standard_swd?.value ?? null;

  const absAll = outc.chronic_absenteeism_rate_all?.value ?? null;
  const absSwd = outc.chronic_absenteeism_rate_swd?.value ?? null;
  const suspAll = outc.suspension_rate_all?.value ?? null;
  const suspSwd = outc.suspension_rate_swd?.value ?? null;

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

  const chapters: Chapter[] = [
    { n: "01", id: "overview", label: "Overview", count: "AI summary" },
    { n: "02", id: "inclusion", label: "Inclusion", count: "1 chart · 2 stats" },
    { n: "03", id: "academic", label: "Academics", count: "ELA + Math" },
    { n: "04", id: "behavior", label: "Discipline", count: "2 charts" },
    { n: "05", id: "summary", label: "Summary", count: "AI summary" },
    { n: "06", id: "sources", label: "Sources", count: "Datasets" },
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

      {/* KPI Grid */}
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

      {/* 01 — Overview */}
      <section id="overview" className="scroll-mt-24 space-y-5">
        <SectionHead
          num="01"
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
            No AI overview generated for this district yet. The numbers below are still authoritative.
          </EmptyCard>
        )}
      </section>

      {/* 02 — Inclusion */}
      <section id="inclusion" className="scroll-mt-24 space-y-5">
        <SectionHead
          num="02"
          title="Where do autistic students spend the day?"
          sub={
            <>
              Federal law (<Term>IDEA</Term>) favors the regular classroom whenever appropriate.
              The standard reporting threshold is whether a student is in a regular classroom for
              at least 80% of the school day.
            </>
          }
        />
        {inclusionDist ? (
          <PeerDistribution
            eyebrow={<>
              2024–25 · <Term>SWD</Term> · {inclusionDist.count} OF {all.length} DISTRICTS REPORTING
            </>}
            title="Time in general-education classrooms (80%+ of day)"
            dist={inclusionDist}
            ours={autismIncl === null ? null : autismIncl * 100}
            districtName={profile.name}
            domain={{ min: 0, max: 100 }}
            unit="%"
            ariaLabel={`${profile.name}: autism inclusion rate compared with ${inclusionDist.count} peer districts`}
            footnote={
              <>
                Each dot is one district&apos;s autism inclusion rate. The marker shows where{" "}
                {profile.name} sits — not a rank. Source: <Term>CDE</Term> Special Education
                Enrollment by Program Setting · 2024–25.
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
      </section>

      {/* 03 — Academics */}
      <section id="academic" className="scroll-mt-24 space-y-5">
        <SectionHead
          num="03"
          title="How are students doing on state assessments?"
          sub={
            <>
              <Term>DFS</Term> (Distance From Standard) is the California School Dashboard&apos;s
              grade-level measure. Zero is at grade level; positive is above, negative is below.
              The gap between &ldquo;All students&rdquo; and the <Term>SWD</Term> subgroup is the
              within-district disparity.
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
              Same color extends in both directions — direction encodes the signal (above vs.
              below grade level), not quality. Source: California School Dashboard · 2024–25.
            </>
          }
        />
      </section>

      {/* 04 — Discipline */}
      <section id="behavior" className="scroll-mt-24 space-y-5">
        <SectionHead
          num="04"
          title="How often are students absent or suspended?"
          sub={
            <>
              Chronic absenteeism is missing 10% or more of school days (about 18 days). The gap
              between the <Term>SWD</Term> subgroup and all students reflects whether supports are
              working for disabled students in this district.
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
      </section>

      {/* 05 — Summary */}
      <section id="summary" className="scroll-mt-24 space-y-5">
        <SectionHead
          num="05"
          title="What this might mean for parents"
          sub="Always labeled, always paired with a verification note. Editorial review is recommended before quoting."
        />
        {ai.what_this_means_for_parents ? (
          <AISummary summary={ai.what_this_means_for_parents} />
        ) : (
          <EmptyCard>
            No interpretive AI summary generated for this district yet — only the source data is
            available above.
          </EmptyCard>
        )}
      </section>

      {/* 06 — Sources */}
      <section id="sources" className="scroll-mt-24 space-y-5">
        <SectionHead
          num="06"
          title="Sources & dates"
          sub="Every number on this page traces to a public California or federal dataset. Click to expand full provenance with as-of dates."
        />
        <SourcesPanel profile={profile} />
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
