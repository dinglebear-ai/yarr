---
title: "Web Surfaces"
doc_type: "guide"
status: "active"
owner: "yarr"
audience: ["operators", "contributors", "agents"]
scope: "project"
source_of_truth: false
upstream_refs:
  - "src/server/routes.rs"
  - "unraid-plugin/web/"
  - "unraid-plugin/api/src/yarr.resolver.ts"
last_reviewed: "2026-07-27"
---

# Web surfaces

Yarr does not ship a general standalone web application. The former Next.js
`apps/web/` tree, Rust asset-embedding module, and static-export recipes were
removed. The current web-facing surfaces are the Streamable HTTP server and the
separate classic Unraid settings/dashboard integration.

## Core HTTP surface

`yarr serve` exposes:

| Route | Purpose | Authentication |
|---|---|---|
| `/mcp` | Streamable HTTP MCP transport | Bearer, OAuth, or trusted-gateway policy |
| `/health` | Process liveness | Public |
| `/ready` | Configured-service readiness | Public |
| `/status` | Redacted runtime identity | Public |
| `/metrics` | Prometheus metrics | Public |

The probe routes are intentionally bounded and unauthenticated. Restrict them
with host firewall, container publishing, or reverse-proxy policy when the
server is reachable beyond loopback. See [AUTH.md](AUTH.md),
[OBSERVABILITY.md](OBSERVABILITY.md), and [DEPLOYMENT.md](DEPLOYMENT.md).

## Unraid settings and dashboard

The classic Unraid distribution owns a dedicated Vue/custom-element web layer
under `unraid-plugin/web/` and a NestJS GraphQL extension under
`unraid-plugin/api/`. It is not served by the core Rust binary.

The settings application provides Overview, Services, Server & Auth, Updates,
and Logs tabs plus explicit Import and Discover review dialogs. The dashboard
widget shows compact runtime/freshness state and can be persistently disabled.

The browser:

- sends the host-provided CSRF token with GraphQL requests;
- bounds response bytes and request time;
- cancels failed or oversized streams;
- never stores credentials in browser persistence;
- receives secret-presence booleans rather than secret values;
- exposes only user-safe request errors.

Bundle contracts reject Node/process dependencies and smoke-test custom-element
registration in a browser-like environment. The complete settings, GraphQL,
auth, recovery, and verification reference is the
[Unraid operator guide](../unraid-plugin/README.md).

## Historical note

Historical plans or sessions may still mention a general web UI. Those records
are not current runtime authority. New general-purpose UI work requires an
explicit product/design change; it must not be inferred from the Unraid web
package or the public HTTP endpoints.
