#!/usr/bin/env python3
"""Promote complete original DEV articles from a reviewed GitHub Actions artifact.

Hashnode RSS placeholders are intentionally never published.
"""
from __future__ import annotations

import json
from pathlib import Path

SOURCE = Path("article-import-review")
TARGET = Path("content/articles")


def main() -> None:
    manifest = json.loads((SOURCE / "manifest.json").read_text(encoding="utf-8"))
    expected = {row["url"] for row in manifest if row["platform"] == "devto"}
    if not expected:
        raise SystemExit("No DEV original articles found; refusing empty migration")
    TARGET.mkdir(parents=True, exist_ok=True)
    imported = set()
    for source in sorted(SOURCE.glob("*.md")):
        text = source.read_text(encoding="utf-8")
        if not text.startswith("---\n") or "\n---\n" not in text[4:]:
            raise SystemExit(f"Malformed frontmatter: {source}")
        header, body = text[4:].split("\n---\n", 1)
        fields = {}
        for line in header.splitlines():
            if ": " in line:
                key, value = line.split(": ", 1)
                fields[key] = json.loads(value)
        if fields.get("original_platform") != "devto":
            continue
        url = fields.get("original_url", "")
        if url not in expected or url in imported:
            raise SystemExit(f"Unexpected or duplicate original URL: {url}")
        if "Full-text migration requires" in body or len(body.strip()) < 350:
            raise SystemExit(f"Article is incomplete: {source}")
        if "{{<" in body or "{{%" in body:
            raise SystemExit(f"Unexpected Hugo shortcode in original: {source}")
        fields["draft"] = False
        fields["aliases"] = []
        # Preserve original date and source URL; do not imply this is a new publication.
        front = "---\n" + "\n".join(
            f"{key}: {json.dumps(value, ensure_ascii=False)}" for key, value in fields.items()
        ) + "\n---\n\n"
        destination = TARGET / source.name
        if destination.exists():
            raise SystemExit(f"Existing page would be overwritten: {destination}")
        clean_body = "\n".join(line.rstrip() for line in body.lstrip().split("\n"))
        destination.write_text(front + clean_body, encoding="utf-8")
        imported.add(url)
    if imported != expected:
        raise SystemExit(f"Missing complete DEV articles: {sorted(expected - imported)}")
    print(f"Published {len(imported)} original DEV articles; Hashnode RSS-only entries excluded.")


if __name__ == "__main__":
    main()
