//! Engine harness tests — drive `run` directly with a mock tool caller (no tokio,
//! no real services).

use std::time::{Duration, Instant};

use super::{ArtifactWriter, EmbedCaller, EngineLimits, ToolCaller, run};
use crate::codemode::build_preamble;

fn limits(ttl: Duration) -> EngineLimits {
    EngineLimits {
        memory_bytes: 64 * 1024 * 1024,
        stack_bytes: 512 * 1024,
        deadline: Instant::now() + ttl,
    }
}

/// A mock caller that echoes the action id + params back as a JSON object.
fn echo_caller() -> ToolCaller {
    Box::new(|id: &str, params_json: &str| {
        Ok(format!(r#"{{"echo":"{id}","params":{params_json}}}"#))
    })
}

/// A no-op artifact writer for tests that don't exercise `writeArtifact`.
fn no_write() -> ArtifactWriter {
    Box::new(|_path, _content, _opts| Err("artifacts disabled in this test".to_string()))
}

/// A no-op embed bridge for tests that don't exercise semantic search — always
/// returns an empty scores object, exactly what a disabled/unreachable TEI
/// would produce (see `EmbedCaller`'s "never Err" contract).
fn no_embed() -> EmbedCaller {
    Box::new(|_query| Ok("{}".to_string()))
}

#[test]
fn plain_expression_returns_value() {
    let out = run(
        "async () => 6 * 7",
        &build_preamble(&[]),
        &limits(Duration::from_secs(5)),
        echo_caller(),
        no_write(),
        no_embed(),
        None,
    )
    .unwrap();
    assert_eq!(out.result, serde_json::json!(42));
}

#[test]
fn calltool_round_trips_through_on_call() {
    let code = r#"
        async () => {
            const a = await callTool("list", { service: "sonarr" });
            const b = await callTool("service_status", { service: "radarr" });
            return { first: a.echo, second: b.echo, viaParams: a.params.service };
        }
    "#;
    let out = run(
        code,
        &build_preamble(&[]),
        &limits(Duration::from_secs(5)),
        echo_caller(),
        no_write(),
        no_embed(),
        None,
    )
    .unwrap();
    assert_eq!(out.result["first"], "list");
    assert_eq!(out.result["second"], "service_status");
    assert_eq!(out.result["viaParams"], "sonarr");
}

#[test]
fn fleet_inventory_and_map_capture_are_available_in_javascript() {
    let services = vec![
        ("plex_b".to_owned(), crate::config::ServiceKind::Plex),
        ("sonarr".to_owned(), crate::config::ServiceKind::Sonarr),
        ("plex_a".to_owned(), crate::config::ServiceKind::Plex),
    ];
    let out = run(
        r#"async () => ({
            names: fleet.of("plex"),
            all: fleet.all(),
            mapped: await fleet.map("plex", s => s.get_sessions({ limit: 2 }))
        })"#,
        &build_preamble(&services),
        &limits(Duration::from_secs(5)),
        echo_caller(),
        no_write(),
        no_embed(),
        None,
    )
    .unwrap();
    assert_eq!(out.result["names"], serde_json::json!(["plex_a", "plex_b"]));
    assert_eq!(out.result["all"][0]["name"], "plex_a");
    assert_eq!(out.result["mapped"]["echo"], "__fleet_map");
    assert_eq!(out.result["mapped"]["params"]["kind"], "plex");
    assert_eq!(out.result["mapped"]["params"]["method"], "get_sessions");
    assert_eq!(out.result["mapped"]["params"]["args"]["limit"], 2);
}

#[test]
fn console_output_is_captured() {
    let code = r#"async () => { console.log("hello", 1); console.error("boom"); return "ok"; }"#;
    let out = run(
        code,
        &build_preamble(&[]),
        &limits(Duration::from_secs(5)),
        echo_caller(),
        no_write(),
        no_embed(),
        None,
    )
    .unwrap();
    assert_eq!(out.result, serde_json::json!("ok"));
    assert_eq!(
        out.logs,
        vec!["hello 1".to_string(), "ERROR boom".to_string()]
    );
}

