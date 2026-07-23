# Yarr Unraid plugin SDD progress
Plan: docs/superpowers/plans/2026-07-22-yarr-unraid-plugin.md
Task 1: complete (commits dc763db..509e428, review clean)
Task 2: complete (commits 509e428..ee2ea10, review clean)
Task 3: complete (commits ee2ea10..c7fba2f, review clean)
Task 4: complete (commits c7fba2f..5f4b5c0, review approved; minor: exact serialized key order lacks a direct assertion; four npm advisories are dev-only)
Task 5: complete (commits 5f4b5c0..0ae168a, review clean; tootie flock=/usr/bin/flock util-linux 2.42.1)
Task 6: complete (commits 0ae168a..0b08c24, review clean)
Task 7: complete (commits 0b08c24..2c41057, review clean; live loader requires adapter=nestjs)
Task 8: complete (commits 2c41057..4ada8c5, review clean)
Task 9: complete (commits 4ada8c5..a88e96c, review clean)
Task 10: complete and APPROVED (commits a88e96c..1bd436e and 1bd436e..d9802ee, review clean after remediation; bash unraid-plugin/tests/run.sh, classic contracts, ShellCheck -S error, package build/verification, source parity, path/inventory/secret checks, and umask 022/077 byte-identical reproducibility passed; package SHA-256 62fd224556ea54a19b037a7fbf93342a2129c441774de75c56b76a2f19d76a95; disposable-Unraid deployment plus live loader/schema/runtime gates deferred)
Task 11: implementation complete (commit 1771d50; pinned CI, transactional two-version release automation, operator docs, and non-vacuous workflow/doc contracts; release contract, just unraid-test, API 146/146, web 44/44, typechecks/builds, ShellCheck, actionlint, umask 022/077 reproducibility, and 39-file package verification pass; package SHA-256 62fd224556ea54a19b037a7fbf93342a2129c441774de75c56b76a2f19d76a95; GitHub workflow execution and disposable-Unraid live gates deferred)
Task 11 review remediation: complete (range 1771d50..9a0a4fc; immutable tag SHA provenance, committed upstream/package digests, ID/marker-owned fail-closed draft transaction, step-scoped tokens, parsed YAML semantic contracts with six critical mutations, actionlint, and trusted-gateway docs; release/aggregate/API 146/web 44/ShellCheck/actionlint/two-umask 39-file package gates pass; package SHA-256 unchanged at 62fd224556ea54a19b037a7fbf93342a2129c441774de75c56b76a2f19d76a95; workflows and disposable-Unraid live gates deferred)
Task 11 review remediation mode follow-up: complete (commit 4786ebd; release contract and provenance/publication helpers are executable; final range 1771d50..4786ebd)
Task 11: APPROVED at 4786ebd036077c09a6bb72fa817630b720e59256 (review remediation and executable-mode follow-up accepted; Task 12 phase A begins from this clean approved code base)
Task 12 phase A: PASS at approved base 4786ebd036077c09a6bb72fa817630b720e59256 (Rust fmt/check/clippy pass; Rust 744 passed/0 failed/4 ignored; API 146/146 with zero production audit findings; web 44/44 with both custom-element builds and browser smoke; individual plus aggregate release/lifecycle/updater/classic/API-activation/workflow contracts pass with 17 explicit mutation/rejection cases; Python compilation, ShellCheck 19/19, actionlint 13/13, and implementation policy scan pass; umask 022/077 packages are byte-identical to committed SHA-256 62fd224556ea54a19b037a7fbf93342a2129c441774de75c56b76a2f19d76a95; upstream draft assets remain unchanged at archive SHA-256 682b6866655349a356a66ce75a9f4aea9cb1b2bb6a3d39b99e13f6f4eab00907 and checksum-asset SHA-256 7c9cb5850046cb203dec73491558663d6a15e6baf2ed092ac6a689c47cb834ab; implementation dirt none; Phase B independent reviews, hosted workflows, and disposable-Unraid live gates remain deferred; four API development-only audit findings remain; Beads has no Dolt remote)
Task 12 review 1 remediation: implemented and locally verified from 4f15eb5c72a1dbf217705587abef7b2aa963f980; first remediation commit 4119e97 received four follow-up findings, remediated with release-report identity hygiene, lock-free bounded updater network staging plus lock-held revalidation, crash-journaled known-good rollback, and immutable packaged-major enforcement; reviewer recheck of 1b7803a accepted three gaps but found post-stop appdata activation, remediated at e71c23e with a lock-protected array-stopping fence; the next re-review closed that High finding but rejected a low same-boot reinstall regression, now remediated by retaining the fence across unmount/uninstall and routing only a proven mounted reinstall through the same lock-held mounted transition as the array-start hook; all 13 original findings have focused coverage; Rust 744/744, API 160/160, web 45/45, lifecycle/updater/classic/release/workflow/aggregate contracts, ShellCheck 93 files, actionlint 13 workflows, Python compilation 6 files, secret/policy scans, and umask 022/077 deterministic package verification pass; both retained archives omit `./` and have 14 root:root 0755 directory entries with no group/world-write bits; package SHA-256 d9108ee6ac2b84456bece6460fd6b614fc92c8e2885aac15b19e42e63b906619, MD5 4c8fe578b46833be653696bfa14573cb, 40 declared payload files; upstream draft digests unchanged; no workflow/release/live-host mutation; original reviewer final approval pending; Beads has no Dolt remote

