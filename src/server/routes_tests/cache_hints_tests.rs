//! Wire-level tests for SEP-2549 cache hints (`ttlMs`/`cacheScope`) across all
//! five cacheable results (`mcp/rmcp_server.rs`'s `with_cache_hints`).
//!
//! These POST raw JSON-RPC through the real router/transport (no `initialize`
//! handshake needed — the transport is stateless, `with_legacy_session_mode
//! (false)` in `mcp/transport.rs`), so they exercise the actual gate: whether
//! a caller negotiated protocol version `2026-07-28` is read back off the
//! `MCP-Protocol-Version` HTTP header via rmcp's own stateless
//! `peer_info_for_stateless_request` reconstruction, not a mocked context.

use super::*;

/// Every SEP-2549-cacheable result this server returns, the JSON-RPC method +
/// params that reaches it, and the `ttlMs` `with_cache_hints` should attach.
/// Mirrors `with_cache_hints`'s five `CacheableResult` impls in
/// `mcp/rmcp_server.rs` one-for-one — add a case here whenever a case is
/// added there. Asserting the exact TTL (not just that one is present) is
/// what would catch e.g. `list_prompts` accidentally getting
/// `CACHEABLE_RESULT_TTL_MS` instead of its own, longer `PROMPTS_LIST_TTL_MS`.
const CACHEABLE_METHODS: &[(&str, &str, u64)] = &[
    (
        "tools/list",
        "{}",
        crate::mcp::rmcp_server::CACHEABLE_RESULT_TTL_MS,
    ),
    (
        "resources/list",
        "{}",
        crate::mcp::rmcp_server::CACHEABLE_RESULT_TTL_MS,
    ),
    (
        "resources/templates/list",
        "{}",
        crate::mcp::rmcp_server::CACHEABLE_RESULT_TTL_MS,
    ),
    (
        "resources/read",
        r#"{"uri":"yarr://schema/mcp-tool"}"#,
        crate::mcp::rmcp_server::CACHEABLE_RESULT_TTL_MS,
    ),
    (
        "prompts/list",
        "{}",
        crate::mcp::rmcp_server::PROMPTS_LIST_TTL_MS,
    ),
];

fn params_for(raw: &str) -> Value {
    serde_json::from_str(raw).expect("test params should be valid JSON")
}

/// `params_for`, with SEP-2575's required `_meta` keys merged in. `_meta`
/// lives inside `params` on every request type here (`ReadResourceRequestParams`,
/// `PaginatedRequestParams`, …), not at the JSON-RPC envelope's top level.
fn params_for_2026_07_28(raw: &str) -> Value {
    let mut params = params_for(raw);
    let Value::Object(map) = &mut params else {
        unreachable!("every CACHEABLE_METHODS params literal is a JSON object");
    };
    map.insert(
        "_meta".to_owned(),
        json!({
            "io.modelcontextprotocol/protocolVersion": "2026-07-28",
            "io.modelcontextprotocol/clientCapabilities": {},
        }),
    );
    params
}

/// A caller that negotiates `2026-07-28` must see `ttlMs`/`cacheScope` on all
/// five methods (SEP-2549 makes both required at that protocol version), and
/// `cacheScope` must be `"private"` — yarr's deliberate divergence from
/// rmcp's own `Public` default (see `with_cache_hints`'s doc comment for why).
///
/// `2026-07-28` also turns on two unrelated per-request requirements that the
/// transport enforces before a handler ever runs — a request without them is
/// rejected with 400, so a caller negotiating this version has to send them
/// regardless of what it's testing:
/// - SEP-2243 `Mcp-Method` (and `Mcp-Name` for `resources/read`, since its
///   `params.uri` names the resource) HTTP headers.
/// - SEP-2575 `_meta["io.modelcontextprotocol/protocolVersion"]` and
///   `_meta["io.modelcontextprotocol/clientCapabilities"]` in the JSON-RPC
///   body itself, consistent with the HTTP header.
#[tokio::test]
async fn cacheable_results_carry_sep_2549_hints_for_2026_07_28_callers() {
    let (state, _calls, server) = counting_state(crate::config::ToolMode::Codemode).await;
    for (id, (method, params, expected_ttl_ms)) in CACHEABLE_METHODS.iter().enumerate() {
        let mut headers = vec![
            ("mcp-protocol-version", "2026-07-28"),
            ("mcp-method", *method),
        ];
        if *method == "resources/read" {
            headers.push(("mcp-name", "yarr://schema/mcp-tool"));
        }
        let response = authenticated_mcp_call_with_headers(
            state.clone(),
            "read-token",
            &headers,
            json!({
                "jsonrpc": "2.0",
                "id": id,
                "method": method,
                "params": params_for_2026_07_28(params),
            }),
        )
        .await;
        // The exact TTL, not just presence — catches e.g. `list_prompts`
        // being passed the wrong constant (see CACHEABLE_METHODS' doc comment).
        assert_eq!(
            response["result"]["ttlMs"], *expected_ttl_ms,
            "{method} wrong/missing ttlMs for a 2026-07-28 caller: {response}"
        );
        assert_eq!(
            response["result"]["cacheScope"], "private",
            "{method} cacheScope should be private, not rmcp's Public default: {response}"
        );
    }
    server.abort();
}

/// A caller that never negotiates `2026-07-28` — the default when no
/// `MCP-Protocol-Version` header is sent at all, per rmcp's
/// `peer_info_for_stateless_request` — must NOT receive the hints. They are
/// meaningless to a client that doesn't understand SEP-2549, and
/// `with_cache_hints` is deliberately gated so it never promises a
/// caching/freshness contract to a caller that never negotiated one.
#[tokio::test]
async fn cacheable_results_omit_sep_2549_hints_for_legacy_callers() {
    let (state, _calls, server) = counting_state(crate::config::ToolMode::Codemode).await;
    for (id, (method, params, _expected_ttl_ms)) in CACHEABLE_METHODS.iter().enumerate() {
        let response = authenticated_mcp_call(
            state.clone(),
            "read-token",
            json!({"jsonrpc": "2.0", "id": 100 + id, "method": method, "params": params_for(params)}),
        )
        .await;
        assert!(
            response["result"]["ttlMs"].is_null(),
            "{method} should omit ttlMs for a legacy caller: {response}"
        );
        assert!(
            response["result"]["cacheScope"].is_null(),
            "{method} should omit cacheScope for a legacy caller: {response}"
        );
    }
    server.abort();
}
