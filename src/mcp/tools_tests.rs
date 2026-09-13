use std::{pin::Pin, sync::Arc};

use crate::{
    actions::registry::{LocalEffect, install_test_curated_command},
    actions::{CommandDescriptor, CommandFuture, READ_SCOPE, YarrAction},
    app::codemode::CodeModeCallGuard,
    capability::Capability,
    testing::loopback_state,
};
use serde_json::json;

fn write_test_local_file<'a>(
    _service: &'a crate::app::YarrService,
    args: &'a serde_json::Value,
) -> CommandFuture<'a> {
    Box::pin(async move {
        let path = args["path"].as_str().expect("test path is present");
        std::fs::write(path, "must not be written")?;
        Ok(json!({ "wrote": path }))
    })
}

struct ReadAuthorizedCodeModeGuard;

impl CodeModeCallGuard for ReadAuthorizedCodeModeGuard {
    fn authorize<'a>(
        &'a self,
        action: &'a YarrAction,
    ) -> Pin<Box<dyn Future<Output = Result<(), String>> + Send + 'a>> {
        Box::pin(async move {
            super::authorize_codemode_action_scopes(&[READ_SCOPE.to_owned()], action)
        })
    }
}

#[tokio::test]
async fn yarr_tool_dispatches_codemode() {
    // The single `yarr` tool takes only `code` and runs it as the codemode action.
    let state = loopback_state();
    let value = super::execute_tool_without_peer_for_test(
        &state,
        "yarr",
        json!({ "code": "async () => 6 * 7" }),
    )
    .await
    .unwrap();
    assert_eq!(value["result"], 42);
}

#[tokio::test]
async fn help_dispatch_returns_object() {
    let state = loopback_state();
    let value =
        super::execute_tool_without_peer_for_test(&state, "sonarr", json!({"action": "help"}))
            .await
            .unwrap();
    assert!(value.is_object());
}

#[tokio::test]
async fn service_tool_injects_service_argument() {
    let state = loopback_state();
    let result = super::execute_tool_without_peer_for_test(
        &state,
        "sonarr",
        json!({"action": "service_status"}),
    )
    .await;
    if let Err(err) = result {
        assert!(
            !err.to_string().contains("service"),
            "service-named tool should inject service arg: {err}"
        );
    }
}

#[tokio::test]
async fn fleet_readonly_rejects_generated_post_before_transport() {
    let mut state = loopback_state();
    state.config.fleet_readonly = true;

    let error = super::execute_tool_without_peer_for_test(
        &state,
        "sonarr",
        json!({ "action": "op", "op": "post_command", "args": { "body": {} } }),
    )
    .await
    .expect_err("fleet readonly must reject a generated mutation before transport");

    assert!(error.to_string().contains("YARR_FLEET_READONLY"));
}

fn four_service_codemode_service() -> crate::app::YarrService {
    let config = crate::config::YarrConfig {
        services: [
            ("sonarr", crate::config::ServiceKind::Sonarr),
            ("radarr", crate::config::ServiceKind::Radarr),
            ("plex", crate::config::ServiceKind::Plex),
            ("jellyfin", crate::config::ServiceKind::Jellyfin),
        ]
        .into_iter()
        .map(|(name, kind)| crate::config::ServiceConfig {
            name: name.to_owned(),
            kind,
            base_url: "http://localhost:1".into(),
            api_key: Some("test".into()),
            ..Default::default()
        })
        .collect(),
    };
    let client = crate::yarr::YarrClient::new(&config).expect("stub client builds");
    crate::app::YarrService::new(client, config)
}

#[test]
fn codemode_preflight_rejects_four_actual_destructive_targets_before_dispatch() {
    let service = four_service_codemode_service();
    let code = r#"async () => {
        await api.sonarr.delete("/api/v3/series/1");
        await api.radarr.delete("/api/v3/movie/2");
        await api.plex.delete("/library/metadata/3");
        await api.jellyfin.delete("/Items/4");
    }"#;

    let error = super::codemode_script_destructive_targets(&service, code, 3)
        .expect_err("four actual destructive script targets must fail before dispatch");
    assert!(error.contains("maximum is 3"), "{error}");
}

#[test]
fn codemode_preflight_authorizes_only_the_actual_target_not_the_configured_fleet() {
    let service = four_service_codemode_service();
    let code = r#"async () => api.sonarr.delete("/api/v3/series/1")"#;

    assert_eq!(
        super::codemode_script_destructive_targets(&service, code, 3)
            .expect("one actual target is within the cap"),
        vec!["sonarr"],
    );
}

#[test]
fn codemode_run_preflight_expands_destructive_saved_snippet_source() {
    let tmp = tempfile::tempdir().unwrap();
    let service = four_service_codemode_service().with_data_dir(tmp.path().to_path_buf());
    let runtime = tokio::runtime::Runtime::new().unwrap();
    runtime
        .block_on(service.snippet_save(
            "remove-series",
            r#"async () => api.sonarr.delete("/api/v3/series/1")"#,
            None,
        ))
        .unwrap();

    assert_eq!(
        super::codemode_script_destructive_targets(
            &service,
            r#"async () => codemode.run("remove-series", {})"#,
            3,
        )
        .expect("saved source is planned before authorization"),
        vec!["sonarr"],
    );
}

#[tokio::test]
async fn read_authorized_codemode_cannot_invoke_local_file_writer() {
    let _command = install_test_curated_command(CommandDescriptor {
        name: "test_local_file_writer",
        capability: Capability::ArrManager,
        description: "test-only local file writer",
        required_scope: READ_SCOPE,
        required_params: &["service", "path"],
        optional_params: &[],
        destructive: false,
        mutates: false,
        local_effect: LocalEffect::WritesFile,
        typed_params: &[("path", crate::actions::registry::ParamType::String)],
        handler: write_test_local_file,
    });
    let path = std::env::temp_dir().join(format!("yarr-local-effect-{}.txt", std::process::id()));
    let _ = std::fs::remove_file(&path);
    let code = format!(
        r#"async () => callTool("test_local_file_writer", {{ service: "sonarr", path: {:?} }})"#,
        path.display().to_string()
    );

    let result = loopback_state()
        .service
        .codemode_with_guard(&code, Arc::new(ReadAuthorizedCodeModeGuard))
        .await;

    assert!(
        result.is_err(),
        "read authorization must reject the local writer"
    );
    assert!(
        !path.exists(),
        "read-authorized Code Mode must not create {}",
        path.display()
    );
}
