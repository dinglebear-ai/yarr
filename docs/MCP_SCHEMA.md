---
title: MCP Schema Contract
created: 2026-07-30
updated: 2026-07-30
---

# MCP Schema Contract

Generated from `src/actions/` and checked against the schema, README, skill docs, help text, and scope routing.

Run:

```bash
python3 scripts/check-schema-docs.py --write
python3 scripts/check-schema-docs.py --check
```

## Tool

| Field | Value |
|---|---|
| Tool name | `yarr` (single Code Mode tool) |
| Schema resource | `yarr://schema/mcp-tool` |
| Dispatch parameter | `code` (a JS script) dispatches the `codemode` action; other actions take `action` + params |

## Actions

| Action | Scope | Description |
|---|---|---|
| `service_status` | `yarr:read` | Fetch the service-specific status endpoint for one configured service. |
| `api_get` | `yarr:write` | Proxy a credentialed GET request to an allowed upstream API prefix. |
| `api_post` | `yarr:write` | Proxy a credentialed POST request to an allowed upstream API prefix. |
| `api_put` | `yarr:write` | Proxy a credentialed PUT request to an allowed upstream API prefix. |
| `api_delete` | `yarr:write` | Proxy a credentialed DELETE request to an allowed upstream API prefix. |
| `help` | public | Return the in-tool action reference. Public; no scope required. |
| `codemode` | `yarr:write` | Run a JavaScript async arrow function that orchestrates yarr actions (the single `yarr` tool); returns { result, calls, logs }. |
| `op` | `yarr:write` | Invoke a generated OpenAPI operation by name on a spec-backed service (sonarr/radarr/prowlarr/overseerr/jellyfin/plex). |
| `snippet_list` | `yarr:read` | List saved Code Mode snippets. |
| `snippet_save` | `yarr:write` | Save a Code Mode snippet by name for later reuse. |
| `snippet_run` | `yarr:write` | Run a saved Code Mode snippet by name, optionally with input. |
| `snippet_delete` | `yarr:write` | Delete a saved Code Mode snippet by name. |

## Drift Rules

- `ACTION_SPECS` in `src/actions/registry.rs` is the canonical generic action and scope list; curated commands live in `CURATED_COMMANDS`.
- `src/mcp/schemas.rs` derives the single `yarr` tool's action enum from `all_action_names()` (via the generated `properties`); `src/mcp/schemas/conditionals.rs` generates the action-specific requirements.
- The MCP tool schema must reject unknown top-level parameters and encode action-specific requirements for the action dispatch the single `yarr` tool wraps.
- `help` is intentionally public and must have no required scope.
- Help text is generated in `src/actions/help.rs` from the registry; `README.md` and `plugins/yarr/skills/yarr/SKILL.md` must mention every action.
- `src/mcp/rmcp_server.rs` owns stable resources and must keep `yarr://schema/mcp-tool` wired to `tool_definitions()`.
- `src/mcp/prompts.rs` owns stable prompts and must keep `quick_start` covered by prompt tests.

## Resources

| URI | Source | Contract |
|---|---|---|
| `yarr://schema/mcp-tool` | `src/mcp/rmcp_server.rs` | Returns `tool_definitions()` as `application/json`. |

## Prompts

| Prompt | Source | Contract |
|---|---|---|
| `quick_start` | `src/mcp/prompts.rs` | Guides a client to write a short Code Mode script that discovers a service's status callable via `codemode.search` and invokes it. |

## Input Validation

- `action` is always required.
- `service_status` uses the service implied by the tool name.
- `api_get` conditionally requires non-empty `path`.
- `api_post` conditionally requires non-empty `path`; `body` defaults to `{}`. Non-destructive; runs immediately.
- `api_put` conditionally requires non-empty `path`; `body` defaults to `{}`. Non-destructive; runs immediately.
- `api_delete` conditionally requires non-empty `path`; `body` is optional (query params go in `path`). Destructive: gated by MCP elicitation only (no bypass); the CLI has no elicitation channel and runs it immediately. Not a required schema param.
- Unknown top-level parameters are rejected by the schema.
