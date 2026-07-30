---
title: "Rust Build Setup"
created: 2026-05-22
updated: 2026-07-30
---

---
title: "Rust Build Setup"
doc_type: "guide"
status: "active"
owner: "yarr"
audience:
  - "contributors"
  - "agents"
scope: "service"
source_of_truth: false
upstream_refs:
  - "https://github.com/dinglebear-ai/soma/blob/main/docs/RUST.md"
last_reviewed: "2026-07-30"
---

# Rust Build Setup

This repo follows the build conventions of the rmcp server family. The
canonical reference is [soma/docs/RUST.md](https://github.com/dinglebear-ai/soma/blob/main/docs/RUST.md).

All family repos share a common Cargo configuration model: heavy lifting lives
in `~/.cargo/config.toml` on the developer's machine; per-repo
`.cargo/config.toml` files are kept minimal and contain only what the global
config cannot express (xtask alias, repo-specific linker overrides).

---

## System prerequisites

| Tool | Purpose | Install |
|------|---------|---------|
| Rust 1.97.1 | Compiler | `rustup toolchain install 1.97.1 --component rustfmt,clippy` |
| `clang` | Linker driver for the mold integration | `apt install clang` |
| `mold` | High-speed linker; 5-10× faster than GNU `ld` on Linux | `apt install mold` |
| `mingw-w64` | Cross-compiler for `x86_64-pc-windows-gnu` targets | `apt install mingw-w64` |
| `just` | Command runner (optional, but used by all Justfile recipes) | `cargo install just` |

`clang` and `mold` are required for fast Linux incremental builds. Without
them the global config falls back to the system linker; builds still work but
link times are significantly slower on large dependency graphs.

`mingw-w64` is only needed for local Windows cross-compilation. CI installs
it automatically.

---

## Global Cargo config (`~/.cargo/config.toml`)

All family repos assume the following global configuration on the developer's
machine. **This file is not committed to any repo** — it lives only in
`~/.cargo/config.toml`.

```toml
# kache is enabled globally through Cargo's standard rustc-wrapper setting.
# Keep dev incremental disabled so compiler outputs remain cacheable.

[build]
jobs = 12
rustc-wrapper = "kache"

[target.x86_64-unknown-linux-gnu]
linker = "clang"
rustflags = ["-C", "link-arg=-fuse-ld=mold"]

[target.x86_64-pc-windows-gnu]
linker = "x86_64-w64-mingw32-gcc"

[profile.dev]
debug = 0
codegen-units = 256
split-debuginfo = "off"
incremental = false
opt-level = 0

[profile.test]
debug = 0
codegen-units = 256

[profile.dev.package."*"]
opt-level = 0
```

### Why mold?

`mold` replaces GNU `ld` as the linker for Linux builds. On large Rust
workspaces with many crates and dependencies, the link step dominates
incremental rebuild times. `mold` is typically 5–10× faster than `ld` and
2–3× faster than `lld`.

The global `[target.x86_64-unknown-linux-gnu]` block activates it via
`-fuse-ld=mold`. All family repos inherit this automatically — no per-repo
config is needed. **Do not add `rustflags` to `[target.x86_64-unknown-linux-gnu]`
in a per-repo config** — that would replace, not extend, the global rustflags
and silently drop the mold flag.

### Why kache globally?

The host-level Cargo config enables `kache` once through Cargo's supported
`rustc-wrapper` hook. Kache provides a fail-open, content-addressed compiler
cache across worktrees without a repository-local Cargo wrapper. Use
`KACHE_DISABLED=1 cargo ...` or `RUSTC_WRAPPER="" cargo ...` for a true
passthrough, and use `kache stats` to verify cache health.

### Profile settings rationale

| Setting | Value | Rationale |
|---------|-------|-----------|
| `profile.dev.debug` | `1` | Line tables only — enough for backtraces, without the 3× binary-size penalty of full DWARF |
| `profile.dev.codegen-units` | `8` | Parallelises compilation within a crate; 8 balances parallelism and optimisation quality |
| `profile.dev.split-debuginfo` | `"unpacked"` | Keeps debug info in separate `.dwo` files, reducing link-step memory pressure |
| `profile.dev.incremental` | `false` | Keeps dev artifacts cacheable by sccache across repos and worktrees |
| `profile.dev.opt-level` | `0` | No optimisation for the crate under active development |
| `profile.dev.package."*".opt-level` | `1` | Light optimisation for dependencies — prevents debug-only slowness in heavy crates like `serde` and `tokio` |
| `profile.test.debug` | `1` | Same as dev — enough for test failure backtraces |
| `profile.test.codegen-units` | `8` | Same rationale as dev |

---

## Per-repo `.cargo/config.toml`

Each family repo has a minimal `.cargo/config.toml`. The rule is: **only put
settings here that the global config cannot provide**.

### What belongs here

```toml
[alias]
# Required if the repo has an xtask/ crate.
xtask = "run --package xtask --"

[target.x86_64-pc-windows-gnu]
# Only if the repo cross-compiles for Windows and the global config may not
# be present (e.g. in CI without the standard global config).
linker = "x86_64-w64-mingw32-gcc"
```

### What does NOT belong here

| Setting | Reason to keep it in the global config |
|---------|---------------------------------------|
| Profile settings (`debug`, `codegen-units`, etc.) | Already set globally; duplicating causes confusion when the global changes |
| `build.jobs` | Machine-specific; the global config tunes it per host |
| `[target.x86_64-unknown-linux-gnu].rustflags` | Overriding this drops the mold flag from the global config |
| `build.rustc-wrapper` for generic artifact sync | Generic repos must use explicit sync commands; hidden post-compile copies do not belong in Cargo config |

### Repos without an xtask crate

Repos without an `xtask/` crate either omit `.cargo/config.toml` entirely or
keep only documented repo-specific overrides.

---

## Repo-specific overrides

Some repos intentionally diverge from the global config for documented reasons:

| Repo | Override | Reason |
|------|----------|--------|
| `axon` | repo-local `build.rustc-wrapper` | Automatically refreshes the actively used local `axon` binary and named repo artifacts after successful bin builds |
| `cortex` | repo-local `build.rustc-wrapper` and `build.target-dir = ".cache/cargo"` | Release-only local binary refresh plus a non-root target directory for Docker bind mounts |
| `lab` | repo-local `build.rustc-wrapper` | Keeps the active `labby` binary fresh for the local gateway/operator workflow |

If you add a new legitimate per-repo override, document it in the repo's
`docs/RUST.md` and add a row to this table in Soma's `docs/RUST.md`.

---

## Windows cross-compilation

Repos that publish Windows binaries configure the mingw linker. The global
`~/.cargo/config.toml` already sets this; per-repo configs set it as a
fallback for CI environments that may not have the standard global config.

```toml
[target.x86_64-pc-windows-gnu]
linker = "x86_64-w64-mingw32-gcc"
```

Add the Windows target if it is not already installed:

```bash
rustup target add x86_64-pc-windows-gnu
```

Install the cross-compiler on Debian/Ubuntu build hosts:

```bash
apt install mingw-w64
```

---

## Quick verification

Run these after cloning to confirm the build environment is correctly wired:

```bash
# Verify mold is in use (should show "mold" in the link invocation)
cargo build -v 2>&1 | grep "link-arg"

# Verify the xtask alias works (if the repo has xtask/)
cargo xtask --help

# Verify Windows cross-compile target is installed
rustup target list --installed | grep windows-gnu
```
