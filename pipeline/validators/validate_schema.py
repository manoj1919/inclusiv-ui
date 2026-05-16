"""Validate district profile JSON files against the schema.

Usage:
    doppler run -- python -m pipeline.validators.validate_schema data/schema/examples/poway_unified.example.json
    doppler run -- python -m pipeline.validators.validate_schema data/processed/*.json
"""

from __future__ import annotations

import json
import sys
from pathlib import Path

from jsonschema import Draft202012Validator

REPO_ROOT = Path(__file__).resolve().parents[2]
SCHEMA_PATH = REPO_ROOT / "data" / "schema" / "district.schema.json"


def load_schema() -> dict:
    with SCHEMA_PATH.open() as f:
        return json.load(f)


def validate_file(path: Path, validator: Draft202012Validator) -> list[str]:
    with path.open() as f:
        instance = json.load(f)
    instance.pop("_comment", None)
    return [f"{'/'.join(str(p) for p in e.absolute_path) or '<root>'}: {e.message}"
            for e in validator.iter_errors(instance)]


def main(argv: list[str]) -> int:
    if not argv:
        print("usage: validate_schema.py <path> [<path> ...]", file=sys.stderr)
        return 2

    schema = load_schema()
    Draft202012Validator.check_schema(schema)
    validator = Draft202012Validator(schema)

    had_errors = False
    for arg in argv:
        path = Path(arg)
        errors = validate_file(path, validator)
        if errors:
            had_errors = True
            print(f"FAIL  {path}")
            for err in errors:
                print(f"  - {err}")
        else:
            print(f"OK    {path}")
    return 1 if had_errors else 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
