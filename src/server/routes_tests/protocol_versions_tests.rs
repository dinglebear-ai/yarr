//! Wire-level ownership tests for the MCP revisions Yarr advertises.

use super::super::*;

const EXPECTED_PROTOCOL_VERSIONS: &[&str] = &[
    "2024-11-05",
    "2025-03-26",
    "2025-06-18",
    "2025-11-25",
    "2026-07-28",
];

fn modern_meta() -> Value {
    json!({
        "io.modelcontextprotocol/protocolVersion": "2026-07-28",
        "io.modelcontextprotocol/clientCapabilities": {},
        "io.modelcontextprotocol/clientInfo": {
            "name": "yarr-protocol-contract-test",
            "version": "1.0.0"
        }
    })
}

#[tokio::test]
async fn discover_advertises_only_yarr_owned_protocol_versions() {
    let (state, _calls, server) = counting_state(crate::config::ToolMode::Codemode).await;
    let response = authenticated_mcp_call_with_headers(
        state,
        "read-token",
        &[
            ("mcp-protocol-version", "2026-07-28"),
            ("mcp-method", "server/discover"),
        ],
        json!({
            "jsonrpc": "2.0",
            "id": 200,
            "method": "server/discover",
            "params": { "_meta": modern_meta() },
        }),
    )
    .await;

    let advertised = response["result"]["supportedVersions"]
        .as_array()
        .expect("server/discover must return supportedVersions")
        .iter()
        .map(|value| value.as_str().expect("protocol version must be a string"))
        .collect::<Vec<_>>();
    assert_eq!(advertised, EXPECTED_PROTOCOL_VERSIONS);
    assert_eq!(response["result"]["resultType"], "complete");
    assert_eq!(response["result"]["ttlMs"], 0);
    assert_eq!(response["result"]["cacheScope"], "private");
    assert_eq!(
        response["result"]["_meta"]["io.modelcontextprotocol/serverInfo"]["name"],
        "yarr"
    );

    server.abort();
}

#[tokio::test]
async fn modern_prompt_and_tool_results_carry_complete_discriminator() {
    let (prompt_state, _prompt_calls, prompt_server) =
        counting_state(crate::config::ToolMode::Codemode).await;
    let prompt = authenticated_mcp_call_with_headers(
        prompt_state,
        "read-token",
        &[
            ("mcp-protocol-version", "2026-07-28"),
            ("mcp-method", "prompts/get"),
            ("mcp-name", "quick_start"),
        ],
        json!({
            "jsonrpc": "2.0",
            "id": 201,
            "method": "prompts/get",
            "params": {
                "_meta": modern_meta(),
                "name": "quick_start"
            },
        }),
    )
    .await;
    assert_eq!(prompt["result"]["resultType"], "complete");
    assert_eq!(
        prompt["result"]["_meta"]["io.modelcontextprotocol/serverInfo"]["name"],
        "yarr"
    );
    prompt_server.abort();

    let (tool_state, calls, tool_server) = counting_state(crate::config::ToolMode::Flat).await;
    let tool = authenticated_mcp_call_with_headers(
        tool_state,
        "read-token",
        &[
            ("mcp-protocol-version", "2026-07-28"),
            ("mcp-method", "tools/call"),
            ("mcp-name", "sonarr"),
        ],
        json!({
            "jsonrpc": "2.0",
            "id": 202,
            "method": "tools/call",
            "params": {
                "_meta": modern_meta(),
                "name": "sonarr",
                "arguments": { "action": "service_status" }
            },
        }),
    )
    .await;
    assert_eq!(tool["result"]["resultType"], "complete");
    assert_eq!(
        tool["result"]["_meta"]["io.modelcontextprotocol/serverInfo"]["name"],
        "yarr"
    );
    assert_eq!(calls.load(Ordering::SeqCst), 1);
    tool_server.abort();
}

#[tokio::test]
async fn legacy_prompt_and_tool_results_keep_the_pre_0728_wire_shape() {
    let (prompt_state, _prompt_calls, prompt_server) =
        counting_state(crate::config::ToolMode::Codemode).await;
    let prompt = authenticated_mcp_call(
        prompt_state,
        "read-token",
        json!({
            "jsonrpc": "2.0",
            "id": 203,
            "method": "prompts/get",
            "params": { "name": "quick_start" },
        }),
    )
    .await;
    assert!(prompt["result"]["resultType"].is_null());
    assert!(prompt["result"]["_meta"]["io.modelcontextprotocol/serverInfo"].is_null());
    prompt_server.abort();

    let (tool_state, calls, tool_server) = counting_state(crate::config::ToolMode::Flat).await;
    let tool = authenticated_mcp_call(
        tool_state,
        "read-token",
        json!({
            "jsonrpc": "2.0",
            "id": 204,
            "method": "tools/call",
            "params": {
                "name": "sonarr",
                "arguments": { "action": "service_status" }
            },
        }),
    )
    .await;
    assert!(tool["result"]["resultType"].is_null());
    assert!(tool["result"]["_meta"]["io.modelcontextprotocol/serverInfo"].is_null());
    assert_eq!(calls.load(Ordering::SeqCst), 1);
    tool_server.abort();
}
