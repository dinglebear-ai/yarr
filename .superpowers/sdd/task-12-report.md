# Task 12 Phase A Report: Full Local Verification

## Result

Phase A passed against approved code base
`4786ebd036077c09a6bb72fa817630b720e59256`.

- Directly counted tests: 934 passed, 0 failed.
- Rust ignored doctests: 4.
- Implementation changes made during verification: none.
- GitHub workflow dispatches: none.
- Release mutations or publication: none.
- `tootie` access or deployment: none.

## Rust Matrix

| Gate | Exact command | Result |
|---|---|---|
| Formatting | `SOLDR_BYPASS=1 CARGO_TIMINGS=0 cargo fmt --all -- --check` | PASS |
| Check | `SOLDR_BYPASS=1 CARGO_TIMINGS=0 cargo check --workspace --all-targets --locked` | PASS |
| Tests | `SOLDR_BYPASS=1 CARGO_TIMINGS=0 cargo test --workspace --locked` | PASS: 744 passed, 0 failed, 4 ignored |
| Clippy | `SOLDR_BYPASS=1 CARGO_TIMINGS=0 cargo clippy --workspace --all-targets --locked -- -D warnings` | PASS |

The Rust test result groups reported `97 + 589 + 0 + 16 + 5 + 13 + 6 + 18 + 0 + 0 = 744` passing tests. The four ignored cases were doctests.

## API Matrix

All API commands ran from `unraid-plugin/api` with `GH_TOKEN` absent.

| Gate | Exact command | Result |
|---|---|---|
| Locked install | `env -u GH_TOKEN npm ci` | PASS |
| Tests | `env -u GH_TOKEN npm test` | PASS: 11 files, 146 passed, 0 failed |
| Typecheck | `env -u GH_TOKEN npx tsc --noEmit` | PASS |
| Production build | `env -u GH_TOKEN npx tsc` | PASS |
| Production audit | `env -u GH_TOKEN npm audit --omit=dev --json` | PASS: 0 vulnerabilities |
| Production staging | `env -u GH_TOKEN npm ci --omit=dev --ignore-scripts --legacy-peer-deps` in an isolated staging directory | PASS: 0 vulnerabilities and no TypeScript, Vitest, or `@types` development payload |

The informational full development audit remains nonzero with four findings: one moderate, three high, zero critical. This is not part of the production payload; the production audit and staged production dependency check both reported zero.

## Web Matrix

All web commands ran from `unraid-plugin/web` with `GH_TOKEN` absent.

| Gate | Exact command | Result |
|---|---|---|
| Locked install | `env -u GH_TOKEN npm ci` | PASS: 0 audit findings |
| Tests | `env -u GH_TOKEN npm test` | PASS: 5 files, 44 passed, 0 failed |
| Vue typecheck | `env -u GH_TOKEN npx vue-tsc --noEmit` | PASS |
| Settings build | `env -u GH_TOKEN npm run build:settings` | PASS |
| Dashboard build | `env -u GH_TOKEN npm run build:dashboard` | PASS |
| Static-import and browser contract | `env -u GH_TOKEN npm run check:browser-bundles` | PASS |
| Artifact presence | `test -s` for settings JS/CSS and dashboard JS/CSS | PASS: four nonempty artifacts |

The browser contract emitted `Browser bundle contract and process-free registration smoke passed.` The settings build produced `yarr-settings.js` and `yarr-settings.css`; the dashboard build produced `yarr-dashboard.js` and `yarr-dashboard.css`.

## Plugin, Workflow, and Negative Contracts

