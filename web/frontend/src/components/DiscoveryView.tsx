"use client";

import { useMemo, useState } from "react";
import type { DistrictProfile } from "@/lib/types";
import type { DistrictScore, LensId } from "@/lib/lenses";
import { DistrictDirectory } from "./DistrictDirectory";
import { LensPicker } from "./LensPicker";

/**
 * Pulse · DiscoveryView — owns the active-lens state for the home page and
 * threads it through both the LensPicker (UI) and the DistrictDirectory
 * (cards). All lens scoring happens at build time on the server; we receive
 * `scoresByLens` as a prop and just look up the current selection here.
 */
export function DiscoveryView({
  profiles,
  scoresByLens,
}: {
  profiles: DistrictProfile[];
  scoresByLens: Record<LensId, DistrictScore[]>;
}) {
  const [active, setActive] = useState<LensId | null>(null);

  const scoreByCds = useMemo(() => {
    if (!active) return null;
    const map = new Map<string, DistrictScore>();
    for (const s of scoresByLens[active]) map.set(s.cds, s);
    return map;
  }, [active, scoresByLens]);

  return (
    <div className="space-y-6">
      <LensPicker active={active} onChange={setActive} />
      <DistrictDirectory
        profiles={profiles}
        activeLens={active}
        scoreByCds={scoreByCds}
      />
    </div>
  );
}
