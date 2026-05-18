"""Build school-level profiles for the 42 pilot districts.

School-level granularity is an *all-students-with-disabilities* view: CDE
publishes the disability-category breakdown (autism etc.) only at district
level and above. School rows carry one combined SWD total. So a school
profile has no autism fields, no compliance, no AI summaries — those stay
district-level.

This module reuses the raw snapshots the district scrapers already
downloaded (SPED-PS, CA Dashboard, Census Enrollment) — no new network
fetch — extracts each source's `Aggregate Level = S` rows for schools in the
pilot districts, joins them by the 14-digit school CDS, and writes one
profile per school to data/processed/schools/.

Anchored on the SPED-PS school set (schools with reported SWD enrollment);
Dashboard and Enrollment values attach where present.

Usage:
    python -m pipeline.scrapers.schools.extract
"""

from __future__ import annotations

import csv
import datetime as dt
import glob
import json
import sys
from pathlib import Path
from typing import Iterable

from jsonschema import Draft202012Validator

from pipeline.utils import parse_int, parse_pct, sourced, utc_now_iso

REPO_ROOT = Path(__file__).resolve().parents[3]
RAW = REPO_ROOT / "data" / "raw"
OUT_DIR = REPO_ROOT / "data" / "processed" / "schools"
PILOT_FILE = REPO_ROOT / "data" / "pilot_districts.json"
SCHEMA_PATH = REPO_ROOT / "data" / "schema" / "school.schema.json"

SPEDPS_AS_OF = "2024-10-02"
ENROLL_AS_OF = "2024-10-02"
DASHBOARD_AS_OF = "2025-06-30"
SPEDPS_URL = "https://www.cde.ca.gov/ds/ad/filesspedps.asp"
ENROLL_URL = "https://www.cde.ca.gov/ds/ad/filesenrcensus.asp"
DASHBOARD_URL = "https://www.cde.ca.gov/ta/ac/cm/dashboardresources.asp"

# CA Dashboard indicator files: (filename prefix, field prefix, scale-to-fraction)
DASHBOARD_INDICATORS = [
    ("chronicdownload", "chronic_absenteeism_rate", True),
    ("suspdownload", "suspension_rate", True),
    ("eladownload", "ela_distance_from_standard", False),
    ("mathdownload", "math_distance_from_standard", False),
]


def _latest(pattern: str) -> Path:
    hits = sorted(glob.glob(str(RAW / pattern)))
    if not hits:
        raise FileNotFoundError(f"No raw snapshot for {pattern}")
    return Path(hits[-1])


def _rows(path: Path) -> Iterable[dict]:
    with path.open(encoding="latin-1") as f:
        yield from csv.DictReader(f, delimiter="\t")


def _dash_value(s: str | None, *, scale: bool) -> float | None:
    if s is None:
        return None
    s = s.strip()
    if s in ("", "*", "N/A"):
        return None
    return round(float(s) / 100.0, 4) if scale else round(float(s), 2)


def load_pilot() -> dict[str, str]:
    """Return {5-digit district code: district name} for the pilot set."""
    out = {}
    for d in json.loads(PILOT_FILE.read_text())["districts"]:
        out[d["cds_code"].split("-")[1]] = d["name"]
    return out


def extract_spedps(pilot: dict[str, str]) -> dict[str, dict]:
    """Anchor set — one entry per school with reported SWD enrollment."""
    schools: dict[str, dict] = {}
    for r in _rows(_latest("cde_spedps/*/spedps.tsv")):
        if r.get("Aggregate Level") != "S" or r.get("ReportingCategory") != "TA":
            continue
        dc = r["District Code"].zfill(5)
        if dc not in pilot:
            continue
        cc, sc = r["County Code"].zfill(2), r["School Code"].zfill(7)
        # Skip CDE pseudo-records: 0000000 (district aggregate) and 0000001
        # (the nonpublic / district special-ed placeholder) are not schools.
        if sc in ("0000000", "0000001"):
            continue
        cds = f"{cc}-{dc}-{sc}"
        schools[cds] = {
            "cds_code": cds,
            "school_code": sc,
            "name": r["School Name"].strip(),
            "district_cds": f"{cc}-{dc}",
            "district_name": pilot[dc],
            "county": r["County Name"].strip() or "San Diego",
            "charter": r.get("Charter School", "N").strip().upper() == "Y",
            "total_swd": parse_int(r["SPED_ENR_N"]),
            "lre_80pct": parse_pct(r["PS_RCGT80_%"]),
            "lre_separate": parse_pct(r["PS_SSOS_%"]),
        }
    return schools


def extract_dashboard() -> dict[str, dict]:
    """{school_cds: {field: value}} across the four indicator files."""
    out: dict[str, dict] = {}
    for prefix, field_prefix, scale in DASHBOARD_INDICATORS:
        try:
            path = _latest(f"ca_dashboard/*/{prefix}2025.txt")
        except FileNotFoundError:
            continue
        for r in _rows(path):
            if r.get("rtype") != "S":
                continue
            cds14 = r.get("cds", "")
            if len(cds14) != 14:
                continue
            group = r.get("studentgroup")
            if group not in ("ALL", "SWD"):
                continue
            cds = f"{cds14[:2]}-{cds14[2:7]}-{cds14[7:]}"
            suffix = "all" if group == "ALL" else "swd"
            out.setdefault(cds, {})[f"{field_prefix}_{suffix}"] = _dash_value(
                r.get("currstatus"), scale=scale
            )
    return out


