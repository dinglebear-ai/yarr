# Yarr Unraid Plugin Design

**Date:** 2026-07-22  
**Status:** Approved in conversation; awaiting written-spec review  
**Tracking:** `rustarr-bhf`  
**Target:** Unraid on `tootie`

## Summary

Add a full Unraid integration for Yarr while preserving Yarr's single-binary
architecture. The integration combines a classic Unraid plugin, an external
NestJS GraphQL API plugin, and Vue custom elements for settings and dashboard
surfaces. All Unraid implementation and package source lives under one
`unraid-plugin/` subtree; existing root CI/release files contain orchestration
only.

The classic plugin owns privileged host operations: package installation,
configuration files, process lifecycle, binary updates, event hooks, and API
plugin activation. The API plugin exposes typed, authenticated control-plane
operations over fixed host scripts and Yarr's local HTTP probes. The browser UI
uses only GraphQL and never performs privileged host operations directly.

Yarr runs as a native Rust binary, not a container. A known-good binary ships
with each classic package. Operators can independently update the running Yarr
binary from verified GitHub Release assets without rebuilding or upgrading the
classic plugin. Failed updates roll back automatically.

## Goals

- Install and run Yarr natively on Unraid as an array-aware service.
- Provide a first-class Unraid settings application and dashboard widget.
- Expose typed GraphQL queries and mutations through `unraid-api`.
- Configure all supported Yarr services with structured fields.
- Import existing Yarr `.env` and TOML configuration with a preview step.
- Discover supported media containers and propose usable service endpoints.
- Detect container credentials server-side and import them only after explicit
  per-service confirmation without exposing discovered values to the browser.
- Support loopback, authenticated LAN/custom binding, and optional Tailscale
  Serve as first-class settings.
- Update the Yarr binary independently, with checksums, compatibility checks,
  atomic replacement, readiness verification, and rollback.
- Build, test, package, install, and verify the integration on `tootie` without
  running media-mutating Yarr actions.

## Non-goals

- Reimplement Yarr business logic in TypeScript, PHP, shell, or Vue.
- Run Yarr in Docker.
- Automatically import secrets without explicit per-service confirmation.
- Return stored or discovered secret values from GraphQL queries.
- Expose arbitrary shell commands, paths, environment keys, or service actions.
- Independently self-update the classic plugin, API plugin, or frontend assets.
- Exercise mutating media actions during deployment verification.
- Purge persistent configuration or appdata during ordinary uninstall.

## Reference Findings

The design combines patterns from three live sources rather than treating any
single repository as an official layout template:

- `incus-unraid` proves the coordinated classic-package/API-plugin/custom-element
  model, atomic API activation, rollback, GraphQL schema extension, and Unraid
  theme integration.
- `unraid-mcp/unraid-plugin` proves the nested distribution subtree, array event
  hooks, PID-safe service script, Tailscale Serve integration, and independent
  runtime overlay update model.
- `upstream/unraid-api` documents the external npm peer-dependency contract for
  API plugins and the host's GraphQL/plugin loading behavior.

There is no official required repository directory layout for an external
classic plugin plus API extension. Because Yarr is primarily a Rust application
and Unraid is one distribution target, all Unraid integration files belong in a
single `unraid-plugin/` subtree.

Upstream's `DockerModule` exports `DockerService` only inside the API
application. It is not part of the external plugin package contract. The Yarr
API plugin must not compile against private `@app/*` imports. Docker discovery
will instead use Node's Unix-socket HTTP client against `/var/run/docker.sock`,
the same Docker Engine source used by upstream, with read-only endpoints only.

## Repository Layout

```text
unraid-plugin/
├── yarr.plg
├── release-manifest.json
├── README.md
├── scripts/
│   ├── build-package.sh
│   └── verify-package.sh
├── tests/
│   ├── classic-contract.sh
│   ├── lifecycle-contract.sh
│   └── updater-contract.sh
├── source/
│   └── usr/local/emhttp/plugins/yarr/
│       ├── Yarr.page
│       ├── YarrDashboard.page
│       ├── yarr.cfg
│       ├── event/
│       │   ├── disks_mounted
│       │   └── unmounting_disks
│       ├── scripts/
│       │   ├── rc.yarr
│       │   ├── yarr-env.sh
│       │   ├── yarr-update.sh
│       │   ├── install-api-plugin.sh
│       │   └── uninstall-api-plugin.sh
│       └── web/
├── api/
│   ├── package.json
│   ├── tsconfig.json
│   ├── index.ts
│   ├── src/
│   └── test-stubs/
└── web/
    ├── package.json
    ├── vite.config.ts
    ├── src/
    └── tests/
```

