"""Generate the Phase-2 San Diego County district list.

Reads the latest CDE SPED-PS raw snapshot, extracts every district-level row
in San Diego County (county_code = 37), drops non-district entities (COE,
state-board charter authorizers), and heuristically classifies type + region.

Preserves the curated `rationale` field for any district already present in
the file. New districts are added with `auto_added: true` so a human can
review and refine.

Usage:
    python -m pipeline.admin.build_sd_county_list [--write]

Without --write, prints the proposed list to stdout for review.
"""

from __future__ import annotations

import argparse
import csv
import json
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]
RAW_DIR = REPO_ROOT / "data" / "raw" / "cde_spedps"
PILOT_FILE = REPO_ROOT / "data" / "pilot_districts.json"

# Filter out non-traditional district entities. "SBE -" / "SBC -" are
# state-board-authorized charter schools that appear at the district aggregate
# level but don't represent a traditional school district; COE serves
# districts rather than enrolling students directly.
SKIP_NAME_PREFIXES = ("SBE -", "SBC -")
SKIP_NAME_EXACT = {"San Diego County Office of Education"}

# Best-effort region map by district name keyword. Anything not matched is
# tagged "Unknown" so a human can correct it.
REGION_RULES: list[tuple[str, str]] = [
    ("San Diego Unified", "Central"),
    ("Coronado", "South Coast"),
    ("Carlsbad", "North Coast"),
    ("Del Mar", "North Coast"),
    ("Encinitas", "North Coast"),
    ("Solana Beach", "North Coast"),
    ("Oceanside", "North Coast"),
    ("Rancho Santa Fe", "North Coast"),
    ("Cardiff", "North Coast"),
    ("San Dieguito", "North Coast"),
    ("Poway", "North Inland"),
    ("Escondido", "North Inland"),
    ("San Marcos", "North Inland"),
    ("Vista", "North Inland"),
    ("Ramona", "North Inland"),
    ("Valley Center", "North Inland"),
    ("Bonsall", "North Inland"),
    ("Fallbrook", "North Inland"),
    ("San Pasqual", "North Inland"),
    ("Warner", "North Inland"),
    ("Chula Vista", "South"),
    ("Sweetwater", "South"),
    ("National", "South"),
    ("San Ysidro", "South"),
    ("South Bay", "South"),
    ("Alpine", "East"),
    ("Borrego Springs", "East"),
    ("Cajon Valley", "East"),
    ("Dehesa", "East"),
    ("Grossmont", "East"),
    ("Jamul-Dulzura", "East"),
    ("Julian", "East"),
    ("La Mesa", "East"),
    ("Lakeside", "East"),
    ("Lemon Grove", "East"),
    ("Mountain Empire", "East"),
    ("Santee", "East"),
    ("Spencer Valley", "East"),
    ("Vallecitos", "East"),
]


def classify_type(name: str) -> str:
    """Map a district name to one of the schema enum values."""
    n = name.lower()
    if "unified" in n:
        return "Unified K-12"
    if "union high" in n or n.endswith("high"):
        return "High School Only"
    if "elementary" in n or "union" in n:
        return "Elementary K-6"  # default; some are K-8 — refine manually
    return "Other"


def classify_region(name: str) -> str:
    for needle, region in REGION_RULES:
        if needle.lower() in name.lower():
            return region
    return "Unknown"


def latest_snapshot() -> Path:
    date_dirs = sorted([d for d in RAW_DIR.iterdir() if d.is_dir()])
    if not date_dirs:
        sys.exit("No CDE SPED-PS snapshots found. Run the scraper first.")
    return date_dirs[-1] / "spedps.tsv"


def extract_sd_districts(path: Path) -> dict[str, str]:
    out: dict[str, str] = {}
    with path.open(encoding="latin-1") as f:
        reader = csv.DictReader(f, delimiter="\t")
        for row in reader:
            if row.get("Aggregate Level") != "D":
                continue
            if row.get("County Code") != "37":
                continue
            name = (row.get("District Name") or "").strip()
            if not name or name in SKIP_NAME_EXACT:
                continue
            if any(name.startswith(p) for p in SKIP_NAME_PREFIXES):
                continue
            ccode = row["County Code"]
            dcode = row["District Code"]
            cds = f"{ccode}-{dcode}"
            out[cds] = name
    return out


def merge_with_existing(existing: list[dict], all_districts: dict[str, str]) -> list[dict]:
    by_cds = {d["cds_code"]: d for d in existing}
    out: list[dict] = []
    for cds, name in sorted(all_districts.items()):
        if cds in by_cds:
            out.append(by_cds[cds])
        else:
            out.append({
                "name": name,
                "region": classify_region(name),
                "type": classify_type(name),
                "cds_code": cds,
                "auto_added": True,
            })
    return out


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--write", action="store_true", help="Write changes to pilot_districts.json")
    args = ap.parse_args()

    snap = latest_snapshot()
    all_districts = extract_sd_districts(snap)
    print(f"Found {len(all_districts)} SD County traditional districts in {snap.name}")

    existing = json.loads(PILOT_FILE.read_text())
    merged = merge_with_existing(existing["districts"], all_districts)

    auto = [d for d in merged if d.get("auto_added")]
    print(f"  - {len(merged) - len(auto)} retained from existing pilot")
    print(f"  - {len(auto)} newly auto-added")
    for d in auto:
        print(f"    [{d['region']:<13}] [{d['type']:<18}] {d['cds_code']}  {d['name']}")

    if args.write:
        out = dict(existing)
        out["_comment"] = (
            "Phase 2 list (all San Diego County traditional districts). "
            "Districts with `auto_added: true` were generated from the CDE "
            "SPED-PS file with heuristic region/type classification — review and "
            "correct as needed. State-Board-authorized charters and the County "
            "Office of Education are excluded."
        )
        out["phase"] = 2
        out["districts"] = merged
        PILOT_FILE.write_text(json.dumps(out, indent=2))
        print(f"\nWrote {len(merged)} districts to {PILOT_FILE.relative_to(REPO_ROOT)}")
    else:
        print("\n(dry run — pass --write to update the pilot file)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
