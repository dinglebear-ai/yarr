---
title: "Authentication"
created: 2026-05-22
updated: 2026-07-30
---

# Authentication

This server supports two authentication mechanisms simultaneously: **static bearer tokens** and **OAuth 2.0**. They serve different audiences and can be active at the same time.

---

## Why two mechanisms?

**Bearer tokens** are for agents and automation. An agent sets `Authorization: Bearer <token>` and makes calls. No browser, no redirect flow, no session cookie — just a shared secret. Tokens are fast to issue (`just gen-token`) and easy to rotate.

**OAuth** is for humans. It runs a full browser-based Google OAuth flow, issues short-lived JWTs, and maintains refresh tokens. This is the right choice when a human user needs to grant access through a UI without ever seeing a raw token.

When both are configured, each request is accepted if it satisfies either mechanism. A human signs in via OAuth; an agent uses a token. They share the same server.

---

## Scopes

All non-trivial actions require at least `yarr:read`. Mutating actions require `yarr:write`, which also satisfies read checks. The `help` action is always public.

Static bearer tokens default to `yarr:read`. Set `YARR_MCP_STATIC_TOKEN_SCOPES=yarr:write` (or `yarr:read,yarr:write`) only when that shared token must call write-scoped operations or Code Mode. OAuth tokens carry the scopes issued by the OAuth flow.

---

## Configuring bearer token auth

```bash
# Generate a token
export YARR_MCP_TOKEN=$(openssl rand -hex 32)

# Or: just gen-token
```

Set `YARR_MCP_TOKEN` in your environment or `.env` file. An explicit token is enforced on both loopback and non-loopback HTTP binds. Clients authenticate with:

```
Authorization: Bearer <token>
```

The safe default is read-only:

```bash
YARR_MCP_STATIC_TOKEN_SCOPES=yarr:read
YARR_MCP_TOOL_MODE=flat
```

To use the default single-tool Code Mode surface with a static token, grant write explicitly:

```bash
YARR_MCP_STATIC_TOKEN_SCOPES=yarr:write
YARR_MCP_TOOL_MODE=codemode
```

Bearer-only startup fails instead of advertising an unusable Code Mode tool when the token lacks `yarr:write`.

---

## Configuring OAuth

Set the following environment variables:

```bash
YARR_MCP_AUTH_MODE=oauth
YARR_MCP_PUBLIC_URL=https://your-server.yarr.com   # public URL for OAuth callbacks
YARR_MCP_GOOGLE_CLIENT_ID=...
YARR_MCP_GOOGLE_CLIENT_SECRET=...
YARR_MCP_AUTH_ADMIN_EMAIL=you@yarr.com
```

The server exposes standard OAuth discovery endpoints under `/mcp/.well-known/` that MCP clients can use for dynamic registration. Session cookies are disabled — all auth is via `Authorization` headers.

OAuth and bearer token can coexist: set both `YARR_MCP_TOKEN` and the OAuth variables. To disable bearer tokens while OAuth is active, set `disable_static_token_with_oauth = true` under `[mcp.auth]` in `config.toml` (this is a config file field, not an environment variable).

OAuth `public_url` must be an HTTPS origin with no credentials, query, or
fragment. Plain HTTP is accepted only for loopback development URLs. Unknown
keys under `[mcp.auth]` are rejected so a misspelled security setting cannot be
silently ignored.

OAuth `POST /token` is capped process-wide at 30 attempts per rolling minute.
Excess attempts return HTTP 429 with `Retry-After: 60` and increment
`yarr_auth_token_issuance_total{outcome="rate_limited"}`. This in-process cap
is aggregate, resets on restart, and cannot identify a client behind a shared
address. Production reverse proxies must also enforce a per-client `/token`
rate limit before requests reach Yarr.

The RSA implementation used transitively by `lab-auth` is temporarily covered
by the reviewed `RUSTSEC-2023-0071` exception in `deny.toml`. That exception
expires on 2026-10-01 and CI fails closed on or after the deadline. HTTPS,
mode-restricted signing-key storage, validated OAuth grants, short-lived tokens,
the process-wide signing cap, its metric/alert, and reverse-proxy per-client
limits reduce exposure while `lab-auth` is migrated to Ed25519; they do not
make the timing advisory disappear.

Local OAuth state is single-replica. Before initializing OAuth, Yarr acquires
an exclusive `${sqlite_path}.instance.lock` next to the configured auth SQLite
database and holds it for the process lifetime. A second replica using that
database fails startup with an instruction to run exactly one replica or
disable local OAuth. NFS/network-shared SQLite and lock files are unsupported;
do not use them as a scaling mechanism. Multiple OAuth replicas require a
future shared auth/state backend.

