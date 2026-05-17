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

  return (
    <div className="space-y-10">
      {/* HERO */}
      <header className="space-y-4 pt-2">
        <div
          className="flex items-center gap-2 text-[12px] font-medium text-[var(--ink-soft)]"
        >
          <span>An open data project</span>
          <span aria-hidden style={{ opacity: 0.5 }}>/</span>
          <span style={{ color: "var(--ink)", fontWeight: 600 }}>San Diego County · {profiles.length} districts</span>
        </div>
        <h1 className="text-[56px] font-bold leading-[0.95] tracking-[-0.035em] text-[var(--ink)]">
          California school districts, indexed for autism &amp; special education.
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
