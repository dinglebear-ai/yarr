use anyhow::Result;
use std::{fs, path::Path};
use walkdir::WalkDir;

use super::{
    reporter::PatternReporter,
    util::{
        contains_top_level_json_key, display_path, effective_loc, is_test_file, read_file,
        size_limit,
    },
};

const REQUIRED_PATTERN_FILES: &[&str] = &[
    "src/yarr.rs",
    "src/app.rs",
    "src/actions.rs",
    "src/mcp.rs",
    "src/mcp/tools.rs",
    "src/mcp/schemas.rs",
    "src/mcp/rmcp_server.rs",
    "src/server/routes.rs",
    "src/mcp/prompts.rs",
    "src/config.rs",
    "src/cli.rs",
    "src/main.rs",
    "src/lib.rs",
    "tests/tool_dispatch.rs",
    "config.yarr.toml",
    "taplo.toml",
    "lefthook.yml",
    "install.sh",
    "server.json",
];

const FORBIDDEN_SHIM_TOKENS: &[&str] = &[
    "reqwest::",
    "hyper::Client",
    "sqlx::",
    "rusqlite::",
    "tokio::fs",
    "std::fs",
    "std::process::Command",
    "Command::new",
];

pub(super) fn required_files(reporter: &mut PatternReporter) {
    let missing = REQUIRED_PATTERN_FILES
        .iter()
        .copied()
        .filter(|path| !Path::new(path).is_file())
        .collect::<Vec<_>>();

    if missing.is_empty() {
        reporter.ok(
            "required-files",
            format!("{} expected files present", REQUIRED_PATTERN_FILES.len()),
        );
    } else {
        reporter.fail(
            "required-files",
            format!("missing pattern files: {}", missing.join(", ")),
        );
    }
}

pub(super) fn no_mod_rs(reporter: &mut PatternReporter) {
    let mod_files = WalkDir::new(".")
        .into_iter()
        .filter_entry(|entry| {
            let name = entry.file_name().to_string_lossy();
            !matches!(name.as_ref(), ".git" | "target")
        })
        .filter_map(|entry| entry.ok())
        .filter(|entry| entry.file_type().is_file() && entry.file_name() == "mod.rs")
        .map(|entry| display_path(entry.path()))
        .collect::<Vec<_>>();

    if mod_files.is_empty() {
        reporter.ok("modern-rust", "no mod.rs files found");
    } else {
        reporter.fail(
            "modern-rust",
            format!("mod.rs files are prohibited: {}", mod_files.join(", ")),
        );
    }
}

pub(super) fn file_sizes(reporter: &mut PatternReporter) -> Result<()> {
    let output = crate::run_cmd_output("git", &["ls-files", "*.rs", "*.ts", "*.tsx"])?;
    let mut warnings = Vec::new();
    let mut failures = Vec::new();

    for line in output.lines().filter(|line| !line.trim().is_empty()) {
        let path = Path::new(line);
        if !path.exists() {
            continue;
        }
        if is_test_file(path) {
            continue;
        }
        let Some(limit) = size_limit(path) else {
            continue;
        };
        let loc = effective_loc(path)?;
        if loc > limit * 2 {
            failures.push(format!(
                "{}: {loc} effective lines (hard limit {})",
                display_path(path),
                limit * 2
            ));
        } else if loc > limit {
            warnings.push(format!(
                "{}: {loc} effective lines (target {limit})",
                display_path(path)
            ));
        }
    }

    if !failures.is_empty() {
        reporter.fail(
            "file-size",
            format!(
                "module size hard-limit violation(s): {}",
                failures.join("; ")
            ),
        );
    }
    if !warnings.is_empty() {
        reporter.warn(
            "file-size",
            format!(
                "above PATTERNS.md target; split opportunistically: {}. Hint: move unrelated UI, CLI, or handler concerns into focused modules.",
                warnings.join("; ")
            ),
        );
    }
    if failures.is_empty() && warnings.is_empty() {
        reporter.ok(
            "file-size",
            "source files are within PATTERNS.md size targets",
        );
    }
    Ok(())
}

pub(super) fn thin_shims(reporter: &mut PatternReporter) {
    let policies = [
        (
            "src/mcp/tools.rs",
            &["state.service", "execute_service_action"][..],
            FORBIDDEN_SHIM_TOKENS,
        ),
        (
            "src/cli.rs",
            &["YarrService::new", "service."][..],
            &["reqwest::", "hyper::Client", "sqlx::", "rusqlite::"][..],
        ),
    ];

    for (path, required, forbidden) in policies {
        let text = read_file(path);
        let missing = required
            .iter()
            .copied()
            .filter(|token| !text.contains(token))
            .collect::<Vec<_>>();
        let found_forbidden = forbidden
            .iter()
            .copied()
            .filter(|token| text.contains(token))
            .collect::<Vec<_>>();

        if !missing.is_empty() {
            reporter.warn(
                "thin-shim",
                format!(
                    "{path} does not contain expected delegation token(s): {}. Hint: shims should parse inputs and delegate to YarrService.",
                    missing.join(", ")
                ),
            );
        }
        if !found_forbidden.is_empty() {
            reporter.fail(
                "thin-shim",
                format!(
                    "{path} contains forbidden implementation token(s): {}. Hint: move network, filesystem, and business logic into service/client layers.",
                    found_forbidden.join(", ")
                ),
            );
        }
        if missing.is_empty() && found_forbidden.is_empty() {
            reporter.ok("thin-shim", format!("{path} looks like a delegation shim"));
        }
    }
}

