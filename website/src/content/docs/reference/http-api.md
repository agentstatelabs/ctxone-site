---
title: "HTTP API"
description: "The CTXone Hub exposes a REST API over HTTP when run with `--http`. This doc lists every endpoint, its request format, response format, and any query paramet…"
sidebar:
  order: 3
---
The CTXone Hub exposes a REST API over HTTP when run with `--http`. This
doc lists every endpoint, its request format, response format, and any
query parameters.

All endpoints live under `http://<host>:<port>/api/`. Default host and port:
`0.0.0.0:3001`. CORS is enabled with `Allow-Origin: *`.

## Conventions

- **Branch/ref parameter:** most endpoints take a branch name in the URL
  path (`{ref_name}`) or as a `ref` query string / body field. Defaults to
  `main`.
- **Namespace parameter:** every ref-touching endpoint also accepts a
  namespace (see [Namespaces](#namespaces) below). Defaults to `default`.
- **Content type:** requests and responses use `application/json`.
- **Error responses:** HTTP 4xx for bad input, 5xx for server errors. Body
  is plain text with a human-readable message.

## Namespaces

A **namespace** isolates everything ref-scoped: branches, plans, memory
(facts / pinned / primed / sessions), taints, reminders, and history.
One namespace typically maps to one code repo via the
[project registry](#project-endpoints). Pre-existing data lives in the
reserved `default` namespace; nothing migrates.

Every ref-touching endpoint (`state`/`paths`/`search`, `log`, `blame`,
`diff`, `merge`, branches, `memory/*`, `plans/*`, `taint/*`,
`reminders/*`, session turns) resolves its namespace the same way:

1. `?namespace=<ns>` query parameter (takes precedence)
2. `X-CTXone-Namespace: <ns>` header
3. Neither present → the `default` namespace

Rules:

- Namespace names are ASCII `[A-Za-z0-9_-]`, 1–64 bytes. An invalid
  name returns **400**.
- Namespaces are created by registering a project
  (`POST /api/projects`); ref operations in a namespace that doesn't
  exist return **404**.
- Cross-namespace merge is deny-by-default: attempting it returns
  **403** (per AgentStateGraph's isolation rules).

## Health

### `GET /api/health`

Simple liveness check.

**Response (200):**
```json
{
  "status": "ok",
  "service": "ctxone-hub"
}
```

Used by `ctx status` and `ctx doctor`.

---

## Stats

### `GET /api/stats/tokens`

Cumulative token savings **aggregated across every session**.

**Response (200):**
```json
{
  "session_id": "_aggregate",
  "session_tokens_used": 98,
  "session_tokens_saved": 1706,
  "total_graph_size_chars": 1804,
  "total_graph_size_tokens": 451,
  "cumulative_ratio": 18.43
}
```

- `session_id` — always `"_aggregate"` to signal this is a roll-up,
  not a single-session snapshot
- `session_tokens_used` — sum of tokens actually sent across all sessions
- `session_tokens_saved` — sum of `(recalls × flat_baseline) - used`
  across all sessions
- `total_graph_size_chars` — **max** observed across sessions (graph
  size is process-global, not summable)
- `total_graph_size_tokens` — `chars ÷ 4`
- `cumulative_ratio` — `(used + saved) / used`

### `GET /api/stats/tokens/{session_id}`

Stats for a single logical session. `session_id` is whatever clients
pass in the `X-CTXone-Session` header; absent clients roll up under
`"default"`.

**Response (200):**
```json
{
  "session_id": "alice@example.com",
  "session_tokens_used": 42,
  "session_tokens_saved": 658,
  "total_graph_size_chars": 1804,
  "total_graph_size_tokens": 451,
  "cumulative_ratio": 16.67
}
```

Returns **404** if the session ID has never been seen. Sessions are
created lazily the first time a read endpoint (`recall`, `context`)
records token usage for them.

### `GET /api/stats/sessions`

List every known session with its current stats.

**Response (200):**
```json
[
  { "session_id": "alice@example.com", "session_tokens_used": 42, "session_tokens_saved": 658, "total_graph_size_chars": 1804, "total_graph_size_tokens": 451, "cumulative_ratio": 16.67 },
  { "session_id": "bob@example.com",   "session_tokens_used": 120, "session_tokens_saved": 1200, "total_graph_size_chars": 1804, "total_graph_size_tokens": 451, "cumulative_ratio": 11.00 },
  { "session_id": "default",           "session_tokens_used": 0,   "session_tokens_saved": 0,    "total_graph_size_chars": 1804, "total_graph_size_tokens": 451, "cumulative_ratio": 0.0 }
]
```

Sorted by `session_id`. The `"default"` session is always present even
on a fresh Hub.

### `POST /api/stats/llm_usage`

Record one LLM turn's token usage against the caller's session.
Agents call this after each significant LLM turn with numbers copied
straight from the provider response's `usage` field. Returns the
updated `SessionSnapshot` so callers see running totals in one round
trip.

The session is resolved via `X-CTXone-Session` (same mechanism as
every other endpoint). Unknown sessions are auto-created.

**Request body:**
```json
{
  "input_tokens": 2400,
  "output_tokens": 450,
  "cache_read_tokens": 1800,
  "cache_create_tokens": 600,
  "model": "claude-sonnet-4.5",
  "provider": "anthropic"
}
```

- `input_tokens` (required) — **fresh** input tokens the model consumed,
  NOT counting anything served from cache. Report input disjoint from
  `cache_read_tokens` (see the note below).
- `output_tokens` (required) — tokens the model generated
- `cache_read_tokens` — tokens served from the prompt cache, default `0`
- `cache_create_tokens` — tokens written to the prompt cache (Anthropic
  prompt caching), default `0`
- `model` — human-readable model identifier for display, optional
- `provider` — provider identifier (`anthropic`, `openai`, `gemini`, …), optional

All token fields are `u64`; negative or malformed values are rejected
by the JSON parser.

> **Cached tokens must not be double-counted.** CTXone treats the four
> fields as **disjoint** — the total for a call is
> `input + output + cache_read + cache_create`. Anthropic already reports
> input this way (its `input_tokens` excludes cache reads). **OpenAI /
> Codex do not**: their `input_tokens` *includes* the cached portion
> (`cached_input_tokens` is a subset), so a raw copy would count the
> cached tokens in both `input` and `cache_read`. Subtract the cached
> count from input before reporting: `input = input_tokens −
> cached_input_tokens`. Getting this wrong inflates the token total (~2×
> on cache-heavy sessions) and overcharges cost, since the cached tokens
> would be priced at the full input rate instead of the cache-read rate.

**Response (200):**
```json
{
  "session_id": "alice@example.com",
  "session_tokens_used": 12,
  "session_tokens_saved": 340,
  "total_graph_size_chars": 1804,
  "total_graph_size_tokens": 451,
  "cumulative_ratio": 29.33,
  "llm_input_tokens": 2400,
  "llm_output_tokens": 450,
  "llm_cache_read_tokens": 1800,
  "llm_cache_create_tokens": 600,
  "llm_call_count": 1,
  "last_model": "claude-sonnet-4.5",
  "last_provider": "anthropic"
}
```

**Error responses:**
- `400 Bad Request` (or `422 Unprocessable Entity`, depending on
  axum's extractor) when `input_tokens` or `output_tokens` are
  missing, non-numeric, or negative.

**Recall integration:** once a session has reported LLM usage at
least once, every subsequent `GET /api/memory/recall` from the same
session carries a `session_llm_stats` sub-object so agents see the
running totals alongside the results:

```json
{
  "results": [...],
  "ctx_tokens_sent": 300,
  "ctx_tokens_estimated_flat": 1500,
  "ctx_savings_ratio": 5.0,
  "pinned_count": 2,
  "topic_matches": 3,
  "session_llm_stats": {
    "input_tokens_total": 12500,
    "output_tokens_total": 3200,
    "cache_read_tokens_total": 8900,
    "cache_create_tokens_total": 450,
    "call_count": 17
  }
}
```

The field is only present for sessions that have reported usage —
sessions that haven't see the same shape they've always seen.

### `POST /api/stats/backfill_by_model`

Recompute each session's per-model token split from its stored
per-turn snapshots, and **replace** the stored split with the result.
Every turn at `/sessions/{id}/turns/{idx}` already carries its own
`model` and `tokens`, so this recomputes the per-model breakdown
without re-ingesting (no double-counting) and without touching the
graph (no memory loss). It is **idempotent** — running it again yields
the same replacement. Scoped to the request namespace
(`X-CTXone-Namespace`).

Use it after importing sessions recorded before the per-model split
existed, or any time a session's per-model numbers look wrong.

**Cached-token normalization.** As it recomputes, the backfill enforces
the disjoint-fields rule above: for OpenAI / Codex-family models (`gpt-*`,
`codex*`, `o1/o3/o4`) it subtracts the cached count from input
(`input = input_tokens − cache_read`), since those providers fold cached
tokens into `input_tokens`. Anthropic turns are left as-is. This is why
recomputing is the right fix for historical Codex sessions whose totals
were inflated — it happens at aggregation, so stored turns keep their
provider-native shape and re-running stays idempotent.

**Two modes:**

- **One session** — pass `?session=<id>` to recompute just that session.
  This is what `ctx ingest-session` calls after writing a session's
  turns, so a re-ingest never inflates the split. Always fast.
- **Whole namespace** — omit `session` to walk every session. The walk
  is **bounded per request** so it can never exceed the HTTP timeout,
  no matter how large the namespace's database is.

**Query parameters (whole-namespace mode):**

- `max_secs` — soft wall-clock budget in seconds, default `20`. The
  walk stops once the budget elapses (after finishing the in-flight
  session) and returns a cursor. `0` is treated as `1`, and at least
  one session is always processed so a spent budget can't stall.
- `limit` — optional hard cap on how many sessions this request
  processes, applied on top of the time budget.
- `offset` — resume cursor: skip this many sessions (in sorted order)
  before processing. Pass back the `next_offset` from the previous
  response.

**Response (200):**
```json
{
  "status": "ok",
  "namespace": "default",
  "sessions_updated": 25,
  "turns_scanned": 4820,
  "models": ["claude-opus-4-8", "gpt-5.2-codex"],
  "total": 60,
  "processed": 25,
  "next_offset": 25,
  "done": false
}
```

- `total` — sessions in the namespace
- `processed` — sessions handled this request
- `sessions_updated` — of those, how many had turns to recompute from
  (a session with no stored turns is left untouched)
- `next_offset` — where to resume, or `null` when finished
- `done` — `true` once every session has been processed

**Draining a large namespace.** Loop, passing back the cursor, until
`done` is `true`:

```bash
offset=0
while :; do
  resp=$(curl -s -X POST \
    "http://localhost:3001/api/stats/backfill_by_model?offset=$offset" \
    -H "X-CTXone-Namespace: default")
  echo "$resp"
  [ "$(echo "$resp" | jq -r .done)" = "true" ] && break
  offset=$(echo "$resp" | jq -r .next_offset)
done
```

> **Turn-less sessions.** Backfill only *replaces* a session's split
> when it finds stored turns to recompute from — a session with none is
> left as-is. If such a session's stored numbers are wrong, backfill
> cannot fix them; delete the session
> (`DELETE /api/sessions/{sid}`) instead.

### `GET /api/stats/{ref_name}`

Structural stats for a branch.

**Response (200):**
```json
{
  "commit_count": 27,
  "path_count": 21,
  "branch_count": 2,
  "epoch_count": 0,
  "agents": ["ctxone", "ctxone-prime"],
  "categories": ["Checkpoint", "Custom(\"Observe\")"],
  "latest_commit": {
    "id": "sg_e762325fed96",
    "timestamp": "2026-04-14T17:47:43Z",
    "agent": "ctxone",
    "intent": "fact description"
  }
}
```

### `GET /api/namespaces/summary`

A hub-global rollup with one entry per workspace (namespace) — the data
behind the Hub Home overview. One call returns token and graph
aggregates for every workspace, so the dashboard needs no per-workspace
fan-out. Short-TTL cached (~15s) since it walks every namespace.

**Response (200):**
```json
{
  "workspaces": [
    {
      "namespace": "default",
      "session_count": 153,
      "representative_model": "gpt-5.2",
      "tokens": {
        "used": 1700,
        "saved": 5200,
        "llm_input": 5100000000,
        "llm_output": 27100000,
        "llm_cache_read": 7500000000,
        "llm_cache_create": 69500000,
        "by_model": {
          "claude-opus-4-8": { "input_tokens": 126025, "output_tokens": 1781988, "cache_read_tokens": 754047192, "cache_create_tokens": 36456103, "call_count": 214 },
          "gpt-5.4": { "input_tokens": 2497100792, "output_tokens": 6201704, "cache_read_tokens": 2373367552, "cache_create_tokens": 0, "call_count": 1412 }
        }
      },
      "graph": { "commit_count": 10000, "path_count": 10000, "branch_count": 41, "epoch_count": 0 }
    }
  ]
}
```

- `representative_model` — the workspace's most-common `last_model`,
  used only as a **label**.
- `tokens.llm_*` — the four token classes summed across the workspace's
  sessions.
- `tokens.by_model` — the same totals **split per model** (each entry is
  a `ModelUsage`, as in `GET /api/stats/sessions`).

**Cost is priced per model.** The Hub Home cost tile sums each model's
tokens at that model's own rate (input + output + cache-read +
cache-write), then adds the per-model costs — the same basis as the
workspace LLM-usage panel. Pricing the whole workspace at a single
representative model would mis-price a mixed-model workspace: one that is
mostly Opus but whose most-common model is a cheaper model would read far
too low. `by_model` is what makes the accurate, per-model figure
possible; `representative_model` is kept only for the label. (Older hubs
that predate `by_model` fall back to the single-model estimate.)

---

## Read endpoints (state)

### `GET /api/state/{ref_name}?path=<path>`

Read a value at a specific path.

**Query params:**
- `path` — JSON path to read (default: `/`)

**Response (200):** the value at that path, pretty-printed JSON.

### `GET /api/state/{ref_name}/paths?prefix=<prefix>&max_depth=<n>`

List all paths under a prefix.

**Query params:**
- `prefix` — path prefix (default: `/`)
- `max_depth` — max tree depth (default: 50)

**Response (200):** array of path strings.

```json
["/memory/licensing/abc", "/memory/architecture/def", ...]
```

### `GET /api/state/{ref_name}/search?query=<q>&max_results=<n>`

Literal substring search across values and keys.

**Query params:**
- `query` — substring to match (case-insensitive)
- `max_results` — max results (default: 50)

**Response (200):**
```json
[
  {"path": "/memory/licensing/abc", "value": "CTXone uses BSL-1.1"},
  ...
]
```

---

## Log and blame

### `GET /api/log/{ref_name}?limit=<n>`

Recent commit history.

**Query params:**
- `limit` — max commits (default: 20)

**Response (200):** array of commits. See the `log` response schema in
[CLI_REFERENCE.md](/reference/cli/#log-response).

### `GET /api/blame/{ref_name}?path=<path>`

Provenance chain for a specific path.

**Query params:**
- `path` — path to blame

**Response (200):** array of blame entries with commit id, agent,
timestamp, intent, and confidence.

### `GET /api/diff?ref_a=<a>&ref_b=<b>`

Diff two refs.

**Query params:**
- `ref_a` — first ref (usually older / base)
- `ref_b` — second ref (usually newer / target)

**Response (200):**
```json
{
  "ref_a": "main",
  "ref_b": "experiment",
  "ops": [
    {"op": "AddKey", "path": "/memory/test", "key": "abc", "value": "..."},
    {"op": "SetValue", "path": "/...", "old": {...}, "new": {...}},
    {"op": "RemoveKey", "path": "/...", "key": "..."}
  ]
}
```

Op tags: `SetValue`, `AddKey`, `RemoveKey`, `AppendItem`, `RemoveItem`.

---

## Branches

### `GET /api/branches`

List all branches.

**Response (200):**
```json
[
  {"name": "main", "id": "sg_e762..."},
  {"name": "experiment", "id": "sg_a3b1..."}
]
```

### `POST /api/branches`

Create a new branch.

**Request body:**
```json
{
  "name": "experiment",
  "from": "main",
  "if_missing": false,
  "git_branch": "feature/experiment"
}
```

- `name` (required) — branch to create
- `from` — ref to branch from (default `main`)
- `if_missing` — idempotent ensure: an already-existing branch is
  success, not an error (default `false`). Branch mirroring re-ensures
  on every CLI invocation with this flag.
- `git_branch` — optional raw git branch this ASG branch mirrors.
  Recorded once, on actual creation, as metadata at
  `/ctxone/branches/<name>/git_branch` on the `from` ref
  (sanitization is lossy: `feature/x` → `feature-x`).

**Response (200):**
```json
{
  "status": "ok",
  "name": "experiment",
  "from": "main",
  "existed": false,
  "commit_id": "sg_a3b1..."
}
```

`existed` is `true` when `if_missing` was set and the branch already
existed (in which case `commit_id` is omitted).

---

## Project endpoints

A **project** maps a code repo to an ASG namespace. The registry lives
in the Hub's sqlite database (`projects` and `project_paths` tables) —
memory/postgres backends have no registry, so project endpoints return
**400** there. Registered projects are what the CLI and MCP server use
to auto-detect the namespace from a working directory.

### `GET /api/projects`

List registered projects.

**Response (200):**
```json
[
  {
    "id": "myrepo",
    "remote_url": "https://github.com/alice/myrepo",
    "namespace": "myrepo",
    "display_name": "My Repo",
    "created_at": "2026-07-01T12:00:00Z",
    "local_paths": ["/home/alice/myrepo"],
    "asd_repos": ["myrepo"]
  }
]
```

`asd_repos` lists the pool-managed ASD repos whose db path lives under
one of the project's `local_paths`. The binding is derived, not stored —
registering an ASD repo under a project's path is what binds it.

### `POST /api/projects`

Register a project and create + initialize its ASG namespace
(idempotent — the namespace gets an initialized `main` branch so ref
operations work immediately).

**Request body:**
```json
{
  "id": "myrepo",
  "remote_url": "https://github.com/alice/myrepo",
  "namespace": "myrepo",
  "display_name": "My Repo",
  "local_path": "/home/alice/myrepo"
}
```

- `id` (required) — project id (kebab-case). Doubles as the namespace
  name unless `namespace` is given.
- `remote_url` — git remote for detection. Normalized on write:
  trailing `.git` and `/` are stripped.
- `namespace` — explicit namespace name (default: the id)
- `display_name` — human-readable name
- `local_path` — checkout path to bind

**Response (200):** the project object (same shape as `GET /api/projects`
entries). Returns **409** on a duplicate `id` or `remote_url`, **400**
on an invalid namespace name.

### `GET /api/projects/{id}`

Fetch one project. **404** if the id is unknown.

### `POST /api/projects/{id}/paths`

Bind another local checkout to the project.

**Request body:** `{ "local_path": "/home/alice/myrepo-worktree" }`

**Response (200):** the updated project object. **404** if the id is
unknown.

### `GET /api/projects/detect?cwd=/abs/path`

Run the detection chain for a directory and report which namespace a
session started there would land in:

1. `.ctxproject` file (first non-empty line = project id) in `cwd` or
   any parent
2. `git remote get-url origin` looked up in the registry (URLs
   normalized the same way as on write)

**Response (200):**
```json
{ "status": "found", "via": "ctxproject", "project_id": "myrepo", "namespace": "myrepo" }
```

`via` is `"ctxproject"` or `"remote"` (remote matches also carry
`remote_url`). No match:

```json
{ "status": "not_found", "namespace": "default" }
```

Non-sqlite backends report `{ "status": "registry_unavailable",
"namespace": "default" }`.

---

## Memory endpoints (the high-level API)

These are the endpoints CTXone's memory layer adds on top of the underlying
state primitives.

### `POST /api/memory/remember`

Store a fact.

**Request body:**
```json
{
  "fact": "CTXone uses BSL-1.1 licensing",
  "importance": "high",
  "context": "licensing",
  "tags": ["legal", "decision"],
  "ref": "main"
}
```

- `fact` (required) — the string to store
- `importance` — `high` / `medium` / `low` (default `medium`). Maps to
  confidence 0.95/0.7/0.4.
- `context` — category name; storage path is `/memory/<context>/<id>`
- `tags` — queryable tags stored on the commit
- `ref` — branch to write to (default `main`)

**Response (200):**
```json
{
  "status": "ok",
  "ref": "main",
  "path": "/memory/licensing/18a6...",
  "commit_id": "sg_e762..."
}
```

### `POST /api/memory/forget`

Delete a memory at a specific path.

**Request body:**
```json
{
  "path": "/memory/licensing/18a6...",
  "reason": "superseded by new policy",
  "ref": "main"
}
```

Marked in blame as a `Rollback` intent with the given reason.

**Response (200):**
```json
{
  "status": "ok",
  "ref": "main",
  "path": "/memory/licensing/18a6...",
  "commit_id": "sg_next..."
}
```

### `GET /api/memory/recall?topic=<t>&budget=<n>&ref=<r>`

Retrieve memories for a topic. Pinned-first, token-scored, budget-capped.

**Query params:**
- `topic` — query string (tokenized, multi-word supported)
- `budget` — max token budget (default 1500)
- `ref` — branch (default `main`)

**Response (200):** see the `recall` response schema in
[CLI_REFERENCE.md](/reference/cli/#recall-response).

Every recall updates the session token counters — each call's `sent`
contributes to `session_tokens_used` on `GET /api/stats/tokens`.

### `GET /api/memory/context/{project}?ref=<r>`

Load the full context tree for a project.

**Response (200):**
```json
{
  "project": "myproject",
  "ref": "main",
  "context": {
    "status": "active",
    "decisions": {...}
  },
  "ctx_tokens_sent": 234,
  "ctx_tokens_estimated_flat": 1191
}
```

### `POST /api/memory/prime`

Load structured sections as pinned or searchable memory.

**Request body:**
```json
{
  "source": "project",
  "pinned": true,
  "sections": [
    {"title": "The Insight", "body": "..."},
    {"title": "The Roadmap", "body": "..."}
  ],
  "ref": "main"
}
```

- `source` (required) — group name; re-priming the same source overwrites
- `pinned` — if true, always include in recall; otherwise searchable (default false)
- `sections` — parsed markdown sections from the client
- `ref` — branch (default `main`)

**Response (200):**
```json
{
  "status": "ok",
  "ref": "main",
  "source": "project",
  "pinned": true,
  "sections_written": 5,
  "paths": [
    "/memory/pinned/project/the-insight",
    "/memory/pinned/project/the-roadmap",
    ...
  ]
}
```

### `GET /api/memory/pinned`

List all pinned memories.

**Response (200):**
```json
[
  {"path": "/memory/pinned/project/the-insight/title", "value": "The Insight"},
  {"path": "/memory/pinned/project/the-insight/body", "value": "..."},
  ...
]
```

Clients typically group these by `/memory/pinned/<source>/<slug>` and pair
the `/title` and `/body` children to reconstruct structured sections.
Returns an empty array (not 404) when no pinned memories exist.

### `POST /api/memory/summarize_session`

End-of-session commit capturing what was learned.

**Request body:**
```json
{
  "session_id": "2026-04-14-afternoon",
  "key_points": ["Shipped Postgres backend", "Built auth middleware"],
  "decisions": ["SaaS as on-ramp", "agent memory is top priority"]
}
```

**Response (200):**
```json
{
  "status": "ok",
  "session_id": "2026-04-14-afternoon",
  "key_points": 2,
  "decisions": 2
}
```

### `GET /api/memory/what_changed_since?since=<iso>`

Recent commits filtered to those after a timestamp.

**Query params:**
- `since` — ISO 8601 timestamp (e.g., `2026-04-12T00:00:00Z`)

**Response (200):** array of commit summaries.

### `GET /api/memory/why_did_we?decision=<text>`

Search for a decision and return its blame chain.

**Query params:**
- `decision` — substring of the decision to look up

**Response (200):**
```json
{
  "decision": "use BSL-1.1",
  "traces": [
    {
      "path": "/memory/licensing/abc",
      "blame": [...]
    }
  ]
}
```

---

## Error responses

| Status | Meaning | Example body |
|--------|---------|--------------|
| 400 | Malformed request (missing required field, invalid namespace name) | `"missing field \`fact\`"` |
| 403 | Cross-namespace merge denied | `"cross-namespace merge denied: ..."` |
| 404 | Path, ref, or namespace not found | `"ref not found: experiment"` |
| 409 | Conflict (duplicate project id / remote_url) | `"UNIQUE constraint failed: projects.id"` |
| 500 | Internal error (storage, engine) | `"tree error: ..."` |

The body is plain text, not JSON. Clients should log and retry on 5xx.

---

## Rate limiting

The Hub enforces a **per-peer-IP token-bucket rate limit** in HTTP mode.
Default: **600 requests/minute per IP** (permissive — catches runaway
loops without bothering real agents).

Clients that exceed the bucket get:

```
HTTP/1.1 429 Too Many Requests
Retry-After: 3
X-RateLimit-Limit: 600
X-RateLimit-Remaining: 0
```

Configure via `--rate-limit-rpm <N>` or the `CTXONE_RATE_LIMIT_RPM` env
var. `0` disables rate limiting entirely. See
[docs/TROUBLESHOOTING.md#rate-limiting](/operating/troubleshooting/#rate-limiting)
for details.

## Per-session token tracking

Send `X-CTXone-Session: <id>` on any request to have its token usage
counted under that session. Absent the header, usage rolls up under
the `"default"` session. Per-session stats are exposed via:

- `GET /api/stats/tokens/{session_id}` — single-session snapshot
- `GET /api/stats/sessions` — all sessions
- `GET /api/stats/tokens` — cross-session aggregate (backward-compat)

The Python client accepts a `session_id` constructor arg or reads
`CTX_SESSION_ID` from the environment.

## Per-tool agent IDs

Send `X-CTXone-Agent: <name>` on any write request
(`remember`/`forget`/`prime`/`summarize_session`/`merge`) to stamp
the commit with that agent ID. `ctx blame` and `/api/log/{ref}`
responses surface this as `agent_id`, so you can tell which tool
wrote each fact.

Absent the header, commits are attributed to `"ctxone"`. The Python
client accepts an `agent_id` constructor arg or reads `CTX_AGENT_ID`
from the environment; the Hub binary accepts `--agent-id <name>`
for MCP stdio mode (which is what `ctx init` wires into the
generated `.mcp.json` / `.cursor/mcp.json` etc).

See [docs/TROUBLESHOOTING.md#per-tool-agent-ids](/operating/troubleshooting/#per-tool-agent-ids)
for the full resolution order and examples.

## Plan endpoints

All plan endpoints live under `/api/plans/*` and honor
`X-CTXone-Agent` for blame attribution + `X-CTXone-Session` for stats.
A `ref` query parameter selects the branch (default `main`).

### `POST /api/plans`

Create a plan.

```
POST /api/plans
{
  "name": "website-v2",
  "description": "Brand pivot",
  "ref": "main"
}
→ 201 Created
{
  "name": "website-v2",
  "description": "Brand pivot",
  "status": "active",
  "created_by": "claude-code",
  "created_at": "2026-04-16T…",
  "task_counts": { "pending": 0, "in_progress": 0, "done": 0, "abandoned": 0, "total": 0 }
}
→ 409 Conflict  (plan already exists)
```

### `GET /api/plans?ref=main&status=active`

List plans on a branch, optionally filtered by status. Response body
is a JSON array of plan objects.

### `GET /api/plans/{name}?ref=main`

Fetch one plan with its full `tasks[]` list.

### `DELETE /api/plans/{name}?ref=main`

Remove a plan destructively. Use `POST /api/plans/{name}/archive` for
a soft, reversible alternative.

### `POST /api/plans/{name}/tasks`

Add a task. Body fields:

| Field | Type | Required |
|-------|------|----------|
| `title` | string | yes |
| `description` | string | no |
| `priority` | `low`/`medium`/`high`/`critical` | no |
| `parent_id` | string | no (subtask support) |
| `assigned_to` | string | no — agent id |
| `blocked_by` | string[] | no |
| `ref` | string | no |

Returns the created task on `201`.

### `GET /api/plans/{name}/tasks?ref=main`

List tasks in a plan, flat.

### `GET /api/plans/{name}/tasks/{task_id}?ref=main`

Fetch a single task.

### `POST /api/plans/{name}/tasks/{task_id}/start`

Transition `pending → in_progress`. Returns the updated task. Returns
`409 Conflict` if blockers aren't done.

### `POST /api/plans/{name}/tasks/{task_id}/complete`

Transition `in_progress → done` with a proof:

```
{ "proof": { "kind": "commit", "value": "ef6ce63" } }
```

Proof `kind` is one of `commit` / `file` / `test` / `text`. Returns
`400 Bad Request` when the proof value is empty or the kind is
unknown.

### `POST /api/plans/{name}/tasks/{task_id}/abandon`

Body: `{ "reason": "superseded" }`. Reason is required (empty
reasons return `400`).

### `POST /api/plans/{name}/archive`

Soft-archive a plan.

### `GET /api/plans/{name}/next?ref=main&assigned_to=me&include_unassigned=true&assigned_only=false`

Return the highest-priority pickable task wrapped as
`{ "task": { … } }` or `{ "task": null }`. Pass `assigned_to=me` to
filter to tasks assigned to the agent carried by `X-CTXone-Agent` —
this is the state-driven orchestration primitive.

---

## Epoch endpoints (sealed checkpoints)

Completing a plan automatically seals a per-workspace **epoch** — a
tamper-evident, point-in-time snapshot of the workspace's memory graph at
plan close. These endpoints view and download them.

### `POST /api/plans/backfill_epochs`

One-time retroactive seal of an epoch for every already-`Completed` plan in
the workspace, so existing workspaces show checkpoints without waiting to
re-close plans. Idempotent (skips plans already sealed); safe to re-run.
Scoped to the request namespace (`X-CTXone-Namespace`).

**Response (200):**
```json
{ "status": "ok", "namespace": "default", "sealed": 12, "already_sealed": 0, "failed": 0 }
```

### `GET /api/epochs`

The sealed checkpoints for this workspace, newest-sealed first. Pass
`?all=true` for the hub-wide view (every workspace, each row tagged with its
`namespace`).

**Response (200):**
```json
{
  "epochs": [
    {
      "id": "plan:default:website-v2",
      "namespace": "default",
      "plan": "website-v2",
      "status": "Sealed",
      "created_at": "2026-08-25T04:44:52Z",
      "sealed_at": "2026-08-25T19:30:43Z",
      "commit_count": 14577
    }
  ]
}
```

- `id` — the epoch id, `plan:<namespace>:<plan-id>`.
- `plan` — the plan whose completion sealed it.
- `commit_count` — the number of commits captured in the seal
  (`sealed_commits`).

> ASG epochs live in one global table, so the Hub attributes each to its
> workspace by the `plan:<namespace>:` id prefix.

### `GET /api/epochs/{id}/export`

Download one sealed epoch's audit bundle (epoch metadata + the sealed-commit
manifest) as a JSON attachment. Pass the epoch's own namespace via
`?namespace=<ns>`.

```bash
curl -OJ "http://localhost:3001/api/epochs/plan:default:website-v2/export?namespace=default"
```

Returns `Content-Disposition: attachment` so a browser download works; the
id must be a `plan:` epoch, or the request is rejected (**400**), and an
unknown id returns **404**.

---

## Reminder endpoints

Pull-based scheduling. All reminder endpoints live under `/api/reminders/*`.
Reminders are persisted to SQLite (same database as memory).

### `POST /api/reminders`

Create a reminder.

```
POST /api/reminders
X-CTXone-Agent: claude-code

{
  "title": "Check feature flag rollout",
  "instructions": "Query the metrics dashboard and report adoption %.",
  "due_at": "2026-05-10T09:00:00Z",
  "priority": "medium",
  "autonomous": false
}
```

→ 201 Created with the reminder JSON.

### `GET /api/reminders`

List reminders. Accepts query params: `status`, `priority_at_most`,
`created_by`, `due_before`, `ref_id`, `tags`.

### `GET /api/reminders/due`

Return all actionable reminders (`due` or `awaiting_permission`),
ordered by priority. Lazily promotes pending reminders whose `due_at`
has passed.

### `GET /api/reminders/{id}`

Get a single reminder by id.

### `POST /api/reminders/{id}/snooze`

Defer to a later time. Body: `{ "until": "<ISO 8601>" }`.

### `POST /api/reminders/{id}/approve`

Approve a non-autonomous reminder. Body: `{ "approved_by"?: "..." }`.

### `POST /api/reminders/{id}/cancel`

Cancel permanently.

### `POST /api/reminders/{id}/start`

Mark in-progress. Body: `{ "agent_id"?: "..." }`.

### `POST /api/reminders/{id}/record`

Record execution outcome. Body: `{ "result": "success|failed|deferred|snoozed|cancelled", "notes"?: [...], "task_id"?: "...", "agent_id"?: "..." }`.

---

## Authentication

The HTTP API currently has **no authentication**. Run the Hub on a
trusted network (loopback, VPN, or private subnet) or put a reverse
proxy in front with whatever auth layer you already use.

Multi-tenant auth is tracked as future work — see the engine's
`agentstategraph-mcp` binary, which supports `--auth` and `--keys-file`
for tenant isolation. CTXone Hub doesn't currently expose these.

---

## See also

- [CLI_REFERENCE.md](/reference/cli/) — the `ctx` CLI, which wraps this API
- [MCP_TOOLS.md](/reference/mcp-tools/) — the MCP tools, which wrap the same underlying logic
- [ARCHITECTURE.md](/how-it-works/architecture/) — how recall ranks, how the graph is structured
