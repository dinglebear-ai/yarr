use anyhow::{Result, bail};
use serde_json::{Value, json};
use std::collections::BTreeMap;
use std::path::Path;
use std::time::Duration;

use super::{
    LIVE_PORT, LIVE_SERVE_DEFAULT_PORT, LIVE_SERVE_MCP_PORT, assertions, live_base_url, matrix,
    process, report,
};

pub(super) fn run(
    report: &mut report::Report,
    yarr: &process::YarrProcess,
    matrix: &matrix::Matrix,
) -> Result<()> {
    check_version_and_help(report, yarr)?;
    check_doctor(report, yarr)?;
    check_service_matrix(report, yarr, matrix)?;
    check_setup_commands(report, yarr)?;
    check_error_paths(report, yarr)?;
    check_lifecycles(report, yarr)?;
    Ok(())
}

fn check_version_and_help(report: &mut report::Report, yarr: &process::YarrProcess) -> Result<()> {
    let version = yarr.output(&["--version"])?;
    let version_text = String::from_utf8_lossy(&version.stdout);
    if !version.status.success() || !version_text.to_ascii_lowercase().contains("yarr") {
        bail!("--version failed or did not mention yarr: {version_text}");
    }
    report.pass("cli --version", version_text.trim());

    let help = yarr.output(&["--help"])?;
    let help_text = format!(
        "{}{}",
        String::from_utf8_lossy(&help.stdout),
        String::from_utf8_lossy(&help.stderr)
    );
    if !help.status.success() || !help_text.contains("Usage:") {
        bail!("--help did not print usage");
    }
    report.pass("cli --help", "usage printed");

    let help_json = yarr.json(&["help"])?;
    assertions::assert_value(
        &help_json,
        &matrix::Expectation {
            json_path: Some("actions".into()),
            equals: None,
            equals_any: None,
            value_type: Some("array".into()),
            contains: None,
            xml_root: None,
        },
    )?;
    report.pass("cli help action", "structured help contains actions");
    Ok(())
}

fn check_doctor(report: &mut report::Report, yarr: &process::YarrProcess) -> Result<()> {
    // Service configuration is validated per-service by `check_service_matrix`
    // (each `status` call fails for an unconfigured service); the removed
    // `integrations` action no longer exists to enumerate them up front.
    let doctor = yarr.output(&["doctor", "--json"])?;
    if !doctor.status.success() {
        bail!(
            "doctor --json failed: {}",
            String::from_utf8_lossy(&doctor.stderr)
        );
    }
    let doctor_json: Value = serde_json::from_slice(&doctor.stdout)?;
    let doctor_checks = doctor_json.as_array().ok_or_else(|| {
        anyhow::anyhow!("doctor --json did not return a check array: {doctor_json}")
    })?;
    if doctor_checks.is_empty() {
        bail!("doctor --json returned no checks");
    }
    let failed: Vec<_> = doctor_checks
        .iter()
        .filter(|check| check.get("ok").and_then(Value::as_bool) != Some(true))
        .collect();
    if !failed.is_empty() {
        bail!("doctor --json reported failed checks: {failed:?}");
    }
    report.pass(
        "cli doctor --json",
        format!("{} checks passed", doctor_checks.len()),
    );
    Ok(())
}

fn check_service_matrix(
    report: &mut report::Report,
    yarr: &process::YarrProcess,
    matrix: &matrix::Matrix,
) -> Result<()> {
    for service in &matrix.services {
        let status = yarr.json(&[&service.name, "status"])?;
        assertions::assert_value(&status, &service.status)?;
        report.pass(
            format!("cli status {}", service.name),
            format!("semantic status matched ({})", service.kind),
        );

        for get_case in &service.get {
            let payload = yarr.json(&[&service.name, "get", "--path", &get_case.path])?;
            assertions::assert_value(&payload, &get_case.expectation)?;
            report.pass(
                format!("cli get {} {}", service.name, get_case.path),
                "semantic GET matched",
            );
        }

        let body = service.post_expected_error.body.to_string();
        let output = yarr.output(&[
            &service.name,
            "post",
            "--path",
            &service.post_expected_error.path,
            "--body",
            &body,
        ])?;
        let combined = format!(
            "{}{}",
            String::from_utf8_lossy(&output.stdout),
            String::from_utf8_lossy(&output.stderr)
        );
        assertions::assert_expected_error(
            &combined,
            &service.post_expected_error.error_contains_any,
        )?;
        report.pass(
            format!("cli post upstream error {}", service.name),
            "api_post reached upstream and returned the expected service error shape",
        );
    }
    Ok(())
}

fn check_setup_commands(report: &mut report::Report, yarr: &process::YarrProcess) -> Result<()> {
    let setup_check = yarr.output(&["setup", "check"])?;
    report.pass(
        "cli setup check",
        format!("exit={}", setup_check.status.code().unwrap_or(-1)),
    );

    let setup_hook = yarr.output(&["setup", "plugin-hook", "--no-repair"])?;
    report.pass(
        "cli setup plugin-hook --no-repair",
        format!("exit={}", setup_hook.status.code().unwrap_or(-1)),
    );

    let setup_env = isolated_setup_env("setup-repair")?;
    let setup_repair = yarr.output_with_env(&["setup", "repair"], &setup_env)?;
    if !setup_repair.status.success() {
        bail!(
            "setup repair failed: {}",
            String::from_utf8_lossy(&setup_repair.stderr)
        );
    }
    report.pass("cli setup repair", "isolated appdata repaired");

    let install_env = isolated_setup_env("setup-install")?;
    let setup_install = yarr.output_with_env(&["setup", "install"], &install_env)?;
    if !setup_install.status.success() {
        bail!(
            "setup install failed: {}",
            String::from_utf8_lossy(&setup_install.stderr)
        );
    }
    let installed = Path::new("target/live-full/tmp/setup-install/home/.local/bin/yarr");
    if !installed.is_file() {
        bail!(
            "setup install did not copy binary to {}",
            installed.display()
        );
    }
    report.pass("cli setup install", installed.display().to_string());
    Ok(())
}

