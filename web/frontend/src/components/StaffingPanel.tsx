import type { DistrictProfile } from "@/lib/types";
import type { Distribution } from "@/lib/peers";
import { rank } from "@/lib/peers";

/**
 * StaffingPanel — the new Structure-layer chapter surface that answers
 * "does this district have the staffing to back its program claims?".
 *
 * Source: CDE Staff Race/Ethnicity (StRE) file at district level. CBEDS
 * stopped publishing the granular Staff Assignment file after 2018-19,
 * so we cannot break PSV (pupil services) further into SLP / psychologist
 * / counselor / nurse — this is called out in the panel.
 *
 * Each density ratio is shown against the peer-set median + the district's
 * rank position. No good/bad framing — "above peer median" is a fact
 * about the ratio, not a quality verdict.
 */

function fmt(v: number | null | undefined, decimals = 1): string {
  if (v === null || v === undefined) return "—";
  return v.toFixed(decimals);
}

function Row({
  label,
  description,
  value,
  unit,
  dist,
  source,
}: {
  label: string;
  description: string;
  value: number | null | undefined;
  unit: string;
  dist?: Distribution;
  source: string;
}) {
  const median = dist?.median;
  const r = dist ? rank(value ?? null, dist) : null;
  const above = value !== null && value !== undefined && median !== undefined && value >= median;

  return (
    <li className="border-l-2 pl-3.5 py-1" style={{ borderColor: "var(--rule)" }}>
      <div className="flex items-baseline justify-between gap-3">
        <div className="text-[13.5px] font-semibold text-[var(--ink)]">{label}</div>
        <div className="tnum text-[15px] font-semibold text-[var(--ink)]">
          {fmt(value)} <span className="text-[12px] font-medium text-[var(--ink-soft)]">{unit}</span>
        </div>
      </div>
      <div className="mt-0.5 text-[11.5px] leading-[1.5] text-[var(--ink-soft)]">
        {description}
      </div>
      {dist && median !== undefined && (
        <div className="mt-1.5 flex items-baseline gap-2 text-[11.5px] leading-[1.4]">
          <span className="text-[var(--ink-soft)]">peer median {fmt(median)} ·</span>
          <span
            className="font-medium"
            style={{ color: above ? "var(--accent)" : "var(--ink-mid)" }}
          >
            {value === null || value === undefined
              ? "no data"
              : above
                ? "at or above peer median"
                : "below peer median"}
          </span>
          {r !== null && dist.count > 0 && (
            <span className="text-[var(--ink-soft)]">
              · rank {r} of {dist.count}
            </span>
          )}
        </div>
      )}
      <div
        className="mt-1 text-[var(--ink-soft)]"
        style={{ font: "500 10px/1.4 var(--font-mono)", letterSpacing: "0.04em" }}
      >
        {source}
      </div>
    </li>
  );
}

export function StaffingPanel({
  profile,
  pupilServicesPer1k,
  teachersPer100Iep,
  pupilServicesPer100Iep,
}: {
  profile: DistrictProfile;
  pupilServicesPer1k?: Distribution;
  teachersPer100Iep?: Distribution;
  pupilServicesPer100Iep?: Distribution;
}) {
  const s = profile.structure?.staffing ?? {};
  const tch100 = s.teachers_per_100_iep?.value ?? null;
  const psv1k = s.pupil_services_per_1k_students?.value ?? null;
  const psv100 = s.pupil_services_per_100_iep?.value ?? null;

  return (
    <div className="card px-6 py-[18px]">
      <div className="eyebrow">Staffing intensity</div>
      <p className="mt-2 max-w-[640px] text-[12.5px] leading-[1.55] text-[var(--ink-mid)]">
        Certificated‑staff density at district level. CDE no longer publishes
        role‑granular district counts (SLP, OT, psychologist, BCBA, etc.) —
        these aggregate figures are the best district‑level signal currently
        available. Densities are computed from the merged enrollment and IEP
        counts on this page.
      </p>
      <ul className="mt-4 space-y-3">
        <Row
          label="Teachers per 100 IEP students"
          description="Total certificated teachers (general + special education combined; CDE does not separate them in the StRE file)."
          value={tch100}
          unit="teachers"
          dist={teachersPer100Iep}
          source="Source · CDE Staff Race/Ethnicity (StRE) 2024–25 + CDE SPED-PS 2024–25"
        />
        <Row
          label="Pupil services per 1,000 students"
          description="Counselors + psychologists + speech-language pathologists + social workers + nurses, aggregated. Higher = more non-classroom support capacity."
          value={psv1k}
          unit="PSV / 1k"
          dist={pupilServicesPer1k}
          source="Source · CDE Staff Race/Ethnicity (StRE) 2024–25 + CDE Census Day Enrollment 2024–25"
        />
        <Row
          label="Pupil services per 100 IEP students"
          description="Same denominator as the chart above but normalized to IEP count, since pupil‑services staff carry a disproportionate share of related‑service delivery."
          value={psv100}
          unit="PSV / 100 IEP"
          dist={pupilServicesPer100Iep}
          source="Source · CDE Staff Race/Ethnicity (StRE) 2024–25 + CDE SPED-PS 2024–25"
        />
      </ul>
    </div>
  );
}
