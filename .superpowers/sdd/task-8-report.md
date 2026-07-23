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

## Self-review

- Reviewed the new web-only surface for scope and whitespace issues.
- No API/schema or root files were changed.
