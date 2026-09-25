use super::*;
pub(super) fn run_chunk(
    yarr: &process::YarrProcess,
    svc: &str,
    spec: &Spec,
    calls: &[PreparedCall],
    no_destructive: bool,
) -> Vec<RunOut> {
    let (server, base) = match start_isolated_server(yarr, no_destructive) {
        Ok(server) => server,
        Err(err) => {
            let detail = format!("failed to start isolated MCP server: {err}");
            return calls
                .iter()
                .map(|call| {
                    (
                        call.op,
                        op_result(call.op, "rejected", detail.clone()),
                        None,
                    )
                })
                .collect();
        }
    };
    let _server = server;
    run_chunk_on_base(&base, svc, spec, calls)
}

pub(super) fn start_isolated_server(
    yarr: &process::YarrProcess,
    no_destructive: bool,
) -> Result<(process::Server, String)> {
    let mut env = BTreeMap::new();
    env.insert("YARR_MCP_NO_AUTH".into(), "true".into());
    env.insert("YARR_NOAUTH".into(), "false".into());
    env.insert("YARR_HTTP_TIMEOUT_SECS".into(), "20".into());
    if !no_destructive {
        env.insert("YARR_ALLOW_DESTRUCTIVE".into(), "true".into());
    }

    let mut last_error = None;
    for attempt in 1..=2 {
        let port = reserve_local_port()?;
        let base = format!("http://127.0.0.1:{port}");
        match yarr.start_server_args(&["serve", "mcp"], "127.0.0.1", port, &env) {
            Ok(mut server) => match server.wait_healthy(&base) {
                Ok(()) => return Ok((server, base)),
                Err(err) => {
                    last_error = Some(err);
                    drop(server);
                }
            },
            Err(err) => last_error = Some(err),
        }
        if attempt == 1 {
            std::thread::sleep(std::time::Duration::from_millis(1000));
        }
    }
    Err(last_error.expect("start attempts always record an error"))
}

pub(super) fn run_chunk_on_base(
    base: &str,
    svc: &str,
    spec: &Spec,
    calls: &[PreparedCall],
) -> Vec<RunOut> {
    let mut last_error = None;
    for attempt in 1..=MCPORTER_ATTEMPTS {
        match invoke_chunk(base, svc, calls) {
            Ok(values) => return classify_chunk(spec, calls, values),
            Err(err) => {
                let detail = err.to_string();
                if attempt < MCPORTER_ATTEMPTS && contract::is_retryable_contract_error(&detail) {
                    last_error = Some(detail);
                    std::thread::sleep(std::time::Duration::from_millis(750));
                    continue;
                }
                let prior = if attempt > 1 {
                    last_error
                        .map(|e| format!("; previous retryable error: {e}"))
                        .unwrap_or_default()
                } else {
                    String::new()
                };
                let detail = format!("mcporter batch failed: {detail}{prior}");
                if calls.len() > 1 && should_split_failed_batch(&detail) {
                    let mid = calls.len() / 2;
                    let mut split = run_chunk_on_base(base, svc, spec, &calls[..mid]);
                    split.extend(run_chunk_on_base(base, svc, spec, &calls[mid..]));
                    return split;
                }
                return calls
                    .iter()
                    .map(|call| {
                        (
                            call.op,
                            op_result(call.op, "rejected", detail.clone()),
                            None,
                        )
                    })
                    .collect();
            }
        }
    }
    unreachable!("mcporter invoke loop always returns")
}

pub(super) fn log_chunk_progress(svc: &str, calls: &[PreparedCall], attempt: usize, phase: &str) {
    let names = calls
        .iter()
        .map(|call| call.op.name)
        .collect::<Vec<_>>()
        .join(",");
    eprintln!("mcporter {svc} attempt {attempt} {phase}: {names}");
}

pub(super) fn rejected_calls(calls: &[PreparedCall], detail: String) -> Vec<RunOut> {
    calls
        .iter()
        .map(|call| {
            (
                call.op,
                op_result(call.op, "rejected", detail.clone()),
                None,
            )
        })
        .collect()
}

