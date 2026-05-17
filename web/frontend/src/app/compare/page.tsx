import { Suspense } from "react";
import { CompareView } from "@/components/CompareView";
import { loadAllDistricts } from "@/lib/districts";
import { buildPeerSummary } from "@/lib/peers";

/**
 * /compare — side-by-side district comparison.
 *
 * The route is statically exported; the *selection* lives in the `?d=` query
 * string and is resolved client-side by CompareView (hence the Suspense
 * boundary required around `useSearchParams`). All district profiles and the
 * peer distributions are computed once here at build time and passed down.
 */
export const metadata = {
  title: "Compare districts — inclusiv·ui",
};

export default async function ComparePage() {
  const profiles = await loadAllDistricts();
  const peers = buildPeerSummary(profiles);

  return (
    <Suspense
      fallback={
        <div className="card px-6 py-8 text-[14px] text-[var(--ink-mid)]">
          Loading comparison…
        </div>
      }
    >
      <CompareView profiles={profiles} peers={peers} />
    </Suspense>
  );
}
