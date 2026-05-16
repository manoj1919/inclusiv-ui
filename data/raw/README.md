# Raw source snapshots (not committed)

This directory is where pipeline scrapers cache raw downloads from upstream
government sources (CDE, OAH, OCR, etc.).

## Why these files aren't in git

Raw snapshots are large (the CDE SPED file alone is ~13 MB) and increase
linearly with each annual refresh. Committing them would balloon the repo
history. Their content is:

1. **Public** — every byte comes from a freely-downloadable government URL
2. **Reproducible** — the source URL plus the SHA-256 recorded in each
   processed district profile's `build_provenance` field lets anyone verify
   that a given snapshot matches what we used.

## Layout

```
data/raw/
├── README.md            # this file (tracked)
├── _cache/              # transient download cache (never tracked)
└── <source_id>/
    └── YYYY-MM-DD/
        └── <filename>   # the raw download
```

## Long-term archival (future)

When the project is public-facing, we plan to mirror annual snapshots to a
durable, citable archive (Zenodo or similar) so that historical analyses
remain reproducible even if upstream URLs rot.
