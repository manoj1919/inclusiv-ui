import type { DistrictProfile } from "@/lib/types";
import { Term } from "./Term";

/**
 * Pulse · ProgramsPanel — hand-collected programs / services data, surfaced
 * with explicit "this is web-sourced, not government data" framing.
 *
 * Three classes of content per district:
 *  1. Named autism programs/classrooms (most concrete, when published).
 *  2. Structured availability chips for confirmed services (BCBA, OT, PT,
 *     transition 18-22, etc.). Only *confirmed* items render as chips —
 *     absence is rolled into a single "not stated" line so the panel never
 *     misreads silence as "no."
 *  3. Free-text field notes — the rich part for the sparser districts.
 */

const _STRUCTURED: Array<[label: string, get: (p: DistrictProfile) => boolean]> = [
  ["BCBA on staff", (p) => p.structure?.programs?.bcba_on_staff?.value === true],
  ["18-22 transition program", (p) => p.structure?.programs?.transition_18_22_program?.value === true],
  ["Occupational therapy", (p) => p.structure?.related_services?.ot_available?.value === true],
  ["Physical therapy", (p) => p.structure?.related_services?.pt_available?.value === true],
  ["Social-skills groups", (p) => p.structure?.related_services?.social_skills_groups?.value === true],
  ["SLP caseload ratio", (p) => p.structure?.related_services?.slp_caseload_ratio?.value != null],
];

function hostOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

export function ProgramsPanel({ profile }: { profile: DistrictProfile }) {
  const classrooms = profile.structure?.programs?.autism_specific_classrooms ?? [];
  const confirmed = _STRUCTURED.filter(([, get]) => get(profile));
  const notStated = _STRUCTURED.filter(([, get]) => !get(profile)).map(([label]) => label);
  const research = profile.structure?.district_web_research;
  const slpRatio = profile.structure?.related_services?.slp_caseload_ratio?.value;

  return (
    <div className="space-y-4">
      {/* Web-sourced caveat — top, so framing comes first */}
      <div
        className="card px-5 py-4"
        style={{ background: "var(--subtle-bg)", boxShadow: "none" }}
      >
        <div className="eyebrow">Web-sourced · not government data</div>
        <p className="mt-2 text-[12.5px] leading-[1.55] text-[var(--ink-mid)]">
          Every fact in this section is hand-collected from district websites,{" "}
          <Term>SELPA</Term> pages, and public job postings — not from a CDE dataset.
          {research?.researched_at && (
            <>
              {" "}Researched <strong className="text-[var(--ink)]">{research.researched_at}</strong>.
            </>
          )}{" "}
          Two things to keep in mind: <strong>&ldquo;not stated&rdquo; is not the same as &ldquo;does not exist&rdquo;</strong>{" "}
          — small or rural districts often offer services they do not publish — and{" "}
          <strong>verify directly with the district</strong> before using anything here for a placement decision.
        </p>
      </div>

      {/* Named autism programs */}
      {classrooms.length > 0 ? (
        <div className="card px-6 py-[18px]">
          <div className="eyebrow">Named autism programs</div>
          <ul className="mt-3 space-y-2.5">
            {classrooms.map((c, i) => (
              <li key={i} className="border-l-2 pl-3" style={{ borderColor: "var(--accent)" }}>
                <div className="text-[15px] font-semibold leading-[1.3] text-[var(--ink)]">
                  {c.name}
                </div>
                {(c.grade_range || c.site) && (
                  <div className="mt-0.5 text-[12.5px] leading-[1.4] text-[var(--ink-mid)]">
                    {c.grade_range && <>Grades {c.grade_range}</>}
                    {c.grade_range && c.site && " · "}
                    {c.site && <>at {c.site}</>}
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <div className="card px-6 py-[18px] text-[13px] leading-[1.55] text-[var(--ink-mid)]">
          <div className="eyebrow">Named autism programs</div>
          <p className="mt-2.5">No district-run autism program is named on public sources for this district.</p>
        </div>
      )}

      {/* Structured services — confirmed chips + rolled-up "not stated" */}
      <div className="card px-6 py-[18px]">
        <div className="eyebrow">Programs &amp; services on record</div>
        {confirmed.length > 0 ? (
          <>
            <ul className="mt-3 flex flex-wrap gap-2">
              {confirmed.map(([label]) => (
                <li
                  key={label}
                  className="inline-flex items-center gap-1.5 rounded-full"
                  style={{
                    padding: "5px 11px",
                    background: "var(--tint)",
                    color: "var(--accent)",
                    border: "1px solid var(--card-border)",
                    font: '600 11.5px/1 var(--font-sans)',
                  }}
                >
                  <span aria-hidden style={{ fontSize: "12px", lineHeight: 0 }}>✓</span>
                  {label === "SLP caseload ratio" && slpRatio != null
                    ? `SLP ratio · ${slpRatio} students / SLP`
                    : label}
                </li>
              ))}
            </ul>
            {notStated.length > 0 && (
              <p className="mt-3 text-[12px] leading-[1.5] text-[var(--ink-soft)]">
                Not stated in public sources for this district: {notStated.join(", ")}.
              </p>
            )}
          </>
        ) : (
          <p className="mt-2.5 text-[13px] leading-[1.55] text-[var(--ink-mid)]">
            None of the tracked program fields ({notStated.join(", ")}) were stated in public
            sources for this district.
          </p>
        )}
      </div>

      {/* Field notes — the rich free-text */}
      {research?.additional_findings && (
        <div className="card px-6 py-[18px]">
          <div className="eyebrow">Field notes</div>
          <p className="mt-2.5 max-w-[640px] text-[13.5px] leading-[1.6] text-[var(--ink)]">
            {research.additional_findings}
          </p>
        </div>
      )}

      {/* Sources */}
      {research && (research.sources?.length || research.district_website) && (
        <div className="card px-6 py-[18px]">
          <div className="eyebrow">Where this came from</div>
          <ul className="mt-2.5 space-y-1.5 text-[12.5px] leading-[1.5]">
            {research.district_website && (
              <li>
                <span className="text-[var(--ink-soft)]">District website ·</span>{" "}
                <a
                  href={research.district_website}
                  className="font-medium underline decoration-dotted"
                  style={{ color: "var(--accent)" }}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {hostOf(research.district_website)}
                </a>
              </li>
            )}
            {(research.sources ?? []).map((u) => (
              <li key={u}>
                <a
                  href={u}
                  className="font-medium underline decoration-dotted"
                  style={{ color: "var(--accent)" }}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {hostOf(u)}
                </a>{" "}
                <span className="text-[var(--ink-soft)]">· {u}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
