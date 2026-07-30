---
title: "Authentication failures"
created: 2026-07-16
updated: 2026-07-30
---

# Authentication failures

Owner: `@jmagar`

## Trigger

- Sustained HTTP 401/403 responses at `/mcp`.
- OAuth discovery/authorization failures.
- Any `yarr_auth_token_issuance_total{outcome="rate_limited"}` increase or
  repeated HTTP 429 response from `POST /token`.
- A destructive call is denied because the peer cannot elicit or approval was
  declined.

## Triage

1. Confirm the bind/auth policy without printing secrets:
   `yarr doctor --json`.
2. Verify `/health`, `/ready`, and `/status`; these routes are public and do not
   prove MCP authentication.
3. Check whether the client is using a static token or OAuth. Static tokens are
   read-only; write/destructive calls require an OAuth token with `yarr:write`.
4. If OAuth is active, verify `YARR_MCP_PUBLIC_URL` is the exact external HTTPS
   origin and has no path credentials, query, or fragment.
5. If `disable_static_token_with_oauth = true`, do not expect
   `YARR_MCP_TOKEN` to authenticate.
6. Inspect redacted logs for auth reason/scope. Never paste bearer tokens,
   authorization codes, cookies, client secrets, or JWT signing keys.
7. For token throttling, compare admitted/rate-limited counters and reverse
   proxy logs. The Yarr limiter is process-wide (30 attempts per rolling
   minute), resets on restart, and is not a substitute for per-client limits.
8. If startup reports that local OAuth state is already owned, identify the
   process holding `${sqlite_path}.instance.lock`. Run one replica; do not move
   the database to NFS or delete a live owner's lock to force startup.

## Recovery

- Correct the client credential/scope or OAuth callback configuration.
- Rotate a suspected static token and update clients atomically.
- Keep destructive dispatch fail-closed; do not bypass elicitation to restore
  service.
- Preserve the in-process token cap. Add or tighten reverse-proxy per-client
  throttling, then investigate the caller before relaxing any external limit.
- Re-run the authenticated MCP smoke test and one approved destructive test on
  a disposable target if destructive behavior changed.

## Escalation evidence

Record the release digest/version, auth mode, public URL with secrets removed,
HTTP status, scope requested, client elicitation capability, and timestamps.
