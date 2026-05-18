"""Scraper for CA Office of Administrative Hearings (OAH) special-education decisions.

OAH publishes its special-education due-process decisions as individual PDFs,
listed (case number only — no district name) across ~64 paginated index pages:

    https://www.dgs.ca.gov/OAH/Case-Types/Special-Education/Services/Decisions

Attribution therefore requires opening every PDF: the respondent district is
named in the decision caption. This module:

  1. collect — walk the index pages, gather every decision PDF URL (+ year)
  2. download — fetch each PDF to data/raw/oah/<date>/pdfs/ (polite, resumable)
  3. attribute — extract caption text, match the named district to a pilot
     district, flag autism-related decisions by keyword
  4. emit — write per-district partial profiles with 5-year decision counts

All phases are idempotent and resumable: the URL manifest is cached, already
downloaded PDFs are skipped, and attribution re-runs from local PDFs.

The site is accessible with a normal browser User-Agent (the bare fetcher is
403'd). Requests are paced ~1.5s apart.

Usage:
    python -m pipeline.scrapers.oah.decisions
"""

from __future__ import annotations

import datetime as dt
import json
import re
import sys
import time
import urllib.error
from pathlib import Path
from urllib.parse import urljoin
from urllib.request import Request, urlopen

from pipeline.utils import sourced, utc_now_iso

REPO_ROOT = Path(__file__).resolve().parents[3]
RAW_DIR = REPO_ROOT / "data" / "raw" / "oah"
OUT_DIR = REPO_ROOT / "data" / "processed" / "oah"
PILOT_FILE = REPO_ROOT / "data" / "pilot_districts.json"

SOURCE_ID = "oah"
INDEX_URL = "https://www.dgs.ca.gov/OAH/Case-Types/Special-Education/Services/Decisions"
SOURCE_INFO_URL = INDEX_URL
UA = "inclusiv-ui-pipeline/0.1 (open special-education data project; contact via github.com/manoj1919/inclusiv-ui)"
DELAY_S = 1.5
INDEX_PAGES = 66  # a few past the observed last page; empty pages are harmless
WINDOW_YEARS = 5

_AUTISM_RE = re.compile(r"\bautis(?:m|tic)\b|\bASD\b", re.I)
# A "<words> SCHOOL DISTRICT" phrase, matched against caption/intro text that
# has been upper-cased and whitespace-collapsed (OAH captions are all-caps and
# wrap the district name across lines).
_DISTRICT_PHRASE_RE = re.compile(
    r"([A-Z][A-Z0-9.\-]*(?: [A-Z0-9][A-Z0-9.\-]*){0,5} SCHOOL DISTRICT)"
)

# Words that legitimately precede a district name in a caption. If the token
# before a name-suffix is one of these (or a number, or nothing), the suffix
# is the whole district name. Anything else — notably another place word like
# "BUENA" in "Buena Vista" — means the suffix is only PART of a longer
# district's name, so it must be rejected.
_CONNECTORS = frozenset("""
 V VS THE OF AND OR A AN TO IN ON AT BY FOR FROM WITH WITHIN INTO THAT IS DID
 NAMING REPRESENTED RESPONDENT PETITIONER DECISION MATTER NUMBER NO N CASE
 HEARING BEHALF REQUEST APPEARED ADDING CONDUCTED ASSIGNED OFFICES BOUNDARIES
 DEPARTMENT RESIDED RESIDENT LIVED MOVED THROUGH CALLED SERVICES COMPLAINT SEE
 MODIFIED DOCUMENT ISSUE STUDENT PARENT PARENTS AGAINST NEIGHBORING ATTEND
""".split())

# "Elementary" is unreliable: OAH captions add or drop it freely, and several
# pilot names append it where the official caption omits it.
_OPTIONAL = "ELEMENTARY"


# ---- name matching -------------------------------------------------------

def district_name_tokens(name: str) -> list[str]:
    """Ordered, upper-cased significant tokens of a district name."""
    return [w for w in re.sub(r"[^A-Z0-9 ]", " ", name.upper()).split() if w]


def phrase_pre_tokens(phrase: str) -> list[str]:
    """Ordered tokens of a captured phrase, minus the trailing SCHOOL DISTRICT."""
    toks = [w for w in re.sub(r"[^A-Z0-9 ]", " ", phrase.upper()).split() if w]
    while toks and toks[-1] in ("SCHOOL", "DISTRICT"):
        toks.pop()
    return toks


