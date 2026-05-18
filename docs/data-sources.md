# Data Sources

All data in this project comes from public records. This document tracks the source, license/usage status, refresh cadence, and known limitations for each.

## California Department of Education (CDE) — Special Education Enrollment by Program Setting (SPED-PS)

- **URL:** https://www.cde.ca.gov/ds/ad/filesspedps.asp
- **Direct file:** `https://www3.cde.ca.gov/demo-downloads/sped/spedps2425.txt` (tab-separated, Latin-1)
- **Coverage:** Special education enrollment counts and LRE percentages by disability category (autism / `DC_AUT` explicitly broken out) at state / county / district / DSEA / school aggregation levels.
- **License:** Public records; no restriction on republication
- **Refresh:** Annual (typically released ~6–9 months after end of prior school year)
- **Format:** Tab-separated text file
- **Pipeline module:** `pipeline/scrapers/cde/spedps.py`
- **Source identifier:** `cde_spedps`

## California School Dashboard

- **URL:** https://www.cde.ca.gov/ta/ac/cm/dashboardresources.asp
- **Direct files:** `https://www3.cde.ca.gov/researchfiles/cadashboard/{chronicdownload|suspdownload|eladownload|mathdownload}2025.txt`
- **Coverage:** District performance indicators — chronic absenteeism, suspension, ELA distance-from-standard, math distance-from-standard — broken out by student group, including `SWD` (Students with Disabilities) vs `ALL`. The Dashboard does *not* break out by autism specifically.
- **License:** Public records
- **Refresh:** Annual (typically end of school year)
- **Pipeline module:** `pipeline/scrapers/dashboard/cdashboard.py`
- **Source identifier:** `ca_dashboard`

## Office of Administrative Hearings (OAH) — Special Education Decisions

- **URL:** https://www.dgs.ca.gov/OAH/Case-Types/Special-Education/Services/Decisions
- **Coverage:** Due process hearing decisions involving CA school districts. ~1,576 PDFs across 64 pages of server-rendered search results.
- **License:** Public records
- **Refresh:** Annual (decisions accumulate continuously; we'd snapshot yearly)
- **Format:** Individual PDF decisions
- **Pipeline module:** *not yet built*
- **Status — DEFERRED to Phase 2+:** District attribution requires PDF text extraction from unstructured legal documents — material effort for limited immediate ROI while the pilot scope is small. Revisit when Phase 3 scope expands.

## US Department of Education Office for Civil Rights (OCR) — pending investigations

- **URL:** https://ocrcas.ed.gov/open-investigations
- **Coverage:** Civil-rights investigations OCR currently has open at K-12 ("ESE") institutions — discrimination type and the date the investigation opened. A point-in-time snapshot, **not** a historical complaint count.
- **License:** Public records (federal)
- **Refresh:** OCR updates the list weekly; we re-snapshot per data refresh.
- **Format:** Server-rendered HTML table.
- **Source identifier:** `ocr`
- **Pipeline module:** `pipeline/scrapers/ocr/openinvestigations.py`
- **Manual step required:** The site is behind an AWS WAF CAPTCHA — it cannot be fetched by script or headless browser. Export it by hand once per refresh: open the page in a normal browser, filter State = California / Institution Type = ESE / items per page = 1000, and save the HTML to `data/raw/ocr/<YYYY-MM-DD>/open_investigations_ca_ese.html`. The pipeline module parses that snapshot.
- **Fields populated:** `compliance.ocr_open_investigations`, `compliance.ocr_open_investigations_disability`.
- **Limitation:** Rows are attributed to districts by institution name; investigations filed against an individual school (rather than the district LEA) are not attributed.

> Note: the OCR *Civil Rights Data Collection* (CRDC, the biennial survey at ocrdata.ed.gov) is a separate dataset — not used here. The metric above is the open-investigations list.

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