| Gate | Exact command | Result |
|---|---|---|
| Release contract | `bash unraid-plugin/tests/release-contract.sh` | PASS: workflow semantics and 13 declared paths |
| Lifecycle contract | `bash unraid-plugin/tests/lifecycle-contract.sh` | PASS |
| Updater contract | `bash unraid-plugin/tests/update-contract.sh` | PASS |
| Classic/API activation contract | `bash unraid-plugin/tests/classic-contract.sh` | PASS: API 2.1.0 activated, `yarrRuntime` verified, API removed |
| Structured workflow contract | `python3 unraid-plugin/tests/workflow_contract.py --ci .github/workflows/unraid-plugin-ci.yml --release .github/workflows/unraid-plugin-release.yml` | PASS |
| Aggregate contracts | `bash unraid-plugin/tests/run.sh` | PASS |
| Python compilation | `python3 -m py_compile unraid-plugin/tests/workflow_contract.py unraid-plugin/tests/mutate_workflow.py` | PASS |

The aggregate runner repeated release, lifecycle, updater, classic/API activation, and workflow contracts. It also passed 17 explicit rejection/mutation cases covering malformed release metadata, non-canonical paths, mutable workflow actions, omitted gates, tag collisions, incomplete security documentation, job dependency drift, tag checkout drift, publication ordering, permission scope, job-wide tokens, and commented-out committed-digest enforcement. Contract-owned negative cases also passed.

## Static Analysis and Policy

| Gate | Exact command | Result |
|---|---|---|
| ShellCheck | `shellcheck -S error` over classic `rc.yarr`, event hooks, lifecycle/update/API scripts, build scripts, and contract scripts | PASS: 19 files |
| Actionlint | `actionlint` over every YAML file discovered under `.github/workflows` | PASS: 13 workflows |
| Raw policy scan | `rg -n 'eval|curl[^\n]*\|[^\n]*(sh|bash)|@app/|password[^\n]*console|apiKey[^\n]*console' unraid-plugin` | Four intentional test-only hits |
| Implementation policy scan | The same `rg` expression with `--glob '!**/tests/**' --glob '!**/*.spec.ts'` | PASS: zero implementation hits |

The four raw matches are three lifecycle/updater test harnesses that wrap shell functions with `eval`, plus one schema test that asserts `@app/` is absent. No implementation file matched.

## Upstream Draft Evidence

Read-only commands:

```bash
gh release view v2.1.0 -R dinglebear-ai/yarr \
  --json tagName,isDraft,isPrerelease,assets,url
gh release download v2.1.0 -R dinglebear-ai/yarr \
  --pattern yarr-x86_64.tar.gz \
  --pattern yarr-x86_64.tar.gz.sha256 \
  --dir /tmp/yarr-task12-phase-a/upstream
```

Result:

- Tag: `v2.1.0`.
- State: draft, unpublished, not prerelease.
- Assets: exactly `yarr-x86_64.tar.gz` and `yarr-x86_64.tar.gz.sha256`.
- Archive size: 8,603,266 bytes.
- Checksum asset size: 85 bytes.
- Archive SHA-256: `682b6866655349a356a66ce75a9f4aea9cb1b2bb6a3d39b99e13f6f4eab00907`.
- Checksum asset SHA-256: `7c9cb5850046cb203dec73491558663d6a15e6baf2ed092ac6a689c47cb834ab`.
- GitHub-reported asset digests matched downloaded bytes.
- The sibling checksum validated the archive.
- Archive inventory was exactly one regular mode-`0755` file named `yarr`.
- Extracted binary reported exactly `yarr 2.1.0`.

A second read-only release query after all local gates matched the initial normalized state byte-for-byte: the draft flag, asset names, sizes, and digests were unchanged.

## Package Reproducibility and Integrity

Commands:

```bash
umask 022
YARR_RELEASE_ASSET_DIR=/tmp/yarr-task12-phase-a/upstream \
  bash unraid-plugin/scripts/build-package.sh 2.1.0 1
bash unraid-plugin/scripts/verify-package.sh

umask 077
YARR_RELEASE_ASSET_DIR=/tmp/yarr-task12-phase-a/upstream \
  bash unraid-plugin/scripts/build-package.sh 2.1.0 1
bash unraid-plugin/scripts/verify-package.sh
```

Result:

