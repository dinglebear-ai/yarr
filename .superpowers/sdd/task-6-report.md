# Task 6 Report: Structured Import and Read-only Docker Discovery

## Status

Implemented Task 6 on `feat/yarr-unraid-plugin` from approved head `0ae168a`.

## Service catalog

Added one explicit `SERVICE_CATALOG` consumed by configuration rendering and updates, structured import, and Docker discovery. It matches Yarr's authoritative 11-service `ServiceKind::ALL` and public environment contract:

- Sonarr
- Radarr
- Prowlarr
- Tautulli
- Overseerr
- Bazarr
- Tracearr
- SABnzbd
- qBittorrent
- Plex
- Jellyfin

Each entry owns its canonical Yarr environment keys, supported import/container aliases, credential key roles, default port, and container identity hints. URLs normalize only when they use `http` or `https` and contain no embedded username or password.

## Structured import

- Accepts bounded structured key/value input and normalizes catalog aliases.
- Reports every unknown key as an explicit warning.
- Returns only service mappings, normalized non-secret URLs, credential-presence booleans, warnings, and an opaque preview ID.
- Never returns raw imported usernames, passwords, API keys, unknown values, or invalid URL values.
- Retains raw mapped values only in an in-memory session with a five-minute default TTL, a default maximum of 64 sessions, and a 192-bit crypto-random base64url ID.
- Consumes the preview session before apply validation, making every apply attempt one-use.
- Rejects service selections outside the consumed preview.
- Requires an explicit selected service list and `credentialConsent[serviceId] === true` before importing any username, password, token, or API key.
- Uses `{ kind: "preserve" }` for password and API-key fields without consent and omits usernames without consent.
- Calls the existing transactional `ConfigService.save()` boundary exactly once for all selected services.

## Configuration integration

- Extended `SaveYarrConfigInput` with bounded catalog service updates.
- Catalog updates maintain `YARR_SERVICES`, canonical URL keys, qBittorrent username/password keys, Plex token, and API-key keys.
- Existing unknown environment keys and custom service names remain preserved.
- Public config renders catalog service enablement, normalized non-secret configuration, and credential-presence booleans without returning catalog usernames or secret values.
- Stored `*_USERNAME` values now join the existing deterministic fixed-point secret-redaction set so imported usernames cannot escape through runtime errors or logs.
- Existing transactional install, readiness, rollback, locking, generation, and redaction behavior remains in `ConfigService`; Task 6 does not bypass or duplicate it.

## Docker client

- Uses only `node:http.request` against `/var/run/docker.sock`.
- Uses only `GET /containers/json` and `GET /containers/<encodeURIComponent(id)>/json`.
- Exposes no arbitrary caller-selected method, path, socket, or endpoint.
- Sends `Accept: application/json` with a fixed 3,000 ms timeout.
- Rejects non-2xx responses and responses larger than 2 MiB.
- Converts timeout, unavailable socket, malformed JSON, invalid response, HTTP status, oversized response, and request/response failures into typed non-fatal errors with fixed messages that do not reflect Docker response bodies.
- Uses no private Docker or Unraid modules and no `@app/*` imports.

## Docker discovery

- Lists and inspects at most 256 containers per discovery, bounding inspection work and retained candidate state.
- Uses catalog environment keys, container identity/labels, published default ports, and Docker network addresses to rank candidates.
- Returns only opaque candidate IDs, service IDs, normalized non-secret URLs, confidence numbers, generic reasons, source, and one credential-presence boolean.
- Never returns raw labels, environment arrays, label values, or credential values.
- Retains only container ID, service ID, candidate ID, normalized URL, confidence, and generic reasons in the expiring discovery session.
- Consumes the discovery session on every apply attempt.
- Rejects candidate IDs outside the consumed discovery set and duplicate service selections.
- Re-inspects each selected container, re-identifies it through the catalog, re-normalizes its URL, and rejects changed service/URL candidates.
- Extracts credentials only from the fresh reinspection and imports them only when that service has explicit consent.
- Calls `ConfigService.save()` once after all selected candidates revalidate.

## TDD evidence

Initial RED:

```text
3 focused suites failed because import.service, docker.service, and discovery.service did not exist.
```

Self-review RED:

```text
2 focused regressions failed:
- discovery retained 300 candidates instead of the fixed maximum of 256
- imported qBittorrent username appeared in the transactional public result
```

Final GREEN:

```text
npm test -- --run src/import.service.spec.ts src/docker.service.spec.ts src/discovery.service.spec.ts
  3 files passed, 14 tests passed

npx tsc --noEmit
  PASS
```

## Files

- `unraid-plugin/api/src/service-catalog.ts`
- `unraid-plugin/api/src/session-store.ts`
- `unraid-plugin/api/src/import.service.ts`
- `unraid-plugin/api/src/import.service.spec.ts`
- `unraid-plugin/api/src/docker.service.ts`
- `unraid-plugin/api/src/docker.service.spec.ts`
- `unraid-plugin/api/src/discovery.service.ts`
- `unraid-plugin/api/src/discovery.service.spec.ts`
- `unraid-plugin/api/src/config.types.ts`
- `unraid-plugin/api/src/config-codec.ts`
- `unraid-plugin/api/src/secret-redactor.ts`

## Concerns

- Validation used deterministic unit-level Docker request fakes; no live `/var/run/docker.sock` or Unraid deployment was part of Task 6.
- GraphQL exposure is intentionally deferred to the later task.
