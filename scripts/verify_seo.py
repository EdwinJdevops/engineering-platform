#!/usr/bin/env python3
"""Validate generated SEO metadata and structured data without external dependencies."""

from __future__ import annotations

import json
from html.parser import HTMLParser
from pathlib import Path

SITE = "https://edwinjdevops.github.io/engineering-platform/"
PUBLIC = Path("public")

TITLES = {
    "": "Edwin Jonathan — Platform, Cloud & DevOps Engineering",
    "portfolio/": "Cloud and Platform Engineering Portfolio | Edwin Jonathan",
    "contact/": "Contact Edwin Jonathan | Cloud and Platform Engineering",
    "projects/": "Cloud Infrastructure Engineering Case Studies | Edwin Jonathan",
    "projects/driftguard/": "DriftGuard: Terraform Drift Detection on AWS | Edwin Jonathan",
    "projects/warden/": "Warden: Kubernetes GitOps Remediation Controls | Edwin Jonathan",
    "projects/sentinel/": "SENTINEL: Kubernetes Security Scanning | Edwin Jonathan",
    "articles/": "Cloud and Platform Engineering Articles | Edwin Jonathan",
}


class HeadParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.title = ""
        self.canonical_urls: list[str] = []
        self.schema_texts: list[str] = []
        self._in_title = False
        self._in_schema = False
        self._buffer: list[str] = []

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        values = dict(attrs)
        if tag == "title":
            self._in_title = True
        if tag == "link" and values.get("rel") == "canonical":
            self.canonical_urls.append(values.get("href") or "")
        if tag == "script" and values.get("type") == "application/ld+json":
            self._in_schema = True
            self._buffer = []

    def handle_data(self, data: str) -> None:
        if self._in_title:
            self.title += data
        if self._in_schema:
            self._buffer.append(data)

    def handle_endtag(self, tag: str) -> None:
        if tag == "title":
            self._in_title = False
        if tag == "script" and self._in_schema:
            self._in_schema = False
            self.schema_texts.append("".join(self._buffer))


def read_page(relative: str) -> HeadParser:
    path = PUBLIC / relative / "index.html"
    if not path.is_file():
        raise AssertionError(f"Expected published page missing: {path}")
    parser = HeadParser()
    parser.feed(path.read_text(encoding="utf-8"))
    return parser


def schemas(page: HeadParser, relative: str) -> list[dict]:
    result = []
    for value in page.schema_texts:
        parsed = json.loads(value)
        if not isinstance(parsed, dict):
            raise AssertionError(f"Invalid top-level JSON-LD value: {relative}")
        result.append(parsed)
    return result


def main() -> None:
    for relative, expected_title in TITLES.items():
        page = read_page(relative)
        assert page.title == expected_title, (
            f"{relative}: wrong HTML title: {page.title!r}"
        )
        assert page.canonical_urls == [SITE + relative], (
            f"{relative}: wrong canonical(s): {page.canonical_urls!r}"
        )
        print(f"SEO title and canonical OK: /{relative}")

    home = schemas(read_page(""), "")
    assert any(
        s.get("@type") == "ProfilePage"
        and isinstance(s.get("mainEntity"), dict)
        and s["mainEntity"].get("@type") == "Person"
        and s["mainEntity"].get("name") == "Edwin Jonathan"
        for s in home
    ), "Homepage must emit parseable ProfilePage/Person JSON-LD"
    print("Homepage JSON-LD parses with ProfilePage/Person")

    article_path = "articles/aws-inventory-failure-terraform-drift/"
    article = schemas(read_page(article_path), article_path)
    assert any(
        s.get("@type") == "BlogPosting"
        and isinstance(s.get("headline"), str)
        and s.get("url") == SITE + article_path
        for s in article
    ), "Original engineering article must emit parseable BlogPosting JSON-LD"
    print("Original technical article JSON-LD parses with BlogPosting")

    archived = "articles/why-most-gitops-migrations-fail-after-six-months/"
    archive_page = read_page(archived)
    assert archive_page.canonical_urls == [
        "https://edwinjonathand-devops.hashnode.dev/why-most-gitops-migrations-fail-after-six-months"
    ], "Do not silently replace source-publication canonical URL"
    print("Archived Hashnode article retains original canonical")


if __name__ == "__main__":
    main()