- Committed package SHA-256: `62fd224556ea54a19b037a7fbf93342a2129c441774de75c56b76a2f19d76a95`.
- Umask `022` package SHA-256: `62fd224556ea54a19b037a7fbf93342a2129c441774de75c56b76a2f19d76a95`.
- Umask `077` package SHA-256: `62fd224556ea54a19b037a7fbf93342a2129c441774de75c56b76a2f19d76a95`.
- Package MD5 for classic PLG compatibility: `bc6d735038900ca1b95eebb6a04fc573`.
- Both rebuilds were byte-identical to each other and to the pre-build committed package snapshot.
- `verify-package.sh` passed after each build and once more after explicit integrity checks.
- `release-manifest.json`, `yarr.plg`, and package SHA-256 values agreed.
- `yarr.plg` and the package MD5 value agreed.
- Embedded manifest covered exactly 39 payload files.
- Archive contained 40 regular files including the embedded manifest itself.
- Every embedded checksum, mode, and path matched its extracted regular file.
- Archive entries were sorted, canonical, root-owned, and limited to directories and regular files.
- Required `0755`, `0644`, and `0600` modes passed.
- `default.env` had no non-comment value.
- Secret-, token-, password-, credential-, and API-key-named defaults in `default.cfg` had no value.
- Production staging contained no API test output or known development dependencies.
- API package metadata, API JavaScript, and all four web artifacts were byte-identical to current build outputs.
- Tracked classic source/package byte and mode parity passed.
- Browser bundles retained no unresolved static imports.

## Worktree Hygiene

Before evidence creation, the checkout was clean at
`4786ebd036077c09a6bb72fa817630b720e59256`.

After all builds and checks:

- `git diff 4786ebd036077c09a6bb72fa817630b720e59256 -- .` was empty.
- `git status --porcelain=v1 --untracked-files=all` was empty because `.superpowers/` is intentionally ignored.
- The Task 12 brief, report, and ledger exist under the ignored `.superpowers/sdd/` tree and are the only files authorized for force-add.
- No implementation or generated tracked file changed.

## Evidence Harness Notes

No product gate failed. Three evidence-wrapper issues were corrected without implementation changes:

- The first browser wrapper searched the Vitest log for the smoke marker even though the canonical marker is emitted by `check:browser-bundles`; the canonical command had passed and passed again on rerun.
- The first static wrapper used Bash `mapfile` under the ambient Zsh shell and stopped before invoking ShellCheck; the complete static matrix was rerun under explicit Bash and passed.
- The raw policy scan intentionally found four test-only strings; a corrected implementation-only glob proved zero implementation hits.

One preliminary explicit-integrity shell invocation had a quoting syntax error before running its assertions. The corrected invocation and final no-warning credential parser both passed.

## Residual Gaps and Concerns

- Task 12 Phase B's two independent reviews were not run because this request was Phase A local verification only.
- GitHub-hosted execution of the new CI and release workflows remains unverified.
- No release was created, edited, published, or deleted.
- No deployment or live check ran on `tootie`.
- Real Unraid loader/schema, GraphQL host integration, settings/dashboard rendering, lifecycle, network/auth, Tailscale, Docker discovery, updater, MCP, rollback, and retention checks remain the disposable-Unraid gate.
- API development dependencies report four audit findings: one moderate and three high. Production audit and production staging report zero.
- `bd dolt push` exited `0` with `No remote is configured - skipping.` The absent Dolt remote is recorded as non-fatal.

## Whole-Feature Security Review 1 Remediation

Review 1 remediation was implemented from baseline
`4f15eb5c72a1dbf217705587abef7b2aa963f980`. All 13 findings have focused
tests and pass locally. This is remediation status only; original reviewer
approval remains pending.

The first remediation commit
`4119e97c3ed88db617616df3c4894c630c1e7da2` received a follow-up review with
four remaining gaps. The follow-up implementation removes the release-report
identity false negative, stages bounded updater network work outside the
lifecycle lock, journals known-good config rollback across every crash point,
and enforces the immutable packaged binary's supported major under lock. The
full matrix below includes those changes; reviewer approval remains pending.

