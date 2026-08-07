---
title: "CTXone + AgentStateDeveloper: memory meets code intelligence"
description: "CTXone remembers what your agents decided. AgentStateDeveloper knows what your code actually does. Together they give an agent both halves of the context it needs."
pubDate: 2026-08-06
author: "CTXone team"
tags: ["integrations", "asd", "code-intelligence"]
---

CTXone gives an AI agent a durable memory: the facts, decisions, and
plans that survive across sessions. But memory answers only half of the
question an agent faces when it opens your project. The other half is
structural — *what does this code actually do, and what breaks if I
change it?*

That half is [AgentStateDeveloper](https://github.com/agentstatelabs/AgentStateDeveloper)
(ASD). And CTXone partners with it beautifully.

## Two kinds of context

Think about what you carry in your head when you work on a mature
codebase:

- **Remembered context** — "we picked SQLite over Postgres, and why,"
  "don't touch migrations without checking with Priya," "the payment
  path is frozen until the audit clears." This is what CTXone stores:
  a ranked, branchable graph of facts with full provenance.
- **Structural context** — "`charge_card` is called from four places,"
  "this function has a network effect," "that decision is recorded in
  the ledger next to the symbol it governs." This is what ASD indexes:
  symbols, call graphs, effects, and ledger decisions, queryable in
  milliseconds.

An agent with only one of these is working half-blind. Memory without
structure reverses decisions it can't see the blast radius of.
Structure without memory re-derives the same conclusions every session.

## How the two connect

When ASD is wired into the CTXone Hub, agents gain code-intelligence
tools right alongside the memory tools they already call — no second
server to point at, no context-switch:

| Tool | What it answers |
|------|-----------------|
| `code_search` | "Where's the payment logic?" |
| `code_read` | "What are this function's effects and recorded decisions?" |
| `callers_of` | "What calls this — what's my blast radius?" |
| `callees_of` | "What does this depend on?" |

A real workflow looks like this:

```text
recall("payment processing")        # CTXone: what did we decide here?
  → [pinned] payment path frozen until audit clears

code_search("charge_card")          # ASD: where does it live?
callers_of("payments.charge_card")  # ASD: who calls it?
  → 4 call sites across billing, retries, admin

why-did-we("freeze payment path")   # CTXone: trace the decision
  → blame: security review, 2026-07-30, "SOC 2 evidence"
```

The agent now knows the code *and* why it's off-limits — before it
touches a line.

## One graph, one command

If you already run CTXone, adding ASD is one flag. `ctx bootstrap`
even offers to set up AgentStateDeveloper for you. Index a repo once
with `asd index .`, start the Hub with `--asd-repo`, and the code tools
appear next to your memory tools automatically.

Read the full setup in the
[ASD integration guide](/integrations/asd-integration/).

## Why it matters

The whole thesis of CTXone is that an agent should not start from zero
every morning. AgentStateDeveloper extends that from *what you decided*
to *what you built*. Memory plus structure is the context a senior
engineer carries without thinking about it — and now your agents carry
it too.
