import type { ReactNode } from "react";
import type { Distribution } from "@/lib/peers";

/**
 * Pulse · PeerDistribution — peer strip with a hero number, a soft Q1–Q3
 * pill, individual peer dots, a labeled median rule, and a prominent
 * "this district" marker (hot pink). Strictly descriptive: not a rank.
 */

type Props = {
  eyebrow: ReactNode;
  title: ReactNode;
  dist: Distribution;
  /** This district's value in chart units (e.g., 58 for 58%). */
  ours: number | null;
  /** Axis domain. If omitted, derives from dist. */
  domain?: { min: number; max: number };
  unit?: string;
  /** This district's display name (shown under the marker dot). */
  districtName: string;
  ariaLabel: string;
  footnote?: ReactNode;
  /** Optional override of the contextual right-column sentence. */
  context?: ReactNode;
};

export function PeerDistribution({
  eyebrow,
  title,
  dist,
  ours,
  domain,
  unit = "%",
  districtName,
  ariaLabel,
  footnote,
  context,
}: Props) {
  const W = 520;
  const H = 130;
  const padX = 14;
  const top = 60;
  const base = top + 14;
  const innerW = W - padX * 2;

  const xmin = domain?.min ?? Math.min(0, dist.min);
  const xmax = domain?.max ?? Math.max(100, dist.max);
  const x = (v: number) => padX + ((v - xmin) / (xmax - xmin || 1)) * innerW;

  const ticks = [xmin, (xmin + xmax) / 2, xmax];
  const peerR = 4;
  const ourR = 9;

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
            {ours === null ? "—" : Math.round(ours)}
            <span className="text-[28px] font-semibold leading-none tracking-[-0.02em] text-[var(--ink-mid)]">
              {ours === null ? "" : unit}
            </span>
          </div>
          <div className="mt-1.5 text-[12px] font-medium leading-[1.3] text-[var(--ink-soft)]">
            {districtName}
          </div>
        </div>
        <div className="pb-1.5">
          {context ?? (
            <div className="text-[12px] font-medium leading-[1.5] text-[var(--ink-mid)]">
              Peer median is{" "}
              <span className="tnum font-semibold text-[var(--ink)]">
                {Math.round(dist.median)}
                {unit}
              </span>
              . The middle half of districts falls between{" "}
              <span className="tnum font-semibold text-[var(--ink)]">
                {Math.round(dist.q1)}
                {unit}
              </span>{" "}
              and{" "}
              <span className="tnum font-semibold text-[var(--ink)]">
                {Math.round(dist.q3)}
                {unit}
              </span>
              .
            </div>
          )}
        </div>
      </div>

      <svg
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label={ariaLabel}
        className="mt-6 block w-full"
        preserveAspectRatio="xMidYMid meet"
      >
        <title>{ariaLabel}</title>

        {/* Q1–Q3 band */}
        <rect
          x={x(dist.q1)}
          y={base - 16}
          width={x(dist.q3) - x(dist.q1)}
          height={32}
          rx={16}
          fill="var(--band)"
        />

        {/* axis baseline */}
        <line
          x1={padX}
          y1={base + 18}
          x2={padX + innerW}
          y2={base + 18}
          stroke="var(--rule)"
        />

        {/* peer dots */}
        {dist.values.map((v, i) => (
          <circle key={i} cx={x(v)} cy={base} r={peerR} fill="var(--peer-dot)" />
        ))}

        {/* median tick + label */}
        <line
          x1={x(dist.median)}
          y1={base - 22}
          x2={x(dist.median)}
          y2={base + 22}
          stroke="var(--median)"
          strokeWidth={2}
        />
        <text
          x={x(dist.median)}
          y={base - 26}
          textAnchor="middle"
          fill="var(--median)"
          style={{ font: '600 10px/1 var(--font-mono)', letterSpacing: "0.08em" }}
        >
          MEDIAN
        </text>

        {/* this-district marker — only if value is present */}
        {ours !== null && (
          <g>
            <circle cx={x(ours)} cy={base} r={ourR + 4} fill="var(--card)" />
            <circle cx={x(ours)} cy={base} r={ourR} fill="var(--marker)" />
            <line
              x1={x(ours)}
              y1={base - ourR - 6}
              x2={x(ours)}
              y2={base - 22}
              stroke="var(--marker)"
              strokeWidth={1.5}
            />
            <g transform={`translate(${x(ours)}, ${base + 38})`}>
              <text
                textAnchor="middle"
                fill="var(--marker)"
                style={{ font: '700 11px/1 var(--font-sans)', letterSpacing: "0.02em" }}
              >
                {districtName}
              </text>
              <text
                textAnchor="middle"
                y={14}
                fill="var(--ink)"
                style={{
                  font: '600 11px/1 var(--font-mono)',
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {Math.round(ours)}
                {unit}
              </text>
            </g>
          </g>
        )}

        {/* axis ticks */}
        {ticks.map((v, i) => (
          <text
            key={i}
            x={x(v)}
            y={H - 4}
            textAnchor={i === 0 ? "start" : i === ticks.length - 1 ? "end" : "middle"}
            fill="var(--ink-soft)"
            className="micro"
          >
            {Math.round(v)}
            {unit}
          </text>
        ))}
      </svg>

      {footnote && (
        <div className="mt-[18px] border-t border-[var(--rule)] pt-3 text-[11.5px] leading-[1.4] text-[var(--ink-soft)]">
          {footnote}
        </div>
      )}
    </figure>
  );
}