The npm package in `unraid-plugin/api/package.json` is named
`unraid-api-plugin-yarr` even though its repository directory is simply `api/`.
The build compiles `api/dist` and the web bundles, then stages both into the
classic package. Generated output is never the source of truth.

## Runtime Paths and Ownership

| Purpose | Path |
|---|---|
| Classic persistent state | `/boot/config/plugins/yarr/` |
| Lifecycle configuration | `/boot/config/plugins/yarr/yarr.cfg` |
| Yarr runtime environment/secrets | `/boot/config/plugins/yarr/.env` |
| Known-good config snapshots | `/boot/config/plugins/yarr/*.good` |
| Config transaction marker | `/boot/config/plugins/yarr/yarr.cfg.transaction-state` |
| Default appdata/Yarr home | `/mnt/user/appdata/yarr/` |
| Persistent updated binary | `/mnt/user/appdata/yarr/bin/yarr` |
| Previous updated binary | `/mnt/user/appdata/yarr/bin/yarr.previous` |
| Bundled fallback binary | `/usr/local/yarr/bin/yarr` |
| Classic webGUI files | `/usr/local/emhttp/plugins/yarr/` |
| Service entrypoint | `/etc/rc.d/rc.yarr` |
| API plugin activation | `/usr/local/unraid-api/node_modules/unraid-api-plugin-yarr` |
| PID file | `/var/run/yarr.pid` |
| Cross-operation lock | `/var/lock/yarr-plugin.lock` |

`yarr.cfg`, `.env`, and known-good copies are mode `600`. Runtime scripts and
rootfs payloads are root-owned. Uninstall removes RAM-resident runtime, API, and
web files but preserves `/boot/config/plugins/yarr` and the configured appdata
directory unless an explicit future purge operation is added.

## Classic Plugin Responsibilities

`yarr.plg` installs one complete, checksummed txz built from a prior complete
payload plus tracked source. It must not construct a release from source-only
files that omit the binary or compiled API/UI assets.

The classic plugin:

1. Verifies package SHA-256 before installation.
2. Installs the bundled fallback binary and webGUI payload.
3. Creates default persistent configuration only when absent.
4. Recreates `/etc/rc.d/rc.yarr` on install/boot.
5. Atomically activates `unraid-api-plugin-yarr`, reloads `unraid-api`, checks
   its log/schema readiness, and rolls back on failure.
6. Starts Yarr immediately only when enabled and the array is mounted.
7. Retains one prior classic archive for coordinated package rollback.
8. Stops Yarr and removes API activation during uninstall while preserving data.

## Service Lifecycle

`rc.yarr` supports only `start`, `stop`, `restart`, and `status`. Lifecycle,
configuration, updater, package install/upgrade, and uninstall all acquire the
same stable lock inode, which is never unlinked. It selects the executable in
this order:

1. Executable persistent overlay at the configured appdata `bin/yarr` path.
2. Bundled `/usr/local/yarr/bin/yarr` fallback.

Before signaling a recorded PID, the script verifies PID start time, exact
argv, expected binary path, and recorded device/inode identity. This preserves
ownership proof for a deleted-inode executable during upgrade while preventing
PID-reuse kills. Startup must prove that the newly spawned PID survived and
owns the configured listening socket before `/ready` can succeed. It redirects wrapper stderr to a bounded
service log while Yarr retains its own structured rotating log under
`YARR_HOME/logs`.

Startup waits for process survival and `/ready` rather than treating fork
success as readiness. Stop sends `TERM`, waits a bounded interval, then uses
`KILL` only if the verified process remains. Array hooks retry startup with
bounded backoff after `disks_mounted` and stop Yarr before array unmount.

Tailscale Serve uses the official Tailscale CLI when installed. It owns only the
configured Yarr HTTPS port mapping and never resets unrelated Serve state.

## Configuration Model

The plugin deliberately has two non-mirrored configuration domains:

- `yarr.cfg` contains host lifecycle values such as `SERVICE`, `YARR_HOME`, bind
  mode, Tailscale Serve enablement, and update preferences.
- `.env` contains recognized `YARR_*` runtime settings and downstream service
  credentials consumed by the Yarr binary.

The API plugin is the sole UI writer for these files. Shell scripts may read
them but do not rewrite application settings. Values are serialized with a
strict allowlist and safe quoting; NULs, embedded newlines, unknown lifecycle
keys, invalid service identities, malformed URLs, invalid ports, and unsafe
paths are rejected.

Configuration writes are transactional:

