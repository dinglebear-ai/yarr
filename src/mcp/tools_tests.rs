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
