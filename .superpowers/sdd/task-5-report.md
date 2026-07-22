# Task 5 Report: Transactional Config Persistence and Runtime Control

## Outcome

Implemented the first side-effecting Yarr Unraid API layer with real cross-process flock interoperability, durable two-file configuration transactions, readiness rollback, fixed-command runtime control, and bounded redacted logs. GraphQL was intentionally excluded.

## Lock architecture

- `FlockService` opens `/var/lock/yarr-plugin.lock` with mode `0600` and retains the parent file handle for the complete callback.
- The lock file's open file description is mapped to child fd 3.
- Production spawns fixed `/usr/bin/flock` directly with `--exclusive --wait 10 3`, no shell and no PATH lookup.
- Exit 0 from the short fd-only child acknowledges acquisition. The parent-retained open file description keeps the kernel flock after that child exits.
- The same open file description is mapped to rc.yarr child fd 3 for restart, readiness status checks, and rollback restart.
- The parent descriptor closes exactly once in `finally`, including callback failures and acquisition failures.
- Timeout, nonzero exit, spawn failure, and output overflow prevent callback execution.
- Tests use only known absolute flock paths through the typed constructor boundary. Production remains fixed to `/usr/bin/flock`.

The initial plan's `/usr/sbin/flock` command-plus-fd design was invalid for util-linux. Local util-linux 2.41.3 confirmed that fd mode is only `flock [options] number`; adding a command changes the operand to a filename. The approved two-step fd-only design was then implemented. Live tootie evidence identifies `/usr/bin/flock` from util-linux 2.42.1 and `/usr/local/bin/node`; Node is no longer needed by the final lock protocol.

## rc.yarr interoperability

- Added explicit `--lock-fd FD` parsing without environment bypasses.
- Accepts only numeric descriptors 3 through 255.
- Resolves `/proc/$$/fd/FD` and requires the canonical installed lock path, or the source-test-derived lock path in source mode.
- Runs nonblocking `flock` on the inherited descriptor before invoking any locked lifecycle function.
- Direct actions retain their original canonical lock behavior.
- Lifecycle tests cover shared locked descriptors, malformed descriptors, closed descriptors, alternate paths, separately owned locks, and post-close acquisition.
- Task 3 environment bypass rejection remains intact.

## Configuration transaction

- Acquires the plugin flock before reading either current file.
- Parses, merges, and validates the complete prospective state while locked.
- Skips writes and restart when effective state is unchanged.
- Writes both `.next` files with mode `0600`, fsyncs both files and the parent directory, renames current files to `.good`, atomically installs both next files, and fsyncs the parent directory again.
- Recovers a partial install if failure occurs between the two known-good renames.
- Restores both files from known-good copies through fsynced `.next` files after restart/readiness failure.
- Restarts the restored runtime under the same retained flock and returns the redacted restored state with `rolledBack=true`.
- Redacts the union of current and prospective secret values from returned and thrown errors.

## Runtime and command control

- `SafeCommandRunner` permits only fixed absolute command paths and validated argument grammars for rc.yarr, the updater, and fixed-path tail usage.
- Spawns with `shell: false`, bounded timeout, bounded stdout/stderr, overflow kill, and redacted errors.
- Runtime status requires the approved rc.yarr output plus HTTP readiness; a PID file alone never establishes running state.
- `/ready` must return a successful response with `status=ready`.
- `/status` supplies the version when available.
- Start and stop are idempotent. Restart passes the retained lock description through fixed child fd 3.

## Logs

- Reads only `/var/log/yarr/yarr.log`.
- Reads at most 256 KiB from the end of the file and returns at most 500 lines.
- Reports truncation for byte or line truncation.
- Removes ANSI escape sequences and control characters.
- Exposes no caller-controlled path.

## TDD and review

- RED confirmed all service modules were absent and rc.yarr rejected `--lock-fd`.
- RED confirmed the obsolete holder implementation violated fd-only acquisition tests.
- RED reproduced partial current-file loss between known-good renames.
- GREEN covers 19 focused tests across config, runtime, logs, and flock behavior.
- Self-review found and fixed partial rename recovery and removed the accidental probe file named `3`.
- No package dependency or lockfile changes were required.

## Validation

