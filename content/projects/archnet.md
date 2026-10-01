---
title: "ARCHNET"
description: "A Kubernetes platform prototype combining AWS infrastructure, k3s bootstrap, ArgoCD reconciliation and basic observability configuration."
date: 2026-09-26
draft: false
domain: "Kubernetes platform engineering"
evidence_boundary: "Platform prototype with documented correctness and security gaps; not represented as production-grade."
---

## Scope

ARCHNET explores the infrastructure and delivery path for a small Kubernetes platform: AWS networking and compute, k3s bootstrap, ArgoCD reconciliation, an example workload and Prometheus alert configuration.

The repository README calls the system a production-grade zero-trust internal developer platform. The checked-in implementation does not yet justify that description, so this case study uses the narrower term **platform prototype**.

## Implemented architecture

The repository contains Terraform for an AWS VPC, public subnet, internet gateway, route table, security group and EC2 instance; a k3s/ArgoCD bootstrap shell script; an ArgoCD Application manifest with automated prune and self-heal enabled; an nginx Deployment and ClusterIP Service; Prometheus scrape configuration and two alert rules; and a GitHub Actions workflow for structural checks and a Trivy filesystem scan.

This is enough to inspect the intended control path from infrastructure provisioning through GitOps reconciliation. It is not evidence that every advertised platform capability is operational.

## GitOps boundary

The ArgoCD Application enables automated pruning and self-healing, which establishes the intended reconciliation policy in configuration.

However, its repository URL still contains a placeholder username. The checked-in manifest therefore is not currently deployable against this repository without correction.

The existence of self-heal configuration is evidence of configuration intent; it is not by itself evidence of a tested recovery event.

## Infrastructure boundary

Terraform defines a single EC2-based k3s host and supporting public-network resources.

There is a blocking implementation defect: the EC2 user-data configuration references k3s/install.sh, but that file is absent from the current repository tree. The available bootstrap script is k3s/full-setup.sh.

The current security group also permits ports 22, 80, 443 and 6443 from 0.0.0.0/0. In particular, unrestricted SSH and Kubernetes API ingress are inconsistent with a zero-trust claim and would need to be constrained before treating this as a hardened deployment.

## Observability

Prometheus configuration includes Kubernetes pod and node discovery, an Alertmanager target and an alert-rule file. The checked-in rules detect pod restart activity and low available node memory.

The repository does not contain enough deployment configuration to establish a complete running Prometheus/Grafana/Loki stack. This case study therefore treats these files as observability configuration, not proof of a fully operated observability platform.

## Security claims that are not established

The repository description and README reference Sealed Secrets, secret rotation, network policies, RBAC auditing and zero-trust controls.

The current repository tree does not contain Sealed Secrets resources or network-policy manifests, and the documented security files referenced by the README are absent. Those capabilities are not claimed here.

## CI limitations

The GitHub Actions workflow has completed successfully in repository history, but its controls are weak:

- the YAML step lists matching files rather than parsing or validating them;
- directory checks report missing directories without failing the job;
- Trivy scans only CRITICAL findings and uses exit code 0;
- Actions are referenced by mutable tags or branches rather than immutable commits.

A green run therefore means the workflow executed, not that the platform passed a strong validation or security gate.

## Engineering value

ARCHNET is useful as evidence of composing several platform primitives and, more importantly, of the gap between architecture intent and production evidence.

The next meaningful work is not adding more components. It is closing the existing correctness and security gaps: make Terraform bootstrap deterministic, fix the ArgoCD source, restrict management-plane ingress, implement the security controls already claimed, and turn CI checks into enforceable validation.

[Inspect the source repository](https://github.com/EdwinJdevops/ARCHNET)
