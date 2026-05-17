import type { ReactNode } from "react";

/**
 * Pulse · DFSDivergence — distance-from-standard, two metric blocks
 * side-by-side (ELA / Math) sharing one axis ledger. Bars extend left
 * (negative) or right (positive) from a center zero line. **Same color in
 * both directions** — direction itself encodes the signal, never quality.
 */

export type DFSRow = {
  label: ReactNode;
  all: number | null;
  swd: number | null;
};

type Props = {
  eyebrow: ReactNode;
  title: ReactNode;
  rows: DFSRow[];
  range?: number;
  ariaLabel: string;
  footnote?: ReactNode;
};

export function DFSDivergence({
  eyebrow,
  title,
  rows,
  range = 100,
  ariaLabel,
  footnote,
}: Props) {
  return (
    <figure className="card px-6 py-[22px]" aria-label={ariaLabel}>
      <div className="eyebrow">{eyebrow}</div>
      <h3 className="mt-2 text-[17px] font-semibold leading-[1.25] tracking-[-0.005em] text-[var(--ink)]">
        {title}
      </h3>

      <div
        className="mt-6 grid gap-5"
        style={{ gridTemplateColumns: `repeat(${rows.length}, 1fr)` }}
      >
        {rows.map((r, i) => (
          <DFSBlock
            key={i}
            {...r}
            range={range}
            ariaLabel={
              typeof r.label === "string"
                ? `${r.label}: all students ${r.all ?? "n/a"}, SWD ${r.swd ?? "n/a"} (points from grade-level)`
                : `Distance from standard: all ${r.all ?? "n/a"}, SWD ${r.swd ?? "n/a"}`
            }
          />
        ))}
      </div>

      {/* Shared axis ledger */}
      <div
        className="mt-4 flex items-center justify-between rounded-[10px] px-3 py-2.5"
        style={{ background: "var(--subtle-bg)" }}
      >
        <span
          className="text-[var(--ink-soft)]"
          style={{
            font: '500 11px/1 var(--font-mono)',
            letterSpacing: "0.06em",
          }}
        >
          −{range} BELOW
        </span>
        <span
          className="text-[var(--ink-mid)]"
          style={{
            font: '600 11px/1 var(--font-mono)',
            letterSpacing: "0.06em",
          }}
        >
          0 · GRADE LEVEL
        </span>
        <span
          className="text-[var(--ink-soft)]"
          style={{
            font: '500 11px/1 var(--font-mono)',
            letterSpacing: "0.06em",
          }}
        >
          +{range} ABOVE
        </span>
      </div>

      {footnote && (
        <div className="mt-[18px] border-t border-[var(--rule)] pt-3 text-[11.5px] leading-[1.4] text-[var(--ink-soft)]">
          {footnote}
        </div>
      )}
    </figure>
  );
}

function DFSBlock({
  label,
  all,
  swd,
  range,
  ariaLabel,
}: DFSRow & { range: number; ariaLabel?: string }) {
  const W = 240;
  const H = 92;
  const padX = 8;
  const barH = 14;
  const gap = 10;
  const innerW = W - padX * 2;
  const center = padX + innerW / 2;
  const r = Math.min(barH / 2, 6);
  const scaleW = (v: number) => Math.abs((v / range) * (innerW / 2));

  const drawBar = (v: number | null, y: number, color: string) => {
    if (v === null) return null;
    const w = scaleW(v);
    const xPos = v < 0 ? center - w : center;
    return <rect x={xPos} y={y} width={w} height={barH} rx={r} fill={color} />;
  };

  return (
    <div>
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

      <div className="mt-3 flex items-baseline gap-2.5">
        <span
          className="tnum text-[36px] font-bold leading-none tracking-[-0.035em] text-[var(--ink)]"
          style={{ fontFeatureSettings: '"tnum"' }}
        >
          {swd === null ? "—" : `${swd > 0 ? "+" : ""}${swd}`}
        </span>
        <span
          className="text-[var(--ink-soft)]"
          style={{
            font: '500 11px/1 var(--font-mono)',
            letterSpacing: "0.06em",
            textTransform: "uppercase",
          }}
        >
          pts · SWD
        </span>
      </div>
      <div className="mt-1 text-[12px] font-medium leading-[1.4] text-[var(--ink-mid)]">
        All students:{" "}
        <span className="tnum font-semibold text-[var(--ink)]">
          {all === null ? "—" : `${all > 0 ? "+" : ""}${all}`}
        </span>{" "}
        pts
      </div>

      <svg
        viewBox={`0 0 ${W} ${H}`}
        width="100%"
        className="mt-3 block"
        preserveAspectRatio="xMidYMid meet"
        role="img"
        aria-label={ariaLabel}
      >
        {ariaLabel && <title>{ariaLabel}</title>}
        <rect x={padX} y={18} width={innerW} height={barH} fill="var(--track-bg)" rx={r} />
        <rect
          x={padX}
          y={18 + barH + gap}
          width={innerW}
          height={barH}
          fill="var(--track-bg)"
          rx={r}
        />
        {drawBar(all, 18, "var(--baseline)")}
        {drawBar(swd, 18 + barH + gap, "var(--focal)")}
        <line
          x1={center}
          y1={10}
          x2={center}
          y2={18 + barH * 2 + gap + 8}
          stroke="var(--ink)"
          strokeWidth={1.5}
        />
        <text
          x={padX}
          y={18 + barH - 4 + barH + gap + 18}
          fill="var(--ink-soft)"
          className="micro"
        >
          ALL · SWD
        </text>
      </svg>
    </div>
  );
}
