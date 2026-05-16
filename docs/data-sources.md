# Data Sources

All data in this project comes from public records. This document tracks the source, license/usage status, refresh cadence, and known limitations for each.

## California Department of Education (CDE) DataQuest

- **URL:** https://dq.cde.ca.gov
- **Coverage:** Special education enrollment by disability category (autism explicitly broken out), LRE rates, district demographics
- **License:** Public records; no restriction on republication
- **Refresh:** Annual (typically released late fall for prior school year)
- **Format:** Web reports + downloadable Excel/CSV
- **Pipeline module:** `pipeline/scrapers/cde/`

## California School Dashboard

- **URL:** https://www.caschooldashboard.org
- **Coverage:** District performance indicators including suspension rate, chronic absenteeism, ELA/math performance, broken out by student group (Students with Disabilities)
- **License:** Public records
- **Refresh:** Annual
- **Pipeline module:** `pipeline/scrapers/dashboard/`

## Office of Administrative Hearings (OAH) — Special Education Decisions

- **URL:** https://www.dgs.ca.gov/OAH/Case-Types/Special-Education/Resources
- **Coverage:** Due process hearing decisions involving CA school districts. Searchable database of PDFs.
- **License:** Public records
- **Refresh:** Annual (decisions accumulate continuously; we snapshot yearly)
- **Format:** PDF decisions
- **Pipeline module:** `pipeline/scrapers/oah/`
- **Notes:** Parsing requires PDF text extraction. We flag autism-related cases by keyword matching but acknowledge this is approximate.

## US Department of Education Office for Civil Rights (OCR) — Civil Rights Data Collection

- **URL:** https://ocrdata.ed.gov
- **Coverage:** Federal civil rights data including discipline disparities, IDEA-related complaints, district-level demographics
- **License:** Public records (federal)
- **Refresh:** Biennial (every 2 years)
- **Format:** API + bulk CSV
- **Pipeline module:** `pipeline/scrapers/ocr/`

## SELPA Annual Performance Reports

- **URL:** Varies by SELPA (see [docs/selpa-directory.md](selpa-directory.md) — TBD)
- **Coverage:** SELPA-level program offerings, governance, due-process / mediation counts
- **License:** Public records
- **Refresh:** Annual
- **Format:** Usually PDF on SELPA websites; no central repository
- **Pipeline module:** Manual ingestion to start; possible per-SELPA scraper later

## Optional / Future

| Source | Purpose | Status |
|---|---|---|
| Zillow / Redfin API | Housing cost context | Deferred to Phase 2+ |
| Niche.com reviews | Community sentiment | Deferred (terms of use review needed) |

## Refresh strategy

GitHub Actions runs the full pipeline once per year. Output is committed as a PR; a human reviews diffs before merging. This protects against silent data regressions from upstream source changes.
