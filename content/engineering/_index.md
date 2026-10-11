---
title: "Engineering"
description: "How this site is built, checked, deployed and recovered—with explicit limits on what the automation proves."
draft: false
---

This website is itself a small delivery-system case study. Its architecture is intentionally static: Hugo renders the content, GitHub Actions builds and checks it, and GitHub Pages serves the generated files. There is no application server, database, Kubernetes cluster or continuously running control plane for this site.

The implementation can be inspected in the [engineering-platform repository](https://github.com/EdwinJdevops/engineering-platform).

## Change and validation path

Changes are proposed through pull requests to `main`. The [CI workflow](https://github.com/EdwinJdevops/engineering-platform/blob/main/.github/workflows/ci.yml) runs for changes to the site source and relevant configuration. Its checks include:

- Required Markdown front matter and Markdown linting.
- Hugo compilation using a container pinned to a specific image digest.
- Assertions that key generated pages exist and contain expected content.
- Offline generated-link checking and generated-HTML validation.
- Pa11y accessibility checks using axe against six configured routes.

A passing check means these specific tests succeeded on the tested revision. It does not establish that every page, device, assistive technology or external destination works. The accessibility suite covers selected routes, not the entire site.

The separate [security workflow](https://github.com/EdwinJdevops/engineering-platform/blob/main/.github/workflows/security.yml) checks tracked files for private-key markers and common secret-bearing filenames on pull requests, pushes and a weekly schedule. This is a narrow repository hygiene check—not comprehensive secret detection, dependency analysis or a security certification.

## Production delivery

The [production workflow](https://github.com/EdwinJdevops/engineering-platform/blob/main/.github/workflows/production.yml) builds the Hugo site on eligible pushes to `main`, uploads a Pages artifact, and deploys it using GitHub Pages Actions. The workflow grants read access by default; the deployment job receives Pages-write and OIDC-token permissions.

After deployment, the workflow checks HTTP 200 for thirteen published routes, including the public delivery record, and fourteen first-party assets (portrait, CSS, browser scripts and project illustrations). It also checks the portrait size and both RIFF and WEBP signature markers. These are availability and basic asset-integrity checks, not exhaustive decoding, browser compatibility or real-device validation.

The [live production browser smoke workflow](https://github.com/EdwinJdevops/engineering-platform/blob/main/.github/workflows/production-browser-smoke.yml) separately exercises the deployed site in Chromium across mobile and desktop profiles. It checks portrait loading, the WebGL/CSS fallback, reduced motion, navigation, project focus, expertise panels and contact email. **It runs on demand and on changes to its own test files; it is not automatically triggered by every production deployment.** Its evidence concerns the tested browser profiles, not all user devices or an uptime SLO.

The [production performance audit](https://github.com/EdwinJdevops/engineering-platform/blob/main/.github/workflows/performance-audit.yml) collects synthetic load measurements on demand. These are not real-user Core Web Vitals or INP results.

## A fully traceable public delivery example

The [public delivery record]({{< relref "/engineering/delivery-record" >}}) follows the site's article-cover defect through correction, browser regression tests, review and successful production deployment. It links to source changes and workflow conclusions. This independent, self-owned project evidence is not an anonymous customer testimonial or a substitute for validating private contracts.

## Failure and recovery model

A failed pull-request check blocks the intended review path; the underlying repository settings determine whether merging is technically prohibited. A failed build or deployment requires inspection of the workflow logs and correction in source.

For a bad content or template change already deployed, the intended recovery is to revert the offending commit through the normal Git workflow and allow production deployment to run again. There is no independently validated one-click rollback, blue/green release controller or automated incident response system.

The platform does not currently publish independent uptime measurements, recovery-time measurements or a historical deployment-health service. A green GitHub Actions run should not be presented as proof of continuous availability.

## Design decisions

Static hosting removes application-server maintenance and reduces the operational surface of this particular workload. GitHub Actions provides reproducible steps and inspectable logs without requiring a custom CI service. Kubernetes, Terraform, a database, a message broker and an AI agent would add complexity without solving a current requirement of this website.

The same reasoning does not automatically apply to the infrastructure systems documented in the [project case studies]({{< relref "/projects" >}}). Those systems have different workloads, trust boundaries and operational constraints.

## Source of truth

The repository is the source of truth for the site and its workflow definitions. Published project claims are bounded by checked-in implementation and independently identified limitations. Confidential commercial work is described only within permitted disclosure boundaries.

For engineering roles or a scoped infrastructure engagement, use the [contact page]({{< relref "/contact" >}}).
