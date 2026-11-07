"""Regression tests for the article-cover audit.

Run: python3 -m unittest discover -s tests -p 'test_article_covers.py'
"""
import importlib.util
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

MODULE_PATH = Path(__file__).resolve().parents[1] / "scripts" / "audit_article_covers.py"
SPEC = importlib.util.spec_from_file_location("audit_article_covers", MODULE_PATH)
assert SPEC is not None and SPEC.loader is not None
audit_module = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(audit_module)


class ArticleCoverAuditTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        self.articles = self.root / "content" / "articles"
        self.static = self.root / "static"
        self.articles.mkdir(parents=True)
        self.static.mkdir()
        self.patches = [
            patch.object(audit_module, "ROOT", self.root),
            patch.object(audit_module, "ARTICLES", self.articles),
            patch.object(audit_module, "STATIC", self.static),
        ]
        for item in self.patches:
            item.start()
            self.addCleanup(item.stop)

    def article(self, text, filename="example.md"):
        path = self.articles / filename
        path.write_text(text, encoding="utf-8")
        return path

    def test_valid_local_cover(self):
        (self.static / "images").mkdir()
        (self.static / "images" / "example.webp").write_bytes(b"sample")
        self.article('---\ncover_image: "/images/example.webp"\ncover_alt: "Diagram of a deployment boundary"\ncover_credit: "Original diagram by author"\n---\n')
        records, failures = audit_module.audit()
        self.assertEqual(failures, 0)
        self.assertEqual(records[0]["status"], "pass")

    def test_missing_metadata(self):
        self.article("---\ntitle: Example\n---\n")
        records, failures = audit_module.audit()
        self.assertEqual(failures, 1)
        self.assertEqual(len(records[0]["issues"]), 3)

    def test_missing_local_file(self):
        self.article('---\ncover_image: "/images/missing.webp"\ncover_alt: "Diagram"\ncover_credit: "Author"\n---\n')
        records, failures = audit_module.audit()
        self.assertEqual(failures, 1)
        self.assertIn("cover_image asset not found", records[0]["issues"])

    def test_http_image_rejected(self):
        self.article('---\ncover_image: "http://example.com/a.png"\ncover_alt: "Cloud architecture"\ncover_credit: "Author"\n---\n')
        records, failures = audit_module.audit()
        self.assertEqual(failures, 1)
        self.assertIn("external cover_image must use HTTPS", records[0]["issues"])

    def test_draft_excluded(self):
        self.article("---\ndraft: true\n---\n")
        records, failures = audit_module.audit()
        self.assertEqual(failures, 0)
        self.assertEqual(records[0]["status"], "draft")

    def test_traversal_rejected(self):
        self.article('---\ncover_image: "/../outside.webp"\ncover_alt: "Architecture"\ncover_credit: "Author"\n---\n')
        records, failures = audit_module.audit()
        self.assertEqual(failures, 1)
        self.assertIn("cover_image escapes static directory", records[0]["issues"])

    def test_external_body_images_inventory_does_not_claim_rights(self):
        self.article('---\\ncover_image: "https://example.com/cover.png"\\ncover_alt: "Deployment diagram"\\ncover_credit: "Source supplied"\\n---\\n![Diagram](https://example.com/diagram.png)\\n')
        records, failures = audit_module.audit()
        self.assertEqual(failures, 0)
        self.assertEqual(records[0]["cover_source"], "explicit")
        self.assertEqual(records[0]["external_body_images"], ["https://example.com/diagram.png"])
        self.assertTrue(records[0]["credit_supplied"])
        self.assertFalse(records[0]["rights_verified"])

    def test_invalid_front_matter_still_produces_inventory_record(self):
        self.article('---\\ncover_image: /images/x.webp\\n')
        records, failures = audit_module.audit()
        self.assertEqual(failures, 1)
        self.assertEqual(records[0]["cover_source"], "fallback_or_generated")
        self.assertFalse(records[0]["rights_verified"])

    def test_unclosed_front_matter(self):
        self.article("---\ncover_image: /images/x.webp\n")
        records, failures = audit_module.audit()
        self.assertEqual(failures, 1)
        self.assertIn("unclosed YAML front matter", records[0]["issues"])


if __name__ == "__main__":
    unittest.main()