### 2026-07-23 - Post-review Unraid discoverability, dashboard, and archive hardening

- Added the original Aurora-aligned Yarr SVG and deterministic packaged 256x256 RGBA PNG; both settings and dashboard pages use `Icon="yarr.png"`.
- Canonicalized the settings route to `Settings/Yarr` with `Yarr.page`, safe CSRF bootstrap, independent mtime cache busting, and route-drift contracts.
- Added persistent `DASHBOARD_WIDGET_ENABLE` configuration (default `true`) through shell validation, GraphQL codec/types/resolver, and the Vue settings UI.
- Upgraded the compact dashboard custom element while preserving visibility-aware, non-overlapping, bounded polling and safe bounded controls.
- Added archive layout verification and negative mutations: no `./` members, canonical paths only, root UID/GID, and every directory exactly `0755`.
- Rebuilt the coordinated package twice under umask `022` and `077`; both outputs are byte-identical at SHA-256 `e961580952e43d8fde61bb4c9518b3289d2025d24616f3cb25af845398e2fd43`, MD5 `a87c1b417b3fb56147b6edcc4fd790bc`, 6,229,812 bytes.
- Final package inventory: 56 archive entries, 14 directories, 42 regular files, zero dot-root members; verifier reports 41 payload files and 16 declared source paths.
- Gates: API focused 52/52 and full 161/161; web focused 23/23 and full 48/48; API/web typechecks and builds; production audit 0 vulnerabilities; aggregate contracts PASS; 17 shell syntax files plus canonical ShellCheck PASS; actionlint PASS; 2 Python workflow contracts compile; canonical identity, secret-argv, package, release, workflow, tar-mode, and diff-hygiene checks PASS.
- No host deployment, workflow dispatch, release publication, or upstream draft mutation was performed. This post-review scope awaits the parent's sequential independent reviews; no approval is claimed here.

### 2026-07-23 - Aurora OperationIcon revision

- Replaced the rejected orbital-Y badge with an Aurora-native media-fleet operation glyph: a central play hub connected to three managed service endpoints.
- The canonical SVG uses a 24x24 `fill="none"` glyph grid, rounded caps/joins, 1.75 stroke weight, Aurora media rose `#ff7eb0`, and one restrained cyan play accent.
- Deterministic CairoSVG 2.7.1 rendering produced a 256x256 RGBA PNG; its 32px raster preserves 84 rose pixels, 20 cyan pixels, 572 dark surface pixels, and 736 opaque pixels.
- Rebuilt the coordinated package twice under umask `022` and `077`; both outputs are byte-identical at SHA-256 `511335b80133dcbfe9b15a2c65c3063e2a9cfad0adc4b24c96fb9ad2d3058b66`, MD5 `143216710e10604e47b7b0be6e0017f6`, 6,216,908 bytes.
- Focused classic/icon/package contracts and the complete aggregate Yarr plugin harness pass. No deployment, workflow dispatch, release publication, or upstream draft mutation was performed.

### 2026-07-23 - Independent review 1 remediation

- Fixed all seven findings from base `1e4bc61552eb40b898268bce444fac8dac2466fd`: safe username round trips, immutable content-addressed cache/icon behavior, structured nonzero updater results, `.env` plus Yarr TOML import, absent-overlay reset, full manual rollback, and corrected docs.
- Manual rollback now spans shell transaction/recovery, command allowlisting, API service, resolver and exact SDL parity, Vue GraphQL, and a guarded Updates-panel flow, with no-previous and activation-failure coverage.
- Final gates: API `177/177`, web `52/52`, typechecks/builds, browser smoke, updater and aggregate contracts, package verifier, ShellCheck `16` at CI severity, actionlint, Python `6` plus workflow mutation, and API/web production audits with zero findings.
- Umask `022` and `077` packages are byte-identical at SHA-256 `56ba2886eff4c9e08bd18fbce41b3767b9174b356fa28d4d3ee6c870a3c0f06c`, MD5 `268005b4629da4b49a707d83c55207a4`, size `6,218,032` bytes; both contain `57` canonical entries, `14` root:root `0755` directories, and no `./` member.
- No deployment, workflow dispatch, release publication, or upstream draft mutation occurred. Independent review approval remains pending.