fn check_error_paths(report: &mut report::Report, yarr: &process::YarrProcess) -> Result<()> {
    let unknown = yarr.output(&["__yarr_live_unknown__"])?;
    if unknown.status.success() {
        bail!("unknown command unexpectedly succeeded");
    }
    let unknown_text = format!(
        "{}{}",
        String::from_utf8_lossy(&unknown.stdout),
        String::from_utf8_lossy(&unknown.stderr)
    );
    if !unknown_text
        .to_ascii_lowercase()
        .contains("unknown command")
    {
        bail!("unknown command did not produce expected error: {unknown_text}");
    }
    report.pass("cli unknown command error", "unknown command rejected");

    let invalid_watch = yarr.output(&["watch", "--interval", "0"])?;
    if invalid_watch.status.success() {
        bail!("watch --interval 0 unexpectedly succeeded");
    }
    let invalid_watch_text = format!(
        "{}{}",
        String::from_utf8_lossy(&invalid_watch.stdout),
        String::from_utf8_lossy(&invalid_watch.stderr)
    );
    if !invalid_watch_text.contains("positive integer") {
        bail!("invalid watch interval did not produce expected error: {invalid_watch_text}");
    }
    report.pass(
        "cli parser rejects invalid watch interval",
        "watch --interval 0 rejected",
    );
    Ok(())
}

fn check_lifecycles(report: &mut report::Report, yarr: &process::YarrProcess) -> Result<()> {
    let default_base = format!("http://127.0.0.1:{LIVE_SERVE_DEFAULT_PORT}");
    let mut default_server =
        yarr.start_server_args(&[], "127.0.0.1", LIVE_SERVE_DEFAULT_PORT, &BTreeMap::new())?;
    default_server.wait_healthy(&default_base)?;
    report.pass(
        "cli serve default lifecycle",
        "default serve became healthy",
    );

    let serve_mcp_base = format!("http://127.0.0.1:{LIVE_SERVE_MCP_PORT}");
    let mut serve_mcp_server = yarr.start_server_args(
        &["serve", "mcp"],
        "127.0.0.1",
        LIVE_SERVE_MCP_PORT,
        &BTreeMap::new(),
    )?;
    serve_mcp_server.wait_healthy(&serve_mcp_base)?;
    report.pass("cli serve mcp lifecycle", "serve mcp became healthy");

    check_stdio_mcp(report, yarr)?;
    check_watch(report, yarr)
}

fn check_stdio_mcp(report: &mut report::Report, yarr: &process::YarrProcess) -> Result<()> {
    let init_line = "{\"jsonrpc\":\"2.0\",\"id\":1,\"method\":\"initialize\",\"params\":{\"protocolVersion\":\"2025-11-25\",\"capabilities\":{},\"clientInfo\":{\"name\":\"yarr-live-stdio\",\"version\":\"1\"}}}\n";
    let stdio = yarr.output_with_stdin(&["mcp"], init_line, Duration::from_secs(5))?;
    if !stdio.status.success() {
        bail!(
            "stdio mcp initialize failed: {}",
            String::from_utf8_lossy(&stdio.stderr)
        );
    }
    let stdio_json: Value = serde_json::from_slice(&stdio.stdout)?;
    assertions::assert_value(
        &stdio_json,
        &matrix::Expectation {
            json_path: Some("result.serverInfo.name".into()),
            equals: Some(json!("yarr")),
            equals_any: None,
            value_type: None,
            contains: None,
            xml_root: None,
        },
    )?;
    report.pass("cli mcp stdio initialize", "yarr initialized over stdio");
    Ok(())
}

fn check_watch(report: &mut report::Report, yarr: &process::YarrProcess) -> Result<()> {
    let base = live_base_url();
    let mut server = yarr.start_server(LIVE_PORT)?;
    server.wait_healthy(&base)?;
    let watch = yarr.output_until_timeout(
        &["watch", "--url", &base, "--interval", "1"],
        Duration::from_secs(3),
    )?;
    let watch_text = String::from_utf8_lossy(&watch.stdout);
    if !watch_text.contains("[yarr] UP") {
        bail!("watch did not emit initial UP line: {watch_text}");
    }
    report.pass("cli watch", "initial UP line emitted");
    Ok(())
}

fn isolated_setup_env(name: &str) -> Result<BTreeMap<String, String>> {
    let root = Path::new("target/live-full/tmp").join(name);
    if root.exists() {
        std::fs::remove_dir_all(&root)?;
    }
    let home = root.join("home");
    let yarr_home = root.join("yarr-home");
    std::fs::create_dir_all(&home)?;
    let mut env = BTreeMap::new();
    env.insert("HOME".into(), home.display().to_string());
    env.insert("YARR_HOME".into(), yarr_home.display().to_string());
    env.insert("YARR_MCP_PORT".into(), "0".into());
    env.insert("YARR_MCP_NO_AUTH".into(), "true".into());
    Ok(env)
}
