/**
 * NotMeasured — the closure-principle UX commitment.
 *
 * Per docs/framework.md, dimensions of Structure / Process / Outcome that
 * cannot be measured from public data are shown explicitly, not hidden.
 * This component renders a labeled list of "not currently measured" items
 * for a given chapter so the absence is visible and the framework's
 * epistemic limits are part of the UI, not a footnote.
 */

export type NotMeasuredItem = {
  label: string;
  why: string;
};

export function NotMeasured({
  title = "Not currently measured from public data",
  items,
}: {
  title?: string;
  items: NotMeasuredItem[];
}) {
  if (items.length === 0) return null;
  return (
    <div
      className="card px-5 py-4"
      style={{ background: "var(--subtle-bg)", boxShadow: "none" }}
    >
      <div className="eyebrow" style={{ color: "var(--ink-soft)" }}>
        {title}
      </div>
      <ul className="mt-2.5 space-y-1.5 text-[12.5px] leading-[1.5] text-[var(--ink-mid)]">
        {items.map((it, i) => (
          <li key={i} className="flex gap-2">
            <span aria-hidden style={{ color: "var(--ink-soft)" }}>—</span>
            <span>
              <span className="font-medium text-[var(--ink)]">{it.label}.</span>{" "}
              <span className="text-[var(--ink-soft)]">{it.why}</span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
