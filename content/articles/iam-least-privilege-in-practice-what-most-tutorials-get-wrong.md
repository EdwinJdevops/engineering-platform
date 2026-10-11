---
title: "IAM Least Privilege in Practice — What Most Tutorials Get Wrong"
date: "2026-05-17"
description: "Practical AWS IAM least-privilege analysis covering scoped permissions, role delegation, and Access Analyzer."
draft: false
original_url: "https://edwinjonathand-devops.hashnode.dev/iam-least-privilege-in-practice-what-most-tutorials-get-wrong"
original_platform: "hashnode"
canonical_url: "https://edwinjonathand-devops.hashnode.dev/iam-least-privilege-in-practice-what-most-tutorials-get-wrong"
---

### Introduction

Every AWS tutorial tells you to use least privilege. Almost none of them show you what it actually looks like. Most examples online attach `AdministratorAccess` to a role "for simplicity" and move on.

That's not simplicity. That's a breach waiting to happen. Here's what real IAM discipline looks like.

* * *

### The Most Common Mistakes

### Mistake 1 — Wildcard actions on wildcard resources

```json
{
  "Effect": "Allow",
  "Action": "*",
  "Resource": "*"
}
```

This is AdministratorAccess. Never use it outside break-glass emergency scenarios.

### Mistake 2 — Service-level wildcards

```json
{
  "Effect": "Allow",
  "Action": "s3:*",
  "Resource": "*"
}
```

You wanted read access. You gave delete, ACL modification, and bucket policy write access too.

### Mistake 3 — Not scoping resources

```json
{
  "Effect": "Allow",
  "Action": "s3:GetObject",
  "Resource": "*"
}
```

This allows reading every S3 bucket in your account. Scope it to the specific bucket.

* * *

### What Least Privilege Actually Looks Like

### Correct — S3 read for one specific bucket

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:ListBucket"
      ],
      "Resource": [
        "arn:aws:s3:::my-specific-bucket",
        "arn:aws:s3:::my-specific-bucket/*"
      ]
    }
  ]
}
```

### Correct — ECS deploy role, nothing more

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "ecs:UpdateService",
        "ecs:DescribeServices",
        "ecs:DescribeTaskDefinition",
        "ecs:RegisterTaskDefinition"
      ],
      "Resource": "arn:aws:ecs:us-east-1:ACCOUNT_ID:service/my-cluster/my-service"
    },
    {
      "Effect": "Allow",
      "Action": "iam:PassRole",
      "Resource": "arn:aws:iam::ACCOUNT_ID:role/ecsTaskExecutionRole"
    }
  ]
}
```

* * *

### The Framework I Use

1. **Start with zero permissions.** Add only what breaks.

2. **Scope every Resource ARN** — never use `*` unless the API requires it.

3. **Separate roles per workload** — CI/CD role, application role, and admin role are three different things.

4. **Use IAM Access Analyzer** to detect overly permissive policies before they hit production.

5. **Set permission boundaries** on roles created programmatically.

* * *

### IAM Access Analyzer — run this

```bash
aws accessanalyzer create-analyzer \
  --analyzer-name production-analyzer \
  --type ACCOUNT
```

It will flag any resources accessible from outside your account within minutes.

* * *

### One Rule That Changes Everything

Before attaching any policy, ask: *what is the minimum set of actions on the minimum set of resources this identity needs to complete its job?*

If you can't answer that in one sentence, the role is too broad.

*I'm Edwin Jonathan — a 17-year-old self-taught DevOps Engineer building from Lagos, Nigeria. No degree, no shortcuts — just real infrastructure, real pipelines, and real results.*

*Follow the journey:* *🔗 GitHub: github.com/EdwinJdevops* *✍️ Hashnode:* [*edwinjonathand-devops.hashnode.dev*](http://edwinjonathand-devops.hashnode.dev) *💼 Open to remote DevOps/Cloud roles globally*
