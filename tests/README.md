# Tests

Tests cover CLI parsing, service/action behavior, plugin contracts, template invariants, and live MCP HTTP integration.

## Running tests

```bash
# All Rust tests (recommended)
cargo nextest run

# Standard cargo test
cargo test

# CI profile (fail-fast, retries as configured in nextest)
cargo nextest run --profile ci

# End-to-end MCP integration (requires a running server + mcporter)
# Terminal 1:
just dev
# Terminal 2:
bash tests/mcporter/test-mcp.sh

# Template contract checks
just template-check

# Protected MCP auth smoke (requires running bearer-auth server)
YARR_MCP_TOKEN=<token> just auth-smoke

# Full release-readiness gate
scripts/pre-release-check.sh
```

---

## Test files

### `cli_parse.rs` — CLI argument parsing

Unit tests for CLI flag parsing. These do not require async runtime, credentials, or a running server.

Add tests here when adding or changing CLI flags.

### `tool_dispatch.rs` — Service/action behavior

Tests MCP action behavior below HTTP. These use `yarr::testing::loopback_state()`, root-level action/parser re-exports, and the stub `YarrClient`, so no real credentials or upstream service are required.

Current checks assert semantic behavior for `service_status`, `api_get`, `api_post`/`api_delete` parsing (including that a resolved generic route dispatches immediately with no confirm param), schema/action exposure, and MCP actions returning JSON objects.

> Yarr rule: add one semantic test per business action. Assert response values, not only JSON validity.

### `plugin_contract.rs` — Plugin package contract

Tests Claude, Codex, and Gemini plugin package surfaces:

- manifests exist and stay aligned
- connection settings point at the shared MCP config
- hook setup delegates to the binary-owned setup command
- plugin setup repair/audit behavior is stable
- plugin manifests stay versionless

### `template_invariants.rs` — Portable automation contract

Rust tests that make template automation visible and hard to drift:

- portable scripts are executable and documented
- expected Just recipes remain present
- plugin manifests do not have explicit versions
- generated schema docs name the known action surface

### `mcporter/test-mcp.sh` — Live MCP integration

Bash script that hits a running server over HTTP using `mcporter` for tool calls and, when supported by the installed mcporter version, resource reads. It falls back to JSON-RPC `resources/read` for older mcporter versions.

```bash
# Run all suites sequentially
bash tests/mcporter/test-mcp.sh

# Run suites in parallel (faster, output interleaved)
bash tests/mcporter/test-mcp.sh --parallel

# Verbose raw output
bash tests/mcporter/test-mcp.sh --verbose

# Default target is http://localhost:40070/mcp (the `just dev` port).
# Override target when testing another deployment:
YARR_MCP_HOST=127.0.0.1 YARR_MCP_PORT=3100 bash tests/mcporter/test-mcp.sh
```

Prerequisites:

| Tool | Purpose |
|---|---|
| `mcporter` | MCP tool/resource client. |
| `curl` | Health/auth smoke and JSON-RPC fallback. |
| `jq` | Shell JSON checks. |
| `python3` | Portable JSON parsing. |

Suites:

| Suite | What it validates |
|---|---|
| `suite_auth` | Missing and bad bearer tokens return `401` when `YARR_MCP_TOKEN` is set. |
| `suite_core` | `service_status`, `api_get`, `codemode`, and `help` return semantically correct values. |
| `suite_schema_resource` | `yarr://schema/mcp-tool` resolves and contains a valid tool schema with `inputSchema.properties.action`. |

The script logs all calls to `/tmp/test-mcp.<timestamp>.log`.

> Live-test rule: adapt `suite_core` and resource assertions when adding service-specific actions or resources. Confirmed mutating live actions belong on disposable test stacks and must assert observable state changes plus cleanup. Reserve "destructive" for permanent loss of hard-to-recreate data.

---

## Test helpers

`src/lib.rs` keeps implementation modules private and exposes test helpers under `yarr::testing`:

| Helper | Returns | Use for |
|---|---|---|
| `loopback_state()` | `AppState` | No-auth, stub client tests. |
| `bearer_state(token)` | `AppState` | Mounted bearer-auth route tests. |

The stub client points at `http://localhost:1/stub`, so service-layer tests remain deterministic and do not contact a real upstream.

---

## Design principles

- **Semantic assertions:** check correct data, not just parseable JSON.
- **Explicit defaults:** assert documented defaults such as generic routes dispatching immediately with no confirm param — destructive confirmation is elicited by the MCP transports only when the resolved reviewed operation is `Destructive`, never a call argument.
- **Layered coverage:** parse CLI in CLI tests, service logic in service tests, HTTP behavior in route/live tests.
- **Auth-aware:** auth tests skip or adjust when credentials are intentionally absent.
- **Resource coverage:** MCP resources are part of the public contract and should be tested alongside tools.
