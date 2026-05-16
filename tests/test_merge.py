"""Regression tests for the per-source merger.

The merger is the most failure-prone piece — it has to honor source priority,
handle missing keys gracefully, and produce a schema-valid result. Keep these
tests focused on the merge contract, not on what each scraper happens to emit.
"""

from __future__ import annotations

from pipeline.transformers.merge import deep_merge_priority


def test_base_wins_on_conflict():
    base = {"enrollment": {"students_with_autism": {"value": 100, "source": "a", "as_of": "2024-01-01"}}}
    overlay = {"enrollment": {"students_with_autism": {"value": 999, "source": "b", "as_of": "2024-01-01"}}}
    out = deep_merge_priority(base, overlay)
    assert out["enrollment"]["students_with_autism"]["value"] == 100
    assert out["enrollment"]["students_with_autism"]["source"] == "a"


def test_overlay_fills_missing_field():
    base = {"enrollment": {"students_with_iep": {"value": 50, "source": "a", "as_of": "2024-01-01"}}}
    overlay = {
        "enrollment": {"students_with_autism": {"value": 10, "source": "b", "as_of": "2024-01-01"}},
        "outcome_metrics": {"suspension_rate_all": {"value": 0.02, "source": "b", "as_of": "2024-01-01"}},
    }
    out = deep_merge_priority(base, overlay)
    assert out["enrollment"]["students_with_iep"]["value"] == 50
    assert out["enrollment"]["students_with_autism"]["value"] == 10
    assert out["outcome_metrics"]["suspension_rate_all"]["value"] == 0.02


def test_partial_markers_are_stripped():
    base = {"name": "Test District"}
    overlay = {"_source": "test", "_partial": True, "_academic_year": "2024-25", "cds_code": "37-99999"}
    out = deep_merge_priority(base, overlay)
    assert "_source" not in out
    assert "_partial" not in out
    assert "_academic_year" not in out
    assert out["cds_code"] == "37-99999"


def test_deep_recursive_merge():
    base = {"a": {"b": {"c": 1, "d": 2}}}
    overlay = {"a": {"b": {"d": 999, "e": 3}, "x": 4}}
    out = deep_merge_priority(base, overlay)
    assert out["a"]["b"]["c"] == 1
    assert out["a"]["b"]["d"] == 2  # base wins
    assert out["a"]["b"]["e"] == 3
    assert out["a"]["x"] == 4


def test_empty_overlay_returns_base_copy():
    base = {"cds_code": "37-00000"}
    out = deep_merge_priority(base, {})
    assert out == base
    assert out is not base  # must not return the same object
