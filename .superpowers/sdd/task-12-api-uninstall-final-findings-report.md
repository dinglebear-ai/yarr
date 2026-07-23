# Task 12 API Uninstall Final Findings

Date: 2026-07-23

Base: `fc1980870c4d3aac1d86a0232a5adccaa1998d47`

## Stopped-state evidence

The uninstall state detector now models the real upstream CLI contract. Upstream
`StatusCommand` runs raw inherited `pm2 status unraid-api --mini-list`, and an
intentionally stopped app can therefore return exit `0` with empty output.

Status text is reconciled with an independent `/proc` scan before recovery
creation:

- An owned live process requires the exact Node executable, API cwd, and
  `./dist/main.js` or absolute `dist/main.js` entrypoint.
- Exit `0` with empty or explicit stopped output is stopped only when no live
  or candidate-but-unprovable process evidence exists.
- Online/running output requires exact owned process evidence.
- Empty/stopped output with a live process and online output without one are
  contradictions.
- Unreadable identity, a matching entrypoint under the wrong cwd/executable,
  command failure, mixed state, and unrecognized output are ambiguous.
- Contradictory and ambiguous tuples fail before recovery creation, lifecycle
  action, or loader mutation.
- A proven stopped API remains stopped throughout uninstall.

The focused contract uses fake `/proc` identity with the exact upstream PM2
entrypoint and optionally reads the upstream checkout to bind the fixture to
`StatusCommand`, `PM2Service`, and the existing empty-result lifecycle test.

## Preparation cleanup

Recovery preparation and loader/runtime mutation are separate state machines.
The preparation phase covers:

- recovery chmod and mode/owner verification
- package loader copy, presence marker, byte/mode verification, and file sync
- API config copy, presence marker, byte/mode verification, and file sync
- recovery-directory sync
- parent-directory sync

Every preparation failure enters preparation-only cleanup. It never calls the
runtime rollback path. Successful cleanup clears the path and bounded
identifier. Failed cleanup may retain only the one original transaction after
revalidating its bounded basename, location, non-symlink directory type,
owner/group, and mode `0700`; the diagnostic supplies the bounded identifier
and explicit operator cleanup action.

The contract injects each of the 12 preparation failures twice, for 24
leak-free attempts. Every attempt proves package and API loader bytes/modes,
active target, immutable store, and prior running state are unchanged, with no
start/stop rollback. A separate removal-failure case proves exactly one valid
transaction is retained and reported.

## Verification

- Failing test first: the original implementation allowed
  `recovery-chmod` injection to complete uninstall.
- Focused classic contract with upstream source binding: pass.
- Aggregate lifecycle, updater, classic, workflow, release, and package
  harness with upstream source binding: pass.
- Changed-shell Bash syntax and ShellCheck: pass.
- API TypeScript build and production audit: pass, zero findings.
- Web settings/dashboard builds, browser registration smoke, and production
  audit: pass, zero findings.
- Updater protocol: `26` rows and `748` source plus `1496` built/staged
  rejected mutations pass.
- Deterministic package builds under umask `022` and `077`: byte-identical.
- Package verifier: pass with `44` declared payload files.
- Archive: `59` entries, `14` UID/GID `0/0` directories at mode `0755`, no
  `./`, absolute, or traversal member.

Package:

- SHA-256:
  `6e9f405ebc7f445c69f98a77bec770fdaf15fc50e8346376d2619af3ba3c95e4`
- MD5: `13ebe82db5a62644a9c2242750c30592`
- Size: `6,227,708` bytes

No live host access, deployment, workflow dispatch, release publication, or
draft-asset mutation occurred. Independent reviewer approval is not claimed.
