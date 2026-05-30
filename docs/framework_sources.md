# Framework data‑source inventory

Companion to [framework.md](./framework.md). For each layer of Structure / Process / Outcome, this is what is publicly available, what is not, and what we've already confirmed downloads cleanly.

## Structure

### Confirmed downloadable

| Source | URL pattern | Coverage | Aggregation |
|---|---|---|---|
| **CBEDS Staff by Race/Ethnicity (StRE)** | `https://www3.cde.ca.gov/demo-downloads/staff/stre<YY><YY>.txt` | 2019‑20 through 2024‑25; latest = `stre2425.txt` (36 MB) | District‑level, broken down by *Staff Type* but only at five broad categories: ADM (administrators), TCH (teachers), PSV (pupil services), OTH (other certificated), ALL. Not broken out by special‑education specialty. |
| **SACS unaudited actuals** | CDE Financial files page (`https://www.cde.ca.gov/ds/fd/sf/`) | Annual through 2023‑24 | District‑level by SACS resource and goal code. Special‑education expenditure is identifiable through goal codes 5001–5770 and selected resource codes (6500 etc.). |

The **CBEDS Staff Assignment file** (`StaffAssign<YY>.zip`) — the only file that contains *role‑specific* counts (special‑education teacher, SLP, OT, school psychologist, paraprofessional) — was discontinued after 2018‑19. Newer staff role granularity now lives in CALPADS and is not currently published as a downloadable district‑level file. This is a real constraint, not a project oversight.

### Proxies we can construct from what *is* available

- **Pupil‑services density** = PSV staff per 1,000 students. Captures counselor / psychologist / SLP / social‑worker / nurse capacity in aggregate. Cannot separate SLP from psychologist; can show whether a district invests heavily in non‑classroom support.
- **Teacher density relative to SWD** = TCH per 100 IEP students. Crude proxy for whether the district has more or fewer teaching adults per identified student.
- **Independent reviews** = existence + headline of FCMAT special‑education reviews. Scrapable from `fcmat.org/publications`; format is per‑report PDF, requires per‑review parsing.

### Validation: does the proxy surface Poway?

For the 145 SoCal districts with >5,000 enrollment, the PSV‑per‑1,000‑students proxy puts Poway at:

- PSV per 1,000 students = **8.0** (rank **#26 of 145** large districts)
- SD County median = 7.3
- All‑SoCal median = 6.1

So even with the aggregated PSV measure — not granular SPED roles — Poway shows visibly above median, consistent with the FCMAT‑documented investment posture. The framework surfaces the structural strength that placement and outcome metrics could not.

### Honestly unmeasurable from public data

- Granular SPED role counts (special‑ed teacher, SLP, OT, psychologist, BCBA) — *would require CALPADS bulk access, which is not generally available.*
- Aide / paraeducator counts — classified file is less detailed than CBEDS Assignment was.
- Staff turnover and retention — sometimes in LCAP narratives, not in a structured file.
- Caseload ratios (students per SLP, etc.) — only inferable when both staff and caseload numbers are published, which is uneven.

These belong in the "not currently measured" slots in the Structure chapter UX.

## Process

### Confirmed downloadable

| Source | URL | Coverage |
|---|---|---|
| **CDE SPED‑PS** | already ingested | 2024‑25; SPP Indicator 5 (LRE) |
| **CA Dashboard** | already ingested | 2024‑25; SPP Indicator 4 (suspension) — currently used for behavior |
| **OAH due‑process decisions** | already ingested | 2014‑2026 (~1,573 PDFs) |
| **OCR open investigations** | already ingested (manual export, CAPTCHA‑walled) | snapshot 2026‑05‑15 |

### Need to acquire

- **SPP Indicator 8** (parent‑involvement survey results) — CDE publishes statewide rollups; district‑level access requires CDE Special Education Division contact.
- **SPP Indicator 13** (secondary‑transition IEPs with measurable postsecondary goals) — CDE compliance monitoring data; district‑level often published as a binary flag per‑district per‑year.
- **SPP Indicator 6** (preschool LRE) — district‑level via DataQuest.

### Honestly unmeasurable

- IEP quality at the individual level
- Whether the IEP team listens to *this* parent
- Service intensity (minutes/week of OT/PT/SLP per student) — typically only in district plans, not state datasets.

## Outcome

### Confirmed downloadable

| Source | URL | Coverage |
|---|---|---|
| **CA Dashboard** | already ingested | DFS (Indicator 3) + suspension + absenteeism |

### Need to acquire

- **SPP Indicators 1 & 2** (graduation, dropout for SWD) — CDE DataQuest district‑level.
- **SPP Indicator 14** (post‑school employment, education, training) — CDE publishes district aggregates with one‑year delay.
- **SPP Indicators 9 & 10** (disproportionate representation by race/ethnicity and by disability category) — CDE special‑education data files.
- **SPP Indicator 7** (preschool outcomes, three areas of development) — CDE publishes.

### Honestly unmeasurable

- Individual student progress against IEP goals
- Long‑term quality‑of‑life outcomes beyond first year post‑school

## Implementation priority

1. **Pull CBEDS StRE** and surface PSV/TCH density as Structure measures. *(Already downloaded, transformation pending.)*
2. **Pull SACS** for SPED expenditure per SWD.
3. **Pull DataQuest Indicators 1, 2, 14** for SWD outcomes.
4. **Scrape FCMAT** for independent‑review surfacing.
5. Remaining indicators (8, 13, 6, 7, 9, 10) as follow‑ups.

Each addition is admitted only because it fits an existing chapter as a finer measure. None create a new chapter.
