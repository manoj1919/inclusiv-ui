"""Tests for the semantic data validator.

The validator's plausibility rules are the second line of defense against bad
data slipping through. Schema-level errors aren't tested here because they're
exercised end-to-end whenever the merge step writes a profile.
"""

from __future__ import annotations

from pipeline.validators.validate_data import (
    check_ai_hygiene,
    check_plausibility,
    check_sourced_hygiene,
)

SRC_FIELDS = {"source": "test", "as_of": "2024-01-01", "fetched_at": "2024-01-01T00:00:00Z", "url": "https://x"}


def sourced(value):
    return {"value": value, **SRC_FIELDS}


def test_autism_count_exceeds_iep_count_is_error():
    profile = {
        "enrollment": {
            "students_with_iep": sourced(100),
            "students_with_autism": sourced(150),
        },
    }
    findings = check_plausibility(profile)
    assert any(level == "ERROR" and "autism" in msg for level, _, msg in findings)


def test_rate_out_of_range_is_error():
    profile = {
        "outcome_metrics": {"chronic_absenteeism_rate_swd": sourced(1.5)},
    }
    findings = check_plausibility(profile)
    assert any(level == "ERROR" and "out of [0,1]" in msg for level, _, msg in findings)


def test_lre_buckets_exceed_one_is_error():
    profile = {
        "inclusion_metrics": {
            "lre_80pct_plus_gen_ed_autism": sourced(0.7),
            "lre_separate_setting_autism": sourced(0.5),  # 0.7 + 0.5 > 1.0
        },
    }
    findings = check_plausibility(profile)
    assert any(level == "ERROR" and "LRE" in msg for level, _, msg in findings)


def test_missing_url_is_warning():
    field = {"value": 10, "source": "test", "as_of": "2024-01-01"}  # no url, no fetched_at
    profile = {"enrollment": {"students_with_iep": field}}
    findings = check_sourced_hygiene(profile)
    levels = [(lvl, msg) for lvl, _, msg in findings]
    assert ("WARN", "missing url") in [(lvl, msg) for lvl, msg in levels]
    assert ("WARN", "missing fetched_at") in [(lvl, msg) for lvl, msg in levels]


def test_ai_summary_without_disclaimer_is_error():
    profile = {
        "ai_summaries": {
            "overview": {
                "value": "x",
                "ai_generated": True,
                "ai_model": "test",
                "ai_generated_at": "2024-01-01T00:00:00Z",
                "ai_disclaimer": "   ",  # whitespace-only counts as empty
            },
        },
    }
    findings = check_ai_hygiene(profile)
    assert any(level == "ERROR" and "disclaimer" in msg for level, _, msg in findings)


def test_ai_summary_missing_generated_flag_is_error():
    profile = {
        "ai_summaries": {
            "overview": {
                "value": "x",
                "ai_model": "test",
                "ai_generated_at": "2024-01-01T00:00:00Z",
                "ai_disclaimer": "ok",
            },
        },
    }
    findings = check_ai_hygiene(profile)
    assert any(level == "ERROR" and "ai_generated" in msg for level, _, msg in findings)


def test_clean_profile_has_no_plausibility_findings():
    profile = {
        "enrollment": {
            "students_with_iep": sourced(100),
            "students_with_autism": sourced(20),
        },
        "inclusion_metrics": {
            "lre_80pct_plus_gen_ed_autism": sourced(0.85),
            "lre_separate_setting_autism": sourced(0.01),
        },
        "outcome_metrics": {
            "chronic_absenteeism_rate_swd": sourced(0.25),
            "ela_distance_from_standard_swd": sourced(-44.3),
        },
    }
    findings = check_plausibility(profile)
    errs = [f for f in findings if f[0] == "ERROR"]
    assert errs == []
