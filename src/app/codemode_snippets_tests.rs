use crate::testing::loopback_state;
use std::sync::{Arc, Mutex};

struct SourceRecordingGuard {
    sources: Arc<Mutex<Vec<String>>>,
}

impl super::super::CodeModeCallGuard for SourceRecordingGuard {
    fn authorize<'a>(
        &'a self,
        _action: &'a crate::actions::YarrAction,
    ) -> std::pin::Pin<Box<dyn Future<Output = Result<(), String>> + Send + 'a>> {
        Box::pin(async { Ok(()) })
    }

    fn planned_destructive_target(&self, action: &crate::actions::YarrAction) -> Option<String> {
        match action {
            crate::actions::YarrAction::ApiDelete { service, .. } => Some(service.to_owned()),
            _ => None,
        }
    }

    fn authorize_planned_targets<'a>(
        &'a self,
        targets: Vec<String>,
    ) -> std::pin::Pin<Box<dyn Future<Output = Result<(), String>> + Send + 'a>> {
        let sources = Arc::clone(&self.sources);
        Box::pin(async move {
            sources
                .lock()
                .expect("preflight sources are available")
                .extend(targets);
            Ok(())
        })
    }
}

#[tokio::test]
async fn input_binding_is_injection_safe() {
    let tmp = tempfile::tempdir().unwrap();
    let service = loopback_state()
        .service
        .with_data_dir(tmp.path().to_path_buf());
    service
        .snippet_save("echo", "async () => input", None)
        .await
        .unwrap();
    let tricky = serde_json::json!({
        "quote": "he said \"hi\" and \\ ; return 1; //",
        "unicode": "h\u{e9}llo \u{1f389} \u{2028}\u{2029} \u{0}end",
        "nested": { "js": "\"); maliciousCode(); //", "n": 42 },
        "arr": [1, "two", null, true],
    });
    assert_eq!(
        service.snippet_run("echo", &tricky).await.unwrap()["result"],
        tricky
    );
}

#[tokio::test]
async fn save_list_run_delete_roundtrip() {
    let tmp = tempfile::tempdir().unwrap();
    let service = loopback_state()
        .service
        .with_data_dir(tmp.path().to_path_buf());
    service
        .snippet_save("greet", "async () => ({ hi: input.who })", Some("greets"))
        .await
        .unwrap();
    assert_eq!(
        service.snippet_list().await.unwrap()["snippets"][0]["name"],
        "greet"
    );
    assert_eq!(
        service
            .snippet_run("greet", &serde_json::json!({"who":"world"}))
            .await
            .unwrap()["result"]["hi"],
        "world"
    );
    assert_eq!(
        service.snippet_delete("greet").await.unwrap()["deleted"],
        true
    );
    assert!(
        service.snippet_list().await.unwrap()["snippets"]
            .as_array()
            .unwrap()
            .is_empty()
    );
}

#[tokio::test]
async fn codemode_run_invokes_saved_snippet() {
    let tmp = tempfile::tempdir().unwrap();
    let service = loopback_state()
        .service
        .with_data_dir(tmp.path().to_path_buf());
    service
        .snippet_save("double", "async () => input.n * 2", None)
        .await
        .unwrap();
    let out = service
        .codemode(r#"async () => (await codemode.run("double", { n: 21 })).result"#)
        .await
        .unwrap();
    assert_eq!(out["result"], 42);
}

#[tokio::test]
async fn snippet_cannot_run_another_snippet() {
    let tmp = tempfile::tempdir().unwrap();
    let service = loopback_state()
        .service
        .with_data_dir(tmp.path().to_path_buf());
    service
        .snippet_save("inner", "async () => 1", None)
        .await
        .unwrap();
    service.snippet_save("outer", r#"async () => { try { await codemode.run("inner", {}); return "ran"; } catch (e) { return "blocked:" + e.message; } }"#, None).await.unwrap();
    let out = service
        .codemode(r#"async () => (await codemode.run("outer", {})).result"#)
        .await
        .unwrap();
    assert!(out["result"].as_str().unwrap().contains("snippet"));
}

#[tokio::test]
async fn snippets_are_disabled_without_data_dir() {
    assert!(
        loopback_state()
            .service
            .snippet_save("x", "async () => 1", None)
            .await
            .is_err()
    );
}

#[tokio::test]
async fn guarded_saved_snippet_preflights_its_loaded_source_before_execution() {
    let tmp = tempfile::tempdir().unwrap();
    let service = loopback_state()
        .service
        .with_data_dir(tmp.path().to_path_buf());
    let source =
        r#"async () => callTool("api_delete", { service: "sonarr", path: "/api/v3/series/1" })"#;
    service
        .snippet_save("destructive", source, None)
        .await
        .unwrap();
    let sources = Arc::new(Mutex::new(Vec::new()));

    let _ = service
        .snippet_run_with_guard(
            "destructive",
            &serde_json::Value::Null,
            Some(Arc::new(SourceRecordingGuard {
                sources: Arc::clone(&sources),
            })),
        )
        .await;

    assert_eq!(*sources.lock().unwrap(), vec!["sonarr"]);
}
