# Task 12 Classic Trust and API Uninstall Remediation

Date: 2026-07-23

Base: `8f20e687ae1c21a9f22b95746100943c667c6696`

## Trusted classic package rollback

The classic PLG now treats retained packages as untrusted until they have an
exact, durable provenance sidecar that was created only after the package
matched the independently pinned PLG SHA-256 and passed strict package
validation.

- Package basenames use a bounded canonical Yarr release/build grammar.
- Package and sidecar must be regular, non-symlink, single-link, root-owned
  mode-`0600` files.
- Sidecars bind one exact SHA-256 to one exact package basename.
- Sidecars are written with a restrictive temporary file, file sync, atomic
  replacement, and directory sync.
- Rollback rechecks sidecar syntax, package digest, ownership, mode, link
  count, archive member paths, ordering, types, ownership, directory modes,
  embedded checksums, and required package inventory.
- `upgradepkg` receives only a newly copied and revalidated file in a
  root-only transaction directory, never a retained `/boot` path.
- Legacy archives without trusted provenance fail closed before service stop
  or package mutation.
- Successful retention and pruning operate on package/sidecar pairs; failed
  activation preserves a trusted recovery pair until rollback is proven.

Classic contracts reject a missing sidecar, wrong hash, corrupt ASCII input,
an unsafe but valid txz, a symlinked package, a symlinked sidecar, and an
invalid basename. Each rejection proves zero `upgradepkg` invocations. The
trusted-prior contract proves both upgrade attempts use private revalidated
copies and that the recovery pair remains usable.

## API-plugin uninstall readiness transaction

Install and uninstall now share one authenticated GraphQL and new-log
readiness implementation. A successful `unraid-api start` is only a launch
result.

- The uninstall transaction records whether the API was running or stopped.
- A known-running API must pass authenticated Yarr-present readiness before
  mutation.
- Exact target, store, loader, and registration state is copied or moved into
  a mode-`0700` recovery transaction.
- Normal uninstall commits only after authenticated host readiness, clean new
  logs, GraphQL confirmation that Yarr fields are absent, and a repeated
  static-state check.
- A known-stopped API remains stopped and uses deterministic static removal.
- Start failure, missing listener, GraphQL/auth failure, or fatal new logs
  trigger exact restoration.
- A restored running state must pass authenticated Yarr-present readiness
  before recovery artifacts are removed.
- Failed rollback readiness retains the recoverable transaction and reports
  explicit incomplete recovery; it cannot produce uninstall success.

Contracts cover start nonzero, start zero with no listener, GraphQL failure,
new-log failure, successful rollback, rollback-unready retention, successful
running uninstall, and successful stopped-state uninstall.

## Verification

- API: `209/209`; typecheck, build, and production audit with zero findings.
- Web: `58/58`; typecheck, settings/dashboard builds, browser registration
  smoke, and production audit with zero findings.
- Updater protocol: all `26` rows accepted and `748` source plus `1496`
  built/staged impossible mutations rejected.
- Focused classic trust/readiness contract: pass.
- Aggregate lifecycle, updater, classic, workflow, release, and package
  harness: pass.
- ShellCheck and actionlint: pass.
- Deterministic package builds under umask `022` and `077`: byte-identical.
- Package verifier: pass with `44` declared payload files.
- Archive: `59` entries, `14` UID/GID `0/0` directories at mode `0755`, no
  `./`, absolute, or traversal member.

Package:

- SHA-256:
  `7439d06c221872a6ef5b3832aa202ee13bc56d31ce00f7738f3e576c21b251ef`
- MD5: `1ecea0fe788a759b203ec7a86bd1dafc`
- Size: `6,227,392` bytes

No live host access, deployment, workflow dispatch, release publication, or
draft-asset mutation occurred. Independent reviewer approval is not claimed.
