---
title: "Building an Agentic Operations Assistant on AWS with Amazon Bedrock and Amazon S3"
date: "2026-07-14"
description: "Most of those demos fail the moment they're introduced to a real production"
draft: false
original_url: "https://edwinjonathand-devops.hashnode.dev/building-agentic-operations-assistant-aws-bedrock-s3"
original_platform: "hashnode"
canonical_url: "https://edwinjonathand-devops.hashnode.dev/building-agentic-operations-assistant-aws-bedrock-s3"
---

Every few months, a new AI demo appears.

It writes code.  
It summarizes documents.  
It answers questions.

Most of those demos fail the moment they're introduced to a real production environment.

Operations teams don't need another chatbot.

They need a system that can answer questions using infrastructure they already trust.

CloudTrail logs.

Terraform plans.

Architecture decisions.

Incident reports.

Compliance evidence.

Runbooks.

Those documents already exist. The challenge isn't generating text—it's retrieving the right information without exposing data that shouldn't leave the organization.

That's where Amazon S3 becomes far more important than people give it credit for.

The model isn't the platform.

The infrastructure is.

Over the last few months, while learning DevOps and building cloud projects from Lagos, I've spent more time thinking about this than about prompt engineering itself.

If an operations assistant cannot answer questions from real infrastructure data, it becomes another demo.

If it can retrieve the right information securely, it starts becoming useful.

This article walks through the architecture I'd build today using AWS.

* * *

## AI Doesn't Need More Memory. It Needs Better Retrieval.

A common misconception is that AI systems become more useful by giving them larger context windows.

In practice, operational systems don't work that way.

Imagine asking:

> Why did our production deployment fail yesterday?

The answer isn't inside the model.

It's inside:

*   CloudTrail logs
    
*   CI/CD deployment records
    
*   Terraform plans
    
*   Incident reports
    
*   CloudWatch metrics
    
*   Runbooks
    
*   Internal documentation
    

The application retrieves those documents first.

Only then does the model generate an answer.

That separation is important.

The infrastructure owns the data.

The model only interprets it.

When those responsibilities are separated, systems become easier to secure, audit and improve.

* * *

## Architecture Overview

