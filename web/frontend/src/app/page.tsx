import { loadAllDistricts } from "@/lib/districts";
import { DiscoveryView } from "@/components/DiscoveryView";
import { DirectoryStats } from "@/components/DirectoryStats";
import { SectionHead } from "@/components/SectionHead";
import { Term } from "@/components/Term";
import { applyLens, LENS_ORDER, type DistrictScore, type LensId } from "@/lib/lenses";

export default async function Home() {
  const profiles = await loadAllDistricts();

  const scoresByLens = Object.fromEntries(
    LENS_ORDER.map((id) => [id, applyLens(profiles, id)]),
  ) as Record<LensId, DistrictScore[]>;

  // Phase-3 staging banner — only renders when most profiles are outside SD County.
  const sdCount = profiles.filter((p) => p.county_code === "37").length;
  const isStaging = sdCount < profiles.length;

  return (
    <div className="space-y-10">
      {/* STAGING BANNER — Phase 3 SoCal expansion, uneven data quality across counties */}
      {isStaging && (
        <div
          className="card px-5 py-4 text-[13px] leading-[1.55]"
          style={{
            background: "var(--subtle-bg)",
            borderLeft: "3px solid var(--accent)",
            boxShadow: "none",
          }}
        >
          <div className="eyebrow" style={{ color: "var(--accent)" }}>
            Staging preview · Phase 3 expansion
          </div>
          <p className="mt-2 text-[var(--ink-mid)]">
            All {profiles.length} traditional districts across 7 Southern California counties
            (Imperial, Los Angeles, Orange, Riverside, San Bernardino, San Diego, Ventura).
            <strong className="text-[var(--ink)]">
              {" "}Only San Diego County ({sdCount} districts) has hand-collected program
              details, AI summaries, and per-school pages
            </strong>{" "}
            so far — the other 6 counties carry core data only:{" "}
            <Term>CDE</Term> <Term>SPED</Term>-PS counts and inclusion (<Term>LRE</Term>),
            California School Dashboard outcomes (<Term>DFS</Term>, absenteeism, suspension),
            and federal compliance (<Term>OCR</Term> + <Term>OAH</Term>). Feedback welcome.
          </p>
        </div>
      )}

      {/* HERO */}
      <header className="space-y-4 pt-2">
        <div
          className="flex items-center gap-2 text-[12px] font-medium text-[var(--ink-soft)]"
        >
          <span>An open data project</span>
          <span aria-hidden style={{ opacity: 0.5 }}>/</span>
          <span style={{ color: "var(--ink)", fontWeight: 600 }}>
            {isStaging
              ? `Southern California · ${profiles.length} districts`
              : `San Diego County · ${profiles.length} districts`}
          </span>
        </div>
        <h1 className="text-[56px] font-bold leading-[0.95] tracking-[-0.035em] text-[var(--ink)]">
          {isStaging
            ? <>Southern California school districts, indexed for autism &amp; special education.</>
            : <>San Diego County school districts, indexed for autism &amp; special education.</>}
        </h1>
        <p className="max-w-[640px] text-[16px] leading-[1.55] text-[var(--ink-mid)]">
          A neutral, open-data directory. Every number on this site is sourced from a public
          California government dataset and dated. Narrative summaries are AI-generated and clearly
          labeled. Nothing here ranks districts — placement decisions are made one student at a
          time.
        </p>
      </header>

      <DirectoryStats profiles={profiles} />

      <section>
        <SectionHead
          num="—"
          title="Directory"
          sub={
            <>
              Pick a lens to see which districts to look at first, or browse alphabetically. Each
              card opens a full profile with <Term>SWD</Term> inclusion, academic{" "}
              <Term>DFS</Term>, and discipline metrics.
            </>
          }
        />
        <div className="mt-6">
          <DiscoveryView profiles={profiles} scoresByLens={scoresByLens} />
        </div>
      </section>
    </div>
  );
}
