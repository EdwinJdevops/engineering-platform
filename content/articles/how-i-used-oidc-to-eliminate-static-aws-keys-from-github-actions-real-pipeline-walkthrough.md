---
title: "How I Used OIDC to Eliminate Static AWS Keys from GitHub Actions (Real Pipeline Walkthrough)"
date: "2026-05-06"
description: "Static AWS access keys in GitHub Actions secrets is how  production environments get..."
draft: false
original_url: "https://dev.to/edwindevops/how-i-used-oidc-to-eliminate-static-aws-keys-from-github-actions-real-pipeline-walkthrough-4dpo"
original_platform: "devto"
aliases: []
---

Static AWS access keys in GitHub Actions secrets is how
production environments get breached.

Here's how I replaced every static key with OIDC federation
for the Damolak Technologies DevOps challenge —
and why you should too.

---

 The Problem With Static Keys

When you do this:
AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}
AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
 You have a long-lived credential sitting in GitHub that:
- Never rotates automatically
- Has blast radius if the repo is compromised
- Violates least-privilege by existing at all

---

 The Fix: OIDC

GitHub Actions supports OIDC token exchange with AWS.
Your pipeline requests a short-lived token. AWS validates it
against a trust policy. No stored credentials.

 Step 1 — IAM OIDC Provider

```hcl
resource "aws_iam_openid_connect_provider" "github" {
  url             = "https://token.actions.githubusercontent.com"
  client_id_list  = ["sts.amazonaws.com"]
  thumbprint_list = ["6938fd4d98bab03faadb97b34396831e3780aea1"]
}

Step 2 — Trust Policy (scoped to YOUR repo):
{
  "Condition": {
    "StringLike": {
      "token.actions.githubusercontent.com:sub":
        "repo:EdwinJdevops/damolak-challenge:ref:refs/heads/main"
    }
  }
}

This means ONLY your main branch can assume this role.
A fork cannot. A PR branch cannot. Exact scope.

Step 3 — GitHub Actions Workflow
permissions:
  id-token: write
  contents: read

- name: Configure AWS credentials
  uses: aws-actions/configure-aws-credentials@v4
  with:
    role-to-assume: arn:aws:iam::ACCOUNT_ID:role/github-actions-role
    aws-region: us-east-1
That's it. No secrets stored. Token lives for 15 minutes.

**The Full Pipeline I Shipped
**
OIDC auth → ECR login → Docker build + push →
ECS Fargate rolling deploy → ALB health check
33 AWS resources provisioned by Terraform.
Live endpoint behind ALB.
Zero static credentials anywhere in the stack.
Full repo: github.com/EdwinJdevops/damolak-challenge.

Connect:https://hashnode.com/@jonathandevops
Connect:https://www.linkedin.com/in/edwin-jonathan-1094093b0
Connect:https://x.com/TheCloudDeveng