pub(super) fn routes(reporter: &mut PatternReporter) {
    let routes = read_file("src/server/routes.rs");
    let missing = ["\"/mcp\"", "\"/health\"", "\"/status\""]
        .iter()
        .copied()
        .filter(|route| !routes.contains(route))
        .collect::<Vec<_>>();

    if missing.is_empty() {
        reporter.ok("routes", "MCP, health, and status routes are wired");
    } else {
        reporter.fail(
            "routes",
            format!("missing expected HTTP route(s): {}", missing.join(", ")),
        );
    }
}

pub(super) fn plugins(reporter: &mut PatternReporter) {
    let manifests = WalkDir::new("plugins")
        .into_iter()
        .filter_map(|entry| entry.ok())
        .filter(|entry| entry.file_type().is_file() && entry.file_name() == "plugin.json")
        .map(|entry| entry.into_path())
        .collect::<Vec<_>>();

    let failures = manifests
        .iter()
        .filter_map(|manifest| {
            let text = fs::read_to_string(manifest).ok()?;
            contains_top_level_json_key(&text, "version").then(|| {
                format!(
                    "{} contains forbidden version field",
                    display_path(manifest)
                )
            })
        })
        .collect::<Vec<_>>();

    if failures.is_empty() {
        reporter.ok(
            "plugins",
            format!("{} plugin manifest(s) omit version", manifests.len()),
        );
    } else {
        reporter.fail("plugins", failures.join("; "));
    }

    let hooks = read_file("plugins/yarr/hooks/hooks.json");
    let setup_command = "${CLAUDE_PLUGIN_ROOT}/scripts/plugin-setup.sh";
    if hooks.contains(setup_command)
        && Path::new("plugins/yarr/scripts/plugin-setup.sh").is_file()
        && !Path::new("plugins/yarr/bin/yarr").exists()
    {
        reporter.ok(
            "plugins",
            "plugin setup hook uses the safe local script and ships no binary",
        );
    } else {
        reporter.fail(
            "plugins",
            "yarr hooks must run `${CLAUDE_PLUGIN_ROOT}/scripts/plugin-setup.sh` and ship no bundled binary",
        );
    }
}

pub(super) fn config_and_auth(reporter: &mut PatternReporter) {
    let gitignore = read_file(".gitignore");
    if gitignore.contains(".env") {
        reporter.ok("config", ".env is ignored");
    } else {
        reporter.fail("config", ".gitignore should ignore .env secrets");
    }

    let server = read_file("src/server.rs");
    let config = read_file("src/config.rs");
    if !server.contains("LoopbackDev") || !server.contains("Mounted") {
        reporter.fail(
            "auth",
            "AuthPolicy should include LoopbackDev and Mounted states",
        );
    } else if !config.contains("no_auth") || !config.contains("allowed_hosts") {
        reporter.warn(
            "auth",
            "config.rs may be missing no_auth/allowed_hosts policy wiring. Hint: keep bind/auth safety checks centralized in config/server setup.",
        );
    } else {
        reporter.ok("auth", "auth policy states and config toggles are present");
    }
}

pub(super) fn tooling(reporter: &mut PatternReporter) {
    let lefthook = read_file("lefthook.yml");
    let taplo = read_file("taplo.toml");
    let mut missing = Vec::new();

    // Check that the scripts CI relies on for enforcement actually exist.
    // Checking scripts rather than Justfile targets means this passes even when
    // the Justfile is restructured, and fails when a script is accidentally deleted.
    for script in [
        "scripts/check-schema-docs.py",
        "scripts/validate-plugin-layout.sh",
        "scripts/test-template-features.sh",
    ] {
        if !Path::new(script).is_file() {
            missing.push(script.to_string());
        }
    }

    if !lefthook.contains("taplo check") {
        missing.push("lefthook.yml:taplo check".to_string());
    }
    if !taplo.contains("column_width") {
        missing.push("taplo.toml:formatting".to_string());
    }

    if missing.is_empty() {
        reporter.ok(
            "tooling",
            "CI enforcement scripts, lefthook, and taplo config are present",
        );
    } else {
        reporter.fail(
            "tooling",
            format!(
                "missing expected tooling component(s): {}",
                missing.join(", ")
            ),
        );
    }
}
