"""Semantic checks on district profiles, beyond what JSON Schema catches.

The schema enforces shape (types, required keys, formats). This validator
enforces things the schema can't:

  - Provenance hygiene: every Sourced* field should have `fetched_at` and `url`.
  - Freshness: warn when `as_of` is older than STALE_AFTER_YEARS years.
  - Plausibility: autism count <= IEP count; rates in [0, 1]; LRE buckets
    sum to <= 1.0; DFS in a sane range; etc.
  - AI hygiene: every entry under `ai_summaries` must have `ai_generated: true`
    plus a non-empty disclaimer.
  - Cross-field consistency: `data_sources_used` matches the sources that
    appear in `build_provenance.raw_snapshots`.

Findings are classified ERROR (blocks publication) or WARN (logged, not blocking).
Schema-level errors are surfaced first.

Usage:
    doppler run -- python -m pipeline.validators.validate_data
        # validates every file in data/processed/districts/*.json
    doppler run -- python -m pipeline.validators.validate_data path/to/profile.json
"""

from __future__ import annotations

import datetime as dt
import json
import sys
from pathlib import Path

from jsonschema import Draft202012Validator

REPO_ROOT = Path(__file__).resolve().parents[2]
SCHEMA_PATH = REPO_ROOT / "data" / "schema" / "district.schema.json"
DEFAULT_DIR = REPO_ROOT / "data" / "processed" / "districts"

STALE_AFTER_YEARS = 3  # warn if a sourced field's as_of is older than this

# Field-path -> (kind, level). kind is "ERROR" or "WARN".
Finding = tuple[str, str, str]  # (level, path, message)


def is_sourced(node: dict) -> bool:
    return isinstance(node, dict) and "value" in node and "source" in node and "as_of" in node


def is_ai_generated(node: dict) -> bool:
    return isinstance(node, dict) and node.get("ai_generated") is True


def walk(node, path: str = ""):
    """Yield (path, node) for every dict node in the tree."""
    if isinstance(node, dict):
        yield path or "<root>", node
        for k, v in node.items():
            yield from walk(v, f"{path}/{k}" if path else f"/{k}")
    elif isinstance(node, list):
        for i, v in enumerate(node):
            yield from walk(v, f"{path}/{i}")


def check_sourced_hygiene(profile: dict) -> list[Finding]:
    out: list[Finding] = []
    today = dt.date.today()
    cutoff = today.replace(year=today.year - STALE_AFTER_YEARS)
    for path, node in walk(profile):
        if not is_sourced(node):
            continue
        if "fetched_at" not in node:
            out.append(("WARN", path, "missing fetched_at"))
        if "url" not in node:
            out.append(("WARN", path, "missing url"))
        as_of = node.get("as_of")
        if isinstance(as_of, str):
            try:
                d = dt.date.fromisoformat(as_of)
                if d < cutoff:
                    out.append(("WARN", path, f"stale as_of={as_of} (>{STALE_AFTER_YEARS}y old)"))
            except ValueError:
                out.append(("ERROR", path, f"invalid as_of date: {as_of!r}"))
    return out


def check_ai_hygiene(profile: dict) -> list[Finding]:
    out: list[Finding] = []
    summaries = profile.get("ai_summaries") or {}
    for key, node in summaries.items():
        p = f"/ai_summaries/{key}"
        if not is_ai_generated(node):
            out.append(("ERROR", p, "missing ai_generated=true flag"))
            continue
        if not (node.get("ai_disclaimer") or "").strip():
            out.append(("ERROR", p, "missing or empty ai_disclaimer"))
        if not (node.get("value") or "").strip():
            out.append(("ERROR", p, "empty AI summary value"))
        if not node.get("ai_model"):
            out.append(("ERROR", p, "missing ai_model"))
    return out


def _val(node) -> float | int | None:
    """Extract numeric value from a Sourced field; None if missing/suppressed."""
    if not is_sourced(node):
        return None
    v = node.get("value")
    return v if isinstance(v, (int, float)) else None


