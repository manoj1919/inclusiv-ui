import type { ReactNode } from "react";

/**
 * Pulse · SectionHead — "§ 02" prefix in mono accent, 22px title, optional
 * 13.5px subhead. Repeats above each chapter on the district page.
 */
export function SectionHead({
  num,
  title,
  sub,
}: {
  /** "01", "02", … or "—" for non-chapters like "Directory". */
  num: string;
  title: ReactNode;
  sub?: ReactNode;
}) {
  return (
    <header className="mb-[14px] mt-8">
      <div className="flex items-baseline gap-2.5">
        <span
          style={{
            font: '600 11px/1 var(--font-mono)',
            color: "var(--accent)",
            letterSpacing: "0.1em",
          }}
        >
          § {num}
        </span>
        <h2 className="text-[22px] font-bold leading-[1.1] tracking-[-0.02em] text-[var(--ink)]">
          {title}
        </h2>
      </div>
      {sub && (
        <p className="mt-1.5 max-w-[720px] text-[13.5px] leading-[1.5] text-[var(--ink-mid)]">
          {sub}
        </p>
      )}
    </header>
  );
}