The reviewer rechecked follow-up commit
`1b7803aa4f9b9ee64e0542c51517fcb74f16788b`, accepted three gaps, and found one
remaining High-severity race: a staged updater could write appdata after the
array-stop hook returned. Commit
`e71c23eb70b1f604ef0496f78cf7230e4a94fcc7` established a private
array-stopping fence under the lifecycle lock before quiescence and closed that
High finding. The next re-review found a low same-boot reinstall regression:
the fence remained after uninstall and blocked ordinary autostart after the
array remounted while Yarr was absent. The latest remediation preserves the
fence across unmount and uninstall so old waiting updaters still fail closed,
but makes a classic installer that proves `/mnt/user` mounted enter the same
lock-held mounted transition as the array-start hook. The classic contract
proves unmounted reinstall remains fenced and mounted reinstall clears before
autostart. Final reviewer approval remains pending.

Key contract changes:

- Trusted-gateway authentication is loopback-only; every non-loopback bind
  requires bearer or Google OAuth, with direct-socket spoof rejection.
- The installer awaits and validates the real packaged async GraphQL exporter.
- Lifecycle ownership survives deleted-inode upgrades and proves new PID/socket
  readiness and stop/uninstall quiescence.
- API, OAuth/bearer, and service credentials are absent from process argv.
- Current source, binary, and package repositories default explicitly to
  `dinglebear-ai/yarr`.
- Package, API, configuration, lifecycle, hook, and updater operations share a
  never-unlinked stable lock inode.
- The cfg/JSON pair has durable crash recovery before every read/startup path.
- Updater network staging does not hold the lifecycle lock; activation
  revalidates policy, candidate identity, and packaged-major support under the
  lock. Array stop fences all later appdata access until mounted-array start
  clears the fence. A mounted classic reinstall uses that same transition,
  while unmount and uninstall retain the fence. Hooks have bounded retries;
  wrapper logs have safe bounded rotation.
- `YarrDashboard.page` ships and mounts the actual dashboard bundle.
- Secret alias redaction derives from the service catalog.
- Updater network and resource consumption is bounded.

Final local evidence:

- Rust fmt/check/clippy pass; Rust tests pass `744/744`.
- API passes 12 files and `160/160`, typecheck, build, production staging, and
  zero-vulnerability production audit.
- Web passes 6 files and `45/45`, typecheck, both builds, and browser/static
  smoke.
- Lifecycle, updater, classic/API activation, release, structured workflow
  mutation, and aggregate contracts pass.
- Bash syntax and ShellCheck pass across 93 files; actionlint passes 13
  workflows; Python compilation passes 6 files.
- Deterministic `umask 022` and `077` package, manifest, and PLG bytes agree.
- Final package SHA-256 is
  `d9108ee6ac2b84456bece6460fd6b614fc92c8e2885aac15b19e42e63b906619`;
  MD5 is `4c8fe578b46833be653696bfa14573cb`; size is 6,198,320 bytes.
- The package verifier passes 40 manifest-declared payload files. The archive
  has 41 regular files and 55 total entries.
- `tar -tvf` inspection of both retained reproducible outputs found no `./`
  entry; all 14 archived directories are `root:root` mode `0755`, with no
  group/world-write bits.
- Read-only upstream draft evidence remains unchanged: archive SHA-256
  `682b6866655349a356a66ce75a9f4aea9cb1b2bb6a3d39b99e13f6f4eab00907`
  and checksum-asset SHA-256
  `7c9cb5850046cb203dec73491558663d6a15e6baf2ed092ac6a689c47cb834ab`.
- No workflow, release, or live-host mutation occurred.

Detailed evidence is in
`.superpowers/sdd/task-12-review1-fixes-report.md`.

## 2026-07-23 post-review integration scope

