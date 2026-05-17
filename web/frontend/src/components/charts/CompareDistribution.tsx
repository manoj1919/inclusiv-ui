import type { ReactNode } from "react";
import type { Distribution } from "@/lib/peers";

/**
 * Pulse · CompareDistribution — one peer strip shared by several districts.
 *
 * The peer cloud, Q1–Q3 band, and median rule are drawn once; each compared
 * district gets a color-coded marker. Markers that would collide are lifted
 * into stacked lanes with a stem back to the axis. Strictly descriptive —
 * position shows where a district sits among peers, not a rank.
 */

export type CompareMarker = {
  cds: string;
  name: string;
  color: string;
  /** Value in chart units (already scaled), or null when not reported. */
  value: number | null;
};

type Props = {
  eyebrow: ReactNode;
  title: ReactNode;
  dist: Distribution;
  markers: CompareMarker[];
  domain: { min: number; max: number };
  unit?: string;
  ariaLabel: string;
  footnote?: ReactNode;
};

export function CompareDistribution({
  eyebrow,
  title,
  dist,
  markers,
  domain,
  unit = "%",
  ariaLabel,
  footnote,
}: Props) {
  const W = 560;
  const padX = 16;
  const innerW = W - padX * 2;
  const x = (v: number) =>
    padX + ((v - domain.min) / (domain.max - domain.min || 1)) * innerW;

  // Lane assignment — sort present markers by x, bump to a higher lane when
  // the previous marker in a lane is within MIN_GAP pixels.
  const MIN_GAP = 30;
  const present = markers
    .filter((m): m is CompareMarker & { value: number } => m.value !== null)
    .map((m) => ({ ...m, px: x(m.value) }))
    .sort((a, b) => a.px - b.px);
  const laneLastX: number[] = [];
  const placed = present.map((m) => {
    let lane = 0;
    while (lane < laneLastX.length && m.px - laneLastX[lane] < MIN_GAP) lane++;
    laneLastX[lane] = m.px;
    return { ...m, lane };
  });
  const laneCount = Math.max(laneLastX.length, 1);

  const laneH = 16;
  const base = 30 + (laneCount - 1) * laneH; // axis y, leaves room for lanes
  const H = base + 38;
  const peerR = 3.5;

  const ticks = [domain.min, (domain.min + domain.max) / 2, domain.max];

  return (
    <figure className="card px-6 py-[22px]">
      <div className="eyebrow">{eyebrow}</div>
      <h3 className="mt-2 text-[16px] font-semibold leading-[1.25] tracking-[-0.005em] text-[var(--ink)]">
        {title}
      </h3>

      <svg
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label={ariaLabel}
        className="mt-4 block w-full"
        preserveAspectRatio="xMidYMid meet"
      >
        <title>{ariaLabel}</title>

        {/* Q1–Q3 band */}
        <rect
          x={x(dist.q1)}
          y={base - 13}
          width={x(dist.q3) - x(dist.q1)}
          height={26}
          rx={13}
          fill="var(--band)"
        />

        {/* axis baseline */}
        <line
          x1={padX}
          y1={base + 15}
          x2={padX + innerW}
          y2={base + 15}
          stroke="var(--rule)"
        />

        {/* peer dots */}
        {dist.values.map((v, i) => (
          <circle key={i} cx={x(v)} cy={base} r={peerR} fill="var(--peer-dot)" />
        ))}

        {/* median tick */}
        <line
          x1={x(dist.median)}
          y1={base - 17}
          x2={x(dist.median)}
          y2={base + 17}
          stroke="var(--median)"
          strokeWidth={1.75}
        />
        <text
          x={x(dist.median)}
          y={base + 30}
          textAnchor="middle"
          fill="var(--ink-soft)"
          className="micro"
        >
          MEDIAN
        </text>

        {/* district markers — stacked into lanes with a stem to the axis */}
        {placed.map((m) => {
          const my = base - 16 - m.lane * laneH;
          return (
            <g key={m.cds}>
              <line
                x1={m.px}
                y1={my}
                x2={m.px}
                y2={base}
                stroke={m.color}
                strokeWidth={1.5}
              />
              <circle cx={m.px} cy={base} r={6.5} fill="var(--card)" />
              <circle cx={m.px} cy={base} r={4.5} fill={m.color} />
              <circle cx={m.px} cy={my} r={7} fill={m.color} />
              <text
                x={m.px}
                y={my + 2.5}
                textAnchor="middle"
                fill="#FFFFFF"
                style={{
                  font: '700 8px/1 var(--font-mono)',
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {Math.round(m.value)}
              </text>
            </g>
          );
        })}

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

      {/* legend — color → district → exact value */}
      <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5">
        {markers.map((m) => (
          <li key={m.cds} className="flex items-baseline gap-1.5">
            <span
              aria-hidden
              className="inline-block shrink-0 translate-y-[1px]"
              style={{
                width: 9,
                height: 9,
                borderRadius: 999,
                background: m.color,
              }}
            />
            <span className="text-[12px] font-medium leading-[1.3] text-[var(--ink-mid)]">
              {m.name}
            </span>
            <span
              className="tnum text-[var(--ink)]"
              style={{
                font: '600 11px/1 var(--font-mono)',
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {m.value === null ? "—" : `${m.value.toFixed(1)}${unit}`}
            </span>
          </li>
        ))}
      </ul>

      {footnote && (
        <div className="mt-[16px] border-t border-[var(--rule)] pt-3 text-[11.5px] leading-[1.4] text-[var(--ink-soft)]">
          {footnote}
        </div>
      )}
    </figure>
  );
}
