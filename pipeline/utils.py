"""Shared utilities for pipeline scrapers and transformers."""

from __future__ import annotations

import datetime as dt
import hashlib
from pathlib import Path
from typing import Any
from urllib.request import Request, urlopen


def parse_int(s: str | None) -> int | None:
    """Parse a possibly-suppressed integer field.

    CDE marks cells with '*' when the count is small enough that publishing it
    could re-identify individual students. Treat as None.
    """
    if s is None:
        return None
    s = s.strip()
    if s in ("", "*", "N/A"):
        return None
    return int(s)


def parse_pct(s: str | None) -> float | None:
    """Parse a percentage string. CDE stores percentages as e.g. '24.9' meaning 24.9%.

    Returns the value as a 0-1 float (so '24.9' -> 0.249), rounded to 4
    decimal places to avoid floating-point representation noise.
    """
    if s is None:
        return None
    s = s.strip()
    if s in ("", "*", "N/A"):
        return None
    return round(float(s) / 100.0, 4)


def utc_now_iso() -> str:
    """Current UTC timestamp in ISO format with trailing Z."""
    return dt.datetime.now(dt.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def sourced(
    value: Any,
    *,
    source: str,
    as_of: str,
    fetched_at: str | None = None,
    url: str | None = None,
    note: str | None = None,
) -> dict:
    """Wrap a value in the SourcedX shape required by the schema."""
    out: dict[str, Any] = {
        "value": value,
        "source": source,
        "as_of": as_of,
    }
    if fetched_at:
        out["fetched_at"] = fetched_at
    if url:
        out["url"] = url
    if note:
        out["note"] = note
    return out


def sha256_of(path: Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as f:
        for chunk in iter(lambda: f.read(1 << 20), b""):
            h.update(chunk)
    return h.hexdigest()


def download(url: str, out: Path, user_agent: str = "inclusiv-ui-pipeline/0.1") -> tuple[Path, str]:
    """Download a URL to disk; return (path, sha256). Re-uses existing file if present."""
    out.parent.mkdir(parents=True, exist_ok=True)
    if out.exists() and out.stat().st_size > 0:
        return out, sha256_of(out)
    req = Request(url, headers={"User-Agent": user_agent})
    h = hashlib.sha256()
    with urlopen(req, timeout=180) as r, out.open("wb") as f:
        while chunk := r.read(1 << 20):
            f.write(chunk)
            h.update(chunk)
    return out, h.hexdigest()