The follow-up integration scope is implemented without changing root Yarr authentication or performing any live mutation. The classic plugin now ships a canonical `Yarr.page` at `Settings/Yarr`, a production dashboard page and compact bundle, and one shared original Yarr icon. The dashboard enablement setting is durable across the shell/JSON transaction pair and exposed through the validated GraphQL and Vue settings surfaces.

Archive construction now normalizes the complete staged directory tree and validates the resulting tar metadata. Both reproducibility builds contain 56 canonical members (14 directories and 42 regular files), contain no `./` member, use root UID/GID, and encode every directory as `0755`. Negative fixtures prove that a dot-root member or a group/world-writable directory is rejected.

### Final artifact evidence

| Evidence | Result |
| --- | --- |
| Package | `unraid-plugin/packages/yarr-2.1.0-x86_64-1.txz` |
| SHA-256 | `511335b80133dcbfe9b15a2c65c3063e2a9cfad0adc4b24c96fb9ad2d3058b66` |
| MD5 | `143216710e10604e47b7b0be6e0017f6` |
| Size | 6,216,908 bytes |
| Reproducibility | byte-identical under umask `022` and `077` |
| Archive layout | 56 entries, 14 directories, 42 regular files, 0 dot-root members |
| Icon | 256x256 RGBA, mode `0644`, SHA-256 `2b068b08366b3c425c1aa47c0bfd1357f90221d544d23f91e6387b39893ae743` |
| Required source inventory | 16 paths |
| Package verifier payload count | 41 files |

### Final verification evidence

- API focused tests: 52/52; full tests: 161/161; typecheck, build, and production audit passed with 0 vulnerabilities.
- Web focused tests: 23/23; full tests: 48/48; typecheck, settings build, dashboard build, and browser registration smoke passed.
- Settings bundle: 181.53 kB JS and 9.45 kB CSS. Dashboard bundle: 122.76 kB JS and 4.22 kB CSS.
- Aggregate contract harness passed workflow, release inventory, lifecycle/config recovery, updater/race/resource, real packaged API activation/removal, classic/browser/package, secret/cmdline sentinel, and archive negative-mutation contracts.
- Static gates passed for 17 shell syntax files, canonical error-severity ShellCheck, actionlint, 2 Python workflow contracts, canonical repository identity, secret-free argv policy, explicit tar listings, package verification, release zero-SHA rejection, and diff hygiene.
- Deterministic CairoSVG 2.7.1 rendering matched the committed PNG byte-for-byte. The 32x32 RGBA render retained 84 rose pixels for the hub, links, and three endpoints; 20 cyan play pixels; 572 dark surface pixels; and 736 opaque pixels.

No deployment, workflow dispatch, release publication, or upstream `v2.1.0` draft-asset mutation occurred. The earlier review decision predates this added integration scope; the parent will run sequential independent reviews, so this report does not claim approval.

## 2026-07-23 independent review 1 remediation

All seven findings from independent review 1 were implemented from
`1e4bc61552eb40b898268bce444fac8dac2466fd`: capability-aware username
round trips, content-derived page tokens and immutable icon naming, structured
nonzero updater results, deliberate `.env`/Yarr TOML import, safe absent-overlay
reset, end-to-end manual binary rollback, and corrected operator/design
documentation.

Final gates pass with API `177/177`, web `52/52`, both typechecks/builds,
browser bundle smoke, updater and aggregate plugin contracts, package
verification, canonical ShellCheck for `16` plugin scripts, actionlint, Python
compilation/workflow mutation, and zero production audit findings. Umask `022`
and `077` packages are byte-identical at SHA-256
`56ba2886eff4c9e08bd18fbce41b3767b9174b356fa28d4d3ee6c870a3c0f06c`,
MD5 `268005b4629da4b49a707d83c55207a4`, size `6,218,032` bytes. Each archive
has `57` entries and `14` root:root mode-`0755` directories with no `./`
member. No live host, workflow, release, or upstream draft mutation occurred,
and no review approval is claimed.

Detailed evidence is in
`.superpowers/sdd/task-12-independent-review1-fixes-report.md`.

