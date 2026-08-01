use anyhow::{Result, bail};
use serde_json::json;
use std::collections::BTreeMap;

use super::{
    LIVE_AUTH_PORT, LIVE_OAUTH_PORT, LIVE_PORT, assertions, http, live_base_url, matrix, process,
    report,
};

pub(super) fn run_rest(report: &mut report::Report, yarr: &process::YarrProcess) -> Result<()> {
    let base = live_base_url();
    let mut server = yarr.start_server(LIVE_PORT)?;
    server.wait_healthy(&base)?;

    for (route, key) in [
        ("/health", "status"),
        ("/ready", "ready"),
        ("/status", "server"),
    ] {
        let (status, body) = http::get_text(&format!("{base}{route}"))?;
        if status != 200 || !body.contains(key) {
            bail!("GET {route} expected 200 and {key}, got {status}: {body}");
        }
        report.pass(format!("rest GET {route}"), format!("status={status}"));
    }

    let (status, _) = http::get_text(&format!("{base}/__yarr_live_missing_route__"))?;
    if status != 404 {
        bail!("missing route expected 404, got {status}");
    }
    report.pass("rest GET unknown route", "status=404");

    let token = "yarr-live-token";
    let auth_base = format!("http://127.0.0.1:{LIVE_AUTH_PORT}");
    let mut auth_env = BTreeMap::new();
    auth_env.insert("YARR_MCP_NO_AUTH".into(), "false".into());
    auth_env.insert("YARR_NOAUTH".into(), "false".into());
    auth_env.insert("YARR_MCP_AUTH_MODE".into(), "bearer".into());
    auth_env.insert("YARR_MCP_TOKEN".into(), token.into());
    let mut auth_server =
        yarr.start_server_args(&["serve", "mcp"], "0.0.0.0", LIVE_AUTH_PORT, &auth_env)?;
    auth_server.wait_healthy(&auth_base)?;
    let unauthorized = http::mcp_status(&auth_base, "tools/list", None, None)?;
    if unauthorized != 401 {
        bail!("missing bearer expected 401, got {unauthorized}");
    }
    report.pass(
        "rest mcp auth rejects missing bearer",
        "missing bearer rejected with 401",
    );
    let authorized = http::mcp_with_auth(&auth_base, "tools/list", None, 88, Some(token))?;
    if !authorized.to_string().contains("\"yarr\"") {
        bail!("authorized tools/list did not advertise the yarr tool: {authorized}");
    }
    report.pass(
        "rest mcp auth accepts bearer",
        "authorized tools/list succeeded",
    );

    let oauth_base = format!("http://127.0.0.1:{LIVE_OAUTH_PORT}");
    let mut oauth_env = BTreeMap::new();
    oauth_env.insert("YARR_MCP_NO_AUTH".into(), "false".into());
    oauth_env.insert("YARR_NOAUTH".into(), "false".into());
    oauth_env.insert("YARR_MCP_AUTH_MODE".into(), "oauth".into());
    oauth_env.insert("YARR_MCP_PUBLIC_URL".into(), oauth_base.clone());
    oauth_env.insert(
        "YARR_MCP_GOOGLE_CLIENT_ID".into(),
        "yarr-live-client".into(),
    );
    oauth_env.insert(
        "YARR_MCP_GOOGLE_CLIENT_SECRET".into(),
        "yarr-live-secret".into(),
    );
    oauth_env.insert(
        "YARR_MCP_AUTH_ADMIN_EMAIL".into(),
        "yarr-live@example.com".into(),
    );
    oauth_env.insert(
        "YARR_MCP_AUTH_SQLITE_PATH".into(),
        "target/live-full/tmp/oauth/auth.sqlite".into(),
    );
    oauth_env.insert(
        "YARR_MCP_AUTH_KEY_PATH".into(),
        "target/live-full/tmp/oauth/jwks.json".into(),
    );
    std::fs::create_dir_all("target/live-full/tmp/oauth")?;
    let mut oauth_server =
        yarr.start_server_args(&["serve", "mcp"], "0.0.0.0", LIVE_OAUTH_PORT, &oauth_env)?;
    oauth_server.wait_healthy(&oauth_base)?;
    let (auth_meta_status, auth_meta) = http::get_text(&format!(
        "{oauth_base}/mcp/.well-known/oauth-authorization-server"
    ))?;
    if auth_meta_status != 200 || !auth_meta.contains("authorization_endpoint") {
        bail!("OAuth authorization metadata failed: {auth_meta_status} {auth_meta}");
    }
    report.pass(
        "rest oauth authorization metadata",
        format!("status={auth_meta_status}"),
    );
    let (resource_meta_status, resource_meta) = http::get_text(&format!(
        "{oauth_base}/mcp/.well-known/oauth-protected-resource"
    ))?;
    if resource_meta_status != 200 || !resource_meta.contains("resource") {
        bail!("OAuth protected resource metadata failed: {resource_meta_status} {resource_meta}");
    }
    report.pass(
        "rest oauth protected resource metadata",
        format!("status={resource_meta_status}"),
    );
    Ok(())
}

