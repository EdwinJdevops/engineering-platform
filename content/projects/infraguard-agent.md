---
title: "InfraGuard Agent"
description: "A cloud-security remediation agent prototype with deterministic security mappings, Terraform proposal generation and GitHub pull-request delivery."
date: 2026-09-26
draft: false
domain: "Cloud security / Agentic remediation"
evidence_boundary: "Main branch proposes Terraform through GitHub review; newer hardening work remains unmerged."
---

## Scope

InfraGuard explores a constrained agentic security workflow: accept a cloud-security finding, map it to known security context, produce a proposed Terraform remediation and deliver that proposal through GitHub for human review.

The important boundary is that proposal generation and infrastructure mutation are different operations. The implementation on the main branch creates a Git branch, commits a Terraform artifact and opens a pull request; it does not call Terraform apply or directly mutate AWS resources.

## Main-branch implementation

The current main branch contains:

- a FastAPI API with API-key authentication and request-rate limits;
- deterministic security mappings for selected AWS resource classes;
- Azure-hosted model calls for analysis with hard-coded fallback knowledge;
- Terraform remediation templates;
- a confidence gate before pull-request creation;
- GitHub API logic for branch, artifact and pull-request creation;
- Kubernetes deployment, ServiceAccount/RBAC and NetworkPolicy manifests.

The Kubernetes workload is configured to run non-root, drop Linux capabilities, disable privilege escalation and use a read-only root filesystem.

## Human approval boundary

The remediation path is review-based.

For an accepted analysis, the agent creates a feature branch and writes a Terraform file containing the proposed remediation and audit context. It then opens a pull request with a review checklist.

No evidence reviewed here establishes automatic merge or direct infrastructure application. Describing the system as fully autonomous infrastructure remediation would therefore be inaccurate.

## Confidence is not independently measured

The code checks a confidence threshold before opening a PR. However, the current reasoning path returns a fixed confidence score of 94 for supported results rather than deriving a calibrated probability from measured model performance.

The threshold is consequently a control-flow gate, not evidence that a proposal is 94 percent likely to be correct.

## Credential-model discrepancy

The Kubernetes and security documentation describe Azure Workload Identity and short-lived GitHub App credentials. The main-branch Python implementation, however, reads an Azure API key and GitHub token from environment variables, and the Deployment references Kubernetes Secret values for those credentials.

The documentation's claim that no static credentials exist is therefore not established by the current main-branch runtime code.

## Security-model caveats

Several security controls are real configuration artifacts: non-root execution, read-only filesystem, dropped capabilities, namespace-scoped RBAC and a NetworkPolicy.

Other statements require care. The NetworkPolicy permits outbound HTTP and HTTPS without a destination restriction, so it is not evidence of tightly constrained egress. The RBAC Role also permits reading Secrets in the namespace, which is a meaningful privilege and should be justified against the runtime's actual needs.

## Newer hardening work

The repository also contains open, stacked production-hardening pull requests that are not yet part of main.

One reviewed hardening PR introduces a much narrower trust boundary for AWS Security Hub findings: it validates a supported Security Hub event, verifies live EC2 security-group rules, binds account/region/resource identity, requires Terraform state-backed ownership evidence and fails closed across several ambiguous ownership cases.

That PR documents 82 tests and its referenced GitHub CI run completed successfully.

It also explicitly states what remains unimplemented: production EventBridge/SQS infrastructure, KMS/IAM composition, STS role selection and assumption, durable workflow/idempotency state, real-account integration tests, immutable repository checkout, Terraform plan evaluation, GitHub publication in the hardened path, deployment and post-deployment verification.

Because this work is unmerged, it is evidence of active engineering and test design—not a capability attributed to the released main branch.

## Claims not made here

This case study does not claim:

- sub-30-second remediation performance;
- zero-human-intervention production changes;
- calibrated AI correctness;
- a fully OIDC-only credential path;
- production readiness;
- that the newer Security Hub hardening branch is deployed.

Those claims require evidence beyond what is currently merged.

## Engineering direction

The strongest direction in the repository is the move away from trusting an alert or model output at face value. The newer work attempts to establish provenance, independently verify live cloud state, prove Terraform ownership and fail closed before a generated patch becomes eligible for review.

That is a stronger security boundary than adding more agent autonomy.

[Inspect the source repository](https://github.com/EdwinJdevops/infraguard-agent)
