import { loadAllDistricts } from "@/lib/districts";
import { DistrictDirectory } from "@/components/DistrictDirectory";
import { DirectoryStats } from "@/components/DirectoryStats";

export default async function Home() {
  const profiles = await loadAllDistricts();
  return (
    <div className="space-y-8">
      <section>
        <h1 className="text-3xl font-bold tracking-tight">
          California school districts, indexed for autism & special education
        </h1>
        <p className="mt-2 max-w-3xl text-zinc-600 dark:text-zinc-400">
          A neutral, open-data directory. Every number on this site is sourced from a public
          California government dataset and dated. Narrative summaries are AI-generated and clearly
          labeled.
        </p>
        <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-500">
          Current coverage: San Diego County (42 districts). Next: SoCal, then statewide.
        </p>
      </section>
      <DirectoryStats profiles={profiles} />
      <DistrictDirectory profiles={profiles} />
    </div>
  );
}
