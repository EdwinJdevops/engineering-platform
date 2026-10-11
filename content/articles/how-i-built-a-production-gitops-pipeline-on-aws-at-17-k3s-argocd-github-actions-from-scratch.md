---
title: "How I Built a Production GitOps Pipeline on AWS at 17 — K3s + ArgoCD + GitHub Actions from Scratch"
date: "2026-04-27"
description: "A first-person AWS GitOps pipeline walkthrough covering k3s, ArgoCD, GitHub Actions, and delivery architecture."
draft: false
original_url: "https://edwinjonathand-devops.hashnode.dev/how-i-built-a-production-gitops-pipeline-on-aws-at-17-k3s-argocd-github-actions-from-scratch"
original_platform: "hashnode"
canonical_url: "https://edwinjonathand-devops.hashnode.dev/how-i-built-a-production-gitops-pipeline-on-aws-at-17-k3s-argocd-github-actions-from-scratch"
---

\---

## The Problem With "Learning" DevOps

Most people learning DevOps are watching tutorials, copying commands they don't understand, and calling it experience.

I decided to build instead.

This is the exact breakdown of how I built \*\*DevShelf\*\* — a real Internal Developer Platform running on AWS with a full GitOps CI/CD pipeline. No shortcuts. No cloud sandboxes. Real infrastructure, real AWS costs, real engineering decisions.

\---

## What is GitOps and Why It Matters

GitOps is a deployment model where your Git repository is the single source of truth for infrastructure state. You don't manually deploy. You push code, and the system reconciles itself to match what's in Git.

\*\*The result:\*\* No one SSH-ing into servers to deploy. No manual kubectl apply. No human error in deployments. Every change is auditable, reversible, and automated.

This is how platform teams at Shopify, Zalando, and Weaveworks operate. I wanted to build it myself to understand it from the ground up.

\---

## The Architecture

