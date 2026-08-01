#!/usr/bin/env python3
"""Generate and verify MCP schema/action documentation drift."""

from __future__ import annotations

import argparse
import re
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
SCHEMAS_RS = ROOT / "src/mcp/schemas.rs"
CONDITIONALS_RS = ROOT / "src/mcp/schemas/conditionals.rs"
# Action specs moved out of the `src/actions.rs` facade into `src/actions/`
# submodules (registry.rs). Scan the whole tree so the contract survives the split.
ACTION_DIR = ROOT / "src/actions"
ACTION_FACADE = ROOT / "src/actions.rs"
TOOLS_RS = ROOT / "src/mcp/tools.rs"
HELP_RS = ROOT / "src/actions/help.rs"
PROMPTS_RS = ROOT / "src/mcp/prompts.rs"
RMCP_SERVER_RS = ROOT / "src/mcp/rmcp_server.rs"
README = ROOT / "README.md"
SKILL = ROOT / "plugins/yarr/skills/yarr/SKILL.md"
DOC = ROOT / "docs/MCP_SCHEMA.md"


def read(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def read_actions_tree() -> str:
    """Facade plus every `*.rs` under `src/actions/` (registry holds the specs)."""
    combined = read(ACTION_FACADE)
    if ACTION_DIR.is_dir():
        for path in sorted(ACTION_DIR.rglob("*.rs")):
            combined += "\n" + read(path)
    return combined


def extract_actions() -> list[str]:
    text = read_actions_tree()
    # `ActionSpec { name: "..." }` entries only — avoid matching unrelated
    # `name:` fields (e.g. CommandDescriptor) by anchoring on the specs block.
    specs = re.search(r"ACTION_SPECS[^=]*=\s*&\[(.*?)\];", text, re.S)
    region = specs.group(1) if specs else text
    return re.findall(r'name:\s*"([^"]+)"', region)


def extract_scope_for_actions() -> dict[str, str]:
    text = read_actions_tree()
    entries = re.findall(r"ActionSpec\s*\{(.*?)\}", text, re.S)
    scopes: dict[str, str] = {}
    for entry in entries:
        name_match = re.search(r'name:\s*"([^"]+)"', entry)
        scope_match = re.search(r"required_scope:\s*([^,\n]+)", entry)
        if not name_match or not scope_match:
            continue
        name = name_match.group(1)
        scope_expr = scope_match.group(1).strip()
        if scope_expr == "None":
            scopes[name] = "public"
        elif scope_expr == "Some(READ_SCOPE)":
            scopes[name] = "`yarr:read`"
        elif scope_expr == "Some(WRITE_SCOPE)":
            scopes[name] = "`yarr:write`"
        else:
            scopes[name] = "`yarr:__deny__`"
    return scopes


def action_description(action: str) -> str:
    descriptions = {
        "service_status": "Fetch the service-specific status endpoint for one configured service.",
        "api_get": "Proxy a credentialed GET request to an allowed upstream API prefix.",
        "api_post": "Proxy a credentialed POST request to an allowed upstream API prefix.",
        "api_put": "Proxy a credentialed PUT request to an allowed upstream API prefix.",
        "api_delete": "Proxy a credentialed DELETE request to an allowed upstream API prefix.",
        "help": "Return the in-tool action reference. Public; no scope required.",
        "codemode": "Run a JavaScript async arrow function that orchestrates yarr actions (the single `yarr` tool); returns { result, calls, logs }.",
        "op": "Invoke a generated OpenAPI operation by name on a spec-backed service (sonarr/radarr/prowlarr/overseerr/jellyfin/plex).",
        "snippet_list": "List saved Code Mode snippets.",
        "snippet_save": "Save a Code Mode snippet by name for later reuse.",
        "snippet_run": "Run a saved Code Mode snippet by name, optionally with input.",
        "snippet_delete": "Delete a saved Code Mode snippet by name.",
    }
    return descriptions.get(action, "Document this action in scripts/check-schema-docs.py.")


def render() -> str:
    actions = extract_actions()
    scopes = extract_scope_for_actions()
    lines = [
        "---",
        'title: "MCP Schema Contract"',
        "created: 2026-05-22",
        "updated: 2026-07-30",
        "---",
        "",
        "# MCP Schema Contract",
        "",
        "Generated from `src/actions/` and checked against the schema, README, skill docs, help text, and scope routing.",
        "",
        "Run:",
        "",
        "```bash",
        "python3 scripts/check-schema-docs.py --write",
        "python3 scripts/check-schema-docs.py --check",
        "```",
        "",
        "## Tool",
        "",
        "| Field | Value |",
        "|---|---|",
        "| Tool name | `yarr` (single Code Mode tool) |",
        "| Schema resource | `yarr://schema/mcp-tool` |",
        "| Dispatch parameter | `code` (a JS script) dispatches the `codemode` action; other actions take `action` + params |",
        "",
        "## Actions",
        "",
        "| Action | Scope | Description |",
        "|---|---|---|",
    ]
    for action in actions:
        scope = scopes[action]
        lines.append(f"| `{action}` | {scope} | {action_description(action)} |")
    lines.extend(
        [
            "",
            "## Drift Rules",
            "",
            "- `ACTION_SPECS` in `src/actions/registry.rs` is the canonical generic action and scope list; curated commands live in `CURATED_COMMANDS`.",
            "- `src/mcp/schemas.rs` derives the single `yarr` tool's action enum from `all_action_names()` (via the generated `properties`); `src/mcp/schemas/conditionals.rs` generates the action-specific requirements.",
            "- The MCP tool schema must reject unknown top-level parameters and encode action-specific requirements for the action dispatch the single `yarr` tool wraps.",
            "- `help` is intentionally public and must have no required scope.",
            "- Help text is generated in `src/actions/help.rs` from the registry; `README.md` and `plugins/yarr/skills/yarr/SKILL.md` must mention every action.",
            "- `src/mcp/rmcp_server.rs` owns stable resources and must keep `yarr://schema/mcp-tool` wired to `tool_definitions()`.",
            "- `src/mcp/prompts.rs` owns stable prompts and must keep `quick_start` covered by prompt tests.",
            "",
            "## Resources",
            "",
            "| URI | Source | Contract |",
            "|---|---|---|",
            "| `yarr://schema/mcp-tool` | `src/mcp/rmcp_server.rs` | Returns `tool_definitions()` as `application/json`. |",
            "",
            "## Prompts",
            "",
            "| Prompt | Source | Contract |",
            "|---|---|---|",
            "| `quick_start` | `src/mcp/prompts.rs` | Guides a client to write a short Code Mode script that discovers a service's status callable via `codemode.search` and invokes it. |",
            "",
            "## Input Validation",
            "",
            "- `action` is always required.",
            "- `service_status` uses the service implied by the tool name.",
            "- `api_get` conditionally requires non-empty `path`.",
            "- `api_post` conditionally requires non-empty `path`; `body` defaults to `{}`. Non-destructive; runs immediately.",
            "- `api_put` conditionally requires non-empty `path`; `body` defaults to `{}`. Non-destructive; runs immediately.",
            "- `api_delete` conditionally requires non-empty `path`; `body` is optional (query params go in `path`). Destructive: gated by MCP elicitation only (no bypass); the CLI has no elicitation channel and runs it immediately. Not a required schema param.",
            "- Unknown top-level parameters are rejected by the schema.",
            "",
        ]
    )
    return "\n".join(lines)


def check_mentions(actions: list[str]) -> list[str]:
    failures: list[str] = []
    # Help text is now generated in src/actions/help.rs from the registry, so
    # action names no longer appear as literals in tools.rs. The doc-facing surfaces
    # (README, SKILL) must still mention every action.
    surfaces = {
        "README.md": read(README),
        "plugins/yarr/skills/yarr/SKILL.md": read(SKILL),
    }
    for label, text in surfaces.items():
        for action in actions:
            if action not in text:
                failures.append(f"{label} does not mention action `{action}`")
    return failures


def check_scope(actions: list[str]) -> list[str]:
    failures: list[str] = []
    scopes = extract_scope_for_actions()
    if set(scopes) != set(actions):
        failures.append("ACTION_SPECS action names and scope entries are out of sync")
    if scopes.get("help") != "public":
        failures.append("help must be public")
    for action in set(actions) - {"help"}:
        if scopes.get(action) == "public":
            failures.append(f"action `{action}` must declare a required scope")
    schema_text = read(SCHEMAS_RS)
    if "valid_actions_for_kind" not in read(ROOT / "src/mcp/schemas/properties.rs"):
        failures.append("src/mcp/schemas/properties.rs must derive action enum from valid_actions_for_kind()")
    if '"additionalProperties": false' not in schema_text:
        failures.append("src/mcp/schemas.rs must reject unknown top-level properties")
    # Conditionals are generated from the registry in conditionals.rs. The
    # required-params mirror is data-driven (generic_required_params); verify the
    # generator wiring rather than literal allOf strings.
    conditionals_text = read(CONDITIONALS_RS)
    if "required_params_for_action" not in conditionals_text:
        failures.append(
            "src/mcp/schemas/conditionals.rs must derive required params from the registry"
        )
    if '"service"' in conditionals_text and "filter(|param| *param != \"service\")" not in conditionals_text:
        failures.append(
            "src/mcp/schemas/conditionals.rs must remove service requirements for service-named tools"
        )
    # The required-params data lives in registry.rs (generic_required_params).
    # There is no `confirm` param anywhere — plain writes and the destructive
    # api_delete all run immediately; on MCP, api_delete additionally gets an
    # elicitation prompt before dispatch (src/mcp/elicit.rs).
    registry_text = read_actions_tree()
    if '"service", "path"' not in registry_text:
        failures.append(
            "src/actions/registry.rs must encode service/path required params"
        )
    rmcp_server_text = read(RMCP_SERVER_RS)
    if "yarr://schema/mcp-tool" not in rmcp_server_text or "tool_definitions()" not in rmcp_server_text:
        failures.append("src/mcp/rmcp_server.rs must expose the schema resource from tool_definitions()")
    prompts_text = read(PROMPTS_RS)
    if "quick_start" not in prompts_text:
        failures.append("src/mcp/prompts.rs must expose quick_start prompt")
    return failures


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--write", action="store_true", help="Rewrite docs/MCP_SCHEMA.md.")
    parser.add_argument("--check", action="store_true", help="Fail if docs or action surfaces drift.")
    args = parser.parse_args()
    if not args.write and not args.check:
        args.check = True

    rendered = render()
    if args.write:
        DOC.write_text(rendered, encoding="utf-8")
        print(f"wrote {DOC.relative_to(ROOT)}")

    failures: list[str] = []
    if args.check:
        if not DOC.exists():
            failures.append("docs/MCP_SCHEMA.md is missing; run --write")
        elif read(DOC) != rendered:
            failures.append("docs/MCP_SCHEMA.md is stale; run --write")
        actions = extract_actions()
        failures.extend(check_mentions(actions))
        failures.extend(check_scope(actions))

    if failures:
        for failure in failures:
            print(f"FAIL: {failure}", file=sys.stderr)
        return 1
    if args.check:
        print("schema docs are current")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