### 2026-07-23 - Independent review 1 follow-up

- Fixed preservation safety for manual rollback from base `a800519`: private
  durable snapshots now precede all live replacements; staged atomic copies
  preserve the only active/previous binaries; recovery stops on its first
  failed step and reports incomplete restoration with `rolledBack=false`.
- Added direct restoration-helper fault injection proving active,
  `yarr.previous`, both snapshots, and truthful structured output survive, with
  no later restoration move after the injected failure.
- Username-only qBittorrent previews now require an explicit credential
  consent decision in the UI; acceptance persists through the real codec and
  decline preserves the current username.
- Gates: focused API `42/42`, focused web `19/19`, full API `179/179`, full web
  `53/53`, updater and aggregate package/plugin contracts, browser smoke,
  verifier, ShellCheck, actionlint, Python workflow contracts, deterministic
  umask `022`/`077` builds, and zero-vulnerability production audits pass.
- Package SHA-256
  `dab032149ea8d3682dc41b94d58d62f7906a39a383705fd7ef0c9b8c38f98957`,
  MD5 `1ae9cdd127b855f24bc178a57ada09e1`, size `6,221,988` bytes; `57`
  canonical entries, `43` files, `14` root:root `0755` directories, no `./`.
- No deployment, workflow dispatch, release publication, or upstream draft
  mutation occurred. Independent reviewer approval remains pending.

### 2026-07-23 - Same-operation updater state validation

- Strengthened the closed 26-row updater matrix with strict core Yarr release
  parsing and integer comparison aligned to the shell arithmetic domain.
- Added shared same-major, derived update flag, packaged-selection, overlay,
  rollback, cleanup, and nullability invariants plus explicit predicates for
  current, update-available, committed apply, completed reset, and all
  rollback states.
- Preserved the valid manual rollback model: active and previous slots remain
  in the packaged major, but either-direction swaps do not invent a version
  ordering guarantee.
- Added source/built/candidate-staged/package-staged property contracts. Each
  module accepts all 26 legitimate rows and rejects 748 impossible mutations.
- Gates: focused API 62/62; full API 209/209 plus typecheck/build/audit 0; full
  web 58/58 plus typecheck/both builds/browser smoke/audit 0; aggregate,
  verifier, workflow, ShellCheck, actionlint, secret, archive, and diff checks
  pass.
- Umask 022/077 packages are byte-identical: SHA-256
  `abd1e4d28418309fb3c056bb03637c34292969603ccc092c2c6754e1d7d72406`,
  MD5 `6602d3e9bde7786723b659296b597ae3`, size `6,225,000` bytes,
  `57` entries, `42` declared files, `14` root-owned mode-`0755`
  directories, and no `./` member.
- No deployment, workflow dispatch, release publication, or upstream draft
  mutation occurred. Independent reviewer approval remains pending.

### 2026-07-23 - Exit-zero updater protocol remediation

- Added mandatory `operation` and namespaced `outcome` fields to every
  structured updater shell response.
- Replaced exit-zero special handling and message-led nonzero handling with one
  closed 26-row UpdateService matrix covering check, apply, reset, and manual
  rollback.
- Bound every valid row to requested/response operation, outcome, exit code,
  rollback and cleanup truth, validated recovery identifier, overlay/update
  state, deterministic rollback availability, and bounded message class.
- Added full cross-operation substitution coverage for native and forged
  operation fields, plus flipped-exit and malformed state-tuple tests.
- Added GraphQL operation/outcome enums and resolver/schema parity coverage.
- Changed the web update panel to classify restoration and cleanup from
  validated outcome fields rather than human message text.
- Passed updater contract; focused API/GraphQL 79/79; focused web 39/39; full
  API 206/206 plus typecheck/build/clean production audit; full web 58/58 plus
  typecheck/both builds/browser smoke/clean production audit; ShellCheck;
  release verifier; and aggregate plugin/package harness.
- Rebuilt byte-identical packages under umask 022 and 077. Final package:
  SHA-256
  `8afebcddeccf771fa20868f05592526c54fdc36a5c0e8744a2314b0a49d894e2`,
  MD5 `a7a50dec2c3c02dea8ab2fdda751f97b`, size 6,224,220 bytes,
  57 archive entries and 42 declared files.
- No deployment, workflow dispatch, release publication, or upstream draft
  mutation occurred. Independent reviewer approval remains pending.

## 2026-07-23 - Task 12 final-head recovery cleanup fixes

- Audited every update/reset/manual-rollback recovery-directory removal site
  and made removal failure a structured, validated outcome.
- Added independent `cleanupPending` and bounded `recoveryIdentifier` fields
  through shell JSON, API parsing, hand-maintained GraphQL SDL/types, resolver,
  web queries/types, and update-panel rendering.