1. Acquire `/var/lock/yarr-plugin.lock`.
2. Parse and validate the complete proposed configuration.
3. Write mode-`600` temporary files and complete old-generation backups.
4. Durably publish an atomic transaction marker, flush each file/directory, and
   rename the pair into place.
5. Preserve the prior files as known-good snapshots.
6. Restart Yarr when runtime-affecting values changed.
7. Require `/ready` to pass.
8. Remove and fsync the marker as the pair commit point.
9. Recover an interrupted marker before every API read, shell read, install, or
   startup, preserving the complete prior generation and its credentials.
10. Restore known-good files and restart the prior configuration on failure.

GraphQL queries return redacted models. Secrets are represented by booleans
such as `hasApiKey`, `hasPassword`, or `hasToken`, plus masked display hints that
cannot reconstruct the value. Manual secret entry necessarily travels from the
authenticated browser to GraphQL over the current Unraid session; stored or
Docker-discovered secret values never travel back to the browser.

## Network and Authentication Modes

The UI exposes a first-class bind mode rather than a raw host field alone:

- **Loopback:** `127.0.0.1`; Yarr's loopback development auth policy is allowed.
- **LAN:** `0.0.0.0`; a static bearer token or OAuth configuration is mandatory.
- **Custom:** an explicit address; non-loopback addresses require bearer or
  OAuth.
- **Trusted gateway:** accepted only on loopback with Tailscale Serve disabled,
  behind a same-host proxy. Host/Origin values are not direct-socket
  authentication.

The default is loopback. Tailscale Serve is independently configurable and
proxies the loopback endpoint over tailnet HTTPS and requires bearer or OAuth.
The UI explains the effective
MCP URL and auth policy. Invalid combinations are rejected before files change.

## Imports

The UI supports `.env` and Yarr TOML input. Import is a two-step operation:

1. `previewYarrImport` parses the supplied content, validates recognized keys,
   and returns proposed non-secret values, secret-presence markers, warnings,
   and unsupported/unmapped entries.
2. `applyYarrImport` accepts a preview token and explicit selections, then uses
   the normal transactional configuration path.

The backend never guesses mappings for unknown keys and never silently drops
them. Preview tokens are short-lived, process-local, and bound to the content
digest so a changed payload cannot reuse an earlier approval.

## Docker Discovery

Discovery uses read-only Docker Engine requests over `/var/run/docker.sock`:

- `GET /containers/json`
- `GET /containers/<id>/json` only for candidate containers

Candidates are matched against supported Yarr kinds using normalized container
names, image names, labels, known default ports, and recognized environment-key
patterns. Each proposal includes confidence, evidence, service kind, proposed
identity, and one or more endpoint candidates.

Endpoint selection prefers:

1. A published host port reachable from the Unraid host.
2. Loopback plus the service's host-network port.
3. A directly routable custom-network container address.

Container DNS names are not assumed to resolve from a host-native Yarr process.
Every proposed URL remains editable before application.

Known credential variables are inspected only on the server. Discovery queries
return `credentialFound` flags, never values. Applying a candidate requires an
explicit candidate/service selection and a separate `includeCredentials`
confirmation. The backend then copies only recognized credential keys directly
into the transactional configuration write.

## API Plugin

`unraid-api-plugin-yarr` is an ESM npm package with `dist/index.js` and
`dist/index.d.ts` exports. NestJS, GraphQL, validation, and shared Unraid
packages are peer dependencies so the host supplies one compatible instance.
The package avoids private upstream import aliases and unnecessary runtime
dependencies.

Decorator-based resolvers and the explicit GraphQL schema extension remain in
sync. Every input field has the matching `class-validator` decorator because
the host validation pipe uses whitelist mode. Resolvers use the host
authentication guard.

Planned queries:

- `yarrRuntime`: process, readiness, endpoints, active/bundled/latest versions,
  update source, auth mode, and resource summary.
- `yarrConfig`: redacted lifecycle and service configuration.
- `yarrDiscoveredServices`: read-only Docker discovery proposals.
- `yarrLogs`: bounded, redacted log tail with cursor pagination.
- `yarrUpdateStatus`: current or last updater operation.

Planned mutations:

- `saveYarrConfig(input)`
- `controlYarr(action: START | STOP | RESTART)`
- `previewYarrImport(input)`
- `applyYarrImport(input)`
- `applyYarrDiscovery(input)`
- `updateYarrBinary(version)`
- `resetYarrBinary`

Privileged mutations invoke only fixed absolute scripts with fixed enum-derived
arguments. User input is never concatenated into shell commands. Yarr health,
readiness, status, and metrics are fetched directly over loopback HTTP with
bounded timeouts and response limits.

