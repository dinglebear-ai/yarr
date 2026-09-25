---
title: "Testing"
created: 2026-05-22
updated: 2026-07-30
---

---
title: "Testing"
doc_type: "guide"
status: "active"
owner: "yarr"
audience: ["contributors", "agents"]
scope: "project"
source_of_truth: false
last_reviewed: "2026-07-16"
---

# Testing

## Local quality gates

```bash
cargo fmt --all -- --check
cargo clippy --all-targets -- -D warnings
cargo nextest run --profile ci
RUSTDOCFLAGS='-D warnings' cargo doc --workspace --all-features --no-deps
cargo xtask patterns
cargo xtask check-test-siblings
cargo xtask tool-docs --check
python3 scripts/check-schema-docs.py --check
```

`cargo test` is a supported fallback when nextest is unavailable. CI also runs
Taplo, cargo-deny, gitleaks, npm package checks, actionlint, plugin/layout
contracts, blob/coupled-file checks, and the MSRV workflow.

## Test layout

Private unit tests use sibling modules: `src/foo.rs` declares
`#[path = "foo_tests.rs"] mod tests;`, and `src/foo_tests.rs` contains the
tests. The sibling checker enforces this for hand-written source.

Repository integration tests currently are:

| File | Contract |
|---|---|
| `tests/cli_parse.rs` | CLI parsing and command shapes |
| `tests/tool_dispatch.rs` | Action dispatch and service behavior |
| `tests/parity.rs` | Registered CLI/MCP action parity |
| `tests/plugin_contract.rs` | Plugin/package contract |
| `tests/template_invariants.rs` | Repository invariants |
| `tests/live/service_matrix.json` | Live service inventory data |
| `tests/mcporter/test-mcp.sh` | Thin wrapper around the live mcporter suite |

There is no `tests/e2e_tests.rs`, `tests/live_tests.rs`, or generated
`docs/contracts/` fixture tree. Live harness source lives under `xtask/src/live/`
with sibling tests in `xtask/src/live_tests.rs` and selected live submodules.

## Live shart harness

Live testing is opt-in and guarded to the disposable shart stack. The canonical
entry point is:

```bash
cargo xtask live --suite guard
cargo xtask live --suite all
```

Supported slices are:

```text
guard, cli, rest, mcp, mcporter, services, contract, lifecycles,
all, coverage-check, coverage-write
```

Examples:

```bash
cargo xtask live --suite cli
cargo xtask live --suite mcp
cargo xtask live --suite mcporter
cargo xtask live --suite contract
cargo xtask live --suite lifecycles
cargo xtask live --suite coverage-check
```

There is no `cargo xtask live-contracts` command. The generated-operation slice
is `cargo xtask live --suite contract`; the MCP callable slice is
`cargo xtask live --suite mcporter`.

The guard requires `YARR_HOME=/home/jmagar/.yarr-shart`, all 11 service kinds,
and upstream hosts on the disposable shart target. Unless `YARR_BIN` is set,
the harness builds and runs `target/debug/yarr` from the current checkout.

The `contract` suite verifies the generated executor's supported transport
behavior. Generator tests separately prove that unsupported operations are
excluded with explicit reasons in the runtime-derived capability matrix. See
`docs/API.md` for the support boundary.

## Destructive-test policy

Destructive MCP production calls require elicitation. Live lifecycle tests are
different: they operate only on the disposable guarded stack and must establish
their own reset/cleanup contract. Use `--no-destructive` when a suite supports
skipping mutation. Never point the live harness at production service URLs or
the normal `~/.yarr` data directory.

## Assertions

Assert semantic payloads, exact failure classes, or observable before/after
state. A 2xx response alone is not sufficient evidence that an upstream action
worked. Keep regression tests in the smallest layer that proves the behavior,
and add a live case only when the bug depends on a real upstream contract.
