//! xtask — Repo automation for yarr.
//!
//! Invoked via: `cargo xtask <command>`
//!
//! Commands:
//!   dist         Build release binary and copy it to bin/ (Git LFS tracked)
//!   ci           Run the required local equivalents of the GitHub CI jobs
//!   symlink-docs Create AGENTS.md and GEMINI.md symlinks next to every CLAUDE.md
//!   check-env    Validate required environment variables are set
//!   patterns     Check static contracts from docs/PATTERNS.md
//!   live         Run shart-only live tests against the real Yarr service stack
//!   shart        Manage the dedicated shart test stack
//!   tool-docs    Generate the tool/action/endpoint reference doc
//!
//! Add commands by adding arms to the match block below. Keep each command as a
//! separate `fn` or submodule for readability.
//!
//! Philosophy: xtask replaces ad-hoc shell scripts. It gets type-checked by the
//! compiler, works cross-platform, and is easy to extend. Keep functions small
//! and use `std::process::Command` to shell out to existing tools rather than
//! reimplementing them in Rust.

use anyhow::{Context, Result, bail};
use std::process::{Command, Stdio};
use walkdir::WalkDir;

mod ci;
mod gen_openapi;
mod live;
mod patterns;
mod shart;
mod skill_keys;
mod tool_docs;

fn main() -> Result<()> {
    // Cargo sets CARGO_MANIFEST_DIR for the workspace root when invoked as
    // `cargo xtask`. Change into the workspace root so all commands work
    // regardless of the cwd from which the user invoked cargo.
    //
    // This path navigation assumes xtask/ is a direct child of the workspace root.
    // If you restructure, adjust the `..` accordingly.
    let workspace_root = std::path::Path::new(env!("CARGO_MANIFEST_DIR"))
        .parent()
        .expect("xtask/Cargo.toml must have a parent directory");
    std::env::set_current_dir(workspace_root).context("Failed to change into workspace root")?;

    let args: Vec<String> = std::env::args().skip(1).collect();
    match args.first().map(String::as_str) {
        Some("dist") => dist(),
        Some("ci") => ci::run(),
        Some("symlink-docs") => symlink_docs(),
        Some("check-env") => check_env(),
        Some("gen-openapi") => gen_openapi::run(&args[1..]),
        Some("live") => live::run(&args[1..]),
        Some("shart") => shart::run(&args[1..]),
        Some("patterns") => patterns_cmd(&args[1..]),
        Some("tool-docs") => tool_docs::run(&args[1..]),
        Some("check-test-siblings") => check_test_siblings(),
        Some("skill-keys") => skill_keys::run(),
        Some("--help") | Some("-h") | Some("help") | None => {
            print_help();
            Ok(())
        }
        Some(unknown) => {
            bail!("Unknown xtask command: {unknown:?}\nRun `cargo xtask --help` for usage.")
        }
    }
}

// =============================================================================
// dist — Build release binary and copy to bin/
// =============================================================================

/// Build the release binary and copy it to `bin/` for Git LFS distribution.
///
/// The `bin/` directory is tracked via Git LFS (see .gitattributes). This lets
/// plugin users install the binary without needing a Rust toolchain — `install.sh`
/// downloads the LFS object directly.
///
/// After running `cargo xtask dist`:
///   1. Commit bin/yarr
///   2. Push — Git LFS uploads the binary automatically
fn dist() -> Result<()> {
    const BINARY_NAME: &str = "yarr";

    println!("==> Building release binary: {BINARY_NAME}");
    run_cargo(&["build", "--release", "--locked"])?;

    // Determine the target directory (respects CARGO_TARGET_DIR override).
    let target_dir = std::env::var("CARGO_TARGET_DIR").unwrap_or_else(|_| "target".into());

    let src = std::path::Path::new(&target_dir)
        .join("release")
        .join(BINARY_NAME);
    if !src.exists() {
        bail!("Release binary not found at {src:?} — build must have failed");
    }

    // Create bin/ and copy
    std::fs::create_dir_all("bin").context("Failed to create bin/")?;
    let dst = std::path::Path::new("bin").join(BINARY_NAME);
    std::fs::copy(&src, &dst).with_context(|| format!("Failed to copy {src:?} to {dst:?}"))?;

    // Set executable bit on Unix
    #[cfg(unix)]
    {
        use std::os::unix::fs::PermissionsExt;
        let mut perms = std::fs::metadata(&dst)?.permissions();
        perms.set_mode(0o755);
        std::fs::set_permissions(&dst, perms)?;
    }

    println!("==> Copied {src:?} → {dst:?}");
    println!(
        "==> Run `git add bin/{BINARY_NAME} && git commit -m 'chore: update binary'` to publish via LFS"
    );
    Ok(())
}

