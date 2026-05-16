# ASD Schools CA

Open-source data platform comparing California school districts on autism / special education quality. Free for families, donation-supported, never freemium.

> **Status: Pre-launch (alpha).** Pipeline in active development. Public website not yet deployed. Data and code are open for review.

## Why this exists

[GreatSchools.org](https://greatschools.org) is built for the general-education shopper. Families of children with autism need a different lens: IEP transfer rights, inclusion (LRE) rates by disability category, due-process litigation history, BCBA staffing, AAC support, transition programs. This project aggregates publicly available California data so parents can make informed relocation and placement decisions.

## Scope

- **Disability focus:** Autism spectrum disorder (ASD) — first
- **Geographic phasing:**
  - Phase 1 ✅ — 10 pilot districts in San Diego County (validation set)
  - Phase 2 ✅ — All 42 traditional SD County districts
  - Phase 3 — All ~226 Southern California districts (LA, San Diego, Orange, Riverside, San Bernardino, Ventura, Imperial)
  - Phase 4 — California statewide + additional disability categories

## Data sources

All sources are public records from state and federal agencies. See [docs/data-sources.md](docs/data-sources.md) for the full list and refresh cadence.

- California Department of Education (CDE) DataQuest
- California School Dashboard
- Office of Administrative Hearings (OAH) due-process decisions
- US Department of Education Office for Civil Rights (OCR)
- California SELPA annual performance reports

## AI-generated content

Some district summaries and explainers are produced by Claude (Anthropic). Every AI-generated field is explicitly flagged with `ai_generated: true` in the data and a visible disclaimer on the website. AI output is for context only; **the underlying numbers come from cited government sources**.

## Licensing

- **Code:** MIT — see [LICENSE-CODE](LICENSE-CODE)
- **Data:** CC0 1.0 (public domain dedication) — see [LICENSE-DATA](LICENSE-DATA)

Government source data is public. The project republishes and enriches it under CC0 so downstream researchers, advocacy groups, and parents can use it freely.

## Repo layout

```
data/             # raw snapshots + processed per-source partials + final district profiles + schema
pipeline/         # scrapers, transformers, AI enrichers, validators, admin scripts
  scrapers/       # one module per source (CDE SPED-PS, CA Dashboard, ...)
  transformers/   # merge per-source partials into one profile per district
  enrichers/      # AI summary generation (gated on ANTHROPIC_API_KEY)
  validators/     # schema + semantic checks
  admin/          # operational scripts (pilot list builder, etc.)
web/frontend/     # Next.js 16 static-site frontend (no backend at current scale)
docs/             # methodology, data sources, security, contributing
.github/          # CI workflow + scheduled annual refresh
```

## Running locally

```bash
# Pipeline (data)
.venv/bin/python -m pipeline.scrapers.cde.spedps
.venv/bin/python -m pipeline.scrapers.dashboard.cdashboard
.venv/bin/python -m pipeline.transformers.merge
.venv/bin/python -m pipeline.validators.validate_data
# AI summaries — needs an Anthropic key; we use Doppler for this (see docs/SECURITY.md)
doppler run -- .venv/bin/python -m pipeline.enrichers.summarize

# Frontend (reads data/processed/districts/*.json at build time)
cd web/frontend && npm install && npm run dev    # http://localhost:3000
cd web/frontend && npm run build                  # static export to web/frontend/out/
```

## Contributing

Not yet accepting community contributions — the data model is still moving. Once the pipeline stabilizes, contribution guidance will land in [docs/CONTRIBUTING.md](docs/CONTRIBUTING.md).

If you're a parent or educator with corrections or context to add, open an issue.

## Disclaimer

This project is **not legal advice, not educational placement advice, and not affiliated with any school district, SELPA, or government agency.** Numbers are point-in-time snapshots that may lag district reality. Always verify directly with the district and your child's IEP team.
