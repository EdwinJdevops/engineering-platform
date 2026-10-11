---
title: "Warden"
date: 2026-10-11
draft: false
description: "Policy-tiered Kubernetes remediation with a deliberately bounded GitOps approval path."
domain: "Kubernetes / Policy enforcement"
evidence: "Public Go source and tests; live end-to-end automation not established"
boundary: "PR automation defaults to dry-run; production integration unverified"
illustration: "warden"
featured_rank: 1
---

## The engineering problem

A policy violation detected by Kyverno does not automatically establish which source change is safe to make. Directly mutating a live workload can also bypass the GitOps review boundary. Warden investigates a remediation path that keeps Git as the intended authority and enforces a policy-defined ceiling on automation.

## Repository-backed implementation

The public repository contains a Go controller, policy-tier classification, resource-limit patch generation, Kubernetes client dependencies and GitHub pull-request integration. The source README documents tests for the manual approval boundary and deterministic remediation. The controller's PR integration is **dry-run by default**.

The decision path is a policy report, a declared trust tier, an eligible source patch and a GitHub PR. A manual-gate tier must not auto-merge because an inferred confidence score is high.

## Verification boundary

The README reports local kind/AKS policy checks and passing unit tests, but also identifies an untested PolicyReport watcher and an unexecuted full end-to-end run using a live cluster and GitHub token. Those gaps prevent a claim that Warden operates a fully autonomous production remediation loop.

## Next meaningful test

Validate an end-to-end finding-to-PR workflow against an isolated repository and a disposable cluster. Verify that manual-gate findings cannot bypass approval, including failure and retry cases. No live-cluster write is implied by this case study.

[Source and current implementation](https://github.com/EdwinJdevops/warden)
