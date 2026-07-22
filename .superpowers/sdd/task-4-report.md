# Task 4 Report: External Unraid API Package and Config Domain

Implemented the standalone `unraid-api-plugin-yarr` package contract and a pure configuration codec.

- Matches the live Unraid API peer package versions and external NestJS adapter metadata.
- Parses, merges, validates, and serializes `yarr.cfg` and `.env` without shell evaluation or logging.
- Preserves existing unknown keys while rejecting unrecognized domain input fields.
- Redacts credentials from the browser-visible configuration view and models secret changes as preserve, set, or clear intents.
- Validates bearer, Google OAuth, and trusted-gateway requirements before allowing non-loopback bindings.
- Normalizes writes to deterministic LF output with exactly one trailing newline.

## Review fixes

- Domain string and secret-set inputs now reject CR, LF, and CRLF before they can reach either serializer. Both serializers independently reject line-bearing values, so one value cannot produce a second assignment.
- Environment parsing no longer decodes literal backslash sequences. No supported Task 4 field requires multiline text, so accepted values are single-line and `parseYarrEnvironment(serializeYarrEnvironment(value))` preserves literal `\\n` bytes exactly.
- Deterministic serialization now uses a locale-independent code-point comparator. Keys remain restricted to ASCII `A-Z`, digits, and underscores.
- Peer dependencies now use the host-provided wildcard contract used by the working Incus external plugin. The live Unraid package versions remain explicit dev dependencies, and `package-lock.json` was regenerated with npm's lockfile v3 resolver.

## Authoritative Yarr and Unraid evidence

- `src/config/environment.rs:85-104` parses the runtime `.env` one physical line at a time; `src/config/environment.rs:226` only considers quoted-value escaping after that split. None of the Task 4 domain fields has a multiline runtime contract, so the codec preserves literal backslashes instead of decoding them.
- `src/config/mcp.rs:175-181` implements `YARR_MCP_ALLOWED_HOSTS` and `YARR_MCP_ALLOWED_ORIGINS` as comma-separated values with trim-and-empty filtering. Trusted-gateway validation now uses that exact non-empty-item structure rather than raw string presence.
- `src/server.rs:65-122` accepts a non-loopback trusted gateway only with `YARR_NOAUTH` enabled and at least one parsed allowed host or origin; `src/server_tests.rs:32-56` covers the accepted and rejected gateway policies.
- `unraid-plugin/source/usr/local/emhttp/plugins/yarr/scripts/yarr-common.sh:274-296` derives `YARR_MCP_AUTH_MODE=bearer` and `YARR_NOAUTH=true` from persisted `AUTH_MODE=trusted-gateway`, while the codec validates the persisted provenance inputs. This agrees with the Rust contract; no context escalation is required.
- `/home/jmagar/workspace/incus-unraid/unraid-api-plugin-incus/package.json` is the working external-plugin peer contract: wildcard host peers with local development tooling. `/home/jmagar/workspace/upstream/unraid-api/packages/unraid-api-plugin-health/package.json` supplies the current pinned development versions.

## Review RED/GREEN evidence

- RED: the added hostile-input tests produced six expected failures against commit `9100791`: newline acceptance from domain input and serializers, literal-backslash decoding, and whitespace-only provenance acceptance.
- GREEN: line breaks are rejected, literal `\\n` data round-trips unchanged, whitespace-only CSV provenance is rejected, valid host/origin provenance is accepted, and all three supported non-loopback auth modes are covered.

## Review results

- `npm test -- --run src/config-codec.spec.ts`: passed, 18 tests.
- `npx tsc --noEmit`: passed.
