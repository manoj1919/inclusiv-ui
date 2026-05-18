"""Scraper for CDE Census Day Enrollment — total TK/K-12 district enrollment.

The SPED-PS source (`spedps.py`) carries only special-education counts, so
`enrollment.total` — the whole student body — has no value without this
second CDE file: the annual Census Day Enrollment data.

File structure mirrors SPED-PS: rows at state (T) / county (C) / district (D)
/ school (S) aggregate levels, each district reported three times by the
`Charter` column (ALL / N / Y). We take the district-level, all-charter,
`ReportingCategory = TA` (total, all students) row — consistent with the
`Charter == All` choice made for SPED-PS.

Source page: https://www.cde.ca.gov/ds/ad/filesenrcensus.asp

Usage:
    python -m pipeline.scrapers.cde.enrollment
"""

from __future__ import annotations

import csv
import datetime as dt
import json
import sys
from pathlib import Path
from typing import Iterable

from pipeline.utils import download, parse_int, sourced, utc_now_iso

REPO_ROOT = Path(__file__).resolve().parents[3]
RAW_DIR = REPO_ROOT / "data" / "raw" / "cde_enrollment"
OUT_DIR = REPO_ROOT / "data" / "processed" / "cde_enrollment"
PILOT_FILE = REPO_ROOT / "data" / "pilot_districts.json"

ACADEMIC_YEAR = "2024-25"
SOURCE_URL = "https://www3.cde.ca.gov/demo-downloads/census/cdenroll2425.txt"
SOURCE_INFO_URL = "https://www.cde.ca.gov/ds/ad/filesenrcensus.asp"
# Census Day = first Wednesday in October (same as SPED-PS).
DATA_AS_OF = "2024-10-02"
SOURCE_ID = "cde_enrollment"

# The file reports each district three times via the `Charter` column
# (ALL / N / Y). Use the full district aggregate, matching the SPED-PS choice.
CHARTER_AGGREGATE = "ALL"
# `ReportingCategory` row that is the all-students total.
CAT_TOTAL = "TA"


def load_pilot_cds_codes() -> set[str]:
    data = json.loads(PILOT_FILE.read_text())
    return {d["cds_code"] for d in data["districts"]}


def iter_rows(path: Path) -> Iterable[dict]:
    # CDE files are Latin-1, tab-separated.
    with path.open(encoding="latin-1") as f:
        yield from csv.DictReader(f, delimiter="\t")


def normalize(rows: Iterable[dict], pilot_cds: set[str]) -> dict[str, dict]:
    """Return {cds: {total_enrollment, district_name, county_name}} for pilot districts."""
    out: dict[str, dict] = {}
    for row in rows:
        if row.get("AggregateLevel") != "D":
            continue
        if row.get("Charter") != CHARTER_AGGREGATE:
            continue
        if row.get("ReportingCategory") != CAT_TOTAL:
            continue
        cds = f"{row['CountyCode'].zfill(2)}-{row['DistrictCode'].zfill(5)}"
        if cds not in pilot_cds:
            continue
        out[cds] = {
            "cds_code": cds,
            "district_name": row["DistrictName"],
            "county_name": row["CountyName"],
            "total_enrollment": parse_int(row["TOTAL_ENR"]),
        }
    return out


def to_partial_profile(record: dict, fetched_at: str) -> dict:
    return {
        "_source": SOURCE_ID,
        "_partial": True,
        "_academic_year": ACADEMIC_YEAR,
        "cds_code": record["cds_code"],
        "name": record["district_name"],
        "county": record["county_name"],
        "enrollment": {
            "total": sourced(
                record["total_enrollment"],
                source=SOURCE_ID,
                as_of=DATA_AS_OF,
                fetched_at=fetched_at,
                url=SOURCE_INFO_URL,
            ),
        },
    }


def main() -> int:
    today = dt.date.today().isoformat()
    raw_out = RAW_DIR / today / "cdenroll2425.txt"

    print(f"Source: {SOURCE_URL}")
    _, sha = download(SOURCE_URL, raw_out)
    print(f"Snapshot: {raw_out.relative_to(REPO_ROOT)}  (sha256 {sha[:16]}…)")

    pilot = load_pilot_cds_codes()
    records = normalize(iter_rows(raw_out), pilot)
    print(f"Matched {len(records)} of {len(pilot)} pilot districts")

    fetched_at = utc_now_iso()
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    for cds, rec in sorted(records.items()):
        partial = to_partial_profile(rec, fetched_at)
        (OUT_DIR / f"{cds}.json").write_text(json.dumps(partial, indent=2, sort_keys=True))
        print(f"  {cds}  {rec['district_name']:<32} total_enrollment={rec['total_enrollment']}")

    missing = pilot - records.keys()
    if missing:
        print(f"\nWARNING: no enrollment row for: {sorted(missing)}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
