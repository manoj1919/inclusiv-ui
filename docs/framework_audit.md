# Framework audit: current schema mapped to S/P/O

Companion to [framework.md](./framework.md). Classifies every field in `data/schema/district.schema.json` as **Structure**, **Process**, **Outcome**, or **non‑quality context**, and identifies what is missing under each Donabedian layer.

## Field‑by‑field classification

| Field | Layer | Notes |
|---|---|---|
| `schema_version`, `cds_code`, `name`, `county`, `county_code`, `district_type`, `region`, `website`, `selpa.*` | — | Identity / administrative context; not a quality measure. |
| `enrollment.total`, `students_with_iep`, `students_with_autism`, `pct_iep`, `pct_autism` | — | Population description. Used to normalize ratios in Structure (per‑100‑SWD denominators) but not itself a quality signal. |
| `programs.autism_specific_classrooms` | **Structure** | Programs in place. |
| `programs.bcba_on_staff` | **Structure** | Expertise in place. Currently a boolean — should become a count. |
| `programs.aac_support_level` | **Structure** | Capacity in place. |
| `programs.transition_18_22_program` | **Structure** | Program in place. |
| `programs.reverse_inclusion` | **Structure** | Program model in place. |
| `related_services.slp_caseload_ratio` | **Structure** | Staffing intensity (students per SLP). |
| `related_services.ot_available` | **Structure** | Service availability (boolean — should become a ratio). |
| `related_services.pt_available` | **Structure** | Same. |
| `related_services.social_skills_groups` | **Structure** | Same. |
| `inclusion_metrics.lre_80pct_plus_gen_ed_all_disabilities` | **Process** | SPP Indicator 5A — placement is a process measure of *where* service is delivered. |
| `inclusion_metrics.lre_80pct_plus_gen_ed_autism` | **Process** | SPP Indicator 5A, autism subgroup. |
| `inclusion_metrics.lre_separate_setting_all_disabilities` | **Process** | SPP Indicator 5C. |
| `inclusion_metrics.lre_separate_setting_autism` | **Process** | SPP Indicator 5C, autism subgroup. |
| `compliance.oah_cases_5yr_total` | **Process** | Due‑process volume — measure of dispute‑resolution activity. |
| `compliance.oah_cases_5yr_autism` | **Process** | Same, autism subgroup. |
| `compliance.ocr_open_investigations` | **Process** | Civil‑rights complaint volume. |
| `compliance.ocr_open_investigations_disability` | **Process** | Same, disability subgroup. |
| `compliance.state_audit_findings_5yr` | **Structure** | Independent‑review signal (existence of audit findings is a structural fact about the district's monitoring posture). |
| `outcome_metrics.chronic_absenteeism_rate_swd` / `_all` | **Outcome** | Attendance outcome by subgroup. |
| `outcome_metrics.suspension_rate_swd` / `_all` | **Outcome** | SPP Indicator 4. |
| `outcome_metrics.ela_distance_from_standard_swd` / `_all` | **Outcome** | SPP Indicator 3 (proficiency). |
| `outcome_metrics.math_distance_from_standard_swd` / `_all` | **Outcome** | SPP Indicator 3 (proficiency). |
| `housing_context.*` | — | External context (cost of living). Not a quality measure. |
| `district_web_research.*` | — | Provenance for the Structure programs fields above. |
| `ai_summaries.*` | — | Narrative wrapping. |
| `data_sources_used`, `build_provenance.*`, `last_updated` | — | Pipeline provenance. |

## Coverage by layer

| Layer | Fields populated today | Approximate sufficiency |
|---|---|---|
| **Structure** | programs (5 fields), related_services (4 fields), state_audit_findings | **Sparse.** Mostly booleans about whether something exists, no intensity measures. No staffing ratios, no expenditure, no FCMAT review surfacing. This is the layer where Poway's documented strength lives, and the layer we are currently nearly blind to. |
| **Process** | LRE (4 fields), OAH / OCR (4 fields) | **Partial.** Placement covered; dispute‑process volume covered. Parent involvement (Indicator 8), secondary transition IEP quality (Indicator 13), preschool LRE (Indicator 6), service intensity (OT/PT/SLP minutes per student) all missing. |
| **Outcome** | Academics (4 fields), behavior (4 fields) | **Partial.** Assessment proficiency and discipline rates present. Graduation (Indicator 1), dropout (Indicator 2), post‑school outcomes (Indicator 14), disproportionate representation (Indicators 9–10), preschool outcomes (Indicator 7) all missing. |

## Gaps prioritized

The Poway problem motivates the Structure prioritization. Within each layer, ordered by the ratio of *information added* to *data‑acquisition cost*.

### Structure — highest priority

1. **CBEDS staffing ratios** — special‑ed teachers, instructional aides, SLPs, OTs, psychologists per 100 IEP students. CDE publishes the underlying CBEDS Assignment and Demographic files at district level annually; the per‑100‑SWD denominator is computed from existing enrollment data. *This is the Poway test.*
2. **SACS special‑education expenditure** — spend per SWD, share of district budget, multi‑year trend. CDE publishes SACS unaudited actuals at district level by resource and goal code (SPED = goals 5001–5770).
3. **FCMAT special‑education reviews** — existence, date, and (where possible) headline finding. Available via the FCMAT publication archive; not standardized in format, requires per‑review parsing.
4. **SPP Indicators 11 and 12** — timely initial evaluation and Part C → Part B transition timeliness. CDE compliance monitoring data.
5. **BCBA / SLP / OT actual counts** — upgrade the current boolean / web‑research fields to head counts where CBEDS supports it.

### Process — medium priority

1. **SPP Indicator 8** — parent involvement survey results.
2. **SPP Indicator 13** — secondary transition IEPs with measurable post‑secondary goals.
3. **SPP Indicator 6** — preschool LRE.
4. Service intensity (minutes per week of OT, PT, SLP per receiving student) — typically only published in district plans, not state datasets.

### Outcome — medium priority

1. **SPP Indicator 1** — graduation rate for SWD. CDE DataQuest district‑level.
2. **SPP Indicator 2** — dropout rate for SWD. CDE DataQuest district‑level.
3. **SPP Indicator 14** — post‑school employment / education / training. CDE publishes some district aggregates.
4. **SPP Indicators 9–10** — disproportionate representation by race/ethnicity and by disability category. CDE special‑education data files.
5. **SPP Indicator 7** — preschool outcomes (three areas of development).

## What this implies for the restructure

The schema restructure does **not** need to wait for the gap‑filling. The fields we already have map cleanly into the three buckets, and surfacing what is *missing* under each is part of the closure commitment.

Sequence:
1. Restructure schema and UI into the three chapters using only existing fields. *Each chapter explicitly lists the SPP indicators it does and does not yet populate.*
2. Pull CBEDS staffing as the first new ingestion (Structure layer, highest payoff for the Poway test).
3. Add SACS expenditure (Structure).
4. Add SPP/APR district‑level reports (covers Outcome 1, 2, 14 and Process 8, 13 in one statewide pull).
5. FCMAT and remaining indicators as follow‑ups.

The chapter count does not change at any step.
