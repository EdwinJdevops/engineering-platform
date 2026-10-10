# Article migration review

Source accounts:
- DEV: https://dev.to/edwindevops
- Hashnode: https://edwinjonathand-devops.hashnode.dev/

Run `python3 scripts/review_article_import.py` in a local checkout with network access.

The importer writes drafts to `article-import-review/`, **not** to the published `content/articles/` directory. It also writes `manifest.json` listing duplicate titles. It never overwrites an existing draft.

DEV's public article endpoint supplies Markdown. Hashnode RSS supplies article discovery but not reliably the complete Markdown: those entries are explicitly marked for manual export. Review all embedded images, links, front matter, duplicates, claims and publication dates before moving a draft into Hugo's article directory.

Keep the original publication URL as source metadata. Decide the canonical URL for each migrated post deliberately: the existing original should remain canonical until a complete migration and any appropriate cross-post settings are updated. Do not set two conflicting canonicals.

No API keys, paid services or automatic publishing are required.
