#!/usr/bin/env python3
"""Fetch public DEV and Hashnode articles into a review directory, never publish automatically."""
from __future__ import annotations

import argparse
import json
import re
import urllib.request
import xml.etree.ElementTree as ET
from pathlib import Path
from urllib.parse import urlparse

DEV_API = "https://dev.to/api/articles?username=edwindevops&per_page=100"
HASHNODE_RSS = "https://edwinjonathand-devops.hashnode.dev/rss.xml"
HEADERS = {"User-Agent": "EdwinEngineeringPlatform/1.0 (article migration review)"}


def get(url: str) -> bytes:
    request = urllib.request.Request(url, headers=HEADERS)
    with urllib.request.urlopen(request, timeout=25) as response:
        return response.read()


def slug(value: str) -> str:
    result = re.sub(r"[^a-z0-9]+", "-", value.lower()).strip("-")
    return result[:90] or "untitled"


def frontmatter(article: dict) -> str:
    # JSON is valid YAML front matter. Escape values rather than interpolating raw YAML.
    fields = {
        "title": article["title"],
        "date": article.get("date", ""),
        "description": article.get("description", ""),
        "draft": True,
        "original_url": article["url"],
        "original_platform": article["platform"],
    }
    return "---\n" + "\n".join(f"{k}: {json.dumps(v, ensure_ascii=False)}" for k, v in fields.items()) + "\n---\n\n"


def collect_dev() -> list[dict]:
    posts = json.loads(get(DEV_API))
    result = []
    for post in posts:
        detail = json.loads(get(f"https://dev.to/api/articles/{post['id']}"))
        result.append({
            "title": post["title"], "date": (post.get("published_at") or "")[:10],
            "description": post.get("description") or "", "url": post["url"],
            "platform": "devto", "body": detail.get("body_markdown") or "",
        })
    return result


def collect_hashnode() -> list[dict]:
    root = ET.fromstring(get(HASHNODE_RSS))
    result = []
    for item in root.findall("./channel/item"):
        title = item.findtext("title") or ""
        url = item.findtext("link") or ""
        # RSS descriptions may contain HTML; do not mistake an excerpt for original Markdown.
        if title and url and urlparse(url).hostname and urlparse(url).hostname.endswith("hashnode.dev"):
            result.append({"title": title, "date": "", "description": "",
                           "url": url, "platform": "hashnode", "body": ""})
    return result


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--output", default="article-import-review")
    args = parser.parse_args()
    out = Path(args.output)
    out.mkdir(parents=True, exist_ok=True)
    articles = []
    errors = []
    for source, collector in (("DEV", collect_dev), ("Hashnode", collect_hashnode)):
        try:
            articles.extend(collector())
        except (OSError, ValueError, KeyError, ET.ParseError) as exc:
            errors.append(f"{source}: {type(exc).__name__}: {exc}")
    if not errors and (out / "source-errors.json").exists():
        (out / "source-errors.json").unlink()
    if errors:
        (out / "source-errors.json").write_text(
            json.dumps(errors, indent=2, ensure_ascii=False) + "\n", encoding="utf-8"
        )
        print("Some sources could not be retrieved; inspect source-errors.json.")
    if not articles:
        raise SystemExit("No source articles retrieved; no migration was performed.")
    seen: set[str] = set()
    manifest = []
    for item in articles:
        key = slug(item["title"])
        duplicate = key in seen
        seen.add(key)
        manifest.append({k: item[k] for k in ("title", "url", "platform")} | {"duplicate_title": duplicate})
        if duplicate:
            continue
        # Hashnode RSS provides discovery, not full Markdown. Do not fabricate content.
        body = item["body"] or (
            "Original article: " + item["url"] + "\n\n"
            "Full-text migration requires the author's Markdown export or an authenticated API retrieval.\n"
        )
        path = out / (key + ".md")
        if path.exists():
            continue
        path.write_text(frontmatter(item) + body.rstrip() + "\n", encoding="utf-8")
    (out / "manifest.json").write_text(json.dumps(manifest, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"Reviewed {len(articles)} source entries; wrote drafts to {out}. No published pages changed.")


if __name__ == "__main__":
    main()
