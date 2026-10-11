---
title: "InfraGuard"
date: 2026-10-11
draft: false
description: "Source-backed AWS Security Hub remediation hardening: live-state verification, Terraform ownership and fail-closed proposal eligibility."
domain: "AWS security / Remediation assurance"
evidence: "Open Security Hub hardening PR; not part of the released main branch"
boundary: "Design and tests in an unmerged, draft pull request; no production deployment"
illustration: "infraguard"
featured_rank: 2
---

## What this workstream is

InfraGuard refers here to the **Security Hub remediation hardening workstream** under the existing [InfraGuard Agent repository](https://github.com/EdwinJdevops/infraguard-agent), not a separate source repository or a second deployed product. The distinction matters: the Agent's released prototype and the newer hardened AWS path have different evidence boundaries.

## Problem and trust boundary

An alert is not adequate authority to change infrastructure. The proposed hardening flow validates a supported Security Hub event, independently checks live EC2 security-group rules, binds account, region and resource identity, and requires evidence that Terraform owns the resource before a proposed change can proceed.

Ambiguous resource ownership or inconclusive state observations must fail closed.

## Current evidence

[InfraGuard Agent PR #5](https://github.com/EdwinJdevops/infraguard-agent/pull/5) contains the Security Hub hardening implementation. At the time of review it remains **open and draft**, with its changes not merged into `main`. This is an ongoing engineering workstream, not an independently verified production service.

The PR documentation identifies remaining integrations, including event ingestion, IAM/STS composition, durable workflow state, real-account testing, Terraform plan evaluation and post-deployment verification.

## Relationship to InfraGuard Agent

[InfraGuard Agent]({{< ref "/projects/infraguard-agent" >}}) documents the current main-branch API and GitHub PR proposal workflow, including known credential-model and authentication gaps. Neither page claims autonomous production infrastructure mutation.

[Inspect the hardening pull request](https://github.com/EdwinJdevops/infraguard-agent/pull/5)
