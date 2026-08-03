# yarr Fleet Support Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver seven stacked pull requests that make yarr safe and practical for a 20-instance Plex/Tautulli fleet without increasing its single-tool MCP schema cost.

**Architecture:** Keep configuration, authorization, discovery, fanout, and observability as separate application-layer units. Generated-operation mutation metadata becomes the common safety source; fleet Code Mode calls compile to host-dispatched plans so authorization, bounded concurrency, timeout, truncation, and stable ordering happen outside QuickJS.

**Tech Stack:** Rust 2024, MSRV 1.97.1, `rmcp = "=3.0.0-beta.2"`, Tokio, reqwest, rquickjs, serde, TOML/YAML, axum-prometheus, sibling `*_tests.rs` modules.

## Global Constraints

- Preserve one `yarr` MCP tool in Code Mode and flat MCP parity.
- Keep environment configuration authoritative for secret values.
- Never accept or write inline fleet-file credentials.
- Preserve CLI/MCP thin shims; business logic belongs in `src/app*`.
- Every destructive fleet authorization completes before the first upstream call.
- Results and generated artifacts must be deterministic and credential-redacted.
- Run `cargo fmt --check`, `cargo clippy -- -D warnings`, `cargo test`, `cargo test --test parity`, and `python3 scripts/check-doc-links.py` on every stacked head.

---

### Task 1: PR 1 — Generated-operation safety and fleet authority policy

**Files:**
- Create: `src/openapi/safety.rs`
- Create: `src/openapi/safety_tests.rs`
- Modify: `src/openapi.rs`
- Modify: `src/config/mcp.rs`
- Modify: `src/config.rs`
- Modify: `src/config/services.rs`
- Modify: `src/mcp/rmcp_server.rs`
- Modify: `src/mcp/rmcp_server_definitions.rs`
- Modify: `src/mcp/tools.rs`
- Modify: `src/mcp/elicit.rs`
- Modify: `src/mcp/*_tests.rs`
- Modify: `xtask/src/tool_docs.rs`
- Modify: `docs/TOOLS_ACTIONS_ENDPOINTS.md`
- Modify: `docs/CONFIG.md`
- Modify: `docs/ENV.md`
- Modify: `CHANGELOG.md`

**Interfaces:**
- Produces: `OperationSafety`, `operation_safety(kind, op)`, `classify_operation(kind, spec)`, `validate_generated_write_classification()`.
- Produces: `YarrConfig::is_readonly(name)`, `McpConfig.destructive_fanout_max: usize`.
- Produces: `gate_destructive(peer, action, services: &[String])` with one aggregate prompt.

- [ ] **Step 1: Add failing table-driven classification tests**

```rust
#[test]
fn plex_non_delete_high_impact_ops_are_destructive() {
    for op in ["terminate_session", "edit_metadata_item", "refresh_section",
        "scan", "stop_all_refreshes", "add_section", "edit_section"] {
        assert_eq!(classify_operation(ServiceKind::Plex, op), OperationSafety::Destructive);
    }
}

#[test]
fn every_generated_write_has_an_explicit_decision() {
    assert_eq!(validate_generated_write_classification(), Ok(()));
}
```

- [ ] **Step 2: Run the focused tests and confirm the new symbols are absent**

Run: `cargo test openapi::safety_tests -- --nocapture`
Expected: compilation fails because `OperationSafety` and classification functions do not exist.

- [ ] **Step 3: Implement declarative safety rows and DELETE fallback**

```rust
pub enum OperationSafety { Read, Mutating, Destructive }
pub struct OperationSafetyRow { pub kind: ServiceKind, pub op: &'static str, pub safety: OperationSafety }

pub fn operation_safety(kind: ServiceKind, spec: &OperationSpec) -> Option<OperationSafety> {
    if spec.method.is_delete() { return Some(OperationSafety::Destructive); }
    OPERATION_SAFETY_ROWS.iter().find(|row| row.kind == kind && row.op == spec.name).map(|row| row.safety)
}
```

Populate rows by auditing every non-GET/HEAD operation for Plex, Sonarr, Radarr,
Overseerr, and Jellyfin. Treat DELETE as destructive even when absent from rows;
require all other writes to have a row.

