"use client";

import { LENSES, LENS_ORDER, type LensId } from "@/lib/lenses";

/**
 * Pulse · LensPicker — a row of toggle chips for the discovery lenses, plus
 * the active lens description and a "Why this list?" disclosure exposing the
 * recipe (inputs, weights, direction, limitations).
 *
 * Lenses are *named preferences*, not rankings. The active chip is filled
 * but no chip is positioned as "better" — order is editorial, not evaluative.
 */
export function LensPicker({
  active,
  onChange,
}: {
  active: LensId | null;
  onChange: (id: LensId | null) => void;
}) {
  const activeLens = active ? LENSES[active] : null;
  return (
    <div className="space-y-3">
      <div
        className="text-[var(--ink-soft)]"
        style={{
          font: '500 11px/1 var(--font-mono)',
          letterSpacing: "0.08em",
          textTransform: "uppercase",
        }}
      >
        Which districts to look at first?
      </div>
      <div className="flex flex-wrap gap-2">
        <Chip selected={active === null} onClick={() => onChange(null)}>
          Show all
        </Chip>
        {LENS_ORDER.map((id) => (
          <Chip
            key={id}
            selected={active === id}
            onClick={() => onChange(active === id ? null : id)}
          >
            {LENSES[id].label}
          </Chip>
        ))}
      </div>

      {activeLens && (
        <details className="card group px-5 py-4">
          <summary
            className="-mx-2 flex cursor-pointer list-none items-start gap-2 rounded-[8px] px-2 py-1 transition-colors hover:bg-[var(--subtle-bg)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
          >
            <span
              aria-hidden
              className="mt-0.5 inline-block transition-transform group-open:rotate-90"
              style={{ color: "var(--accent)" }}
            >
              ›
            </span>
            <span className="flex-1">
              <span className="block text-[14px] font-medium leading-[1.45] text-[var(--ink)]">
                {activeLens.description}
              </span>
              <span
                className="mt-1 inline-block"
                style={{
                  font: '500 11px/1 var(--font-mono)',
                  letterSpacing: "0.06em",
                  color: "var(--ink-soft)",
                  textTransform: "uppercase",
                }}
              >
                Why this list?
              </span>
            </span>
          </summary>

          <div
            className="mt-3 pt-3"
            style={{ borderTop: "1px solid var(--rule)" }}
          >
            <div
              className="text-[var(--ink-soft)]"
              style={{
                font: '500 10px/1 var(--font-mono)',
                letterSpacing: "0.08em",
                textTransform: "uppercase",
              }}
            >
              Recipe
            </div>
            <ul className="mt-2 space-y-1.5">
              {activeLens.inputs.map((inp) => (
                <li
                  key={inp.id}
                  className="flex items-baseline gap-3 text-[12.5px] leading-[1.45] text-[var(--ink-mid)]"
                >
                  <span
                    className="tnum shrink-0 text-[var(--ink)]"
                    style={{
                      font: '600 11px/1 var(--font-mono)',
                      width: "2.75rem",
                    }}
                  >
                    {Math.round(inp.weight * 100)}%
                  </span>
                  <span className="flex-1">{inp.label}</span>
                  <span
                    className="shrink-0 text-[var(--ink-soft)]"
                    style={{
                      font: '500 10px/1 var(--font-mono)',
                      letterSpacing: "0.06em",
                      textTransform: "uppercase",
                    }}
                  >
                    {inp.direction === "higher" ? "higher = fit" : "lower = fit"}
                  </span>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-[12px] leading-[1.5] text-[var(--ink-soft)]">
              <span
                className="mr-1.5"
                style={{
                  font: '600 10px/1 var(--font-mono)',
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  color: "var(--ink-soft)",
                }}
              >
                Limits
              </span>
              {activeLens.limitations}
            </p>
            <p
              className="mt-2 text-[11.5px] leading-[1.5]"
              style={{ color: "var(--ink-soft)" }}
            >
              Each input is converted to a peer-percentile (0–100) before
              weighting. Districts are grouped into qualitative buckets — within
              a bucket, order is alphabetical, never by score.
            </p>
          </div>
        </details>
      )}
    </div>
  );
}

function Chip({
  selected,
  onClick,
  children,
}: {
  selected: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className="rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
      style={{
        display: "inline-flex",
        alignItems: "center",
        minHeight: 44,
        padding: "10px 16px",
        background: selected ? "var(--accent)" : "var(--card)",
        color: selected ? "#FFFFFF" : "var(--ink-mid)",
        border: `1px solid ${selected ? "var(--accent)" : "var(--card-border)"}`,
        font: '500 12.5px/1 var(--font-sans)',
        letterSpacing: "-0.005em",
        cursor: "pointer",
        touchAction: "manipulation",
      }}
    >
      {children}
    </button>
  );
}