## 2026-07-23 independent review 1 follow-up

The two follow-up findings are remediated from
`a800519af4ca2be8b335e36714c327e1c7e8fbfa`. Manual rollback is now
preservation-first: immutable durable snapshots precede any live-path change,
all activation/restoration replacements are staged and atomic, restoration
halts at its first failed step, and `rolledBack=true` requires exact hash/mode
and runtime-state recovery. An incomplete restoration retains both snapshots
and emits a structured false result through shell, API, and UI.

Username-only qBittorrent imports now display credential consent. The real UI
payload sends `consent:true`, the real backend codec persists acceptance, and
decline preserves the existing username.

Full gates pass with API `179/179`, web `53/53`, updater and aggregate
contracts, deterministic umask `022`/`077` package bytes, package verification,
ShellCheck, actionlint, Python workflow validation, browser smoke, and zero
production audit findings. The rebuilt package is SHA-256
`dab032149ea8d3682dc41b94d58d62f7906a39a383705fd7ef0c9b8c38f98957`,
MD5 `1ae9cdd127b855f24bc178a57ada09e1`, size `6,221,988` bytes. No live or
release mutation occurred, and no review approval is claimed.

## 2026-07-23 independent review 2 remediation

All four findings from independent reviewer 2 are remediated from
`84decee6bc8b6257a42eeab62fe1531ee9d18bd4`: logger signals now require
atomic private PID/start-tick/executable/argv identity evidence; apply and reset
now use non-consumable durable snapshots and truthful restoration outcomes;
credential-only import requires an imported or existing valid service URL; and
stopped status establishes process ownership before parsing malformed config.

Fault injection proves apply/reset commit-sync failure followed by restoration
move failure retains recovery snapshots and surviving binaries with
`rolledBack=false`. PID-reuse coverage proves an unrelated `sleep` survives
stale logger evidence. Malformed/no-PID status, pre-install quiescence, array
stop, and uninstall all complete, while unverified live PID evidence remains
fail-closed.

Final gates pass with API `184/184`, web `55/55`, both typechecks/builds,
browser smoke, zero-vulnerability production audits, focused lifecycle/updater
contracts, aggregate package/plugin contracts, package verification,
ShellCheck `16`, actionlint `2`, Python `2`, secret inventory, and diff hygiene.
Umask `022` and `077` packages are byte-identical at SHA-256
`0615f59bf6b68fe6a9bf9e490bca9996e3cb598c6c86663d83fd02cb301b0a67`,
MD5 `f122fe0b41741664c6a8e6b4e57fb443`, size `6,221,460` bytes. Each archive
has `57` entries, `43` files, `14` root:root mode-`0755` directories, no `./`
member, and a `42`-file embedded payload inventory.

No deployment, workflow dispatch, release publication, or upstream draft
mutation occurred. Independent review approval remains pending. Detailed
evidence is in
`.superpowers/sdd/task-12-independent-review2-fixes-report.md`.

## 2026-07-23 independent review 2 recovery follow-up

The remaining pre-mutation recovery-directory leak is remediated from
`89081f572806eefb36e2dc4c34c1668ef1e6f495`. Apply and reset immediately remove
their newly created transaction after every snapshot preparation failure. If
that removal fails, the transaction remains private and shell/API/UI preserve
its validated identifier with `rolledBack=false`; normal retries cannot
accumulate directories. Failures after mutation begins still retain durable
snapshots.

Focused gates pass: updater contract, API update service `40/40`, and web
settings `22/22`. Full API is `187/187`; full web is `56/56`; both typechecks,
builds, browser bundle smoke, and production audits pass. Package verification
and the aggregate plugin/package harness pass. Umask `022` and `077` packages
are byte-identical at SHA-256
`0f93751134d1e832e351c0f859ef3c96db83c6bfe164e8e070945fffd92f7cad`,
MD5 `2de6a0dd2423c1f55aebb023dbc19522`, and `6,220,520` bytes. Each archive has
`57` entries, no `./` member, and `14` UID/GID `0/0` directories at `0755`.

