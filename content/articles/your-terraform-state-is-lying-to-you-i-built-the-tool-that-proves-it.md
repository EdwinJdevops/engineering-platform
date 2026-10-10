---
title: "Your Terraform State Is Lying to You. I Built the Tool That Proves It."
date: "2026-06-21"
description: "The Quiet Failure Mode Every AWS Team Pretends Doesn't Exist I Found the Gap Every DevOps..."
draft: false
original_url: "https://dev.to/edwindevops/your-terraform-state-is-lying-to-you-i-built-the-tool-that-proves-it-ck9"
original_platform: "devto"
aliases: []
---

## The Quiet Failure Mode Every AWS Team Pretends Doesn't Exist I Found the Gap Every DevOps Tool Stopped Short Of Closing Nobody Finished This Tool. So I Did

     Open your AWS console right now and compare it to your Terraform state file, line by line. I'll save you the trouble. They don't match.

Not because you did anything wrong. Because someone — you, a teammate, a contractor with console access nobody revoked — made a change outside the pipeline. A security group rule got loosened during an incident and never got tightened back. An S3 bucket lost its encryption config mid-debug. A database got flagged publicly accessible for twenty minutes of convenience and stayed that way for three months because nobody was watching.

Terraform doesn't know any of this happened. It still believes the world looks like what you declared. The gap between that belief and reality is called drift, and it is the quietest liability in cloud infrastructure — not because it's rare, but because nothing alerts on it. It doesn't throw an error. It waits for an audit, or an attacker, whichever comes first.

I went looking for the tool that closes that gap properly. I found pieces of one, scattered across three dead-ends.
![Image description](https://dev-to-uploads.s3.us-east-2.amazonaws.com/uploads/articles/oi2reyzotwpl4s5dsy0b.jpeg)

Driftctl detected drift competently — until Snyk acquired it, extracted whatever value they wanted, and let the repository go silent. No commits in over a year, still recommended on every "top drift detection tools" roundup that nobody bothered to update. Checkov scans your Terraform code before you apply it, which is useful and also irrelevant to what's already running in production. Infracost will price a resource down to the cent and say nothing about the fact that the resource shouldn't be publicly exposed in the first place.

Three tools, three lanes, none of them talking to each other. Nobody had built the version that watches your real infrastructure, tells you precisely how dangerous a discrepancy is using frameworks security teams actually trust, prices what it's costing you, and hands you the fix instead of a report you'll skim once and forget.

So I built it. DriftGuard is live, it's running against real AWS accounts, and it doesn't soften what it finds.

What It Does, Without the Marketing Language
DriftGuard reads your terraform.tfstate and queries your live AWS account directly — EC2, security groups, S3, RDS, IAM — and checks whether the two still agree.
![Image description](https://dev-to-uploads.s3.us-east-2.amazonaws.com/uploads/articles/vxvsp9ywuouj6z621572.jpeg)

When they don't, it doesn't hand you a raw diff and call it done. Every discrepancy runs through a rules engine mapped to CIS AWS Benchmark controls and MITRE ATT&CK technique IDs. A security group that opened SSH to the entire internet isn't logged as "rule modified." It's flagged as a direct CIS 4.1 violation, tied to the exact attack technique it enables, and weighted with a severity that makes it impossible to quietly skip in a backlog review.

It also does the arithmetic nobody else runs. An EC2 instance quietly bumped from t3.micro to t3.large isn't just a config change — it's an unapproved $53 a month, compounding silently across however many times that pattern repeats across your fleet before finance notices the bill moved.

![Image description](https://dev-to-uploads.s3.us-east-2.amazonaws.com/uploads/articles/xawd666x8emb7kwokost.jpeg)
Then it closes the loop entirely. DriftGuard writes the exact Terraform HCL needed to restore the declared state, commits it to a branch, and opens a pull request on your repository with the severity, the specific compliance violation, the cost impact, and the fix sitting together in one place. You don't investigate. You review and merge.

That's the entire premise: stop generating reports nobody reads, and start generating fixes someone can act on in under a minute.

What Actually Happened Behind the Scenes
I won't pretend this was a clean build, because the clean version of any engineering story is usually the fictional one.

The core engine — parsing state, pulling live AWS data through boto3, diffing the two, scoring severity against compliance frameworks — came together quickly. That part is just structured logic: compare, flag, weight, output. Algorithms cooperate. Infrastructure doesn't.

Deployment is where I actually got tested.

Railway rejected the first build outright: "railpack could not determine how to build the app." No requirements.txt in the path it expected, no signal telling it what kind of project this even was. I fixed it. It failed again on a different missing piece. By the time I got a deployment that actually held, I'd burned through my entire Railway trial — watched the credits disappear before I'd shipped anything real, which is its own particular kind of frustrating.

I moved to Render. Free tier, no countdown clock. First build failed there too — a pydantic-core metadata error, because I'd pinned exact dependency versions with no prebuilt wheel for the Python runtime underneath. I stripped every version pin, let pip resolve compatible versions on its own, redeployed, and watched the logs finally turn green.

That sequence — dead platform, burned credits, stripped config, second platform, second failure, fix, green build — is the actual build log. Not a straight line. A series of corrections until something held. That's what shipping looks like, regardless of who's doing the shipping or how old they are.

On the Matter of My Age
I'm seventeen. I don't have a degree, and I stopped waiting for one to certify what I already knew how to do. Linux, Docker, Kubernetes, Terraform, AWS — learned from documentation and broken builds, the way most of this industry actually gets learned, with no cohort and no professor softening the parts that didn't make sense the first time.

Before DriftGuard, I'd already built a Zero-Trust Kubernetes platform end to end. I'd already shipped a security posture engine scoring live clusters against MITRE ATT&CK using real scan data, not staged examples. I'd already stood up AWS pipelines authenticated entirely through OIDC — zero static credentials anywhere in the chain, the way the documentation says it should be done and the way most teams still aren't doing it.

DriftGuard is the first project I'm putting directly in front of an industry that hasn't had a reason to look yet. It solves a problem real infrastructure teams actually have. Test it against your own AWS account. Try to break it. File an issue — I read every one, and I close them fast, because a maintainer who goes quiet is the fastest way to lose trust in a tool.

Live API: <https://driftguard-endm.onrender.com/docs>
GitHub: <https://github.com/EdwinJdevops/driftguard>

Closing
I didn't write this to introduce myself. The repository is public, the API is live, and the commit history will tell you more about how I work than any paragraph here could.

What I'll say instead is this: most people wait for permission before they consider themselves ready. A title, a degree, an interview that grants them the right to call their work serious. I skipped that part. I built the tool, deployed it, broke it, fixed it, and put it where anyone can verify every claim I just made.

The work is the introduction. Everything else is just confirmation.

I'm Edwin Jonathan — a 17-year-old self-taught DevOps Engineer building from Lagos, Nigeria. No degree, no shortcuts — just real infrastructure, real pipelines, and real results. Follow the journey: 🔗 GitHub: github.com/EdwinJdevops ✍️ Hashnode: edwinjonathand-devops.hashnode.dev 💼 Open to remote DevOps/Cloud roles globally