pub(super) fn run_mcp(
    report: &mut report::Report,
    yarr: &process::YarrProcess,
    matrix: &matrix::Matrix,
) -> Result<()> {
    let base = live_base_url();
    let mut server = yarr.start_server(LIVE_PORT)?;
    server.wait_healthy(&base)?;

    check_mcp_handshake(report, &base)?;
    check_mcp_catalog(report, &base)?;
    check_mcp_error_paths(report, &base)?;
    check_mcp_yarr(report, &base, matrix)?;
    Ok(())
}

fn check_mcp_handshake(report: &mut report::Report, base: &str) -> Result<()> {
    let init = http::mcp(
        base,
        "initialize",
        Some(json!({
            "protocolVersion": "2025-11-25",
            "capabilities": {},
            "clientInfo": {"name": "yarr-live-test", "version": "1.0.0"}
        })),
        1,
    )?;
    assertions::assert_value(
        &init,
        &matrix::Expectation {
            json_path: Some("serverInfo.name".into()),
            equals: Some(json!("yarr")),
            equals_any: None,
            value_type: None,
            contains: None,
            xml_root: None,
        },
    )?;
    report.pass("mcp initialize", "yarr");

    let tools = http::mcp(base, "tools/list", None, 2)?;
    let tools_text = tools.to_string();
    if !tools_text.contains("\"yarr\"") {
        bail!("tools/list did not advertise the yarr tool: {tools}");
    }
    // The whole fleet is reached inside one Code Mode tool, not per-service tools.
    if tools_text.contains("\"sonarr\"") || tools_text.contains("\"radarr\"") {
        bail!(
            "tools/list unexpectedly advertised per-service tools (only yarr is published): {tools}"
        );
    }
    report.pass("mcp tools/list", "single yarr tool advertised");
    Ok(())
}

fn check_mcp_catalog(report: &mut report::Report, base: &str) -> Result<()> {
    let resources = http::mcp(base, "resources/list", None, 3)?;
    report.pass(
        "mcp resources/list",
        format!("{} bytes", resources.to_string().len()),
    );

    let schema = http::mcp(
        base,
        "resources/read",
        Some(json!({"uri":"yarr://schema/mcp-tool"})),
        33,
    )?;
    if !schema.to_string().contains("inputSchema") {
        bail!("resources/read schema did not include inputSchema: {schema}");
    }
    report.pass("mcp resources/read schema", "schema resource returned");

    let prompts = http::mcp(base, "prompts/list", None, 4)?;
    if !prompts.to_string().contains("quick_start") {
        bail!("prompts/list did not advertise quick_start: {prompts}");
    }
    report.pass("mcp prompts/list", "quick_start advertised");

    let quick_start = http::mcp(base, "prompts/get", Some(json!({"name":"quick_start"})), 5)?;
    assertions::assert_value(
        &quick_start,
        &matrix::Expectation {
            json_path: Some("messages".into()),
            equals: None,
            equals_any: None,
            value_type: Some("array".into()),
            contains: None,
            xml_root: None,
        },
    )?;
    report.pass("mcp prompts/get quick_start", "prompt returned messages");
    Ok(())
}

