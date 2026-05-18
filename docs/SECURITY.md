# Security

## v1 posture: a fully static site

inclusiv·ui v1 is a **static export** (`next.config.ts` → `output: "export"`).
There is **no server, no backend, no database, no authentication, no user
accounts, and no user-submitted data**. The deployed artifact is plain
HTML/CSS/JS in `web/frontend/out/`. The attack surface is therefore minimal:
there is nothing to inject into, no session to steal, no API to abuse.

The data pipeline (`pipeline/`) runs locally or in CI. Every data source is a
**public, unauthenticated** government download or a manually-saved snapshot —
so the pipeline needs **no API keys or credentials of any kind**. AI summaries
are written by Claude in a Claude Code session (see
`pipeline/enrichers/summarize.py`); there is no paid AI API call and no
`ANTHROPIC_API_KEY`.

## Secrets policy

**No API keys, tokens, passwords, or credentials are ever committed.**

As of v1 the project has **no runtime secrets**. The checklist below is the
standing policy and covers anything added later:

- `.gitignore` excludes `.env*`, `.doppler/`, `secrets/`, `credentials/`, and
  `data/raw/` (raw snapshots).
- The pre-launch audit (`docs/audit_checklist.md`) runs a secret-pattern scan
  over all git-tracked files; it is clean.
- The OCR raw snapshot is the one force-added file under `data/raw/` — it is a
  public records export, not a secret.

## If a future feature needs a secret

Two are anticipated; neither exists in v1:

| Variable | Would be used by | Status |
|---|---|---|
| `GEMINI_API_KEY` | an optional on-the-fly AI feature on the web app | not built — would use Google Gemini Flash per the AI-provider policy |
| `DATABASE_URL` | a Phase 2+ FastAPI backend | not built — v1 has no backend |

When introduced, secrets are injected at runtime (Doppler locally, GitHub
Actions repository secrets in CI) and **never** written to a tracked file.

## If a secret leaks

1. Rotate the key immediately at the provider.
2. Update the secret store (Doppler / GitHub secret) with the new value.
3. If it reached a git commit, purge it from history and force-push.
4. File a private security note documenting the incident.

## Privacy

All data is **district-level aggregate** counts from public datasets — no
student-level records, no personally identifiable information. CDE suppresses
small subgroup counts at the source; the pipeline preserves those suppressions
(`*` → null) rather than working around them.

## Reporting a vulnerability

Email the maintainer rather than opening a public issue. Address TBD before
public launch.
