# Task 12 Phase A Brief: Full Local Verification

## Baseline

- Worktree: `/home/jmagar/workspace/yarr/.worktrees/yarr-unraid-plugin`
- Approved code base: `4786ebd036077c09a6bb72fa817630b720e59256`
- Plan: `docs/superpowers/plans/2026-07-22-yarr-unraid-plugin.md`
- Design: `docs/superpowers/specs/2026-07-22-yarr-unraid-plugin-design.md`
- Ledger: `.superpowers/sdd/progress.md`
- Bead: `rustarr-bhf`

## Ownership

This phase owns verification evidence and the Task 12 brief, report, and ledger entries only. It must not redesign or edit implementation files to hide failures. A failing gate remains failed until diagnosed and reported without weakening or bypassing it.

## Required Local Matrix

Run sequentially from a clean checkout at the approved baseline:

1. Root Rust formatting, check, test, and clippy gates applicable to this repository, with `SOLDR_BYPASS=1 CARGO_TIMINGS=0` and `--locked` where supported.
2. Aggregate Unraid contracts plus classic, lifecycle, updater, API activation, release, workflow, and negative/mutation contracts.
3. API locked install, 146-test suite, typecheck, production build, production dependency audit, and production staging checks.
4. Web locked install, 44-test suite, Vue typecheck, settings and dashboard custom-element builds, artifact/static-import checks, and browser smoke.
5. ShellCheck for all shell sources, actionlint for workflows, Python compilation, and structured workflow tests.
6. Independent classic package builds under umask `022` and `077`; prove they are byte-identical to each other and to the committed package; run `verify-package.sh`.
7. Verify manifest, PLG, and package checksum agreement; exact payload inventory, modes, path safety, source/package parity, and absence of secrets/default credentials.
8. Read-only confirmation that upstream `v2.1.0` remains an unpublished draft with exactly the two expected unchanged assets and digests.
9. Confirm no unexpected generated worktree dirt remains.

## Constraints

- Do not deploy to or access `tootie`.
- Do not dispatch GitHub workflows.
- Do not create, edit, publish, or otherwise mutate releases.
- Do not modify implementation files.
- Do not weaken a gate or accept a negative test for an unrelated failure.
- Record the absence of a Beads Dolt remote as non-fatal.

## Evidence and Completion

Write `.superpowers/sdd/task-12-report.md` with exact commands, exit results, test counts, package and upstream archive digests, current commit, cleanliness evidence, and residual live/GitHub gaps. Append the phase-A result to `.superpowers/sdd/progress.md` and comment `rustarr-bhf`.

Only if every gate passes, commit and push the Task 12 brief, report, and ledger changes. If any gate fails, do not claim completion and do not edit implementation to conceal it.