fn check_mcp_error_paths(report: &mut report::Report, base: &str) -> Result<()> {
    // `help` is reachable inside Code Mode via callTool; the envelope carries the result.
    let help = http::yarr(base, "async () => callTool('help')", 6)?;
    assertions::assert_value(
        &help["result"],
        &matrix::Expectation {
            json_path: Some("help".into()),
            equals: None,
            equals_any: None,
            value_type: Some("string".into()),
            contains: None,
            xml_root: None,
        },
    )?;
    report.pass("mcp tool help", "structured help returned via yarr");

    let unknown_tool = http::mcp(
        base,
        "tools/call",
        Some(json!({"name":"__yarr_live_missing_tool__","arguments":{}})),
        66,
    );
    let unknown_error = unknown_tool.expect_err("unknown MCP tool should fail");
    if !unknown_error.to_string().contains("execution_error") {
        bail!("unknown MCP tool produced unexpected error: {unknown_error}");
    }
    report.pass("mcp unknown tool error", "unknown tool rejected");

    // An api_get with no path is rejected by the app layer. An *uncaught* throw makes
    // the whole codemode call fail with a generic MCP error (detail lost), so the
    // script catches it and returns the detail in the envelope where we can assert it.
    let invalid = http::yarr(
        base,
        "async () => { try { await callTool('api_get', { service: 'sonarr' }); return { ok: true }; } \
         catch (e) { return { error: String(e) }; } }",
        67,
    )?;
    if !invalid.to_string().contains("path") {
        bail!("api_get validation error did not mention path: {invalid}");
    }
    report.pass("mcp api_get validation error", "missing path rejected");
    Ok(())
}

/// Exercise the MCP transport end-to-end through the single `yarr` tool: a
/// representative read that reaches upstream, and a write to a bad path whose
/// upstream error must surface through the Code Mode envelope. Full per-service
/// data assertions live in the `cli` and `contract` suites (which drive the same
/// service layer), so this proves the transport without duplicating the matrix.
fn check_mcp_yarr(report: &mut report::Report, base: &str, matrix: &matrix::Matrix) -> Result<()> {
    let service = matrix
        .services
        .first()
        .ok_or_else(|| anyhow::anyhow!("service matrix has no services"))?;

    let status = http::yarr(
        base,
        &format!("async () => {}.service_status()", service.name),
        100,
    )?;
    assertions::assert_value(&status["result"], &service.status)?;
    report.pass(
        format!("mcp yarr service_status {}", service.name),
        format!("semantic status matched over MCP ({})", service.kind),
    );

    // Writes run immediately (no confirm gate); a bad path must still reach upstream
    // and return the service-native error. The upstream error throws in the script,
    // so catch it and surface the detail in the envelope (an uncaught throw would
    // collapse to a generic MCP error and lose the service-native message).
    let code = format!(
        "async () => {{ try {{ return await api.{}.post({}, {}); }} catch (e) {{ return {{ error: String(e) }}; }} }}",
        service.name,
        serde_json::to_string(&service.post_expected_error.path)?,
        service.post_expected_error.body,
    );
    let envelope = http::yarr(base, &code, 200)?;
    assertions::assert_expected_error(
        &envelope.to_string(),
        &service.post_expected_error.error_contains_any,
    )?;
    report.pass(
        "mcp api_post confirmed upstream error",
        "yarr api.<service>.post reached upstream and returned the expected service error shape",
    );
    Ok(())
}
