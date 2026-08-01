---
title: "yarr API"
created: 2026-05-22
updated: 2026-07-30
---

# yarr API

`yarr` exposes **one MCP tool named `yarr`** and a service-grouped CLI. Both
surfaces call `YarrService`. The MCP tool runs Code Mode; the CLI maps verbs to
the same underlying actions.

## MCP Tool

Tool name: `yarr`

| Field | Type | Required | Notes |
|---|---|---:|---|
| `code` | string | yes | A JavaScript async arrow function executed in the Code Mode sandbox (the `codemode` action). It reaches the whole fleet via per-service callables and returns `{ result, calls, logs, artifacts }`. |

Inside `code` you have:

- **Per-service callables** with the service baked in — table-driven operations
  for the 6 spec-backed services and curated commands for download, stats,
  subtitles, and trace capabilities. Use `codemode.describe()` for the exact
  parameters available in this build.
- **Raw passthrough**: `api.<service>.get/post/put/delete(path, body)`.
- **Escape hatch**: `callTool(action, params)` dispatches any action directly.
- **Discovery**: `codemode.search(query)` lists matching callables;
  `codemode.describe(path)` returns a callable's signature or a response type's
  TypeScript interface.
- **Snippets / artifacts**: `codemode.run(name, input)`, `codemode.snippets()`,
  `writeArtifact(path, content, options?)`.

Example `yarr` call:

```json
{"name":"yarr","arguments":{"code":"async () => { const s = await sonarr.get_system_status(); return s.version; }"}}
```

```js
// A richer script: discover, then act across services.
async () => {
  const queue = await radarr.get_queue();
  await radarr.post_command({ body: { name: "MoviesSearch", movieIds: [456] } });
  return { queued: queue.records?.length };
}
```

### Action dispatch shape

Underneath, every callable / `callTool` / CLI verb resolves to one action. The
dispatch arguments are:

| Field | Type | Required | Notes |
|---|---|---:|---|
| `action` | string | yes | A generic action (`service_status`, `api_get`, `api_post`, `api_put`, `api_delete`, `help`, `codemode`, `op`, `snippet_list`, `snippet_save`, `snippet_run`, `snippet_delete`) or a curated command (`download_*`, `stats_*`) |
| `service` | string | action-dependent | Configured service name such as `sonarr` or `radarr` (baked into per-service callables, so scripts never pass it) |
| `path` | string | action-dependent | Relative upstream API path for the generic passthrough actions |
| `body` | object | no | JSON body forwarded upstream for `api_post`/`api_put`; defaults to `{}` |

There is no `confirm` parameter. CLI destructive actions run immediately. On
the MCP surface, direct and nested Code Mode destructive calls require an
elicitation-capable peer and explicit approval; unsupported, declined, or
missing elicitation fails closed. A script cannot bypass that decision by
calling `callTool` or an operation callable.

Generated operations are dispatched via the `op` action (`{action:"op", service, op, args}`); inside Code Mode they are the per-service callables above. The action set is **registry-derived** — run the `help` action (or `yarr help`) for the current full list and per-action params.

### Generated-operation support boundary

The vendored specs generate runtime metadata tables, not a dedicated Rust
function for each operation. The executor preserves and enforces path, query,
header, and cookie parameters, including requiredness, schema, and OpenAPI
`style`/`explode` serialization (`simple`, `label`, `matrix`, `form`,
`spaceDelimited`, `pipeDelimited`, and `deepObject`). Supported request
representations include JSON (including `+json`), URL-encoded forms, multipart
text/files, text/XML, and raw binary bodies. Successful responses are negotiated
and decoded as JSON, text, or base64-encoded binary values.

Operations are omitted when their declared transport cannot be represented
losslessly. The generated, runtime-derived [supported/omitted capability
matrix](TOOLS_ACTIONS_ENDPOINTS.md#generated-operations-spec-backed-services)
is the public source of truth for current counts and exact omission reasons.
The omitted set currently consists of the Sonarr, Radarr, and Prowlarr
`get_by_path` operations whose declared path parameter has no path placeholder,
plus Overseerr's `get_settings_plex_library` operation whose `enable` query
parameter requires unsupported `allowReserved` serialization. Jellyfin and Plex
have no omitted operations.

## CLI Parity

The CLI is **service-grouped** (`yarr <service> <command> [flags]`); there is
no `--service` flag. Infra commands (`help`, `codemode`, `snippet …`) are
service-less.

```bash
yarr help
yarr radarr status
yarr sonarr get --path /api/v3/system/status
yarr radarr post --path /api/v3/command --body '{"name":"RefreshMovie"}'
yarr sonarr put --path /api/v3/series/editor --body '{"seriesIds":[1],"qualityProfileId":4}'
yarr radarr delete --path /api/v3/movie/12

# table-driven operations (the 6 spec-backed services)
yarr sonarr op get_series
yarr radarr op post_command --args '{"body":{"name":"MoviesSearch","movieIds":[456]}}'

# curated commands (download / stats only)
yarr qbittorrent queue
yarr tautulli activity

# Code Mode
yarr codemode --code 'async () => sonarr.get_system_status()'
```

`api_post`/`api_put`/`api_delete` all run immediately on the CLI (no `--confirm`
flag exists). MCP direct and Code Mode-nested destructive calls elicit before
dispatch and fail closed without approval. CLI ↔ MCP registration parity is
mechanically enforced by `tests/parity.rs`; transport-specific confirmation is
intentionally different.

## Security Rules

- `help` has no action scope, but mounted HTTP transports still require bearer/OAuth transport auth.
- `service_status` requires `yarr:read`.
- `api_get`, `api_post`, `api_put`, `api_delete`, `op`, and `codemode` require `yarr:write` because generic/credentialed upstream calls and arbitrary scripts can mutate services.
- `yarr:write` satisfies read.
- Paths with traversal or embedded query-string secrets are rejected.
- Responses are capped by the shared token-limit layer (and Code Mode shapes its envelope below that cap) before being returned to MCP clients.
