---
title: "Use cases"
description: "Where a self-hosted context engine earns its keep — from agent memory and multi-agent orchestration to accountable knowledge bases and compliance logging."
order: 4
---

CTXone is a context engine, and context is a broad primitive. The same graph —
memory, plans, branches, taint, provenance — shows up in a surprising range of
work. This page is the conceptual tour; for hands-on walkthroughs aimed at a
specific reader, see the [use-case pages](/use-cases/).

## 1. Agent memory

The highest-leverage case, and the one most people meet first. Every AI session
starts from zero, so people keep several open to avoid losing context, and
memory files get dumped into the window on every turn — wasteful, unsearchable,
unaccountable.

CTXone replaces that with a graph:

- Every fact, preference, and decision is committed with an intent and a
  confidence score.
- New sessions **query** for relevant context instead of bulk-loading
  everything.
- It's **searchable** — "what did we decide about pricing?"
- It's **accountable** — `ctx blame` shows where a preference came from.
- It's **branchable** — different branches for different projects or
  experiments.
- It's **shared** — Claude Code, Cursor, a chat UI, and schedulers all read
  and write the same graph over MCP.

Start a fresh session, let it run a couple of recalls, and it has full project
context in seconds — no re-explaining. See the
[AI coding](/use-cases/ai-coding/) and
[team](/use-cases/team-shared-context/) walkthroughs.

## 2. Multi-agent orchestration state

Multi-agent frameworks lack shared state with provenance between agents. When an
orchestrator delegates to a worker, the worker runs in isolation and returns
text — with no structured record of what it explored, how confident it was, what
alternatives it weighed, or who authorized what. If it delegates again, the
chain is invisible.

CTXone models this natively: sessions with parent/child relationships, scoped
branches per agent, authority and delegation chains, and provenance on every
write. The orchestration graph becomes inspectable instead of a pile of opaque
tool calls.

## 3. Accountable knowledge base (accountable RAG)

Plenty of systems do retrieval. Few do **accountable** retrieval, where every
fact carries:

- Who added it — which agent, which human, which source.
- When, from what context, at what confidence.
- Whether it's since been superseded, corrected, or deprecated.
- A full blame chain when the fact turns out to be wrong.

For example, an agent ingests an earnings call and commits a fact with
`intent: Observe, confidence: 0.82, reason: "Q3 transcript, page 14"`. Months
later, a bad decision is traced back to that fact — and `ctx blame` shows the
exact ingestion session that produced it. Retrieval you can audit, not just
retrieve.

## 4. Configuration state for AI pipelines

ML teams iterate constantly on configs, hyperparameters, and preprocessing.
Existing tools don't give them branching to explore config combinations, intent
metadata ("trying a higher learning rate because loss plateaued"), confidence
scoring, or multi-agent support where one agent tunes hyperparameters while
another manages data. CTXone's branches and provenance fit this naturally —
each experiment is a branch you can diff and merge.

## 5. Compliance logging for AI decisions

Any consequential AI decision needs the same primitive: a durable, attributable
record of what was decided and why. Loan-approval agents ("why denied? what
alternatives?"), medical-triage agents ("what symptoms? what confidence?"),
content-moderation agents ("why flagged? under what policy?") all benefit from
provenance and gates that work the same way regardless of industry. This is the
foundation of the [regulated-teams use case](/use-cases/regulated-teams/) and
the Enterprise [audit bundles](/editions/#enterprise).

## The common thread

Every one of these is the same idea at a different altitude: **treat an agent's
context with the rigor we already give source code** — history, review,
attribution, and gates. Memory is the entry point; provenance, branches, and
taint are what make the context trustworthy once it matters.
