---
title: "The cure for plan rot"
description: "Markdown to-do lists start lying the moment work begins. CTXone plans are a first-class object that stays anchored to reality — with proof."
pubDate: 2026-08-13
author: "CTXone team"
tags: ["plans", "workflow"]
---

Every AI coding session starts the same optimistic way: the agent
writes a plan. A tidy markdown checklist — six steps, neatly ordered.
And then work begins, and the plan starts to rot.

By step three the agent has discovered step two was wrong, silently
skipped step four, and marked step five "done" without anything to show
for it. The checklist still *looks* authoritative. It just no longer
describes reality. That's **plan rot**, and it's the default state of
every to-do list a model has ever written.

## Why markdown plans rot

A markdown checklist is a snapshot, not a system. Nothing enforces that
a checked box corresponds to real work. Nothing survives the end of the
session. Open a new chat tomorrow and the plan is gone — or worse, a
stale copy lingers and the agent trusts it.

The three failure modes:

- **No persistence.** The plan lives in the context window. Session
  ends, plan dies.
- **No proof.** "Done" is a character in a text file. It can be typed
  whether or not the work happened.
- **No shared truth.** Your plan and your teammate's plan are different
  files that never reconcile.

## Plans as a first-class object

In CTXone, a plan isn't text — it's a structured object in the memory
graph that outlives the session and demands evidence.

```text
ctx plan new "auth refactor"
ctx plan add "extract token validation into middleware"
ctx plan add "migrate sessions table"
ctx plan next
  → next: extract token validation into middleware
ctx plan done 1 --proof commit:abc1234
```

That `--proof` flag is the whole point. A task isn't done because
someone said so; it's done because it's anchored to a commit, a test
run, or an artifact you can go look at. The plan and the work stay
married.

Because plans live in the graph, they:

- **Persist across sessions.** Close the chat, come back in a week,
  ask `ctx plan next`, and pick up exactly where you left off.
- **Are shared on a team hub.** Everyone sees the same plan and the
  same progress — no divergent copies.
- **Carry provenance.** Like every other node in CTXone, a plan's
  history is inspectable: who added what, when, and why.

## The quiet payoff

When an agent can trust its plan, it stops re-deriving state at the
start of every session. It asks "what's next?" and gets a real answer,
grounded in proof, instead of re-reading a checklist that may or may
not be true. Plan rot was never a discipline problem. It was a
missing-data-structure problem — and that has a fix.
