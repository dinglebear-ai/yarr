# Task 12 independent review 2 remediation report

Date: 2026-07-23
Base: `84decee6bc8b6257a42eeab62fe1531ee9d18bd4`
Bead: `rustarr-bhf`

## Scope

This remediation fixes all four fresh independent-review findings without
deploying to an Unraid host, dispatching a workflow, publishing a release, or
mutating the upstream `v2.1.0` draft assets.

## 1. Logger PID identity

- Logger startup atomically records a private mode-`0600` evidence file with
  PID, `/proc/<pid>/stat` start ticks, executable path and inode identity, and
  a hash of the exact command line.
- Every logger signal is preceded by a fresh identity and ownership check.
  Missing, malformed, gone, or mismatched evidence removes only the stale Yarr
  evidence and never signals the numeric PID.
- Lifecycle contracts substitute an unrelated `sleep` PID into genuine logger
  evidence and prove the unrelated process survives. They also prove a genuine
  logger is recognized and exits cleanly with the owned service.

## 2. Apply/reset restoration safety

- Apply and reset now use the same preservation-first invariant as manual
  rollback. Private mode-`0700` recovery directories contain durable,
  content/mode-verified snapshots before either live overlay path changes.
- Candidate, predecessor, reset retirement, and restoration replacements are
  staged and atomically renamed. Snapshot sources are never consumed.
- Restoration stops at its first failed step. Recovery directories are outside
  unconditional network/temp cleanup and remain available with all surviving
  binaries when restoration is incomplete.
- `rolledBack=true` is assigned only after both binary paths match their exact
  pre-operation existence, SHA-256, and mode; directory durability syncs pass;
  and the prior running/stopped state plus readiness is proven.
- Command-level double-fault tests fail the apply/reset commit sync and then
  fail the first restoration move. Both commands retain snapshots, preserve
  surviving/retired binaries, leave the runtime unready, and emit
  `rolledBack=false` with the exact restoration-incomplete outcome.
- The real command-runner boundary accepts those expected structured nonzero
  outcomes only when `rolledBack=false`. The Vue panel renders them as warnings
  and never claims the previous state was restored.

## 3. Credential-only import URL requirement

- Import preview and apply read current public configuration through the real
  config service boundary.
- A service can be enabled only with a valid imported URL or a valid existing
  configured URL. Apply rechecks the effective URL and passes it explicitly to
  the real config codec.
- A credential-only unconfigured mapping is marked `urlRequired`, is disabled
  in the UI, explains `URL required`, never exposes the credential, and cannot
  be serialized into `YARR_SERVICES`.
- A credential-only already-configured qBittorrent mapping reuses the validated
  current URL. Explicit consent persists the username; decline omits the
  username update and never imports the declined value.
- Shell lifecycle validation also rejects an enabled packaged-binary service
  whose URL is absent.

## 4. Malformed configuration while stopped

- `rc.yarr status` checks daemon PID/process ownership before loading or
  validating configuration.
- No live PID returns canonical `STOPPED` with status `3`, even when `.env` is
  malformed. An unverified live PID remains fail-closed with status `4`, keeps
  its evidence, and is not signaled.
- Full lifecycle fixtures prove malformed/no-PID status, stable-lock
  pre-install quiescence, array stopping, and classic uninstall all complete
  safely. The unverified-live negative fixture proves the unrelated process
  survives.

## Generated artifacts

- API and both Vue bundles were rebuilt before packaging.
- The classic package was built and verified independently under umask `022`
  and `077`; the two retained outputs are byte-identical.
- Package: `unraid-plugin/packages/yarr-2.1.0-x86_64-1.txz`
- SHA-256:
  `0615f59bf6b68fe6a9bf9e490bca9996e3cb598c6c86663d83fd02cb301b0a67`
- MD5: `f122fe0b41741664c6a8e6b4e57fb443`
- Size: `6,221,460` bytes
- Archive: `57` entries, `14` root-owned mode-`0755` directories, `43`
  regular files, no `./` member
- Embedded verifier inventory: `42` payload files

## Verification

| Gate | Result |
| --- | --- |
| Lifecycle focused contract | PASS |
| Updater focused contract | PASS |
| API focused import/update/resolver | `52/52` PASS |
| Web focused settings | `21/21` PASS |
| API full suite | `184/184` PASS |
| API typecheck/build/production audit | PASS, 0 vulnerabilities |
| Web full suite | `55/55` PASS |
| Web typecheck/settings+dashboard builds/browser smoke/audit | PASS, 0 vulnerabilities |
| Aggregate release/lifecycle/updater/classic/workflow contracts | PASS |
| Package verifier | PASS, 42 payload files |
| Deterministic umask `022`/`077` rebuild | PASS, byte-identical |
| Bash syntax and ShellCheck `-S error` | PASS, 16 files |
| actionlint | PASS, 2 workflows |
| Python compile and workflow semantic contract | PASS, 2 files |
| Packaged secret/path/checksum inventory | PASS, 42 entries |
| `git diff --check` | PASS |

Rust source was not changed, so Rust compilation/test gates were not repeated.
No residual implementation concern is known. Real Unraid installation and
runtime validation remains the parent release process's disposable-host gate;
this report does not claim independent review approval.

## Reviewer-2 recovery-directory follow-up

- Every apply/reset failure after recovery transaction creation and before
  mutation now enters a validated preparation-abort path. Coverage spans both
  snapshot installs, both file syncs, both content/mode verifications, the
  transaction sync, and the overlay-directory sync.
- Successful abort cleanup leaves no recovery directory. Cleanup failure
  retains exactly one private transaction and emits its bounded basename with
  `rolledBack=false` through shell JSON, the real command runner, and Vue.
- Each normal fault was retried twice across apply and reset: all `32`
  attempts preserved source hashes/modes/readiness, issued no live-path move,
  and retained zero directories. Explicit cleanup-removal faults retained one
  identifiable directory; operator cleanup plus retry retained zero.
- Post-mutation preservation remains unchanged.
- Follow-up gates: updater PASS; focused API `40/40`; focused settings `22/22`;
  full API `187/187`; full web `56/56`; typechecks/builds/browser smoke/audits,
  package verifier, and aggregate harness PASS.
- Umask `022`/`077` artifacts are byte-identical at SHA-256
  `0f93751134d1e832e351c0f859ef3c96db83c6bfe164e8e070945fffd92f7cad`,
  MD5 `2de6a0dd2423c1f55aebb023dbc19522`, size `6,220,520` bytes. Both
  have `57` entries, no `./`, and `14` UID/GID `0/0` directories at `0755`.