// =============================================================================
// check-test-siblings — Verify every src/*.rs has a sibling *_tests.rs
// =============================================================================

/// Walk `src/` and report any `.rs` file missing a sibling `{stem}_tests.rs`.
///
/// Files excluded from the check:
///   - Files whose name already ends in `_tests.rs` (they ARE the test sibling)
///   - `main.rs` and `lib.rs` (entry points with no business logic to unit-test)
///
/// Exits non-zero if any sibling is missing, so it can gate CI.
pub(crate) fn check_test_siblings() -> Result<()> {
    const EXEMPT: &[&str] = &["main.rs", "lib.rs"];

    let mut missing: Vec<std::path::PathBuf> = Vec::new();

    for entry in WalkDir::new("src")
        .into_iter()
        .filter_map(|e| e.ok())
        .filter(|e| e.file_type().is_file())
    {
        let path = entry.path();
        let name = match path.file_name().and_then(|n| n.to_str()) {
            Some(n) => n,
            None => continue,
        };

        if !name.ends_with(".rs") || name.ends_with("_tests.rs") || EXEMPT.contains(&name) {
            continue;
        }
        // Generated OpenAPI tables (`cargo xtask gen-openapi`) are pure data, not
        // hand-maintained modules — no per-module unit tests apply.
        if path.to_string_lossy().contains("openapi/generated") {
            continue;
        }

        let stem = name.strip_suffix(".rs").unwrap();
        let sibling = path.parent().unwrap().join(format!("{stem}_tests.rs"));

        if !sibling.exists() {
            missing.push(path.to_owned());
        }
    }

    // Reverse check: _tests.rs files with no corresponding source are orphans.
    let mut orphans: Vec<std::path::PathBuf> = Vec::new();
    for entry in WalkDir::new("src")
        .into_iter()
        .filter_map(|e| e.ok())
        .filter(|e| e.file_type().is_file())
    {
        let path = entry.path();
        let name = match path.file_name().and_then(|n| n.to_str()) {
            Some(n) => n,
            None => continue,
        };
        if !name.ends_with("_tests.rs") {
            continue;
        }
        let stem = name.strip_suffix("_tests.rs").unwrap();
        let source = path.parent().unwrap().join(format!("{stem}.rs"));
        if !source.exists() {
            orphans.push(path.to_owned());
        }
    }

    let ok = missing.is_empty() && orphans.is_empty();

    if !missing.is_empty() {
        println!(
            "==> check-test-siblings: missing _tests.rs siblings ({}):",
            missing.len()
        );
        for path in &missing {
            let stem = path.file_stem().unwrap().to_string_lossy();
            println!(
                "  MISSING  {}  (expected {}_tests.rs)",
                path.display(),
                stem
            );
        }
    }
    if !orphans.is_empty() {
        println!(
            "==> check-test-siblings: orphaned _tests.rs files ({}):",
            orphans.len()
        );
        for path in &orphans {
            println!("  ORPHAN   {}  (no matching source file)", path.display());
        }
    }
    if ok {
        println!("==> check-test-siblings: all source files have a _tests.rs sibling");
        return Ok(());
    }
    bail!("{} missing, {} orphaned", missing.len(), orphans.len());
}

