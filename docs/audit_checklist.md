# Pre-launch audit checklist

Local-only until this is fully signed off. Public push is gated on completing every item.

**Phase 4 audit run: 2026-05-18** — worked through by the data pipeline + Claude Code session.
Result: all automated checks pass; items needing a human eye are noted. Remaining gate for a
*public* push is the security review + the product owner's sign-off (private beta does not need it).

## Data correctness

- [x] Spot-check 5 random districts: numbers on the rendered page match the raw CDE SPED-PS and CA Dashboard files. — *5/5 exact match (San Diego Unified, Poway, Cardiff, Chula Vista, Carlsbad).*
- [x] Verify autism inclusion rate (`lre_80pct_plus_gen_ed_autism`) matches CDE’s published `PS_RCGT80_%` for `ReportingCategory = DC_AUT`. — *matched for all 5 spot-check districts.*
- [x] Confirm all CDS codes resolve to the correct district by name on the CDE master file.
- [x] Review `pilot_districts.json`: every `auto_added` district has a verified `region` and `type`. — *3 districts mis-classified `Other` corrected to K-8. NOTE for next refresh: the K-6 vs K-8 split on the remaining elementary districts has not been individually re-verified against CDE grade spans.*

## AI hygiene

- [x] Every district profile has both `overview` and `what_this_means_for_parents`. — *42/42.*
- [x] Every AI summary renders inside the `AI-generated` badge with the disclaimer.
- [x] Sample-read AI summaries for hallucinated numbers / prescriptive language / rankings / comparisons. — *all 84 summaries scanned for banned patterns: 0 hits.*
- [x] `ai_model` reflects the model that produced the summary. — *`claude-opus (via Claude Code session)`.*
- [x] Compliance/programs AI summaries are intentionally absent — no UI element implies they exist.

## Provenance and licensing

- [x] Every numeric field has `source`, `as_of`, (and where applicable `fetched_at`, `url`). — *0 issues across 42 profiles.*
- [x] `build_provenance` validated — `validate_data` passes with 0 errors / 0 warnings.
- [x] `LICENSE-CODE` (MIT) and `LICENSE-DATA` (CC0) present and referenced from the footer.
- [x] Footer states the directory is informational, not placement advice.

## Security

- [x] No API keys / tokens / secrets in git-tracked files (pattern scan clean).
- [x] `.gitignore` excludes `.env*`, `.doppler/`, `secrets/`, `credentials/`, `data/raw/`.
- [ ] If any future on-the-fly AI uses Gemini Flash, `GEMINI_API_KEY` is a GitHub secret. — *N/A: no on-the-fly AI in v1.*
- [x] No personally identifiable information — district-level aggregates only.
- [ ] Full security review (`docs/SECURITY.md`) — *pending, tracked as the security task before any public push.*

## Frontend

- [x] `next build` succeeds with zero TypeScript or ESLint errors. — *48/48 pages; one pre-existing ESLint error fixed (CompareProvider → useSyncExternalStore).*
- [x] All 42 district pages render real numbers, not "—".
- [x] Search + lens filter + compare flow work with no console errors. — *Playwright smoke test 18/18.*
- [x] Dark mode passes contrast.
- [x] Mobile layout (375px) does not overflow. — *fixed a 460px SectionNav overflow.*
- [x] No reference to a backend, FastAPI, or login.

## Repository hygiene

- [x] `README.md` reflects current scope and phase status.
- [x] `docs/methodology.md` describes the pipeline that actually exists.
- [x] `docs/data-sources.md` accurately describes every shipped source, including the OCR and OAH scrapers (built 2026-05; no longer deferred).
- [x] CI workflow passes on a clean checkout. — *fixed: `pip install -e .` was broken by flat-layout package discovery; added `[build-system]` + `[tool.setuptools.packages.find]` and the missing `pipeline/validators/__init__.py`; `pytest` → 12 passed.*

## Anything not on this list

Found and fixed during the 2026-05-18 audit:
- **CI was broken** — `pip install -e .` failed on the flat repo layout. Fixed in `pyproject.toml`.
- **Mobile overflow** — the 7-chapter `SectionNav` overflowed a 375px viewport; now wraps on mobile.
- **ESLint error** — `CompareProvider` did setState-in-effect; refactored to `useSyncExternalStore`.
- **JSX whitespace** — a dropped space after an `<abbr>` in the compliance panel; fixed with an explicit space.

Add any future findings here, fix them, and promote recurring ones into the sections above.
