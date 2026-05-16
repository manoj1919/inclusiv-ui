# Security & Secret Management

## Secrets policy

**No API keys, tokens, passwords, or credentials are ever committed to this repository.**

All secrets are managed via [Doppler](https://www.doppler.com/) and injected into processes at runtime. The repo never contains a `.env` file with real values — only documentation of which variables are expected.

## Required secrets

| Variable | Used by | Purpose |
|---|---|---|
| `ANTHROPIC_API_KEY` | `pipeline/enrichers/` | Generate plain-language district summaries via Claude API |
| `DATABASE_URL` | `web/backend/` | PostgreSQL connection (Phase 2+) |

## Running with Doppler

Install Doppler CLI: https://docs.doppler.com/docs/install-cli

One-time setup per developer:

```bash
cd inclusiv-ui
doppler login
doppler setup            # link this directory to a Doppler project + config
```

Run any pipeline command with injected secrets:

```bash
doppler run -- python -m pipeline.scrapers.cde
doppler run -- python -m pipeline.enrichers.summarize
```

Run the FastAPI backend:

```bash
doppler run -- uvicorn web.backend.main:app --reload
```

## CI / GitHub Actions

GitHub Actions workflows use Doppler service tokens stored as repository secrets (`DOPPLER_TOKEN_*`). Workflows never use raw API keys.

## If a secret leaks

1. Rotate the key immediately at the provider (Anthropic console, etc.).
2. Update Doppler with the new value.
3. If the leak made it into a git commit, [purge it from history](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/removing-sensitive-data-from-a-repository) and force-push (coordinate with maintainers).
4. Open a security issue documenting the incident.

## Reporting vulnerabilities

If you discover a security issue with the data pipeline, frontend, or any deployed service, please email rather than open a public issue. Address TBD.
