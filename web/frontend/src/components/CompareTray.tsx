"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { buildCompareHref } from "@/lib/compare";
import { useCompare } from "./CompareProvider";

/**
 * Pulse · CompareTray — floating bottom-right tray summarizing the pinned
 * districts with a route into /compare. Mounted globally in the root layout.
 *
 * Hidden when nothing is pinned, before hydration, or while already on the
 * /compare page (the page itself carries the same controls there).
 */
export function CompareTray({ names }: { names: Record<string, string> }) {
  const { pinned, hydrated, remove, clear } = useCompare();
  const pathname = usePathname() ?? "/";

  if (!hydrated || pinned.length === 0 || pathname.startsWith("/compare")) {
    return null;
  }

  const canCompare = pinned.length >= 2;

  return (
    <div
      className="card fixed bottom-5 right-5 z-50 w-[260px] p-3.5"
      style={{ boxShadow: "var(--shadow)" }}
      role="region"
      aria-label="Compare tray"
    >
      <div className="flex items-baseline justify-between">
        <span
          className="text-[var(--ink-soft)]"
          style={{
            font: '600 10px/1 var(--font-mono)',
            letterSpacing: "0.1em",
            textTransform: "uppercase",
          }}
        >
          Compare · {pinned.length} pinned
        </span>
        <button
          type="button"
          onClick={clear}
          className="text-[var(--ink-soft)] transition-colors hover:text-[var(--accent)]"
          style={{ font: '500 11px/1 var(--font-sans)' }}
        >
          Clear
        </button>
      </div>

      <ul className="mt-2.5 flex flex-col gap-1.5">
        {pinned.map((cds) => (
          <li
            key={cds}
            className="flex items-center gap-2 rounded-[8px] px-2 py-1.5"
            style={{ background: "var(--subtle-bg)" }}
          >
            <span className="flex-1 truncate text-[12px] font-medium leading-[1.3] text-[var(--ink)]">
              {names[cds] ?? cds}
            </span>
            <button
              type="button"
              onClick={() => remove(cds)}
              aria-label={`Remove ${names[cds] ?? cds} from compare`}
              className="shrink-0 text-[var(--ink-soft)] transition-colors hover:text-[var(--accent)]"
              style={{ font: '500 13px/1 var(--font-sans)' }}
            >
              ×
            </button>
          </li>
        ))}
      </ul>

      <Link
        href={buildCompareHref(pinned)}
        aria-disabled={!canCompare}
        tabIndex={canCompare ? undefined : -1}
        onClick={(e) => {
          if (!canCompare) e.preventDefault();
        }}
        className="mt-2.5 flex items-center justify-center rounded-full transition-opacity"
        style={{
          padding: "9px 14px",
          background: "var(--accent)",
          color: "#FFFFFF",
          font: '600 12px/1 var(--font-sans)',
          letterSpacing: "-0.005em",
          opacity: canCompare ? 1 : 0.45,
          pointerEvents: canCompare ? "auto" : "none",
        }}
      >
        {canCompare ? "Compare →" : "Pin at least 2"}
      </Link>
    </div>
  );
}
