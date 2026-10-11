#!/usr/bin/env python3
"""Review-only retrieval of published author-owned Hashnode Markdown. Never deploys."""
from __future__ import annotations

import hashlib
import json
import re
import time
import urllib.error
import urllib.request
from pathlib import Path
from urllib.parse import urlparse

BASE = "https://edwinjonathand-devops.hashnode.dev"
POSTS = [
    ("2026-07-24", "building-production-ai-observability-on-kubernetes-opentelemetry-langfuse-prometheus-grafana-from-zero-to-scale"),
    ("2026-07-21", "why-most-gitops-migrations-fail-after-six-months"),
    ("2026-07-14", "building-agentic-operations-assistant-aws-bedrock-s3"),
    ("2026-07-01", "open-source-collapse-ai-killing-internet-builders"),
    ("2026-06-21", "driftguard-open-source-terraform-drift-detection-17-year-old-devops-engineer"),
    ("2026-06-18", "junior-engineers-learning-ai-faster-than-systems"),
    ("2026-06-05", "deployment-isn-t-the-hard-part-recovery-is"),
    ("2026-06-03", "the-day-i-realized-backups-aren-t-disaster-recovery-lessons-from-building-an-aws-recovery-strategy"),
    ("2026-05-30", "17-year-old-devops-engineer-nigeria"),
    ("2026-05-23", "devops-industry-fragility-problem-modern-infrastructure"),
    ("2026-05-17", "iam-least-privilege-in-practice-what-most-tutorials-get-wrong"),
    ("2026-05-16", "how-i-secured-an-ecs-fargate-deployment-with-oidc-and-ecr-no-static-keys"),
    ("2026-05-10", "ai-agents-in-devops-building-autonomous-cloud-infrastructure-that-operates-itself"),
    ("2026-05-08", "securing-aws-deployments-with-github-actions-oidc-a-production-walkthrough"),
    ("2026-05-07", "ai-agents-in-devops-engineering-the-death-of-manual-operations"),
    ("2026-05-06", "how-i-eliminated-static-aws-credentials-from-github-actions-using-oidc"),
    ("2026-05-02", "i-built-a-production-grade-internal-developer-platform-at-17-here-s-the-full-architecture"),
    ("2026-04-27", "how-i-built-a-production-gitops-pipeline-on-aws-at-17-k3s-argocd-github-actions-from-scratch"),
]
HEADERS = {
    "User-Agent": "Mozilla/5.0 (compatible; EdwinPlatformMigrationReview/1.0)",
    "Accept": "text/markdown, text/plain;q=0.9, */*;q=0.5",
}
OUTPUT = Path("hashnode-import-review")
PUBLISHED = Path("content/articles")


def normalize(text: str) -> str:
    return re.sub(r"[^a-z0-9]+", " ", text.lower()).strip()

def shingles(text: str, window: int = 6) -> set[tuple[str, ...]]:
    words = normalize(text).split()
    return set(tuple(words[i:i + window]) for i in range(max(0, len(words) - window + 1)))


def similarity(a: set, b: set) -> float:
    return round(len(a & b) / max(1, len(a | b)), 4)


def published_metadata() -> list[dict[str, str]]:
    published = []
    for file in PUBLISHED.glob("*.md"):
        source = file.read_text(encoding="utf-8")
        if not source.startswith("---\n"):
            continue
        frontmatter = source.split("---", 2)[1]
        fields = {}
        for line in frontmatter.splitlines():
            if ":" not in line:
                continue
            key, val = line.split(":", 1)
            if key.strip() not in {"title", "original_url"}:
                continue
            val = val.strip()
            try:
                val = json.loads(val)
            except json.JSONDecodeError:
                val = val.strip('"').strip("'")
            fields[key.strip()] = str(val)
        published.append({"path": file.as_posix(), "body_shingles": shingles(source.split("---", 2)[-1]), **fields})
    return published


