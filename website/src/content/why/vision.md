---
title: "Vision"
description: "Why a self-hosted context engine breaks the context-cost paradox — and what CTXone is building toward for individuals, teams, and enterprises."
order: 1
---
## The Insight

A long-running AI session is both the best and worst experience in AI tooling.
Best because the agent has accumulated deep context about your project. Worst
because that context is volatile, expensive, and invisible.

The longer a session runs:
- The "smarter" it feels (more accumulated context)
- The more tokens it burns (entire history on every turn)
- The slower responses get (more context to process)
- The more anxious you are about losing it

This is a fundamental structural problem. More useful = more expensive = more
fragile. The current architecture doesn't just fail to solve this — it makes
it worse the better it works.

## The Product

**CTXone** — a self-hosted **context engine** for AI agents that breaks the
context-cost paradox. Durable memory is where it started, but memory is one
primitive of six: it also gives agents **plans** that survive plan rot,
**branches** for speculative context, **taint** gates on sensitive paths,
**provenance** (`blame` / `why-did-we`) for every fact, and live **token
accounting**. All of it rides on the same content-addressed graph
(AgentStateGraph) and is served over MCP, a REST API, and the `ctx` CLI.

Every session commits what it learns. Every new session loads only what's
relevant. The agent gets smarter over time without getting more expensive.
O(log n) scaling on memory costs instead of O(n).

## Why it holds up

The idea is simple; what makes it durable is that it's real infrastructure,
not a wrapper:

- **Structured, not a blob.** A memory graph with intent, confidence, and
  provenance on every write does things a vector store (similarity only) and a
  flat memory file (bulk load only) can't: rank within a token budget, trace a
  fact to its source, and branch speculative context.
- **Measurable, not vibes.** Every `recall` reports tokens sent versus the
  flat-memory baseline. The savings ratio starts around 5× on day one and
  climbs as the graph grows — the baseline gets bigger while a targeted recall
  stays small. See [Token savings](/how-it-works/token-savings/).
- **Compounding.** The more an agent works, the more the graph knows, and the
  more valuable it becomes — without getting more expensive per turn. Context
  you can trust is worth more the longer you've lived in it.
- **Yours.** Self-hosted, zero telemetry, source-available. The graph is a file
  you own; nothing about your project leaves your machine unless you send it.

## What it's for

The same engine serves a solo developer, a whole team, and a regulated
organization — the difference is who shares the graph and how it's governed,
not which features are unlocked:

- **Individuals** get persistent, searchable, transparent memory across every
  MCP-compatible tool. Close sessions freely; start new ones instantly.
- **Teams** point one shared Hub at their whole toolchain, so a decision made
  once is known by everyone's agents, attributed to real people.
- **Enterprises** add multi-tenancy, RBAC/SSO, audit bundles, and policy
  governance on top of the open core.

See [Editions](/editions/) for how those tiers differ, and
[Use cases](/why/use-cases/) for where a context engine earns its keep.
