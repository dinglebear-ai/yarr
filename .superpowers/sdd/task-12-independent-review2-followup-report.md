# Task 12 Independent Review 2 Follow-up

Date: 2026-07-23
Base: `89081f572806eefb36e2dc4c34c1668ef1e6f495`
Scope: pre-mutation apply/reset recovery-transaction cleanup

## Remediation

- Recovery transaction identity is constrained to the Yarr overlay and a
  bounded `.yarr.(update|reset).recovery.XXXXXXXX` basename before removal.
- Every failure after transaction creation and before preparation completes
  invokes the preparation-abort path: directory mode, active/previous snapshot
  install, each snapshot file sync, each content/mode verification, recovery
  directory sync, and overlay directory sync.
- Successful abort cleanup clears in-memory recovery references and emits the
  existing truthful pre-mutation result with `rolledBack=false`.
- Failed abort cleanup retains the private transaction and emits a structured,
  operation-specific cleanup-pending result containing only the validated
  identifier. The API accepts only the exact bounded pattern for the matching
  operation, and the UI displays both the identifier and operator location.
- Snapshot sources are copied, never moved, during preparation. No live binary
  mutation occurs before preparation completes.
- Once mutation begins, the existing preservation-first invariant remains
  unchanged: recovery snapshots survive incomplete restoration.

## Fault evidence

- Apply and reset each inject failures at eight preparation points: active
  install, active file sync, active verification, previous install, previous
  file sync, previous verification, transaction sync, and overlay sync.
- Every normal failure is retried twice. All 32 attempts retain zero recovery
  directories and preserve exact active/previous hashes, modes, and runtime
  readiness without issuing a live-path move.
- Apply and reset each inject a recovery-directory removal failure after an
  active snapshot sync fault. Both retain exactly one mode-`0700` transaction,
  return `rolledBack=false` with its safe identifier, and preserve source
  binaries. Operator removal followed by retry leaves zero directories.
- Existing post-mutation double-fault tests continue to retain durable
  snapshots and reject false restoration success.

## Gates

- Focused updater contract: PASS.
- Focused API update service: `40/40`.
- Focused web settings: `22/22`.
- Full API: `187/187`; typecheck, build, production audit PASS.
- Full web: `56/56`; typecheck, settings/dashboard builds, browser smoke,
  production audit PASS.
- Aggregate plugin/package harness: PASS.
- Package verifier: PASS with `42` declared payload files.
- Umask `022` and `077`: byte-identical.
- Package SHA-256:
  `0f93751134d1e832e351c0f859ef3c96db83c6bfe164e8e070945fffd92f7cad`.
- Package MD5: `2de6a0dd2423c1f55aebb023dbc19522`.
- Package size: `6,220,520` bytes.
- Archive: `57` entries, no `./`, `14` UID/GID `0/0` directories, all `0755`.

## Release boundary

No host deployment, workflow dispatch, release publication, or upstream draft
asset mutation was performed. Independent reviewer approval remains pending.

## Final-head cleanup-state follow-up

The final-head review findings were remediated on top of
`1fcc18163bc5bdd39bd64184275f7a7772b881f8`.

- Every update, reset, and manual rollback recovery-directory removal result is
  consumed. A failed removal emits `cleanupPending=true` with a bounded
  `.yarr.<operation>.recovery.<8 characters>` identifier.
- Restoration and cleanup are independent. Exact restoration may truthfully
  return `rolledBack=true` and `cleanupPending=true`; pre-mutation cleanup
  failure always returns `rolledBack=false`.
- Incomplete restoration retains durable snapshots, returns
  `rolledBack=false`, and is not mislabeled as disposable cleanup.
- The API rejects traversal, malformed identifiers, operation-prefix
  mismatches, non-boolean cleanup state, empty/missing identifiers for pending
  cleanup, identifiers when cleanup is complete, and contradictory
  exit/outcome combinations.
- The UI reports exact restoration success and retained-snapshot cleanup
  warnings independently, so neither state hides the other.
- Manual rollback preparation now cleans up every chmod, copy/install, verify,
  file-sync, transaction-sync, and overlay-sync failure before mutation.
  Normal failures leave no transaction; cleanup failure retains exactly one
  mode-0700 transaction and reports its bounded identifier.
- Documentation now describes SHA-256 content tokens for CSS/JavaScript and
  immutable content-hashed icon filenames rather than mtime cache busting.

The tested outcome matrix is:

| Operation state | `rolledBack` | `cleanupPending` | Recovery identifier | Filesystem result |
| --- | --- | --- | --- | --- |
| Pre-mutation failure, cleanup succeeds | false | false | empty | no transaction retained |
| Pre-mutation failure, cleanup fails | false | true | bounded operation identifier | one mode-0700 transaction retained |
| Mutation failure, exact restoration, cleanup succeeds | true | false | empty | prior binary/runtime restored |
| Mutation failure, exact restoration, cleanup fails | true | true | bounded operation identifier | prior binary/runtime restored; snapshots retained |
| Restoration incomplete | false | false | empty | durable recovery snapshots retained |
| Operation commits, cleanup fails | false | true | bounded operation identifier | committed runtime remains active; snapshots retained |
| Operation succeeds, cleanup succeeds | false | false | empty | no transaction retained |

Verification completed:

- updater contract, including candidate staging cleanup failures, update/reset/
  rollback restoration cleanup failures, committed-operation cleanup failures,
  and the repeated 15-point manual rollback preparation matrix: pass
- API focused suites: 58/58
- web settings focused suite: 23/23
- API full suite: 185/185, typecheck, build, production audit with zero
  vulnerabilities
- web full suite: 57/57, typecheck, settings/dashboard builds, browser
  registration smoke, production audit with zero vulnerabilities
- deterministic package builds under umask 022 and 077: byte-identical
- aggregate plugin/package harness: pass

The rebuilt `yarr-2.1.0-x86_64-1.txz` is 6,222,972 bytes with SHA-256
`4e9c53bf87fd566fd929c717273d0b636f12fa35e491defd718704965bd87575`
and MD5 `aa19d0e84f83842285aa228efaecd380`. It contains 57 archive entries,
42 declared payload files, and 14 root-owned mode-0755 directories, with no
`./` member.

No deployment, workflow dispatch, release publication, or upstream draft
mutation occurred. Independent reviewer approval remains pending.
