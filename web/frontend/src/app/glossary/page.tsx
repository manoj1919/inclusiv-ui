import Link from "next/link";
import { DEFINITIONS } from "@/components/Term";
import { SectionHead } from "@/components/SectionHead";

export const metadata = {
  title: "Glossary — inclusiv·ui",
  description: "Plain-English definitions of special-education and California school data terms.",
};

const NOTES: Record<string, string> = {
  IEP: "If a school doesn't follow what's in the IEP, families have legal recourse (state complaint, due-process hearing, OCR complaint).",
  LRE: "In practice, LRE is reported as the share of students who spend at least 80% of the school day in a regular classroom alongside non-disabled peers.",
  DFS: "DFS is reported per assessment per subgroup. A district's overall score and its SWD-subgroup score are often very different — the gap is what families should pay attention to.",
  SWD: "When a chart shows SWD outcomes (academic, absenteeism, suspension), remember that autism is only one disability in this group. Behavioral and learning profiles vary widely across SWD.",
};

export default function GlossaryPage() {
  const entries = Object.entries(DEFINITIONS).sort(([a], [b]) => a.localeCompare(b));
  return (
    <article className="space-y-8">
      <div className="flex items-center gap-2 pt-1 text-[12px] font-medium text-[var(--ink-soft)]">
        <Link href="/" className="hover:text-[var(--accent)]">
          ← Back to directory
        </Link>
      </div>

      <header className="space-y-3.5">
        <h1 className="text-[56px] font-bold leading-[0.95] tracking-[-0.035em] text-[var(--ink)]">
          Glossary
        </h1>
        <p className="max-w-[640px] text-[16px] leading-[1.55] text-[var(--ink-mid)]">
          Special education has a lot of acronyms. This page defines every term used on the
          district profile pages in plain English. Bookmark it before reading a profile — or before
          an IEP meeting.
        </p>
      </header>

      <SectionHead num="—" title="Terms" sub="Hover any term on a district page for the short definition; come here for the long version." />

      <dl className="card divide-y" style={{ borderColor: "var(--card-border)" }}>
        {entries.map(([term, def]) => (
          <div
            key={term}
            id={term}
            className="grid gap-4 px-6 py-5 sm:grid-cols-[8rem_1fr] sm:gap-8"
            style={{ borderColor: "var(--rule)" }}
          >
            <dt
              className="font-bold tracking-[-0.02em]"
              style={{
                font: '700 22px/1.1 var(--font-sans)',
                color: "var(--accent)",
              }}
            >
              {term}
            </dt>
            <dd>
              <p className="text-[15px] leading-[1.55] text-[var(--ink)]">{def}</p>
              {NOTES[term] && (
                <p
                  className="mt-3 pl-3 text-[13.5px] italic leading-[1.5] text-[var(--ink-mid)]"
                  style={{ borderLeft: "2px solid var(--accent)" }}
                >
                  {NOTES[term]}
                </p>
              )}
            </dd>
          </div>
        ))}
      </dl>

      <section className="card px-6 py-5">
        <div className="eyebrow mb-2" style={{ color: "var(--accent)" }}>
          A note on neutrality
        </div>
        <p className="text-[14px] leading-[1.6] text-[var(--ink-mid)]">
          The terms on this page have legal definitions. The data on this site reports what
          districts have submitted to state and federal agencies. Nothing on inclusiv·ui ranks or
          recommends a district — placement decisions are made individually through the IEP
          process, and the right placement is not the same for every child.
        </p>
      </section>
    </article>
  );
}
