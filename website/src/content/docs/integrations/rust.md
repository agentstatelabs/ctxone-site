---
title: "Rust"
description: "Talk to the CTXone Hub from Rust. There's no separate crate to install — the Hub speaks a plain JSON REST API, so a few reqwest calls give a Rust program the same remember / recall / search / blame that agents get over MCP."
sidebar:
  order: 4
---

CTXone doesn't ship a Rust client crate, and it doesn't need to. The Hub
exposes everything over a plain JSON **HTTP API**, so any Rust program can
read and write the memory graph with `reqwest` and `serde` — the same
`remember` / `recall` / `search` / `blame` that AI tools get over MCP.

Use this when you want a Rust service, CLI, or build step to participate in
the same context graph your agents use — writing facts a human or a
pipeline discovered, or reading context into a Rust-based tool.

## Prerequisites

1. **A running Hub with the HTTP API enabled.** Start one with:

   ```bash
   ctx serve --http
   ```

   The REST API is served under `http://<host>:<port>/api/` (default
   `0.0.0.0:3001`). If the Hub is network-exposed, guard it with a bearer
   token (`--auth-token`); loopback is exempt.

2. **A Rust project** with these dependencies:

   ```toml
   # Cargo.toml
   [dependencies]
   reqwest = { version = "0.12", features = ["json"] }
   serde = { version = "1", features = ["derive"] }
   serde_json = "1"
   tokio = { version = "1", features = ["macros", "rt-multi-thread"] }
   ```

## A minimal client

A small wrapper over `reqwest::Client` that carries the base URL, an
optional bearer token, and a namespace. (A **namespace** isolates a
graph — branches, memory, plans, taints — and usually maps to one repo.
Omit it to use `default`.)

```rust
use serde::{Deserialize, Serialize};

#[derive(Clone)]
pub struct Ctxone {
    base: String,
    namespace: String,
    token: Option<String>,
    http: reqwest::Client,
}

impl Ctxone {
    pub fn new(base: impl Into<String>) -> Self {
        Self {
            base: base.into(),
            namespace: "default".into(),
            token: None,
            http: reqwest::Client::new(),
        }
    }

    pub fn namespace(mut self, ns: impl Into<String>) -> Self {
        self.namespace = ns.into();
        self
    }

    pub fn token(mut self, token: impl Into<String>) -> Self {
        self.token = Some(token.into());
        self
    }

    // Attach the auth + namespace headers every request shares.
    fn prepare(&self, rb: reqwest::RequestBuilder) -> reqwest::RequestBuilder {
        let rb = rb.header("X-CTXone-Namespace", &self.namespace);
        match &self.token {
            Some(t) => rb.bearer_auth(t),
            None => rb,
        }
    }
}
```

## Remember a fact

`POST /api/memory/remember`. `importance` is `high` / `medium` / `low`
and maps to a confidence score; `context` becomes the storage category.

```rust
#[derive(Serialize)]
struct RememberReq<'a> {
    fact: &'a str,
    importance: &'a str,
    context: &'a str,
    tags: &'a [&'a str],
    #[serde(rename = "ref")]
    reference: &'a str,
}

#[derive(Deserialize, Debug)]
pub struct RememberResp {
    pub status: String,
    pub path: String,
    pub commit_id: String,
}

impl Ctxone {
    pub async fn remember(
        &self,
        fact: &str,
        importance: &str,
        context: &str,
        tags: &[&str],
    ) -> reqwest::Result<RememberResp> {
        let url = format!("{}/api/memory/remember", self.base);
        let body = RememberReq { fact, importance, context, tags, reference: "main" };
        self.prepare(self.http.post(url).json(&body))
            .send()
            .await?
            .error_for_status()?
            .json()
            .await
    }
}
```

## Recall by topic

`GET /api/memory/recall?topic=<t>&budget=<n>`. Recall is pinned-first,
token-scored, and budget-capped — you get the relevant slice, not the
whole graph, plus the live savings ratio.

```rust
#[derive(Deserialize, Debug)]
pub struct RecallResp {
    pub results: Vec<serde_json::Value>,
    pub ctx_tokens_sent: u32,
    pub ctx_tokens_estimated_flat: u32,
    pub ctx_savings_ratio: f64,
    pub pinned_count: u32,
    pub topic_matches: u32,
}

impl Ctxone {
    pub async fn recall(&self, topic: &str, budget: u32) -> reqwest::Result<RecallResp> {
        let url = format!("{}/api/memory/recall", self.base);
        self.prepare(
            self.http
                .get(url)
                .query(&[("topic", topic), ("budget", &budget.to_string())]),
        )
        .send()
        .await?
        .error_for_status()?
        .json()
        .await
    }
}
```

## Search and blame

`GET /api/state/{ref}/search` is a literal substring search over paths and
values (no budget). `GET /api/blame/{ref}?path=<p>` returns the provenance
chain for a path — who wrote it, when, and why.

```rust
impl Ctxone {
    pub async fn search(&self, query: &str, max_results: u32) -> reqwest::Result<serde_json::Value> {
        let url = format!("{}/api/state/main/search", self.base);
        self.prepare(self.http.get(url).query(&[
            ("query", query),
            ("max_results", &max_results.to_string()),
        ]))
        .send().await?.error_for_status()?.json().await
    }

    pub async fn blame(&self, path: &str) -> reqwest::Result<serde_json::Value> {
        let url = format!("{}/api/blame/main", self.base);
        self.prepare(self.http.get(url).query(&[("path", path)]))
            .send().await?.error_for_status()?.json().await
    }
}
```

## Putting it together

```rust
#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    // Loopback hub, no token needed. For a remote hub:
    //   Ctxone::new("https://ctx.internal:3001").token(std::env::var("CTX_TOKEN")?)
    let ctx = Ctxone::new("http://127.0.0.1:3001").namespace("my-service");

    let saved = ctx
        .remember(
            "The Rust build pins the toolchain in rust-toolchain.toml",
            "high",
            "build",
            &["rust", "ci"],
        )
        .await?;
    println!("stored at {} ({})", saved.path, saved.commit_id);

    let hits = ctx.recall("build toolchain", 1500).await?;
    println!(
        "recall: {} results, {}x savings",
        hits.results.len(),
        hits.ctx_savings_ratio
    );

    Ok(())
}
```

## Notes

- **Errors.** The API returns `4xx` for bad input and `5xx` for server
  errors, with a plain-text body. `.error_for_status()?` surfaces those as
  `reqwest` errors; read `.text()` first if you want the message.
- **Namespaces.** The `X-CTXone-Namespace` header (or a `?namespace=`
  query param) scopes every ref-touching call. Cross-namespace merges are
  denied by default.
- **Branches.** Every write and read takes a `ref` (default `main`). Pass a
  branch name to sandbox speculative context, then diff and merge it.
- **More than memory.** The same API exposes plans (`/api/plans/*`), taint,
  history (`/api/log`, `/api/diff`), and token stats. See the full surface
  in the [HTTP API reference](/reference/http-api/).

## Prefer MCP?

If your Rust program is itself an agent host, you can instead connect to
the Hub as an **MCP server** over Streamable HTTP at `/mcp` and call the
tools directly. The REST API shown here is the simpler path for a plain
service that just needs to read and write context.
