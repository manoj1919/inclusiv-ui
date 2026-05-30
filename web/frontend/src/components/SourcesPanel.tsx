import type { DistrictProfile, Sourced } from "@/lib/types";

/**
 * Pulse · SourcesPanel — provenance for every distinct (source, url, as_of)
 * tuple referenced by this profile. Card chrome, collapsed by default so it
 * never overpowers the data on the page but is always one click away.
 */

function collect(profile: DistrictProfile): { source: string; url?: string; as_of: string }[] {
  const seen = new Map<string, { source: string; url?: string; as_of: string }>();
  const walk = (s?: Sourced<unknown>) => {
    if (!s || !s.source) return;
    const key = `${s.source}|${s.url ?? ""}|${s.as_of}`;
    if (!seen.has(key)) seen.set(key, { source: s.source, url: s.url, as_of: s.as_of });
  };
  for (const v of Object.values(profile.enrollment ?? {})) walk(v as Sourced<unknown>);
  // Walk the three Donabedian buckets — Structure (staffing + programs + reviews),
  // Process (LRE + disputes), Outcome (academics + behavior).
  const sBlocks = [
    profile.structure?.staffing,
    profile.structure?.programs,
    profile.structure?.related_services,
    profile.structure?.reviews,
    profile.process?.lre,
    profile.process?.disputes,
    profile.outcome?.academics,
    profile.outcome?.behavior,
  ];
  for (const block of sBlocks) {
    if (!block) continue;
    for (const v of Object.values(block)) walk(v as Sourced<unknown>);
  }
  return [...seen.values()].sort((a, b) => a.source.localeCompare(b.source));
}

const SOURCE_LABELS: Record<string, string> = {
  cde_spedps:
    "California Department of Education — Special Education Enrollment by Program Setting",
  cde_enrollment:
    "California Department of Education — Census Day Enrollment file",
  cde_staff:
    "California Department of Education — Staff Race/Ethnicity (StRE) file (CBEDS)",
  ca_dashboard:
    "California School Dashboard — annual indicator files (ELA, math, absenteeism, suspension)",
  oah: "Office of Administrative Hearings — special-education due-process decisions",
  ocr: "US Department of Education Office for Civil Rights — pending investigations list",
  district_web: "District websites, SELPA pages and public job postings (hand-collected)",
};

export function SourcesPanel({ profile }: { profile: DistrictProfile }) {
  const items = collect(profile);
  const builtAt = profile.build_provenance?.built_at;
  return (
    <details className="card group px-6 py-5">
      <summary
        className="-mx-2 flex cursor-pointer list-none items-baseline gap-2 rounded-[8px] px-2 py-1 text-[14px] font-medium text-[var(--ink)] transition-colors hover:bg-[var(--subtle-bg)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
      >
        <span
          aria-hidden
          className="inline-block transition-transform group-open:rotate-90"
          style={{ color: "var(--accent)" }}
        >
          ›
        </span>
        Sources &amp; provenance
        <span
          className="text-[var(--ink-soft)]"
          style={{ font: '500 11px/1 var(--font-mono)', letterSpacing: "0.06em" }}
        >
          ({items.length})
        </span>
      </summary>
      <ul
        className="mt-4 space-y-3 pt-4"
        style={{ borderTop: "1px solid var(--rule)" }}
      >
        {items.map((s, i) => (
          <li key={i} className="leading-snug">
            <div className="text-[14px] font-medium text-[var(--ink)]">
              {SOURCE_LABELS[s.source] ?? s.source}
            </div>
            <div className="mt-0.5 text-[12px] text-[var(--ink-mid)]">
              <span className="eyebrow mr-1.5">As of</span>
              <span style={{ fontFamily: "var(--font-mono)" }}>{s.as_of}</span>
              {s.url && (
                <>
                  {" · "}
                  <a
                    className="underline decoration-dotted underline-offset-2 hover:text-[var(--accent)]"
                    href={s.url}
                    rel="noreferrer"
                  >
                    {s.url}
                  </a>
                </>
              )}
            </div>
          </li>
        ))}
      </ul>
      {builtAt && (
        <p
          className="mt-4 pt-3 text-[10px] uppercase tracking-[0.12em] text-[var(--ink-soft)]"
          style={{ borderTop: "1px solid var(--rule)", fontFamily: "var(--font-mono)" }}
        >
          Profile built {builtAt} · Schema {profile.schema_version}
        </p>
      )}
    </details>
  );
}