- [ ] **Step 4: Add failing read-only and aggregate-elicitation tests**

```rust
#[test]
fn readonly_names_are_case_insensitive() {
    let cfg = config_with_readonly(["plex_den"]);
    assert!(cfg.is_readonly("PLEX_DEN"));
}

#[test]
fn aggregate_prompt_names_every_target() {
    let message = confirm_message("terminate_session", &["plex_4k".into(), "plex_den".into()]);
    assert!(message.contains("2 instances"));
    assert!(message.contains("plex_4k, plex_den"));
}
```

- [ ] **Step 5: Implement instance write policy and fanout cap configuration**

Parse `YARR_FLEET_READONLY` as normalized configured names and
`YARR_MCP_DESTRUCTIVE_FANOUT_MAX` as a positive integer defaulting to `3`.
Reject unknown read-only names after merged service validation. Apply read-only
checks to generic writes, curated mutating actions, and generated writes before
dispatch.

- [ ] **Step 6: Replace method-only MCP checks with safety classification**

Both outer flat-mode and inner Code Mode operation checks call the same
`operation_safety` function. Pass a sorted target slice to elicitation; reject a
destructive target list larger than the cap before prompting.

- [ ] **Step 7: Generate and verify the write-classification report**

Extend `cargo xtask tool-docs` with columns for method, mutation class, and
elicitation. Make `--check` return an error containing kind and operation for any
unclassified generated write.

Run: `cargo xtask tool-docs && cargo xtask tool-docs --check`
Expected: generated docs are current and the classification coverage check passes.

- [ ] **Step 8: Run PR 1 gates and commit**

```bash
cargo fmt --check
cargo clippy -- -D warnings
cargo test
cargo test --test parity
python3 scripts/check-doc-links.py
git add src xtask docs CHANGELOG.md
git commit -m "feat: gate destructive generated operations"
```

---

### Task 2: PR 2 — Multi-instance validation and documentation

**Files:**
- Modify: `src/config/services.rs`
- Modify: `src/config/services_tests.rs`
- Modify: `src/codemode/proxy.rs`
- Modify: `src/codemode/proxy_tests.rs`
- Modify: `README.md`
- Modify: `docs/CONFIG.md`
- Modify: `docs/ENV.md`
- Modify: `CHANGELOG.md`

**Interfaces:**
- Produces: `validate_service_identities(&[ServiceConfig]) -> anyhow::Result<()>`.
- Produces: public crate-private `CODEMODE_RESERVED_GLOBALS` used by config and proxy generation.

- [ ] **Step 1: Write reserved-name and environment-namespace collision tests**

```rust
#[test]
fn reserved_codemode_global_fails_configuration() {
    let error = validate_service_identities(&[service("console", ServiceKind::Plex)]).unwrap_err();
    assert!(error.to_string().contains("reserved Code Mode global"));
}

#[test]
fn normalized_env_names_must_be_unique() {
    let error = validate_service_identities(&[service("plex-den", ServiceKind::Plex), service("plex_den", ServiceKind::Plex)]).unwrap_err();
    assert!(error.to_string().contains("YARR_PLEX_DEN_*"));
}
```

- [ ] **Step 2: Run focused tests and observe failure**

Run: `cargo test config::services::tests`
Expected: failure because startup-wide identity validation is absent.

- [ ] **Step 3: Centralize validation and remove proxy's silent skip**

Call `validate_service_identities` after all configuration sources load. Keep a
defensive assertion in `render_service_namespaces`, because invalid service names
must never reach preamble generation.

- [ ] **Step 4: Add complete multi-instance documentation**

Document explicit kind override, normalization collisions, underscore preference,
`globalThis["plex-den"]`, ambiguous bare-kind errors, and every reserved global.
Cross-link README and ENV to the CONFIG section.

- [ ] **Step 5: Verify and commit PR 2**

Run the global gates, then commit with `docs: document and validate service identities`.

---

### Task 3: PR 3 — Additive fleet configuration files

**Files:**
- Create: `src/config/fleet_file.rs`
- Create: `src/config/fleet_file_tests.rs`
- Modify: `src/config.rs`
- Modify: `src/config/services.rs`
- Modify: `Cargo.toml`
- Modify: `docs/CONFIG.md`
- Modify: `docs/ENV.md`
- Modify: `.env.example`
- Modify: `CHANGELOG.md`

