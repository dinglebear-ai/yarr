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
