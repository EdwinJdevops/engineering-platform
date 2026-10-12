---
seo_title: "Warden: Kubernetes GitOps Remediation Controls | Edwin Jonathan"
artifact_file: "controller/internal/remediation/tier_test.go"
artifact_url: "https://github.com/EdwinJdevops/warden/blob/master/controller/internal/remediation/tier_test.go"
artifact_summary: "Manual-gate policy tests that reject automatic merge"
artifact_kind: "GO TEST / SOURCE FILE"
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

## Executed verification

Warden now runs its source-controlled [Go safety checks on pull requests and `master`](https://github.com/EdwinJdevops/warden/actions/workflows/go-ci.yml). The [first successful post-merge run (#38250292469)](https://github.com/EdwinJdevops/warden/actions/runs/38250292469) executed:

- Policy-tier tests, including the `TestManualGateNeverAutoMerges` boundary across confidence values.
- GitOps resource-limits patch-generator tests using example Kubernetes manifests.
- All Go package tests, `go vet`, and a controller binary build.

The workflow uses the Go version declared by the [source module](https://github.com/EdwinJdevops/warden/blob/master/go.mod). The [test implementation](https://github.com/EdwinJdevops/warden/blob/master/controller/internal/remediation/tier_test.go) and [current build workflow](https://github.com/EdwinJdevops/warden/blob/master/.github/workflows/go-ci.yml) are public.

**Verification boundary:** These checks establish the behavior of the tested functions and that the controller compiles; they do not establish live PolicyReport watching, safe GitHub PR delivery under retries, deployed auto-merge authorization, or a full finding-to-cluster end-to-end run. The repository still documents those integration gaps.

## Next meaningful test

Validate an end-to-end finding-to-PR workflow against an isolated repository and a disposable cluster. Verify that manual-gate findings cannot bypass approval, including failure and retry cases. No live-cluster write is implied by this case study.

[Source and current implementation](https://github.com/EdwinJdevops/warden)
