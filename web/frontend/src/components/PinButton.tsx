"use client";

import { MAX_COMPARE } from "@/lib/compare";
import { useCompare } from "./CompareProvider";

/**
 * Pulse · PinButton — the "+ Compare" toggle that sits on every directory
 * card. Rendered as a sibling of the card's <Link> (never nested inside it)
 * so a click pins rather than navigates.
 *
 * States: unpinned · pinned (accent fill) · disabled (compare set is full).
 */
export function PinButton({ cds }: { cds: string }) {
  const { isPinned, toggle, canPin } = useCompare();
  const pinned = isPinned(cds);
  const disabled = !pinned && !canPin;
  const label = pinned ? "Pinned" : "Compare";

  return (
    <button
      type="button"
      onClick={() => toggle(cds)}
      disabled={disabled}
      aria-pressed={pinned}
      title={
        disabled
          ? `Compare holds ${MAX_COMPARE} districts — unpin one first`
          : pinned
            ? "Remove from compare"
            : "Add to compare"
      }
      className="inline-flex items-center gap-1 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] disabled:cursor-not-allowed disabled:opacity-40"
      style={{
        padding: "5px 9px",
        background: pinned ? "var(--accent)" : "var(--card)",
        color: pinned ? "#FFFFFF" : "var(--ink-soft)",
        border: `1px solid ${pinned ? "var(--accent)" : "var(--card-border)"}`,
        font: '600 9.5px/1 var(--font-mono)',
        letterSpacing: "0.08em",
        textTransform: "uppercase",
        cursor: disabled ? "not-allowed" : "pointer",
      }}
    >
      <span aria-hidden style={{ fontSize: "11px", lineHeight: 0 }}>
        {pinned ? "✓" : "+"}
      </span>
      {label}
    </button>
  );
}
