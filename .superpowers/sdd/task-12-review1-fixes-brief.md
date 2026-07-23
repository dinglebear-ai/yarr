# Task 12 Review 1 Remediation Brief

## Objective

Remediate all 13 findings from whole-feature security review 1 without changing
the approved product scope, publishing releases, dispatching workflows, touching
`tootie`, or mutating the upstream `v2.1.0` draft assets.

## Baseline and ownership

- Worktree: `/home/jmagar/workspace/yarr/.worktrees/yarr-unraid-plugin`
- Baseline: `4f15eb5c72a1dbf217705587abef7b2aa963f980`
- Branch: `feat/yarr-unraid-plugin`
- Bead: `rustarr-bhf`
- This remediation has one writer. The original reviewer remains independent.

## Required remediations

1. Restrict trusted-gateway authentication to loopback binding and reject
   direct-socket spoofing; require bearer or Google OAuth for every non-loopback
   bind.
2. Validate and invoke the real packaged async `graphqlSchemaExtension`
   exporter, and exercise the exact staged distribution in activation contracts.
3. Make upgrade, startup, stop, and uninstall process ownership robust against
   deleted executable inodes, occupied ports, unrelated processes, and residual
   daemons.
4. Keep Unraid and Yarr secrets out of process command lines, logs, and
   transient files with unsafe modes.
5. Use `dinglebear-ai/yarr` consistently as the canonical source and release
   repository.
6. Keep one stable lifecycle lock inode and cover package, API, configuration,
   lifecycle, and updater transactions without recursive deadlock.
7. Make the cfg/JSON configuration pair crash recoverable before every read and
   startup path, with durable transition state and credential-preserving
   recovery.
8. Validate updater policy and installed state while holding the lifecycle
   lock so concurrent updates cannot downgrade.
9. Add bounded array-hook lock retries and require visible, confirmed stop
   quiescence.
10. Bound and safely rotate the RAM-backed wrapper log.
11. Package and mount the dashboard custom element through
    `YarrDashboard.page`.
12. Classify and redact every accepted credential alias from one canonical
    service catalog.
13. Bound updater connection time, total time, retries, and downloaded resource
    sizes with cleanup on failure.

## Verification contract

- Add focused positive, negative, race, crash-recovery, process-command-line,
  package, and mounting tests for every finding.
- Run aggregate classic/release/workflow contracts, API tests/typecheck/build
  and production audit, web tests/typecheck/both builds/browser smoke, Rust
  quality gates if root Rust changes, ShellCheck, actionlint, Python contract
  compilation, secret/policy scans, deterministic package builds under umasks
  `022` and `077`, package verification, and committed-byte comparison.
- Rebuild the deterministic txz and update release manifest and PLG checksums
  atomically when payload changes.
- Preserve `/boot/config/plugins/yarr` and Yarr appdata on uninstall.
- Update the Task 12 report, progress ledger, and a dedicated remediation report.
- Comment bead `rustarr-bhf`, commit, push, and leave approval to the original
  reviewer.