#[test]
fn thrown_tool_error_surfaces_as_err() {
    let failing: ToolCaller = Box::new(|_id, _params| Err("upstream exploded".to_string()));
    let code =
        r#"async () => { await callTool("list", { service: "sonarr" }); return "unreachable"; }"#;
    let err = run(
        code,
        &build_preamble(&[]),
        &limits(Duration::from_secs(5)),
        failing,
        no_write(),
        no_embed(),
        None,
    )
    .unwrap_err();
    assert!(err.contains("upstream exploded"), "got: {err}");
}

#[test]
fn script_throw_surfaces_as_err() {
    let code = r#"async () => { throw new Error("nope"); }"#;
    let err = run(
        code,
        &build_preamble(&[]),
        &limits(Duration::from_secs(5)),
        echo_caller(),
        no_write(),
        no_embed(),
        None,
    )
    .unwrap_err();
    assert!(err.contains("nope"), "got: {err}");
}

#[test]
fn write_artifact_round_trips_through_on_write() {
    let code = r#"async () => {
        const r = await writeArtifact("out/report.json", JSON.stringify({ ok: true }), { contentType: "application/json" });
        return r;
    }"#;
    // Capturing writer: echoes a receipt for whatever it's handed.
    let writer: ArtifactWriter = Box::new(|path: &str, content: &str, _opts: &str| {
        Ok(format!(r#"{{"path":"{path}","bytes":{}}}"#, content.len()))
    });
    let out = run(
        code,
        &build_preamble(&[]),
        &limits(Duration::from_secs(5)),
        echo_caller(),
        writer,
        no_embed(),
        None,
    )
    .unwrap();
    assert_eq!(out.result["path"], "out/report.json");
    assert!(out.result["bytes"].as_i64().unwrap() > 0);
}

#[test]
fn write_artifact_error_surfaces_as_throw() {
    let code = r#"async () => {
        try { await writeArtifact("x.txt", "hi"); return "ran"; }
        catch (e) { return "blocked:" + e.message; }
    }"#;
    let writer: ArtifactWriter = Box::new(|_p, _c, _o| Err("disk full".to_string()));
    let out = run(
        code,
        &build_preamble(&[]),
        &limits(Duration::from_secs(5)),
        echo_caller(),
        writer,
        no_embed(),
        None,
    )
    .unwrap();
    assert_eq!(out.result, serde_json::json!("blocked:disk full"));
}

#[test]
fn infinite_loop_is_interrupted_by_deadline() {
    let code = r#"async () => { while (true) {} }"#;
    let err = run(
        code,
        &build_preamble(&[]),
        &limits(Duration::from_millis(300)),
        echo_caller(),
        no_write(),
        no_embed(),
        None,
    )
    .unwrap_err();
    // Either the timeout guard or the interrupted job surfaces — both are errors.
    assert!(!err.is_empty(), "expected an error for a runaway loop");
}

#[test]
fn memory_limit_is_enforced() {
    // The 64 MiB QuickJS heap cap (EngineLimits.memory_bytes, set via
    // `rt.set_memory_limit`) surfaces as an engine error when a script allocates
    // well past it. The deadline is generous so MEMORY — not time — trips it.
    let code = r#"async () => { const s = "x".repeat(100 * 1024 * 1024); return s.length; }"#;
    let err = run(
        code,
        &build_preamble(&[]),
        &limits(Duration::from_secs(10)),
        echo_caller(),
        no_write(),
        no_embed(),
        None,
    )
    .unwrap_err();
    assert!(
        !err.is_empty(),
        "expected an error for an over-budget allocation"
    );
    assert!(
        !err.contains("timed out"),
        "expected a memory error, not a timeout: {err}"
    );
}

