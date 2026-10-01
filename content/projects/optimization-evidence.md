---
title: "Optimization Evidence"
description: "Engineering research into proving whether infrastructure optimization produces safe, attributable, realized savings."
date: 2026-09-26
draft: false
domain: "FinOps / infrastructure experimentation"
evidence: "Implemented evidence foundation + proposed MVP"
boundary: "EXP-001 not yet executed"
---

## Problem

An infrastructure optimization recommendation is not the same thing as realized savings.

A Kubernetes request reduction can release schedulable capacity without removing a billable node. A lower cloud bill can also occur for reasons unrelated to an optimization. Optimization Evidence is an engineering research project built around that distinction.

The causal chain under investigation crosses the change itself, runtime capacity, billable resources, provider billing evidence and attribution. Operational safety is evaluated separately.

## Product hypothesis

The repository defines a falsifiable question: can an independent evidence layer determine whether an optimization remained operationally safe, changed billable capacity, appeared in provider billing evidence, and can be attributed to the specific change with sufficient confidence?

The project also defines kill criteria rather than assuming the thesis must succeed.

## Architecture boundary

The architecture document labels the MVP architecture as **proposed**. It states that only the domain state machine and AWS billing-evidence foundation are currently implemented.

The design intentionally starts as a modular monolith. External systems are adapters rather than independent services. Proposed adapters cover Git/GitHub provenance, Kubernetes/EKS observations, Prometheus-compatible operational evidence, EC2/Auto Scaling lifecycle evidence and AWS CUR 2.0 billing records.

Kafka, Temporal, ClickHouse and additional services are explicitly deferred until measured workload characteristics justify them.

## State model

The core aggregate is an optimization experiment rather than a recommendation.

The state model separates:

- observation and modeling
- approval and application
- operational verification
- capacity realization
- billing observation
- attribution verification
- realized outcome

Insufficient or contradictory evidence can terminate as inconclusive. Operational regressions can terminate as unsafe or rolled back. A billing change without sufficient causal evidence can terminate as attribution failed.

## Invariants

Several repository invariants prevent optimistic accounting:

- a realized outcome requires attribution verification
- attribution verification requires provider billing evidence
- reducing Kubernetes requests alone is not cash-savings evidence
- released schedulable capacity is not removed billable capacity
- a lower bill without a causal link is not attributable savings
- an operational regression prevents a successful realization classification
- missing, stale or contradictory evidence cannot be silently imputed
- raw evidence is immutable and derived decisions record provenance and rule versions

These are intended as product behavior, not presentation rules.

## EXP-001

The first experiment is currently **planned, not completed**.

It is designed to distinguish two cases. In one arm, application requests fall but the billable worker set remains unchanged; the expected classification is no cash saving. In the second, the request reduction permits an autoscaler to remove an EC2 worker; only after operational verification, instance-lifecycle evidence, CUR evidence and attribution checks may the experiment reach a realized classification.

The experiment defines a USD 20 monthly gross-cost budget as a guardrail, deterministic resource tags, teardown requirements and explicit stop conditions.

## Current evidence and limits

The repository currently reports its AWS CUR 2.0 hourly resource-level evidence export as deployed and healthy and the EXP-001 budget guardrail as configured.

It also states that EXP-001 itself has **not yet been executed**. This page therefore does not claim that the product thesis has been proven, that savings have been realized, or that the proposed MVP architecture has been fully implemented.

That distinction is the point of the project: modeled value, implemented evidence collection and proven financial outcomes are different states.

[Inspect the source repository](https://github.com/EdwinJdevops/optimization-evidence)