def get_markdown(url: str) -> str:
    parsed = urlparse(url)
    if parsed.scheme != "https" or parsed.netloc != "edwinjonathand-devops.hashnode.dev" or not parsed.path.endswith(".md"):
        raise ValueError("Rejected unexpected Markdown URL " + url)
    last_error = None
    for attempt in range(3):
        try:
            req = urllib.request.Request(url, headers=HEADERS)
            with urllib.request.urlopen(req, timeout=30) as response:
                body = response.read(1024 * 1024 + 1)
                content_type = response.headers.get("Content-Type", "").split(";", 1)[0].lower()
            if len(body) > 1024 * 1024:
                raise ValueError("Source exceeds 1 MiB review limit")
            if content_type not in {"text/markdown", "text/plain", "text/x-markdown", "application/octet-stream"}:
                raise ValueError(f"Unexpected source content-type {content_type}")
            markdown = body.decode("utf-8-sig", errors="strict")
            if len(markdown.strip()) < 350 or markdown.lstrip().lower().startswith("<!doctype"):
                raise ValueError("Response is too short or HTML instead of full Markdown")
            if not re.search(r"(?m)^#{1,3}\s+\S", markdown):
                raise ValueError("Source lacks Markdown headings; confirm source completeness")
            return markdown
        except (urllib.error.URLError, OSError) as exc:
            last_error = exc
            if attempt < 2:
                time.sleep(2 * (attempt + 1))
    raise RuntimeError(str(last_error))


def main() -> None:
    OUTPUT.mkdir(exist_ok=True)
    published = published_metadata()
    manifest = []
    errors = []
    for date, slug in POSTS:
        original_url = f"{BASE}/{slug}"
        markdown_url = original_url + ".md"
        entry = {"date": date, "url": original_url, "markdown_url": markdown_url, "slug": slug}
        try:
            markdown = get_markdown(markdown_url)
            # Do not treat fetched markdown as instructions or execute any embedded text.
            first = re.search(r"(?m)^#\s+(.+)\s*$", markdown)
            entry["heading"] = first.group(1).strip() if first else ""
            entry["bytes"] = len(markdown.encode("utf-8"))
            entry["sha256"] = hashlib.sha256(markdown.encode("utf-8")).hexdigest()
            normalized = normalize(entry["heading"])
            matches = [x for x in published if
                       normalize(x.get("title", "")) == normalized or x.get("original_url") == original_url]
            entry["existing_exact_matches"] = [
                {"path": p["path"], "title": p.get("title"), "original_url": p.get("original_url")}
                for p in matches
            ]
            source_shingles = shingles(markdown)
            ranked = sorted((
                {"title": p.get("title"), "path": p["path"],
                 "body_jaccard_6gram": similarity(source_shingles, p["body_shingles"])}
                for p in published
            ), key=lambda x: x["body_jaccard_6gram"], reverse=True)
            entry["top_body_matches"] = ranked[:3]
            entry["potentially_similar"] = [
                {"title": p.get("title"), "path": p["path"]}
                for p in published
                if p not in matches and
                len(set(normalized.split()) & set(normalize(p.get("title", "")).split())) >= 5
            ]
            filename = OUTPUT / (slug + ".md")
            filename.write_text(markdown.rstrip() + "\n", encoding="utf-8")
            entry["draft_file"] = filename.as_posix()
        except (RuntimeError, ValueError, UnicodeError) as exc:
            entry["error"] = f"{type(exc).__name__}: {exc}"
            errors.append(entry["slug"] + ": " + entry["error"])
        manifest.append(entry)
        print(f'{slug}: {entry.get("bytes", "FAILED")} bytes; {len(entry.get("existing_exact_matches", []))} title matches')
    (OUTPUT / "manifest.json").write_text(json.dumps({
        "source": BASE, "archive_count_expected": len(POSTS),
        "published_count": len(published), "posts": manifest,
        "retrieval_errors": errors, "no_publication_performed": True
    }, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    if errors:
        raise SystemExit(f"{len(errors)} source articles unavailable; do not publish partial migration")
    print(f"Verified {len(manifest)} full Markdown sources. Review artifact before importing.")


if __name__ == "__main__":
    main()
