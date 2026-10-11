# Article migration ledger

## Sources and scope

- DEV author: https://dev.to/edwindevops
- Hashnode original blog: https://edwinjonathand-devops.hashnode.dev/
- Hashnode archive reviewed on 2026-10-11: 18 published articles.
- Existing Hugo articles before this batch: nine DEV originals and one repository-authored analysis.
- This batch: ten additional Hashnode originals; eight overlapping Hashnode posts deliberately not duplicated.

Full Hashnode Markdown was retrieved from each published post's **View as Markdown** endpoint, rather than from RSS excerpts or synthetic summaries. The original markdown was saved as a review-only GitHub Actions artifact, with SHA-256 checks before conversion.

## Ten Hashnode articles added

| Publication date | Original Hashnode slug |
| --- | --- |
| 2026-07-24 | building-production-ai-observability-on-kubernetes-opentelemetry-langfuse-prometheus-grafana-from-zero-to-scale |
| 2026-07-21 | why-most-gitops-migrations-fail-after-six-months |
| 2026-07-14 | building-agentic-operations-assistant-aws-bedrock-s3 |
| 2026-07-01 | open-source-collapse-ai-killing-internet-builders |
| 2026-05-17 | iam-least-privilege-in-practice-what-most-tutorials-get-wrong |
| 2026-05-16 | how-i-secured-an-ecs-fargate-deployment-with-oidc-and-ecr-no-static-keys |
| 2026-05-10 | ai-agents-in-devops-building-autonomous-cloud-infrastructure-that-operates-itself |
| 2026-05-08 | securing-aws-deployments-with-github-actions-oidc-a-production-walkthrough |
| 2026-05-07 | ai-agents-in-devops-engineering-the-death-of-manual-operations |
| 2026-04-27 | how-i-built-a-production-gitops-pipeline-on-aws-at-17-k3s-argocd-github-actions-from-scratch |

## Hashnode copies excluded as duplicates

Six posts had exact-title matches and very high six-word-shingle overlap with existing DEV articles: DriftGuard Terraform state, junior engineers learning AI, deployment recovery, backup/disaster recovery, the author's career story, and industry infrastructure fragility.

Two more were determined to overlap substantially under different titles:

- **How I Eliminated Static AWS Credentials from GitHub Actions Using OIDC** repeats the same Damolak/GitHub OIDC walkthrough already available from DEV, with substantial text and example overlap.
- **I Built a Production-Grade Internal Developer Platform at 17 — Here's the Full Architecture** closely matches the existing DEV platform architecture publication (measured six-word-shingle Jaccard: 0.875).

This is an editorial deduplication, not an assertion that the full Markdown bytes are identical.

## Fidelity and SEO

Each new article preserves its Hashnode URL, publication date, and full original prose in Hugo front matter. The original Hashnode page remains the canonical URL unless cross-post canonical settings are deliberately changed. This avoids asserting two different canonical pages for identical content.

Normalization is limited to adapting the original Markdown for Hugo: removing the duplicate article-level heading supplied by the layout, demoting additional first-level headings, and removing Hashnode-specific alignment attributes from image Markdown so diagrams load as standard Markdown images. The image files remain hosted on Hashnode's CDN; their availability and content are not controlled by this repository. Future asset ownership changes require a separate media provenance and licensing review.

The archive contains historical opinions and engineering claims. A published article is **not** automatically a current claim that every discussed system is deployed, independently tested, or production-ready. Project case studies and source repositories remain the implementation-evidence boundary.

## Reproduction and review

The migration used a temporary workflow in PR #62 to fetch, compare and prepare full Markdown before staging the ten new pages. The workflow's branch-write step was removed before merging so the normal publishing pipeline remains pull-request reviewed.

Run the existing Hugo, Markdown, HTML, accessibility, link and visual browser checks on migrated content. Verify image rendering, code blocks, site URLs and original publication metadata before asserting the articles are live. The older `scripts/review_article_import.py` is a draft-discovery utility; it does not automatically publish or reconstruct complete Hashnode articles.
