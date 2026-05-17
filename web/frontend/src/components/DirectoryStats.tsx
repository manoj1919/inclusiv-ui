import type { DistrictProfile } from "@/lib/types";
import { PeerDistribution } from "./charts/PeerDistribution";
import { SectionHead } from "./SectionHead";
import { StatTile } from "./StatTile";
import { Term } from "./Term";
import { buildPeerSummary } from "@/lib/peers";

/**
 * Topline counts + a peer-distribution strip that shows variation in autism
 * inclusion across the directory. Strictly descriptive — variation is not
 * a ranking, and the strip omits a "this district" marker on the home page.
 */
export function DirectoryStats({ profiles }: { profiles: DistrictProfile[] }) {
  const iepCounts = profiles
    .map((p) => p.enrollment?.students_with_iep?.value)
    .filter((v): v is number => typeof v === "number");
  const autismCounts = profiles
    .map((p) => p.enrollment?.students_with_autism?.value)
    .filter((v): v is number => typeof v === "number");
  const peers = buildPeerSummary(profiles);

  const sumIep = iepCounts.reduce((a, b) => a + b, 0);
  const sumAutism = autismCounts.reduce((a, b) => a + b, 0);
  const autismDist = peers.autism_inclusion;

  return (
    <section className="space-y-6">
      <SectionHead
        num="01"
        title="The shape of the data"
        sub="Counts across the pilot, and the spread of autism inclusion rates among the districts indexed so far."
      />

      <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile label="Districts indexed" value={profiles.length.toLocaleString()} />
        <StatTile
          focal
          label={<>Students with <Term>IEP</Term>s</>}
          value={sumIep.toLocaleString()}
          sub="Across all districts"
        />
        <StatTile
          focal
          label="Students with autism"
          value={sumAutism.toLocaleString()}
          sub="Across all districts"
        />
        {autismDist && (
          <StatTile
            label="Autism inclusion range"
            value={`${Math.round(autismDist.min * 100)}–${Math.round(autismDist.max * 100)}%`}
            sub={`Median ${Math.round(autismDist.median * 100)}% · 80%+ gen-ed`}
          />
        )}
      </div>

      {autismDist && (
        <PeerDistribution
          eyebrow={`2024–25 · ${autismDist.count} OF ${profiles.length} DISTRICTS REPORTING`}
          title="Time in general-education classrooms (80%+ of day)"
          dist={{
            ...autismDist,
            values: autismDist.values.map((v) => v * 100),
            min: autismDist.min * 100,
            q1: autismDist.q1 * 100,
            median: autismDist.median * 100,
            q3: autismDist.q3 * 100,
            max: autismDist.max * 100,
          }}
          ours={null}
          districtName=""
          domain={{ min: 0, max: 100 }}
          unit="%"
          ariaLabel={`Distribution of autism inclusion rates across ${autismDist.count} districts`}
          context={
            <span className="text-[12px] font-medium leading-[1.5] text-[var(--ink-mid)]">
              Each dot is one of {autismDist.count} districts. The shaded band is the middle 50%
              (<span className="tnum font-semibold text-[var(--ink)]">Q1–Q3</span>); the rule is
              the median. There is no &ldquo;right&rdquo; position — placements are decided one
              student at a time.
            </span>
          }
          footnote={
            <>
              <Term>SWD</Term> inclusion data sourced from CDE Special Education Enrollment by
              Program Setting · 2024–25.
            </>
          }
        />
      )}
    </section>
  );
}
