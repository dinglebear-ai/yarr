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