def check_plausibility(profile: dict) -> list[Finding]:
    out: list[Finding] = []
    enroll = profile.get("enrollment") or {}
    iep = _val(enroll.get("students_with_iep"))
    autism = _val(enroll.get("students_with_autism"))
    if iep is not None and autism is not None and autism > iep:
        out.append(("ERROR", "/enrollment", f"autism ({autism}) > IEP ({iep})"))

    total = _val(enroll.get("total"))
    if total is not None and iep is not None and iep > total:
        out.append(("ERROR", "/enrollment", f"IEP ({iep}) > total enrollment ({total})"))

    for path, node in walk(profile):
        if not is_sourced(node):
            continue
        if "rate" not in path and "lre" not in path and "pct" not in path:
            continue
        v = node.get("value")
        if isinstance(v, (int, float)) and not (0.0 <= v <= 1.0):
            out.append(("ERROR", path, f"rate-like value out of [0,1]: {v}"))

    incl = profile.get("inclusion_metrics") or {}
    for tag in ("all_disabilities", "autism"):
        included = _val(incl.get(f"lre_80pct_plus_gen_ed_{tag}"))
        separate = _val(incl.get(f"lre_separate_setting_{tag}"))
        if included is not None and separate is not None and included + separate > 1.001:
            out.append(("ERROR", f"/inclusion_metrics ({tag})",
                        f"LRE 80%+ ({included}) + separate ({separate}) > 1.0"))

    outc = profile.get("outcome_metrics") or {}
    for field in ("ela_distance_from_standard_swd", "math_distance_from_standard_swd",
                  "ela_distance_from_standard_all", "math_distance_from_standard_all"):
        v = _val(outc.get(field))
        if v is not None and not (-300.0 <= v <= 300.0):
            out.append(("WARN", f"/outcome_metrics/{field}", f"DFS out of expected range: {v}"))
    return out


def check_sources_match_provenance(profile: dict) -> list[Finding]:
    declared = set(profile.get("data_sources_used") or [])
    snapshots = (profile.get("build_provenance") or {}).get("raw_snapshots") or []
    snapshot_sources = {s.get("source") for s in snapshots if s.get("source")}
    out: list[Finding] = []
    extra_in_snapshots = snapshot_sources - declared
    if extra_in_snapshots:
        out.append(("WARN", "/build_provenance",
                    f"snapshot sources not declared in data_sources_used: {sorted(extra_in_snapshots)}"))
    declared_missing = declared - snapshot_sources - {"manual"}
    if declared_missing:
        out.append(("WARN", "/data_sources_used",
                    f"declared sources with no snapshot recorded: {sorted(declared_missing)}"))
    return out


def validate_profile(profile: dict, schema_validator: Draft202012Validator) -> list[Finding]:
    findings: list[Finding] = []
    for e in schema_validator.iter_errors(profile):
        loc = "/" + "/".join(str(p) for p in e.absolute_path) if e.absolute_path else "<root>"
        findings.append(("ERROR", loc, f"schema: {e.message}"))
    findings.extend(check_sourced_hygiene(profile))
    findings.extend(check_ai_hygiene(profile))
    findings.extend(check_plausibility(profile))
    findings.extend(check_sources_match_provenance(profile))
    return findings


def main(argv: list[str]) -> int:
    schema = json.loads(SCHEMA_PATH.read_text())
    Draft202012Validator.check_schema(schema)
    validator = Draft202012Validator(schema)

    paths = [Path(a) for a in argv] if argv else sorted(DEFAULT_DIR.glob("*.json"))
    if not paths:
        print(f"No profiles to validate (looked in {DEFAULT_DIR})", file=sys.stderr)
        return 1

    n_errors = 0
    n_warns = 0
    for path in paths:
        profile = json.loads(path.read_text())
        findings = validate_profile(profile, validator)
        errs = [f for f in findings if f[0] == "ERROR"]
        warns = [f for f in findings if f[0] == "WARN"]
        n_errors += len(errs)
        n_warns += len(warns)
        if not findings:
            print(f"OK    {path.name}")
            continue
        marker = "FAIL" if errs else "WARN"
        print(f"{marker}  {path.name}  errors={len(errs)} warnings={len(warns)}")
        for level, loc, msg in findings:
            print(f"        [{level}] {loc}: {msg}")

    print(f"\nSummary: {len(paths)} profile(s), {n_errors} error(s), {n_warns} warning(s)")
    return 1 if n_errors else 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
