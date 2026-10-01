---
title: "DriftGuard"
description: "Terraform drift detection and review-based remediation for AWS infrastructure."
date: 2026-09-26
draft: false
domain: "Infrastructure reconciliation"
evidence: "Implemented system + automated tests"
boundary: "Review-based remediation; AWS-specific"
---

## Problem

Terraform state records the infrastructure Terraform knows about. Operational changes can still happen outside the intended workflow. DriftGuard is built to compare Terraform state with live AWS state and turn detected discrepancies into reviewable engineering evidence rather than silently changing infrastructure.

## System boundary

The current implementation is AWS-specific. It parses Terraform state, collects live AWS resource state, analyzes differences, maps supported findings to security context, stores scan results, and can generate a proposed HCL remediation in a GitHub pull request.

The remediation boundary is deliberate: DriftGuard does **not** apply infrastructure changes automatically.

## Architecture

The repository currently contains:

- a FastAPI API and drift engine
- Terraform-state parsing and AWS state collection
- PostgreSQL-backed finding storage, with SQLite available for local testing
- AWS STS AssumeRole support for cross-account access
- GitHub App installation-token integration for remediation pull requests
- a CLI client
- a React/Vite/TypeScript frontend
- a VS Code extension

The supported AWS resource coverage documented in the repository includes EC2 instances, S3 buckets, security groups, RDS instances, IAM roles and IAM policies.

## Security decisions

Two design choices matter more than the number of components.

### AWS credentials

The cross-account design uses STS AssumeRole and a per-workspace external ID rather than accepting long-lived AWS access keys over the API. The implementation includes a confused-deputy check around the external-ID boundary.

For a self-hosted single-account deployment, the application can use the ambient AWS credential chain instead.

### GitHub credentials

Remediation PR creation uses GitHub App installation tokens instead of a broad static personal access token. The intended access is installation-scoped and short-lived.

## Human-controlled remediation

DriftGuard generates reviewable remediation rather than auto-applying it. That is intentional.

Automatically splicing generated HCL into an existing Terraform codebase would require materially stronger parsing and correctness guarantees. A malformed automatic change could turn a detection tool into an infrastructure mutation risk. The current system keeps a human review boundary between detection and execution.

## Verification

The repository documents automated tests across the drift engine, AWS authentication behavior, GitHub PR automation and CLI. Frontend and extension code also have build/type-check gates in CI.

The project README currently documents 50 backend tests and 5 CLI tests. Those numbers describe the repository's present test suite; they are not presented as production reliability metrics.

## Known limitations

The repository states the current gaps explicitly:

- scheduled scanning is not yet enforced
- cross-account AssumeRole is unit-tested but not yet validated against the intended real cross-account production setup
- database schema changes do not yet use Alembic migrations
- the system has not undergone multi-tenant load testing
- multi-cloud collection is not implemented

These limitations are part of the engineering evidence. Hiding them would make the case study weaker, not stronger.

## Why this project matters

DriftGuard demonstrates a control-plane problem rather than a deployment tutorial: reconcile declared infrastructure with observed infrastructure, preserve a security boundary around credentials, produce an auditable proposed change, and stop before autonomous mutation.

[Inspect the source repository](https://github.com/EdwinJdevops/driftguard)
