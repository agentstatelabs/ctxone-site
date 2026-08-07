---
title: "From memory layer to context engine"
description: "CTXone started as remember / recall / blame. It grew into a four-surface system for everything an agent needs to keep its head straight. Here's the arc."
pubDate: 2026-08-27
author: "CTXone team"
tags: ["product", "vision"]
---

CTXone began with a narrow, honest pitch: your AI tools forget
everything between sessions, so give them a memory. Three verbs —
`remember`, `recall`, `blame` — and a token-savings number you could
prove on every call. That was the whole product, and it was enough to
be useful.

But "memory" turned out to be the first primitive, not the last. Every
serious project surfaced an adjacent problem that memory alone didn't
solve — and each one became part of the system.

## What kept coming up

- **Plans rotted.** Agents wrote checklists that lied within minutes.
  Memory didn't fix that; a first-class, proof-anchored **plan** object
  did.
- **Speculation polluted the graph.** Trying an idea meant contaminating
  your good context. Memory didn't fix that; **branches** — with diff
  and merge, like git — did.
- **Decisions went orphaned.** Nobody could trace who told the model
  what. Memory stored the fact; **provenance** (`blame`, `why-did-we`)
  made it accountable.
- **Some paths were dangerous.** Not every context should be freely
  overwritten by an agent. **Taint** gates — review, quarantine, watch —
  turned that into policy.

None of these were bolt-ons. They fell out of the same core idea: an
agent's context deserves the same rigor we give source code — history,
review, attribution, and gates.

## Four surfaces, one engine

Today CTXone is a system, not a library:

- **Hub** — one daemon serving MCP tools, a REST API, and the UI.
- **Engine** — the content-addressed graph underneath it all.
- **Lens** — a web dashboard for what your agents know.
- **`ctx`** — the CLI, so everything an agent can do, you can do too.

The word we use now is **context engine**, because "memory layer"
undersells it. Memory is one thing it stores. Plans, branches, taint,
and provenance are the rest — the machinery that keeps context true
over a long project, not just present.

## What didn't change

The original promise is intact: self-hosted, no account, zero telemetry,
and a savings ratio you can read off every recall. We just kept
following the problem. If your agents forget, CTXone still remembers —
and now it also plans, branches, gates, and keeps the receipts.
