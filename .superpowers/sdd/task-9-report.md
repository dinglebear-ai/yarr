# Task 9 Report: Blocked by the Task 7 GraphQL contract

## Status

Task 9 was not implemented because the approved Task 7 schema cannot support the required server-auth settings UX without inventing client-only state. The Task 9 brief explicitly requires stopping and reporting when the schema cannot support a required UX.

## Blocking contract gap

`YarrPluginConfig` exposes only:

- `enabled`
- `bindMode`
- `customHost`
- `port`
- `authMode`
- `tailscaleServe`
- `tailscaleHostname`
- `logLevel`
- `updateChannel`

`SaveYarrConfigInput` accepts `bearerToken`, `googleClientId`, `googleClientSecret`, `trustedGatewayHosts`, and `trustedGatewayOrigins`, but `yarrConfig` returns none of their current public or presence state.

The output contract needs, at minimum, presence booleans for the bearer token and Google client secret, plus the current non-secret Google client ID and trusted gateway hosts/origins. Without those fields, the UI cannot:

- start auth secret controls from configured/not-configured booleans;
- distinguish a preserved configured secret from a missing secret;
- decide whether a selected non-loopback bind has the required existing auth configuration;
- show or safely edit the current Google OAuth and trusted-gateway configuration.

Requiring administrators to re-enter credentials on every unrelated save would violate blank-preserves-current-value behavior. Assuming credentials exist would weaken the required client-side exposure guard. Keeping guessed values only in browser memory would create the forbidden client-only contract.

## Scope and verification

No API/schema files, web production files, or tests were modified. RED/GREEN and build gates were not run because implementation correctly stopped before production work.

## Required follow-up

Revise and approve the Task 7 GraphQL schema with the necessary redacted auth configuration fields, then resume Task 9 from behavior tests.
