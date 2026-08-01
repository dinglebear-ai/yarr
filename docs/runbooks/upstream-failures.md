---
title: "Upstream and qBittorrent failures"
created: 2026-07-16
updated: 2026-07-30
---

# Upstream and qBittorrent failures

Owner: `@jmagar`

## Trigger

- Sustained upstream error/latency metrics.
- `yarr doctor --json` reports an unreachable or unauthorized service.
- qBittorrent repeatedly rejects its SID and relogin retry.

## Triage

1. Identify the configured service name and kind from the bounded metric/log
   label; do not expose its URL credential.
2. Run `yarr doctor --json` in the same environment/container as the server.
3. Verify DNS/routing/TLS and the upstream's own health surface.
4. For 401/403, verify the service-specific credential variables. qBittorrent
   uses `YARR_<NAME>_USERNAME` and `YARR_<NAME>_PASSWORD`.
5. For qBittorrent, one 401/403 should invalidate the cached SID, log in again,
   and retry once. Repeated relogin failures indicate credentials, bans, or an
   upstream session problem rather than a stale local cookie.
6. For timeouts, compare connect timeout, `YARR_HTTP_TIMEOUT_SECS`, and upstream
   response time before raising limits.

## Recovery

- Restore routing/upstream availability or rotate the upstream credential.
- Restart yarr only after the upstream cause is understood; restart is not a
  substitute for fixing repeated qBittorrent login rejection.
- Verify `doctor`, then a read-only `service_status`, then the affected action.

Escalate with timestamps, service kind/name, status class, retry/relogin count,
and redacted upstream logs.
