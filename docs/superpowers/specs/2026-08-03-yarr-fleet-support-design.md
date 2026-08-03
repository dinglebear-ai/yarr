# yarr Fleet Support Design

**Date:** 2026-08-03
**Status:** Approved
**Target:** `dinglebear-ai/yarr` on Rust 2024, MSRV 1.97.1, `rmcp = "=3.0.0-beta.2"`

## Objective

Extend yarr's existing multi-instance data model into a safe, discoverable fleet
control surface for Hermes Agent. The result supports 20 or more Plex and
Tautulli instances plus shared Sonarr and Radarr while retaining a single MCP
tool schema and full write authority with explicit destructive-operation gates.

The implementation ships as seven stacked, upstream-reviewable pull requests.
Each branch builds on its predecessor, contains a coherent workstream, and must
pass its focused tests plus the full repository gate. Once a predecessor merges,
the next branch can be rebased onto `main` without changing its logical patch.

## Existing Foundations

The implementation preserves these current capabilities:

- `ServiceConfig.name` and `ServiceConfig.kind` already permit multiple named
  instances of one kind.
- `YARR_<NAME>_KIND` explicitly selects the kind independently of the configured
  name.
- Exact configured names win during lookup; a bare kind resolves only when
  unique and otherwise returns the matching configured names.
- Code Mode exposes one namespace per configured name.
- Generated Plex operations already include the required read and write calls.
- Plex and Tautulli credentials are injected by the server-side transport.
- MCP elicitation fails closed when the client cannot confirm a destructive call.

## PR 1: Generated-Operation Safety

Introduce a declarative generated-operation classification table keyed by
`(ServiceKind, operation name)`. A generated operation is destructive when its
HTTP method is DELETE or the explicit table marks it destructive. The initial
audit covers Plex, Sonarr, Radarr, Overseerr, and Jellyfin, including Plex's
non-DELETE session termination and high-impact library mutations.

The classification table also records reviewed non-destructive mutations so
`cargo xtask tool-docs` can report every generated write as classified and fail
when a newly generated write lacks a decision. Read-only service identities from
`YARR_FLEET_READONLY` reject every mutation before dispatch, including generated
operations and generic API writes.

The authorization context represents either one target or a fleet target list.
A destructive fleet dispatch gets one elicitation message naming all affected
instances. The configurable destructive fanout maximum defaults to three; a
larger target set is rejected before elicitation or upstream calls. Single-target
behavior remains compatible with existing MCP calls. Direct CLI operation
continues to be a trusted operator surface, except read-only identities still
reject writes because that is an instance policy rather than an MCP policy.

## PR 2: Multi-Instance Validation and Documentation

Move Code Mode reserved global names into a configuration-visible validation
contract. Configuration loading rejects reserved identities with an actionable
error listing the reserved names. It also rejects configured names whose
uppercased, non-alphanumeric-to-underscore environment namespaces collide.

Document the full multi-instance contract in `docs/CONFIG.md`, cross-link it from
the README and `docs/ENV.md`, and include complete Plex/Tautulli examples. Explain
environment namespace normalization, the underscore naming recommendation,
bracket access for non-JavaScript identifiers, bare-kind ambiguity, and reserved
names.

## PR 3: Fleet Configuration File

Add `YARR_FLEET_FILE` as an additive YAML or TOML input. A focused fleet-file
model accepts public connection metadata and credential-variable references such
as `token_env` and `api_key_env`. It rejects inline secret field names such as
`token`, `api_key`, `password`, and `username` during deserialization instead of
silently ignoring them.

The loader retains source path and entry location information for diagnostics,
resolves each credential reference through the existing environment overlay, and
then merges fleet-file entries with environment-declared services. Environment
entries replace same-named file entries; all other entries form a union. Duplicate
names within either source and normalized environment-namespace collisions across
the merged result fail startup. Pairing metadata and Plex client identifiers live
in a separate fleet metadata structure rather than expanding transport auth
responsibilities.

Status and debug serialization continue to redact resolved credentials.

## PR 4: Fleet Runtime Limits