**Interfaces:**
- Produces: `FleetDocument { services: Vec<FleetServiceEntry> }`.
- Produces: `load_fleet_file(path: &Path) -> Result<Vec<ServiceConfig>>`.
- Produces: `merge_service_sources(file, env) -> Result<Vec<ServiceConfig>>`.
- Preserves discovery metadata: `client_identifier`, `plex`, and `relay_only`.

- [ ] **Step 1: Add YAML/TOML parse and inline-secret rejection tests**

```rust
#[test]
fn yaml_resolves_token_indirection() {
    let doc = "services:\n  - name: plex_den\n    kind: plex\n    url: http://plex:32400\n    token_env: PLEX_DEN_TOKEN\n";
    assert_eq!(parse_fleet(doc, FleetFormat::Yaml).unwrap().services[0].token_env.as_deref(), Some("PLEX_DEN_TOKEN"));
}

#[test]
fn inline_secret_is_rejected_with_entry_location() {
    let error = parse_fleet("services:\n  - name: plex_den\n    kind: plex\n    url: x\n    token: secret\n", FleetFormat::Yaml).unwrap_err();
    assert!(error.to_string().contains("plex_den"));
    assert!(error.to_string().contains("token"));
}
```

- [ ] **Step 2: Add dependencies and strict models**

Use `serde_yaml` for YAML and existing `toml` for TOML. Apply
`#[serde(deny_unknown_fields)]` to entries so inline credential names are
rejected. Validate environment reference names with `[A-Za-z_][A-Za-z0-9_]*`.

- [ ] **Step 3: Add merge-precedence and 24-instance tests**

Assert environment entries replace file entries by case-insensitive configured
name, all unique entries remain, duplicates within a source fail, and the final
list is deterministically sorted by name.

- [ ] **Step 4: Load the fleet file before environment service overlay**

Read `YARR_FLEET_FILE` after the environment overlay is installed. Resolve
`*_env` references through `env_value`, merge environment-declared services, and
run shared identity/read-only validation once on the final list.

- [ ] **Step 5: Verify secret redaction and documentation**

Add a status serialization regression test proving resolved keys/tokens never
appear. Document union semantics and environment same-name precedence.

- [ ] **Step 6: Run gates and commit PR 3**

Commit with `feat: load additive fleet configuration files`.

---

### Task 4: PR 4 — Fleet-scale runtime limits and explicit truncation

**Files:**
- Modify: `src/codemode.rs`
- Modify: `src/config/mcp.rs`
- Modify: `src/token_limit.rs`
- Modify: `src/token_limit_tests.rs`
- Modify: `src/yarr.rs`
- Modify: `docs/CONFIG.md`
- Modify: `docs/ENV.md`
- Create: `benches/fleet_runtime.rs`
- Modify: `Cargo.toml`
- Modify: `CHANGELOG.md`

**Interfaces:**
- Produces: default `codemode_timeout_secs = 120`.
- Produces: `bound_fleet_value(value, max_bytes) -> FleetBoundedValue` where the result always states `truncated`.

- [ ] **Step 1: Pin the 120-second default and runtime-concurrency meaning**

Update config tests to assert `120`; document that `codemode_max_concurrent`
counts QuickJS runtimes and does not throttle dispatches inside one runtime.

- [ ] **Step 2: Add per-instance bounding tests**

```rust
#[test]
fn fleet_value_marks_only_oversized_instance_truncated() {
    let bounded = bound_fleet_value(json!({"rows": vec!["long"; 100]}), 80);
    assert!(bounded.truncated);
    assert!(bounded.value.is_some());
}
```

- [ ] **Step 3: Implement valid-JSON per-instance summaries**

Return `{truncated:false,value}` for complete values and
`{truncated:true,summary:{type,item_count,observed_bytes},value:null}` for
oversized values. Do not embed a syntactically sliced JSON prefix.

- [ ] **Step 4: Audit and benchmark heap/pool behavior**

