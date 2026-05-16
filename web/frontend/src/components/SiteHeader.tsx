import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="border-b border-zinc-200 bg-white/80 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/80">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
        <Link href="/" className="text-lg font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          inclusiv-ui
        </Link>
        <span className="text-xs text-zinc-500 dark:text-zinc-500">
          California school districts • autism &amp; special ed
        </span>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-zinc-200 bg-zinc-50 py-8 text-sm text-zinc-600 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-400">
      <div className="mx-auto max-w-5xl space-y-2 px-6">
        <p>
          Data: CC0 1.0 (public domain) from public California government sources. Code: MIT.
        </p>
        <p>
          AI-generated summaries are labeled. The underlying numbers come from the California
          Department of Education and the California School Dashboard.
        </p>
        <p className="text-xs text-zinc-500 dark:text-zinc-500">
          Donation-supported. Never freemium. This is informational only — verify with the
          district before making placement decisions.
        </p>
      </div>
    </footer>
  );
}
