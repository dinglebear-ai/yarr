use std::collections::{HashMap, HashSet};

use serde_json::Value;

use super::common::{json, package_version};

fn expected_npx_args() -> Value {
    serde_json::json!(["-y", format!("yarr-mcp@{}", package_version()), "mcp"])
}

#[test]
fn plugin_manifests_exist_for_all_supported_hosts() {
    for path in [
        "plugins/yarr/.claude-plugin/plugin.json",
        "plugins/yarr/.codex-plugin/plugin.json",
        "plugins/yarr/gemini-extension.json",
        "plugins/yarr/hooks/hooks.json",
        "plugins/yarr/skills/yarr/SKILL.md",
        "plugins/yarr/.mcp.json",
        "plugins/yarr/scripts/plugin-setup.sh",
    ] {
        assert!(std::path::Path::new(path).exists(), "{path} should exist");
    }
}

#[test]
fn mcp_json_uses_the_pinned_npm_stdio_launcher() {
    let mcp = json("plugins/yarr/.mcp.json");
    let server = &mcp["mcpServers"]["yarr"];

    assert_eq!(server["type"], "stdio");
    assert_eq!(server["command"], "npx");
    assert_eq!(server["args"], expected_npx_args());

    let env = server["env"].as_object().unwrap();
    for (env_var, user_config_key) in [
        ("YARR_SERVICES", "yarr_services"),
        ("YARR_SONARR_URL", "sonarr_url"),
        ("YARR_SONARR_API_KEY", "sonarr_api_key"),
        ("YARR_RADARR_URL", "radarr_url"),
        ("YARR_RADARR_API_KEY", "radarr_api_key"),
        ("YARR_PROWLARR_URL", "prowlarr_url"),
        ("YARR_PROWLARR_API_KEY", "prowlarr_api_key"),
        ("YARR_OVERSEERR_URL", "overseerr_url"),
        ("YARR_OVERSEERR_API_KEY", "overseerr_api_key"),
        ("YARR_JELLYFIN_URL", "jellyfin_url"),
        ("YARR_JELLYFIN_API_KEY", "jellyfin_api_key"),
        ("YARR_PLEX_URL", "plex_url"),
        ("YARR_PLEX_TOKEN", "plex_token"),
        ("YARR_QBITTORRENT_URL", "qbittorrent_url"),
        ("YARR_QBITTORRENT_USERNAME", "qbittorrent_username"),
        ("YARR_QBITTORRENT_PASSWORD", "qbittorrent_password"),
        ("YARR_SABNZBD_URL", "sabnzbd_url"),
        ("YARR_SABNZBD_API_KEY", "sabnzbd_api_key"),
        ("YARR_TAUTULLI_URL", "tautulli_url"),
        ("YARR_TAUTULLI_API_KEY", "tautulli_api_key"),
        ("YARR_TRACEARR_URL", "tracearr_url"),
        ("YARR_TRACEARR_API_KEY", "tracearr_api_key"),
        ("YARR_BAZARR_URL", "bazarr_url"),
        ("YARR_BAZARR_API_KEY", "bazarr_api_key"),
    ] {
        let expected = format!("${{user_config.{user_config_key}}}");
        assert_eq!(
            env.get(env_var).and_then(Value::as_str),
            Some(expected.as_str()),
            "env[{env_var}] should substitute user_config.{user_config_key}"
        );
    }

    let claude = json("plugins/yarr/.claude-plugin/plugin.json");
    let user_config = claude["userConfig"].as_object().unwrap();
    for value in env.values() {
        let value = value.as_str().unwrap();
        let key = value
            .strip_prefix("${user_config.")
            .and_then(|rest| rest.strip_suffix('}'))
            .unwrap_or_else(|| panic!("unexpected env value shape: {value}"));
        assert!(
            user_config.contains_key(key),
            ".mcp.json references undeclared user_config.{key}"
        );
    }
}

#[test]
fn plugin_manifests_share_identity_and_connection_settings() {
    let claude = json("plugins/yarr/.claude-plugin/plugin.json");
    let codex = json("plugins/yarr/.codex-plugin/plugin.json");
    let gemini = json("plugins/yarr/gemini-extension.json");

    assert_eq!(claude["name"], "yarr");
    assert_eq!(codex["name"], "yarr-mcp");
    assert_eq!(gemini["name"], "yarr-mcp");
    for manifest in [&claude, &codex, &gemini] {
        assert!(manifest["repository"].as_str().unwrap().ends_with("yarr"));
    }

    let user_config = claude["userConfig"].as_object().unwrap();
    let gemini_settings = gemini["settings"]
        .as_array()
        .unwrap()
        .iter()
        .map(|setting| setting["name"].as_str().unwrap())
        .collect::<Vec<_>>();
    for key in [
        "server_url",
        "api_token",
        "static_token_scopes",
        "tool_mode",
        "yarr_services",
        "sonarr_url",
        "sonarr_api_key",
        "radarr_url",
        "radarr_api_key",
    ] {
        assert!(
            user_config.contains_key(key),
            "Claude userConfig missing {key}"
        );
        assert!(
            gemini_settings.contains(&key),
            "Gemini settings missing {key}"
        );
    }

    assert!(claude.get("mcpServers").is_none());
    assert!(codex.get("mcpServers").is_none());
}

#[test]
fn gemini_extension_uses_the_same_pinned_npm_stdio_launcher() {
    let gemini = json("plugins/yarr/gemini-extension.json");
    let server = &gemini["mcpServers"]["yarr"];
    assert_eq!(server["command"], "npx");
    assert_eq!(server["args"], expected_npx_args());

    let env = server["env"].as_object().unwrap();
    let env_vars_by_setting = gemini["settings"]
        .as_array()
        .unwrap()
        .iter()
        .filter_map(|setting| Some((setting["name"].as_str()?, setting.get("envVar")?.as_str()?)))
        .collect::<HashMap<_, _>>();
    for var in env.keys() {
        assert_eq!(
            env.get(var).and_then(Value::as_str),
            Some(format!("${var}").as_str())
        );
        assert!(env_vars_by_setting.values().any(|value| *value == var));
    }

    let mcp = json("plugins/yarr/.mcp.json");
    let claude_vars = mcp["mcpServers"]["yarr"]["env"]
        .as_object()
        .unwrap()
        .keys()
        .map(String::as_str)
        .collect::<HashSet<_>>();
    let gemini_vars = env.keys().map(String::as_str).collect::<HashSet<_>>();
    assert_eq!(claude_vars, gemini_vars);
}

#[test]
fn claude_hooks_run_the_safe_local_setup_script_without_a_bundled_binary() {
    let hooks = json("plugins/yarr/hooks/hooks.json");
    let setup = std::path::Path::new("plugins/yarr/scripts/plugin-setup.sh");
    assert!(setup.is_file(), "plugin setup script must be tracked");
    #[cfg(unix)]
    {
        use std::os::unix::fs::PermissionsExt;
        assert_ne!(
            std::fs::metadata(setup).unwrap().permissions().mode() & 0o111,
            0
        );
    }
    assert!(!std::path::Path::new("plugins/yarr/bin/yarr").exists());

    for hook_name in ["SessionStart", "ConfigChange"] {
        let command = hooks["hooks"][hook_name][0]["hooks"][0]["command"]
            .as_str()
            .unwrap();
        assert_eq!(command, "${CLAUDE_PLUGIN_ROOT}/scripts/plugin-setup.sh");
        assert!(!command.contains("systemctl"));
        assert!(!command.contains("docker compose"));
    }
}
