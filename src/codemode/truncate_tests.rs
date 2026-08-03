//! Tests for the Code-Mode-aware response budget.

use super::*;
use crate::token_limit::MAX_RESPONSE_BYTES;

fn envelope(result: Value, logs: Vec<&str>) -> Value {
    json!({
        "result": result,
        "calls": [],
        "logs": logs.iter().map(|l| Value::String((*l).to_string())).collect::<Vec<_>>(),
        "artifacts": [],
    })
}

#[test]
fn small_envelope_is_left_untouched() {
    let mut env = envelope(json!({ "ok": true }), vec!["started", "done"]);
    let before = env.clone();
    fit_response(&mut env);
    assert_eq!(env, before, "an in-budget envelope must not be modified");
}

#[test]
fn logs_are_trimmed_oldest_first_to_preserve_result() {
    // A modest result + a huge pile of logs: the result must survive intact and the
    // OLDEST logs get dropped with a sentinel; the NEWEST survive.
    let result = json!({ "answer": 42 });
    let big_logs: Vec<String> = (0..4000)
        .map(|i| format!("log line number {i} ........"))
        .collect();
    let mut env = envelope(
        result.clone(),
        big_logs.iter().map(String::as_str).collect(),
    );
    assert!(
        serialized_len(&env) > RESPONSE_BUDGET,
        "test envelope must start over budget"
    );

    fit_response(&mut env);

    assert!(
        serialized_len(&env) <= RESPONSE_BUDGET,
        "shaped envelope must fit the budget"
    );
    assert!(
        serialized_len(&env) < MAX_RESPONSE_BYTES,
        "and stay below the transport cap"
    );
    // Result preserved byte-identical (logs were the bottleneck, not the answer).
    assert_eq!(env["result"], result);
    let logs = env["logs"].as_array().unwrap();
    // First line is the sentinel; newest original line is retained at the end.
    assert!(logs[0].as_str().unwrap().contains("logs truncated"));
    assert_eq!(logs.last().unwrap(), &Value::String(big_logs[3999].clone()));
    // The very oldest original line is gone.
    assert!(
        !logs
            .iter()
            .any(|l| l == &Value::String(big_logs[0].clone()))
    );
}

#[test]
fn oversized_result_becomes_a_structured_marker() {
    // Result itself blows the budget; dropping logs can't help → marker-ize result.
    let huge: Vec<i64> = (0..20_000).collect();
    let mut env = envelope(json!({ "items": huge }), vec!["a", "b"]);
    assert!(serialized_len(&env) > RESPONSE_BUDGET);

    fit_response(&mut env);

    assert!(serialized_len(&env) <= RESPONSE_BUDGET);
    let result = &env["result"];
    assert_eq!(result["truncated"], true);
    assert!(result["original_bytes"].as_u64().unwrap() > RESPONSE_BUDGET as u64);
    assert!(result["original_tokens"].as_u64().unwrap() > 0);
    assert!(result["preview"].as_str().unwrap().len() <= 1024);
    assert!(result["next_action"].as_str().unwrap().contains("Narrow"));
    // The envelope stays parseable JSON (the whole point vs the blind transport cut).
    assert!(serde_json::to_string(&env).is_ok());
}

#[test]
fn marker_is_skipped_when_it_would_not_shrink_a_small_result() {
    // Force the marker pass with a SMALL result but oversized non-log payload
    // (huge calls array). Marker-izing a tiny result wouldn't shrink it, so the
    // result is left intact.
    let calls: Vec<Value> = (0..6000)
        .map(|i| json!({ "action": "op", "ok": true, "n": i }))
        .collect();
    let mut env = json!({
        "result": { "ok": true },
        "calls": calls,
        "logs": [],
        "artifacts": [],
    });
    assert!(serialized_len(&env) > RESPONSE_BUDGET);
    fit_response(&mut env);
    // result untouched (marker would have been larger than `{"ok":true}`)...
    assert_eq!(env["result"], json!({ "ok": true }));
    // ...and the oversized `calls` audit (the real bottleneck) is trimmed newest-first
    // with a `{truncated_calls: N}` sentinel so the envelope fits.
    assert!(
        serialized_len(&env) <= RESPONSE_BUDGET,
        "calls must be trimmed to fit"
    );
    let calls = env["calls"].as_array().unwrap();
    assert!(
        calls[0]["truncated_calls"].as_u64().unwrap() > 0,
        "sentinel records dropped count"
    );
    // Newest call survives at the tail.
    assert_eq!(calls.last().unwrap()["n"], json!(5999));
}

#[test]
fn utf8_prefix_never_splits_a_codepoint() {
    // ASCII source (\u escapes) so the repo ASCII check stays clean, while still
    // exercising 2-byte and 4-byte codepoints at varied byte offsets.
    let s = "h\u{e9}llo w\u{f6}rld \u{1f389} end";
    for n in 0..s.len() + 2 {
        let p = utf8_prefix(s, n);
        assert!(p.len() <= n || n >= s.len());
        assert!(s.starts_with(p));
        assert!(std::str::from_utf8(p.as_bytes()).is_ok());
    }
}

#[test]
fn oversized_fleet_values_are_marked_per_instance() {
    let huge = "x".repeat(RESPONSE_BUDGET);
    let mut env = envelope(
        json!([
            {"name": "plex_01", "ok": true, "value": {"sessions": [huge]}},
            {"name": "plex_02", "ok": true, "value": {"sessions": ["small"]}},
        ]),
        vec![],
    );

    fit_response(&mut env);

    let results = env["result"]
        .as_array()
        .expect("fleet result remains an array");
    assert_eq!(results[0]["name"], "plex_01");
    assert_eq!(results[0]["truncated"], true);
    assert_eq!(results[0]["value"], Value::Null);
    assert_eq!(results[0]["summary"]["type"], "object");
    assert!(results[0]["summary"]["original_bytes"].as_u64().unwrap() > 0);
    assert_eq!(results[1]["name"], "plex_02");
    assert_eq!(results[1]["truncated"], false);
    assert_eq!(results[1]["value"]["sessions"][0], "small");
    assert!(serialized_len(&env) <= RESPONSE_BUDGET);
}

#[test]
fn fleet_array_summary_reports_item_count() {
    let sessions: Vec<Value> = (0..2_000)
        .map(|i| json!({"session": i, "title": "x".repeat(32)}))
        .collect();
    let mut env = envelope(
        json!([{"name": "plex_den", "ok": true, "value": sessions}]),
        vec![],
    );

    fit_response(&mut env);

    assert_eq!(env["result"][0]["truncated"], true);
    assert_eq!(env["result"][0]["summary"]["item_count"], 2_000);
}
