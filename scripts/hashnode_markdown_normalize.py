#!/usr/bin/env python3
"""Normalize author-sourced Hashnode Markdown without modifying existing DEV articles."""
from __future__ import annotations
import re
from pathlib import Path

ARTICLES = Path("content/articles")
IMG = re.compile(r'!\[\]\((https?://[^)]+)\)')
BOLD_HEADING = re.compile(r'^\*\*([^*]{5,170})\*\*$')
HEADING = re.compile(r'^(#{2,6})\s+(.+?)\s*$')


def rewrite(source: str) -> str:
    inside_fence = False
    seen_headings = {}
    heading_context = "this engineering article"
    result = []
    for raw in source.splitlines():
        line = raw
        if line.lstrip().startswith((chr(96) * 3, "~~~")):
            inside_fence = not inside_fence
        if not inside_fence:
            bold = BOLD_HEADING.match(line.strip())
            if bold:
                line = "### " + bold.group(1).strip()
            heading = HEADING.match(line)
            if heading:
                name = heading.group(2).rstrip(". ").strip()
                identity = re.sub(r"\W+", " ", name.lower()).strip()
                seen_headings[identity] = seen_headings.get(identity, 0) + 1
                if seen_headings[identity] > 1:
                    name += " (continued)"
                heading_context = name
                line = heading.group(1) + " " + name
            if IMG.search(line):
                # The Hashnode originals contain empty image labels; do not invent image content.
                # Provide section context as an interim accessible label.
                alt = re.sub(r'[\[\]<>"]', "", heading_context).strip()[:100]
                line = IMG.sub(lambda m: "![Illustration accompanying " + alt + "](" + m.group(1) + ")", line)
        result.append(line)
    return "\n".join(result).rstrip() + "\n"


def main() -> None:
    count = 0
    for file in sorted(ARTICLES.glob("*.md")):
        source = file.read_text(encoding="utf-8")
        if 'original_platform: "hashnode"' not in source:
            continue
        revised = rewrite(source)
        if revised != source:
            file.write_text(revised, encoding="utf-8")
            count += 1
            print("Normalized:", file.name)
    print("Hashnode article files updated:", count)


if __name__ == "__main__":
    main()
