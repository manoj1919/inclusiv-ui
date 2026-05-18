"use client";

import { useEffect, useState } from "react";

/**
 * Pulse · ChapterTabs — segmented control with scroll-spy.
 * Wrapper: subtle-bg, padding 4, radius 14. Each tab is flex-equal.
 * Active tab gets card bg + border + radius 10 + tiny inline shadow.
 *
 * Active state tracks scroll position via IntersectionObserver. We pick the
 * topmost section whose top edge has crossed below the (sticky) nav. Clicking
 * a tab updates the URL hash and lets the browser handle smooth scroll.
 */
export type Chapter = {
  /** "01", "02", … or "—" for non-numbered sections like "Directory". */
  n: string;
  id: string;
  label: string;
  /** Small caption under the label (e.g., "2 charts", "AI · labeled"). */
  count?: string;
};

export function SectionNav({
  sections,
  activeId: activeIdProp,
}: {
  sections: Chapter[];
  /** Override scroll-spy with a fixed active id (useful for SSR/initial paint). */
  activeId?: string;
}) {
  const [active, setActive] = useState<string>(
    activeIdProp ?? sections[0]?.id ?? "",
  );

  useEffect(() => {
    if (activeIdProp) return;
    const ids = sections.map((s) => s.id);
    const nodes = ids
      .map((id) => document.getElementById(id))
      .filter((n): n is HTMLElement => n !== null);
    if (nodes.length === 0) return;

    // Track which sections are currently intersecting and pick the topmost.
    const visible = new Map<string, number>();

    const update = () => {
      // Pick the section whose top is closest to (but not past) the nav bottom.
      let candidate: { id: string; top: number } | null = null;
      for (const node of nodes) {
        const rect = node.getBoundingClientRect();
        // 120px = approx height of header + sticky offset.
        if (rect.top - 120 <= 0) {
          if (!candidate || rect.top > candidate.top) {
            candidate = { id: node.id, top: rect.top };
          }
        }
      }
      if (candidate) setActive(candidate.id);
      else setActive(ids[0]);
    };

    const obs = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          visible.set(entry.target.id, entry.intersectionRatio);
        }
        update();
      },
      { rootMargin: "-120px 0px -50% 0px", threshold: [0, 0.25, 0.5, 1] },
    );
    nodes.forEach((n) => obs.observe(n));

    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => {
      obs.disconnect();
      window.removeEventListener("scroll", update);
    };
  }, [sections, activeIdProp]);

  return (
    <nav
      className="z-10 my-[22px] flex flex-wrap gap-1 sm:sticky sm:top-0 sm:flex-nowrap"
      style={{
        background: "var(--subtle-bg)",
        borderRadius: "var(--radius)",
        padding: 4,
      }}
      aria-label="Chapters"
    >
      {sections.map((c) => {
        const isActive = c.id === active;
        return (
          <a
            key={c.id}
            href={`#${c.id}`}
            onClick={() => setActive(c.id)}
            aria-current={isActive ? "true" : undefined}
            className="flex-1"
            style={{
              minWidth: 104,
              padding: "10px 14px",
              background: isActive ? "var(--card)" : "transparent",
              border: `1px solid ${isActive ? "var(--card-border)" : "transparent"}`,
              borderRadius: "var(--radius-sm)",
              boxShadow: isActive ? "0 1px 2px rgba(0,0,0,0.04)" : "none",
              transition: "background 150ms ease, border-color 150ms ease, box-shadow 150ms ease",
            }}
          >
            <div className="flex items-baseline gap-2">
              <span
                style={{
                  font: '600 10px/1 var(--font-mono)',
                  color: isActive ? "var(--accent)" : "var(--ink-soft)",
                  transition: "color 150ms ease",
                }}
              >
                {c.n}
              </span>
              <span
                className="text-[13px] font-semibold leading-none tracking-[-0.005em]"
                style={{
                  color: isActive ? "var(--ink)" : "var(--ink-mid)",
                  transition: "color 150ms ease",
                }}
              >
                {c.label}
              </span>
            </div>
            {c.count && (
              <div
                className="mt-1.5 text-[11px] font-normal leading-[1.3]"
                style={{ color: "var(--ink-soft)" }}
              >
                {c.count}
              </div>
            )}
          </a>
        );
      })}
    </nav>
  );
}
