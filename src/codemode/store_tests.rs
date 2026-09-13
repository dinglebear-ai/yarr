//! Snippet store tests.

use super::*;

#[test]
fn validate_rejects_bad_names() {
    for bad in [
        "",
        "a/b",
        "a\\b",
        "../escape",
        ".hidden",
        "a..b",
        "a b",
        "a!b",
        &"x".repeat(CODEMODE_MAX_SNIPPET_NAME_LEN + 1),
    ] {
        assert!(
            validate_snippet_name(bad).is_err(),
            "expected rejection for {bad:?}"
        );
    }
}

#[test]
fn validate_accepts_good_names() {
    for ok in ["report", "my-snippet_v2.1", "ABC123", "a.b.c"] {
        assert!(validate_snippet_name(ok).is_ok(), "expected ok for {ok:?}");
    }
}

#[test]
fn save_list_load_delete_roundtrip() {
    let tmp = tempfile::tempdir().unwrap();
    let dir = tmp.path();

    let meta = save(dir, "hello", "async () => 1", Some("greet")).unwrap();
    assert_eq!(meta.name, "hello");
    assert_eq!(meta.description.as_deref(), Some("greet"));
    assert_eq!(meta.bytes, "async () => 1".len() as u64);

    let listed = list(dir).unwrap();
    assert_eq!(listed.len(), 1);
    assert_eq!(listed[0].name, "hello");
    assert_eq!(listed[0].description.as_deref(), Some("greet"));

    assert_eq!(load_source(dir, "hello").unwrap(), "async () => 1");

    assert!(delete(dir, "hello").unwrap());
    assert!(load_source(dir, "hello").is_err());
    assert!(list(dir).unwrap().is_empty());
    // Deleting a missing snippet returns false, not an error.
    assert!(!delete(dir, "hello").unwrap());
}

#[test]
fn list_empty_when_dir_absent() {
    let tmp = tempfile::tempdir().unwrap();
    assert!(list(&tmp.path().join("nope")).unwrap().is_empty());
}

#[test]
fn store_cannot_bypass_protected_fleet_snippet_names() {
    let tmp = tempfile::tempdir().unwrap();
    let save_error = save(tmp.path(), "fleet_health", "async () => null", None).unwrap_err();
    assert!(save_error.contains("protected snippet"), "{save_error}");
    let delete_error = delete(tmp.path(), "fleet_health").unwrap_err();
    assert!(delete_error.contains("protected snippet"), "{delete_error}");
}

#[test]
fn load_missing_errors() {
    let tmp = tempfile::tempdir().unwrap();
    assert!(load_source(tmp.path(), "ghost").is_err());
}

#[test]
fn save_overwrites_existing() {
    let tmp = tempfile::tempdir().unwrap();
    let dir = tmp.path();
    save(dir, "s", "async () => 1", None).unwrap();
    save(dir, "s", "async () => 2", None).unwrap();
    assert_eq!(load_source(dir, "s").unwrap(), "async () => 2");
    assert_eq!(list(dir).unwrap().len(), 1);
}

#[test]
fn save_persists_one_atomic_record_instead_of_split_source_and_metadata() {
    let tmp = tempfile::tempdir().unwrap();
    save(tmp.path(), "atomic", "async () => 42", Some("answer")).unwrap();

    let dir = snippets_dir(tmp.path());
    assert!(!dir.join("atomic.js").exists());
    let record: serde_json::Value =
        serde_json::from_slice(&std::fs::read(dir.join("atomic.json")).unwrap()).unwrap();
    assert_eq!(record["meta"]["name"], "atomic");
    assert_eq!(record["code"], "async () => 42");
}

#[test]
fn corrupt_atomic_record_is_reported_instead_of_synthesized() {
    let tmp = tempfile::tempdir().unwrap();
    let dir = snippets_dir(tmp.path());
    std::fs::create_dir_all(&dir).unwrap();
    std::fs::write(dir.join("broken.json"), b"{not json").unwrap();

    let error = list(tmp.path()).unwrap_err();
    assert!(error.contains("broken"), "{error}");
}