![](https://cdn.hashnode.com/uploads/covers/69eb5d4d1e45c4e0dadd0fc8/6dd69753-cfb9-41f8-b949-fd749d9107e1.png)

Nothing here is experimental.

Every component already exists inside AWS.

The intelligence comes from how they're connected—not from introducing another model.

* * *

## Amazon S3 Is Operational Memory

People often describe S3 as object storage.

That's accurate.

It's also incomplete.

For operations teams, S3 becomes the place where institutional knowledge already lives.

Instead of training models on internal infrastructure, store operational artifacts where they already belong.

````plaintext
company-operations/

├── cloudtrail/
│   ├── 2026/
│   └── 2027/
│
├── terraform/
│   ├── plans/
│   ├── state-reports/
│   └── drift/
│
├── incidents/
│   ├── INC-1023.md
│   ├── INC-1024.md
│   └── postmortems/
│
├── architecture/
│   ├── diagrams/
│   ├── ADRs/
│   └── network/
│
├── runbooks/
│
├── compliance/
│
└── cost-analysis/ 

Nothing inside this structure is AI-specific.

Most mature operations teams already organize information this way.

The difference is that an application can now retrieve relevant documents automatically before sending context to Amazon Bedrock.

That reduces hallucinations because the response is grounded in your own infrastructure—not generic internet knowledge.

* * *

# Architecture: Treat S3 as Operational Memory, Not Storage

The common diagram for AI systems is simple:
```plaintext
User
  │
  ▼
Model
  │
  ▼
Answer

That isn't how production systems work.

A production agent rarely answers from the prompt alone. Most of what it needs already exists somewhere else: CloudTrail logs, Terraform plans, runbooks, incident history, architecture decisions, compliance reports, cost analysis, deployment records.

The problem isn't generating text.

The problem is retrieving the right context before generation starts.

That's where S3 fits.

Instead of treating S3 as object storage, treat it as the operational memory for your platform.

```plaintext
Developer
    │
    ▼
Application
    │
    ▼
Amazon Bedrock
    │
    ├───────────────┐
    ▼               │
Retrieve Context    │
    │               │
    ▼               │
Amazon S3 <─────────┘
    │
    ├── CloudTrail logs
    ├── Incident history
    ├── Terraform plans
    ├── Security findings
    ├── Cost reports
    ├── Runbooks
    ├── Architecture docs
    └── Change records
````

The model becomes the reasoning layer.

S3 becomes the source of truth.

That separation matters.

Models change.

Your operational history shouldn't.

For example, imagine an engineer asks:

> Why did our production ALB change last Thursday?

Without operational memory, the model guesses.

With operational memory, it retrieves:

*   CloudTrail events
    
*   Terraform plan
    
*   Pull request
    
*   Deployment logs
    
*   Incident ticket
    
*   Previous rollback
    

Then it answers using actual evidence instead of probability.

A simple bucket layout is enough.

```plaintext
company-ai-memory/
├── cloudtrail/
│   ├── 2026/
│   └── 2027/
├── incidents/
│   ├── INC-1023.json
│   └── INC-1024.json
├── terraform/
│   ├── plans/
│   └── state-history/
├── security/
│   ├── findings/
│   └── compliance/
├── architecture/
├── runbooks/
├── cost-analysis/
└── change-records/
```

Notice that none of these folders were created for AI.

They already exist in mature engineering organizations.

The only difference is that the model can now retrieve them before producing an answer.

That's a better use of AI than asking it to remember everything inside a prompt. It keeps the model stateless while the infrastructure holds the history. That scales better, survives model upgrades, and makes every response traceable back to operational data rather than memory.

## Bedrock Doesn't Run Your Platform. Your Application Does.

One of the easiest mistakes to make is giving the model too much responsibility.

Amazon Bedrock isn't your control plane.

It doesn't own your infrastructure.

It shouldn't make changes to AWS resources.

Its job is much smaller.

It receives context.

It reasons over that context.

It returns a structured response.

Everything else remains the application's responsibility.

![](https://cdn.hashnode.com/uploads/covers/69eb5d4d1e45c4e0dadd0fc8/c4479206-be09-48d4-8d15-af2d0f8be345.png)

Notice what isn't in the diagram.

Bedrock never talks directly to AWS resources.

The application decides:

*   which documents are retrieved
    
*   how much context is sent
    
*   who is authorized
    
*   which actions are allowed
    
*   what gets logged
    

That separation makes the system easier to test and easier to secure.

For example, suppose someone asks:

> Show me every public S3 bucket in production.

The request doesn't go straight to Bedrock.

The application handles it first.

```plaintext
query = "Show me every public S3 bucket in production."

documents = retrieve_context(query)

prompt = build_prompt(
    question=query,
    context=documents
)

response = invoke_bedrock(prompt)
```

The retrieval layer decides what the model is allowed to see.

The model never searches your AWS account.

It only receives the information your application provides.

That distinction matters because language models are probabilistic.

Infrastructure isn't.

If the retrieval layer returns incomplete data, the answer will be incomplete.

If the retrieval layer returns accurate operational records, the model can summarize them, explain relationships, and answer questions in plain language.

The quality of the response depends less on the prompt than on the quality of the context.

That's why most of the engineering effort belongs outside the model.

Build a reliable retrieval pipeline first.

The model becomes much easier to replace later, because the architecture isn't tied to a single provider or model version.

## Building the Retrieval Layer

The quality of an operations assistant isn't determined by the model.

It's determined by what the model is allowed to read.

Most operational questions already have an answer somewhere inside your environment. The challenge is finding the right documents before asking the model to explain them.

For example, imagine someone asks:

> Why did the production deployment fail yesterday?

That answer could exist across multiple systems:

*   CloudTrail
    
*   CloudWatch Logs
    
*   Terraform plans
    
*   Deployment artifacts
    
*   Incident reports
    
*   Runbooks
    

A production system shouldn't send every document to Bedrock.

It should retrieve only the documents related to the question.

![](https://cdn.hashnode.com/uploads/covers/69eb5d4d1e45c4e0dadd0fc8/c1e32478-ef06-47bf-8f83-0c6f44bd6ac7.png)

This approach has two advantages.

First, the model processes less data, which reduces latency and inference cost.

Second, the response stays grounded in operational records instead of relying on general knowledge.

A simple retrieval function might look like this.

```plaintext
import boto3

s3 = boto3.client("s3")

def retrieve_documents(prefix):

    response = s3.list_objects_v2(
        Bucket="company-ai-memory",
        Prefix=prefix
    )

    documents = []

    for obj in response.get("Contents", []):

        file = s3.get_object(
            Bucket="company-ai-memory",
            Key=obj["Key"]
        )

        documents.append(
            file["Body"].read().decode()
        )

    return documents
```

The application now has the information it needs before calling Bedrock.

```plaintext
context = retrieve_documents(
    "incidents/"
)

prompt = f"""
Using only the information below,
answer the engineer's question.

{context}
"""
```

The instruction is intentional.

The model isn't asked to "think."

It's asked to work within the boundaries of the supplied context.

That boundary is one of the simplest ways to improve consistency.

As the platform grows, retrieval shouldn't depend on folder names alone.

Metadata becomes more valuable than directory structure.

For every document stored in S3, attach information such as:

| Metadata | Example |
| --- | --- |
| Environment | Production |
| Service | Payments API |
| Team | Platform Engineering |
| Resource | ALB |
| Region | eu-west-1 |
| Date | 2026-07-13 |
| Incident ID | INC-1048 |

Now the application can retrieve documents by metadata instead of scanning an entire bucket.

The model never needs access to your entire operational history.

It only needs the evidence required to answer one question.

That's a better security model, a cheaper architecture, and a more reliable way to build systems that engineers can trust.

## Security and IAM: The Model Should Never Be Trusted

One of the biggest mistakes in AI architecture is treating the model as if it's another application service.

It isn't.

A language model should never hold AWS credentials or make infrastructure changes directly.

Its responsibility ends at generating a response.

Everything after that belongs to your application.

![](https://cdn.hashnode.com/uploads/covers/69eb5d4d1e45c4e0dadd0fc8/35509b89-10ac-4a41-93a6-a6cda95544ca.png)

The application decides whether the response is safe.

The model doesn't.

For example, suppose the application asks Bedrock to review an infrastructure change.

Instead of returning paragraphs, require structured output.

```plaintext
{
  "risk": "medium",
  "confidence": 0.94,
  "recommended_action": "Approve",
  "reason": "No security impact detected."
}
```

Your application validates that response before anything happens.

```plaintext
decision = response["recommended_action"]

allowed_actions = {
    "Approve",
    "Reject",
    "Request Review"
}

if decision not in allowed_actions:
    raise ValueError("Invalid response")
```

The model never decides what is executable.

It proposes.

The application enforces.

IAM follows the same principle.

If the application only reads operational documents from S3, its role shouldn't include permissions unrelated to that task.

A minimal policy is easier to review and easier to audit.

```plaintext
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
        "arn:aws:s3:::company-ai-memory",
        "arn:aws:s3:::company-ai-memory/*"
      ]
    }
  ]
}
```

Notice what's missing.

*   `s3:*`
    
*   `AdministratorAccess`
    
*   Wildcard permissions across the account
    

The application receives only the permissions required to retrieve context.

Nothing more.

Encryption should also be part of the design from the beginning.

Store operational records in encrypted S3 buckets using AWS KMS.

Enable bucket versioning.

Enable CloudTrail.

Enable server access logging if required by your compliance requirements.

None of these services make the model better.

They make the platform easier to operate.

Every request should also leave an audit trail.

When an engineer asks a question, record:

*   Timestamp
    
*   User identity
    
*   Retrieved documents
    
*   Model version
    
*   Response latency
    
*   Success or failure
    

If someone asks six months later why a particular answer was returned, the platform should be able to explain it using logs,not memory.

That's what separates an operational system from a demo.

The model may generate the answer.

The application remains accountable for everything around it.

## Operating the System in Production

Building the application is only the first step.

Operating it consistently is where most of the engineering effort goes.

A model can answer a question.

It cannot tell you whether the platform is healthy.

That responsibility belongs to your operational tooling.

The first thing to monitor is not model quality.

It is platform behavior.

If engineers stop trusting the answers, the platform has already failed regardless of how accurate the model is.

A production deployment should answer simple operational questions.

*   Is the application responding within the expected latency?
    
*   Are retrieval requests succeeding?
    
*   Are Bedrock requests failing?
    
*   Is S3 returning the expected documents?
    
*   Has the cost per request increased unexpectedly?
    

These metrics reveal platform health long before users report problems.

![](https://cdn.hashnode.com/uploads/covers/69eb5d4d1e45c4e0dadd0fc8/2855e165-f004-45d9-a453-babdc0904f30.png)

CloudWatch becomes the operational dashboard.

Track metrics that engineers can act on.

| Metric | Why it matters |
| --- | --- |
| Request latency | Detect slow responses |
| Retrieval latency | Identify storage bottlenecks |
| Bedrock latency | Measure inference performance |
| Failed requests | Detect application issues |
| S3 retrieval failures | Catch missing or inaccessible documents |
| Token usage | Monitor inference costs |
| Daily request volume | Understand adoption |

Metrics without action are just numbers.

Every important metric should have a corresponding alarm.

For example, if Bedrock latency suddenly doubles, someone should know before users notice.

```plaintext
import boto3

cloudwatch = boto3.client("cloudwatch")

cloudwatch.put_metric_data(
    Namespace="OperationsAssistant",
    MetricData=[
        {
            "MetricName": "RequestLatency",
            "Value": latency_ms,
            "Unit": "Milliseconds"
        }
    ]
)
```

Logs deserve the same attention.

Every request should generate structured logs.

```plaintext
{
  "request_id": "3d91cbe8",
  "user": "platform-engineer",
  "model": "amazon.nova-pro-v1",
  "documents": 6,
  "latency_ms": 921,
  "status": "success"
}
```

Structured logs make troubleshooting much easier than searching through plain text.

Cost also becomes an operational concern.

The easiest way to increase costs is sending unnecessary context to the model.

Retrieve only the documents related to the question.

Avoid sending entire folders.

Cache frequently accessed documents where appropriate.

Small improvements in retrieval often reduce inference costs more than changing models.

Finally, assume every dependency will fail.

Bedrock may throttle requests.

S3 may return temporary errors.

Network calls may timeout.

Your application should recover gracefully.

```plaintext
import time
from botocore.exceptions import ClientError

MAX_RETRIES = 3

for attempt in range(MAX_RETRIES):
    try:
        response = invoke_bedrock(prompt)
        break
    except ClientError:
        if attempt == MAX_RETRIES - 1:
            raise
        time.sleep(2 ** attempt)
```

A production platform is judged less by how it behaves when everything works and more by how it behaves when something doesn't.

That is true whether the application uses AI or not.

## Failure Modes You Should Design For

Most engineering discussions focus on what the system can do.

Production systems are defined by what happens when something goes wrong.

An operations assistant is no different.

Every dependency in the request path can fail.

Your application should assume that it eventually will.

![](https://cdn.hashnode.com/uploads/covers/69eb5d4d1e45c4e0dadd0fc8/53edbd38-2733-427f-9374-c8b96441241f.png)

The objective is not to eliminate failures.

The objective is to make failures predictable.

## Retrieval Fails

Suppose the application cannot retrieve the required documents from S3.

The worst response is allowing the model to answer anyway.

Instead, fail immediately.

```plaintext
if not documents:
    raise RuntimeError(
        "No operational context available."
    )
```

An incomplete answer is often worse than no answer at all.

Engineers make decisions based on confidence.

Missing context silently reduces that confidence.

* * *

## Bedrock Is Unavailable

Every external service experiences temporary failures.

Your application should already know what to do.

```plaintext
try:
    response = invoke_bedrock(prompt)

except Exception:

    logger.error(
        "Bedrock unavailable."
    )

    return {
        "status": "unavailable",
        "message": "Please retry."
    }
```

The user should receive a predictable response.

Not a stack trace.

* * *

## Context Is Outdated

Operational data changes constantly.

A runbook from last year may no longer describe the current architecture.

CloudTrail events continue arriving.

Terraform state changes.

Infrastructure evolves.

Version important documents.

Keep timestamps.

When possible, surface the document date inside the response.

For example:

> Based on the incident report updated on **2026-07-08**...

That gives engineers immediate context.

* * *

## The Model Returns Invalid Output

Never assume the response format is correct.

Validate it.

```plaintext
required_fields = {

    "summary",

    "confidence"

}

if not required_fields.issubset(response):

    raise ValueError(
        "Unexpected response format."
    )
```

Validation belongs in the application.

Not inside the prompt.

* * *

## Cost Can Become a Failure

A platform that works technically but becomes too expensive will eventually be redesigned.

Monitor usage.

Questions worth tracking include:

*   Which requests consume the most tokens?
    
*   Which documents are retrieved most often?
    
*   Which teams generate the highest traffic?
    
*   Can repeated responses be cached?
    

Operational efficiency matters as much as model quality.

* * *

## Human Review Still Matters

Not every response should be trusted automatically.

If the application is generating deployment recommendations, infrastructure summaries, or security advice, an engineer should still review the result before acting.

The goal is to reduce investigation time.

Not to remove engineering judgment.

The platform should help engineers make decisions faster.

It should never replace accountability.

* * *

## A Good Architecture Ages Well

Models will change.

AWS services will evolve.

New orchestration frameworks will appear.

The surrounding architecture should not need to change every time a new model is released.

If your application separates retrieval, reasoning, validation, and logging into independent layers, replacing Bedrock with another provider becomes an implementation detail rather than a platform rewrite.

That is usually a good sign.

It means the architecture is built around engineering principles instead of a specific model.

## Lessons Learned While Building It

One thing became obvious while building this architecture.

The hard part was never calling the model.

The AWS SDK already solves that.

The difficult part was deciding what the model should and should not know.

Every shortcut introduced another problem.

If the application retrieved too much data, responses became slower and more expensive.

If it retrieved too little, important context disappeared.

If permissions were too broad, security suffered.

If permissions were too restrictive, useful documents could not be retrieved.

None of those problems were related to AI.

They were infrastructure problems.

That changed how I think about building systems like this.

The model is only one dependency in the request path.

The application, storage layer, IAM policies, logging, and monitoring have a much bigger impact on whether engineers actually trust the platform.

![](https://cdn.hashnode.com/uploads/covers/69eb5d4d1e45c4e0dadd0fc8/8277392c-e2a5-4fb6-9138-e4457798c1f7.png)

Another lesson was resisting the temptation to automate everything.

Just because the model can suggest a change does not mean it should make the change.

Recommendations and execution should remain separate.

An engineer should always know:

*   what evidence was retrieved
    
*   why the recommendation was made
    
*   which documents were referenced
    
*   how confident the application is
    
*   what happens if the recommendation is ignored
    

That level of transparency matters more than making the system feel autonomous.

I also stopped thinking about this as an AI project.

It is an operations platform that happens to use a model.

If Bedrock were replaced tomorrow, most of the architecture would remain exactly the same.

Amazon S3 would still store operational history.

IAM would still enforce access.

CloudTrail would still record activity.

CloudWatch would still expose metrics.

The retrieval layer would still determine what information reaches the model.

That is usually a good design check.

If replacing the model requires rebuilding the platform, the architecture is too tightly coupled.

Good infrastructure outlives individual services.

The same principle should apply here.

The goal is not to build around today's model.

The goal is to build a platform that can adapt as the models change.

## Conclusion

When I started learning cloud engineering, I assumed building systems was mostly about writing code.

The more time I spent working with AWS, the more that assumption changed.

Most of the work happens around the code.

Deciding how data moves.

Limiting access with IAM.

Keeping operational history.

Making systems observable.

Designing for failure before it happens.

Those decisions determine whether a platform survives production.

Building this architecture reinforced that idea.

Amazon Bedrock is one component.

Amazon S3 is another.

CloudTrail, IAM, CloudWatch and the application itself all have equally important roles.

Remove any one of them and the platform becomes less reliable.

That is why I think conversations around AI often miss the engineering work that makes these systems useful.

The model is the visible part.

The infrastructure is what makes it dependable.

I'm still learning.

I'm still building.

I'm still making mistakes and improving every project.

I'm 17, building cloud infrastructure from Lagos, Nigeria, and documenting what I learn as I go.

This article isn't a blueprint for every workload.

It's one way of thinking about how language models fit into cloud platforms without making them the center of the architecture.

Technology will keep changing.

New models will arrive.

New AWS services will be released.

The engineering principles behind reliable systems are much slower to change.

Those are the skills I'm choosing to invest in.

If you've built a similar architecture, or you think there's a better approach, I'd genuinely like to hear how you solved it. Those conversations are far more valuable than treating any single design as the final answer.
