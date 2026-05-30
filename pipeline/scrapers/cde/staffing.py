"""Scraper for CDE Staff Race/Ethnicity (StRE) — district-level staff counts.

This is the **first Structure-layer source** under the Donabedian /
SPP-APR framework (see docs/framework.md). It populates per-district
certificated-staff totals broken into five aggregate types: administrator
(ADM), teacher (TCH), pupil services (PSV), other certificated (OTH),
and overall (ALL).

PSV (Pupil Services) bundles counselors, psychologists, speech-language
pathologists, social workers, and nurses into one aggregate. CDE
discontinued the granular CBEDS Staff Assignment file after 2018-19;
the per-role granularity that used to be in `StaffAssign<YY>.zip` is no
longer published as a downloadable district-level file. The StRE file is
the best district-level staffing signal currently available.

The downstream merge step (`pipeline/transformers/merge.py`) computes
density ratios — staff per 1,000 students, staff per 100 IEP students —
from these counts plus the enrollment / IEP data already on the profile.

Source page: https://www.cde.ca.gov/ds/ad/filesstre.asp
Direct file: https://www3.cde.ca.gov/demo-downloads/staff/stre2425.txt

Usage:
    python -m pipeline.scrapers.cde.staffing
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
RAW_DIR = REPO_ROOT / "data" / "raw" / "cde_staff"
OUT_DIR = REPO_ROOT / "data" / "processed" / "cde_staff"
PILOT_FILE = REPO_ROOT / "data" / "pilot_districts.json"

ACADEMIC_YEAR = "2024-25"
SOURCE_URL = "https://www3.cde.ca.gov/demo-downloads/staff/stre2425.txt"
SOURCE_INFO_URL = "https://www.cde.ca.gov/ds/ad/filesstre.asp"
# CBEDS Census Day for staff is the same first-Wednesday-in-October
# anchor used for enrollment.
DATA_AS_OF = "2024-10-02"
SOURCE_ID = "cde_staff"

# District-level row filters. Each district is reported many times in the
# file — broken out by Charter School (ALL/N/Y), DASS (ALL/N/Y),
# School Grade Span (ALL / GS_K6 / GS_69 / GS_912 / GS_K12), and Staff
# Gender (ALL/GF/GM/GX). We take the full district aggregate row.
CHARTER_AGGREGATE = "ALL"
DASS_AGGREGATE = "ALL"
GRADE_SPAN_AGGREGATE = "ALL"
GENDER_AGGREGATE = "ALL"

# Staff Type codes in the StRE file.
STAFF_TYPES = {
    "ADM": "administrators",
    "TCH": "teachers",
    "PSV": "pupil_services",
    "OTH": "other_certificated",
    "ALL": "all_certificated",
}


def load_pilot_cds_codes() -> set[str]:
    data = json.loads(PILOT_FILE.read_text())
    return {d["cds_code"] for d in data["districts"]}


def iter_rows(path: Path) -> Iterable[dict]:
    with path.open(encoding="latin-1") as f:
        yield from csv.DictReader(f, delimiter="\t")


def normalize(rows: Iterable[dict], pilot_cds: set[str]) -> dict[str, dict]:
    """Return {cds: {staff_type_field: count}} for pilot districts.

    Aggregates the five Staff Type codes into named fields.
    """
    out: dict[str, dict] = {}
    for row in rows:
        if row.get("Aggregate Level") != "D":
            continue
        if row.get("Charter School") != CHARTER_AGGREGATE:
            continue
        if row.get("DASS") != DASS_AGGREGATE:
            continue
        if row.get("School Grade Span") != GRADE_SPAN_AGGREGATE:
            continue
        if row.get("Staff Gender") != GENDER_AGGREGATE:
            continue
        st = row.get("Staff Type", "").strip()
        if st not in STAFF_TYPES:
            continue
        cc = row.get("County Code", "").strip().zfill(2)
        dc = row.get("District Code", "").strip().zfill(5)
        if not cc or not dc:
            continue
        cds = f"{cc}-{dc}"
        if cds not in pilot_cds:
            continue
        count = parse_int(row.get("Total Staff", ""))
        if count is None:
            continue
        entry = out.setdefault(cds, {
            "cds_code": cds,
            "district_name": row.get("District Name", "").strip(),
            "county_name": row.get("County Name", "").strip(),
        })
        entry[STAFF_TYPES[st]] = count
    return out


def to_partial_profile(record: dict, fetched_at: str) -> dict:
    """Write the raw staff counts. Densities are derived in merge.py."""
    staffing: dict = {}
    for field in STAFF_TYPES.values():
        if field in record:
            staffing[field] = sourced(
                record[field],
                source=SOURCE_ID,
                as_of=DATA_AS_OF,
                fetched_at=fetched_at,
                url=SOURCE_INFO_URL,
            )
    return {
        "_source": SOURCE_ID,
        "_partial": True,
        "_academic_year": ACADEMIC_YEAR,
        "cds_code": record["cds_code"],
        "name": record["district_name"],
        "county": record["county_name"],
        "structure": {
            "staffing": staffing,
        },
    }


def main() -> int:
    today = dt.date.today().isoformat()
    raw_out = RAW_DIR / today / "stre2425.txt"

    print(f"Source: {SOURCE_URL}")
    _, sha = download(SOURCE_URL, raw_out)
    print(f"Snapshot: {raw_out.relative_to(REPO_ROOT)}  (sha256 {sha[:16]}…)")

    pilot = load_pilot_cds_codes()
    records = normalize(iter_rows(raw_out), pilot)
    print(f"Matched {len(records)} of {len(pilot)} pilot districts")

    fetched_at = utc_now_iso()
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    written = 0
    for cds, rec in sorted(records.items()):
        partial = to_partial_profile(rec, fetched_at)
        (OUT_DIR / f"{cds}.json").write_text(json.dumps(partial, indent=2, sort_keys=True))
        all_cert = rec.get("all_certificated", "—")
        tch = rec.get("teachers", "—")
        psv = rec.get("pupil_services", "—")
        print(f"  {cds}  {rec['district_name'][:30]:<32} ALL={all_cert:>5}  TCH={tch:>4}  PSV={psv:>4}")
        written += 1

    missing = pilot - records.keys()
    if missing:
        print(f"\nWARNING: no staff row for: {sorted(missing)[:10]}{'...' if len(missing)>10 else ''}")
    print(f"\nWrote {written} partial profiles to {OUT_DIR.relative_to(REPO_ROOT)}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
