# Task 12 Exit-Zero Updater Contract Report

Date: 2026-07-23

Base commit: `0fa44e36dc4b09694d301d9a70db9685e22a0f5c`

## Finding

The updater previously validated expected nonzero outcomes using human message
text and applied only a small generic rejection rule to exit-zero responses.
A syntactically valid exit-zero response from the wrong operation could
therefore bypass an operation-specific contract.

## Protocol

Every structured shell response now includes:

- `operation`: `CHECK`, `APPLY`, `RESET`, or `ROLLBACK`
- `outcome`: one of 17 namespaced outcomes, including
  `CHECK_UPDATE_AVAILABLE`, `APPLY_RESTORED`, `RESET_COMPLETED`, and
  `ROLLBACK_RESTORATION_INCOMPLETE`

Human-readable `message` is display copy. It is accepted only when it matches
the validated outcome row and is never the primary discriminator.

## Closed state matrix

The UpdateService matrix has 26 valid rows:

| Operation | Rows | Primary outcomes |
| --- | ---: | --- |
| `CHECK` | 3 | no compatible release, update available, current |
| `APPLY` | 8 | current, updated, failed before activation, restored, restoration incomplete |
| `RESET` | 7 | completed, failed before mutation, restored, restoration incomplete |
| `ROLLBACK` | 8 | completed, unavailable, failed before activation, restored, restoration incomplete |

Rows with independent cleanup state have separate cleanup-complete and
cleanup-pending variants. Exact restoration may remain `rolledBack=true` while
`cleanupPending=true`, and a committed apply/reset/rollback may return its
primary successful outcome with exit 1 when snapshot cleanup is pending.

Every row validates:

- requested operation equals response operation
- outcome belongs only to that operation
- exit code is exact for the state
- rollback truth is exact
- cleanup truth and recovery identifier agree
- recovery identifier is bounded, traversal-free, and operation-prefixed
- overlay and update/available-version state are consistent
- rollback availability is consistent where deterministic
- message matches the outcome-specific bounded class

## Negative coverage

The API suite attempts the full cross-product of each valid response against
every other requested operation on its native zero or nonzero exit. It repeats
the cross-product after forging the response operation to the requested
operation, proving the namespaced outcome itself cannot cross boundaries.

Additional tests reject:

- every matrix row with its exit code flipped
- unknown operation and outcome values
- extra keys and malformed JSON
- malformed booleans and versions
- message/outcome mismatch
- rollback and cleanup contradictions
- missing, traversal, or wrong-prefix recovery identifiers
- invalid overlay, update, available-version, and rollback-availability state
- oversized output and disallowed process exits

## GraphQL and UI

GraphQL exposes non-null `YarrUpdateOperation` and `YarrUpdateOutcome` enums on
both status and mutation result types. Resolver and hand-maintained SDL parity
tests cover the fields and enum values.

The web client requests both discriminators. The Updates panel uses `outcome`,
`rolledBack`, and `cleanupPending` to render restoration, incomplete recovery,
and pre-mutation cleanup guidance. It does not classify state by searching the
human message.

## Verification

- updater shell contract: pass
- focused API/GraphQL: 79/79
- focused web: 39/39
- full API: 206/206
- API typecheck/build/production audit: pass, zero vulnerabilities
- full web: 58/58
- web typecheck/settings build/dashboard build/browser registration smoke/
  production audit: pass, zero vulnerabilities
- shell syntax and ShellCheck: pass
- deterministic umask 022/077 package builds: byte-identical
- release/package verifier: pass
- aggregate plugin/package harness: pass

Package:

- path: `unraid-plugin/packages/yarr-2.1.0-x86_64-1.txz`
- SHA-256:
  `8afebcddeccf771fa20868f05592526c54fdc36a5c0e8744a2314b0a49d894e2`
- MD5: `a7a50dec2c3c02dea8ab2fdda751f97b`
- size: 6,224,220 bytes
- archive entries: 57
- declared payload files: 42

No host deployment, workflow dispatch, release publication, or upstream draft
asset mutation was performed. Independent reviewer approval remains pending.
