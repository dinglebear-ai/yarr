# Task 12 Whole-Feature Security Review 1 Remediation Report

## Status

All 13 review findings are implemented and locally verified from baseline
`4f15eb5c72a1dbf217705587abef7b2aa963f980` on
`feat/yarr-unraid-plugin`.

The first remediation commit was
`4119e97c3ed88db617616df3c4894c630c1e7da2`. Independent re-review found four
remaining gaps in release-identity scanning, updater lock duration, rollback
journaling, and packaged-major enforcement. Those gaps are remediated and the
complete local matrix passes.

The first follow-up commit
`1b7803aa4f9b9ee64e0542c51517fcb74f16788b` was not approved: the reviewer
accepted three gaps but found that an updater could still write appdata after
the array-stop hook returned. Commit
`e71c23eb70b1f604ef0496f78cf7230e4a94fcc7` established an array-stopping
fence under the lifecycle lock and closed that High finding. The next re-review
did not approve because the retained fence blocked a same-boot reinstall after
the array remounted while Yarr was absent. The latest remediation deliberately
retains the fence across unmount and uninstall so an already-waiting updater
still fails closed, while a classic installer that proves `/mnt/user` mounted
enters the same lock-held mounted transition as the array-start hook. An
unmounted reinstall retains the fence; a mounted reinstall clears it before
autostart. Final re-review remains pending.

This report records remediation evidence, not review approval. The original
reviewer remains responsible for re-review.

Safety boundaries observed:

- No deployment or access to `tootie`.
- No workflow dispatch.
- No release publication or mutation.
- No mutation of the upstream `v2.1.0` draft or its assets.
- Root Yarr authentication behavior was not weakened.
- Uninstall still preserves Yarr configuration and appdata.

## Finding Disposition

1. **Trusted-gateway spoofing:** Trusted-gateway mode now requires a loopback
   bind in the API codec, shell preflight, settings UI, and documentation.
   Non-loopback LAN, custom, wildcard, and Tailscale binds require bearer or
   Google OAuth. Direct-socket Host and Origin spoof cases reject.
2. **Real GraphQL exporter mismatch:** API installation loads the staged
   package's actual async-function `graphqlSchemaExtension`, awaits it, parses
   its SDL, and validates loader/module/schema behavior. Classic activation
   contracts use the exact built and staged distribution rather than a
   handwritten exporter.
3. **Upgrade orphan/residual daemon:** Lifecycle metadata preserves PID start
   time, argv, executable path, and inode evidence. Upgrade and uninstall stop
   under the stable lock and require quiescence. Readiness proves the newly
   spawned PID survives and owns the listening socket. Running-old-binary,
   deleted-inode, occupied-port, unrelated-process, failed-stop, and residual
   uninstall cases are covered.
4. **Command-line secret leakage:** Unraid API requests use a private temporary
   curl header file rather than argv. The daemon launcher sources a mode-0600
   runtime environment and execs Yarr with secret-free argv. `/proc` sentinels
   cover Unraid API keys, bearer/OAuth credentials, and service credentials
   through success, retry, and failure windows.
5. **Canonical repository identity:** Current publication and installation
   surfaces use `dinglebear-ai/yarr`. Release metadata explicitly models
   `sourceRepository`, `packageRepository`, and `binaryRepository`, with all
   three defaulting to the canonical repository.
6. **Stable lock inode:** `/var/lock/yarr-plugin.lock` is never unlinked.
   Package, API, configuration, lifecycle, hook, and updater operations share
   the stable inode using inherited-lock entrypoints that avoid recursive
   deadlock. Old-inode replacement and concurrent-operation tests pass.
7. **Crash-recoverable config pair:** The cfg/JSON pair now has a durable
   transaction marker and recovery protocol. Recovery runs before shell and API
   reads and startup paths, fsyncs transaction state, and preserves credentials
   after process death at every install and known-good rollback transition.
8. **Updater race:** Bounded network staging occurs outside the lifecycle lock.
   Activation then re-reads installed state, current version, the package's
   supported major, candidate hash/version, and update policy under the stable
   lock. Concurrent older/newer candidates cannot downgrade or redefine the
   package-supported major. Array stop establishes a private runtime fence
   before quiescing Yarr; a staged updater then aborts before appdata access.
   Only a proven mounted-array transition clears that fence under the same
   lock; both the start hook and a mounted classic installer use it.
9. **Array hooks:** Start and stop hooks use bounded lock retries. Stop requires
   confirmed quiescence before unmount and reports failure visibly; start
   retries and reports failure. Lock-contention contracts pass.
10. **Wrapper log bound:** The RAM-backed wrapper log has bounded size and
    retention, fixed private modes, and no-symlink rotation. Threshold,
    retention, mode, and symlink cases pass without duplicate secret output.
