---
title: "How I Secured an ECS Fargate Deployment With OIDC and ECR — No Static Keys"
date: "2026-05-16"
description: "Most AWS CI/CD tutorials hand you a `AWSACCESSKEYID` and `AWSSECRETACCESSKEY` and call it a day. That's a security failure waiting to happen. Static keys get leaked in…"
draft: false
original_url: "https://edwinjonathand-devops.hashnode.dev/how-i-secured-an-ecs-fargate-deployment-with-oidc-and-ecr-no-static-keys"
original_platform: "hashnode"
canonical_url: "https://edwinjonathand-devops.hashnode.dev/how-i-secured-an-ecs-fargate-deployment-with-oidc-and-ecr-no-static-keys"
---

**Introduction**

Most AWS CI/CD tutorials hand you a `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY` and call it a day. That's a security failure waiting to happen. Static keys get leaked in logs, committed to repos, and rotated too late.

I built a full deployment pipeline for a real DevOps challenge — GitHub Actions → ECR → ECS Fargate — with zero static credentials. Here's exactly how.

* * *

**The Problem With Static Keys**

When you store AWS credentials as GitHub secrets and reference them in your pipeline, you're creating long-lived credentials that:

*   Never expire unless you manually rotate them
    
*   Have blast radius if leaked
    
*   Violate AWS security best practices
    
*   Will fail a real security audit
    

OIDC federation eliminates this entirely.

**How OIDC Federation Works**

GitHub Actions requests a short-lived token from GitHub's OIDC provider. AWS is configured to trust that provider. When the pipeline runs, AWS exchanges the GitHub token for a temporary STS credential scoped to an IAM role — valid for the duration of the job only.

No secret stored. No rotation needed. No leak vector.

* * *

**Step 1 — Configure the OIDC Provider in AWS**

bash

```bash
aws iam create-open-id-connect-provider \
  --url https://token.actions.githubusercontent.com \
  --client-id-list sts.amazonaws.com \
  --thumbprint-list 6938fd4d98bab03faadb97b34396831e3780aea1
```

* * *

**Step 2 — Create the IAM Role**

Trust policy (`trust-policy.json`):

{ "Version": "2012-10-17", "Statement": \[ { "Effect": "Allow", "Principal": { "Federated": "arn:aws:iam::YOUR\_ACCOUNT\_ID:oidc-provider/token.actions.githubusercontent.com" }, "Action": "sts:AssumeRoleWithWebIdentity", "Condition": { "StringLike": { "token.actions.githubusercontent.com:sub": "repo:YOUR\_GITHUB\_ORG/YOUR\_REPO:\*" } } } \] }

bashaws iam create-role  
\--role-name github-actions-ecr-ecs  
\--assume-role-policy-document file://trust-policy.json Attach permissions: bashaws iam attach-role-policy  
\--role-name github-actions-ecr-ecs  
\--policy-arn arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryPowerUser

aws iam attach-role-policy  
\--role-name github-actions-ecr-ecs  
\--policy-arn arn:aws:iam::aws:policy/AmazonECS\_FullAccess

Step 3 — GitHub Actions Pipeline yamlname: Deploy to ECS Fargate

on: push: branches: \[main\]

permissions: id-token: write contents: read

jobs: deploy: runs-on: ubuntu-latest steps: - uses: actions/checkout@v4

```plaintext
  - name: Configure AWS credentials via OIDC
    uses: aws-actions/configure-aws-credentials@v4
    with:
      role-to-assume: arn:aws:iam::YOUR_ACCOUNT_ID:role/github-actions-ecr-ecs
      aws-region: us-east-1

  - name: Login to ECR
    id: login-ecr
    uses: aws-actions/amazon-ecr-login@v2

  - name: Build and push image
    env:
      ECR_REGISTRY: ${{ steps.login-ecr.outputs.registry }}
      IMAGE_TAG: ${{ github.sha }}
    run: |
      docker build -t $ECR_REGISTRY/myapp:$IMAGE_TAG .
      docker push $ECR_REGISTRY/myapp:$IMAGE_TAG

  - name: Deploy to ECS
    run: |
      aws ecs update-service \
        --cluster my-cluster \
        --service my-service \
        --force-new-deployment
```

Key security wins:

Credentials live for job duration only — minutes, not months No secret stored in GitHub at all Repo-scoped: the role can only be assumed by your specific repository Full audit trail in CloudTrail

Live repo: github.com/EdwinJdevops/damolak-challenge

*I'm Edwin Jonathan — a 17-year-old self-taught DevOps Engineer building from Lagos, Nigeria. No degree, no shortcuts — just real infrastructure, real pipelines, and real results.*

*Follow the journey:* *🔗 GitHub: github.com/EdwinJdevops* *✍️ Hashnode:* [*edwinjonathand-devops.hashnode.dev*](http://edwinjonathand-devops.hashnode.dev) *💼 Open to remote DevOps/Cloud roles globally*
