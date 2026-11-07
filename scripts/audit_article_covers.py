#!/usr/bin/env python3
"""Audit Hugo article front matter and locally referenced cover assets.

Read-only, dependency-free. Exit 1 for missing or unsafe article cover metadata.
Run from the repository root: python3 scripts/audit_article_covers.py
"""
from __future__ import annotations

import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
ARTICLES = ROOT / "content" / "articles"
STATIC = ROOT / "static"
FIELDS = ("cover_image", "cover_alt", "cover_credit")
IMAGE_RE = re.compile(r"!\\[[^]]*\\]\\((https?://[^)\\s]+)")
FIELD_RE = re.compile(r"^([A-Za-z_][A-Za-z0-9_-]*)\s*:\s*(.*?)\s*$")
URL_RE = re.compile(r"^https?://", re.I)


def front_matter(path: Path) -> dict[str, str]:
    text = path.read_text(encoding="utf-8-sig")
    lines = text.splitlines()
    if not lines or lines[0].strip() != "---":
        raise ValueError("missing YAML front matter")
    end = next((i for i in range(1, len(lines)) if lines[i].strip() == "---"), None)
    if end is None:
        raise ValueError("unclosed YAML front matter")
    values: dict[str, str] = {}
    for line in lines[1:end]:
        match = FIELD_RE.match(line)
        if match:
            key, value = match.groups()
            value = value.split(" #", 1)[0].strip().strip("'\"")
            values[key] = value
    return values


def audit() -> tuple[list[dict[str, object]], int]:
    records: list[dict[str, object]] = []
    failures = 0
    for path in sorted(ARTICLES.rglob("*.md")):
        if path.name == "_index.md":
            continue
        record: dict[str, object] = {"article": str(path.relative_to(ROOT)), "issues": []}
        issues: list[str] = record["issues"]  # type: ignore[assignment]
        meta: dict[str, str] = {}
        try:
            meta = front_matter(path)
            if meta.get("draft", "").lower() == "true":
                record["status"] = "draft"
                records.append(record)
                continue
            for field in FIELDS:
                if not meta.get(field):
                    issues.append(f"missing {field}")
            cover = meta.get("cover_image", "")
            if cover and not URL_RE.match(cover):
                if not cover.startswith("/") or cover.startswith("//") or "\\" in cover:
                    issues.append("cover_image must be HTTPS URL or root-relative static path")
                else:
                    candidate = (STATIC / cover.lstrip("/")).resolve()
                    if not candidate.is_relative_to(STATIC.resolve()):
                        issues.append("cover_image escapes static directory")
                    elif not candidate.is_file():
                        issues.append("cover_image asset not found")
            if cover.startswith("http://"):
                issues.append("external cover_image must use HTTPS")
            if meta.get("cover_alt", "").strip().lower() in {"image", "hero image", "cover image"}:
                issues.append("cover_alt is non-descriptive")
        except (OSError, ValueError, UnicodeError) as exc:
            issues.append(str(exc))
        body = path.read_text(encoding="utf-8-sig")
        external_images = sorted(set(IMAGE_RE.findall(body)))
        record["external_body_images"] = external_images
        record["cover_source"] = "explicit" if meta.get("cover_image") else "fallback_or_generated"
        record["credit_supplied"] = bool(meta.get("cover_credit"))
        record["rights_verified"] = False  # Must be established through a separate human review.
        record["status"] = "fail" if issues else "pass"
        failures += bool(issues)
        records.append(record)
    return records, failures


def main() -> int:
    if not ARTICLES.is_dir():
        print(f"Missing articles directory: {ARTICLES}", file=sys.stderr)
        return 2
    records, failures = audit()
    print(json.dumps({"articles": len(records), "failures": failures, "results": records}, indent=2))
    return 1 if failures else 0


if __name__ == "__main__":
    raise SystemExit(main())