The benchmark constructs twenty representative session arrays, applies result
bounding, and runs the Code Mode serialization path. Keep 64 MiB only when the
benchmark and unit test complete below the cap. Document reqwest's shared client
and per-host idle pool of eight.

- [ ] **Step 5: Run gates and commit PR 4**

Commit with `perf: scale Code Mode limits for fleet fanout`.

---

### Task 5: PR 5 — Plex account discovery and Tautulli pairing

**Files:**
- Create: `src/discovery.rs`
- Create: `src/discovery/plex.rs`
- Create: `src/discovery/plex_tests.rs`
- Create: `src/discovery/reconcile.rs`
- Create: `src/discovery/reconcile_tests.rs`
- Create: `src/app/discovery.rs`
- Create: `src/app/discovery_tests.rs`
- Modify: `src/lib.rs`
- Modify: `src/app.rs`
- Modify: `src/cli/command.rs`
- Modify: `src/cli/router_infra.rs`
- Modify: `src/cli/router_infra_tests.rs`
- Modify: `src/cli/usage.rs`
- Modify: `src/cli.rs`
- Modify: `src/main.rs`
- Modify: `docs/CONFIG.md`
- Modify: `CHANGELOG.md`

**Interfaces:**
- Produces: `PlexResource`, `PlexConnection`, `DiscoveredPlexServer`.
- Produces: `discover_plex(options: DiscoverPlexOptions) -> Result<DiscoveryReport>`.
- Produces: `reconcile(existing, discovered) -> FleetDrift`.
- Produces: atomic `write_discovery_outputs(fleet_path, env_path, report)`.

- [ ] **Step 1: Verify the live plex.tv shape without persisting secrets**

If `PLEX_ACCOUNT_TOKEN` exists, request `/api/v2/resources` and inspect only key
names, JSON types, and counts using a redacting transform. Otherwise verify
against current authoritative Plex API material and record the missing live-token
gate in the PR validation notes. Do not print resource access tokens.

- [ ] **Step 2: Add mocked resource filtering/selection tests**

Cover players/controllers, owned/shared resources, local/direct HTTPS/relay
preference, malformed resources, and relay-only flags.

- [ ] **Step 3: Implement strict-enough, forward-compatible response models**

Deserialize required identity/name/access-token fields and default optional
arrays/booleans. Filter `provides.split(',')` by exact trimmed `server` token.

- [ ] **Step 4: Add deterministic naming and drift tests**

Slug to lowercase ASCII `[a-z0-9_]`, prefix `plex_`, collapse separators, and
append the first eight lowercase hex characters of SHA-256(clientIdentifier) on
collision. Compare by client identifier, never list position.

- [ ] **Step 5: Implement CLI parsing and non-mutating `--diff`**

Support `yarr discover plex --fleet-file PATH --env-file PATH --token-env NAME
[--include-shared] [--diff]`. Owned-only is implicit and remains the default.
Return exit code 2 when `--diff` finds drift, 0 for no drift, and 1 for errors.

- [ ] **Step 6: Implement atomic mode-0600 outputs**

Create both temporary files beside their targets, set the env temporary file to
0600 before writing, flush and persist, and preserve existing files on any
failure. Fleet output contains only `token_env`; env output contains access
tokens.

- [ ] **Step 7: Add Tautulli identifier pairing tests and implementation**

Call existing Tautulli `get_server_info` logic per configured instance, extract
`pms_identifier`, pair exact identifiers, and report unpaired instances on both
sides plus duplicate identifiers.

- [ ] **Step 8: Run gates and commit PR 5**

Commit with `feat: discover Plex fleets from plex.tv`.

---

### Task 6: PR 6 — Host-backed fleet fanout and canonical snippets

**Files:**
- Create: `src/fleet.rs`
- Create: `src/fleet_tests.rs`
- Create: `src/app/fleet.rs`
- Create: `src/app/fleet_tests.rs`
- Modify: `src/app.rs`
- Modify: `src/app/codemode.rs`
- Modify: `src/codemode/proxy.rs`
- Modify: `src/codemode/proxy_tests.rs`
- Modify: `src/codemode/store.rs`
- Modify: `src/codemode/store_tests.rs`
- Modify: `docs/CONFIG.md`
- Modify: `CHANGELOG.md`