pub(super) fn is_transport_restart_error(detail: &str) -> bool {
    detail.contains("exit status: 124")
        || detail.contains("signal: 9")
        || detail.contains("mcporter output was not JSON")
        || detail.contains("mcporter result did not include artifact")
        || detail.contains("response body read failed")
}

pub(super) fn should_split_failed_batch(detail: &str) -> bool {
    detail.contains("length limit exceeded")
        || detail.contains("exit status: 124")
        || detail.contains("signal: 9")
        || detail.contains("mcporter output was not JSON")
        || detail.contains("mcporter result did not include artifact")
}

pub(super) fn invoke_chunk(base: &str, svc: &str, calls: &[PreparedCall]) -> Result<Vec<Value>> {
    let code = batch_code(svc, calls)?;
    let payload = serde_json::to_string(&json!({ "code": code }))?;
    let url = format!("{base}/mcp");
    let output = mcporter_output(&[
        "--kill-after=5s",
        MCPORTER_TIMEOUT,
        "mcporter",
        "call",
        "--http-url",
        &url,
        "--allow-http",
        "yarr",
        "--args",
        &payload,
        "--output",
        "text",
    ])?;
    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        let stdout = String::from_utf8_lossy(&output.stdout);
        bail!(
            "mcporter exited with {}; stderr: {}; stdout: {}",
            output.status,
            preview(stderr.trim()),
            preview(stdout.trim())
        );
    }

    let stdout = String::from_utf8_lossy(&output.stdout);
    let trimmed = stdout.trim();
    let value: Value = serde_json::from_str(trimmed)
        .with_context(|| format!("mcporter output was not JSON: {}", preview(trimmed)))?;
    let run_id = value
        .get("artifactsRunId")
        .and_then(Value::as_str)
        .context("mcporter output did not include artifactsRunId")?;
    let artifact_path = operation_artifact_candidate(&value)
        .and_then(Value::as_str)
        .with_context(|| format!("mcporter result did not include artifact path: {trimmed}"))?;
    let full_path = std::path::Path::new(guard::SHART_HOME)
        .join("codemode/artifacts")
        .join(run_id)
        .join(artifact_path);
    eprintln!("mcporter artifact read: {}", full_path.display());
    let raw = std::fs::read_to_string(&full_path)
        .with_context(|| format!("read mcporter result artifact {}", full_path.display()))?;
    eprintln!("mcporter artifact parse: {}", full_path.display());
    let array: Vec<Value> = serde_json::from_str(&raw)
        .with_context(|| format!("parse mcporter result artifact {}", full_path.display()))?;
    Ok(array)
}

pub(super) fn operation_artifact_candidate(value: &Value) -> Option<&Value> {
    let mut result = value;
    for _ in 0..4 {
        if let Some(path) = result
            .pointer("/artifact/path")
            .or_else(|| result.get("artifact"))
        {
            return Some(path);
        }
        let next = result.get("result")?;
        result = next;
    }
    None
}

pub(super) fn batch_code(svc: &str, calls: &[PreparedCall]) -> Result<String> {
    let mut code = String::from("async () => {\n  const out = [];\n");
    for call in calls {
        let args = serde_json::to_string(&call.args)?;
        let report_args =
            serde_json::to_string(&redact_sensitive_value(&Value::Object(call.args.clone())))?;
        if matches!(svc, "prowlarr" | "sonarr") && is_tag_resource_op(call.op.name) {
            code.push_str(&format!(
                "  try {{ const label = {:?} + '-' + Date.now(); const seed = await {}.post_tag({{ body: {{ label }} }}); const callArgs = {}; callArgs.id = seed.id; if (callArgs.body && typeof callArgs.body === 'object' && !Array.isArray(callArgs.body)) {{ callArgs.body.id = seed.id; callArgs.body.label = label + '-updated'; }} out.push({{ name: {:?}, args: callArgs, ok: true, value: await {}.{}(callArgs) }}); }} catch (e) {{ out.push({{ name: {:?}, args: {}, ok: false, error: String(e) }}); }}\n",
                format!("yarr-live-{}", call.op.name.replace('_', "-")),
                svc,
                args,
                call.op.name,
                svc,
                call.op.name,
                call.op.name,
                report_args
            ));
        } else {
            code.push_str(&format!(
                "  try {{ out.push({{ name: {:?}, args: {}, ok: true, value: await {}.{}({}) }}); }} catch (e) {{ out.push({{ name: {:?}, args: {}, ok: false, error: String(e) }}); }}\n",
                call.op.name, report_args, svc, call.op.name, args, call.op.name, report_args
            ));
        }
    }
    let artifact = format!(
        "live-mcporter/{}-{}-{}.json",
        svc,
        calls.first().map(|call| call.op.name).unwrap_or("empty"),
        calls.len()
    );
    code.push_str(&format!(
        "  const artifact = writeArtifact({}, JSON.stringify(out), {{ contentType: 'application/json' }});\n  return {{ artifact: artifact.path }};\n}}",
        serde_json::to_string(&artifact)?
    ));
    Ok(code)
}