// =============================================================================
// patterns — Check docs/PATTERNS.md contracts
// =============================================================================

fn patterns_cmd(args: &[String]) -> Result<()> {
    let mut options = patterns::PatternOptions::default();
    for arg in args {
        match arg.as_str() {
            "--strict" => options.strict = true,
            "--json" => options.json = true,
            "--help" | "-h" => {
                println!("Usage: cargo xtask patterns [--strict] [--json]");
                return Ok(());
            }
            unknown => bail!("Unknown patterns option: {unknown}"),
        }
    }
    patterns::run(options)
}

// =============================================================================
// symlink-docs — Create AGENTS.md + GEMINI.md symlinks next to every CLAUDE.md
// =============================================================================

/// Walk the repo and create sibling symlinks next to every CLAUDE.md found.
///
/// Pattern §32: CLAUDE.md is the single source of truth. AGENTS.md (Codex/OpenAI)
/// and GEMINI.md (Google) are symlinks so all AI systems read the same instructions.
///
/// This applies to ALL CLAUDE.md files in the repo, not just the root — nested
/// CLAUDE.md files in plugins/, xtask/, etc. all get symlinks.
///
/// Run after adding any new CLAUDE.md file:
///   cargo xtask symlink-docs
fn symlink_docs() -> Result<()> {
    let mut created = 0usize;
    let mut skipped = 0usize;

    // Walk the full repo, skipping .git/ and target/ (not real project dirs)
    for entry in WalkDir::new(".")
        .into_iter()
        .filter_entry(|e| {
            let name = e.file_name().to_string_lossy();
            // Skip .git and target — they're not repo source dirs
            !matches!(name.as_ref(), ".git" | "target")
        })
        .filter_map(|e| e.ok())
    {
        if entry.file_name() != "CLAUDE.md" {
            continue;
        }

        let claude_path = entry.path();
        let dir = claude_path
            .parent()
            .expect("CLAUDE.md must be inside a directory");

        // Create sibling symlinks: AGENTS.md → CLAUDE.md, GEMINI.md → CLAUDE.md
        // Both use a relative target so they remain valid after `git clone`.
        for link_name in ["AGENTS.md", "GEMINI.md"] {
            let link_path = dir.join(link_name);

            if link_path.exists() || link_path.symlink_metadata().is_ok() {
                // Already exists (or is a dangling symlink) — skip
                println!("  skip  {}", link_path.display());
                skipped += 1;
                continue;
            }

            // Symlink target is always relative: "CLAUDE.md" → sibling file
            #[cfg(unix)]
            std::os::unix::fs::symlink("CLAUDE.md", &link_path)
                .with_context(|| format!("Failed to create symlink at {}", link_path.display()))?;

            // Windows: create a file symlink (requires developer mode or admin)
            #[cfg(windows)]
            std::os::windows::fs::symlink_file("CLAUDE.md", &link_path).with_context(|| {
                format!(
                    "Failed to create symlink at {} (may need developer mode on Windows)",
                    link_path.display()
                )
            })?;

            println!("  link  {} → CLAUDE.md", link_path.display());
            created += 1;
        }
    }

    println!("==> symlink-docs: {created} created, {skipped} already present");
    Ok(())
}

// =============================================================================
// check-env — Validate required environment variables
// =============================================================================

