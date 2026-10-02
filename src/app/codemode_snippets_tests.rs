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
    let remaining = service.snippet_list().await.unwrap();
    let remaining = remaining["snippets"].as_array().unwrap();
    assert!(
        !remaining.iter().any(|snippet| snippet["name"] == "greet"),
        "the user snippet is gone"
    );
    assert_eq!(
        remaining.len(),
        crate::fleet::snippets::builtins().len(),
        "only the canonical builtins remain listed"
    );
}

#[tokio::test]
async fn builtin_snippets_are_listed_and_run_without_a_store() {
    // Builtins ship in the binary: no data dir, no saved snippets, still usable.
    let service = loopback_state().service;
    let listed = service.snippet_list().await.unwrap();
    let names: Vec<&str> = listed["snippets"]
        .as_array()
        .unwrap()
        .iter()
        .map(|snippet| snippet["name"].as_str().unwrap())
        .collect();
    for builtin in crate::fleet::snippets::builtins() {
        assert!(names.contains(&builtin.name), "missing {}", builtin.name);
    }

    let out = service
        .snippet_run("fleet_health", &serde_json::json!({}))
        .await
        .unwrap();
    let results = out["result"].as_array().expect("fleet status array");
    assert_eq!(results.len(), 1, "stub config has one service");
    assert_eq!(results[0]["service"], "sonarr");
    // Every real leaf action is audited individually.
    assert_eq!(out["calls"][0]["action"], "service_status");
    assert_eq!(out["calls"][0]["service"], "sonarr");
}

#[tokio::test]
async fn builtin_names_are_protected_from_save_and_delete() {
    let tmp = tempfile::tempdir().unwrap();
    let service = loopback_state()
        .service
        .with_data_dir(tmp.path().to_path_buf());
    let save_error = service
        .snippet_save("fleet_health", "async () => 1", None)
        .await
        .expect_err("builtin names are reserved");
    assert!(
        save_error.to_string().contains("cannot be overwritten"),
        "{save_error:#}"
    );
    let delete_error = service
        .snippet_delete("fleet_health")
        .await
        .expect_err("builtin names are reserved");
    assert!(
        delete_error.to_string().contains("cannot be deleted"),
        "{delete_error:#}"
    );
}

#[tokio::test]
async fn pre_existing_user_snippet_with_builtin_name_is_shadowed() {
    // A user snippet saved under a builtin name before the name was reserved
    // must not override the canonical builtin, and its files stay on disk.
    let tmp = tempfile::tempdir().unwrap();
    let data_dir = tmp.path().to_path_buf();
    let user_code = "async () => ({ marker: 'USER_COPY' })";
    let snippets_dir = crate::codemode::store::snippets_dir(&data_dir);
    std::fs::create_dir_all(&snippets_dir).unwrap();
    let record = serde_json::json!({
        "meta": { "name": "fleet_health", "description": "user copy", "bytes": user_code.len() },
        "code": user_code,
    });
    let json_path = snippets_dir.join("fleet_health.json");
    let js_path = snippets_dir.join("fleet_health.js");
    std::fs::write(&json_path, serde_json::to_vec_pretty(&record).unwrap()).unwrap();
    std::fs::write(&js_path, user_code).unwrap();

    let service = loopback_state().service.with_data_dir(data_dir.clone());
    let listed = service.snippet_list().await.unwrap();
    let entries: Vec<&serde_json::Value> = listed["snippets"]
        .as_array()
        .unwrap()
        .iter()
        .filter(|snippet| snippet["name"] == "fleet_health")
        .collect();
    assert_eq!(entries.len(), 1, "exactly one canonical entry");
    assert_eq!(
        entries[0]["description"].as_str().unwrap(),
        crate::fleet::snippets::get("fleet_health")
            .unwrap()
            .description,
        "the builtin wins the name"
    );

    let out = service
        .snippet_run("fleet_health", &serde_json::json!({}))
        .await
        .unwrap();
    assert!(
        out["result"].is_array(),
        "the builtin source ran, not the user copy: {out}"
    );

    assert!(
        json_path.is_file() && js_path.is_file(),
        "user files untouched"
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
