# Task 8 Report: Vue custom-element foundation

## Delivered

- Created the Yarr Unraid Vue/Vite workspace with settings and dashboard library entries.
- Registered light-DOM `yarr-settings-app` and `yarr-dashboard` custom elements with duplicate guards so host CSS variables inherit through Unraid page transitions.
- Added exact Task 7 GraphQL UI types and documents for runtime, configuration, configuration save, and runtime control.
- Added a same-origin GraphQL client with Unraid CSRF header support, an eight-second timeout, caller-abort composition, listener/timer cleanup, and bounded JSON handling.
- Added user-safe request errors with no client logging of variables or server error details.
- Added a secret field that only represents configured state and preserve/set/clear intent; it never accepts or reconstructs stored secret values.
- Added status badges with text and non-color symbols, plus responsive, focus-visible, host-token, and reduced-motion base styling.
- Added functional loading, error, and current-status shells for both custom elements.

## TDD evidence

- RED: `npm test -- --run src/graphql.spec.ts` failed because `src/graphql.ts` was absent.
- GREEN: added request success, GraphQL error, HTTP error, timeout, CSRF same-origin credential, and mutation-secret logging coverage.

## Validation

- `npm test -- --run src/graphql.spec.ts` passed: 5 tests.
- `npx vue-tsc --noEmit` passed.

## Final HTTP-error hardening

- Non-2xx responses now cancel an available response body before the fixed safe HTTP error is raised, then abort the internal request controller after the cancellation attempt. Cancellation details and server response contents remain private.
- Added a lazy, non-ending HTTP-error body test proving cancellation occurs without acquiring or materializing body chunks; shared timeout, CSRF, and caller-listener cleanup remains in the existing `finally` path.

## Final validation

- `npm test -- --run src/graphql.spec.ts src/components/SecretField.spec.ts` passed: 16 tests.
- `npx vue-tsc --noEmit` passed.

## Self-review

- Reviewed the new web-only surface for scope and whitespace issues.
- No API/schema or root files were changed.

## Review fixes

- Replaced the response text-buffer path with bounded `ReadableStream` consumption. Valid `Content-Length` values are rejected early when oversized, while every stream is still byte-counted and cancelled immediately when it crosses the 1,000,000-byte boundary.
- Added safe handling for absent bodies, stream-reader failures, malformed JSON, dishonest or missing lengths, and UTF-8 multibyte payloads. The client never reads an unbounded response with `text()`, `json()`, or `arrayBuffer()`.
- Added client lifecycle coverage for caller abort composition, caller-listener cleanup, timeout cleanup, CSRF polling cleanup, and oversized-stream cancellation. Request variables and server errors remain unlogged and absent from user-facing errors.
- Added an accessible, generated secret-input id with a visible associated label and explicit `aria-label`; stored values are still never received or reconstructed.
- Replaced the settings placeholder with a compact loaded runtime/configuration summary: runtime readiness, endpoint and bind mode, authentication mode, configured-service count, and Tailscale Serve state.
- Applied inherited fonts to form controls under both host custom elements.

## Review validation

- `npm test -- --run src/graphql.spec.ts src/components/SecretField.spec.ts` passed: 15 tests.
- `npx vue-tsc --noEmit` passed.