/// Validate that all required environment variables are set and non-empty.
///
/// Run this to get a clear error message before starting the server, rather
/// than a cryptic runtime failure.
///
/// Variables listed as "optional" are checked for presence but not required —
/// the server will start without them but some features may be unavailable.
fn check_env() -> Result<()> {
    //   Format: (&str, &str)  →  (ENV_VAR_NAME, "description of what it's for")
    //
    // Yarr can boot without configured upstream services so local setup,
    // doctor, and plugin repair can run before credentials are available.
    const REQUIRED_VARS: &[(&str, &str)] = &[];

    const OPTIONAL_VARS: &[(&str, &str)] = &[
        (
            "YARR_MCP_TOKEN",
            "Static bearer token for /mcp (required in production; omit only in loopback dev mode)",
        ),
        (
            "YARR_MCP_HOST",
            "Bind host (default 0.0.0.0 — set to 127.0.0.1 for local-only)",
        ),
        ("YARR_MCP_PORT", "Bind port (default 40070)"),
        (
            "RUST_LOG",
            "Log filter (e.g. info,rmcp=warn — default: info in server mode, warn in stdio/cli)",
        ),
    ];

    let mut missing = Vec::new();

    println!("==> Checking required environment variables:");
    for &(var, desc) in REQUIRED_VARS {
        match std::env::var(var) {
            Ok(v) if !v.is_empty() => println!("  OK  {var}"),
            _ => {
                println!("  MISSING  {var}");
                println!("           {desc}");
                missing.push(var);
            }
        }
    }

    println!("\n==> Optional variables (missing = feature degraded, not error):");
    for &(var, desc) in OPTIONAL_VARS {
        match std::env::var(var) {
            Ok(v) if !v.is_empty() => println!("  set      {var} = {v}"),
            _ => println!("  unset    {var}  ({desc})"),
        }
    }

    if !missing.is_empty() {
        bail!(
            "\nMissing required environment variables: {}\n\
             Copy .env.yarr to .env and fill in the values.",
            missing.join(", ")
        );
    }

    println!("\n==> All required environment variables are set.");
    Ok(())
}

// =============================================================================
// Helpers
// =============================================================================

/// Run a `cargo` subcommand, forwarding stdout/stderr.
pub(crate) fn run_cargo(args: &[&str]) -> Result<()> {
    run_cmd("cargo", args)
}

/// Run an arbitrary command, forwarding stdout/stderr. Fails if exit code != 0.
pub(crate) fn run_cmd(program: &str, args: &[&str]) -> Result<()> {
    let status = Command::new(program)
        .args(args)
        .stdin(Stdio::null())
        .status()
        .with_context(|| format!("Failed to spawn `{program}`"))?;
    if !status.success() {
        bail!("`{program} {}` exited with status {status}", args.join(" "));
    }
    Ok(())
}

/// Run an arbitrary command and return stdout. Fails if exit code != 0.
pub(crate) fn run_cmd_output(program: &str, args: &[&str]) -> Result<String> {
    let output = Command::new(program)
        .args(args)
        .stdin(Stdio::null())
        .output()
        .with_context(|| format!("Failed to spawn `{program}`"))?;
    if !output.status.success() {
        bail!(
            "`{program} {}` exited with status {}",
            args.join(" "),
            output.status
        );
    }
    String::from_utf8(output.stdout)
        .with_context(|| format!("`{program}` emitted non-UTF-8 stdout"))
}

fn print_help() {
    // Update command descriptions as Yarr's xtask surface changes.
    eprintln!(
        "cargo xtask — repo automation for yarr

USAGE:
  cargo xtask <command>

COMMANDS:
  dist                  Build release binary and copy to bin/ (Git LFS)
  ci                    Run all CI checks: fmt, clippy, nextest, taplo, audit
  symlink-docs          Create AGENTS.md + GEMINI.md symlinks next to every CLAUDE.md
  check-env             Validate required environment variables are set
  check-test-siblings   Verify every src/*.rs has a sibling *_tests.rs
  live                  Run shart-only live tests (--suite guard|cli|rest|mcp|services|all)
  shart                 Manage the test stack (start|stop|status|seed)
  patterns              Check static contracts from docs/PATTERNS.md (--strict, --json)
  tool-docs             Generate docs/TOOLS_ACTIONS_ENDPOINTS.md (--check)
  help                  Show this help

ADDING COMMANDS:
  Add commands by extending the match block in xtask/src/main.rs.
  Keep dependencies minimal — xtask should compile in seconds."
    );
}

#[cfg(test)]
#[path = "live_tests.rs"]
mod live_tests;