pub(super) fn is_tag_resource_op(name: &str) -> bool {
    matches!(
        name,
        "get_tag_by_id" | "get_tag_detail_by_id" | "put_tag_by_id" | "delete_tag_by_id"
    )
}

pub(super) fn is_empty_body_sentinel(value: &Value) -> bool {
    matches!(
        value,
        Value::Object(map)
            if map.len() == 2
                && map.get("ok") == Some(&Value::Bool(true))
                && map.get("status").is_some_and(Value::is_number)
    )
}

pub(super) fn op_result(
    op: &OperationSpec,
    outcome: &'static str,
    detail: String,
) -> contract::OpResult {
    contract::OpResult {
        name: op.name,
        method: op.method.as_str(),
        path: op.path,
        outcome,
        detail,
        args: None,
    }
}

pub(super) fn op_result_with_args(
    op: &OperationSpec,
    outcome: &'static str,
    detail: String,
    args: &Map<String, Value>,
) -> contract::OpResult {
    contract::OpResult {
        name: op.name,
        method: op.method.as_str(),
        path: op.path,
        outcome,
        detail,
        args: Some(redact_sensitive_value(&Value::Object(args.clone()))),
    }
}

pub(super) fn redact_sensitive_value(value: &Value) -> Value {
    match value {
        Value::Object(map) => Value::Object(
            map.iter()
                .map(|(key, value)| {
                    if is_sensitive_key(key) {
                        (key.clone(), Value::String("<redacted>".into()))
                    } else {
                        (key.clone(), redact_sensitive_value(value))
                    }
                })
                .collect(),
        ),
        Value::Array(values) => Value::Array(values.iter().map(redact_sensitive_value).collect()),
        other => other.clone(),
    }
}

pub(super) fn is_sensitive_key(key: &str) -> bool {
    let key = key.to_ascii_lowercase();
    key.contains("apikey")
        || key.contains("api_key")
        || key.contains("token")
        || key.contains("password")
        || key.contains("secret")
}

pub(super) fn ensure_mcporter_available() -> Result<()> {
    let output = Command::new("mcporter")
        .arg("--version")
        .output()
        .context("mcporter is required for `cargo xtask live --suite mcporter`")?;
    if !output.status.success() {
        bail!(
            "mcporter is required for `cargo xtask live --suite mcporter`: {}",
            String::from_utf8_lossy(&output.stderr).trim()
        );
    }
    Ok(())
}

pub(super) fn write_detail(svc: &str, results: &[contract::OpResult]) -> Result<()> {
    let dir = std::path::Path::new("target/live-full");
    std::fs::create_dir_all(dir)?;
    let path = dir.join(format!("mcporter-contract-{svc}.json"));
    std::fs::write(&path, serde_json::to_string_pretty(results)?)
        .with_context(|| format!("write {}", path.display()))?;
    Ok(())
}

pub(super) fn preview(raw: &str) -> String {
    raw.chars().take(240).collect()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn batch_failures_split_only_for_transport_artifact_limits() {
        assert!(should_split_failed_batch(
            "mcporter batch failed: Streamable HTTP error: length limit exceeded"
        ));
        assert!(should_split_failed_batch(
            "mcporter batch failed: mcporter output was not JSON"
        ));
        assert!(!should_split_failed_batch(
            "mcporter batch failed: Error: sonarr returned HTTP 400"
        ));
    }
}
