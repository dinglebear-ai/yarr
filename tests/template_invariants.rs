use serde_json::Value;
use std::{fs, os::unix::fs::PermissionsExt, path::Path};

fn read(path: &str) -> String {
    fs::read_to_string(path).unwrap_or_else(|err| panic!("failed to read {path}: {err}"))
}

/// Concatenate `src/actions.rs` plus every `*.rs` under `src/actions/` so action
/// name assertions survive the facade split.
fn read_actions_tree() -> String {
    let mut combined = read("src/actions.rs");
    let dir = Path::new("src/actions");
    if dir.is_dir() {
        let mut entries: Vec<_> = fs::read_dir(dir)
            .unwrap_or_else(|err| panic!("failed to read src/actions/: {err}"))
            .filter_map(Result::ok)
            .map(|e| e.path())
            .filter(|p| p.extension().is_some_and(|ext| ext == "rs"))
            .collect();
        entries.sort();
        for path in entries {
            combined.push('\n');
            combined.push_str(&read(path.to_str().expect("utf8 path")));
        }
    }
    combined
}

fn json(path: &str) -> Value {
    serde_json::from_str(&read(path)).unwrap_or_else(|err| panic!("failed to parse {path}: {err}"))
}

#[test]
fn agent_memory_files_are_claude_symlinks() {
    for path in ["AGENTS.md", "GEMINI.md"] {
        let target = fs::read_link(path).unwrap_or_else(|err| panic!("{path}: {err}"));
        assert_eq!(
            target,
            Path::new("CLAUDE.md"),
            "{path} should link to CLAUDE.md"
        );
    }
    for path in ["plugins/yarr/AGENTS.md", "plugins/yarr/GEMINI.md"] {
        let target = fs::read_link(path).unwrap_or_else(|err| panic!("{path}: {err}"));
        assert_eq!(
            target,
            Path::new("CLAUDE.md"),
            "{path} should link to CLAUDE.md"
        );
    }
    for path in ["docs/AGENTS.md", "docs/GEMINI.md"] {
        let target = fs::read_link(path).unwrap_or_else(|err| panic!("{path}: {err}"));
        assert_eq!(
            target,
            Path::new("CLAUDE.md"),
            "{path} should link to CLAUDE.md"
        );
    }
}

#[test]
fn portable_scripts_are_executable_and_documented() {
    let docs = read("scripts/README.md");
    for path in [
        "scripts/check-dependency-updates.sh",
        "scripts/check-file-size.sh",
        "scripts/asciicheck.py",
        "scripts/check-blob-size.py",
        "scripts/check-runtime-current.sh",
        "scripts/validate-plugin-layout.sh",
        "scripts/test-mcp-auth.sh",
        "scripts/pre-release-check.sh",
        "scripts/test-template-features.sh",
        "scripts/check-schema-docs.py",
        "scripts/check-coupled-files.sh",
        "scripts/live-read-smoke.sh",
    ] {
        let metadata = fs::metadata(path).unwrap_or_else(|err| panic!("{path}: {err}"));
        assert!(
            metadata.permissions().mode() & 0o111 != 0,
            "{path} should be executable"
        );
        let basename = Path::new(path).file_name().unwrap().to_string_lossy();
        assert!(
            docs.contains(basename.as_ref()),
            "scripts/README.md should document {basename}"
        );
    }
}

#[test]
fn justfile_exposes_repo_automation_and_defers_tool_ownership_to_global_mise() {
    let justfile = read("Justfile");
    for recipe in [
        "install-hooks:",
        "uninstall-hooks:",
        "deps-check:",
        "blob-size-check:",
        "coupled-files-check:",
        "ascii-check:",
        "ascii-fix:",
        "file-size-check:",
        "schema-docs:",
        "schema-docs-check:",
        "template-features:",
        "template-check:",
        "test-cov:",
        "watch:",
        "runtime-current:",
        "auth-smoke:",
        "pre-release:",
        "up:",
        "down:",
        "release:",
    ] {
        assert!(justfile.contains(recipe), "Justfile missing {recipe}");
    }
    for removed in ["install-tools:", "bootstrap:"] {
        assert!(
            !justfile.contains(removed),
            "{removed} must stay removed; the global mise config owns tool installation"
        );
    }
    assert!(
        justfile.contains("from mise"),
        "tool-dependent recipes should identify global mise as their provider"
    );
}

#[test]
fn plugin_manifests_do_not_have_version_fields() {
    for path in [
        "plugins/yarr/.claude-plugin/plugin.json",
        "plugins/yarr/.codex-plugin/plugin.json",
        "plugins/yarr/gemini-extension.json",
    ] {
        let manifest = json(path);
        assert!(
            !manifest.as_object().unwrap().contains_key("version"),
            "{path} must not contain a version field"
        );
    }
}

#[test]
fn registry_and_deploy_metadata_are_yarr_specific() {
    let server = json("server.json");
    assert_eq!(server["name"], "ai.dinglebear/yarr-mcp");
    assert_eq!(
        server["description"],
        "MCP server and CLI for self-hosted media fleets: Sonarr, Radarr, Prowlarr, Bazarr, Tautulli, Overseerr, SABnzbd, qBittorrent, Plex, Jellyfin, and Tracearr."
    );

    for path in [
        "server.json",
        "install.sh",
        "docker-compose.prod.yml",
        ".env.example",
        "config.example.toml",
    ] {
        let text = read(path);
        for placeholder in [
            "TEMPLATE: Replace",
            "your-org",
            "yourdomain.com",
            "myservice",
            "YARR_API_URL",
            "YARR_API_KEY",
        ] {
            assert!(
                !text.contains(placeholder),
                "{path} still contains placeholder `{placeholder}`"
            );
        }
    }
}

#[test]
fn schema_contract_doc_tracks_known_actions() {
    let doc = read("docs/MCP_SCHEMA.md");
    // Action name strings now live in the `src/actions/` submodules (registry.rs),
    // with `src/actions.rs` reduced to a re-export facade. Scan the whole tree.
    let actions = read_actions_tree();
    let schemas = read("src/mcp/schemas.rs");
    for action in ["service_status", "api_get", "api_post", "help"] {
        assert!(actions.contains(action), "actions tree missing {action}");
        assert!(
            doc.contains(&format!("`{action}`")),
            "schema doc missing {action}"
        );
    }
    assert!(
        schemas.contains("action_names()"),
        "schemas.rs should derive action enum from action metadata"
    );
}
