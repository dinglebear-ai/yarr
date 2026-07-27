---
title: "Documentation Maintenance"
doc_type: "guide"
status: "active"
owner: "yarr"
audience: ["contributors", "agents"]
scope: "project"
source_of_truth: true
upstream_refs:
  - "docs/CLAUDE.md"
  - "scripts/check-schema-docs.py"
  - "scripts/check-doc-links.py"
  - "xtask/src/tool_docs.rs"
last_reviewed: "2026-07-27"
---

# Documentation maintenance

Yarr keeps stable guidance close to the executable contracts it explains. This
file defines where documentation belongs, which layer wins during disagreement,
and the checks required to prevent quiet drift.

## Authority order

1. Executable code, tests, schemas, workflows, package manifests, and config parsers.
2. Generated references produced from those sources.
3. Maintained guides in the repository root, `docs/`, `unraid-plugin/`, `plugins/`, and `scripts/`.
4. OpenWiki orientation pages and historical plans, reports, research, or session notes.

A narrative document must not override a stricter executable contract. Fix the
guide or generator when the layers disagree.

## Documentation map

| Location | Purpose | Lifecycle |
|---|---|---|
| `README.md` | Product overview, safe install path, first navigation | Maintained and mirrored into the npm package |
| `docs/README.md` | Role-based index of stable guides and references | Maintained |
| `docs/*.md` | Focused architecture, operations, security, and contributor guides | Maintained unless generated header says otherwise |
| `unraid-plugin/README.md` | Complete classic Unraid operator/API/recovery/release guide | Maintained with Unraid source and tests |
| `plugins/README.md` and `plugins/*/README.md` | Marketplace package and platform behavior | Maintained with manifests/hooks/skills |
| `scripts/README.md` | Script inventory, invocation, and maintenance contract | Maintained whenever scripts change |
| `docs/runbooks/` | Procedural incident, release, and rollback instructions | Maintained and evidence-oriented |
| `docs/superpowers/` | Historical design and implementation records | Durable history, not runtime authority |
| `docs/sessions/` | Handoffs and session records | Historical; may be stale |
| `docs/references/` | Locally refreshed upstream references | Gitignored |
| `openwiki/` | Generated repository orientation | Generated; verify before merge |

## Frontmatter

Maintained narrative guides should use YAML frontmatter when practical:

```yaml
---
title: "Human-readable title"
doc_type: "guide"
status: "active"
owner: "yarr"
audience: ["operators", "contributors"]
scope: "project"
source_of_truth: false
upstream_refs:
  - "path/to/executable/source"
last_reviewed: "2026-07-27"
---
```

Generated documents, indexes, contracts consumed by generators, and package
READMEs may intentionally omit frontmatter. Do not add frontmatter to a
generated file unless its generator also emits it.

`last_reviewed` means the content was materially compared with its executable
sources on that date. Do not update it for typography-only edits.

## Stable guide placement

Use the narrowest durable home:

- first install and product orientation: root `README.md` and `docs/QUICKSTART.md`;
- configuration/auth variables: `docs/CONFIG.md`, `docs/ENV.md`, `docs/AUTH.md`;
- deployment/runtime operations: `docs/DEPLOYMENT.md`, `docs/DOCKER.md`, `docs/SYSTEMD.md`;
- plugin packaging: `docs/PLUGINS.md` and package-local READMEs;
- Unraid behavior: `unraid-plugin/README.md`;
- CI and release policy: `docs/CI.md`;
- executable script behavior: `scripts/README.md` and `docs/SCRIPTS.md`;
- step-by-step incidents and rollback: `docs/runbooks/`;
- reusable family rules: `docs/PATTERNS.md`;
- temporary investigation detail: reports/sessions, followed by promotion of accepted facts into a stable guide.

## Generated and checked references

### MCP schema

`scripts/check-schema-docs.py` treats the action registry under `src/actions/`
as canonical and generates/checks `docs/MCP_SCHEMA.md`. It also verifies that
root README, help text, and plugin skill docs mention the required actions.

```bash
python3 scripts/check-schema-docs.py
python3 scripts/check-schema-docs.py --check
```

### Tool/action/endpoint matrix

`cargo xtask tool-docs` generates `docs/TOOLS_ACTIONS_ENDPOINTS.md`:

```bash
cargo xtask tool-docs
cargo xtask tool-docs --check
```

### Live endpoint coverage

Live suites write and check `docs/LIVE_ENDPOINT_COVERAGE.md` from structured
coverage evidence. Regenerate through the documented `cargo xtask live` flow,
not by editing the table.

### OpenWiki and external references

`openwiki/` is generated orientation content. `scripts/refresh-docs.sh` refreshes
gitignored upstream references and Repomix packs:

```bash
just refresh-docs-dry
just refresh-docs
```

Generated output must be reviewed against executable sources before commit.

## Link and anchor policy

- Repository links must be relative and remain inside the repository.
- Do not use root-relative Markdown paths such as `/openwiki/...`; they fail in package and non-GitHub renderers.
- Encode spaces in local paths.
- Use absolute HTTPS links only when content must work outside the repository, such as the npm README linking back to GitHub.
- Keep heading anchors valid after renaming sections.
- Do not validate URLs embedded inside fenced command examples as Markdown links.

Run:

```bash
python3 scripts/check-doc-links.py
```

The checker walks every tracked Markdown file, rejects missing or escaping
targets, validates directory READMEs, and verifies local heading anchors.

## README mirroring

`packages/yarr-mcp/README.md` is the published npm README and must remain an
exact copy of root `README.md`. Root README links that need to work on npm must
use GitHub HTTPS URLs rather than repository-relative paths unavailable from
`packages/yarr-mcp/`. Package checks enforce the mirror.

## Freshness checklist

When changing behavior, answer all applicable questions:

- Did the first-run command, default, path, port, auth mode, or supported service change?
- Did a release artifact, npm version, image tag, package URL, checksum, or workflow change?
- Did an MCP action, CLI verb, schema field, endpoint, or permission change?
- Did an Unraid settings field, GraphQL operation, updater state, persistence rule, or recovery path change?
- Did a plugin manifest, hook, settings bridge, fallback helper, or launcher pin change?
- Did a script or `just` recipe gain flags, dependencies, side effects, or failure modes?
- Does the changelog describe operator-visible impact?
- Are examples safe, runnable, pinned where reproducibility matters, and free of credentials?

Update every affected stable guide, package README, runbook, and generated
reference. Prefer one canonical explanation plus clear cross-links over copied
paragraphs that will diverge.

## Required documentation checks

```bash
cargo xtask tool-docs --check
python3 scripts/check-schema-docs.py --check
python3 scripts/check-doc-links.py
bash scripts/run-ascii-check.sh
bash scripts/check-coupled-files.sh origin/main HEAD
git diff --check
```

Run `scripts/pre-release-check.sh` for release-sensitive work and
`bash unraid-plugin/tests/run.sh` when Unraid documentation changes describe
executable lifecycle, update, API, workflow, or package contracts.

## Agent instruction symlinks

`AGENTS.md` and `GEMINI.md` are symlinks to the nearest `CLAUDE.md`. Edit the
Claude source and regenerate links after adding a new instruction file:

```bash
cargo xtask symlink-docs
```

## Review standard

A documentation change is complete only when:

1. commands and paths were checked against the current implementation;
2. current external availability claims were verified or clearly labeled as time-sensitive;
3. security boundaries and destructive behavior are explicit;
4. rollback, failure, and evidence collection are covered where applicable;
5. links, generated references, ASCII policy, and coupled-file gates pass;
6. historical notes are not presented as current runtime authority.