```text
npm test -- --run src/config.service.spec.ts src/runtime.service.spec.ts src/log.service.spec.ts src/flock.service.spec.ts
  4 files passed, 19 tests passed
npx tsc --noEmit
  PASS
bash -n rc.yarr lifecycle-contract.sh yarr-update.sh update-contract.sh
  PASS
unraid-plugin/tests/lifecycle-contract.sh
  PASS
unraid-plugin/tests/update-contract.sh
  PASS
unraid-plugin/tests/run.sh
  Task 1 aggregate contract: PASS
```

## Final Hardening Pass

This hardening pass was implemented as a new commit after `5b0eb13`; neither prior Task 5 commit was amended.

### Stable, exactly restorable pre-state

- Every save samples runtime state under the retained canonical flock before chmod, file writes, renames, or lifecycle actions.
- Only `running` plus `ready=true`, or `stopped`, is accepted as a stable prior state.
- Starting, error, running-but-not-ready, and other indeterminate states fail closed before mutation.
- Three regressions assert that indeterminate states perform only fixed config reads and runtime status, with no chmod, write, rename, restart, or stop.

### Rotation-safe historical log redaction

- `StoredSecretProvider` reads exactly the current `.env` and current `.env.good` generation; it does not glob or scan transaction, backup, or arbitrary paths.
- Missing `.env.good` is treated as no historical generation; all other read or parse failures fail closed.
- `LogService` acquires the canonical `FlockService` before taking the two-generation secret snapshot.
- The same flock remains held through the bounded fixed-path log read, ANSI/control sanitation, and final redaction.
- Tests cover current secrets, prior known-good secrets after rotation, exact fixed paths, and a concurrent rotation blocked until log redaction completes.

### Collision-free redaction

- Secret replacement is now the empty string, so the replacement cannot contain any configured nonempty secret.
- Empty values are ignored, duplicates collapse, and values sort longest-first with a deterministic lexical tie-break.
- All occurrences are removed from successful command output, failed command errors, runtime fields, and log lines.
- Regressions cover overlapping values, repeated values, one-character values, and a configured secret equal to the former marker text.

### Confirmed process-group termination

- Fixed commands spawn as detached process-group leaders with `shell=false`.
- Timeout and output overflow send `SIGKILL` to the entire process group and the direct child.
- The runner waits for the child close event before rejecting and allowing transaction rollback.
- A bounded two-second kill-completion guard returns `FatalCommandError` with a distinct fatal termination message if closure cannot be confirmed.
- Data listeners are removed at completion so output cannot be consumed after confirmed closure.
- Tests model both child and descendant termination, prove rejection waits for close, and prove missing close becomes a fatal command error.

### Inherited descriptor containment

- `rc.yarr` retains the validated inherited descriptor for the complete lifecycle action.
- The daemon-launch subshell closes that descriptor immediately before `exec setsid env ... yarr serve mcp`.
- Direct lifecycle actions remain unchanged because the dynamic descriptor variable is present only in the validated inherited-fd call path.
- The lifecycle regression starts the fake long-lived Yarr process through inherited fd 8, closes the API-parent descriptor, proves a separate contender acquires the canonical lock while Yarr remains alive, then stops the process.

### Final hardening validation

```text
npm test -- --run src/config.service.spec.ts src/runtime.service.spec.ts src/log.service.spec.ts src/flock.service.spec.ts
  4 files passed, 36 tests passed
npx tsc --noEmit
  PASS
bash -n rc.yarr lifecycle-contract.sh yarr-update.sh update-contract.sh
  PASS
unraid-plugin/tests/lifecycle-contract.sh
  PASS
unraid-plugin/tests/update-contract.sh
  PASS
unraid-plugin/tests/run.sh
  Task 1 aggregate contract: PASS
```

## Files

- `unraid-plugin/api/src/command-runner.ts`
- `unraid-plugin/api/src/config.service.ts`
- `unraid-plugin/api/src/config.service.spec.ts`
- `unraid-plugin/api/src/flock.service.ts`
- `unraid-plugin/api/src/flock.service.spec.ts`
- `unraid-plugin/api/src/runtime.service.ts`
- `unraid-plugin/api/src/runtime.service.spec.ts`
- `unraid-plugin/api/src/log.service.ts`
- `unraid-plugin/api/src/log.service.spec.ts`
- `unraid-plugin/api/src/paths.ts`
- `unraid-plugin/source/etc/rc.d/rc.yarr`
- `unraid-plugin/tests/lifecycle-contract.sh`

