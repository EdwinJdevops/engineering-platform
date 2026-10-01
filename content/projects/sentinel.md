---
title: "SENTINEL"
description: "A Kubernetes security-scanning lab combining container vulnerability and posture scan evidence with scheduled CI automation."
date: 2026-09-26
draft: false
domain: "Kubernetes security scanning"
evidence_boundary: "Automates and aggregates scan evidence; does not establish the broader production security platform described upstream."
---

## Scope

SENTINEL is a Kubernetes security-scanning lab. Its repository contains Trivy and Kubescape scan artifacts, a scheduled GitHub Actions workflow, a small report aggregator and Terraform for local Kubernetes namespaces.

This case study deliberately uses a narrower description than the repository README. The checked-in implementation does not currently establish the full production security-platform architecture described there.

## Implemented evidence

The repository contains persisted Trivy and Kubescape JSON reports. It also contains a GitHub Actions workflow that runs on pushes to the main branch and on a daily schedule.

The workflow has two jobs:

- Trivy scans nginx:latest for OS vulnerabilities and uploads the JSON result as an artifact.
- Kubescape is installed at runtime, executes a scan and uploads its JSON result.

Repository workflow history confirms scheduled executions of both jobs.

## Aggregation

A Python script parses Trivy vulnerability severities and reads the Kubescape compliance score, then emits a small combined JSON report with a derived risk level.

This is aggregation logic, not a complete security analytics system. It does not currently provide persistence, alert routing, historical correlation or a policy engine.

## Terraform boundary

The Terraform configuration uses the Kubernetes provider against a local Minikube context. It declares three namespaces: monitoring, security and argocd.

The repository does not currently contain Terraform that provisions a Kubernetes cluster or cloud infrastructure.

## What the evidence does not establish

The repository README describes Falco runtime detection, Prometheus/Grafana observability, ArgoCD GitOps delivery and a broader unified security pipeline.

Those components are not present in the current repository tree as deployable configuration. This case study therefore does not claim they are implemented here.

The workflow also runs Kubescape with a non-blocking exit path. A successful workflow run means the scan job completed and its artifact was uploaded; it does not mean Kubescape found no failed controls.

Similarly, historical scan output is evidence for the scanned artifact and point in time, not a permanent security property of nginx:latest, Kubernetes or the environment.

## Engineering lessons

SENTINEL is useful evidence for a narrower set of concerns:

1. collecting machine-readable security scan output;
2. automating recurring scans in CI;
3. preserving results as artifacts;
4. normalizing results from different scanners;
5. distinguishing scan execution success from security-policy success.

The fifth point is particularly important. A security pipeline becomes misleading if its green status can be interpreted as a clean security result when findings are intentionally non-blocking.

## Next hardening steps

Before this should be represented as a broader security platform, the repository would need the missing deployable components, explicit policy thresholds, pinned supply-chain dependencies, reproducible scanner installation, and tests around report parsing and enforcement behavior.

[Inspect the source repository](https://github.com/EdwinJdevops/SENTINEL)