#[test]
fn stalled_calltool_is_bounded_by_deadline() {
    // The deadline interrupt handler can't preempt a blocking NATIVE call, so a
    // `callTool` that sleeps past the deadline runs to completion. But once it
    // returns, `drain_jobs` checks the deadline BETWEEN microtask jobs and aborts
    // — so the wall-clock deadline still terminates the script. (A genuinely hung
    // call is otherwise bounded by the upstream HTTP client's own timeout, not the
    // codemode deadline.)
    let slow: ToolCaller = Box::new(|_id, _params| {
        std::thread::sleep(std::time::Duration::from_millis(300));
        Ok("null".to_string())
    });
    let code = r#"async () => { await callTool("slow", {}); return "done"; }"#;
    let err = run(
        code,
        &build_preamble(&[]),
        &limits(Duration::from_millis(100)),
        slow,
        no_write(),
        no_embed(),
        None,
    )
    .unwrap_err();
    assert!(err.contains("timed out"), "got: {err}");
}

#[test]
fn search_with_no_lexical_overlap_and_no_semantic_score_finds_nothing() {
    // Baseline/control for the next test: a query sharing zero tokens with any
    // catalog entry, with the embed bridge always returning "no scores" (as it
    // does when semantic search is disabled), finds nothing — today's
    // lexical-only behavior, unchanged.
    let code = r#"async () => (await codemode.search("xyzzy plugh nonsense")).results"#;
    let out = run(
        code,
        &build_preamble(&[]),
        &limits(Duration::from_secs(5)),
        echo_caller(),
        no_write(),
        no_embed(),
        None,
    )
    .unwrap();
    assert_eq!(out.result, serde_json::json!([]));
}

#[test]
fn search_blends_in_a_high_semantic_score_for_zero_lexical_overlap_query() {
    // Same nonsense query as above, but now the embed bridge (standing in for a
    // real TEI call) reports a strong semantic match for one specific catalog
    // path. That path must now appear in results — proving the JS
    // callTool-adjacent __yarrEmbedQuery bridge, its JSON round-trip, and the
    // blend-into-score logic in codemode.search all work end to end, not just
    // that each piece compiles in isolation.
    let embed: EmbedCaller = Box::new(|_query| Ok(r#"{"api.<service>.get":0.9}"#.to_string()));
    let code = r#"async () => (await codemode.search("xyzzy plugh nonsense")).results"#;
    let out = run(
        code,
        &build_preamble(&[]),
        &limits(Duration::from_secs(5)),
        echo_caller(),
        no_write(),
        embed,
        None,
    )
    .unwrap();
    let paths: Vec<&str> = out
        .result
        .as_array()
        .expect("results should be an array")
        .iter()
        .map(|r| r["path"].as_str().expect("path should be a string"))
        .collect();
    assert_eq!(
        paths,
        vec!["api.<service>.get"],
        "the semantically-scored path should be the only result"
    );
}

#[test]
fn search_embed_bridge_is_not_called_for_an_empty_query() {
    // codemode.search("") lists everything unranked — there's nothing to embed
    // and rank against, so the JS should short-circuit before ever calling
    // __yarrEmbedQuery. Tracked via a shared flag rather than a panicking
    // bridge: panicking across the rquickjs FFI boundary has unclear
    // unwind-safety, so a flag the assertion checks afterward is the safe way
    // to observe "was this called" without risking the test process itself.
    let was_called = std::sync::Arc::new(std::sync::atomic::AtomicBool::new(false));
    let was_called_in_closure = was_called.clone();
    let embed: EmbedCaller = Box::new(move |_query| {
        was_called_in_closure.store(true, std::sync::atomic::Ordering::SeqCst);
        Ok("{}".to_string())
    });
    let code = r#"async () => (await codemode.search("")).total"#;
    let out = run(
        code,
        &build_preamble(&[]),
        &limits(Duration::from_secs(5)),
        echo_caller(),
        no_write(),
        embed,
        None,
    )
    .unwrap();
    // Zero configured services -> only the 4 generic api.<service>.* entries.
    assert_eq!(out.result, serde_json::json!(4));
    assert!(
        !was_called.load(std::sync::atomic::Ordering::SeqCst),
        "codemode.search(\"\") must not call the embed bridge"
    );
}
