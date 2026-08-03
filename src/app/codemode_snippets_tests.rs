use crate::testing::loopback_state;

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
    assert!(
        service.snippet_list().await.unwrap()["snippets"]
            .as_array()
            .unwrap()
            .iter()
            .any(|snippet| snippet["name"] == "greet")
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
            .iter()
            .all(|snippet| snippet["built_in"] == true)
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
async fn canonical_fleet_snippets_are_available_without_a_data_dir() {
    let service = loopback_state().service;
    let listed = service.snippet_list().await.unwrap();
    let names = listed["snippets"]
        .as_array()
        .unwrap()
        .iter()
        .map(|item| item["name"].as_str().unwrap())
        .collect::<Vec<_>>();
    assert!(names.contains(&"fleet_activity"));
    assert!(names.contains(&"fleet_health"));
    assert!(names.contains(&"fleet_library_sizes"));
    assert!(names.contains(&"fleet_transcode_load"));
    let health = service
        .snippet_run("fleet_health", &serde_json::Value::Null)
        .await
        .unwrap();
    assert!(health["result"].is_array());
    assert!(service.snippet_delete("fleet_health").await.is_err());
}
