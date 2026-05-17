import type { ReactNode } from "react";

/**
 * Pulse · MetricBars — paired horizontal bars with a hero number block.
 * The SWD/focal series leads as the hero numeral; All-students sits beside
 * as the comparison anchor with a delta pill. Direction (longer/shorter)
 * never implies good/bad — it is descriptive only.
 */

type Props = {
  eyebrow: ReactNode;
  title: ReactNode;
  /** Values are in the unit's natural scale, e.g. 28.1 for 28.1%. */
  swd: number | null;
  all: number | null;
  /** Axis maximum in the same unit. */
  max: number;
  unit?: string;
  /** Label for the focal series, default "Students with disabilities". */
  focalLabel?: ReactNode;
  ariaLabel: string;
  footnote?: ReactNode;
};

export function MetricBars({
  eyebrow,
  title,
  swd,
  all,
  max,
  unit = "%",
  focalLabel,
  ariaLabel,
  footnote,
}: Props) {
  const W = 520;
  const H = 96;
  const top = 20;
  const barH = 18;
  const gap = 14;
  const r = 6;
  const scale = (v: number) => (v / max) * W;

  const diff =
    swd !== null && all !== null ? Number((swd - all).toFixed(1)) : null;
  const sign = diff !== null && diff > 0 ? "+" : "";

  return (
    <figure className="card px-6 py-[22px]">
      <div className="eyebrow">{eyebrow}</div>
      <h3 className="mt-2 text-[17px] font-semibold leading-[1.25] tracking-[-0.005em] text-[var(--ink)]">
        {title}
      </h3>

      <div className="mt-[22px] grid grid-cols-[auto_1fr] items-end gap-7">
        <div>
          <div
            className="tnum text-[52px] font-bold leading-[0.95] tracking-[-0.035em] text-[var(--ink)]"
            style={{ fontFeatureSettings: '"tnum"' }}
          >
            {swd === null ? "—" : swd}
            <span className="text-[28px] font-semibold leading-none tracking-[-0.02em] text-[var(--ink-mid)]">
              {swd === null ? "" : unit}
            </span>
          </div>
          <div className="mt-1.5 max-w-[180px] text-[12px] font-medium leading-[1.3] text-[var(--ink-soft)]">
            {focalLabel ?? "Students with disabilities"}
          </div>
        </div>

        <div className="pb-1.5">
          <div className="flex items-baseline gap-2">
            <span
              className="tnum text-[22px] font-semibold leading-none tracking-[-0.02em] text-[var(--ink-mid)]"
              style={{ fontFeatureSettings: '"tnum"' }}
            >
              {all === null ? "—" : `${all}${unit}`}
            </span>
            <span className="eyebrow">All students</span>
          </div>
          {diff !== null && (
            <div
              className="mt-2 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium"
              style={{ background: "var(--tint)", color: "var(--accent)" }}
            >
              <span className="tnum">
                {sign}
                {diff} pts
              </span>
              <span className="opacity-70">vs. all students</span>
            </div>
          )}
        </div>
      </div>

      <svg
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label={ariaLabel}
        className="mt-[18px] block w-full"
        preserveAspectRatio="xMidYMid meet"
      >
        <title>{ariaLabel}</title>
        <line x1={0} y1={top - 8} x2={W} y2={top - 8} stroke="var(--rule)" />

        {/* All-students */}
        <rect x={0} y={top} width={W} height={barH} fill="var(--track-bg)" rx={r} />
        {all !== null && (
          <rect x={0} y={top} width={scale(all)} height={barH} fill="var(--baseline)" rx={r} />
        )}
        {all !== null && (
          <text
            x={scale(all) + 10}
            y={top + barH - 4}
            fill="var(--ink-mid)"
            style={{ font: '600 12px/1 var(--font-mono)' }}
          >
            {all}
            {unit}
          </text>
        )}

        {/* SWD */}
        <rect
          x={0}
          y={top + barH + gap}
          width={W}
          height={barH}
          fill="var(--track-bg)"
          rx={r}
        />
        {swd !== null && (
          <rect
            x={0}
            y={top + barH + gap}
            width={scale(swd)}
            height={barH}
            fill="var(--focal)"
            rx={r}
          />
        )}
        {swd !== null && (
          <text
            x={scale(swd) + 10}
            y={top + barH + gap + barH - 4}
            fill="var(--ink)"
            style={{ font: '600 12px/1 var(--font-mono)' }}
          >
            {swd}
            {unit}
          </text>
        )}

        {/* Axis ticks */}
        <text x={0} y={H - 4} className="micro" fill="var(--ink-soft)">
          0
        </text>
        <text x={W} y={H - 4} textAnchor="end" className="micro" fill="var(--ink-soft)">
          {max}
          {unit}
        </text>
      </svg>

      {footnote && (
        <div className="mt-[18px] border-t border-[var(--rule)] pt-3 text-[11.5px] leading-[1.4] text-[var(--ink-soft)]">
          {footnote}
        </div>
      )}
    </figure>
  );
}
