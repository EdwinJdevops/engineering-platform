---
title: "When an AWS inventory failure looks like Terraform drift"
description: "A source-code examination of DriftGuard's comparison pipeline, partial AWS collection failures, and the boundary between a missing observation and a deleted resource."
date: 2026-10-10
lastmod: 2026-10-12
draft: false
---

Infrastructure drift detection sounds straightforward: read the desired Terraform state, collect live cloud resources, and compare the two. The difficult part is establishing whether the live observation is complete enough to justify a conclusion.

I examined this problem in [DriftGuard](https://github.com/EdwinJdevops/driftguard), an AWS-focused drift detection project that proposes remediation through reviewable GitHub pull requests rather than applying changes automatically. The original defect has since been addressed in [merged PR #3](https://github.com/EdwinJdevops/driftguard/pull/3). This article records both the failure mode and what the current source actually verifies; it is **not** a claim of production-scale validation.

## The implemented comparison path

The [Terraform state parser](https://github.com/EdwinJdevops/driftguard/blob/main/backend/engines/drift.py) walks managed resources in a state document and extracts their attributes and identifiers. The AWS collector uses boto3 to enumerate EC2 instances, S3 buckets, security groups and RDS instances. The analyzer compares Terraform identifiers with collected live identifiers.

Its classification logic has three paths:

- A Terraform-managed identifier missing from the live map becomes a `deleted` finding.
- A matching identifier with differing attributes becomes a `modified` finding.
- A live identifier not present in the Terraform-derived set becomes an `added` finding.

These are implemented comparison rules, not proof that the resulting classification is always accurate.

## The dangerous ambiguity: absent versus unobserved

Before the October 10 fix, the collector could catch an AWS enumeration exception and return resources collected so far. For example, an EC2 enumeration error could produce an empty EC2 inventory without a corresponding failure reaching the analyzer.

That created this failure sequence:

1. Terraform state contains a managed EC2 instance.
2. The EC2 API request fails or the inventory cannot be completed.
3. The collector returns an empty or partial EC2 map.
4. The analyzer sees the expected instance absent and emits a `deleted` finding.

The infrastructure may still have existed. The implementation risk was confusing **failure to observe** with **evidence of absence**.

Changing severity labels or adding retries alone would not establish that a resource was actually absent.

## The implemented correction and its limits

[PR #3](https://github.com/EdwinJdevops/driftguard/pull/3), merged October 10, changed the top-level EC2, S3 bucket, security-group and RDS inventory collectors to raise `RuntimeError` when enumeration fails. The [scan pipeline](https://github.com/EdwinJdevops/driftguard/blob/main/backend/api/main.py) invokes `collect_all()` before classification; an exception interrupts the scan instead of passing a partial top-level inventory to the analyzer. This is **whole-scan fail-closed behavior**, not a per-scope `complete`/`failed` result protocol.

The [regression tests](https://github.com/EdwinJdevops/driftguard/blob/main/backend/tests/test_drift_engine.py) inject failures when enumeration starts and assert those collector methods raise. They do **not** establish every mid-pagination failure path or real-account behavior. For stronger assurance, inject a failure after at least one page is read and verify the scan cannot produce false deletion findings.

Another boundary remains: `collect_s3_buckets()` catches some *per-bucket attribute-read errors* (versioning, encryption, ACL) and can continue with missing or defaulted attributes. This is distinct from a failed top-level bucket listing. Attribute completeness and the resulting comparison accuracy still require explicit tests and design decisions.

A per-scope completeness contract could permit successful scopes to finish even when another scope fails, but that more granular behavior is **not** implemented in the current collector.

## A second boundary: Terraform resource instances

The original parser keyed resources using `resource_type.resource_name`, risking overwrites when a Terraform resource had multiple instances. [PR #3](https://github.com/EdwinJdevops/driftguard/pull/3) now preserves integer and string `index_key` suffixes; it raises an error on multiple unindexed instances instead of silently overwriting them. A [regression test](https://github.com/EdwinJdevops/driftguard/blob/main/backend/tests/test_drift_engine.py) checks two indexed instances retain distinct identifiers.

This addresses the demonstrated overwrite case; it does not establish support for every Terraform state layout.

## Why remediation stays behind review

The [GitHub integration](https://github.com/EdwinJdevops/driftguard/blob/main/backend/integrations/github_pr.py) uses GitHub App installation tokens and writes proposed Terraform files under a `driftguard-remediations/` directory. It does not rewrite arbitrary existing Terraform blocks in place or run `terraform apply`.

That boundary limits the blast radius of a mistaken finding: a false positive can still waste reviewer time or generate a misleading pull request, but the code path does not directly mutate AWS infrastructure.

Human review is therefore a useful control, **not** a substitute for correct observation semantics.

## What the available tests establish

The repository's [CI workflow](https://github.com/EdwinJdevops/driftguard/blob/main/.github/workflows/ci.yml) runs backend lint/tests, CLI checks, a VS Code extension TypeScript build and a frontend lint/build. These checks provide repeatable validation of their covered behaviors.

The checks include collector-enumeration failure and indexed-instance regression tests. They do not establish complete attribute reads, live mid-pagination fault injection, multi-tenant load reliability or cross-account validation against real customer accounts. The [project README](https://github.com/EdwinJdevops/driftguard/blob/main/README.md) also notes that scan scheduling is not enforced and the cross-account AssumeRole path is not live-validated.

## Engineering conclusion

The central invariant for drift detection is not merely *compare desired and observed values*. It is:

**Never infer that a resource is absent unless the relevant observation completed successfully.**

The October 10 fix enforces this invariant for top-level inventory enumeration failures by aborting the scan; the corresponding test suite runs in [GitHub Actions](https://github.com/EdwinJdevops/driftguard/actions/workflows/ci.yml). The next verification work is to cover failures after partial pagination, distinguish per-resource attribute read failures from known values, and test those boundaries against controlled live AWS environments. Do not interpret this correction as proof of complete production readiness.

Related: [DriftGuard case study]({{< relref "/projects/driftguard" >}}).
