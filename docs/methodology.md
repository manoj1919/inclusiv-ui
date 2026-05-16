# Methodology

How we turn raw government records into a district profile.

## Pipeline stages

```
raw scrape → normalize → merge by CDS code → enrich (AI) → validate → publish
```

### 1. Raw scrape

Each source has a dedicated module under `pipeline/scrapers/`. Scrapers are idempotent and produce dated snapshots in `data/raw/<source>/<YYYY-MM-DD>/`. We never overwrite raw data — every snapshot is preserved for auditability and re-processing.

### 2. Normalize

Per-source transformers parse the raw output into a common shape. Each district is keyed by its [California CDS (County-District-School) code](https://www.cde.ca.gov/ds/si/ds/fscds.asp), which is the only reliable district identifier.

### 3. Merge

The transformer pipeline joins normalized records across sources into one profile per district. Conflicting fields (e.g., enrollment from CDE vs. Dashboard differing by 1–2%) are resolved by source priority documented in `pipeline/transformers/priority.py`.

### 4. AI enrichment

A Claude API call produces:
- A **plain-language district summary** (3–5 sentences)
- A **parent-facing explainer** for technical fields (LRE %, SELPA type, etc.)

Every AI-generated field is tagged `ai_generated: true` and accompanied by an `ai_disclaimer` field. Source numbers are passed in as context; the model is instructed to summarize without inventing facts.

### 5. Validate

`pipeline/validators/` runs schema validation (`data/schema/district.schema.json`) plus business-rule checks:
- Enrollment > 0
- LRE percentages in [0, 1]
- Required fields present
- Provenance: every numeric field has a `source` and `as_of` timestamp

### 6. Publish

Validated profiles land in `data/processed/<cds-code>.json` and feed the FastAPI backend / Next.js frontend.

## Things we deliberately do not do

- **No predictive ratings.** We don't reduce a district to a star or letter grade. The data is multidimensional; collapsing it discards what matters.
- **No paid placement.** No district can buy visibility.
- **No scraping behind logins or paywalls.** Public records only.
- **No PII.** No student-level or family-level data — district-level aggregates only.

## Provenance contract

Every numeric or factual field in a district profile carries:
- `value` — the data point
- `source` — short string identifying the source (e.g., `"cde_dataquest"`)
- `as_of` — date the underlying data was published
- `fetched_at` — date we scraped it
- `url` — link to the source page where possible

This means a reader can always click through to verify the original government record.
