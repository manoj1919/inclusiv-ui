import type { AIGenerated } from "@/lib/types";

/**
 * Renders an AI-generated summary block with a prominent disclaimer banner.
 * Disclaimer placement is non-negotiable — these summaries are language-model
 * output over government data, and users must see that flag every time.
 */
export function AISummary({ title, summary }: { title: string; summary: AIGenerated }) {
  return (
    <section className="rounded-lg border border-amber-200 bg-amber-50 p-5 dark:border-amber-900/40 dark:bg-amber-950/20">
      <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-amber-800 dark:text-amber-300">
        <span aria-hidden>✦</span>
        <span>AI-generated</span>
      </div>
      <h3 className="mb-2 text-lg font-semibold text-zinc-900 dark:text-zinc-100">{title}</h3>
      <p className="whitespace-pre-line text-zinc-800 leading-relaxed dark:text-zinc-200">
        {summary.value}
      </p>
      <p className="mt-3 text-xs text-zinc-600 dark:text-zinc-400">
        {summary.ai_disclaimer}
      </p>
    </section>
  );
}
