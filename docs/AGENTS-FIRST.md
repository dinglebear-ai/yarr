---
title: "Agents-first design"
created: 2026-05-22
updated: 2026-07-30
---

---
title: "Agents-First Design"
doc_type: "guide"
status: "active"
owner: "yarr"
audience:
  - "contributors"
  - "agents"
scope: "template"
source_of_truth: false
last_reviewed: "2026-05-15"
---

# Agents-first design

This template is optimized for AI agents as primary operators and consumers. Design rule: if an agent can't use it cleanly, fix the output, not the agent.

## Design rules

- Return stable JSON objects with predictable keys.
- Keep responses compact; cap large outputs and summarize by default.
- Include actionable error messages with remediation hints.
- Make all actions discoverable through `action="help"` and `docs/MCP_SCHEMA.md`.
- Prefer semantic test assertions so agents can trust results.

## Token discipline

No single response may return more than ~10,000 tokens (~40 KB of text):

```rust
const MAX_RESPONSE_BYTES: usize = 40_000; // ~10K tokens

fn truncate_response(text: &str) -> String {
    if text.len() <= MAX_RESPONSE_BYTES {
        return text.to_string();
    }
    let truncated = &text[..MAX_RESPONSE_BYTES];
    format!("{truncated}\n\n[TRUNCATED: response exceeded 10K token limit. Use limit/offset or more specific filters.]")
}
```

List actions MUST support `limit` and `offset`. Response shape includes pagination metadata:

```json
{
  "items": [...],
  "total": 1842,
  "limit": 50,
  "offset": 0,
  "has_more": true,
  "next_offset": 50
}
```

## Informative errors

Every error must answer four questions:

| Field | Yarr |
|---|---|
| What failed | ``"`service` is required and must not be empty"`` |
| The bad value | `"id=\"abc123\""` |
| Why it failed | `"container may be stopped or removed"` |
| How to fix | `"use action=help to see required parameters"` |

```rust
Ok(CallToolResult::error(vec![Content::text(format!(
    "ERROR: {action} failed\n\
     Reason: {reason}\n\
     Hint: {how_to_fix}\n\
     See: action=help for full documentation"
))]))
```

Never return opaque `"internal error"` messages. Never leak secrets in error text.

## Transport surfaces

Agents may use:

1. **The `yarr` MCP tool** through `/mcp` or stdio (preferred — runs a Code Mode script that reaches the fleet via per-service callables; scope enforcement)
2. **CLI commands** for local shell workflows (`yarr help`, `yarr sonarr get --path /api/v3/system/status`)
3. **Plugin skills** as human/agent guidance

yarr ships **MCP and CLI only** — there is no local REST action API and no embedded web UI.

The action metadata in `src/actions.rs` keeps these surfaces aligned. Every action that the MCP tool exposes must also be reachable from the CLI (with the exception of MCP-only features like elicitation).

## Summarize by default, expand on request

```
# Default: summary view (fits on screen)
$ yarr things
  ID   NAME               STATE    UPDATED
  42   my-thing           active   2m ago
  43   other-thing        idle     1h ago

# Full detail: --verbose or specific action
$ yarr thing 42
$ yarr thing 42 --json
```

## Documentation contract

When adding an action, update:

- `src/actions.rs`
- `src/app.rs`
- `src/mcp/tools.rs`
- `src/mcp/schemas.rs`
- `src/cli.rs` when not MCP-only
- `tests/tool_dispatch.rs`
- `docs/MCP_SCHEMA.md`
- Plugin skill docs

## Security for agents

Never place secrets in skill text, generated docs, or examples. Sensitive plugin settings must be marked `sensitive: true` and passed through environment variables or headers.

See `docs/PATTERNS.md` §39 and §40 for the full error message and token discipline patterns.
