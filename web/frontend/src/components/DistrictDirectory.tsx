"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { DistrictProfile } from "@/lib/types";
import type { Bucket, DistrictScore, LensId } from "@/lib/lenses";
import { BUCKET_LABELS, LENSES } from "@/lib/lenses";
import { PinButton } from "./PinButton";

type Row = {
  cds: string;
  name: string;
  region: string;
  type: string;
  iep: number | null;
  autism: number | null;
  enroll: number | null;
};

function toRow(p: DistrictProfile): Row {
  return {
    cds: p.cds_code,
    name: p.name,
    region: p.region ?? "",
    type: p.district_type,
    iep: p.enrollment?.students_with_iep?.value ?? null,
    autism: p.enrollment?.students_with_autism?.value ?? null,
    enroll: p.enrollment?.total?.value ?? null,
  };
}

function fmt(v: number | null) {
  return v === null ? "—" : v.toLocaleString();
}

const BUCKET_DISPLAY_ORDER: Bucket[] = [
  "strong",
  "mixed",
  "moderate",
  "below",
  "insufficient",
];

export function DistrictDirectory({
  profiles,
  currentCds,
  activeLens = null,
  scoreByCds = null,
}: {
  profiles: DistrictProfile[];
  /** CDS code of the currently-viewed district, for the "you are here" tag. */
  currentCds?: string;
  /** When set, group cards by bucket and show a "matched on" line per card. */
  activeLens?: LensId | null;
  /** Precomputed lens scores indexed by CDS code (only for the active lens). */
  scoreByCds?: Map<string, DistrictScore> | null;
}) {
  const rows = useMemo(() => profiles.map(toRow), [profiles]);
  const [q, setQ] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return rows;
    return rows.filter(
      (r) =>
        r.name.toLowerCase().includes(needle) ||
        r.region.toLowerCase().includes(needle) ||
        r.type.toLowerCase().includes(needle),
    );
  }, [rows, q]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        inputRef.current?.focus();
        inputRef.current?.select();
      }
      if (e.key === "Escape" && document.activeElement === inputRef.current) {
        inputRef.current?.blur();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("focus") === "search") {
      inputRef.current?.focus();
      inputRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, []);

  // When a lens is active, group filtered rows by bucket (alphabetical within).
  const groups = useMemo(() => {
    if (!activeLens || !scoreByCds) return null;
    const out = new Map<Bucket, Row[]>();
    const sorted = [...filtered].sort((a, b) => a.name.localeCompare(b.name));
    for (const r of sorted) {
      const score = scoreByCds.get(r.cds);
      const bucket: Bucket = score?.bucket ?? "insufficient";
      const list = out.get(bucket) ?? [];
      list.push(r);
      out.set(bucket, list);
    }
    return BUCKET_DISPLAY_ORDER
      .filter((b) => (out.get(b)?.length ?? 0) > 0)
      .map((b) => ({ bucket: b, rows: out.get(b)! }));
  }, [filtered, activeLens, scoreByCds]);

  return (
    <div className="space-y-4">
      <div
        className="card flex items-center gap-2.5 px-3.5 py-2.5"
        style={{ boxShadow: "var(--shadow)" }}
      >
        <span
          aria-hidden
          className="inline-block"
          style={{
            width: 14,
            height: 14,
            borderRadius: 999,
            border: "1.5px solid var(--ink-soft)",
          }}
        />
        <input
          ref={inputRef}
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={`Search ${rows.length} districts in San Diego County…`}
          aria-label="Search districts"
          className="flex-1 bg-transparent text-[13px] font-medium leading-none text-[var(--ink)] placeholder:text-[var(--ink-soft)] focus:outline-none"
        />
        <span
          className="rounded-[4px] px-1.5 py-0.5 text-[var(--ink-soft)]"
          style={{
            border: "1px solid var(--card-border)",
            font: '500 10px/1 var(--font-mono)',
          }}
        >
          ⌘ K
        </span>
      </div>

      <div
        className="text-[var(--ink-soft)]"
        style={{
          font: '500 11px/1 var(--font-mono)',
          letterSpacing: "0.08em",
          textTransform: "uppercase",
        }}
      >
        {activeLens
          ? `${LENSES[activeLens].label} · ${filtered.length} of ${rows.length}`
          : `Showing ${filtered.length} of ${rows.length}`}
      </div>

      {groups ? (
        <div className="space-y-8">
          {groups.map(({ bucket, rows: groupRows }) => (
            <BucketGroup
              key={bucket}
              bucket={bucket}
              count={groupRows.length}
              rows={groupRows}
              currentCds={currentCds}
              scoreByCds={scoreByCds!}
            />
          ))}
        </div>
      ) : (
        <ul className="grid gap-3.5 sm:grid-cols-2">
          {filtered.map((r) => (
            <CardItem key={r.cds} row={r} currentCds={currentCds} matchedOn={null} />
          ))}
        </ul>
      )}
    </div>
  );
}