def district_matches(name_toks: list[str], pre_toks: list[str]) -> bool:
    """True if `name_toks` is the district named at the tail of a caption phrase.

    The name must be a contiguous *suffix* of the phrase tokens — so "Vista
    Unified" never matches the tail of "Buena Vista Union School District" —
    "Elementary" is optional on either side, and whatever immediately precedes
    the name must be a connector word or a number, never another place word.
    """
    forms = {
        tuple(name_toks),
        tuple(t for t in name_toks if t != _OPTIONAL),
        tuple(name_toks) + (_OPTIONAL,),
    }
    for form in forms:
        k = len(form)
        if not k or k > len(pre_toks):
            continue
        if tuple(pre_toks[-k:]) != form:
            continue
        if len(pre_toks) == k:
            return True  # name sits at the start of the captured phrase
        before = pre_toks[-k - 1]
        if before in _CONNECTORS or before.isdigit():
            return True
    return False


# ---- phase 1: collect PDF URLs ------------------------------------------

def _get(url: str, *, binary: bool = False, timeout: int = 60):
    req = Request(url, headers={"User-Agent": UA})
    with urlopen(req, timeout=timeout) as r:
        return r.read() if binary else r.read().decode("utf-8", errors="ignore")


def collect_pdf_urls(snapshot_dir: Path) -> list[dict]:
    """Walk the index pages; return [{url, year, filename}], cached to manifest.json."""
    manifest_path = snapshot_dir / "manifest.json"
    if manifest_path.exists():
        return json.loads(manifest_path.read_text())

    seen: dict[str, dict] = {}
    for page in range(INDEX_PAGES):
        url = INDEX_URL if page == 0 else f"{INDEX_URL}?page={page}"
        try:
            html = _get(url)
        except urllib.error.URLError as e:
            print(f"  index page {page}: fetch error {e} — skipping")
            time.sleep(DELAY_S)
            continue
        hrefs = re.findall(r'href="([^"]*\.pdf[^"]*)"', html, re.I)
        new = 0
        for href in hrefs:
            full = urljoin(url, href)
            if full in seen:
                continue
            ym = re.search(r"/(20\d\d)/", full)
            seen[full] = {
                "url": full,
                "year": int(ym.group(1)) if ym else None,
                "filename": full.rsplit("/", 1)[-1],
            }
            new += 1
        print(f"  index page {page}: {len(hrefs)} links ({new} new) — total {len(seen)}")
        time.sleep(DELAY_S)

    manifest = list(seen.values())
    snapshot_dir.mkdir(parents=True, exist_ok=True)
    manifest_path.write_text(json.dumps(manifest, indent=2))
    print(f"Collected {len(manifest)} decision PDF URLs -> {manifest_path}")
    return manifest


# ---- phase 2: download PDFs ---------------------------------------------

def download_all(manifest: list[dict], pdf_dir: Path) -> dict[str, int]:
    pdf_dir.mkdir(parents=True, exist_ok=True)
    stats = {"downloaded": 0, "skipped": 0, "failed": 0}
    total = len(manifest)
    for i, entry in enumerate(manifest, 1):
        dest = pdf_dir / entry["filename"]
        if dest.exists() and dest.stat().st_size > 0:
            stats["skipped"] += 1
            continue
        try:
            data = _get(entry["url"], binary=True, timeout=90)
            dest.write_bytes(data)
            stats["downloaded"] += 1
        except Exception as e:  # noqa: BLE001 — network is best-effort
            stats["failed"] += 1
            print(f"  FAIL {entry['filename']}: {e}")
        if i % 50 == 0:
            print(f"  download {i}/{total} (got {stats['downloaded']}, "
                  f"skipped {stats['skipped']}, failed {stats['failed']})")
        time.sleep(DELAY_S)
    print(f"Download complete: {stats}")
    return stats


# ---- phase 3: attribute decisions to districts --------------------------

def extract_caption_text(pdf_path: Path) -> str | None:
    """First three pages of text (the caption + intro) — None if unreadable."""
    try:
        import pdfplumber

        with pdfplumber.open(str(pdf_path)) as pdf:
            return "\n".join((p.extract_text() or "") for p in pdf.pages[:5])
    except Exception:  # noqa: BLE001 — scanned/corrupt PDFs are expected
        return None


