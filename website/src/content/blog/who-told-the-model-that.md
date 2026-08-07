---
title: "Who told the model that?"
description: "AI agents write decisions into your project that no one remembers making. Provenance — ctx blame and why-did-we — is how you get accountability back."
pubDate: 2026-08-20
author: "CTXone team"
tags: ["provenance", "blame", "governance"]
---

You open a file the agent edited last week. There's a comment
referencing "the new API versioning policy." You don't remember a
policy. Nobody on the team remembers a policy. Did the model
hallucinate it? Did someone mention it once in a side chat that scrolled
away forever? Nobody can check. The decision is *orphaned* — real
enough to shape the code, untraceable enough that no one can defend or
reverse it.

As agents write more of your context, orphaned decisions multiply. The
fix is the same one version control gave us for code: provenance.

## Every fact carries its origin

In CTXone, writing to memory is a commit. Every commit records:

- **who** — the agent ID (which tool) and, on a team hub, the user
- **when** — a timestamp
- **intent** — what kind of write it was (observe, decide, correct…)
- **why** — the reasoning or context supplied at write time

So the question "who told the model that?" has an answer you can run:

```text
ctx blame /memory/api/versioning-policy

agent:  claude-code
user:   priya
when:   2026-08-11T14:22:09Z
intent: Decide
reason: "align mobile + web clients on /v2"
```

Not a hallucination. A decision Priya made through Claude Code on the
11th, with a reason attached. Now it can be defended — or revisited on
purpose.

## Before you reverse a decision

The more valuable command is `why-did-we`. Before an agent overturns a
settled decision — a security posture, a licensing choice, a deployment
strategy — it can trace the decision's full provenance chain first:

```text
ctx why-did-we "use BSL-1.1"
  → decision recorded 2026-06-02 by craig via cursor
    reason: "source-available now, Apache-2.0 in 4 years"
    linked: /memory/legal/license, /memory/strategy/oss
```

This is the difference between an agent that blunders into re-litigating
a choice you made for good reasons, and one that reads the reasons first
and leaves the settled thing settled.

## Provenance is governance

For a solo developer, blame turns "I think I told it that once" into a
fact. For a team, it attributes decisions to real people. For a
regulated organization, it's the raw material of an audit trail — an
exportable record of who changed what context and why.

Same primitive, three altitudes. It all starts with treating a fact not
as a string, but as a commit with an author.
