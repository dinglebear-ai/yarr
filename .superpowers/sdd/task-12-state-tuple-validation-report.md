# Task 12 Same-Operation State-Tuple Validation Report

Date: 2026-07-23

Base: `1c75e6e9bdc275b24678619a910023fb47bff4e8`

## Finding

The closed updater protocol already bound operation, outcome, exit code,
rollback state, cleanup state, recovery identifier, and message class across
26 rows. Its same-operation state predicates were incomplete: several rows
could accept impossible installed/available/packaged version relations or
derived overlay/update/rollback booleans.

## Remediation

`UpdateService` now parses only the updater shell's canonical Yarr release
grammar:

```text
(0|[1-9][0-9]*).(0|[1-9][0-9]*).(0|[1-9][0-9]*)
```

Prerelease/build metadata, leading zeroes, omitted components, signs,
whitespace, and values outside the shell's signed 64-bit arithmetic domain are
rejected. Comparisons use integer tuples and cannot fall back to lexical or
floating-point ordering.

Every one of the 26 operation/outcome/exit rows is evaluated after these
shared deterministic invariants:

- installed and packaged versions are strict, non-null versions in the same
  supported major;
- available version is either the exact empty sentinel or a strict version in
  that same major;
- `updateAvailable` is true exactly when the available version is strictly
  newer than the installed version;
- no active overlay means installed version equals packaged version;
- rollback availability implies an active overlay;
- cleanup state and the bounded operation-prefixed recovery identifier remain
  an exact pair.

The row predicates then enforce:

- `CHECK_CURRENT` and `APPLY_CURRENT`: available equals installed and no update
  is advertised.
- `CHECK_UPDATE_AVAILABLE`: available is strictly newer than installed.
- `APPLY_UPDATED`: installed equals available, the overlay is active, and no
  update remains.
- `APPLY_FAILED_BEFORE_ACTIVATION` and `APPLY_RESTORED`: the requested
  available version remains strictly newer than the unchanged/restored active
  version.
- `APPLY_RESTORATION_INCOMPLETE`: a strict requested version is present and
  all derived state still agrees with the effective binary selected by the
  shell.
- `RESET_COMPLETED`: installed equals packaged, overlay is inactive, rollback
  is unavailable, and no available version is returned.
- Other reset rows return no available version while preserving the shared
  effective-state invariants; restored rows remain independently bound to
  `rolledBack=true`.
- `ROLLBACK_COMPLETED`: an overlay is active, the previous slot remains
  available for the reverse swap, no update version is returned, and the
  effective version remains in the packaged major.
- Rollback pre-activation/restored rows require both active and previous
  overlay slots; unavailable requires no rollback slot; incomplete
  restoration accepts only the shell-derived effective state.

Manual rollback intentionally permits swapping either direction within the
supported major. Therefore no active-versus-previous ordering is invented:
the deterministic postcondition visible in the protocol is active overlay
plus rollback availability, not "older than" or "newer than."

The Vue action state continues to consume only GraphQL fields returned after
this validator succeeds. No unvalidated shell state reaches GraphQL or UI.

## Contract Evidence

- Focused API updater suite: `62/62`.
- Full API suite: `209/209`; typecheck, production build, and production audit
  pass with zero vulnerabilities.
- Full web suite: `58/58`; Vue typecheck, settings/dashboard production builds,
  browser registration smoke, and production audit pass with zero
  vulnerabilities.
- Source protocol matrix: all `26` legitimate rows accepted and `748`
  impossible mutations rejected.
- Built API protocol matrix: all `26` legitimate rows accepted and `748`
  impossible mutations rejected.
- Candidate-staged and package-staged matrices: `1,496` impossible mutations
  rejected across each two-module invocation.
- The mutation generator covers all protocol-key nullability, operation and
  outcome substitution, flipped exit/rollback/cleanup/update fields, cleanup
  identifiers, message class, version grammar/bounds/major/order, package
  selection, overlay, rollback availability, current/update equality, apply
  commit equality, and reset package selection.
- Aggregate lifecycle/updater/classic/workflow/release/package harness: pass.
- Package verifier: pass against exact source and archive bytes/modes.
- ShellCheck at repository error severity, strict ShellCheck and `bash -n` on
  changed shell files, `actionlint`, secret sentinel, and `git diff --check`:
  pass.

## Deterministic Package

Builds under umask `022` and `077` are byte-identical:

- File: `yarr-2.1.0-x86_64-1.txz`
- SHA-256:
  `abd1e4d28418309fb3c056bb03637c34292969603ccc092c2c6754e1d7d72406`
- MD5: `6602d3e9bde7786723b659296b597ae3`
- Size: `6,225,000` bytes
- Archive entries: `57`
- Declared payload files: `42`
- Directories: `14`, all UID/GID `0/0` and mode `0755`
- Archive root member `./`: absent

No host deployment, workflow dispatch, release publication, or upstream draft
asset mutation occurred. Independent review approval is not claimed.
