# DEV article canonical ownership audit — 2026-10-12

## Scope and verified facts

This ledger maps nine DEV-origin articles preserved in the Hugo `content/articles/` directory. The `original_url` fields were read from their local front matter; the website targets below follow each Hugo source filename. The current Hugo copies are self-canonical and appear in the canonical-only sitemap.

**Not verified:** The *current live canonical tags on DEV*, the extent of duplicate-text similarity after import normalization, and Google's selected canonical. Do not assert that DEV currently points to the engineering site or that a canonical change will transfer rankings.

## Editorial decision

The engineering site is intended to become the authoritative home for **future original technical writing**. For these historical DEV-first articles, making the website copy canonical is an explicit editorial migration, not an automatic consequence of mirroring. Carry out changes only after deciding whether preserving DEV-origin indexing is more important than consolidating traffic at the website.

To make the engineering site canonical for a given pair, inspect the original DEV post and its current canonical first, keep the website's self-canonical, then edit **the original DEV post** to point to the corresponding website URL. Confirm the rendered DEV `rel=canonical` afterwards. Do not batch-edit without inspecting each post; retain its publication date and original source attribution.

Official DEV guidance: https://dev.to/help/organizations/importing-your-organizations-content

## Original-to-website mapping

| # | Published DEV source | Intended website canonical if migrated | DEV current canonical |
| --- | --- | --- | --- |
| 1 | [DEV original](https://dev.to/edwindevops/driftguard-93n) | [Website copy](https://edwinjdevops.github.io/engineering-platform/articles/driftguard/) | Not externally verified |
| 2 | [DEV original](https://dev.to/edwindevops/your-terraform-state-is-lying-to-you-i-built-the-tool-that-proves-it-ck9) | [Website copy](https://edwinjdevops.github.io/engineering-platform/articles/your-terraform-state-is-lying-to-you-i-built-the-tool-that-proves-it/) | Not externally verified |
| 3 | [DEV original](https://dev.to/edwindevops/junior-engineers-are-learning-ai-faster-than-they-are-learning-systems-jg7) | [Website copy](https://edwinjdevops.github.io/engineering-platform/articles/junior-engineers-are-learning-ai-faster-than-they-are-learning-systems/) | Not externally verified |
| 4 | [DEV original](https://dev.to/edwindevops/deployment-isnt-the-hard-part-recovery-is-4e2e) | [Website copy](https://edwinjdevops.github.io/engineering-platform/articles/deployment-isn-t-the-hard-part-recovery-is/) | Not externally verified |
| 5 | [DEV original](https://dev.to/edwindevops/the-day-i-realized-backups-arent-disaster-recovery-lessons-from-building-an-aws-recovery-strategy-53cf) | [Website copy](https://edwinjdevops.github.io/engineering-platform/articles/the-day-i-realized-backups-aren-t-disaster-recovery-lessons-from-building-an-aws-recovery-/) | Not externally verified |
| 6 | [DEV original](https://dev.to/edwindevops/im-17-building-in-cloud-devops-from-nigeria-and-no-my-journey-isnt-ai-generated-d8f) | [Website copy](https://edwinjdevops.github.io/engineering-platform/articles/i-m-17-building-in-cloud-devops-from-nigeria-and-no-my-journey-isn-t-ai-generated/) | Not externally verified |
| 7 | [DEV original](https://dev.to/edwindevops/why-most-senior-devops-engineers-are-building-fragile-infrastructure-and-why-the-industry-4l5i) | [Website copy](https://edwinjdevops.github.io/engineering-platform/articles/why-most-senior-devops-engineers-are-building-fragile-infrastructure-and-why-the-industry-/) | Not externally verified |
| 8 | [DEV original](https://dev.to/edwindevops/how-i-used-oidc-to-eliminate-static-aws-keys-from-github-actions-real-pipeline-walkthrough-4dpo) | [Website copy](https://edwinjdevops.github.io/engineering-platform/articles/how-i-used-oidc-to-eliminate-static-aws-keys-from-github-actions-real-pipeline-walkthrough/) | Not externally verified |
| 9 | [DEV original](https://dev.to/edwindevops/i-built-a-production-grade-internal-developer-platform-at-17-full-architecture-id6) | [Website copy](https://edwinjdevops.github.io/engineering-platform/articles/i-built-a-production-grade-internal-developer-platform-at-17-full-architecture/) | Not externally verified |

## Procedure for account owner

1. Sign into https://dev.to and open the DEV article's edit screen.
2. Confirm that the content matches the intended website counterpart; review obsolete assertions before moving canonical ownership.
3. In the editor's **Canonical URL** setting (or `canonical_url` in the Basic Markdown front matter), enter the exact website URL from this table. Save without overwriting the actual article body or changing original published date.
4. Reopen the public DEV post, inspect its rendered canonical link, and confirm it equals the website target. If the DEV canonical cannot be verified, **do not mark that row complete**.
5. Use Google Search Console to monitor indexing; expect that Google may select its own canonical despite a declared preference. Avoid repeated manual indexing submissions.

No authenticated DEV publishing access was supplied here, so **none of these nine original DEV canonicals has been changed** by this repository PR.

## Current claims and historical archives

The original posts include statements about live AWS accounts, production readiness, and drift-detection capabilities that are not uniformly established by present repository evidence. This website preserves original prose but now adds an archival context note near the top of each DEV-derived copy. For current technical evidence and limitations, use the maintained engineering project case studies and source-controlled regression tests, not dated claims in the archive.

The new original investigation at `/articles/aws-inventory-failure-terraform-drift/` remains first-party and self-canonical. The ten Hashnode-origin articles keep their original Hashnode canonicals and are excluded from the sitemap.
