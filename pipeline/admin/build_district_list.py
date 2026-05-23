"""Generate a multi-county district list (Phase 3 SoCal expansion).

Reads the latest CDE SPED-PS raw snapshot, extracts every district-level row
for the configured county codes, drops non-district entities (COE, state-
board charter authorizers), and heuristically classifies type. County name
comes from the SPED-PS row itself.

Preserves any curated fields (rationale, region, etc.) for districts already
present in pilot_districts.json. New districts are flagged `auto_added`.

Usage:
    python -m pipeline.admin.build_district_list [--write]
    python -m pipeline.admin.build_district_list --counties 19,30,33,36,37,56,13 --write

The default counties are the 7-county SoCal region.
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

# 7-county SoCal region. Override with --counties.
DEFAULT_COUNTIES = ["13", "19", "30", "33", "36", "37", "56"]

# Drop non-traditional entities. SBE-/SBC- are state-board-authorized
# charters that appear at the district aggregate level but aren't traditional
# districts; County Offices of Education serve districts rather than
# directly enrolling. State Special Schools (CA School for the Deaf, etc.)
# are residential statewide schools, not local-choice districts, and their
# SPED-PS counts can exceed their TK-12 census enrollment.
SKIP_NAME_PREFIXES = ("SBE -", "SBC -")
SKIP_NAME_SUFFIXES = ("County Office of Education",)
SKIP_NAME_CONTAINS = ("(State Special Schl)",)


def classify_type(name: str) -> str:
    """Map a district name to one of the schema enum values."""
    n = name.lower()
    if "unified" in n:
        return "Unified K-12"
    if "union high" in n or n.endswith(" high"):
        return "High School Only"
    if "elementary" in n or "union" in n:
        return "Elementary K-6"  # default; some are K-8 — refine manually
    return "Other"


def latest_snapshot() -> Path:
    date_dirs = sorted([d for d in RAW_DIR.iterdir() if d.is_dir()])
    if not date_dirs:
        sys.exit("No CDE SPED-PS snapshots found. Run the scraper first.")
    return date_dirs[-1] / "spedps.tsv"


def extract_districts(path: Path, county_codes: list[str]) -> dict[str, dict]:
    """Return {cds_code: {name, county_code, county_name}} for matching districts."""
    wanted = {c.zfill(2) for c in county_codes}
    out: dict[str, dict] = {}
    with path.open(encoding="latin-1") as f:
        reader = csv.DictReader(f, delimiter="\t")
        for row in reader:
            if row.get("Aggregate Level") != "D":
                continue
            ccode = row.get("County Code", "").zfill(2)
            if ccode not in wanted:
                continue
            name = (row.get("District Name") or "").strip()
            if not name:
                continue
            if any(name.startswith(p) for p in SKIP_NAME_PREFIXES):
                continue
            if any(name.endswith(s) for s in SKIP_NAME_SUFFIXES):
                continue
            if any(c in name for c in SKIP_NAME_CONTAINS):
                continue
            dcode = row["District Code"]
            cds = f"{ccode}-{dcode}"
            out[cds] = {
                "name": name,
                "county_code": ccode,
                "county_name": (row.get("County Name") or "").strip(),
            }
    return out


def merge_with_existing(existing: list[dict], all_districts: dict[str, dict]) -> list[dict]:
    """Preserve curated fields for known CDS codes; auto-add new ones."""
    by_cds = {d["cds_code"]: d for d in existing}
    out: list[dict] = []
    for cds, info in sorted(all_districts.items()):
        if cds in by_cds:
            # Preserve everything the human/previous run set, but make sure
            # county_code + county_name are present (existing SD entries
            # didn't carry them).
            entry = dict(by_cds[cds])
            entry.setdefault("county_code", info["county_code"])
            entry.setdefault("county_name", info["county_name"])
            out.append(entry)
        else:
            out.append({
                "name": info["name"],
                "county_code": info["county_code"],
                "county_name": info["county_name"],
                "region": "Unknown",
                "type": classify_type(info["name"]),
                "cds_code": cds,
                "auto_added": True,
            })
    return out


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--counties", default=",".join(DEFAULT_COUNTIES),
                    help="Comma-separated CA county codes (e.g. '37' or '19,30,33').")
    ap.add_argument("--write", action="store_true",
                    help="Write changes to pilot_districts.json.")
    args = ap.parse_args()

    county_codes = [c.strip() for c in args.counties.split(",") if c.strip()]

    snap = latest_snapshot()
    all_districts = extract_districts(snap, county_codes)
    print(f"Found {len(all_districts)} traditional districts across {len(county_codes)} county code(s) in {snap.name}")

    existing = json.loads(PILOT_FILE.read_text())
    merged = merge_with_existing(existing.get("districts") or [], all_districts)

    auto = [d for d in merged if d.get("auto_added")]
    print(f"  - {len(merged) - len(auto)} retained from existing pilot")
    print(f"  - {len(auto)} newly auto-added")

    # Per-county breakdown
    by_county: dict[str, int] = {}
    for d in merged:
        cc = d.get("county_code", d["cds_code"].split("-")[0])
        by_county[cc] = by_county.get(cc, 0) + 1
    print("  Per-county counts:")
    for cc in sorted(by_county):
        print(f"    {cc}: {by_county[cc]} districts")

    if args.write:
        county_names = sorted({d.get("county_name") for d in merged if d.get("county_name")})
        out = {
            "_comment": (
                "Phase 3 SoCal expansion. Districts with `auto_added: true` were "
                "generated from the CDE SPED-PS file with heuristic type "
                "classification — review and correct as needed. State-Board-"
                "authorized charters and County Offices of Education are excluded."
            ),
            "phase": 3,
            "counties": county_names,
            "county_codes": sorted(set(by_county)),
            "districts": merged,
        }
        PILOT_FILE.write_text(json.dumps(out, indent=2))
        print(f"\nWrote {len(merged)} districts to {PILOT_FILE.relative_to(REPO_ROOT)}")
    else:
        print("\n(dry run — pass --write to update the pilot file)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
