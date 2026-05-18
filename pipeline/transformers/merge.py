"""Merge per-source partial district profiles into validated final profiles.

Reads:
  data/processed/<source>/<cds_code>.json   (partial profiles from each scraper)
  data/pilot_districts.json                  (district metadata + CDS codes)
Writes:
  data/processed/districts/<cds_code>.json   (final, schema-validated profile)

Conflict resolution: if two sources report the same field, the one listed
earlier in SOURCE_PRIORITY wins. (Sources don't typically overlap in this
project — see docs/methodology.md.)

Usage:
    python -m pipeline.transformers.merge
"""

from __future__ import annotations

import datetime as dt
import json
import sys
from pathlib import Path

from jsonschema import Draft202012Validator

from pipeline import __version__ as PIPELINE_VERSION
from pipeline.utils import sha256_of, utc_now_iso

REPO_ROOT = Path(__file__).resolve().parents[2]
PROCESSED_DIR = REPO_ROOT / "data" / "processed"
RAW_DIR = REPO_ROOT / "data" / "raw"
OUT_DIR = PROCESSED_DIR / "districts"
PILOT_FILE = REPO_ROOT / "data" / "pilot_districts.json"
SCHEMA_PATH = REPO_ROOT / "data" / "schema" / "district.schema.json"

# Sources in priority order (earlier wins on conflict)
SOURCE_PRIORITY = ["cde_spedps", "ca_dashboard", "ocr", "oah"]

# Markers stripped from partial profiles during merge
PARTIAL_MARKERS = {"_source", "_partial", "_academic_year"}


def deep_merge_priority(base: dict, overlay: dict) -> dict:
    """Merge `overlay` into `base`. Base wins on conflict (already-set fields preserved).

    Recursively merges dicts; for any non-dict leaf, base value is kept if present.
    """
    out = dict(base)
    for k, v in overlay.items():
        if k in PARTIAL_MARKERS:
            continue
        if k in out and isinstance(out[k], dict) and isinstance(v, dict):
            out[k] = deep_merge_priority(out[k], v)
        elif k not in out:
            out[k] = v
    return out


def load_partials(cds: str) -> list[tuple[str, dict]]:
    """Return (source_id, partial_dict) tuples for a CDS code, ordered by SOURCE_PRIORITY."""
    found = []
    for source in SOURCE_PRIORITY:
        path = PROCESSED_DIR / source / f"{cds}.json"
        if path.exists():
            found.append((source, json.loads(path.read_text())))
    return found


def collect_raw_snapshots() -> list[dict]:
    """Find the latest raw snapshot per source and record its sha256."""
    snapshots = []
    if not RAW_DIR.exists():
        return snapshots
    for source_dir in sorted(RAW_DIR.iterdir()):
        if not source_dir.is_dir() or source_dir.name.startswith("_") or source_dir.name.startswith("."):
            continue
        date_dirs = sorted([d for d in source_dir.iterdir() if d.is_dir()])
        if not date_dirs:
            continue
        latest = date_dirs[-1]
        for f in sorted(latest.iterdir()):
            if not f.is_file():
                continue
            rel = f.relative_to(REPO_ROOT)
            snapshots.append({
                "source": source_dir.name,
                "path": str(rel),
                "sha256": sha256_of(f),
            })
    return snapshots


def build_profile(district: dict, partials: list[tuple[str, dict]],
                  raw_snapshots: list[dict]) -> dict:
    """Construct the final profile from district metadata + per-source partials."""
    profile: dict = {
        "schema_version": "0.1.0",
        "cds_code": district["cds_code"],
        "name": district["name"],
        "county": "San Diego",
        "county_code": "37",
        "district_type": district["type"],
        "region": district["region"],
    }

    for source, partial in partials:
        profile = deep_merge_priority(profile, partial)

    profile["data_sources_used"] = [s for s, _ in partials]
    profile["build_provenance"] = {
        "pipeline_version": PIPELINE_VERSION,
        "built_at": utc_now_iso(),
        "raw_snapshots": [s for s in raw_snapshots
                          if s["source"] in profile["data_sources_used"]],
    }
    profile["last_updated"] = dt.date.today().isoformat()
    return profile


def main() -> int:
    pilot = json.loads(PILOT_FILE.read_text())
    schema = json.loads(SCHEMA_PATH.read_text())
    Draft202012Validator.check_schema(schema)
    validator = Draft202012Validator(schema)

    raw_snapshots = collect_raw_snapshots()
    print(f"Tracked {len(raw_snapshots)} raw snapshot(s)")

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    failed = 0
    for d in pilot["districts"]:
        cds = d["cds_code"]
        partials = load_partials(cds)
        if not partials:
            print(f"SKIP  {cds} {d['name']:<28} (no partial data)")
            continue
        profile = build_profile(d, partials, raw_snapshots)
        errors = list(validator.iter_errors(profile))
        if errors:
            failed += 1
            print(f"FAIL  {cds} {d['name']:<28} ({len(errors)} schema errors)")
            for e in errors[:3]:
                loc = "/".join(str(p) for p in e.absolute_path) or "<root>"
                print(f"        - {loc}: {e.message}")
            continue
        out_path = OUT_DIR / f"{cds}.json"
        out_path.write_text(json.dumps(profile, indent=2, sort_keys=True))
        sources = ",".join(profile["data_sources_used"])
        print(f"OK    {cds} {d['name']:<28} sources=[{sources}]")

    print(f"\nWrote final profiles to {OUT_DIR.relative_to(REPO_ROOT)}")
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main())
