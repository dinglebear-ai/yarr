---
title: "mcporter"
created: 2026-05-22
updated: 2026-07-30
---

---
title: "mcporter Integration Testing"
doc_type: "guide"
status: "active"
owner: "yarr"
audience:
  - "contributors"
  - "agents"
scope: "template"
source_of_truth: false
upstream_refs:
  - "docs/PATTERNS.md"
last_reviewed: "2026-05-15"
---

# mcporter

`mcporter` is an external CLI for ad-hoc MCP probing and CLI generation. The live
`mcporter` suite calls the single published `yarr` tool directly and drives every
generated OpenAPI callable for the spec-backed services over the MCP transport.

## Live coverage

```bash
cargo xtask live --suite mcp         # MCP transport: handshake, resources, prompts, yarr round-trip
cargo xtask live --suite mcporter    # mcporter/yarr: every generated OpenAPI callable over MCP
cargo xtask live --suite contract    # exhaustive generated-operation coverage for the 6 spec-backed services
cargo xtask live --suite cli         # service-grouped CLI reads/writes per the service matrix
cargo xtask live --suite lifecycles  # doc-based-service stateful write lifecycles (destructive; shart only)
cargo xtask live --suite all         # everything above + rest/services
```

`tests/mcporter/test-mcp.sh` is a thin compatibility wrapper that now runs
`--suite mcporter`.

## Configuration

```json
{
  "mcpServers": {
    "yarr": {
      "url": "http://localhost:40070/mcp",
      "transport": "http"
    }
  }
}
```

The live suites start a local Yarr MCP server against `/home/jmagar/.yarr-shart/.env` and build/use `target/debug/yarr` by default so they test the current checkout; set `YARR_BIN=/path/to/yarr` only when intentionally testing a specific binary. They must not target production service credentials. Shart is a disposable fake stack, so confirmed media-stack writes/removes/deletes are expected live coverage.

## What the live suites validate

- **`mcp`** — `tools/list` advertises exactly the single `yarr` tool (no per-service tools); `initialize`, `resources/read` (the schema resource), and `prompts/get quick_start` succeed; a representative `yarr` Code Mode round-trip reaches an upstream service and returns real status fields; a write to a bad path surfaces the service-native error through the Code Mode envelope.
- **`mcporter`** — starts a local no-auth Yarr MCP server against `/home/jmagar/.yarr-shart`, then uses `mcporter call --http-url http://127.0.0.1:40170/mcp --allow-http yarr` to execute every generated callable for sonarr/radarr/prowlarr/overseerr/jellyfin/plex through Code Mode. It reuses the contract suite's generated input synthesis, create-first ID seeding, and schema validation. Endpoints that rewrite config/auth state or stop services run in an isolated reset phase when the service has a shart ZFS golden (`backup/lab/live/golden/<service>@configured-v1`); the harness rolls the dataset back before and after the group. Non-JSON endpoints, optional-feature endpoints, and resource-ID endpoints without seeded IDs are still invoked using deterministic fallback inputs and are recorded as ok/schema-mismatch/rejected instead of skipped.
- **`contract`** — drives *every* generated OpenAPI operation for the 6 spec-backed services via the CLI `op` action, with create-first seeding and schema-validated responses. Destructive DELETEs run immediately, like every other op; pass `--no-destructive` to skip them for this suite run.
- **`cli`** — service-grouped CLI reads (`yarr <service> status`/`get`), per-service `service_status`, matrix-backed `api_get` expectations, and an unconfirmed `api_post` upstream-error probe per service. All writes, including destructive deletes, run immediately.
- **`lifecycles`** — confirmed stateful write lifecycles for the doc-based services (no generated ops): SABnzbd / qBittorrent `download_*` add/pause/resume/remove (against an in-process fixture NZB / a test magnet, with queue-state polling), Tautulli `stats_*` maintenance (refresh-libraries/refresh-users/delete-image-cache), and Bazarr / Tracearr seeded `api_delete` cleanup (rows seeded over `ssh shart docker exec`, deleted, then verified gone). Destructive — skipped under `--no-destructive`. SABnzbd needs `YARR_LIVE_FIXTURE_HOST` reachable from shart (default the dookie tailnet IP).
- Seeded-content assertions prove the test stack is not merely returning empty success: Prowlarr exposes the `Yarr Live LinuxTracker` indexer, Plex/Jellyfin expose `Yarr Live Movies` / `Yarr Fixture Movie`, and Tautulli returns that library.
- "Destructive" means permanent loss of data that cannot be quickly and easily regenerated or recreated with minimal effort. Ordinary media-stack writes such as removing a test torrent, deleting re-downloadable media, clearing OAuth tokens, stopping containers, killing restartable processes, or toggling gateway state are mutating, but not destructive under this project vocabulary.

If a protected live action lacks credentials in `/home/jmagar/.yarr-shart/.env`, the suite should fail. That is a live stack setup issue, not a harness success.

## Shart reset/reseed

The mcporter suite can reset these ZFS-backed golden config datasets on shart:

```text
backup/lab/live/golden/sonarr@configured-v1
backup/lab/live/golden/radarr@configured-v1
backup/lab/live/golden/prowlarr@configured-v1
backup/lab/live/golden/overseerr@configured-v1
backup/lab/live/golden/plex@configured-v1
backup/lab/live/golden/tautulli@configured-v1
backup/lab/live/golden/sabnzbd@configured-v1
backup/lab/live/golden/qbittorrent@configured-v1
backup/lab/live/golden/jellyfin@configured-v1
backup/lab/live/golden/jellyfin-cache@configured-v1
```

Reset stops the container, rolls back the dataset, removes stale SQLite WAL/SHM
and PID files from `/mnt/backup/lab/live/golden/<service>`, starts the container,
and waits for the service URL to respond. Services without a ZFS golden snapshot
cannot run reset-required operations; add a golden rather than masking those
endpoints.

## Test philosophy

Use semantic assertions, not liveness-only checks:

```bash
# Bad test — only proves MCP responded.
mcporter call --http-url http://127.0.0.1:40170/mcp --allow-http --tool yarr --args '{"code":"async () => sonarr.service_status()"}'

# Good test — the xtask validates the actual payload.
cargo xtask live --suite mcp
```

A test that checks `is_error: false` is not a good test — it only verifies the MCP protocol layer responded. Semantic tests check that the actual service data is present, structurally correct, and changed as expected for confirmed writes.

## Tool validation helpers

```bash
# Validate that a JSON path exists and is non-empty
assert_key() {
  local label="$1" output="$2" key_path="$3"
  python3 -c "
import sys, json
d = json.loads('''${output}''')
keys = '${key_path}'.split('.')
node = d
for k in keys:
    node = node[int(k)] if isinstance(node, list) and k.isdigit() else node[k]
assert node is not None and node != '' and node != [] and node != {}
" 2>/dev/null || { echo \"[FAIL] ${label}: missing or empty .${key_path}\"; return 1; }
}
```

## Resource validation

MCP resources are public contract, not implementation detail. Test every stable resource URI:

- The resource URI resolves.
- The returned content parses as JSON.
- Service tool names such as `sonarr` and `radarr` are present.
- `inputSchema.type` is `object`.
- `inputSchema.properties.action` exists.

## Generated CLIs

`just generate-cli` demonstrates generating a standalone CLI from a running MCP server. Generated CLIs may embed auth material; do not commit them unless they are intentionally scrubbed and reviewed.

See `docs/PATTERNS.md` §17 for the full mcporter integration test pattern.