11. **Dashboard integration:** The package now includes
    `YarrDashboard.page`, loads the dashboard CSS/JS, and mounts
    `yarr-dashboard`; `yarr.page` remains settings. Source, package, static
    browser, and activation contracts use the actual bundle.
12. **Legacy alias redaction:** Accepted credential aliases and redaction are
    derived from the canonical service catalog. Exhaustive table-driven tests
    cover every accepted `*_APIKEY` alias and fixed-point redaction.
13. **Updater resource bounds:** Curl connection, total-time, retry, metadata,
    checksum, and archive limits fail closed with cleanup. Stalled and oversized
    response contracts pass without unbounded buffering or disk growth.

## Repository Identity Audit

Active publication URLs, manifests, package metadata, installation scripts,
current documentation, workflows, badges, provenance helpers, and live
configuration examples now use `dinglebear-ai/yarr`.

Historically meaningful ownership text and recorded commands in
`docs/sessions/**` remain historical. Active links in `CHANGELOG.md` and active
clickable or copy-paste canonical links inside historical records use the
canonical repository. Other plugin manifests received URL-only source/homepage
corrections; their behavior was not changed. An implementation scan outside
historical session records found no active legacy owner/repository publication
URL.

## Reviewer Follow-up Disposition

1. **Release gate identity finding:** The remediation report no longer embeds a
   literal legacy publication URL, and the final release contract passes with
   zero-SHA rejection enabled. Active changelog links are canonical while
   historical session evidence remains intact.
2. **Updater lock-duration finding:** Metadata and payload transfer, timeout,
   retry, checksum, archive validation, and candidate hashing happen in a
   private RAM-backed temporary directory before the lock. The short locked
   phase revalidates all state-dependent invariants immediately before
   activation. The stop hook writes and fsyncs an array-stopping fence under the
   same lock before quiescence. A staged updater then fails before selecting,
   creating, or mutating appdata. Check, apply, reset, and manual start remain
   fenced until a proven mounted-array transition clears the private marker
   under lock.
3. **Rollback-journal finding:** Readiness-failure restoration now writes and
   fsyncs a versioned rollback marker before changing either current config
   member. Shell and API startup recovery understand install and rollback
   operations. Process-death failpoints cover every rollback transition and
   preserve the known-good credentials.
4. **Packaged-major finding:** The updater derives supported major from the
   immutable packaged binary, not an active overlay. Check and apply reject an
   incompatible retained overlay and every cross-major candidate under lock.
5. **Same-boot reinstall regression:** Uninstall keeps the array-stop fence
   because a pre-existing updater can outlive package removal. The installer
   now proves the array mount and invokes the lock-held mounted transition
   before autostart. The classic contract exercises stop, uninstall, unmounted
   reinstall, and mounted reinstall using the real fence helper. It also avoids
   following the shared-helper fixture symlink during chmod.

## Verification Evidence

### Focused and aggregate plugin contracts

- `bash unraid-plugin/tests/lifecycle-contract.sh`: PASS.
- `bash unraid-plugin/tests/update-contract.sh`: PASS.
- `bash unraid-plugin/tests/classic-contract.sh`: PASS using the real staged API
  and web payloads; API `2.1.0` activated, `yarrRuntime` verified, and API
  removal verified.
- `bash unraid-plugin/tests/release-contract.sh --reject-zero-sha`: PASS with 14
  declared paths.
- Structured Python workflow contract and its negative mutations: PASS.
- `bash unraid-plugin/tests/run.sh`: PASS, including release, lifecycle,
  updater, classic/API activation, workflow, secret/cmdline, race, crash,
  process-ownership, dashboard, and negative contracts.

### Rust

- `cargo fmt --all -- --check`: PASS.
- `cargo check --workspace --all-targets`: PASS.
- `cargo clippy --workspace --all-targets -- -D warnings`: PASS.
- `cargo test --workspace --all-targets`: PASS, 744 passed and 0 failed:
  `97 + 589 + 16 + 5 + 13 + 6 + 18`.

### API

- Vitest: PASS, 12 files and 160 tests.
- `npx tsc --noEmit`: PASS.
- `npx tsc`: PASS.
- `npm audit --omit=dev --audit-level=low`: PASS, 0 vulnerabilities.
- Isolated production staging audit: PASS, 0 vulnerabilities.

### Web

- Vitest: PASS, 6 files and 45 tests.
- `npx vue-tsc --noEmit`: PASS.
- Settings and dashboard production builds: PASS.
- Static bundle and process-free browser registration smoke: PASS.
- Final bundle sizes:
  - settings CSS: 9.45 kB; settings JS: 180.93 kB.
  - dashboard CSS: 2.34 kB; dashboard JS: 120.23 kB.

