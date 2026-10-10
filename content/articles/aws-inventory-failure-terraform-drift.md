---
title: "When an AWS inventory failure looks like Terraform drift"
description: "A source-code examination of DriftGuard's comparison pipeline, partial AWS collection failures, and the boundary between a missing observation and a deleted resource."
date: 2026-10-10
draft: false
---

Infrastructure drift detection sounds straightforward: read the desired Terraform state, collect live cloud resources, and compare the two. The difficult part is establishing whether the live observation is complete enough to justify a conclusion.

I examined this problem in [DriftGuard](https://github.com/EdwinJdevops/driftguard), an AWS-focused drift detection project that proposes remediation through reviewable GitHub pull requests rather than applying changes automatically. This article describes code visible in the repository; it is **not** a claim of production-scale validation.

## The implemented comparison path

The [Terraform state parser](https://github.com/EdwinJdevops/driftguard/blob/main/backend/engines/drift.py) walks managed resources in a state document and extracts their attributes and identifiers. The AWS collector uses boto3 to enumerate EC2 instances, S3 buckets, security groups and RDS instances. The analyzer compares Terraform identifiers with collected live identifiers.

Its classification logic has three paths:

- A Terraform-managed identifier missing from the live map becomes a `deleted` finding.
- A matching identifier with differing attributes becomes a `modified` finding.
- A live identifier not present in the Terraform-derived set becomes an `added` finding.

These are implemented comparison rules, not proof that the resulting classification is always accurate.

## The dangerous ambiguity: absent versus unobserved

Several collection methods catch broad exceptions, log an error and return the resources collected so far. For example, an EC2 enumeration error can result in an empty EC2 inventory. The analyzer does not receive a collection-completeness status alongside that map.

That creates a specific failure sequence:

1. Terraform state contains a managed EC2 instance.
2. The EC2 API request fails or the inventory cannot be completed.
3. The collector returns an empty or partial EC2 map.
4. The analyzer sees the expected instance absent and emits a `deleted` finding.

The infrastructure may still exist. The system has confused **failure to observe** with **evidence of absence**.

This is not fixed by changing severity labels or adding a retry count alone. The comparison layer needs a trustworthy statement about collection completeness.

## A bounded correction

A small, testable design change would make collection outcomes explicit. For each resource type and scope, return the collected resources together with a status such as `complete` or `failed`, plus error details suitable for diagnosis. Partial pagination must not be reported as complete.

The analyzer should only emit deletion findings for scopes whose inventory is complete. If collection fails, the scan should report an indeterminate result for that scope and preserve the failure reason. Other independently completed scopes may still be analyzed.

This proposal has **not** been implemented or verified in the linked repository. It is a recommended correction derived from the current control flow.

A useful regression test would inject an AWS pagination failure with a Terraform-managed instance present, then assert that the result is *collection incomplete*, **not** *resource deleted*. A second test should verify that a genuinely absent resource is classified as deleted when collection completes successfully.

## A second boundary: Terraform resource instances

The parser currently keys extracted resources using `resource_type.resource_name`. When a Terraform resource contains multiple instances, that key can be overwritten by a later instance. A reliable implementation needs to preserve instance identity, including indexed or keyed instances, before comparison.

This is a separate correctness issue from AWS collection failures. Neither should be hidden behind a general claim that the engine supports arbitrary Terraform state layouts.

## Why remediation stays behind review

The [GitHub integration](https://github.com/EdwinJdevops/driftguard/blob/main/backend/integrations/github_pr.py) uses GitHub App installation tokens and writes proposed Terraform files under a `driftguard-remediations/` directory. It does not rewrite arbitrary existing Terraform blocks in place or run `terraform apply`.

That boundary limits the blast radius of a mistaken finding: a false positive can still waste reviewer time or generate a misleading pull request, but the code path does not directly mutate AWS infrastructure.

Human review is therefore a useful control, **not** a substitute for correct observation semantics.

## What the available tests establish

The repository's [CI workflow](https://github.com/EdwinJdevops/driftguard/blob/main/.github/workflows/ci.yml) runs backend lint/tests, CLI checks, a VS Code extension TypeScript build and a frontend lint/build. These checks provide repeatable validation of their covered behaviors.

They do not establish that cross-account AWS collection has been validated against real customer accounts, that partial inventories are safely classified, or that the system is ready for multi-tenant production load. The [project README](https://github.com/EdwinJdevops/driftguard/blob/main/README.md) also explicitly notes that scan scheduling is not enforced and that the cross-account AssumeRole path is not live-validated.

## Engineering conclusion

The central invariant for drift detection is not merely *compare desired and observed values*. It is:

**Never infer that a resource is absent unless the relevant observation completed successfully.**

The current code provides a concrete reason to enforce that invariant. The next meaningful engineering step is to implement collection-completeness propagation and failure-injection tests in DriftGuard itself. Publishing this analysis does not mean the underlying defect has been repaired.

Related: [DriftGuard case study]({{< relref "/projects/driftguard" >}}).
