# CTXone — Documentation & Install

Persistent, searchable, accountable memory for AI agents. Eliminate
context anxiety.

This repository hosts the **public documentation, install scripts, and
release binaries** for CTXone. The source is maintained in a separate
private repository during the pre-release period.

## Install

**macOS / Linux** (one-liner):

```bash
curl -sSL https://raw.githubusercontent.com/ctxone/ctxone-docs/main/install.sh | sh
```

**Windows** (PowerShell, one-liner):

```powershell
iwr https://raw.githubusercontent.com/ctxone/ctxone-docs/main/install.ps1 | iex
```

Full Windows guide with background-service setup, AI tool paths,
updates, and troubleshooting: [WINDOWS.md](WINDOWS.md).

**Docker** (any platform — multi-arch `linux/amd64` + `linux/arm64`):

```bash
docker run -p 3001:3001 -v ctxone-data:/data ghcr.io/ctxone/ctxone:latest
```

**Python client**:

```bash
pip install ctxone
```

## Documentation

### Getting started
- [5-minute quickstart](QUICKSTART.md) — from install to live token
  savings in 5 minutes
- [Windows install + service setup](WINDOWS.md)
- [Troubleshooting](TROUBLESHOOTING.md)

### Using CTXone
- [CLI reference](CLI_REFERENCE.md)
- [MCP tools reference](MCP_TOOLS.md)
- [HTTP API reference](HTTP_API.md)
- [Cookbook — common patterns](COOKBOOK.md)
- [Priming agents with AGENTS.md](AGENTS.md)

### How it works
- [Architecture](ARCHITECTURE.md)
- [Memory MCP design](MEMORY_MCP_DESIGN.md)
- [Token economics — why it's cheaper](TOKEN_ECONOMICS.md)
- [Token savings — measured results](TOKEN_SAVINGS.md)

### Integrations
- [AI coding tools (Claude Code, Cursor, Codex, Gemini…)](INTEGRATIONS.md)
- [Open WebUI](OPENWEBUI.md)

### Why CTXone
- [Vision](VISION.md)
- [Context anxiety — the problem we name](CONTEXT_ANXIETY.md)
- [Use cases](USE_CASES.md)

## Support

- Issues, questions, feedback: [open an issue](https://github.com/ctxone/ctxone-docs/issues)
- Python package: [pypi.org/project/ctxone](https://pypi.org/project/ctxone/)
- Docker image: [ghcr.io/ctxone/ctxone](https://github.com/ctxone/ctxone-docs/pkgs/container/ctxone)

## License

CTXone is distributed under Business Source License 1.1, converting to
Apache 2.0 four years after each release. See [LICENSE](LICENSE) for
the full text.