def extract_enrollment() -> dict[str, int | None]:
    out: dict[str, int | None] = {}
    for r in _rows(_latest("cde_enrollment/*/cdenroll2425.txt")):
        if r.get("AggregateLevel") != "S" or r.get("ReportingCategory") != "TA":
            continue
        cds = f"{r['CountyCode'].zfill(2)}-{r['DistrictCode'].zfill(5)}-{r['SchoolCode'].zfill(7)}"
        out[cds] = parse_int(r["TOTAL_ENR"])
    return out


def build_profile(s: dict, dash: dict, enroll: int | None, fetched_at: str) -> dict:
    sources: list[str] = ["cde_spedps"]

    def sp(value, as_of, url):
        return sourced(value, source="cde_spedps", as_of=as_of, fetched_at=fetched_at, url=url)

    enrollment: dict = {
        "students_with_iep": sourced(
            s["total_swd"], source="cde_spedps", as_of=SPEDPS_AS_OF,
            fetched_at=fetched_at, url=SPEDPS_URL,
        ),
    }
    if enroll is not None:
        sources.append("cde_enrollment")
        enrollment["total"] = sourced(
            enroll, source="cde_enrollment", as_of=ENROLL_AS_OF,
            fetched_at=fetched_at, url=ENROLL_URL,
        )
        # Only a valid ratio when SWD <= enrollment. Special-ed / adult-
        # transition schools count SWD ages 3-22 but enroll few or no TK-12
        # students, so the ratio is meaningless there — leave pct_iep null.
        if s["total_swd"] is not None and enroll and s["total_swd"] <= enroll:
            enrollment["pct_iep"] = {
                "value": round(s["total_swd"] / enroll, 4),
                "source": "derived",
                "as_of": ENROLL_AS_OF,
                "note": (
                    "Derived: all students with disabilities as a share of "
                    "total school enrollment. School-level data has no autism "
                    "breakdown — autism figures are district-level only."
                ),
            }

    outcome: dict = {}
    for field, value in dash.items():
        outcome[field] = sourced(
            value, source="ca_dashboard", as_of=DASHBOARD_AS_OF,
            fetched_at=fetched_at, url=DASHBOARD_URL,
        )
    if dash:
        sources.append("ca_dashboard")

    profile = {
        "schema_version": "0.1.0",
        "level": "school",
        "cds_code": s["cds_code"],
        "school_code": s["school_code"],
        "name": s["name"],
        "district_cds": s["district_cds"],
        "district_name": s["district_name"],
        "county": s["county"],
        "charter": s["charter"],
        "enrollment": enrollment,
        "inclusion_metrics": {
            "lre_80pct_plus_gen_ed_all_disabilities": sp(s["lre_80pct"], SPEDPS_AS_OF, SPEDPS_URL),
            "lre_separate_setting_all_disabilities": sp(s["lre_separate"], SPEDPS_AS_OF, SPEDPS_URL),
        },
        "outcome_metrics": outcome,
        "data_sources_used": sources,
        "build_provenance": {"built_at": fetched_at},
        "last_updated": dt.date.today().isoformat(),
    }
    return profile


def main() -> int:
    pilot = load_pilot()
    schools = extract_spedps(pilot)
    dashboard = extract_dashboard()
    enrollment = extract_enrollment()
    print(f"SPED-PS schools (anchor): {len(schools)}")
    print(f"Dashboard school records: {len(dashboard)}  |  Enrollment school records: {len(enrollment)}")

    schema = json.loads(SCHEMA_PATH.read_text())
    Draft202012Validator.check_schema(schema)
    validator = Draft202012Validator(schema)

    fetched_at = utc_now_iso()
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    for stale in OUT_DIR.glob("*.json"):  # full rewrite each run
        stale.unlink()
    with_dash = with_enroll = failed = 0
    for cds, s in sorted(schools.items()):
        dash = dashboard.get(cds, {})
        enroll = enrollment.get(cds)
        profile = build_profile(s, dash, enroll, fetched_at)
        errors = list(validator.iter_errors(profile))
        if errors:
            failed += 1
            loc = "/".join(str(p) for p in errors[0].absolute_path) or "<root>"
            print(f"  FAIL  {cds}  {loc}: {errors[0].message}")
            continue
        if dash:
            with_dash += 1
        if enroll is not None:
            with_enroll += 1
        (OUT_DIR / f"{cds}.json").write_text(json.dumps(profile, indent=2, sort_keys=True))

    written = len(schools) - failed
    print(f"\nWrote {written} school profiles to {OUT_DIR.relative_to(REPO_ROOT)}")
    print(f"  schema-valid: {written}/{len(schools)}")
    print(f"  with Dashboard outcomes: {with_dash}/{written}")
    print(f"  with total enrollment:   {with_enroll}/{written}")
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main())
