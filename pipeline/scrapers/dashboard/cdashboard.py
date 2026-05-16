"""Scraper for California School Dashboard indicators.

Pulls four indicator files — chronic absenteeism, suspension, ELA, math —
and extracts district-level values for both 'All Students' (ALL) and
'Students with Disabilities' (SWD) subgroups.

The Dashboard does not break out by disability category (autism), so this
source gives us outcome context for all SWD; CDE SPED-PS remains the
autism-specific source.

Source: https://www.cde.ca.gov/ta/ac/cm/dashboardresources.asp

Usage:
    python -m pipeline.scrapers.dashboard.cdashboard
"""

from __future__ import annotations

import csv
import datetime as dt
import json
import sys
from pathlib import Path
from typing import Iterable

from pipeline.utils import download, parse_pct, sourced, utc_now_iso

REPO_ROOT = Path(__file__).resolve().parents[3]
RAW_DIR = REPO_ROOT / "data" / "raw" / "ca_dashboard"
OUT_DIR = REPO_ROOT / "data" / "processed" / "ca_dashboard"
PILOT_FILE = REPO_ROOT / "data" / "pilot_districts.json"

YEAR = "2025"  # 2024-25 school year
ACADEMIC_YEAR = "2024-25"
DATA_AS_OF = "2025-06-30"  # Dashboard typically published end of school year
SOURCE_ID = "ca_dashboard"
SOURCE_INFO_URL = "https://www.cde.ca.gov/ta/ac/cm/dashboardresources.asp"

# (indicator_id, source_filename_prefix, output_field_prefix, value_parser, scale_pct)
INDICATORS = [
    ("chronic_absenteeism", "chronicdownload", "chronic_absenteeism_rate", True),
    ("suspension", "suspdownload", "suspension_rate", True),
    ("ela", "eladownload", "ela_distance_from_standard", False),
    ("math", "mathdownload", "math_distance_from_standard", False),
]

GROUP_ALL = "ALL"
GROUP_SWD = "SWD"


def load_pilot_cds_codes() -> set[str]:
    data = json.loads(PILOT_FILE.read_text())
    # Dashboard files use a 14-digit padded CDS code: county(2) + district(5) + school(7).
    # For district-level rows the school portion is all zeros.
    return {d["cds_code"].replace("-", "") + "0000000" for d in data["districts"]}


def map_cds_to_short(cds14: str) -> str:
    """Convert a 14-digit Dashboard CDS code to the 7-char dashed district-level form."""
    return f"{cds14[:2]}-{cds14[2:7]}"


def parse_number(s: str | None, *, scale_pct: bool) -> float | None:
    """Parse `currstatus`. May be empty (no data), '*' (suppressed), or numeric.
    `scale_pct=True` converts percentages to 0-1 floats.
    """
    if s is None:
        return None
    s = s.strip()
    if s in ("", "*", "N/A"):
        return None
    if scale_pct:
        return round(float(s) / 100.0, 4)
    return round(float(s), 2)


def iter_rows(path: Path) -> Iterable[dict]:
    with path.open(encoding="latin-1") as f:
        reader = csv.DictReader(f, delimiter="\t")
        for row in reader:
            yield row


def extract_district_rows(rows: Iterable[dict], pilot_cds14: set[str]) -> dict[str, dict]:
    """Return {cds14: {GROUP_ALL: row, GROUP_SWD: row}} for our pilot districts."""
    out: dict[str, dict] = {}
    for row in rows:
        if row.get("rtype") != "D":
            continue
        cds = row.get("cds", "")
        if cds not in pilot_cds14:
            continue
        group = row.get("studentgroup")
        if group not in (GROUP_ALL, GROUP_SWD):
            continue
        out.setdefault(cds, {})[group] = row
    return out


def main() -> int:
    today = dt.date.today().isoformat()
    fetched_at = utc_now_iso()
    pilot_cds14 = load_pilot_cds_codes()

    # Per-district aggregator: {cds14: {field: sourced_value}}
    aggregate: dict[str, dict] = {cds: {} for cds in pilot_cds14}

    for indicator_id, file_prefix, field_prefix, scale_pct in INDICATORS:
        url = f"https://www3.cde.ca.gov/researchfiles/cadashboard/{file_prefix}{YEAR}.txt"
        snap = RAW_DIR / today / f"{file_prefix}{YEAR}.txt"
        print(f"\n[{indicator_id}] {url}")
        _, sha = download(url, snap)
        print(f"[{indicator_id}] sha256={sha[:16]}…")

        per_district = extract_district_rows(iter_rows(snap), pilot_cds14)
        print(f"[{indicator_id}] districts matched: {len(per_district)}/{len(pilot_cds14)}")

        for cds14, by_group in per_district.items():
            for group, suffix in [(GROUP_ALL, "all"), (GROUP_SWD, "swd")]:
                row = by_group.get(group)
                if not row:
                    continue
                value = parse_number(row.get("currstatus"), scale_pct=scale_pct)
                field = f"{field_prefix}_{suffix}"
                aggregate[cds14][field] = sourced(
                    value,
                    source=SOURCE_ID,
                    as_of=DATA_AS_OF,
                    fetched_at=fetched_at,
                    url=SOURCE_INFO_URL,
                )

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    written = 0
    for cds14, fields in sorted(aggregate.items()):
        if not fields:
            print(f"WARN: no Dashboard data for {map_cds_to_short(cds14)}")
            continue
        partial = {
            "_source": SOURCE_ID,
            "_partial": True,
            "_academic_year": ACADEMIC_YEAR,
            "cds_code": map_cds_to_short(cds14),
            "outcome_metrics": fields,
        }
        out_path = OUT_DIR / f"{map_cds_to_short(cds14)}.json"
        out_path.write_text(json.dumps(partial, indent=2, sort_keys=True))
        written += 1
    print(f"\nWrote {written} partial profiles to {OUT_DIR}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
