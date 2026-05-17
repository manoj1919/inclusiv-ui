import type { ReactNode } from "react";

/**
 * Pulse · KPI — 11px mono uppercase label, 32px tabular value, 12px sub.
 * Set `focal` to add a 3px violet stripe flush against the left edge
 * (used for SWD- and Autism-related tiles). Strictly descriptive — the
 * stripe denotes category, not quality.
 */
export function StatTile({
  label,
  value,
  sub,
  provenance,
  focal = false,
}: {
  label: ReactNode;
  value: ReactNode;
  sub?: ReactNode;
  provenance?: string;
  focal?: boolean;
}) {
  return (
    <div
      className="card relative overflow-hidden px-5 py-[18px]"
      title={provenance}
    >
      {focal && (
        <span
          aria-hidden
          className="absolute left-0 top-0 h-full"
          style={{ width: 3, background: "var(--focal)" }}
        />
      )}
      <div
        className="text-[var(--ink-soft)]"
        style={{
          font: '500 11px/1 var(--font-mono)',
          letterSpacing: "0.08em",
          textTransform: "uppercase",
        }}
      >
        {label}
      </div>
      <div
        className="tnum mt-[14px] text-[32px] font-bold leading-none tracking-[-0.03em] text-[var(--ink)]"
        style={{ fontFeatureSettings: '"tnum"' }}
      >
        {value}
      </div>
      {sub && (
        <div className="mt-1.5 text-[12px] leading-[1.3] text-[var(--ink-mid)]">{sub}</div>
      )}
    </div>
  );
}