Raise the default Code Mode deadline from 30 to 120 seconds and document that the
runtime concurrency setting limits simultaneous QuickJS runtimes, not calls made
within one script. Preserve the shared reqwest client, whose pool is per host, and
measure the 64 MiB QuickJS heap with representative 20-instance session payloads
before changing it.

Add a per-instance result bounding function used by fleet dispatch. If an
instance result exceeds its budget, return a valid result envelope carrying
`truncated: true` for that instance. Never rely on the final whole-tool token cap
to communicate fleet completeness. Complete instances remain distinguishable
from truncated and failed instances.

## PR 5: Plex Account Discovery

Add `yarr discover plex` as a CLI-only scaffolding command. A dedicated plex.tv
client sends the account token with the standard Plex client headers and parses
the live API's verified response shape. Only resources whose `provides` includes
`server` are candidates; owned-only behavior is the default and shared resources
require an explicit opt-in.

Connection selection prefers local connections, then direct HTTPS, then relay.
Relay-only selections are clearly flagged. Names are stable `plex_<slug>` values;
collisions append a short deterministic hash of `clientIdentifier`. Fleet entries
pin `clientIdentifier` and reference variables in a companion env file. Secret
output is written atomically with mode 0600 and never enters YAML/TOML.

Reconciliation compares discovered identity records with the existing fleet
file. `--diff` reports additions, removals, renames, URL changes, and relay-state
changes, returns non-zero on drift, and does not mutate either file. Normal output
writes only after successful discovery and validation.

Tautulli pairing queries each configured Tautulli `get_server_info`, compares its
`pms_identifier` with Plex client identifiers, persists unambiguous pairing hints,
and reports every unpaired or multiply matched instance.

## PR 6: Fleet Fanout and Canonical Snippets

Expose a `fleet` Code Mode global backed by a host-side dispatcher:

- `fleet.of(kind)` returns configured names of that kind.
- `fleet.all()` returns sorted `{name, kind}` descriptors.
- `fleet.map(kind, callback)` performs bounded parallel work with per-instance
  timeouts and returns sorted success/error envelopes.
- `fleet.status()` returns per-instance status through the same dispatcher.

The host dispatcher owns concurrency, deadlines, authorization aggregation,
result bounding, and stable ordering. The JavaScript callback is constrained to
one service invocation per selected instance so the host can inspect and
authorize the complete call plan before dispatch. Individual upstream failures
never reject the fleet operation.

Ship `fleet_activity`, `fleet_health`, `fleet_library_sizes`, and
`fleet_transcode_load` as built-in read-only canonical snippets. Built-ins are
discoverable through the existing snippet API and cannot be overwritten or
deleted by user snippet operations.

## PR 7: Fleet Observability

Implement `yarr fleet status` and `fleet.status()` on one application-layer
status service. Results include configured name, kind, reachability, version when
available, and observed latency.

Every upstream request span carries structured `service.name` and `service.kind`
fields. Existing request and domain metrics gain a configured service-name label;
cardinality remains bounded by loaded configuration. Logs and metrics never carry
credentials, full authenticated URLs, or response bodies.

## Error Handling and Safety Invariants

- Configuration and classification errors fail startup or CI with the offending
  kind, name, operation, file, and entry location when available.
- No discovery operation silently expands or mutates a destructive-authority
  fleet.
- No individual fleet failure discards successful sibling results.
- No destructive fleet call dispatches partially: authorization and fanout-cap
  checks complete before any upstream request.
- Read-only service identities reject all writes on every surface.
- Truncation is explicit per instance.
- Credential values are resolved only at runtime and remain redacted.

## Testing and Release Gates

Tests follow sibling `*_tests.rs` conventions. Add a 20-instance mixed-kind
fixture and table-driven coverage for safety classification, configuration merge
and validation, discovery payloads and drift, fanout failure isolation and
timeouts, destructive aggregation, read-only policy, result truncation, and
observability labels.

Each PR runs its focused tests and the final stacked head runs:

```text
cargo fmt --check
cargo clippy -- -D warnings
cargo test
cargo test --test parity
python3 scripts/check-doc-links.py
```

The discovery parser additionally requires a live, redacted plex.tv shape check
before its model is finalized. Live credentials and returned tokens must not be
captured in tests, logs, commits, or command output.
