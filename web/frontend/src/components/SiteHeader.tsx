"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/**
 * Pulse · TopNav — 44px-tall horizontal bar on subtle-bg (#EFEAFB).
 * Logo lockup (22×22 accent square + word mark) · primary nav with active
 * underline · search pill (visual only, ⌘K-styled keycap) · 2024–25 mono tag.
 */
const NAV: { href: string; label: string }[] = [
  { href: "/", label: "Districts" },
  { href: "/glossary", label: "Glossary" },
];

export function SiteHeader() {
  const pathname = usePathname() ?? "/";
  const isActive = (href: string) =>
    href === "/" ? pathname === "/" || pathname.startsWith("/districts") : pathname.startsWith(href);

  return (
    <header
      className="flex items-center gap-[18px] px-[30px] py-3"
      style={{
        background: "var(--subtle-bg)",
        borderBottom: "1px solid var(--card-border)",
      }}
    >
      <Link href="/" className="flex items-center gap-2.5" aria-label="inclusiv·ui home">
        <span
          className="grid place-items-center"
          style={{
            width: 22,
            height: 22,
            borderRadius: 7,
            background: "var(--accent)",
          }}
        >
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: 999,
              background: "#ffffff",
            }}
          />
        </span>
        <span
          className="font-semibold tracking-[-0.01em] text-[14px] leading-none text-[var(--ink)]"
        >
          inclusiv<span style={{ color: "var(--accent)" }}>·</span>ui
        </span>
      </Link>

      <nav className="ml-[22px] flex gap-[22px]">
        {NAV.map((n) => {
          const active = isActive(n.href);
          return (
            <Link
              key={n.href}
              href={n.href}
              className="pb-[2px] text-[13px] font-medium leading-none transition-colors"
              style={{
                color: active ? "var(--ink)" : "var(--ink-soft)",
                borderBottom: active ? "1.5px solid var(--accent)" : "1.5px solid transparent",
              }}
            >
              {n.label}
            </Link>
          );
        })}
      </nav>

      <div className="ml-auto flex items-center gap-2.5">
        <Link
          href="/?focus=search"
          className="hidden items-center gap-2 rounded-full transition-colors hover:bg-[var(--card)] sm:flex"
          style={{
            background: "var(--card)",
            border: "1px solid var(--card-border)",
            padding: "7px 12px",
          }}
          aria-label="Search districts"
        >
          <span
            aria-hidden
            className="inline-block"
            style={{
              width: 12,
              height: 12,
              borderRadius: 999,
              border: "1.5px solid var(--ink-soft)",
            }}
          />
          <span className="text-[12px] font-medium leading-none text-[var(--ink-soft)]">
            Search districts
          </span>
          <span
            aria-hidden
            className="rounded-[4px] px-1 py-px text-[var(--ink-soft)]"
            style={{
              border: "1px solid var(--card-border)",
              font: '500 9px/1 var(--font-mono)',
            }}
          >
            ⌘K
          </span>
        </Link>
        <span
          className="text-[var(--ink-soft)]"
          style={{
            font: '500 11px/1 var(--font-mono)',
            letterSpacing: "0.08em",
          }}
        >
          2024–25
        </span>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer
      className="mt-14 px-[30px] py-10"
      style={{
        background: "var(--subtle-bg)",
        borderTop: "1px solid var(--card-border)",
      }}
    >
      <div className="grid gap-6 sm:grid-cols-3">
        <div>
          <div className="eyebrow mb-2">Data</div>
          <p className="text-[12.5px] leading-[1.55] text-[var(--ink-mid)]">
            CC0 1.0 (public domain). Sourced from California Department of Education and the
            California School Dashboard.
          </p>
        </div>
        <div>
          <div className="eyebrow mb-2">AI summaries</div>
          <p className="text-[12.5px] leading-[1.55] text-[var(--ink-mid)]">
            Always labeled. The underlying numbers come from public government data, not the
            language model. Verify before quoting.
          </p>
        </div>
        <div>
          <div className="eyebrow mb-2">Mission</div>
          <p className="text-[12.5px] leading-[1.55] text-[var(--ink-mid)]">
            Donation-supported. Never freemium. Informational only — verify with the district
            before placement decisions.
          </p>
        </div>
      </div>
      <div
        className="mt-8 pt-4 text-[10px] uppercase tracking-[0.14em] text-[var(--ink-soft)]"
        style={{ borderTop: "1px solid var(--rule)", fontFamily: "var(--font-mono)" }}
      >
        Code MIT · Data CC0 · inclusiv·ui
      </div>
    </footer>
  );
}
