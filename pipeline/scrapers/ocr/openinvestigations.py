"""Scraper for US DoE Office for Civil Rights (OCR) pending investigations.

OCR publishes a weekly list of K-12 ("elementary-secondary" / ESE) and
post-secondary institutions with civil-rights investigations currently open:

    https://ocrcas.ed.gov/open-investigations

That site sits behind an AWS WAF CAPTCHA ("Human Verification") — automated
HTTP and headless-browser fetches are blocked, so this source CANNOT be
auto-fetched. It is exported manually once per refresh cycle:

    1. Open https://ocrcas.ed.gov/open-investigations in a normal browser.
    2. Filter: State = California, Institution Type = ESE,
       items per page = 1000.
    3. Save the page as HTML into:
       data/raw/ocr/<YYYY-MM-DD>/open_investigations_ca_ese.html

This module parses that saved snapshot, attributes each row to a pilot
district by institution name, and writes per-district partial profiles.

Important: this is a *point-in-time snapshot of currently-open
investigations*, not a historical 5-year complaint count — hence the field
name `ocr_open_investigations`. A district with 0 is genuinely 0 (the export
is the complete California ESE list).

Usage:
    python -m pipeline.scrapers.ocr.openinvestigations
"""

from __future__ import annotations

import datetime as dt
import html
import json
import re
import sys
from pathlib import Path

from pipeline.utils import sourced, utc_now_iso

REPO_ROOT = Path(__file__).resolve().parents[3]
RAW_DIR = REPO_ROOT / "data" / "raw" / "ocr"
OUT_DIR = REPO_ROOT / "data" / "processed" / "ocr"
PILOT_FILE = REPO_ROOT / "data" / "pilot_districts.json"

SOURCE_ID = "ocr"
SOURCE_INFO_URL = "https://ocrcas.ed.gov/open-investigations"
SNAPSHOT_NAME = "open_investigations_ca_ese.html"

# Words dropped when reducing an institution / district name to a token set.
_STOP = {"SCHOOL", "DISTRICT", "THE", "OF"}


def name_tokens(name: str) -> frozenset[str]:
    """Reduce a district or institution name to a comparable token set."""
    cleaned = re.sub(r"[^A-Z0-9 ]", " ", name.upper())
    return frozenset(w for w in cleaned.split() if w and w not in _STOP)


def names_match(district: frozenset[str], institution: frozenset[str]) -> bool:
    """True if an OCR institution name refers to this district.

    One token set must contain the other (OCR sometimes adds or drops a
    suffix such as "Elementary"). "HIGH" must agree, so a K-8 district is
    never matched to its companion high-school district, or vice versa.
    """
    if not (district <= institution or institution <= district):
        return False
    return ("HIGH" in district) == ("HIGH" in institution)


def load_pilot() -> list[dict]:
    return json.loads(PILOT_FILE.read_text())["districts"]


def latest_snapshot() -> Path:
    """Newest data/raw/ocr/<date>/ snapshot file."""
    if not RAW_DIR.exists():
        raise FileNotFoundError(f"No OCR snapshots under {RAW_DIR}")
    dated = sorted(d for d in RAW_DIR.iterdir() if d.is_dir())
    if not dated:
        raise FileNotFoundError(f"No dated snapshot dirs under {RAW_DIR}")
    snap = dated[-1] / SNAPSHOT_NAME
    if not snap.exists():
        raise FileNotFoundError(f"Expected snapshot missing: {snap}")
    return snap


def parse_rows(page_html: str) -> list[dict]:
    """Extract investigation rows: institution, discrimination type, open date."""
    rows = []
    for tr in re.findall(r"<tr[^>]*>(.*?)</tr>", page_html, re.S):
        cells = [
            html.unescape(re.sub(r"<[^>]+>", "", c)).strip()
            for c in re.findall(r"<td[^>]*>(.*?)</td>", tr, re.S)
        ]
        if len(cells) >= 5:
            rows.append(
                {
                    "state": cells[0],
                    "institution": cells[1],
                    "institution_type": cells[2],
                    "discrimination": cells[3],
                    "open_date": cells[4],
                }
            )
    return rows


def extract_as_of(page_html: str) -> str:
    """OCR list's own 'Last Updated' date, ISO-formatted; today if absent."""
    m = re.search(r"Last Updated:\s*([A-Za-z]+ \d{1,2},? \d{4})", page_html)
    if m:
        for fmt in ("%B %d, %Y", "%B %d %Y"):
            try:
                return dt.datetime.strptime(m.group(1).replace(",", ""), fmt.replace(",", "")).date().isoformat()
            except ValueError:
                continue
    return dt.date.today().isoformat()


def main() -> int:
    snap = latest_snapshot()
    page_html = snap.read_text(encoding="utf-8", errors="ignore")
    rows = parse_rows(page_html)
    as_of = extract_as_of(page_html)
    fetched_at = utc_now_iso()
    print(f"Snapshot: {snap.relative_to(REPO_ROOT)}")
    print(f"Parsed {len(rows)} California ESE investigation rows; OCR list as of {as_of}")

    pilot = load_pilot()
    district_tokens = {d["cds_code"]: name_tokens(d["name"]) for d in pilot}

    # Attribute each row to at most one district.
    per_district: dict[str, list[dict]] = {d["cds_code"]: [] for d in pilot}
    matched = 0
    multi = 0
    for row in rows:
        inst = name_tokens(row["institution"])
        hits = [cds for cds, dt_ in district_tokens.items() if names_match(dt_, inst)]
        if len(hits) == 1:
            per_district[hits[0]].append(row)
            matched += 1
        elif len(hits) > 1:
            multi += 1
            print(f"  AMBIGUOUS: {row['institution']!r} -> {hits}")

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    name_by_cds = {d["cds_code"]: d["name"] for d in pilot}
    for cds, hits in sorted(per_district.items()):
        total = len(hits)
        disability = sum(1 for h in hits if h["discrimination"].upper().startswith("DISABILITY"))
        note = None
        if total:
            note = "; ".join(sorted(f"{h['discrimination']} (opened {h['open_date']})" for h in hits))
        partial = {
            "_source": SOURCE_ID,
            "_partial": True,
            "cds_code": cds,
            "compliance": {
                "ocr_open_investigations": sourced(
                    total, source=SOURCE_ID, as_of=as_of,
                    fetched_at=fetched_at, url=SOURCE_INFO_URL, note=note,
                ),
                "ocr_open_investigations_disability": sourced(
                    disability, source=SOURCE_ID, as_of=as_of,
                    fetched_at=fetched_at, url=SOURCE_INFO_URL,
                ),
            },
        }
        (OUT_DIR / f"{cds}.json").write_text(json.dumps(partial, indent=2, sort_keys=True))
        if total:
            print(f"  {cds} {name_by_cds[cds]:<32} {total:2d} open ({disability} disability-related)")

    print(f"\nAttributed {matched}/{len(rows)} rows to pilot districts; "
          f"{len(rows) - matched} rows are non-pilot CA institutions.")
    if multi:
        print(f"WARNING: {multi} row(s) matched more than one district — review above.")
    print(f"Wrote 42 partial profiles to {OUT_DIR.relative_to(REPO_ROOT)}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