## Residual concern

The development host does not provide `/usr/bin/flock`; its fixed local test dependency is `/home/linuxbrew/.linuxbrew/bin/flock` at util-linux 2.41.3. The production path is based on verified live tootie evidence and is fixed to `/usr/bin/flock`.

## Task 5 Review Fixes

The review findings were fixed in a separate commit after `50d8d11`; that commit was not amended.

### Readiness and prior runtime state

- `RuntimeService.waitUntilReady` now succeeds only for `state=running` with `ready=true`; stopped is never readiness success.
- `ConfigService` reads prior runtime state under the retained flock before changing files.
- Prospective `enabled=true` runs restart and requires running plus ready.
- Prospective `enabled=false` runs stop and requires stopped.
- A stopped result after restart is a transaction failure and rolls back both files.
- Rollback restores the prior live state: a previously running/ready service is restarted and revalidated; a previously stopped service is stopped again.
- Regressions cover stopped-after-restart, intentional disable, prior-running restoration, and prior-stopped restoration.

### Shared secret redaction

- Added `secret-redactor.ts` as the shared deterministic redaction boundary.
- Empty secrets are removed, duplicates are collapsed, and overlapping values are replaced longest-first with a lexical tie-break.
- `SafeCommandRunner` now redacts captured stdout and stderr before every successful `CommandResult` and before failed-command errors.
- Runtime command and probe errors continue to be redacted against current stored secrets.
- `StoredSecretProvider` reads current secret values from the fixed Yarr environment path without exposing them through LogService results.
- `LogService` sanitizes ANSI/control characters first, then redacts all lines before returning them.
- Regressions cover successful command output, empty/overlapping/repeated secrets, and direct/repeated log secrets.

### Runtime payload safety

- Server-provided versions are accepted only when they are bounded, strict SemVer values no longer than 128 characters.
- Core version fields and identifiers have explicit length limits; numeric prerelease identifiers reject leading zeroes.
- A version matching a current secret is discarded.
- Server-controlled readiness/status text is never reflected into public health messages.
- Compromised `/status` and `/ready` payload regression tests prove secrets and untrusted version strings are not returned.

### Absolute inherited-fd flock verification

- Installed `rc.yarr` pins inherited-descriptor verification to `/usr/bin/flock`.
- Source mode physically detects only `/usr/bin/flock` or the fixed local Linuxbrew path; installed mode never PATH-resolves or accepts environment selection.
- Lifecycle static evidence asserts the installed assignment, and inherited/alternate/closed/separately-owned descriptor tests still pass.

### Known-good generations and partial rotation

- Current files are copied to mode-0600 transaction generations and fsynced before rotation.
- A prior complete known-good pair is copied to its own transaction generation and fsynced before either fixed known-good path changes.
- Failures at either current-to-good rename restore both current files and the complete previous known-good pair.
- Recovery generations are removed only after recovery completes, followed by parent-directory fsync.
- Regressions inject failure at both rotation steps and assert current contents, known-good contents, and backup cleanup.

### Effective no-op and mode repair

- No-op comparison now fingerprints normalized plugin defaults, sorted unknown preserved plugin keys, and sorted complete environment results including secret intent outcomes.
- Explicitly saving an equal default does not write content or restart.
- Real semantic changes continue through the transaction and lifecycle path.
- Every save enforces `0600` on both current files while holding the flock, fsyncs both files and the parent directory, and does not restart solely for mode repair.

### Final review-fix validation

```text
npm test -- --run src/config.service.spec.ts src/runtime.service.spec.ts src/log.service.spec.ts src/flock.service.spec.ts
  4 files passed, 29 tests passed
npx tsc --noEmit
  PASS
bash -n rc.yarr lifecycle-contract.sh yarr-update.sh update-contract.sh
  PASS
unraid-plugin/tests/lifecycle-contract.sh
  PASS
unraid-plugin/tests/update-contract.sh
  PASS
unraid-plugin/tests/run.sh
  Task 1 aggregate contract: PASS
```
