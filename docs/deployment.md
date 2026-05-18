# Deployment

## v1: private beta (current phase)

Per the locked scope, inclusiv·ui ships an **invite-only private beta** before
any public launch — it must not be publicly indexed until the content and
security audits are signed off. The site is a static export, so "deploying"
is just serving a folder.

### Build

```bash
cd web/frontend
npx next build          # output: "export" → writes web/frontend/out/
```

`out/` is a self-contained static site (~17 MB, 48 pages). It has no server
dependency — any static file server works.

### Serve the private beta over Tailscale (recommended)

Tailscale gives invite-only access for free: only devices on the tailnet can
reach the site, and it is never exposed to the public internet — exactly what
the private-beta phase needs.

```bash
cd web/frontend/out
python3 -m http.server 8088        # binds all interfaces; reachable on the tailnet
```

Beta testers (on the tailnet) then open:

- `http://sunshine.tail8c7baf.ts.net:8088/`
- or `http://100.85.152.25:8088/`

Run it inside `tmux` (or as a systemd/service unit) so it survives logout.
Note this serves the **production build**, unlike `next dev` on `:3000` which
is for development only.

### Going public (later — gated)

A public launch is gated on: the `docs/audit_checklist.md` content audit
(done) **and** a final maintainer sign-off. When ready, the static `out/`
deploys to any static host — Vercel is the planned target (the stack note in
the project memory). Until then, do not enable public indexing; keep the beta
on the tailnet.

## Refresh cadence

Data refreshes annually with the CDE release cycle. To refresh:

```bash
.venv/bin/python -m pipeline.scrapers.cde.spedps
.venv/bin/python -m pipeline.scrapers.dashboard.cdashboard
.venv/bin/python -m pipeline.scrapers.ocr.openinvestigations   # needs a manual OCR snapshot first
.venv/bin/python -m pipeline.scrapers.oah.decisions
.venv/bin/python -m pipeline.transformers.merge
.venv/bin/python -m pipeline.enrichers.summarize               # regenerate AI summaries in-session
.venv/bin/python -m pipeline.validators.validate_data
cd web/frontend && npx next build
```

See `docs/data-sources.md` for the manual OCR-export step (CAPTCHA-walled site).