def attribute(manifest: list[dict], pdf_dir: Path, pilot: list[dict]) -> dict:
    district_names = {d["cds_code"]: district_name_tokens(d["name"]) for d in pilot}
    # per district: list of {year, autism}
    hits: dict[str, list[dict]] = {d["cds_code"]: [] for d in pilot}
    stats = {"parsed": 0, "unreadable": 0, "missing": 0, "no_pilot_district": 0}

    for entry in manifest:
        pdf_path = pdf_dir / entry["filename"]
        if not pdf_path.exists():
            stats["missing"] += 1
            continue
        text = extract_caption_text(pdf_path)
        if not text:
            stats["unreadable"] += 1
            continue
        stats["parsed"] += 1
        autism = bool(_AUTISM_RE.search(text))
        norm = re.sub(r"\s+", " ", text).upper()
        matched = set()
        for phrase in _DISTRICT_PHRASE_RE.findall(norm):
            pre = phrase_pre_tokens(phrase)
            for cds, dname in district_names.items():
                if district_matches(dname, pre):
                    matched.add(cds)
        if not matched:
            stats["no_pilot_district"] += 1
            continue
        for cds in matched:
            hits[cds].append({"year": entry["year"], "autism": autism})
    return {"hits": hits, "stats": stats}


# ---- phase 4: emit partial profiles -------------------------------------

def write_partials(hits: dict[str, list[dict]], pilot: list[dict], as_of: str) -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    years = [h["year"] for hs in hits.values() for h in hs if h["year"]]
    max_year = max(years) if years else dt.date.today().year
    window_lo = max_year - WINDOW_YEARS + 1
    fetched_at = utc_now_iso()
    name_by_cds = {d["cds_code"]: d["name"] for d in pilot}

    for d in pilot:
        cds = d["cds_code"]
        in_window = [h for h in hits[cds] if h["year"] and window_lo <= h["year"] <= max_year]
        total = len(in_window)
        autism = sum(1 for h in in_window if h["autism"])
        all_time = len(hits[cds])
        note = (
            f"OAH special-education decisions naming this district, "
            f"{window_lo}-{max_year}. All-time published total: {all_time}. "
            f"Autism count is a keyword heuristic (decision text mentions autism/ASD)."
        )
        partial = {
            "_source": SOURCE_ID,
            "_partial": True,
            "cds_code": cds,
            "compliance": {
                "oah_cases_5yr_total": sourced(
                    total, source=SOURCE_ID, as_of=as_of,
                    fetched_at=fetched_at, url=SOURCE_INFO_URL, note=note,
                ),
                "oah_cases_5yr_autism": sourced(
                    autism, source=SOURCE_ID, as_of=as_of,
                    fetched_at=fetched_at, url=SOURCE_INFO_URL,
                    note="Keyword heuristic — see oah_cases_5yr_total note.",
                ),
            },
        }
        (OUT_DIR / f"{cds}.json").write_text(json.dumps(partial, indent=2, sort_keys=True))
        if total:
            print(f"  {cds} {name_by_cds[cds]:<32} {total:3d} in {window_lo}-{max_year} "
                  f"({autism} autism-related; {all_time} all-time)")
    print(f"Wrote {len(pilot)} partial profiles to {OUT_DIR.relative_to(REPO_ROOT)}")


def main() -> int:
    pilot = json.loads(PILOT_FILE.read_text())["districts"]
    snapshot_dir = RAW_DIR / dt.date.today().isoformat()
    pdf_dir = snapshot_dir / "pdfs"

    print("== Phase 1: collect decision PDF URLs ==")
    manifest = collect_pdf_urls(snapshot_dir)

    print("\n== Phase 2: download PDFs ==")
    download_all(manifest, pdf_dir)

    print("\n== Phase 3: attribute decisions to pilot districts ==")
    result = attribute(manifest, pdf_dir, pilot)
    print(f"Attribution stats: {result['stats']}")

    print("\n== Phase 4: write partial profiles ==")
    write_partials(result["hits"], pilot, as_of=dt.date.today().isoformat())
    return 0


if __name__ == "__main__":
    sys.exit(main())
