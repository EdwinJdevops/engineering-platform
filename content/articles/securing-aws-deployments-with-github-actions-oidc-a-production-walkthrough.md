---
title: "Securing AWS deployments with GitHub Actions OIDC — a production walkthrough"
date: "2026-05-08"
description: "A technical walkthrough of GitHub Actions OIDC federation and scoped AWS IAM roles as alternatives to static CI credentials."
draft: false
original_url: "https://edwinjonathand-devops.hashnode.dev/securing-aws-deployments-with-github-actions-oidc-a-production-walkthrough"
original_platform: "hashnode"
canonical_url: "https://edwinjonathand-devops.hashnode.dev/securing-aws-deployments-with-github-actions-oidc-a-production-walkthrough"
---

### The Problem Nobody Talks About Enough

Every tutorial shows you how to deploy to AWS from GitHub Actions using \`AWS\_ACCESS\_KEY\_ID\` and \`AWS\_SECRET\_ACCESS\_KEY\` stored as repository secrets.

That is a liability. Static keys don't expire. If your repo is compromised, your AWS account goes with it. If a team member leaves and you forget to rotate, the key still works. At scale, this becomes a ticking clock.

The production answer is OIDC — and most engineers using it don't fully understand how the trust chain works. This article fixes that.

\---

### What OIDC Actually Does

OIDC (OpenID Connect) replaces static keys with short-lived tokens issued per workflow run.

### The trust chain works like this

1\. GitHub acts as an \*\*Identity Provider (IdP)\*\* — it issues a signed JWT token for each workflow run

2\. AWS trusts GitHub's IdP — you configure this once

3\. Your workflow assumes an IAM role — AWS verifies the JWT against GitHub's public keys and issues temporary credentials

4\. Credentials expire when the job ends — no rotation needed, no long-lived secrets

No secrets stored anywhere. No rotation schedule. No exposure surface after the job completes.

\---

### AWS Side Setup

***Step 1 — Create the OIDC Identity Provider***

\`\`\`bash

aws iam create-open-id-connect-provider \\

\--url <https://token.actions.githubusercontent.com> \\

\--client-id-list sts.amazonaws.com \\

\--thumbprint-list 6938fd4d98bab03faadb97b34396831e3780aea1

This tells AWS: "Trust tokens issued by GitHub Actions."

***Step 2 — Create the IAM Role with a Trust Policy***

{

"Version": "2012-10-17",

"Statement": \[

{

"Effect": "Allow",

"Principal": {

"Federated": "arn:aws:iam::500888951988:oidc-provider/token.actions.githubusercontent.com"

},

"Action": "sts:AssumeRoleWithWebIdentity",

"Condition": {

"StringEquals": {

"token.actions.githubusercontent.com:aud": "sts.amazonaws.com"

},

"StringLike": {

"token.actions.githubusercontent.com:sub": "repo:EdwinJdevops/damolak-challenge:\*"

}

}

}

\]

}

The sub condition is critical — it restricts which repo can assume this role. Without it, any GitHub Actions workflow can assume your role.

aws iam create-role \\

\--role-name GitHubActionsDeployRole \\

\--assume-role-policy-document file://trust-policy.json

***Step 3 — Attach Permissions***

Attach only what the workflow needs. For ECR and ECS (what I used in my Damolak Technologies challenge):

aws iam attach-role-policy \\

\--role-name GitHubActionsDeployRole \\

\--policy-arn arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryFullAccess

aws iam attach-role-policy \\

\--role-name GitHubActionsDeployRole \\

\--policy-arn arn:aws:iam::aws:policy/AmazonECS\_FullAccess

Principle of least privilege applies — scope this tighter in production.

### GitHub Actions Side Setup

### The Workflow

name: Deploy to AWS

on:

push:

branches: \[main\]

permissions:

id-token: write # Required — this is what lets GitHub issue the OIDC token

contents: read

jobs:

deploy:

runs-on: ubuntu-latest

steps:

\- name: Checkout

uses: actions/checkout@v4

\- name: Configure AWS Credentials via OIDC

uses: aws-actions/configure-aws-credentials@v4

with:

role-to-assume: arn:aws:iam::500888951988:role/GitHubActionsDeployRole

aws-region: us-east-1

\- name: Login to ECR

id: login-ecr

uses: aws-actions/amazon-ecr-login@v2

\- name: Build and Push Image

env:

REGISTRY: ${{ steps.login-ecr.outputs.registry }}

REPOSITORY: your-ecr-repo

IMAGE\_TAG: ${{ github.sha }}

run: |

docker build -t $REGISTRY/$REPOSITORY:$IMAGE\_TAG .

docker push $REGISTRY/$REPOSITORY:$IMAGE\_TAG

\- name: Deploy to ECS Fargate

run: |

aws ecs update-service \\

\--cluster your-cluster \\

\--service your-service \\

\--force-new-deployment

Key thing to notice: Zero secrets in this workflow. No AWS\_ACCESS\_KEY\_ID. No AWS\_SECRET\_ACCESS\_KEY. Nothing stored in repository secrets.

The id-token: write permission is what unlocks this — without it, GitHub won't issue the OIDC token and the entire flow breaks.

## **Proof It Works in Production**

I built this exact pipeline for the Damolak Technologies DevOps Engineer challenge — a full CI/CD pipeline pushing Docker images to ECR and deploying to ECS Fargate with an ALB in front.

The pipeline runs on every push to main. AWS credentials are assumed fresh each run, scoped to exactly the permissions needed, and expire the moment the job completes.

No static keys. No rotation. No exposure surface.

Repository: github.com/EdwinJdevops/damolak-challenge

## **Why This Is Non-Negotiable in Production**

Static AWS keys in CI/CD pipelines are one of the most common attack vectors in cloud breaches. OIDC eliminates the entire class of risk:

No secrets to rotate — tokens are ephemeral by design

No blast radius on leak — a leaked token is already expired

Auditable — every credential issuance is logged in CloudTrail with the exact repo and workflow that triggered it

IAM Conditions — you can lock down to specific branches, specific environments, or specific workflow file paths

If you're still using static keys in your GitHub Actions pipelines, rotate them and implement OIDC today.

## **What's Next**

OIDC is just the authentication layer. The next level is pairing this with:

Environment protection rules — require manual approval before production deploys

Reusable workflows — centralize your OIDC configuration across multiple repos

Separate roles per environment — dev, staging, and prod each get their own IAM role with separate permission boundaries

I'm currently building SENTINEL — an automated Kubernetes security posture engine — where this OIDC pattern gates every deployment through a security scan pipeline before anything hits the cluster. More on that soon.

### Edwin Jonathan — Cloud/DevOps Engineer | ALX Cloud DevOps Programme

GitHub · LinkedIn
