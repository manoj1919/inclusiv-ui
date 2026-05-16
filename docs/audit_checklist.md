# Pre-launch audit checklist

Local-only until this is fully signed off. Public push is gated on completing every item.

## Data correctness

- [ ] Spot-check 5 random districts: numbers on the rendered page match the raw CDE SPED-PS and CA Dashboard files.
- [ ] Verify autism inclusion rate (`lre_80pct_plus_gen_ed_autism`) matches CDE’s published `PS_RCGT80_%` for `ReportingCategory = DC_AUT` for each of the 5 spot-check districts.
- [ ] Confirm all CDS codes resolve to the correct district by name on the CDE master file (`SchoolDirectory id=dl2`).
- [ ] Review `pilot_districts.json`: replace every `auto_added: true` flag with verified `region` and `type` (some K-8 districts are currently classified `Other`; some elementary districts default to K-6 when they may be K-8).

## AI hygiene

- [ ] Every district profile under `data/processed/districts/` has both `overview` and `what_this_means_for_parents` populated.
- [ ] Visual: every AI summary on the site is wrapped in the amber `AI-generated` badge with the full disclaimer beneath it.
- [ ] Sample-read 5 AI summaries end-to-end. Look for: hallucinated numbers, prescriptive language ("you should…"), district rankings, comparison claims not present in the source data.
- [ ] Confirm `ai_model` field on every summary reflects the model that actually produced it (re-run after any model change).
- [ ] Compliance and programs summaries are intentionally absent — make sure no UI element implies they exist.

## Provenance and licensing

- [ ] Every numeric field on every profile has `source`, `as_of`, `fetched_at`, and `url`.
- [ ] `build_provenance.raw_snapshots` SHA-256 fingerprints match the local raw files (re-run validators).
- [ ] `LICENSE-CODE` (MIT) and `LICENSE-DATA` (CC0) present and referenced from the footer.
- [ ] Footer makes clear: this is informational; not legal or educational placement advice.

## Security

- [ ] No API keys, Doppler tokens, or other secrets anywhere under git tracking. Run `git ls-files | xargs grep -lE 'sk-ant|sk_live|AIza|api[_-]?key'` and resolve hits.
- [ ] `.gitignore` excludes `.env*`, `.doppler/`, `secrets/`, `credentials/`, raw snapshots.
- [ ] If any future on-the-fly AI feature uses Gemini Flash, `GEMINI_API_KEY` is set as a GitHub repo secret — never committed.
- [ ] No personally identifiable information anywhere (we collect district-level aggregates only — verify there is no stray student-level record).

## Frontend

- [ ] `npm run build` succeeds with zero TypeScript or ESLint errors.
- [ ] All 42 district pages render and show numbers, not "—" everywhere.
- [ ] Search and filter on the directory work without errors in the console.
- [ ] Dark mode passes contrast.
- [ ] Mobile layout (375px wide) doesn’t overflow or break the metric cards.
- [ ] No reference to a backend, FastAPI, or login (none exists in v1).

## Repository hygiene

- [ ] `README.md` reflects current scope and phase status.
- [ ] `docs/methodology.md` describes the pipeline that actually exists (no references to deferred modules as if they shipped).
- [ ] `docs/data-sources.md` flags OCR CRDC and OAH as deferred.
- [ ] CI workflow (`.github/workflows/ci.yml`) passes on a clean checkout.

## Anything not on this list

If something feels off during the audit and isn’t covered above, write it down here, fix it, and add the item permanently to the checklist for future refreshes.
