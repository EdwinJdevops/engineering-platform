---
title: "Why Most GitOps Migrations Fail After Six Months"
date: "2026-07-21"
description: "Why GitOps adoption can degrade over time: drift, platform ownership, policy enforcement, observability, and recovery."
draft: false
original_url: "https://edwinjonathand-devops.hashnode.dev/why-most-gitops-migrations-fail-after-six-months"
original_platform: "hashnode"
canonical_url: "https://edwinjonathand-devops.hashnode.dev/why-most-gitops-migrations-fail-after-six-months"
---

## The Problem

Before discussing why GitOps projects fail, it's useful to understand the production architecture this article refers to.

![Illustration accompanying The Problem](https://cdn.hashnode.com/uploads/covers/69eb5d4d1e45c4e0dadd0fc8/c043b545-d3b2-4a89-8f52-34ec81fa6b4d.png)

Everyone talks about GitOps as if installing ArgoCD is the finish line.

It isn't.

Most GitOps migrations succeed during the first few weeks. Deployments become automated, clusters synchronize from Git, and teams celebrate moving away from manual releases.

Then production happens.

New services appear. Different teams adopt different deployment patterns. Security requirements grow. Kubernetes versions change. Infrastructure evolves. Suddenly the Git repository that once looked clean becomes difficult to manage, deployments become slower, and engineers begin bypassing the GitOps workflow "just this once."

The failure was never GitOps itself.

The failure was assuming GitOps is a deployment tool instead of an operating model.

That distinction matters.

A production platform is far more than Kubernetes and ArgoCD. Every deployment depends on networking, identity, container registries, infrastructure provisioning, policy enforcement, monitoring, logging, and incident response. GitOps sits in the middle of those systems. It does not replace them.

This is why many organizations discover that adopting GitOps is relatively easy. Operating GitOps over months and years is much harder.

The engineering challenge shifts from deploying applications to managing change across an entire platform.

The questions become different.

* Who approves production changes?

* How are secrets managed?

* How do multiple teams share one cluster safely?

* How do we detect configuration drift?

* What happens when synchronization fails?

* How do we roll back without introducing new failures?

* How do platform teams know a deployment is healthy before users do?

Those questions cannot be answered by ArgoCD alone.

They require architecture.

* * *

## GitOps Is Part of a Bigger System

![Illustration accompanying GitOps Is Part of a Bigger System](https://cdn.hashnode.com/uploads/covers/69eb5d4d1e45c4e0dadd0fc8/abddf18f-2adc-4c47-ba88-e41e1c9517a2.png)

Looking at the architecture makes one thing clear.

GitOps controls deployment.

It does not provision cloud infrastructure.

It does not monitor production.

It does not manage authentication.

It does not replace observability.

It does not investigate incidents.

Those responsibilities remain part of the platform.

That is why successful GitOps implementations are usually owned by platform engineering teams rather than individual application teams.

As a 17-year-old learning platform engineering, this has changed how I think about GitOps. I no longer see it as "deploying from Git." I see it as one layer in a much larger production system where reliability depends on how every layer works together.

The most successful platform teams are not the ones with the most automation.

They are the ones whose automation continues to work a year after the migration.

## **Why Most GitOps Migrations Fail After Six Months**

GitOps does not usually fail because of Kubernetes.

It fails because organizations underestimate everything around Kubernetes.

The first deployment is often the easiest part of the journey. A repository is created, ArgoCD connects to the cluster, manifests synchronize correctly, and the dashboard turns green.

From the outside, the migration looks complete.

Production tells a different story.

A few months later, application teams begin requesting exceptions to the deployment process. Infrastructure changes happen outside Terraform because they are "urgent." Secrets are updated manually. Different teams adopt different repository structures. Cluster policies become inconsistent. No one is certain which Git repository represents the actual production state.

The platform slowly drifts away from the source of truth.

That is where GitOps begins to lose its value.

The problem was never the tooling.

The problem was the operating model.

### **The Five Failure Patterns**

1. **Git Stops Being the Source of Truth**

The biggest promise of GitOps is simple.

Production should always match Git.

In practice, emergency fixes often happen directly inside the cluster.

Someone patches a Deployment.

Someone changes an Ingress.

Someone updates a Secret.

Everything works again, but Git no longer reflects reality.

Weeks later, ArgoCD synchronizes the original manifests and unintentionally removes those manual changes.

The incident was caused weeks earlier, not during synchronization.

2\. **Teams Create Different Standards**

One team stores manifests with Helm.

Another prefers Kustomize.

A third team creates custom deployment scripts.

Nothing is technically broken.

Everything is operationally inconsistent.

As the number of services grows, platform engineers spend more time understanding deployment patterns than improving the platform itself.

Consistency becomes more valuable than flexibility.

3\. **Infrastructure and Applications Evolve Separately**

Terraform provisions infrastructure.

GitOps deploys workloads.

These systems are closely connected.

Yet many organizations manage them independently.

An application may require a new IAM permission, storage class, subnet, or load balancer configuration.

If infrastructure changes lag behind application deployments, synchronization succeeds while workloads fail.

The deployment pipeline reports success.

Production reports failure.

4\. **Observability Arrives Too Late**

Many teams only invest in monitoring after an incident.

GitOps can deploy applications reliably.

It cannot explain why latency suddenly doubled.

It cannot tell you why memory usage continues increasing.

It cannot detect slow database queries.

Without metrics, logs, traces, and alerts, engineers spend hours searching for problems that should have been visible within minutes.

5\. **Platform Ownership Is Undefined**

Perhaps the biggest reason GitOps initiatives fail is ownership.

Who owns Kubernetes?

Who owns Terraform?

Who owns cluster security?

Who maintains deployment templates?

Who upgrades ArgoCD?

Who defines platform standards?

If every team owns everything, nobody owns the platform.

Successful organizations solve this by establishing dedicated platform engineering teams responsible for the developer platform rather than individual applications.

![Illustration accompanying The Five Failure Patterns](https://cdn.hashnode.com/uploads/covers/69eb5d4d1e45c4e0dadd0fc8/b1a50796-cf81-4a5a-978d-c01daeb67486.png)

![Illustration accompanying The Five Failure Patterns](https://cdn.hashnode.com/uploads/covers/69eb5d4d1e45c4e0dadd0fc8/af762728-0435-4958-b910-65ed4e7d15ed.png)

## The Pattern Behind Successful Platform Teams

The strongest platform teams rarely talk about GitOps as a product.

They treat it as one capability inside a larger production platform.

Their priorities look different.

* Standardized repository structures

* Automated policy validation before deployment

* Infrastructure managed through Terraform

* Secrets managed centrally

* Consistent deployment templates

* Built-in observability

* Automated rollback strategies

* Continuous compliance checks

* Clear platform ownership

Notice what is missing.

There is no focus on dashboards or screenshots of successful deployments.

The emphasis is on reducing operational risk over time.

That is what separates a successful GitOps migration from a successful GitOps platform.

As I continue building cloud and platform systems, one lesson has become clear.

The goal is not to automate deployments.

The goal is to make production changes predictable, repeatable, and recoverable months after the migration, when the platform has grown far beyond its original design.

* * *

## What Production Platform Teams Actually Build

One misconception about GitOps is that platform teams spend most of their time deploying applications.

They don't.

Most of their work happens before a deployment ever reaches production.

The deployment itself is only one step in a much larger system.

A mature platform exists to make deployments predictable.

That means standardizing everything around the application, not just the application itself.

The best platform teams build guardrails instead of relying on engineers to remember every operational detail.

A developer should not have to think about logging, secrets, ingress configuration, monitoring, deployment strategies, or policy validation every time they create a new service.

Those should already exist as part of the platform.

The platform becomes a product.

The engineers become its customers.

* * *

## The Platform Layer

A production platform is a collection of capabilities that work together

![Illustration accompanying The Platform Layer](https://cdn.hashnode.com/uploads/covers/69eb5d4d1e45c4e0dadd0fc8/014fb4a2-bd59-412b-96ab-58ad3e4414c1.png)

Notice something.

Applications are only one component.

Most of the architecture exists to support the applications.

That is why experienced platform engineers spend far more time improving infrastructure than writing deployment manifests.

* * *

## The Golden Path

One pattern that appears repeatedly across mature engineering organizations is the concept of a **Golden Path**.

Instead of every team inventing its own deployment process, the platform provides a standard workflow.

A developer creates a repository.

Everything else already exists.

* CI pipeline

* Deployment workflow

* Container build

* Security scanning

* Secret management

* Monitoring

* Logging

* Metrics

* Alerting

* Rollback strategy

* Policy validation

The application becomes the only thing the developer owns.

Everything else is inherited from the platform.

That dramatically reduces operational complexity.

* * *

## Deployment Is Only One Capability

Many engineers measure platform maturity by asking:

> "How quickly can we deploy?"

A better question is:

> "How quickly can we recover?"

Fast deployments are valuable.

Reliable recovery is essential.

A mature platform plans for failure before failure happens.

![Illustration accompanying Deployment Is Only One Capability](https://cdn.hashnode.com/uploads/covers/69eb5d4d1e45c4e0dadd0fc8/d67399a1-9e20-4024-bd2b-572cbfbc07bd.png)

Recovery is not something added after deployment.

It is part of the deployment.

* * *

## The Platform Team's Responsibility

Platform engineers are often described as the people who "manage Kubernetes."

That description is far too narrow.

Their responsibility is reducing cognitive load for every engineering team.

If deploying a service requires fifteen manual decisions, the platform has failed.

If a new engineer can deploy safely without reading fifty pages of documentation, the platform is doing its job.

Good platforms make the correct path the easiest path.

Not because developers lack experience.

Because consistency scales better than individual expertise.

* * *

## What Changed My Perspective

The more I study production platforms, the less I think GitOps is the interesting part.

GitOps is the delivery mechanism.

The real engineering happens in the standards surrounding it.

Repository structure.

Identity.

Policy.

Observability.

Security.

Networking.

Recovery.

Those are the systems that determine whether a platform remains maintainable two years after migration.

GitOps simply connects them.

That's why I believe platform engineering is becoming one of the most important disciplines in cloud infrastructure.

Not because it introduces new tools.

Because it makes existing tools work together as one reliable system.

## Observability Is What Keeps GitOps Honest

GitOps tells you what should be running.

Observability tells you what is actually happening.

Those are two different questions.

A deployment can succeed.

Pods can be healthy.

ArgoCD can report **Synced**.

Meanwhile, users are experiencing higher latency, failed requests, memory pressure, or intermittent timeouts.

GitOps has done its job.

The platform has not.

That is why observability should never be treated as something added after deployment.

It should be part of the platform from the beginning.

* * *

## A Healthy Deployment Doesn't Mean a Healthy Service

Imagine this deployment.

![Illustration accompanying A Healthy Deployment Doesn't Mean a Healthy Service](https://cdn.hashnode.com/uploads/covers/69eb5d4d1e45c4e0dadd0fc8/ee569261-d74e-4af1-87fa-1f755684a0e8.png)

Now every service follows the same logging standard.

Instead of SSH'ing into nodes, engineers search structured logs from one dashboard.

* * *

## Traces Tell You Where Time Was Lost

Modern applications rarely consist of one service.

A single request may travel through:

* API Gateway

* Authentication

* Backend Service

* Message Queue

* Payment Service

* Database

* External Provider

Without distributed tracing, engineers only know the request is slow.

With tracing, they know exactly where it became slow.

A trace immediately shows whether the delay came from authentication, the database, or an external dependency.

* * *

## Dashboards Don't Solve Incidents

One lesson keeps appearing across mature engineering teams.

They don't build dashboards because dashboards look impressive.

They build dashboards that answer operational questions.

A useful dashboard answers things like:

| Question | Signal |
| --- | --- |
| Is the service healthy? | Error rate |
| Is performance degrading? | Latency |
| Can the platform scale? | CPU and Memory |
| Are deployments causing failures? | Deployment timeline |
| Which dependency is failing? | Distributed traces |
| Should engineers wake up? | Alert thresholds |

Everything else is noise.

* * *

## GitOps and Observability Work Together

One manages change.

The other validates change.

Neither replaces the other.

![Illustration accompanying GitOps and Observability Work Together](https://cdn.hashnode.com/uploads/covers/69eb5d4d1e45c4e0dadd0fc8/8c7652ab-8c5e-4312-870b-73da5644a8a0.png)

This creates a continuous feedback loop.

Deploy.

Observe.

Learn.

Improve.

Repeat.

That is where GitOps becomes more than a deployment strategy.

It becomes part of a platform that continuously validates itself through production signals rather than assumptions.

* * *

## Security and Policy: Why Mature Platforms Don't Trust Successful Deployments

One of the biggest misconceptions in GitOps is that a successful deployment means a secure deployment.

It doesn't.

ArgoCD can synchronize manifests perfectly.

Kubernetes can schedule every Pod.

Every readiness probe can pass.

The platform can still violate security policy.

Production systems should not assume that because something deployed successfully, it should have been deployed.

That's why mature platform teams separate **deployment** from **validation**.

* * *

## A Deployment Is Only the Beginning

A typical GitOps workflow looks like this.

![Illustration accompanying A Deployment Is Only the Beginning](https://cdn.hashnode.com/uploads/covers/69eb5d4d1e45c4e0dadd0fc8/64afc850-33a0-4706-84c8-0873a29efa87.png)

Simple.

Reliable.

Predictable.

Now compare that with what happens in production.

![Illustration accompanying A Deployment Is Only the Beginning](https://cdn.hashnode.com/uploads/covers/69eb5d4d1e45c4e0dadd0fc8/4cc7f4d0-f732-4ae6-b710-e8e1185b05ac.png)

Notice something.

GitOps is only one checkpoint.

Modern platforms validate every stage before production receives new code.

* * *

## Policy Should Be Automatic

Developers shouldn't need to remember every security rule.

The platform should enforce them automatically.

Examples include:

* Containers cannot run as root.

* Images must come from approved registries.

* Every Deployment must define CPU and memory requests.

* Every Service must expose only required ports.

* Every Namespace must have ResourceQuotas.

* Every Ingress must terminate TLS.

* Secrets cannot be committed into Git.

* Every image must pass vulnerability scanning before deployment.

Those aren't developer responsibilities.

They're platform responsibilities.

Consistency beats documentation.

* * *

## Policy as Code

One of the biggest improvements platform engineering introduced was moving policies into version control.

Instead of saying:

> "Developers should remember this."

The platform says:

> "The deployment won't continue until this passes."

Nobody negotiates with the pipeline.

The standards apply equally to every team.

* * *

## Runtime Matters More Than Build Time

Many security discussions stop after container scanning.

Production doesn't.

An image can be perfectly clean and still become a security problem after deployment.

Examples include:

* A privileged container.

* A workload mounting the host filesystem.

* A Pod running with unnecessary Linux capabilities.

* A Service accidentally exposed to the public Internet.

* An IAM role granting excessive permissions.

These aren't build-time problems.

They're runtime problems.

That's why mature platforms continuously validate production instead of only validating CI pipelines.

* * *

## Security Is Another Feedback Loop

Security should behave like observability.

Continuous.

Automatic.

Actionable.

![Illustration accompanying Security Is Another Feedback Loop](https://cdn.hashnode.com/uploads/covers/69eb5d4d1e45c4e0dadd0fc8/04f0a1e5-8efa-481b-b23f-ed14ad3a043d.png)

Every deployment creates another opportunity to improve the platform.

Not because engineers are expected to be perfect.

Because production systems change every day.

* * *

## The Best Platforms Make the Secure Path the Easy Path

When developers bypass security controls, it's often a sign that the platform has become difficult to use.

Good platform engineering reduces that friction.

Developers should be able to ship software without thinking about dozens of operational requirements.

The platform should already provide them.

That includes:

* Secure deployment templates.

* Standardized RBAC.

* Default network policies.

* Automatic certificate management.

* Secret management.

* Image signing.

* Admission policies.

* Runtime enforcement.

Security becomes part of the platform rather than another checklist before release.

* * *

## The Real Goal

The strongest platform teams don't ask:

> "Did the deployment succeed?"

They ask:

> "Should this deployment have reached production in the first place?"

That question changes everything.

It shifts security from reacting to incidents to preventing them.

GitOps automates deployments.

Platform engineering defines the boundaries within which those deployments are allowed to happen.

Those boundaries are what keep production reliable long after the migration is complete.

* * *

## Building a Platform That Lasts Beyond the Migration

Most GitOps projects don't fail because ArgoCD stops synchronizing.

They fail because the platform never evolves after the migration.

The migration becomes the milestone.

The platform becomes an afterthought.

That is backwards.

A GitOps migration should be the beginning of platform engineering, not the end of it.

The question isn't:

> "Can we deploy through Git?"

The question is:

> "Can this platform support five times more engineers, services, and deployments without becoming more difficult to operate?"

That is a very different engineering problem.

* * *

## Platforms Should Become Simpler as They Grow

Growth naturally introduces complexity.

More repositories.

More services.

More environments.

More developers.

More deployments.

More compliance requirements.

Without standards, every new service introduces another variation.

Eventually the platform becomes a collection of exceptions instead of a collection of patterns.

Mature platform teams do the opposite.

Every new service follows the same foundation.

![Illustration accompanying Platforms Should Become Simpler as They Grow](https://cdn.hashnode.com/uploads/covers/69eb5d4d1e45c4e0dadd0fc8/5dd063dc-5ca2-4fea-a2f9-c7505853804a.png)

Notice that developers are not designing deployment pipelines.

They are consuming a platform that already defines them.

* * *

## Platform Engineering Is Product Engineering

One shift I've noticed is that the best platform teams don't think of themselves as infrastructure teams.

They think like product teams.

Their users are engineers.

Their responsibility is improving the engineering experience without compromising reliability.

That changes the questions they ask.

Instead of:

* How many clusters do we manage?

They ask:

* How long does it take a new engineer to deploy safely?

Instead of:

* How many pipelines do we have?

They ask:

* How much operational work did the platform eliminate this quarter?

Instead of:

* How much infrastructure did we automate?

They ask:

* How many production incidents did our standards prevent?

Those are platform metrics.

Not infrastructure metrics.

* * *

## A Mature Platform

![Illustration accompanying A Mature Platform](https://cdn.hashnode.com/uploads/covers/69eb5d4d1e45c4e0dadd0fc8/a4cba778-e958-42cf-98c3-37992a7ec438.png)

The architecture forms a continuous improvement loop.

Every deployment generates feedback.

Every incident improves the platform.

Every improvement benefits every engineering team.

That is how platform engineering scales.

* * *

## Standardization Beats Hero Engineering

One experienced engineer who manually fixes every production issue is impressive.

A platform where nobody needs to manually fix production is far more valuable.

The goal isn't to create exceptional engineers.

The goal is to build systems that don't depend on exceptional individuals.

That is why mature organizations invest heavily in reusable templates, shared workflows, policy enforcement, and automation.

Knowledge becomes part of the platform instead of remaining inside one person's head.

* * *

## What Changed My Perspective (continued)

When I first started learning GitOps, I thought the objective was automation.

The more I studied production systems, the more I realized the objective is consistency.

Automation helps.

Consistency scales.

If every team deploys differently, every incident is different.

If every deployment follows the same path, incidents become easier to understand, recover from, and prevent.

That is the real value of platform engineering.

It doesn't remove complexity.

It manages it.

* * *

As a 17-year-old building cloud and platform projects, that's the lesson I'm taking forward.

The best platforms aren't remembered because they use the newest tools.

They're remembered because engineers can trust them years after they were built.

* * *

## Lessons Learned

The technical side of GitOps is well documented.

Installing ArgoCD is straightforward.

Connecting a cluster to Git takes minutes.

Synchronizing manifests is not difficult.

The harder problem begins after the migration.

It begins when multiple engineering teams depend on the same platform every day.

That is where architecture matters more than tooling.

Over the course of studying production platforms and building cloud projects, a few ideas have become more important than any individual technology.

* * *

## GitOps Is an Operating Model

One of the biggest mistakes is treating GitOps as another deployment tool.

It isn't.

GitOps changes how infrastructure evolves.

Instead of asking:

> "Who deployed this?"

Teams begin asking:

> "Why does production differ from Git?"

That shift improves reliability because every production change becomes visible, reviewable, and repeatable.

The value is not automation.

The value is consistency.

* * *

## Platforms Age Faster Than Applications

Applications are constantly rewritten.

Platforms rarely are.

The Kubernetes cluster deployed today may still be supporting hundreds of services three years from now.

That means platform decisions have a much longer lifespan than application decisions.

Choosing a deployment strategy, repository structure, policy framework, or observability stack is not just solving today's problem.

It is shaping how future engineers will operate the platform.

Good platform engineering thinks in years rather than sprints.

* * *

## Every Shortcut Becomes Technical Debt

Production incidents rarely begin with catastrophic failures.

They usually begin with small exceptions.

Someone changes a resource manually.

Someone bypasses the deployment pipeline.

Someone skips policy validation because production is down.

Each decision seems reasonable.

Collectively, they weaken the platform.

Eventually nobody knows whether Git still represents production.

That uncertainty is more dangerous than any individual configuration mistake.

* * *

## Documentation Should Exist in the Platform

One lesson mature engineering organizations understand well is this:

Engineers should not need to remember operational rules.

The platform should enforce them.

Instead of writing documentation that says:

* Every Deployment must define resource limits.

* Every Service must expose only approved ports.

* Every workload must include health checks.

The platform validates those requirements automatically.

Good platforms reduce the number of decisions engineers need to make.

* * *

## Feedback Should Drive Improvement

Production is the best design review.

Every deployment produces feedback.

Every incident exposes assumptions.

Every alert highlights an opportunity to improve the platform.

That creates a continuous engineering loop.

![Illustration accompanying Feedback Should Drive Improvement](https://cdn.hashnode.com/uploads/covers/69eb5d4d1e45c4e0dadd0fc8/5f58b1aa-28c1-4361-870d-d71279b4044f.png)

Over time, operational knowledge moves from individual engineers into the platform itself.

That is how engineering organizations scale without depending on institutional memory.

* * *

## Technology Changes. Engineering Principles Don't

Five years from now, the tools in this article may be different.

ArgoCD may evolve.

Terraform may change.

New deployment models will appear.

What will remain is the need for predictable systems.

Reliable infrastructure.

Observable platforms.

Consistent delivery.

Recoverable failures.

Those principles survive technology cycles.

* * *

## A Personal Perspective

As a 17-year-old building cloud and platform projects from Lagos, Nigeria, I know I'm still early in my engineering journey.

I don't see that as a disadvantage.

It means I have the opportunity to build good habits before I build larger systems.

The more production architectures I study, the less I focus on learning individual tools.

Instead, I try to understand why mature engineering organizations make the decisions they do.

That mindset has changed how I approach platform engineering.

Not as a collection of Kubernetes manifests or CI pipelines.

But as the discipline of building systems that remain understandable, reliable, and maintainable long after the original migration is complete.

* * *

## Conclusion

Most discussions about GitOps focus on tools.

ArgoCD.

Terraform.

Helm.

Kubernetes.

Those tools matter.

But they are not what determines whether a platform succeeds.

The difference between a platform that lasts two years and one that becomes operational debt is rarely a technology choice.

It is an engineering choice.

Successful platform teams optimize for consistency before convenience.

They reduce variation instead of introducing more abstraction.

They automate repetitive work without hiding how the platform actually operates.

Most importantly, they design systems that another engineer can understand months later.

That is a much harder problem than deploying an application.

* * *

One idea became clearer while writing this article.

GitOps is not really about Git.

It is about trust.

Can engineers trust that production matches the repository?

Can they trust that every deployment follows the same process?

Can they trust that failures are observable?

Can they trust that recovery is predictable?

If the answer is yes, GitOps has achieved its purpose.

If the answer is no, adding more automation will not solve the problem.

* * *

Looking across mature engineering organizations, the pattern is remarkably consistent.

They don't compete by deploying faster.

They compete by making change safer.

Safer deployments.

Safer rollbacks.

Safer upgrades.

Safer operations.

That mindset compounds over time.

Every standardized workflow reduces future complexity.

Every automated policy removes another manual review.

Every production incident becomes another opportunity to improve the platform rather than another reason to distrust it.

* * *

## Final Architecture

![Illustration accompanying Final Architecture](https://cdn.hashnode.com/uploads/covers/69eb5d4d1e45c4e0dadd0fc8/317c88d3-8d7b-4b8f-836b-1b1c822953da.png)

The architecture forms a continuous engineering loop.

Code becomes infrastructure.

Infrastructure becomes production.

Production generates operational feedback.

Operational feedback improves the platform.

The platform improves every future deployment.

That cycle is where mature platform engineering separates itself from simply operating Kubernetes.

* * *

As a 17-year-old building cloud and platform engineering projects from Lagos, Nigeria, I don't expect this article to be the final word on GitOps.

I expect it to be one step in a much longer journey.

Every production architecture I study, every postmortem I read, and every platform I build reinforces the same lesson.

Engineering is not about collecting tools.

It is about understanding systems.

Tools will continue to change.

Engineering principles rarely do.

If this article encourages even one engineer to think beyond "How do I deploy this?" and instead ask "How will this platform behave a year from now?", then it has achieved its purpose.

I'd like to hear from platform engineers who have operated GitOps in production.

### What was the hardest problem after the migration was complete, and what would you do differently today?
