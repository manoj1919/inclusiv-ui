import type { DistrictProfile, Sourced } from "@/lib/types";
import { Term } from "./Term";

/**
 * Pulse · CompliancePanel — the district's formal-dispute record: OAH
 * special-education due-process decisions and open US-OCR civil-rights
 * investigations.
 *
 * This data is sensitive and easily misread, so the panel is deliberately
 * plain (no charts, no ranking, no good/bad color) and leads every number
 * with the caveats that make it honest: both counts scale with district
 * size, published decisions undercount disputes, the autism figure is a
 * keyword heuristic, and an open investigation is not a finding of fault.
 */

function monthYear(isoDate: string | undefined): string {
  if (!isoDate) return "an unrecorded date";
  const d = new Date(isoDate + "T00:00:00Z");
  if (Number.isNaN(d.getTime())) return isoDate;
  return d.toLocaleDateString("en-US", { month: "long", year: "numeric", timeZone: "UTC" });
}

function RecordCard({
  eyebrow,
  value,
  subValue,
  subLabel,
  body,
  sourceLine,
}: {
  eyebrow: React.ReactNode;
  value: number | null | undefined;
  subValue: number | null | undefined;
  subLabel: React.ReactNode;
  body: React.ReactNode;
  sourceLine: React.ReactNode;
}) {
  return (
    <div className="card px-6 py-[22px]">
      <div className="eyebrow">{eyebrow}</div>
      <div className="mt-3 flex items-baseline gap-3">
        <span
          className="tnum text-[44px] font-bold leading-none tracking-[-0.035em] text-[var(--ink)]"
          style={{ fontFeatureSettings: '"tnum"' }}
        >
          {value ?? "—"}
        </span>
        <span className="text-[12.5px] leading-[1.35] text-[var(--ink-mid)]">
          <span className="tnum font-semibold text-[var(--ink)]">{subValue ?? "—"}</span>{" "}
          {subLabel}
        </span>
      </div>
      <p className="mt-3 text-[13px] leading-[1.55] text-[var(--ink-mid)]">{body}</p>
      <div
        className="mt-3 border-t border-[var(--rule)] pt-2.5 text-[var(--ink-soft)]"
        style={{ font: "500 10px/1.4 var(--font-mono)", letterSpacing: "0.04em" }}
      >
        {sourceLine}
      </div>
    </div>
  );
}

export function CompliancePanel({ profile }: { profile: DistrictProfile }) {
  const d = profile.process?.disputes ?? {};
  const oah = d.oah_cases_5yr_total as Sourced<number> | undefined;
  const oahAutism = d.oah_cases_5yr_autism as Sourced<number> | undefined;
  const ocr = d.ocr_open_investigations as Sourced<number> | undefined;
  const ocrDis = d.ocr_open_investigations_disability as Sourced<number> | undefined;

  return (
    <div className="space-y-3.5">
      <div className="grid gap-3.5 lg:grid-cols-2">
        <RecordCard
          eyebrow={<>Due-process decisions · 2022–2026</>}
          value={oah?.value}
          subValue={oahAutism?.value}
          subLabel="mention autism or ASD"
          body={
            <>
              Published <Term>OAH</Term>{" "}special-education due-process decisions that name
              this district as the respondent. A due-process hearing happens when a family and a
              district cannot agree on a student&apos;s services and ask the state to decide.
            </>
          }
          sourceLine={<>Source: California Office of Administrative Hearings · snapshot {monthYear(oah?.as_of)}</>}
        />
        <RecordCard
          eyebrow={<>Open civil-rights investigations</>}
          value={ocr?.value}
          subValue={ocrDis?.value}
          subLabel="disability-related"
          body={
            <>
              Federal <Term>OCR</Term> civil-rights investigations recorded as open for this
              district. An open investigation means a complaint was filed and is being reviewed —
              it is not a finding that the district did anything wrong.
            </>
          }
          sourceLine={<>Source: U.S. Dept. of Education, Office for Civil Rights · list as of {monthYear(ocr?.as_of)}</>}
        />
      </div>

      <div
        className="card px-6 py-5"
        style={{ background: "var(--subtle-bg)", boxShadow: "none" }}
      >
        <div className="eyebrow">How to read these numbers</div>
        <ul className="mt-2.5 space-y-2 text-[12.5px] leading-[1.55] text-[var(--ink-mid)]">
          <li>
            Both counts rise with district size — a larger district will have more simply because
            it serves more students. Neither figure is a measure of district quality, and this
            directory does not rank districts on them.
          </li>
          <li>
            The <Term>OAH</Term> count includes only <em>published</em> decisions. Most due-process
            disputes settle privately and never produce a published decision, so this undercounts
            how often families and the district disagree.
          </li>
          <li>
            &ldquo;Mention autism&rdquo; is a keyword heuristic — the decision text contains the
            words autism or ASD — not a verified case classification. Treat it as approximate.
          </li>
          <li>
            The published <Term>OAH</Term> archive spans 2005–2026; the figure above is the
            most recent five reporting years. The full history is in the Sources section.
          </li>
        </ul>
      </div>
    </div>
  );
}
