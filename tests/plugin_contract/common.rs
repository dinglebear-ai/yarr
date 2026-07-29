use serde_json::Value;
use std::{fs, path::Path, process::Command};

#[cfg(unix)]
use std::os::unix::fs::PermissionsExt;

pub(super) fn read(path: &str) -> String {
    fs::read_to_string(path).unwrap_or_else(|err| panic!("failed to read {path}: {err}"))
}

pub(super) fn json(path: &str) -> Value {
    serde_json::from_str(&read(path)).unwrap_or_else(|err| panic!("failed to parse {path}: {err}"))
}

pub(super) fn package_version() -> String {
    json("packages/yarr-mcp/package.json")["version"]
        .as_str()
        .expect("npm package version should be a string")
        .to_owned()
}

pub(super) fn yarr_bin() -> &'static str {
    env!("CARGO_BIN_EXE_yarr")
}

pub(super) fn setup_command(data_dir: &Path) -> Command {
    let mut cmd = Command::new(yarr_bin());
    cmd.env_clear()
        .env("HOME", data_dir)
        .env("PATH", std::env::var("PATH").unwrap_or_default())
        .env("YARR_HOME", data_dir)
        .env("YARR_SERVICES", "sonarr")
        .env("YARR_SONARR_KIND", "sonarr")
        .env("YARR_SONARR_URL", "https://api.yarr.test")
        .env("YARR_SONARR_API_KEY", "yarr-secret")
        .env("YARR_MCP_PORT", "0")
        .env("YARR_MCP_TOKEN", "mcp-secret")
        .env("YARR_MCP_STATIC_TOKEN_SCOPES", "yarr:read")
        .env("YARR_MCP_TOOL_MODE", "flat");
    cmd
}

pub(super) fn assert_private_file(path: &Path) {
    #[cfg(unix)]
    assert_eq!(
        fs::metadata(path).unwrap().permissions().mode() & 0o777,
        0o600
    );
}
