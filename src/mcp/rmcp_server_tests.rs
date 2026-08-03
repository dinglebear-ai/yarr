use serde_json::json;

use crate::{
    actions::{READ_SCOPE, WRITE_SCOPE, required_scope_for_action},
    app::YarrService,
    config::{McpConfig, ServiceConfig, ServiceKind, ToolMode, YarrConfig},
    server::{AppState, AuthPolicy},
    token_limit::MAX_RESPONSE_BYTES,
    yarr::YarrClient,
};

use super::{
    declined_result, effective_action, internal_tool_error_message, is_destructive_op_call,
    reject_unknown_action_before_scope, rmcp_tool_definitions_for_service, scope_satisfied,
    tool_error_result, tool_result_from_json,
};

fn sonarr_only_state() -> AppState {
    let config = YarrConfig {
        services: vec![ServiceConfig {
            name: "sonarr".into(),
            kind: ServiceKind::Sonarr,
            base_url: "http://localhost:8989".into(),
            api_key: Some("test".into()),
            ..ServiceConfig::default()
        }],
    };
    let client = YarrClient::new(&config).expect("client builds");
    AppState {
        config: McpConfig::default(),
        auth_policy: AuthPolicy::LoopbackDev,
        service: YarrService::new(client, config),
    }
}

fn plex_only_state() -> AppState {
    let config = YarrConfig {
        services: vec![ServiceConfig {
            name: "plex_den".into(),
            kind: ServiceKind::Plex,
            base_url: "http://localhost:32400".into(),
            token: Some("test".into()),
            ..ServiceConfig::default()
        }],
    };
    let client = YarrClient::new(&config).expect("client builds");
    AppState {
        config: McpConfig::default(),
        auth_policy: AuthPolicy::LoopbackDev,
        service: YarrService::new(client, config),
    }
}

fn scopes(s: &[&str]) -> Vec<String> {
    s.iter().map(|x| x.to_string()).collect()
}

#[path = "rmcp_server_definitions_tests.rs"]
mod advertising;
#[path = "rmcp_server_errors_tests.rs"]
mod scopes;