function BucketGroup({
  bucket,
  count,
  rows,
  currentCds,
  scoreByCds,
}: {
  bucket: Bucket;
  count: number;
  rows: Row[];
  currentCds?: string;
  scoreByCds: Map<string, DistrictScore>;
}) {
  return (
    <section>
      <div className="mb-3 flex items-baseline gap-3">
        <h3
          className="text-[15px] font-semibold tracking-[-0.005em] text-[var(--ink)]"
        >
          {BUCKET_LABELS[bucket]}
        </h3>
        <span
          className="text-[var(--ink-soft)]"
          style={{
            font: '500 11px/1 var(--font-mono)',
            letterSpacing: "0.08em",
          }}
        >
          {count}
        </span>
      </div>
      <ul className="grid gap-3.5 sm:grid-cols-2">
        {rows.map((r) => {
          const score = scoreByCds.get(r.cds);
          return (
            <CardItem
              key={r.cds}
              row={r}
              currentCds={currentCds}
              matchedOn={score ? { matched: score.matchedOn, weak: score.weakInput } : null}
            />
          );
        })}
      </ul>
    </section>
  );
}

/**
 * One directory entry: the navigable Card plus a PinButton rendered as a
 * sibling (never nested inside the Card's <Link>, so a pin click can't
 * trigger navigation). The pin is suppressed on the "you are here" card,
 * whose top-right corner is already taken by that tag.
 */
function CardItem({
  row,
  currentCds,
  matchedOn,
}: {
  row: Row;
  currentCds?: string;
  matchedOn: { matched: string[]; weak?: string } | null;
}) {
  const here = currentCds === row.cds;
  return (
    <li className="relative">
      <Card row={row} currentCds={currentCds} matchedOn={matchedOn} />
      {!here && (
        <div className="absolute right-3 top-3 z-10">
          <PinButton cds={row.cds} />
        </div>
      )}
    </li>
  );
}

function Card({
  row,
  currentCds,
  matchedOn,
}: {
  row: Row;
  currentCds?: string;
  matchedOn: { matched: string[]; weak?: string } | null;
}) {
  const here = currentCds === row.cds;
  return (
    <Link
      href={`/districts/${row.cds}`}
      className="card district-card relative block px-5 py-[18px]"
      style={{ borderColor: here ? "var(--accent)" : "var(--card-border)" }}
    >
      {here && (
        <span
          className="absolute right-3 top-3 rounded-full"
          style={{
            background: "var(--tint)",
            color: "var(--accent)",
            font: '600 10px/1 var(--font-mono)',
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            padding: "4px 8px",
          }}
        >
          you are here
        </span>
      )}
      <div
        className="text-[var(--ink-soft)]"
        style={{
          font: '500 11px/1 var(--font-mono)',
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          paddingRight: "5.5rem",
        }}
      >
        {row.type}
        {row.region && <> · {row.region}</>}
      </div>
      <div className="mt-2 text-[19px] font-semibold leading-[1.2] tracking-[-0.015em] text-[var(--ink)]">
        {row.name}
      </div>
      <dl
        className="mt-3.5 grid grid-cols-3 gap-6 pt-3.5"
        style={{ borderTop: "1px solid var(--rule)" }}
      >
        <DistStat k="Enroll" v={fmt(row.enroll)} />
        <DistStat k="IEPs" v={fmt(row.iep)} />
        <DistStat k="Autism" v={fmt(row.autism)} />
      </dl>
      {matchedOn && matchedOn.matched.length > 0 && (
        <div
          className="mt-3 pt-3 text-[11.5px] leading-[1.5] text-[var(--ink-mid)]"
          style={{ borderTop: "1px dashed var(--rule)" }}
        >
          <span
            className="mr-1.5 text-[var(--ink-soft)]"
            style={{
              font: '600 10px/1 var(--font-mono)',
              letterSpacing: "0.08em",
              textTransform: "uppercase",
            }}
          >
            Matched on
          </span>
          {matchedOn.matched.join(" · ")}
          {matchedOn.weak && (
            <div className="mt-1 text-[var(--ink-soft)]">
              <span
                className="mr-1.5"
                style={{
                  font: '600 10px/1 var(--font-mono)',
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                }}
              >
                But weak
              </span>
              {matchedOn.weak}
            </div>
          )}
        </div>
      )}
    </Link>
  );
}

function DistStat({ k, v }: { k: string; v: string }) {
  return (
    <div>
      <dt
        className="text-[var(--ink-soft)]"
        style={{
          font: '500 10px/1 var(--font-mono)',
          letterSpacing: "0.08em",
          textTransform: "uppercase",
        }}
      >
        {k}
      </dt>
      <dd
        className="tnum mt-1.5 text-[16px] font-semibold leading-none tracking-[-0.015em] text-[var(--ink)]"
        style={{ fontFeatureSettings: '"tnum"' }}
      >
        {v}
      </dd>
    </div>
  );
}
