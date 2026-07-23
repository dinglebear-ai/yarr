# Task 12 Independent Review 1 Remediation

Date: 2026-07-23

Implementation base:
`1e4bc61552eb40b898268bce444fac8dac2466fd`

This report records implementation and local verification. It does not claim
independent-review approval.

## Findings

1. **Settings round trip:** `toPublicConfig` now returns the actual
   qBittorrent non-password username while retaining `null` as the capability
   marker for services without username support. The Vue settings payload
   omits unsupported usernames and blank optional URLs. A real UI-shaped
   payload passes through `mergeConfigInput` and proves the qBittorrent
   username and existing secrets survive.
2. **Cache safety:** both page descriptors derive 12-character cache tokens
   from each CSS/JS file's SHA-256 content. The immutable icon is
   `yarr-2b068b08366b.png`; its name matches SHA-256
   `2b068b08366b3c425c1aa47c0bfd1357f90221d544d23f91e6387b39893ae743`.
   The mutable `yarr.png` payload path is absent.
3. **Updater outcomes:** expected exit-1 rollback and post-commit cleanup
   results retain structured JSON through `SafeCommandRunner` and
   `UpdateService`. Accepted messages must agree with `rolledBack` and
   `rollbackAvailable`; malformed, unexpected, or exit-2 results remain
   failures.
4. **Yarr TOML import:** import detects `.env` or TOML deliberately. It accepts
   the repository's complete `config.example.toml`, imports supported
   `[[yarr.services]]` fields, reports valid non-service fields, and rejects
   malformed, conflicting, or unsupported TOML without silently dropping
   data.
5. **Fresh reset:** reset creates a non-symlink overlay directory owned by the
   effective service user/group, forces mode `0755`, and rejects unsafe
   appdata/overlay paths before creating its transaction directory. The shell
   contract removes the overlay while Yarr is running and proves reset
   recreates it safely.
6. **Manual rollback:** `rollback --json` transactionally swaps
   `yarr.previous` into the active overlay, fsyncs, preserves stopped/running
   state, verifies same-major binaries, and restores the current binary when
   activation fails. The operation is exposed through the command allowlist,
   update service, resolver, hand-maintained SDL, web GraphQL client, and
   guarded Updates-panel confirmation.
7. **Documentation:** both credential paths now name
   `/boot/config/plugins/yarr/.env`. Operator/design/plan documentation matches
   the implemented manual rollback and structured import contracts.

## Generated and release payload

- API `dist/` and both Vue custom-element bundles were rebuilt from the fixed
  source and staged into the classic source tree.
- The classic package was rebuilt independently under umask `022` and `077`.
  Both outputs are byte-identical.
- Package: `yarr-2.1.0-x86_64-1.txz`
- SHA-256:
  `56ba2886eff4c9e08bd18fbce41b3767b9174b356fa28d4d3ee6c870a3c0f06c`
- MD5: `268005b4629da4b49a707d83c55207a4`
- Size: `6,218,032` bytes
- Archive: `57` entries, `14` root:root mode-`0755` directories, `43`
  regular files, no `./` member
- Verifier: `42` payload files plus the embedded package manifest; `16`
  declared required source paths

## Verification

- API: `177/177` tests in `13` files; typecheck and production build pass.
- Web: `52/52` tests in `7` files; typecheck, settings build, dashboard build,
  content-token checks, and process-free browser registration smoke pass.
- Focused web review group: `27/27`.
- Updater contract: pass, including absent-overlay reset, no-previous rollback,
  successful swap, same-major enforcement, failed activation restoration, and
  structured nonzero output.
- Aggregate plugin harness: workflow, release, lifecycle/config recovery,
  updater, classic/API activation/removal, package, and negative mutation
  contracts pass.
- Package verifier: pass at the committed SHA-256 with `42` payload files.
- Both retained reproducibility outputs: no dot-root member; every directory
  is root:root and mode `0755`.
- Canonical ShellCheck: pass for `16` plugin shell files at CI severity
  `error`.
- actionlint: pass.
- Python: `6` files compile; workflow mutation contract passes.
- API production audit: `0` vulnerabilities.
- Web production audit: `0` vulnerabilities.
- Active-path scan: no mutable icon URI, epoch `filemtime` cache token, or
  obsolete `yarr.env` credential path.

## Deferred and residual risk

- No live Unraid deployment, hosted workflow dispatch, or release publication
  was performed.
- Upstream `v2.1.0` draft assets were read for the pinned binary input but were
  not modified.
- Root Rust code did not change, so Rust gates were not rerun for this
  plugin-only remediation.
- The TOML importer intentionally supports the documented Yarr scalar,
  single-line array, and service array-table contract. Unsupported TOML syntax
  fails closed with an explicit error.
