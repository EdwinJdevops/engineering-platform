---
title: "DRIFTGUARD"
date: "2026-06-11"
description: "Hey DEV.to 👋  I'm Edwin, a self-taught Cloud &amp; DevOps Engineer from Lagos, Nigeria.  I built..."
draft: false
original_url: "https://dev.to/edwindevops/driftguard-93n"
original_platform: "devto"
aliases: []
---

Hey DEV.to
![Image description](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/8o5w3w705vvykgrmcjpo.jpeg)👋

I'm Edwin, a self-taught Cloud & DevOps Engineer from Lagos, Nigeria.

I built DriftGuard because I kept watching the same thing
happen: engineers write perfect Terraform, apply it, and
then someone clicks around in the AWS console three weeks
later. Security group opened. S3 encryption disabled. RDS
made publicly accessible. Nobody knows until something
breaks or gets breached.

Driftctl is abandoned. Checkov only scans. Infracost only
costs. Nothing combined all three with auto-remediation.

So I built it.

DriftGuard detects drift, scores it against CIS AWS
Benchmarks and MITRE ATT&CK, calculates the monthly cost
delta, and opens a GitHub PR with the exact Terraform HCL
fix — automatically.

Live API: <https://driftguard-endm.onrender.com/docs>
GitHub: github.com/EdwinJdevops/driftguard

No VC funding. No team. Built in Lagos.
Brutal feedback welcome — that's why I'm here.

![Image description](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/z2xpqkhu39hlbqt6w017.jpeg)
