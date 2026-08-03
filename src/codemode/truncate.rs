//! Code-Mode-aware response budgeting.
//!
//! The Code Mode envelope (`{result, calls, logs, artifacts, …}`) can blow an
//! agent's context window. yarr's transport layer already caps the whole MCP
//! tool response at [`crate::token_limit::MAX_RESPONSE_BYTES`] — but that cap is a
//! *blind byte slice* that chops `result` mid-JSON and discards the audit envelope
//! structure. This pass shapes the envelope INTELLIGENTLY, strictly BELOW the
//! transport cap, so the agent always receives parseable JSON:
//!
//! Sacrifice order is value-ordered — preserve `result` (the answer), then the
//! `calls` audit, then `logs` (debug output):
//!
//! 1. If the serialized envelope already fits the budget → leave it untouched.
//! 2. Otherwise set `logs` aside entirely (measure `result`/`calls`/`artifacts` on
//!    their own) — the script's answer is more valuable than its debug output.
//!    (yarr diverges from lab here, which caps the result first.)
//! 3. If that non-log payload is itself still over budget, replace an oversized
//!    `result` with a structured, parseable
//!    `{truncated, original_bytes, original_tokens, preview, next_action}` marker
//!    — a result-specific marker in the same *spirit* as `token_limit`'s
//!    `{truncated, reason, partial}` (both lead with `truncated: true` so an agent
//!    can branch programmatically), but a distinct shape — then, if STILL over,
//!    trim the `calls` audit newest-first with a `{truncated_calls: N}` sentinel.
//! 4. Finally, fit back as many of the newest `logs` lines as the remaining budget
//!    allows (prepending a `[logs truncated …]` sentinel when some are dropped).
//!
//! The budget is *derived from* `MAX_RESPONSE_BYTES` (3/5 of it ≈ 24 KB, the same
//! figure lab and Cloudflare's codemode use) so the two caps can never invert and
//! the shaped envelope never trips the transport truncation that would undo this
//! work. Token counts in the marker are informational (bytes / 4, a conservative
//! over-estimate for JSON); the budget *check* is bytes, matching the transport cap.

use serde_json::{Value, json};

use crate::token_limit::MAX_RESPONSE_BYTES;

/// Byte budget for the shaped Code Mode envelope. 3/5 of the transport cap leaves
/// generous headroom (~16 KB at the default 40 KB cap) so re-serialization /
/// escape growth can never push the shaped envelope past the transport truncation.
const RESPONSE_BUDGET: usize = MAX_RESPONSE_BYTES / 5 * 3;

// The whole point is to shape the envelope BELOW the transport cap; pin that
// invariant at compile time so a future change to either constant can't invert it.
const _: () = assert!(
    RESPONSE_BUDGET < MAX_RESPONSE_BYTES,
    "Code Mode budget must stay below the transport cap"
);

/// Bytes-per-token estimate for the (informational) token count in the marker.
const TOKEN_DIVISOR: usize = 4;

/// Head-preview size (bytes) of an oversized result placed in the marker.
const PREVIEW_BYTES: usize = 1024;

/// Shape `response` to fit [`RESPONSE_BUDGET`] in place (see module docs).
///
/// Sacrifice order is value-ordered: preserve `result` (the answer) first, then the
/// `calls` audit, then `logs` (debug output) — each trimmed only as far as needed.
pub fn fit_response(response: &mut Value) {
    if within_budget(response) {
        return;
    }

    summarize_fleet_result(response);
    if within_budget(response) {
        return;
    }

    // Pull logs out so we can measure the rest of the envelope on its own.
    let logs = take_array(response, "logs");

    if !within_budget(response) {
        // The non-log payload (result/calls/artifacts) is itself over budget, so
        // trimming logs alone can't help — replace an oversized `result` with a
        // compact marker (only when that actually shrinks it).
        marker_oversized_result(response);
    }

    if !within_budget(response) {
        // Still over with logs gone and the result markered → the `calls` audit is
        // the bottleneck (e.g. many failing calls with verbose error bodies). Trim
        // it newest-first with a `{truncated_calls: N}` sentinel.
        let calls = take_array(response, "calls");
        fit_newest(
            response,
            "calls",
            calls,
            |dropped| json!({ "truncated_calls": dropped }),
        );
    }

    // Finally, fit back as many of the NEWEST log lines as the remaining budget allows.
    fit_newest(response, "logs", logs, |dropped| {
        Value::String(format!(
            "[logs truncated to fit response budget — {dropped} line(s) dropped]"
        ))
    });
}

