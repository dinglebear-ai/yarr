# Task 12 Final-Head Review Fixes Report

Date: 2026-07-23

Base commit: `1fcc18163bc5bdd39bd64184275f7a7772b881f8`

## Scope

This follow-up closes the three final-head findings covering recovery-directory
cleanup propagation, manual rollback preparation cleanup, and stale cache
documentation. It does not deploy to a host, dispatch workflows, publish a
release, or mutate upstream draft assets.

## Recovery and cleanup contract

Recovery truth and cleanup truth are independent:

| Operation state | `rolledBack` | `cleanupPending` | Identifier | Required result |
| --- | --- | --- | --- | --- |
| Pre-mutation failure; cleanup succeeds | false | false | empty | no transaction remains |
| Pre-mutation failure; cleanup fails | false | true | bounded | one private transaction remains |
| Mutation failure; exact restoration; cleanup succeeds | true | false | empty | prior runtime is ready |
| Mutation failure; exact restoration; cleanup fails | true | true | bounded | prior runtime is ready and snapshots remain |
| Restoration incomplete | false | false | empty | durable recovery evidence remains |
| Commit succeeds; cleanup fails | false | true | bounded | new runtime remains committed and snapshots remain |
| Success; cleanup succeeds | false | false | empty | no transaction remains |

Identifiers are basenames matching
`.yarr.(update|reset|rollback).recovery.<8 alphanumeric characters>`. The API
rejects traversal, malformed identifiers, operation-prefix mismatches,
non-boolean state, missing identifiers for pending cleanup, identifiers when
cleanup is complete, and contradictory exit/outcome combinations.

Every update, reset, and rollback recovery remover has an observed return
status. Candidate staging failures, preparation failures, exact-restoration
cleanup, committed-operation cleanup, and normal success cleanup all propagate
failure. The UI renders restoration success and retained-snapshot cleanup as
separate facts.

## Manual rollback preparation

The rollback transaction is assigned before its first mode change. Before any
mutation, failure at each of these points uses the shared preparation cleanup
helper:

- recovery-directory chmod
- four preservation/staging installs
- four staged-file syncs
- four content/mode verifications
- transaction-directory sync
- overlay-directory sync

The 15-point matrix runs twice per point. Normal cleanup leaves zero recovery
directories, preserves active and previous hashes and executable modes, and
performs no mutation move. Forced removal failure retains exactly one
mode-0700 directory and emits its bounded identifier. Once mutation begins,
incomplete restoration retains durable snapshots.

## Documentation

The plugin README and implementation plan now describe SHA-256 content-derived
tokens for CSS and JavaScript plus the immutable content-hashed icon filename.
They no longer claim mtime cache busting.

## Verification

- `unraid-plugin/tests/update-contract.sh`: pass
- focused API/GraphQL suites: 58/58
- focused web settings suite: 23/23
- full API suite: 185/185
- API typecheck and build: pass
- API production audit: zero vulnerabilities
- full web suite: 57/57
- web typecheck, settings build, dashboard build, and browser registration
  smoke: pass
- web production audit: zero vulnerabilities
- deterministic package builds under umask 022 and 077: byte-identical
- package verifier: pass for both builds
- aggregate plugin/package harness: pass

Package evidence:

- path: `unraid-plugin/packages/yarr-2.1.0-x86_64-1.txz`
- SHA-256:
  `4e9c53bf87fd566fd929c717273d0b636f12fa35e491defd718704965bd87575`
- MD5: `aa19d0e84f83842285aa228efaecd380`
- size: 6,222,972 bytes
- archive entries: 57
- declared payload files: 42
- directories: 14, all UID/GID 0/0 and mode 0755
- archive root `./` member: absent

Independent reviewer approval remains pending.