Long-running update state is represented by an operation ID and polled through
`yarrUpdateStatus`; a new subscription channel is unnecessary for the initial
scope.

## Binary Self-update

The bundled fallback and persistent overlay are independent:

- Classic plugin updates replace the bundled fallback, API extension, and UI.
- The Update page replaces only the persistent Yarr overlay binary.
- Reset removes the overlay and returns to the bundled fallback.

The updater:

1. Resolves a stable `vMAJOR.MINOR.PATCH` GitHub Release.
2. Rejects implicit downgrades.
3. Enforces the supported Yarr major from the immutable packaged binary; a new
   major requires a compatible classic plugin update.
4. Downloads `yarr-x86_64.tar.gz` and its `.sha256` asset into a private,
   RAM-backed temporary directory without holding the lifecycle lock.
5. Parses the published digest and computes the archive digest locally.
6. Requires the tar inventory to contain exactly the expected regular `yarr`
   executable and no links, absolute paths, traversal, or extra payload.
7. Extracts and verifies `yarr --version` before stopping the service.
8. Preserves one previous overlay, atomically swaps the new executable, starts
   Yarr, and requires `/ready`.
9. Restores the previous overlay and service on any activation failure.

Update, reset, lifecycle, config writes, package replacement, and uninstall
share the same never-unlinked lock inode. Network staging never holds that lock.
Before stopping for array unmount, the stop hooks establish a private
array-stopping fence under that lock. Updater check, apply, and reset abort
before any appdata access while the fence exists. Uninstall retains the fence
because an already-waiting updater can outlive package removal. Only a proven
mounted-array start transition clears the fence under the same lock before
starting Yarr; both the array-start hook and a mounted classic installer use
that transition, so a same-boot reinstall recovers without weakening unmount.
Immediately before the short activation transaction, the updater acquires the
lock and revalidates the current installed version, the packaged supported
major, stable-release policy, and staged candidate hash/version. Network reads
have bounded connect/total timeouts, retries, and per-resource byte limits. The
updater emits structured status without logging tokens, credentials, or
environment contents.

## Frontend

The Vue 3 frontend builds two custom-element entrypoints:

- `<yarr-settings-app>` for the full settings application.
- `<yarr-dashboard>` for a compact Main/Dashboard widget.

The canonical `Yarr.page` settings route and `YarrDashboard.page` only load
their respective compiled assets and mount the custom elements. Both use the
packaged Yarr icon and mtime cache busting. The settings shell safely exposes
the host CSRF token. The dashboard page is conditioned by the persistent
`DASHBOARD_WIDGET_ENABLE=true|false` setting and never loads the full settings
bundle. The frontend inherits Unraid's CSS variables and light/dark behavior;
it does not introduce an unrelated palette.

Settings sections:

1. **Overview:** health, readiness, process state, versions, endpoint, auth, and
   resource summary.
2. **Services:** structured fields for all supported kinds, import, Docker
   discovery, confidence/evidence, explicit endpoint selection, and explicit
   credential import.
3. **Server & Auth:** bind mode, port, bearer/OAuth/trusted-gateway settings,
   Tailscale Serve, dashboard visibility, data path, effective URLs, and
   validation guidance.
4. **Updates:** bundled/active/latest versions, update/manual rollback/reset
   operations, compatibility warnings, progress, and rollback outcome. Manual
   rollback atomically selects `yarr.previous`, retains the replaced active
   overlay as the next predecessor, and restores the current binary if
   activation readiness fails.
5. **Logs:** bounded redacted Yarr/service logs with refresh and download of the
   visible redacted range only.

Secrets use replace/remove controls and never populate an input with the stored
value. Destructive-looking operations such as reset or credential removal use
explicit confirmation. Controls disable while the shared operation lock is
held, and errors identify the failed layer and rollback result.

Structured import deliberately detects `.env` assignments or Yarr TOML. TOML
supports the repository's `[yarr]`, `[mcp]`, `[mcp.auth]`, and
`[[yarr.services]]` structure: importable service fields are mapped without
guessing, valid non-service fields produce explicit warnings, and malformed or
unsupported fields are rejected rather than silently dropped.

## Packaging and Release

`unraid-plugin/release-manifest.json` coordinates:

- classic plugin build/release identifier;
- classic txz filename and SHA-256;
- bundled Yarr version;
- supported Yarr major for overlay updates;
- API package version and schema compatibility;
- required frontend asset inventory;
- supported architecture and minimum host/runtime assumptions.

The package builder starts from a complete known-good package or an explicit
complete staging root, overlays tracked source and freshly built API/web
artifacts, adds the release-built Yarr binary, regenerates the embedded
inventory, and creates the txz. Verification rejects checksum drift, missing or
unexpected required files, source/archive drift, payload shrinkage, stale web
assets, and API/schema version mismatch.

