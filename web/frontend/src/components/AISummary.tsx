import type { AIGenerated } from "@/lib/types";

/**
 * Pulse · AISummary — narrative card carrying an unambiguous "AI-generated"
 * chip at the top, the summary text, and a footer with model attribution and
 * a "verify before quoting" affordance. The chip and verify note are
 * editorial policy, not optional.
 */
export function AISummary({
  title,
  summary,
  sources,
}: {
  title?: string;
  summary: AIGenerated;
  /** Optional source labels rendered in the footer row. */
  sources?: string[];
}) {
  const generatedAt = summary.ai_generated_at?.slice(0, 10);
  const sourceLine = sources?.length
    ? sources.join(" · ")
    : "Government source data";
  return (
    <section className="card px-6 py-5">
      <div className="mb-3.5 flex items-center gap-2">
        <span
          className="inline-flex items-center gap-1.5 rounded-full"
          style={{
            background: "var(--tint)",
            color: "var(--accent)",
            padding: "4px 10px",
          }}
        >
          <Sparkle />
          <span
            style={{
              font: '700 11px/1 var(--font-mono)',
              letterSpacing: "0.1em",
              textTransform: "uppercase",
            }}
          >
            AI-generated
          </span>
        </span>
        <span
          className="text-[var(--ink-soft)]"
          style={{
            font: '500 11px/1 var(--font-mono)',
            letterSpacing: "0.06em",
          }}
        >
          {summary.ai_model || "model"}
          {generatedAt && <> · {generatedAt}</>}
        </span>
      </div>

      {title && (
        <h3 className="mb-2 text-[17px] font-semibold leading-[1.25] tracking-[-0.005em] text-[var(--ink)]">
          {title}
        </h3>
      )}
      <p className="whitespace-pre-line text-[15px] leading-[1.6] text-[var(--ink)]">
        {summary.value}
      </p>

      <div
        className="mt-[18px] flex flex-wrap items-center gap-x-4 gap-y-2 pt-3"
        style={{ borderTop: "1px solid var(--rule)" }}
      >
        <span
          className="text-[var(--ink-soft)]"
          style={{
            font: '500 10px/1 var(--font-mono)',
            letterSpacing: "0.1em",
            textTransform: "uppercase",
          }}
        >
          Numbers from: {sourceLine}
        </span>
        <span
          className="ml-auto text-[11px] font-medium leading-none"
          style={{ color: "var(--accent)" }}
          title={summary.ai_disclaimer}
        >
          Verify before quoting →
        </span>
      </div>
    </section>
  );
}

function Sparkle() {
  return (
    <svg
      viewBox="0 0 12 12"
      width={11}
      height={11}
      aria-hidden
      fill="currentColor"
      style={{ display: "block" }}
    >
      <path d="M6 0 L7 4 L11 5 L7 6 L6 10 L5 6 L1 5 L5 4 Z" />
      <circle cx="10" cy="2" r="0.9" />
      <circle cx="2" cy="10" r="0.7" />
    </svg>
  );
}
