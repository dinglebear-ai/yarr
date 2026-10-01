---
title: "Documentation Instructions"
doc_type: "guide"
status: "active"
owner: "yarr"
audience: ["contributors", "agents"]
scope: "project"
source_of_truth: false
last_reviewed: "2026-07-16"
---

# Documentation instructions

The repository-root `CLAUDE.md` is the contributor source of truth. This file
only explains the documentation tree. `AGENTS.md` and `GEMINI.md` are symlinks
to the nearest `CLAUDE.md`; edit the Claude file and run
`cargo xtask symlink-docs` after adding a new instruction file.

## Documentation layers

- `docs/*.md` contains maintained guides and generated references.
- `docs/TOOLS_ACTIONS_ENDPOINTS.md` and `docs/LIVE_ENDPOINT_COVERAGE.md` are
  generated artifacts. Change their generators or live coverage source, then
  regenerate them; do not repair generator bugs by hand.
- `docs/reports/` contains durable audits and investigations.
- `docs/sessions/` and `docs/superpowers/plans/` are historical working
  records. They may describe superseded behavior and are not runtime authority.
- Root `specs/` contains the vendored OpenAPI inputs. Generated runtime tables
  live under `src/openapi/generated/`.

There is no `docs/references/mcp/` snapshot in this repository. For MCP
protocol decisions, use the pinned `rmcp` dependency and current upstream MCP
specification, and record the revision consulted in the change.

## Authority order

For current behavior, prefer:

1. Executable code, tests, workflow files, and config parsers.
2. Generated references produced from those sources.
3. Maintained guides in `docs/`.
4. Historical reports, plans, and session notes.

Do not turn an old session note into a current claim without verifying it.

## Required checks

Use the checks relevant to the edited surface:

```bash
cargo xtask tool-docs --check
cargo xtask live --suite coverage-check
cargo xtask patterns
python3 scripts/check-schema-docs.py --check
bash scripts/run-ascii-check.sh
```

Workflow, Compose, installer, and plugin docs also require their executable
validators. Commands shown in documentation must be runnable as written.

## Style and lifecycle

- State defaults, auth requirements, limitations, and destructive behavior
  explicitly.
- Link to source-owned references rather than copying large inventories.
- Keep credentials and private infrastructure values out of examples.
- Mark future or unsupported behavior as such; do not present it as shipped.
- Update `last_reviewed` when a maintained guide is verified materially.
- `TEMPLATE:` markers are used only where a specific reusable pattern requires
  adaptation. They are not mandatory in every document.