/// Preserve the shape and completeness signal of a `fleet.map` result. Each
/// member receives an explicit `truncated` flag; values that cannot fit their
/// fair share of the response budget are replaced with a compact summary.
fn summarize_fleet_result(response: &mut Value) {
    let Some(results) = response.get_mut("result").and_then(Value::as_array_mut) else {
        return;
    };
    if results.is_empty()
        || !results.iter().all(|item| {
            item.get("name").and_then(Value::as_str).is_some()
                && item.get("ok").and_then(Value::as_bool).is_some()
        })
    {
        return;
    }

    // Leave room for the envelope, calls, logs, and JSON punctuation. This is a
    // byte budget (like the final transport cap), not an estimated token count.
    let per_instance_budget = RESPONSE_BUDGET
        .saturating_sub(2 * 1024)
        .checked_div(results.len())
        .unwrap_or(0)
        .max(256);

    for item in results {
        let original_len = serialized_len(item);
        if original_len <= per_instance_budget {
            if let Some(object) = item.as_object_mut() {
                object.insert("truncated".into(), Value::Bool(false));
            }
            continue;
        }

        let Some(object) = item.as_object_mut() else {
            continue;
        };
        let value = object.remove("value").unwrap_or(Value::Null);
        let value_len = serialized_len(&value);
        let value_type = match &value {
            Value::Null => "null",
            Value::Bool(_) => "boolean",
            Value::Number(_) => "number",
            Value::String(_) => "string",
            Value::Array(_) => "array",
            Value::Object(_) => "object",
        };
        let item_count = match &value {
            Value::Array(items) => Some(items.len()),
            Value::Object(fields) => Some(fields.len()),
            _ => None,
        };
        let mut summary = serde_json::Map::from_iter([
            ("type".into(), Value::String(value_type.into())),
            ("original_bytes".into(), json!(value_len)),
        ]);
        if let Some(count) = item_count {
            summary.insert("item_count".into(), json!(count));
        }
        object.insert("value".into(), Value::Null);
        object.insert("truncated".into(), Value::Bool(true));
        object.insert("summary".into(), Value::Object(summary));
    }
}

/// True iff the compact serialization of `value` is within budget.
fn within_budget(value: &Value) -> bool {
    serialized_len(value) <= RESPONSE_BUDGET
}

fn serialized_len(value: &Value) -> usize {
    // Fail SAFE: a (near-impossible) serialize failure on an already-materialized
    // `Value` reports max size so we err toward truncating, never toward emitting an
    // unbounded envelope the blunt transport cap would then chop mid-JSON.
    serde_json::to_string(value)
        .map(|s| s.len())
        .unwrap_or(usize::MAX)
}

/// Remove array `field` from the envelope (replacing it with `[]`) and return its
/// items. Returns empty if the field is absent or not an array.
fn take_array(response: &mut Value, field: &str) -> Vec<Value> {
    match response.get_mut(field) {
        Some(slot) if slot.is_array() => match std::mem::replace(slot, Value::Array(Vec::new())) {
            Value::Array(items) => items,
            _ => Vec::new(),
        },
        _ => Vec::new(),
    }
}

/// Replace `response["result"]` with a structured truncation marker, but only if
/// the marker is smaller than the original result (otherwise a small result that
/// isn't the bottleneck would needlessly grow).
fn marker_oversized_result(response: &mut Value) {
    let Some(result) = response.get("result") else {
        return;
    };
    if result.is_null() {
        return;
    }
    const NEXT_ACTION: &str = "Result exceeded the Code Mode response budget. Narrow it: \
                               request fewer fields, add limit/offset/filter params, or \
                               writeArtifact() the full payload and return a summary.";
    // Fail SAFE: an unserializable result (near-impossible for a Value) is replaced
    // with a minimal marker rather than left for the blunt transport cap.
    let Ok(serialized) = serde_json::to_string(result) else {
        response["result"] = json!({ "truncated": true, "next_action": NEXT_ACTION });
        return;
    };
    let marker = json!({
        "truncated": true,
        "original_bytes": serialized.len(),
        "original_tokens": serialized.len() / TOKEN_DIVISOR,
        "preview": utf8_prefix(&serialized, PREVIEW_BYTES),
        "next_action": NEXT_ACTION,
    });
    if serialized_len(&marker) < serialized.len() {
        response["result"] = marker;
    }
}

/// Fit the largest suffix (newest entries) of `items` into `response[field]` that
/// keeps the envelope within budget, prepending `sentinel(dropped)` when any are
/// dropped. Binary search keeps this O(n log n) serializations rather than O(n^2).
fn fit_newest(
    response: &mut Value,
    field: &str,
    items: Vec<Value>,
    sentinel: impl Fn(usize) -> Value,
) {
    let total = items.len();
    if total == 0 {
        return;
    }

    // `keep` = number of newest entries retained. Find the largest `keep` that fits.
    let set = |response: &mut Value, keep: usize| {
        let dropped = total - keep;
        let mut out: Vec<Value> = Vec::with_capacity(keep + 1);
        if dropped > 0 {
            out.push(sentinel(dropped));
        }
        out.extend(items[total - keep..].iter().cloned());
        response[field] = Value::Array(out);
    };

    // Fast path: does everything fit?
    set(response, total);
    if within_budget(response) {
        return;
    }

    let (mut lo, mut hi) = (0usize, total);
    while lo < hi {
        let mid = (lo + hi).div_ceil(2); // bias toward keeping more
        set(response, mid);
        if within_budget(response) {
            lo = mid;
        } else {
            hi = mid - 1;
        }
    }
    set(response, lo);
}

/// The largest char-boundary prefix of `s` that is at most `max_bytes` bytes.
fn utf8_prefix(s: &str, max_bytes: usize) -> &str {
    if s.len() <= max_bytes {
        return s;
    }
    let mut end = max_bytes;
    while end > 0 && !s.is_char_boundary(end) {
        end -= 1;
    }
    &s[..end]
}

#[cfg(test)]
#[path = "truncate_tests.rs"]
mod tests;
