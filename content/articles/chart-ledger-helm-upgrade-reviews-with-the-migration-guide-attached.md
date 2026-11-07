---
title: "Chart Ledger: Helm Upgrade Reviews, with the Migration Guide Attached"
description: "Why a Kubernetes manifest diff is not a migration review, and how Chart Ledger prepares a traceable, human-approved upgrade report."
date: 2026-10-25
draft: false
original_url: "https://dev.to/edwindevops/chart-ledger-helm-upgrade-reviews-with-the-migration-guide-attached-494o"
original_platform: "dev.to"
canonical_url: "https://dev.to/edwindevops/chart-ledger-helm-upgrade-reviews-with-the-migration-guide-attached-494o"
cover_image: "https://raw.githubusercontent.com/EdwinJdevops/upgrade-review-brief/main/docs/demo/report-desktop.png"
cover_alt: "Chart Ledger browser report showing migration-review evidence"
cover_credit: "Edwin Jonathan / Chart Ledger repository demo screenshot"
tags: ["Kubernetes", "Helm", "Python", "Open source"]
---

This is an abridged portfolio edition of my [original Hacktoberfest 2026 Week 3 submission](https://dev.to/edwindevops/chart-ledger-helm-upgrade-reviews-with-the-migration-guide-attached-494o). The original contains the complete implementation narrative, benchmarks, limitations and recorded evidence.

## The failure in a diff-only review

Consider a Kong Helm chart change where the readiness probe path moves from `/status` to `/status/ready`. A diff exposes the changed string. It does not tell the reviewer which migration instructions matter, which prerequisites apply or what remains unknown.

Chart Ledger takes the before-and-after rendered manifests and a migration guide, extracts supported Deployment changes, inventories other changed resources and ranks relevant documentation passages. It produces a source-linked report with input hashes and unresolved questions. Every report remains **REVIEW REQUIRED**.

## Why the model has a narrow job

The application uses `BAAI/bge-reranker-base` on CPU to rank migration passages against questions derived from manifest changes. Deterministic comparison is separate from model ranking. The model does not execute Helm, validate a live Kubernetes cluster or approve a release.

![Chart Ledger report displayed in a browser](https://raw.githubusercontent.com/EdwinJdevops/upgrade-review-brief/main/docs/demo/report-desktop.png)

## What the recorded tests actually establish

The [submission](https://dev.to/edwindevops/chart-ledger-helm-upgrade-reviews-with-the-migration-guide-attached-494o) reports 103 passing tests at revision `3cc347f` and successful hosted inference checks. Its HTTP measurements are end-to-end request timings, not isolated model latency. The service bounds concurrency and can return HTTP 429.

A reproducibility check also failed across machines: passage order matched in the comparison, but floating-point scores differed. That result remains part of the evidence. The multi-chart BM25 comparison and controlled reviewer-productivity study remain unfinished.

## Inspect the implementation

- [Python source, tests and evidence](https://github.com/EdwinJdevops/upgrade-review-brief)
- [Original full-length article on DEV](https://dev.to/edwindevops/chart-ledger-helm-upgrade-reviews-with-the-migration-guide-attached-494o)
- [Recorded browser demonstration](https://github.com/EdwinJdevops/upgrade-review-brief/blob/main/docs/demo/browser-demo.mp4)

The engineering boundary is deliberate: Chart Ledger prepares a review; the engineer owns the deployment decision.
