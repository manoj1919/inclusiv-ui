"""Stamp Claude-in-session AI summaries onto district profiles.

This project is free / donation-supported and does NOT call a paid AI
inference API. AI summaries are written by Claude in a Claude Code session
(once a year, after the data refresh) into a single staging file:

    data/processed/_ai_summaries.json   # { "<cds_code>": {"overview": "...", "what_this_means_for_parents": "..."} }

This script reads that staging file and stamps each summary into the
corresponding district profile under `ai_summaries`, wrapped in the
schema's `AIGenerated` shape (ai_generated + disclaimer + model + timestamp).

Workflow:

  1. Run scrapers + merge to refresh the data.
  2. Open Claude Code in this repo and ask Claude to regenerate AI summaries.
     Claude reads each profile in data/processed/districts/ and writes
     summaries into data/processed/_ai_summaries.json following the prompt
     contract in pipeline/enrichers/prompts.py.
  3. Run `python -m pipeline.enrichers.summarize` to stamp the summaries
     into the district profiles.

If the staging file is missing or empty, this script prints instructions
and exits non-zero — it never reaches out to an external API.

See feedback_ai_provider_policy.md for the rationale.
"""

from __future__ import annotations

import json
import sys
from pathlib import Path

from pipeline.utils import utc_now_iso

REPO_ROOT = Path(__file__).resolve().parents[2]
DISTRICTS_DIR = REPO_ROOT / "data" / "processed" / "districts"
STAGING_FILE = REPO_ROOT / "data" / "processed" / "_ai_summaries.json"

# The "model" recorded in each summary's provenance. Update if the user
# generates summaries with a different Claude Code session model.
AI_MODEL = "claude-opus (via Claude Code session)"

AI_DISCLAIMER = (
    "This summary was written by an AI model from the data points in this "
    "profile. The underlying numbers come from public California government "
    "sources, but the narrative is AI-written and may contain inaccuracies. "
    "Verify specific claims directly with the school district before making "
    "decisions."
)

SUMMARY_KEYS = ("overview", "what_this_means_for_parents")


def wrap(text: str, *, based_on_sources: list[str]) -> dict:
    """Return a value formatted to match the schema's AIGenerated shape."""
    return {
        "value": text.strip(),
        "ai_generated": True,
        "ai_model": AI_MODEL,
        "ai_generated_at": utc_now_iso(),
        "ai_disclaimer": AI_DISCLAIMER,
        "based_on_sources": based_on_sources,
    }


def load_staging() -> dict[str, dict[str, str]]:
    if not STAGING_FILE.exists():
        return {}
    raw = STAGING_FILE.read_text().strip()
    if not raw:
        return {}
    return json.loads(raw)


def main() -> int:
    staging = load_staging()
    if not staging:
        print(
            f"No staged summaries found at {STAGING_FILE.relative_to(REPO_ROOT)}.\n\n"
            "How to populate it:\n"
            "  Open Claude Code in this repo and ask Claude to regenerate the AI\n"
            "  summaries. Claude will read each profile in data/processed/districts/\n"
            "  and write {cds: {overview: '...', what_this_means_for_parents: '...'}}\n"
            "  into the staging file. Then re-run this script.\n\n"
            "See pipeline/enrichers/prompts.py for the prompt contract and the\n"
            "memory note 'AI provider policy' for the rationale (zero-budget non-profit).",
            file=sys.stderr,
        )
        return 1

    profiles = sorted(DISTRICTS_DIR.glob("*.json"))
    stamped = 0
    skipped = 0
    for path in profiles:
        profile = json.loads(path.read_text())
        cds = profile.get("cds_code", path.stem)
        entry = staging.get(cds)
        if not entry:
            print(f"SKIP  {cds} {profile.get('name', '<unknown>'):<32} (no staged summary)")
            skipped += 1
            continue

        sources = profile.get("data_sources_used", [])
        ai_summaries: dict = profile.get("ai_summaries") or {}
        for key in SUMMARY_KEYS:
            text = (entry.get(key) or "").strip()
            if text:
                ai_summaries[key] = wrap(text, based_on_sources=sources)

        profile["ai_summaries"] = ai_summaries
        path.write_text(json.dumps(profile, indent=2, sort_keys=True))
        keys = [k for k in SUMMARY_KEYS if k in ai_summaries]
        print(f"OK    {cds} {profile.get('name', '<unknown>'):<32} keys=[{','.join(keys)}]")
        stamped += 1

    print(f"\nStamped summaries onto {stamped} profile(s); skipped {skipped}.")
    return 0 if stamped else 1


if __name__ == "__main__":
    sys.exit(main())
