"""Stamp the hand-collected programs/services research onto district profiles.

Reads data/manual/district_web_research.json and writes per district:

  - profile.programs.autism_specific_classrooms  (array of named programs)
  - profile.programs.bcba_on_staff               (SourcedBool, only when confirmed true)
  - profile.programs.transition_18_22_program    (SourcedBool, only when confirmed true)
  - profile.related_services.ot_available        (SourcedBool, only when confirmed true)
  - profile.related_services.pt_available        (SourcedBool, only when confirmed true)
  - profile.related_services.social_skills_groups (SourcedBool, only when confirmed true)
  - profile.related_services.slp_caseload_ratio  (SourcedNumber, when present)
  - profile.district_web_research                (researched_at + additional_findings + sources)

Null values in the manual JSON are *not* written — absence of a structured
field means "not stated in public sources," which is not the same as "no."
The free-text `additional_findings` and `sources` carry the real richness.

Runs after `merge` (like the summarize enricher), same Claude/human staging
file pattern. Idempotent: re-running just re-stamps.

Usage:
    python -m pipeline.enrichers.programs
"""

from __future__ import annotations

import json
import sys
from pathlib import Path

from pipeline.utils import utc_now_iso

REPO_ROOT = Path(__file__).resolve().parents[2]
DISTRICTS_DIR = REPO_ROOT / "data" / "processed" / "districts"
RESEARCH_FILE = REPO_ROOT / "data" / "manual" / "district_web_research.json"

SOURCE_ID = "district_web"


def _sourced(value, *, as_of: str, url: str | None, fetched_at: str) -> dict:
    out = {"value": value, "source": SOURCE_ID, "as_of": as_of, "fetched_at": fetched_at}
    if url:
        out["url"] = url
    return out


def main() -> int:
    if not RESEARCH_FILE.exists():
        print(f"No research file at {RESEARCH_FILE.relative_to(REPO_ROOT)}", file=sys.stderr)
        return 1
    research = json.loads(RESEARCH_FILE.read_text())
    default_as_of = research.get("_researched_on")
    if not default_as_of:
        print("Research file missing `_researched_on` date", file=sys.stderr)
        return 1
    fetched_at = utc_now_iso()

    stamped = skipped = 0
    for path in sorted(DISTRICTS_DIR.glob("*.json")):
        profile = json.loads(path.read_text())
        cds = profile["cds_code"]
        entry = research.get(cds)
        if not entry:
            skipped += 1
            print(f"SKIP  {cds} {profile.get('name', '<unknown>'):<32} (no research entry)")
            continue

        # Per-district `researched_on` overrides the top-level default — lets a
        # newer batch (e.g. SoCal expansion in 2026-05-23) not retimestamp the
        # SD batch from 2026-05-17.
        as_of = entry.get("researched_on") or default_as_of
        first_url = (entry.get("sources") or [None])[0]

        # All these fields live under structure.* in schema 0.2.0 — see
        # docs/framework.md (programs and related services are Structure
        # measures: what the district has in place).
        structure = profile.get("structure") or {}

        # ---- programs ---------------------------------------------------
        programs = dict(structure.get("programs") or {})
        prog_in = entry.get("programs") or {}
        classrooms = prog_in.get("autism_specific_classrooms") or []
        if classrooms:
            programs["autism_specific_classrooms"] = classrooms
        if prog_in.get("bcba_on_staff") is True:
            programs["bcba_on_staff"] = _sourced(True, as_of=as_of, url=first_url, fetched_at=fetched_at)
        if prog_in.get("transition_18_22_program") is True:
            programs["transition_18_22_program"] = _sourced(True, as_of=as_of, url=first_url, fetched_at=fetched_at)
        if programs:
            structure["programs"] = programs

        # ---- related services -------------------------------------------
        rs = dict(structure.get("related_services") or {})
        rs_in = entry.get("related_services") or {}
        for k in ("ot_available", "pt_available", "social_skills_groups"):
            if rs_in.get(k) is True:
                rs[k] = _sourced(True, as_of=as_of, url=first_url, fetched_at=fetched_at)
        slp = rs_in.get("slp_caseload_ratio")
        if slp is not None:
            rs["slp_caseload_ratio"] = _sourced(slp, as_of=as_of, url=first_url, fetched_at=fetched_at)
        if rs:
            structure["related_services"] = rs

        # ---- research block ---------------------------------------------
        block: dict = {
            "researched_at": as_of,
            "additional_findings": entry.get("additional_findings", ""),
            "sources": entry.get("sources", []),
        }
        if entry.get("district_website"):
            block["district_website"] = entry["district_website"]
        structure["district_web_research"] = block
        profile["structure"] = structure

        # ---- record the source ------------------------------------------
        srcs = list(profile.get("data_sources_used") or [])
        if SOURCE_ID not in srcs:
            srcs.append(SOURCE_ID)
        profile["data_sources_used"] = srcs

        path.write_text(json.dumps(profile, indent=2, sort_keys=True))
        stamped += 1
        print(f"OK    {cds} {profile.get('name', '<unknown>'):<32}")

    print(f"\nStamped programs research onto {stamped} profile(s); skipped {skipped}.")
    return 0 if stamped else 1


if __name__ == "__main__":
    sys.exit(main())
