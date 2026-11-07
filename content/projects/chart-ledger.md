---
title: "Chart Ledger"
seo_title: "Chart Ledger: Helm Upgrade Review Tool | Edwin Jonathan"
description: "A working Helm upgrade review tool that connects manifest changes to migration documentation and leaves deployment approval with the engineer."
date: 2026-10-25
draft: false
domain: "Kubernetes release engineering / Open-weight inference"
evidence: "Public Python source, tests, hosted model review and measured HTTP checks"
boundary: "Review preparation only; no upgrade execution or safety approval"
artifact_file: "tests/test_review.py"
artifact_url: "https://github.com/EdwinJdevops/upgrade-review-brief/blob/main/tests/test_review.py"
artifact_summary: "Source-controlled review tests; inspect the repository for current behavior"
artifact_kind: "PYTEST / SOURCE FILE"
featured_rank: 2
---
## The upgrade-review problem

A Helm chart update changes rendered Kubernetes resources, but a manifest diff alone cannot explain the migration prerequisites. Chart Ledger combines a bounded comparison of rendered manifests with relevant passages from a supplied migration guide. The output is a source-linked review document, not a deployment authorization.

## What runs

The Python application accepts before-and-after Kubernetes manifests and a migration guide. It compares selected Deployment fields: container images, HTTP readiness/liveness probe paths and ports, and `readOnlyRootFilesystem`. Other resource changes are inventoried rather than silently treated as understood. The review records input hashes, document coverage, source locations and unresolved questions, with Markdown and JSON exports.

The open-weight `BAAI/bge-reranker-base` model ranks migration passages. It does not generate upgrade commands or certify cluster readiness. The hosted service runs CPU inference on Render and intentionally limits concurrent inference; excess requests can receive HTTP 429.

## Evidence and limits

The [original Hacktoberfest 2026 submission](https://dev.to/edwindevops/chart-ledger-helm-upgrade-reviews-with-the-migration-guide-attached-494o) records 103 passing tests at application revision `3cc347f`, separate hosted functional checks and measured HTTP runs for the packaged examples. These measurements are historical, not a current service-level guarantee.

The same submission reports that normalized outputs matched over ten local runs, but floating-point relevance scores differed on a GitHub runner. The cross-environment byte-reproducibility test failed; that result is preserved. A multi-chart comparison against BM25 and token-overlap baselines, and a study of actual reviewer time saved, were not completed. No claim of generally superior ranking or reduced engineering time is justified.

## Original demonstration

![Chart Ledger report interface](https://raw.githubusercontent.com/EdwinJdevops/upgrade-review-brief/main/docs/demo/report-desktop.png)

The [repository](https://github.com/EdwinJdevops/upgrade-review-brief) contains the implementation, tests, demo screenshots, recorded browser demo and evidence notes. [Read the full DEV submission](https://dev.to/edwindevops/chart-ledger-helm-upgrade-reviews-with-the-migration-guide-attached-494o) for the exact test setup and limitations.