### Static and policy gates

- Bash syntax and ShellCheck `-S error`: PASS across 93 tracked shell files.
- Actionlint: PASS across 13 workflows.
- Python compilation: PASS across 6 tracked Python files.
- Active repository identity, stable-lock unlink, secret-bearing `/usr/bin/env`
  argv, and implementation policy scans: PASS.
- Package defaults, staged production payload, secret naming, file mode, path,
  checksum, and source/package parity scans: PASS through the package verifier.

## Package and Provenance Evidence

Read-only upstream draft evidence remained unchanged after local verification:

- Draft tag: `v2.1.0`; draft `true`; prerelease `false`.
- Archive size: 8,603,266 bytes.
- Archive SHA-256:
  `682b6866655349a356a66ce75a9f4aea9cb1b2bb6a3d39b99e13f6f4eab00907`.
- Checksum asset SHA-256:
  `7c9cb5850046cb203dec73491558663d6a15e6baf2ed092ac6a689c47cb834ab`.

The package was rebuilt from those read-only, verified assets under both
`umask 022` and `umask 077`. Package, manifest, and PLG bytes were identical:

- Package:
  `unraid-plugin/packages/yarr-2.1.0-x86_64-1.txz`.
- SHA-256:
  `d9108ee6ac2b84456bece6460fd6b614fc92c8e2885aac15b19e42e63b906619`.
- MD5:
  `4c8fe578b46833be653696bfa14573cb`.
- Size: 6,198,320 bytes.
- Inventory: 40 manifest-declared payload files, 41 regular archive files, and
  55 total archive entries.
- Independent `tar -tvf` inspection of both retained reproducible outputs found
  no `./` header and exactly 14 directory headers, all `0/0` mode `0755`; no
  archived directory is group- or world-writable.
- `release-manifest.json`, `yarr.plg`, committed package bytes, embedded
  manifest, and current source/build payloads agree.

## Changed Path Groups

- Root publication metadata, active changelog links, current documentation,
  plugin manifests, and release workflows.
- `unraid-plugin/api/src/` implementation and tests.
- `unraid-plugin/web/src/`, browser contracts, and built settings/dashboard
  bundles.
- `unraid-plugin/source/etc/rc.d/`, event hooks, lifecycle/API/update/config
  scripts, pages, staged API distribution, and staged web assets.
- `unraid-plugin/tests/` focused, fixture, workflow, release, lifecycle,
  updater, classic, dashboard, and aggregate contracts.
- `unraid-plugin/release-manifest.json`, `unraid-plugin/yarr.plg`, package build
  and verification scripts, and deterministic txz bytes.
- Task 12 SDD brief, remediation report, phase report, and progress ledger.

## Residual Concerns

- Original reviewer final re-review is pending after the same-boot reinstall
  remediation; this report does not claim approval.
- GitHub-hosted workflow execution remains unverified because dispatch was
  prohibited.
- Disposable-Unraid loader/schema/runtime, browser rendering, lifecycle,
  network/auth, and rollback gates remain intentionally unrun because live host
  mutation was prohibited.
- Beads has no configured Dolt remote; the local bead comment is authoritative
  and `bd dolt push` is expected to report that no remote is configured.

## 2026-07-23 post-review release-blocker follow-up

After the original whole-feature remediation review, the user added a release-blocking integration scope. That scope is now implemented and validated: shared original icon assets, canonical settings discoverability at `Settings/Yarr`, durable dashboard enablement, a production-grade compact dashboard widget, actual staged API/web payload contracts, and strict archive directory metadata.

The coordinated package was rebuilt from the staged real API and both web bundles under umask `022` and `077`. After the Aurora OperationIcon revision, outputs are byte-identical (SHA-256 `511335b80133dcbfe9b15a2c65c3063e2a9cfad0adc4b24c96fb9ad2d3058b66`, MD5 `143216710e10604e47b7b0be6e0017f6`, 6,216,908 bytes). Explicit `tar -tvf` checks show 14 root-UID/GID directories, all exactly `0755`; 56 total canonical members contain no `./` entry. Negative contracts reject a `0777` directory and dot-root archive paths.

Focused and full API/web suites, typechecks/builds, production audit, browser smoke, aggregate shell contracts, ShellCheck/actionlint/Python workflow gates, repository-identity and secret-argv scans, package/release verification, icon render checks, and diff hygiene all pass. No live host, workflow, release, or upstream draft asset was mutated.

This follow-up is intentionally marked ready for the parent's sequential independent reviews. It does not claim that the newly added scope has reviewer approval.