---

## The startup guard

**The HTTP server will refuse to start if it is binding to a non-loopback address with no authentication configured.**

This is enforced by `server::resolve_auth_policy_kind()`. The exact error:

```
Refusing to bind MCP server to 0.0.0.0 without authentication.

Choose one of:
1. Bind to loopback:    YARR_MCP_HOST=127.0.0.1
2. Set a bearer token:  YARR_MCP_TOKEN=$(openssl rand -hex 32)
3. Enable OAuth:        YARR_MCP_AUTH_MODE=oauth (+ OAuth credentials)
4. Disable auth:        YARR_MCP_HOST=127.0.0.1 YARR_MCP_NO_AUTH=true
5. Upstream gateway:    YARR_NOAUTH=true  (if a proxy handles auth)
```

The guard passes when any of the following is true:

| Condition | Variable | Notes |
|---|---|---|
| Loopback bind without explicit auth | `YARR_MCP_HOST=127.0.0.1` | Trust boundary is the network address |
| Bearer token set | `YARR_MCP_TOKEN=<token>` | Auth middleware enforces it on any HTTP bind |
| OAuth enabled | `YARR_MCP_AUTH_MODE=oauth` | Auth middleware enforces it on any HTTP bind |
| Auth disabled | `YARR_MCP_HOST=127.0.0.1` + `YARR_MCP_NO_AUTH=true` | Local dev — see below |
| Gateway override | `YARR_NOAUTH=true` | Upstream handles auth — see below |

---

## Local development (no auth)

For local development, disable auth entirely:

```bash
just dev
# equivalent to: YARR_MCP_HOST=127.0.0.1 YARR_MCP_NO_AUTH=true cargo run -- serve mcp
```

`YARR_MCP_NO_AUTH=true` is accepted only on a loopback bind. It sets the auth policy to `LoopbackDev`, removes the auth middleware, and requires no token for local calls.

**Do not use this in production.**

---

## Upstream gateway / MCP proxy (no server-level auth)

If you deploy behind a gateway that handles authentication for all services (e.g. an MCP proxy that validates tokens before routing to this server), you can disable auth at the server level:

```bash
YARR_NOAUTH=true         # acknowledge the startup guard that an upstream gateway handles auth
```

`YARR_NOAUTH=true` selects the explicit `TrustedGatewayUnscoped` policy. It removes the local auth middleware and scope checks, so only use it when a trusted upstream gateway enforces both authentication and authorization before traffic reaches this server.

---

## Stdio transport

The stdio transport (`yarr mcp`) bypasses all HTTP auth entirely. It is always `LoopbackDev` — the trust boundary is the OS pipe between parent and child process. Scope checks are not enforced in stdio mode. This matches the MCP spec: stdio servers are local, trusted, subprocess connections.

---

## Auth policy reference

The `AuthPolicy` enum in `src/server.rs` controls what the router does:

| Policy | When | Auth enforced? | Scope checks? |
|---|---|---|---|
| `LoopbackDev` | Loopback bind with no explicit bearer/OAuth auth, or stdio mode. `YARR_MCP_NO_AUTH=true` also selects it for loopback development. | No | No |
| `TrustedGatewayUnscoped` | Non-loopback no-auth deployment with `YARR_NOAUTH=true` | No | No |
| `Mounted { auth_state: None }` | Bearer-only mode on any HTTP bind | Yes (token) | Yes |
| `Mounted { auth_state: Some(_) }` | OAuth mode on any HTTP bind (+ optional token) | Yes (OAuth / token) | Yes |

Public endpoints (`/health`, `/ready`, `/status`, `/metrics`) are never gated by
auth, regardless of policy. `/ready` exposes only the configured-service count,
`/status` returns redacted local metadata, and `/metrics` must be protected at
the network or reverse-proxy layer if it is not intended for public scraping.

Static bearer tokens receive the scopes in `YARR_MCP_STATIC_TOKEN_SCOPES`; the default remains `yarr:read`. `yarr:write` must be granted explicitly and still does not bypass destructive confirmation. Destructive MCP calls require elicitation at
the point of dispatch, including nested calls made by Code Mode; clients that
cannot elicit are denied rather than allowed through.

---

## TEMPLATE

When you adapt this template, replace all `YARR_` prefixes with your service's prefix throughout `src/config.rs`, `src/main.rs`, and this document.