- Preserved truthful combinations: pre-mutation cleanup failure is never
  rollback; exact restoration may coexist with cleanup pending; incomplete
  restoration retains durable snapshots without a false success claim.
- Added API rejection for traversal, malformed/bare identifiers,
  operation-prefix mismatch, invalid booleans, and contradictory
  rollback/cleanup/exit combinations.
- Completed the manual rollback preparation matrix across chmod, four staged
  copies, four syncs, four verifications, transaction sync, and overlay sync.
  Each normal failure was repeated and proved leak-free with unchanged
  active/previous hashes and modes and no mutation moves.
- Added direct update/reset/rollback tests for candidate/preparation failure
  plus cleanup failure, exact restoration plus cleanup failure, and committed
  operation plus cleanup failure.
- Corrected active cache documentation to SHA-256 content tokens and immutable
  content-hashed icon filenames.
- Passed updater contracts; API focused 58/58 and full 185/185 plus typecheck,
  build, and clean production audit; web focused 23/23 and full 57/57 plus
  typecheck, both builds, browser smoke, and clean production audit.
- Rebuilt byte-identical packages under umask 022 and 077 and passed the full
  aggregate plugin/package harness. Final package:
  SHA-256
  `4e9c53bf87fd566fd929c717273d0b636f12fa35e491defd718704965bd87575`,
  MD5 `aa19d0e84f83842285aa228efaecd380`, size 6,222,972 bytes.
- No deployment, workflow dispatch, release publication, or upstream draft
  mutation occurred. Independent reviewer approval remains pending.

### 2026-07-23 - Independent review 2 recovery follow-up

- Closed the pre-mutation recovery-directory leak from base `89081f5`.
  Apply/reset cleanup now covers every snapshot install, file sync,
  content/mode verification, transaction sync, and overlay sync failure.
- Successful preparation aborts retain zero directories. Cleanup failure
  instead preserves one mode-`0700` transaction and its bounded identifier
  with `rolledBack=false` through shell, API, and UI. Post-mutation retention
  is unchanged.
- Repeated fault evidence: `32` normal apply/reset attempts preserve exact
  source hashes/modes/readiness and retain zero directories; cleanup-removal
  faults retain one actionable directory and cleanup-plus-retry returns to
  zero.
- Gates: updater PASS; focused API `40/40`; focused settings `22/22`; full API
  `187/187`; full web `56/56`; both builds/typechecks, browser smoke,
  zero-vulnerability production audits, package verifier, and aggregate
  plugin/package harness PASS.
- Umask `022`/`077` artifacts are byte-identical at SHA-256
  `0f93751134d1e832e351c0f859ef3c96db83c6bfe164e8e070945fffd92f7cad`,
  MD5 `2de6a0dd2423c1f55aebb023dbc19522`, size `6,220,520` bytes, with
  `57` entries, no `./`, and `14` root-ID directories at `0755`.
- No deployment, workflow dispatch, release publication, or upstream draft
  mutation occurred. Independent reviewer approval remains pending.

### 2026-07-23 - Independent review 2 remediation

- Logger lifecycle evidence is now atomic mode `0600` and binds PID to start
  ticks, executable identity, and argv hash; every signal revalidates it, and a
  reused unrelated PID is never signaled.
- Apply and reset now preserve durable non-consumable snapshots before live
  changes. Restoration halts at the first fault, retains snapshots/surviving
  binaries, and cannot set `rolledBack=true` before exact binary, durability,
  and prior runtime readiness checks pass.
- Credential-only imports require an imported or existing valid URL. The UI
  blocks unconfigured rows with `URL required`; configured qBittorrent imports
  preserve explicit consent/decline semantics through the real codec.
- Stopped status checks ownership before config parsing, allowing malformed
  no-PID upgrade, event stop, and uninstall while retaining fail-closed
  unverified-live behavior.
- Gates: focused API `52/52`, focused web `21/21`, full API `184/184`, full web
  `55/55`, lifecycle/updater/aggregate/package contracts, both typechecks and
  builds, browser smoke, zero production audits, ShellCheck `16`, actionlint
  `2`, Python `2`, secret inventory, and diff hygiene pass.
- Deterministic umask `022`/`077` package:
  SHA-256 `0615f59bf6b68fe6a9bf9e490bca9996e3cb598c6c86663d83fd02cb301b0a67`,
  MD5 `f122fe0b41741664c6a8e6b4e57fb443`, `6,221,460` bytes, `57`
  entries, `43` files, `14` root:root mode-`0755` directories, no `./`, and
  `42` embedded payload files.
- No deployment, workflow dispatch, release publication, or upstream draft
  mutation occurred. Independent reviewer approval remains pending.