**Interfaces:**
- Produces: `FleetTarget`, `FleetCall`, `FleetResult`.
- Produces: `YarrService::fleet_map(kind, operation, args, options, guard)`.
- Produces JS: `fleet.of`, `fleet.all`, `fleet.map`, and `fleet.status`.

- [ ] **Step 1: Add ordering, partial-failure, timeout, and cap tests**

Use local mock servers: nineteen return JSON, one refuses connections; assert
twenty name-sorted results, nineteen successes, one useful error, and elapsed
time below ten seconds. Add a delayed server to prove per-instance timeout.

- [ ] **Step 2: Implement the bounded host dispatcher**

Use `tokio::sync::Semaphore` with default parallelism eight and
`tokio::time::timeout` around each call. Collect all join results and sort by
configured name. Convert errors to sanitized strings.

- [ ] **Step 3: Compile the JS fleet callback into a declarative call**

`fleet.map("plex", s => s.get_sessions())` receives proxy objects that record one
method name and JSON argument object instead of dispatching immediately. Reject
callbacks that make zero/multiple calls, access another service, or return a
non-call-plan value. Send one `fleet_map` bridge request to Rust.

- [ ] **Step 4: Authorize before dispatch and apply result bounds**

Resolve every target, classify mutation/destruction once, enforce read-only and
destructive caps, elicit once when required, then start calls. Wrap every success
with the per-instance truncation result from PR 4.

- [ ] **Step 5: Add immutable built-in snippets**

Expose `fleet_activity`, `fleet_health`, `fleet_library_sizes`, and
`fleet_transcode_load` through snippet listing/running. User save/delete returns a
clear error for built-in names.

- [ ] **Step 6: Run gates and commit PR 6**

Commit with `feat: add bounded Code Mode fleet fanout`.

---

### Task 7: PR 7 — Fleet status and observability

**Files:**
- Modify: `src/app/fleet.rs`
- Modify: `src/app/fleet_tests.rs`
- Modify: `src/cli/command.rs`
- Modify: `src/cli/router_infra.rs`
- Modify: `src/cli/router_infra_tests.rs`
- Modify: `src/cli/usage.rs`
- Modify: `src/cli.rs`
- Modify: `src/yarr.rs`
- Modify: `src/yarr/response.rs`
- Modify: `src/yarr/response_tests.rs`
- Modify: `src/server/routes_tests/metrics_tests.rs`
- Modify: `docs/CONFIG.md`
- Modify: `docs/ENV.md`
- Modify: `CHANGELOG.md`

**Interfaces:**
- Produces: `YarrService::fleet_status() -> Result<Vec<FleetStatus>>`.
- Produces CLI: `yarr fleet status [--json]`.
- Produces metrics labeled by bounded configured `service` and `kind`.

- [ ] **Step 1: Add fleet status contract tests**

Assert sorted entries include name, kind, reachable, latency milliseconds, and a
version string when discoverable. An unreachable instance is a result row, not a
whole-command error.

- [ ] **Step 2: Implement shared application status and thin CLI routing**

Reuse the bounded dispatcher and each kind's status endpoint. Extract common
version keys (`version`, `Version`, `MediaContainer.version`) without making
version absence an error.

- [ ] **Step 3: Add request span and metric label tests**

Instrument every upstream send path through one helper/span carrying
`service.name`, `service.kind`, HTTP method, and sanitized path template. Record
latency histograms and counters with configured service and kind labels.

- [ ] **Step 4: Verify credential redaction**

Tests capture logs and metrics while service credentials are configured, then
assert tokens, API keys, authenticated query strings, and response bodies are
absent.

- [ ] **Step 5: Run final full gates and commit PR 7**

```bash
cargo fmt --check
cargo clippy -- -D warnings
cargo test
cargo test --test parity
python3 scripts/check-doc-links.py
git add src docs CHANGELOG.md
git commit -m "feat: add fleet status observability"
```

- [ ] **Step 6: Publish the stacked pull requests**

Push all seven `codex/fleet-0N-*` branches. Open PR 1 against `main`, each later
PR against its immediate predecessor, and include dependency, test evidence,
security behavior, and rebase instructions in every description.
