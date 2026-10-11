#!/usr/bin/env python3
"""Promote full original Markdown into Hugo without overwriting existing DEV articles."""
from __future__ import annotations
import hashlib
import json
import re
from pathlib import Path

REVIEW = Path("hashnode-import-review")
OUTPUT = Path("content/articles")
SKIP = {
    "driftguard-open-source-terraform-drift-detection-17-year-old-devops-engineer",
    "junior-engineers-learning-ai-faster-than-systems",
    "deployment-isn-t-the-hard-part-recovery-is",
    "the-day-i-realized-backups-aren-t-disaster-recovery-lessons-from-building-an-aws-recovery-strategy",
    "17-year-old-devops-engineer-nigeria",
    "devops-industry-fragility-problem-modern-infrastructure",
    "how-i-eliminated-static-aws-credentials-from-github-actions-using-oidc",
    "i-built-a-production-grade-internal-developer-platform-at-17-here-s-the-full-architecture",
}
IMAGE_ATTRIBUTES = re.compile(r'(!\[[^\]]*\]\()(https?://[^\s)]+)(?:\s+[^)]*?(?:align|width|height)="[^"]*"[^)]*)\)')


def convert(markdown: str) -> tuple[str, str]:
    output = []
    title = None
    fenced = False
    for line in markdown.splitlines():
        if line.lstrip().startswith(("~~~", chr(96) * 3)):
            fenced = not fenced
            output.append(line)
            continue
        if not fenced:
            line = re.sub(r"^\\(#{1,3} )", r"\1", line)
            heading = re.match(r"^#\s+(.+)\s*$", line)
            if heading and title is None:
                title = heading.group(1).strip()
                continue
            if heading:
                line = "#" + line
            line = IMAGE_ATTRIBUTES.sub(r"\1\2)", line)
        output.append(line)
    if not title or fenced:
        raise ValueError("Missing title or unclosed fenced block: " + str(title))
    body = "\n".join(output).strip() + "\n"
    if len(body) < 300:
        raise ValueError("Article is incomplete: " + title)
    return title, body


def description(body: str) -> str:
    for line in body.splitlines():
        candidate = line.strip()
        if not candidate or candidate.startswith(("#", "!", ">", "-", "*", "|", "~", chr(96))):
            continue
        candidate = re.sub(r"\[([^\]]+)\]\([^)]+\)", r"\1", candidate)
        candidate = re.sub(r"[\\*_]", "", candidate).strip()
        if len(candidate) >= 45:
            return candidate[:170].rsplit(" ", 1)[0] + ("…" if len(candidate) > 170 else "")
    return "Engineering article originally published by Edwin Jonathan on Hashnode."


def main() -> None:
    report = json.loads((REVIEW / "manifest.json").read_text(encoding="utf-8"))
    if report["retrieval_errors"] or len(report["posts"]) != 18:
        raise RuntimeError("Full 18-post source review is required")
    selected = [entry for entry in report["posts"] if entry["slug"] not in SKIP]
    if len(selected) != 10 or len(SKIP) != 8:
        raise RuntimeError("Expected ten unique publications")
    prepared = []
    for entry in selected:
        slug = entry["slug"]
        if not re.fullmatch(r"[a-z0-9-]+", slug):
            raise ValueError("Unexpected article slug")
        source = (REVIEW / (slug + ".md")).read_text(encoding="utf-8")
        if hashlib.sha256(source.encode("utf-8")).hexdigest() != entry["sha256"]:
            raise RuntimeError("Source hash changed: " + slug)
        if entry.get("existing_exact_matches"):
            raise RuntimeError("Duplicate title already published: " + slug)
        if entry["top_body_matches"][0]["body_jaccard_6gram"] >= 0.6:
            raise RuntimeError("Likely duplicate article already published: " + slug)
        title, body = convert(source)
        target = OUTPUT / (slug + ".md")
        if target.exists():
            raise FileExistsError("Existing article would be overwritten: " + str(target))
        original = entry["url"]
        if not original.startswith("https://edwinjonathand-devops.hashnode.dev/"):
            raise RuntimeError("Unexpected original host")
        meta = {
            "title": title, "date": entry["date"], "description": description(body),
            "draft": False, "original_url": original,
            "original_platform": "hashnode", "canonical_url": original
        }
        header = "\n".join(k + ": " + json.dumps(v, ensure_ascii=False) for k, v in meta.items())
        prepared.append((target, "---\n" + header + "\n---\n\n" + body))
    for target, contents in prepared:
        target.write_text(contents, encoding="utf-8")
        print("Created", target, "characters", len(contents))
    print("Prepared", len(prepared), "nonduplicate articles for full PR review.")


if __name__ == "__main__":
    main()
