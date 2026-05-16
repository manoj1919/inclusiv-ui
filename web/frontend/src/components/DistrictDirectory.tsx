"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { DistrictProfile } from "@/lib/types";
import { pct, num } from "@/lib/format";

type Row = {
  cds: string;
  name: string;
  region: string;
  type: string;
  iep: number | null;
  autism: number | null;
  inclusionAutism: number | null;
};

function toRow(p: DistrictProfile): Row {
  return {
    cds: p.cds_code,
    name: p.name,
    region: p.region ?? "",
    type: p.district_type,
    iep: p.enrollment?.students_with_iep?.value ?? null,
    autism: p.enrollment?.students_with_autism?.value ?? null,
    inclusionAutism: p.inclusion_metrics?.lre_80pct_plus_gen_ed_autism?.value ?? null,
  };
}

/**
 * Client-side searchable district directory. Filtering happens in the browser
 * since the dataset is small (10 today, ~226 SoCal eventually).
 */
export function DistrictDirectory({ profiles }: { profiles: DistrictProfile[] }) {
  const rows = useMemo(() => profiles.map(toRow), [profiles]);
  const [q, setQ] = useState("");
  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return rows;
    return rows.filter(
      (r) => r.name.toLowerCase().includes(needle) || r.region.toLowerCase().includes(needle),
    );
  }, [rows, q]);

  return (
    <div>
      <input
        type="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search by district or region…"
        className="mb-4 w-full rounded-md border border-zinc-300 bg-white px-4 py-2 text-sm shadow-sm focus:border-zinc-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900"
      />
      <div className="text-xs text-zinc-500 mb-2 dark:text-zinc-500">
        {filtered.length} of {rows.length} districts
      </div>
      <ul className="grid gap-3 sm:grid-cols-2">
        {filtered.map((r) => (
          <li key={r.cds}>
            <Link
              href={`/districts/${r.cds}`}
              className="block rounded-lg border border-zinc-200 bg-white p-4 transition hover:border-zinc-400 hover:shadow-sm dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-600"
            >
              <div className="flex items-baseline justify-between gap-3">
                <h2 className="font-semibold text-zinc-900 dark:text-zinc-100">{r.name}</h2>
                <span className="text-xs text-zinc-500 dark:text-zinc-500">{r.cds}</span>
              </div>
              <div className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">
                {r.region} • {r.type}
              </div>
              <dl className="mt-3 grid grid-cols-3 gap-2 text-xs">
                <div>
                  <dt className="text-zinc-500 dark:text-zinc-500">IEP students</dt>
                  <dd className="font-mono font-semibold tabular-nums">{num(r.iep)}</dd>
                </div>
                <div>
                  <dt className="text-zinc-500 dark:text-zinc-500">Autism</dt>
                  <dd className="font-mono font-semibold tabular-nums">{num(r.autism)}</dd>
                </div>
                <div>
                  <dt className="text-zinc-500 dark:text-zinc-500">Autism in gen-ed 80%+</dt>
                  <dd className="font-mono font-semibold tabular-nums">{pct(r.inclusionAutism)}</dd>
                </div>
              </dl>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