Yarr's release workflow will publish the Unraid txz and checksum alongside the
existing Linux binary assets. The `.plg` pins a concrete classic package and
checksum. The binary Update page still follows later compatible Yarr releases
independently.

## Error Handling and Recovery

- Config validation fails before persistent files change.
- Config activation failure restores known-good files and reports whether the
  prior service recovered.
- API activation failure restores the previous API package and classic payload.
- Binary update failure preserves or restores the prior active binary.
- Missing Tailscale is a clear configuration error when Serve is enabled, not a
  silent success.
- Docker discovery failure does not affect current configuration or service
  state.
- Malformed import input produces a preview error and no writes.
- Unavailable Yarr probes distinguish stopped, starting, unhealthy, timeout,
  and invalid-response states.
- Uninstall leaves enough persistent state for a later reinstall to recover.

## Testing Strategy

### Rust baseline and regression

- `cargo test --workspace --locked`
- Existing release/plugin contract checks
- No media-mutating live suite during plugin deployment

### Classic package and shell

- `bash -n` and ShellCheck over every shell source
- XML parse and entity/checksum validation for `yarr.plg`
- Complete package inventory and source/archive parity
- PID reuse and executable/argument identity tests
- Config quoting/injection and path validation tests
- Lock/concurrent-operation tests
- Archive traversal, extra-entry, symlink, checksum, downgrade, version, failed
  readiness, and rollback tests
- Event-hook retry and array lifecycle tests

### API plugin

- Vitest unit tests for config transactions, redaction, imports, Docker socket
  parsing/mapping, lifecycle invocation, probes, logs, update operations, and
  rollback reporting
- GraphQL schema contract tests
- Input whitelist/validation tests
- TypeScript typecheck and production build
- Coverage threshold consistent with the repository's quality gates

### Frontend

- Component tests for every section and operation state
- Tests proving secret values are never rendered or repopulated
- Discovery preview/confirmation and import warning tests
- Responsive and Unraid light/dark theme behavior
- Vue typecheck and both production bundles

### Live `tootie` verification

1. Back up any pre-existing Yarr plugin paths without touching media data.
2. Install the locally built `.plg`/txz through Unraid's plugin mechanism.
3. Verify API plugin activation and GraphQL fields after reload.
4. Load Settings and Dashboard custom elements in the real webGUI.
5. Verify default loopback lifecycle, `/health`, `/ready`, `/status`, and
   `/metrics`.
6. Run Docker discovery and inspect all proposed service mappings.
7. Import only explicitly confirmed service endpoints/credentials.
8. Verify Yarr's read-only doctor/status and MCP connectivity.
9. Verify Tailscale Serve only when enabled, without changing unrelated Serve
   mappings.
10. Exercise update/manual rollback/reset or a controlled equivalent that
    proves checksum, activation, and rollback paths without leaving the service
    degraded.
11. Verify uninstall stops runtime/API surfaces while preserving configuration
    and appdata, then reinstall to prove recovery if safe.

No Sonarr, Radarr, download-client, Plex, Jellyfin, Overseerr, Bazarr, Tautulli,
Tracearr, or other media mutation is authorized by this verification plan.

## Acceptance Criteria

- All Unraid implementation, package source, and tests live under
  `unraid-plugin/`; root workflow changes are limited to build/release
  orchestration.
- The classic plugin installs a complete, checksummed native Yarr package.
- Yarr lifecycle follows array mount/unmount and is PID-reuse safe.
- The API plugin activates atomically and exposes the documented typed GraphQL
  surface without private upstream imports.
- The settings and dashboard custom elements load in real Unraid webGUI themes.
- Structured service configuration, import preview/apply, and Docker discovery
  work for the supported Yarr kinds.
- Docker-discovered credential values never reach the browser and require
  explicit per-service import confirmation.
- LAN/custom non-loopback binding cannot be saved without an accepted auth mode.
- Binary updates verify published checksums and archive shape, reject incompatible
  versions, and roll back on failed readiness.
- Local Rust, shell, package, backend, frontend, schema, and security gates pass.
- The plugin is installed and verified on `tootie` without media mutations.
- Persistent config and appdata survive ordinary uninstall.

## Deferred Work

- Additional Unraid hosts or non-x86_64 artifacts.
- Automatic credential rotation.
- Automatic mutation of Docker templates or service containers.
- GraphQL subscriptions for updater progress.
- Community Applications publication and support-thread assets beyond the
  installable `.plg` artifact.
- Purge/remove-data UX.
