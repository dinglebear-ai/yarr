---
title: "Observability"
created: 2026-05-22
updated: 2026-07-30
---

---
title: "Observability"
doc_type: "guide"
status: "active"
owner: "yarr"
audience: ["operators", "contributors", "agents"]
scope: "project"
source_of_truth: false
last_reviewed: "2026-07-16"
---

# Observability

## Probe contract

| Endpoint | Auth | Contract |
|---|---|---|
| `GET /health` | Public | Process liveness only; no config/upstream work |
| `GET /ready` | Public | 200 when at least one usable service is configured and OAuth state initialized when enabled; otherwise structured 503 |
| `GET /status` | Public | Redacted server/version/transport identity |
| `GET /metrics` | Public | Prometheus text exposition |
| `POST /mcp` | Auth policy | MCP transport |

Public means the application does not authenticate the route. Limit probe and
metrics reachability at the network/reverse-proxy layer when necessary.
Readiness is intentionally local and cheap; use `yarr doctor --json` and
read-only service actions for upstream health.

## Metrics

`axum-prometheus` emits prefixed HTTP request count, status, and latency metrics.
Inspect the current scrape output rather than relying on a copied library-name
list:

```bash
curl --fail http://127.0.0.1:40070/metrics
```

Yarr-owned domain metrics use bounded labels only:

| Metric | Labels | Meaning |
|---|---|---|
| `yarr_upstream_requests_total` | `service`, `kind`, `outcome` | Upstream results: `success`, `transport_error`, `http_error`, or `oversized` |
| `yarr_codemode_runs_total` | `outcome` | Run lifecycle events: `started`, `completed`, or `failed` |
| `yarr_codemode_active` | none | Currently active Code Mode runs |
| `yarr_auth_failures_total` | `reason` | MCP context/scope rejection: `missing_http_context`, `missing_auth_context`, or `insufficient_scope` |
| `yarr_auth_token_issuance_total` | `outcome` | OAuth `/token` attempt labeled `admitted` or `rate_limited` |
| `yarr_qbittorrent_relogins_total` | `service`, `outcome` | SID re-login result: `success` or `failed` |
| `yarr_artifact_bytes_total` | `outcome` | Attempted artifact bytes with `written` or `error` outcome |
| `yarr_snippet_operations_total` | `operation`, `outcome` | `list`, `save`, `run`, or `delete` result labeled `success` or `error` |
| `yarr_log_events_dropped_total` | `reason` | Async JSON log loss labeled `queue_full` or `writer_disconnected` |

Never put URL paths containing IDs, user-provided operation names, credentials,
email addresses, artifact paths, snippet names, or exception text in labels.

Prometheus alert examples live at `config/prometheus/yarr-alerts.yml`. Its Code
Mode threshold matches the default concurrency limit of 4; change the alert
when `YARR_MCP_CODEMODE_MAX_CONCURRENT` changes. Tune traffic thresholds for
the deployment, but preserve metric/label contracts.
The readiness alert assumes a blackbox scrape named `yarr-ready`.
OAuth token issuance is capped process-wide at 30 attempts per rolling minute;
the alert file warns on any `rate_limited` outcome. Also enforce a per-client
`/token` rate limit at the reverse proxy because the process-local cap is only
aggregate defense-in-depth.

## Logging

HTTP server mode writes human-readable Aurora-formatted logs to stderr and JSON
lines to `{data_dir}/logs/yarr.log`. `data_dir` is `YARR_HOME`, `/data` in a
container, or `~/.yarr`. CLI and stdio avoid file/stdout logging that could
corrupt command or JSON-RPC output.

`RUST_LOG` controls both server log destinations. Secrets, authorization
headers, cookies, signing keys, and query credentials must never be logged.

The local JSON log is checked at startup and truncated if already at least 10
MiB. It is not rotated or rechecked while the process runs, so ship stderr or
the file to an external log system for bounded production retention.

## Workflow notifications

Scheduled dependency, Docker publication, and staged release workflows write
job summaries and create/deduplicate repository issues on failed safety-critical
stages. GitHub rulesets keep a red required check from merging. Issue creation
is a notification; the workflow run and artifact/digest remain the evidence.

## Ownership and runbooks

High-risk files and runbooks are assigned in `.github/CODEOWNERS`.

- `docs/runbooks/authentication-failures.md`
- `docs/runbooks/upstream-failures.md`
- `docs/runbooks/resource-pressure.md`
- `docs/runbooks/deployment-rollback.md`
- `docs/runbooks/partial-release.md`
- `docs/runbooks/dependency-response.md`

Every incident record should include release/image digest, relevant workflow or
deployment URL, timestamps, bounded metric labels, redacted logs, and the exact
recovery verification performed.