\`\`\`

Developer pushes code to GitHub

↓

GitHub Actions triggers CI pipeline

↓

Docker image built + pushed to AWS ECR

↓

k8s/deployment.yaml updated with new image tag

↓

ArgoCD detects Git change

↓

ArgoCD syncs Kubernetes cluster automatically

↓

New version live — zero manual steps

\`\`\`

\*\*Stack:\*\*

\- \*\*AWS EC2\*\* (t3.small) — the compute layer

\- \*\*K3s\*\* — lightweight Kubernetes (single binary, perfect for a single node)

\- \*\*ArgoCD\*\* — GitOps engine that watches GitHub and syncs the cluster

\- \*\*GitHub Actions\*\* — CI pipeline that builds and pushes Docker images

\- \*\*AWS ECR\*\* — private container registry

\- \*\*Python Flask\*\* — the application being deployed

\---

## Step 1 — Provisioning the EC2 Instance

I used the AWS CLI directly. No console clicking. Infrastructure as code mindset from the start.

\`\`\`bash

aws ec2 run-instances \\

\--image-id resolve:ssm:/aws/service/ami-amazon-linux-latest/al2023-ami-kernel-default-x86\_64 \\

\--instance-type t3.small \\

\--key-name bishop \\

\--region eu-north-1 \\

\--tag-specifications 'ResourceType=instance,Tags=\[{Key=Name,Value=devshelf-gitops}\]' \\

\--query 'Instances\[0\].InstanceId' \\

\--output text

\`\`\`

\*\*Why t3.small?\*\* K3s requires minimum 1GB RAM. ArgoCD needs headroom on top. t2.micro fails under this load. t3.small at ~$0.02/hr is the minimum viable production node.

\*\*Why eu-north-1?\*\* Lowest latency from my location. Always pick the region closest to your users or yourself during development.

\---

## Step 2 — Installing K3s

K3s is Kubernetes stripped to its core — no bloat, single binary, installs in under 60 seconds.

\`\`\`bash

curl -sfL <https://get.k3s.io> | sh -

sudo kubectl get nodes

\`\`\`

Output:

\`\`\`

NAME STATUS ROLES AGE VERSION

ip-172-31-0-5.eu-north-1.compute Ready control-plane 9s v1.34.6+k3s1

\`\`\`

Node is Ready. Kubernetes cluster is live on a single EC2 instance. That's the entire control plane and worker node in one machine — exactly how platform teams prototype before scaling.

\---

## Step 3 — Deploying ArgoCD

ArgoCD is the GitOps engine. It continuously watches a Git repository and ensures the cluster state matches what's defined in Git.

\`\`\`bash

sudo kubectl create namespace argocd

sudo kubectl apply -n argocd \\

\-f <https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml>

## Expose the UI

sudo kubectl patch svc argocd-server \\

\-n argocd \\

\-p '{"spec": {"type": "NodePort"}}'

## Get the admin password

sudo kubectl -n argocd get secret argocd-initial-admin-secret \\

\-o jsonpath="{.data.password}" | base64 -d

\`\`\`

ArgoCD UI is now accessible at your EC2 public IP on the NodePort. Open port 30488 in your security group and hit it in the browser.

\*\*\[Screenshot: ArgoCD UI — add yours here\]\*\*

\---

## Step 4 — The Application

I replaced the default nginx placeholder with a real Python Flask API. Simple, but it proves the pipeline works end to end.

\`\`\`python

## app/main.py

from flask import Flask

app = Flask(\_\_name\_\_)

@app.route("/")

def home():

return {"status": "DevShelf GitOps Engine - Live", "version": "1.0.0"}

@app.route("/health")

def health():

return {"health": "ok"}

if \_\_name\_\_ == "\_\_main\_\_":

app.run(host="0.0.0.0", port=5000)

\`\`\`

\`\`\`dockerfile

## Dockerfile

FROM python:3.11-slim

WORKDIR /app

COPY app/requirements.txt .

RUN pip install -r requirements.txt

COPY app/ .

EXPOSE 5000

CMD \["python", "main.py"\]

\`\`\`

\---

## Step 5 — Kubernetes Manifests

ArgoCD needs Kubernetes YAML to deploy. These live in the \`k8s/\` folder in the repo — ArgoCD watches this folder.

\`\`\`yaml

## k8s/deployment.yaml

apiVersion: apps/v1

kind: Deployment

metadata:

name: devshelf-app

namespace: default

spec:

replicas: 1

selector:

matchLabels:

app: devshelf

template:

metadata:

labels:

app: devshelf

spec:

containers:

\- name: devshelf

image: nginx:latest # GitHub Actions will replace this automatically

ports:

\- containerPort: 5000

\---

apiVersion: v1

kind: Service

metadata:

name: devshelf-service

namespace: default

spec:

selector:

app: devshelf

ports:

\- port: 80

targetPort: 5000

type: ClusterIP

\`\`\`

\---

## Step 6 — Connecting ArgoCD to GitHub

This is where the GitOps loop closes. I created an ArgoCD Application resource that points to my GitHub repo.

\`\`\`bash

sudo kubectl apply -f - << 'EOF'

apiVersion: argoproj.io/v1alpha1

kind: Application

metadata:

name: devshelf

namespace: argocd

spec:

project: default

source:

repoURL: <https://github.com/EdwinJdevops/devshelf.git>

targetRevision: main

path: k8s

destination:

server: <https://kubernetes.default.svc>

namespace: default

syncPolicy:

automated:

prune: true

selfHeal: true

EOF

\`\`\`

\`selfHeal: true\` means if anyone manually changes something in the cluster that doesn't match Git, ArgoCD reverts it automatically. Git is always truth.

\*\*\[Screenshot: ArgoCD showing Healthy + Synced — add yours here\]\*\*

\---

## Step 7 — GitHub Actions CI Pipeline

This is the automation that closes the full loop. On every push to main:

1\. Build Docker image

2\. Push to AWS ECR

3\. Update the image tag in \`k8s/deployment.yaml\`

4\. Push the change back to GitHub

5\. ArgoCD detects the Git change and deploys

\`\`\`yaml

## .github/workflows/ci.yaml

name: Build and Push to ECR

on:

push:

branches: \[main\]

permissions:

contents: write

jobs:

build:

runs-on: ubuntu-latest

steps:

\- name: Checkout code

uses: actions/checkout@v4

with:

token: ${{ secrets.GITHUB\_TOKEN }}

\- name: Configure AWS credentials

uses: aws-actions/configure-aws-credentials@v4

with:

aws-access-key-id: ${{ secrets.AWS\_ACCESS\_KEY\_ID }}

aws-secret-access-key: ${{ secrets.AWS\_SECRET\_ACCESS\_KEY }}

aws-region: eu-north-1

\- name: Login to ECR

uses: aws-actions/amazon-ecr-login@v2

\- name: Build, tag, push image

env:

ECR\_REGISTRY: 500888951988.dkr.ecr.eu-north-1.amazonaws.com

ECR\_REPOSITORY: devshelf-app

IMAGE\_TAG: ${{ github.sha }}

run: |

docker build -t $ECR\_REGISTRY/$ECR\_REPOSITORY:$IMAGE\_TAG .

docker push $ECR\_REGISTRY/$ECR\_REPOSITORY:$IMAGE\_TAG

\- name: Update k8s deployment image

env:

ECR\_REGISTRY: 500888951988.dkr.ecr.eu-north-1.amazonaws.com

ECR\_REPOSITORY: devshelf-app

IMAGE\_TAG: ${{ github.sha }}

run: |

sed -i "s|image:.\*|image: $ECR\_REGISTRY/$ECR\_REPOSITORY:$IMAGE\_TAG|g" k8s/deployment.yaml

git config user.name "github-actions"

git config user.email "<actions@github.com>"

git add k8s/deployment.yaml

git commit -m "ci: update image to $IMAGE\_TAG"

git push

\`\`\`

\*\*\[Screenshot: GitHub Actions green checkmark — add yours here\]\*\*

\---

## What Broke and How I Fixed It

Real engineering means debugging. Here's what went wrong:

\*\*Problem 1:\*\* AWS CLI installed but \`aws configure\` accepted wrong values — I typed "thebishop" as the Access Key ID instead of the actual AKIA key.

\*\*Fix:\*\* Went to IAM → Security credentials → created a new access key, copied it correctly.

\*\*Problem 2:\*\* GitHub Actions failed with \`Could not load credentials from any provider\`.

\*\*Fix:\*\* AWS secrets weren't saved in GitHub. Went to repo Settings → Secrets → Repository secrets and added both \`AWS\_ACCESS\_KEY\_ID\` and \`AWS\_SECRET\_ACCESS\_KEY\` correctly.

\*\*Problem 3:\*\* CI failed with \`exit code 128\` — git push permission denied.

\*\*Fix:\*\* Added \`permissions: contents: write\` to the workflow YAML. GitHub Actions needs explicit write permission to push back to the repo.

\---

## The Result

Push code → pipeline runs → Kubernetes updates itself. No human in the loop.

\`\`\`

sudo kubectl get application -n argocd

NAME SYNC STATUS HEALTH STATUS

devshelf Synced Healthy

\`\`\`

\*\*\[Screenshot: Final ArgoCD green status — add yours here\]\*\*

\---

## What I Learned

1\. \*\*GitOps is a mindset, not just a tool.\*\* The moment you stop thinking "I need to deploy this" and start thinking "I need to push this to Git," everything changes.

2\. \*\*K3s is underrated.\*\* For learning, prototyping, and small production workloads, K3s is cleaner than a full kubeadm cluster. Single binary. Works.

3\. \*\*IAM permissions will always bite you.\*\* Every AWS error traces back to credentials or permissions. Learn IAM deeply — it's the security backbone of everything.

4\. \*\*Debugging is the job.\*\* Three separate failures before the pipeline went green. Each one taught me something a tutorial never would.

\---

## What's Next for DevShelf

\- Prometheus + Grafana for observability

\- Terraform to provision infrastructure as code

\- Multi-environment setup (dev/staging/prod)

\- Slack notifications on deploy events

\---

## Connect With Me

I'm building DevShelf in public — a real Internal Developer Platform from Lagos, Nigeria.

\- \*\*GitHub:\*\* \[github.com/EdwinJdevops\](<https://github.com/EdwinJdevops>)

\- \*\*LinkedIn:\*\* \[linkedin.co

m/in/edwin-jonathan-1094093b0\](<https://www.linkedin.com/in/edwin-jonathan-1094093b0>)

\- \*\*X:\*\* \[@TheCloudDeveng\](<https://x.com/TheCloudDeveng>)

If you're building in DevOps or Cloud, let's connect. The infrastructure doesn't care where you're from.

\---

\*Tags: #DevOps #GitOps #Kubernetes #AWS #ArgoCD #GitHubActions #K3s #CloudEngineering #DevShelf\*
