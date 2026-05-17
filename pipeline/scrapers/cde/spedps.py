"""Scraper for CDE Special Education Enrollment by Program Setting (SPED-PS).

Downloads the statewide annual TSV file and extracts district-level autism and
overall enrollment + LRE placement data for pilot districts.

Source page: https://www.cde.ca.gov/ds/ad/filesspedps.asp
File structure: https://www.cde.ca.gov/ds/ad/fsspedps.asp

The TSV has aggregate-level rows for state (T), county (C), reporting district (D),
DSEA (A), and school (S). This module only extracts district (D) rows, keyed by
the 7-digit CDS code (county_code + district_code).

Usage:
    python -m pipeline.scrapers.cde.spedps
"""

from __future__ import annotations

import csv
import datetime as dt
import json
import sys
from pathlib import Path
from typing import Iterable

from pipeline.utils import download, parse_int, parse_pct, sha256_of, sourced, utc_now_iso

REPO_ROOT = Path(__file__).resolve().parents[3]
RAW_DIR = REPO_ROOT / "data" / "raw" / "cde_spedps"
OUT_DIR = REPO_ROOT / "data" / "processed" / "cde_spedps"
PILOT_FILE = REPO_ROOT / "data" / "pilot_districts.json"

ACADEMIC_YEAR = "2024-25"
SOURCE_URL = "https://www3.cde.ca.gov/demo-downloads/sped/spedps2425.txt"
SOURCE_INFO_URL = "https://www.cde.ca.gov/ds/ad/filesspedps.asp"
# Census Day = first Wednesday in October for the academic year
DATA_AS_OF = "2024-10-02"
SOURCE_ID = "cde_spedps"

# Disability and total category codes used in the file's ReportingCategory column
CAT_AUTISM = "DC_AUT"
CAT_TOTAL = "TA"

# The CDE file reports every district THREE times, distinguished by the
# `Charter School` column:
#   'All' — the district plus every charter school it authorizes
#   'N'   — district-operated schools only
#   'Y'   — authorized charter schools only
# A district profile keys to the official full CDE district aggregate ('All').
# Without this filter the three rows collide and the last one wins, which
# silently corrupts counts for any charter-authorizing district.
CHARTER_AGGREGATE = "All"


def load_pilot_cds_codes() -> set[str]:
    data = json.loads(PILOT_FILE.read_text())
    return {d["cds_code"] for d in data["districts"]}


def iter_rows(path: Path) -> Iterable[dict]:
    # CDE files use Latin-1 (CP1252) for Spanish characters in place names.
    with path.open(encoding="latin-1") as f:
        reader = csv.DictReader(f, delimiter="\t")
        for row in reader:
            yield row


def normalize(rows: Iterable[dict], pilot_cds: set[str]) -> dict[str, dict]:
    """Group district-level rows by CDS code; capture autism + overall categories."""
    out: dict[str, dict] = {}
    for row in rows:
        if row.get("Aggregate Level") != "D":
            continue
        if row.get("Charter School") != CHARTER_AGGREGATE:
            continue
        county_code = row["County Code"].zfill(2)
        district_code = row["District Code"].zfill(5)
        cds = f"{county_code}-{district_code}"
        if cds not in pilot_cds:
            continue
        bucket = out.setdefault(
            cds,
            {
                "cds_code": cds,
                "district_name": row["District Name"],
                "county_name": row["County Name"],
                "academic_year": row.get("Academic Year"),
                "by_category": {},
            },
        )
        bucket["by_category"][row["ReportingCategory"]] = {
            "sped_total": parse_int(row["SPED_ENR_N"]),
            "rc_gte_80pct_n": parse_int(row["PS_RCGT80_N"]),
            "rc_40_79pct_n": parse_int(row["PS_RC4079_N"]),
            "rc_lt_40pct_n": parse_int(row["PS_RCL40_N"]),
            "separate_school_n": parse_int(row["PS_SSOS_N"]),
            "preschool_n": parse_int(row["PS_PSS_N"]),
            "missing_n": parse_int(row["PS_MUK_N"]),
            "rc_gte_80pct_pct": parse_pct(row["PS_RCGT80_%"]),
            "rc_40_79pct_pct": parse_pct(row["PS_RC4079_%"]),
            "rc_lt_40pct_pct": parse_pct(row["PS_RCL40_%"]),
            "separate_school_pct": parse_pct(row["PS_SSOS_%"]),
        }
    return out


def to_partial_profile(record: dict, fetched_at: str) -> dict:
    """Produce a partial district profile containing only fields this source owns."""
    aut = record["by_category"].get(CAT_AUTISM, {})
    ta = record["by_category"].get(CAT_TOTAL, {})

    def s(value):
        return sourced(
            value,
            source=SOURCE_ID,
            as_of=DATA_AS_OF,
            fetched_at=fetched_at,
            url=SOURCE_INFO_URL,
        )

    return {
        "_source": SOURCE_ID,
        "_partial": True,
        "_academic_year": record["academic_year"],
        "cds_code": record["cds_code"],
        "name": record["district_name"],
        "county": record["county_name"],
        "enrollment": {
            "students_with_iep": s(ta.get("sped_total")),
            "students_with_autism": s(aut.get("sped_total")),
        },
        "inclusion_metrics": {
            "lre_80pct_plus_gen_ed_all_disabilities": s(ta.get("rc_gte_80pct_pct")),
            "lre_80pct_plus_gen_ed_autism": s(aut.get("rc_gte_80pct_pct")),
            "lre_separate_setting_all_disabilities": s(ta.get("separate_school_pct")),
            "lre_separate_setting_autism": s(aut.get("separate_school_pct")),
        },
    }


def main() -> int:
    today = dt.date.today().isoformat()
    raw_out = RAW_DIR / today / "spedps.tsv"

    print(f"Source: {SOURCE_URL}")
    print(f"Snapshot path: {raw_out}")
    _, sha = download(SOURCE_URL, raw_out)
    print(f"SHA-256: {sha}")

    pilot = load_pilot_cds_codes()
    print(f"Pilot CDS codes: {sorted(pilot)}")

    records = normalize(iter_rows(raw_out), pilot)
    print(f"Matched {len(records)} of {len(pilot)} pilot districts")

    fetched_at = utc_now_iso()
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    for cds, rec in sorted(records.items()):
        partial = to_partial_profile(rec, fetched_at)
        out_path = OUT_DIR / f"{cds}.json"
        out_path.write_text(json.dumps(partial, indent=2, sort_keys=True))
        print(f"  -> {out_path}  ({rec['district_name']})")

    missing = pilot - records.keys()
    if missing:
        print(f"\nWARNING: no rows found for CDS codes: {sorted(missing)}")
        print("These may need CDS verification against authoritative CDE source.")
        print("(Pilot uses 'cds_code_unverified' field for this reason.)")

    return 0


if __name__ == "__main__":
    sys.exit(main())
