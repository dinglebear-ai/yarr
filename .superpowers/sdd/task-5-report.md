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
