# Documentation index

Use this page as the routing table for Yarr documentation. Executable code,
tests, workflows, manifests, and generated contracts remain authoritative when
a narrative guide drifts.

## Start by role

| Reader | Start here | Then use |
|---|---|---|
| New operator | [QUICKSTART.md](QUICKSTART.md) | [CONFIG.md](CONFIG.md), [AUTH.md](AUTH.md), [DEPLOYMENT.md](DEPLOYMENT.md) |
| Unraid operator | [Unraid operator guide](../unraid-plugin/README.md) | [CI.md](CI.md), [partial release runbook](runbooks/partial-release.md) |
| MCP client integrator | [API.md](API.md) | [MCP_SCHEMA.md](MCP_SCHEMA.md), [TOOLS_ACTIONS_ENDPOINTS.md](TOOLS_ACTIONS_ENDPOINTS.md) |
| Plugin user or maintainer | [PLUGINS.md](PLUGINS.md) | [plugins/README.md](../plugins/README.md), [full plugin guide](../plugins/yarr/README.md) |
| Production operator | [DEPLOYMENT.md](DEPLOYMENT.md) | [DOCKER.md](DOCKER.md), [SYSTEMD.md](SYSTEMD.md), [OBSERVABILITY.md](OBSERVABILITY.md) |
| Contributor | [CLAUDE.md](../CLAUDE.md) | [TESTING.md](TESTING.md), [CI.md](CI.md), [DOCS.md](DOCS.md) |
| Release operator | [CI.md](CI.md) | [partial release runbook](runbooks/partial-release.md), [deployment rollback](runbooks/deployment-rollback.md) |

## Product and runtime

| Document | Coverage |
|---|---|
| [QUICKSTART.md](QUICKSTART.md) | Native, source, exact-version npm, marketplace, and Unraid first run |
| [ARCHITECTURE.md](ARCHITECTURE.md) | Rust modules, layers, and ownership boundaries |
| [PHILOSOPHY.md](PHILOSOPHY.md) | Design principles and project boundaries |
| [AGENTS-FIRST.md](AGENTS-FIRST.md) | Agent-oriented outputs, errors, and workflows |
| [API.md](API.md) | MCP and CLI action model plus public HTTP endpoints |
| [CONFIG.md](CONFIG.md) | Configuration loading and auth-policy summary |
| [ENV.md](ENV.md) | Environment variable reference |
| [AUTH.md](AUTH.md) | Bearer, OAuth, trusted-gateway, and stdio trust models |
| [OBSERVABILITY.md](OBSERVABILITY.md) | Health, readiness, status, metrics, and logging |
| [WEB.md](WEB.md) | Current HTTP and Unraid web surfaces; standalone UI removal |

## Distribution and operations

| Document | Coverage |
|---|---|
| [DEPLOYMENT.md](DEPLOYMENT.md) | Install choices, preflight, Compose, systemd, public endpoints, and Unraid |
| [DOCKER.md](DOCKER.md) | Image build, immutable production digest, probes, and rollback |
| [SYSTEMD.md](SYSTEMD.md) | User-unit pattern, environment, restart, and freshness checks |
| [PLUGINS.md](PLUGINS.md) | Claude, Codex, and Gemini packages plus exact launcher availability |
| [Unraid operator guide](../unraid-plugin/README.md) | Install, settings, GraphQL, lifecycle, discovery, updates, recovery, and release |
| [deployment rollback](runbooks/deployment-rollback.md) | Restore a previously recorded immutable image |
| [partial release recovery](runbooks/partial-release.md) | GitHub and npm split-brain triage and safe recovery |

## Contracts and generated references

| Document | Authority |
|---|---|
| [PATTERNS.md](PATTERNS.md) | Normative reusable RMCP-family patterns |
| [MCP_SCHEMA.md](MCP_SCHEMA.md) | Checked action, scope, and schema contract |
| [TOOLS_ACTIONS_ENDPOINTS.md](TOOLS_ACTIONS_ENDPOINTS.md) | Generated operation, action, and endpoint matrix |
| [LIVE_ENDPOINT_COVERAGE.md](LIVE_ENDPOINT_COVERAGE.md) | Generated live endpoint coverage evidence |
| [MCP-REGISTRY-PUBLISH-GUIDE.md](MCP-REGISTRY-PUBLISH-GUIDE.md) | MCP registry publication procedure |

Do not hand-edit generated references. Their headers name the generator and
check command.

## Development and maintenance

| Document | Coverage |
|---|---|
| [TESTING.md](TESTING.md) | Unit, integration, sidecar, and live-test strategy |
| [MCPORTER.md](MCPORTER.md) | Live MCP testing and generated client CLI |
| [CI.md](CI.md) | Required GitHub jobs, Unraid workflows, release gates, and audits |
| [PRE-COMMIT.md](PRE-COMMIT.md) | Lefthook and fast local guards |
| [XTASKS.md](XTASKS.md) | `cargo xtask` automation |
| [JUSTFILE.md](JUSTFILE.md) | `just` recipes |
| [SCRIPTS.md](SCRIPTS.md) | Script categories and maintenance rules |
| [DOCS.md](DOCS.md) | Documentation authority, placement, freshness, and validation |

## Historical and working records

- `sessions/` contains handoff and session records. They may describe
  superseded behavior.
- `superpowers/plans/` and `superpowers/specs/` contain durable historical
  design records, not current runtime authority.
- `references/` is locally refreshed, gitignored upstream reference material.
- `openwiki/` is generated orientation content and must be checked against
  executable sources before merge.

## Keep documentation current

Run these after changing commands, manifests, actions, workflows, scripts, or
operator behavior:

```bash
cargo xtask tool-docs --check
python3 scripts/check-schema-docs.py --check
python3 scripts/check-doc-links.py
bash scripts/run-ascii-check.sh
bash scripts/check-coupled-files.sh origin/main HEAD
```

Use `scripts/pre-release-check.sh` for the full release-readiness gate. Update
`last_reviewed` only after materially verifying a maintained guide against
its executable sources.