No deployment, workflow dispatch, release publication, or upstream draft
mutation occurred. Independent review approval remains pending. Detailed
evidence is in
`.superpowers/sdd/task-12-independent-review2-followup-report.md`.

## Final-head recovery cleanup remediation

The final-head review on
`1fcc18163bc5bdd39bd64184275f7a7772b881f8` identified three remaining
issues. All are remediated:

- Recovery-directory removal failures are now propagated for every update,
  reset, and manual rollback removal site through shell JSON, API, GraphQL, and
  UI.
- `rolledBack` and `cleanupPending` are modeled independently. Exact
  restoration plus retained snapshots is accepted and displayed as both
  restoration success and cleanup required; malformed, traversal, mismatched,
  or contradictory outcomes are rejected.
- Manual rollback preparation uses the shared cleanup path for every chmod,
  copy/install, verification, file-sync, transaction-sync, and overlay-sync
  failure. Repeated normal failures do not leak transactions; failed cleanup
  retains one validated mode-0700 transaction.
- Active documentation describes SHA-256 CSS/JavaScript content tokens and the
  immutable content-hashed icon filename.

Focused updater, API/GraphQL, and UI tests passed. Full API (185 tests), web
(57 tests), deterministic package, verifier, and aggregate plugin/package
gates passed. The coordinated package is 6,222,972 bytes:

- SHA-256:
  `4e9c53bf87fd566fd929c717273d0b636f12fa35e491defd718704965bd87575`
- MD5: `aa19d0e84f83842285aa228efaecd380`

No deployment, workflow dispatch, release publication, or upstream draft
mutation occurred. Independent reviewer approval remains pending. Detailed
evidence is in
`.superpowers/sdd/task-12-final-head-review-fixes-report.md`.

## Exit-zero updater protocol remediation

The subsequent final-head review found that successful updater responses could
be accepted by message shape without an operation-specific state contract. The
protocol now carries explicit `operation` and namespaced `outcome`
discriminators on every structured shell result.

`UpdateService` validates all results, including exit-zero results, through one
closed 26-row matrix:

- three `CHECK` rows
- eight `APPLY` rows
- seven `RESET` rows
- eight `ROLLBACK` rows

Each row binds requested operation, response operation, outcome, exit code,
`rolledBack`, `cleanupPending`, recovery-identifier presence and operation
prefix, `usingOverlay`, update/available-version state, rollback availability
where deterministic, and the exact bounded message class. Unknown outcomes,
cross-operation responses, forged operation fields, flipped exits, malformed
booleans/identifiers, traversal, prefix mismatch, state contradictions, and
message/outcome mismatch fail before resolver exposure.

GraphQL publishes `YarrUpdateOperation` and `YarrUpdateOutcome` enums. The web
client requests both fields, and the Updates panel uses the validated outcome
rather than parsing message text to classify restoration, incomplete recovery,
or pre-mutation cleanup.

Verification:

- updater contract: pass
- focused API/GraphQL: 79/79
- focused web: 39/39
- full API: 206/206, typecheck, build, zero-vulnerability production audit
- full web: 58/58, typecheck, settings/dashboard builds, browser registration
  smoke, zero-vulnerability production audit
- shell syntax and ShellCheck: pass
- umask 022/077 package rebuilds: byte-identical
- release/package verifier: pass
- aggregate plugin/package harness: pass

The rebuilt package is 6,224,220 bytes with SHA-256
`8afebcddeccf771fa20868f05592526c54fdc36a5c0e8744a2314b0a49d894e2`
and MD5 `a7a50dec2c3c02dea8ab2fdda751f97b`. It has 57 archive entries and
42 declared payload files.

No deployment, workflow dispatch, release publication, or upstream draft
mutation occurred. Independent reviewer approval remains pending. Detailed
evidence is in
`.superpowers/sdd/task-12-exit-zero-updater-contract-report.md`.
