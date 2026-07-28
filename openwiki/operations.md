# Operations

## Run modes

```bash
yarr mcp                 # stdio MCP
yarr serve               # Streamable HTTP MCP
yarr serve mcp           # equivalent HTTP spelling
yarr sonarr status       # CLI
yarr doctor --json       # config and upstream diagnostics
```

The HTTP code default is `127.0.0.1:40070`. Containers explicitly set
`YARR_MCP_HOST=0.0.0.0` and must configure auth/trusted-gateway policy.
Local OAuth deployments run exactly one replica; the exclusive auth SQLite
instance lock intentionally rejects horizontal replicas.

## OpenWiki docs automation

The scheduled documentation update workflow is `.github/workflows/openwiki-update.yml`.
It runs on `workflow_dispatch` and daily at `0 8 * * *`.

The workflow executes:

1. checkout and Node.js setup
2. `npm install --global openwiki`
3. `openwiki code --update --print`

The OpenWiki step sets:

- `OPENWIKI_PROVIDER=openrouter`
- `OPENROUTER_API_KEY`
- `OPENWIKI_MODEL_ID=z-ai/glm-5.2`
- optional tracing vars: `LANGSMITH_API_KEY`, `LANGCHAIN_PROJECT`,
  `LANGCHAIN_TRACING_V2`

The update PR is created with `peter-evans/create-pull-request` v7 (branch `openwiki/update`) and includes
`openwiki`, `AGENTS.md`, `CLAUDE.md`, and `.github/workflows/openwiki-update.yml`.

## Probes

| Route | Auth | Meaning |
|---|---|---|
| `/health` | public | process liveness |
| `/ready` | public | usable local service config and OAuth initialization |
| `/status` | public | redacted server identity |
| `/metrics` | public | Prometheus exposition |
| `/mcp` | policy | MCP transport |

`/ready` does not call every upstream. Use `yarr doctor --json` and read-only
status actions for upstream diagnosis.

## Container deployment

Build from `config/Dockerfile`, not a nonexistent root Dockerfile command:

```bash
docker build -f config/Dockerfile -t yarr:dev .
```

Production Compose requires a promoted immutable digest and `.env`:

```bash
export YARR_MCP_IMAGE='ghcr.io/dinglebear-ai/yarr@sha256:<verified-digest>'
docker compose -f docker-compose.prod.yml up -d --wait yarr-mcp
```

Record the current digest before deployment and restore it on readiness
failure. See `docs/runbooks/deployment-rollback.md`.

## systemd

The repository does not ship `systemd/yarr.service`. `docs/SYSTEMD.md` contains
a reviewed user-unit pattern. Point `ExecStart` at the installed binary and use
`yarr doctor --json` as preflight.

## Logging and data

Server stderr is human-readable and `{data_root}/logs/yarr.log` is JSON lines.
The data root is `YARR_HOME`, `/data` in a container, or `~/.yarr`. Snippets are
atomic JSON records under `codemode/snippets/`; artifacts live under
`codemode/artifacts/`.

## Metrics and alerts

Do not rely on the former invented `mcp_requests_total` or
`upstream_request_errors_total` names. Scrape `/metrics` for the current
HTTP-library names and use the Yarr-owned metrics documented in
`docs/OBSERVABILITY.md`. Prometheus alert examples are in
`config/prometheus/yarr-alerts.yml`.
Alert on `yarr_auth_token_issuance_total{outcome="rate_limited"}` and enforce a
per-client `/token` rate limit at the reverse proxy in addition to Yarr's
process-wide 30-attempt rolling-minute cap.

## Backup

Back up operator-managed config/secrets according to the local secrets policy,
plus `codemode/snippets/` if reusable snippets matter. Do not copy from a
nonexistent top-level `snippets/` directory. Artifacts and logs are normally
recreatable and should have an explicit retention policy.
