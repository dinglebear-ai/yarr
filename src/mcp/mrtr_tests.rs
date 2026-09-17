use super::*;

#[test]
fn request_state_handles_are_random_256_bit_base64url_values() {
    let first = random_handle().expect("first handle");
    let second = random_handle().expect("second handle");

    assert_ne!(first, second);
    assert_eq!(URL_SAFE_NO_PAD.decode(first.as_bytes()).unwrap().len(), 32);
    assert_eq!(URL_SAFE_NO_PAD.decode(second.as_bytes()).unwrap().len(), 32);
}

#[test]
fn expired_pending_confirmations_are_pruned() {
    let mut store = HashMap::new();
    store.insert(
        "expired".to_owned(),
        PendingDestructiveCall {
            created_at: Instant::now() - PENDING_TTL - Duration::from_secs(1),
            principal: None,
            tool_name: "sonarr".to_owned(),
            action: "api_delete".to_owned(),
            arguments: json!({"path": "/api/v3/series/1"}),
            targets: vec!["sonarr:api_delete:/api/v3/series/1".to_owned()],
        },
    );
    store.insert(
        "fresh".to_owned(),
        PendingDestructiveCall {
            created_at: Instant::now(),
            principal: None,
            tool_name: "sonarr".to_owned(),
            action: "api_delete".to_owned(),
            arguments: json!({"path": "/api/v3/series/2"}),
            targets: vec!["sonarr:api_delete:/api/v3/series/2".to_owned()],
        },
    );

    prune_expired(&mut store);

    assert!(!store.contains_key("expired"));
    assert!(store.contains_key("fresh"));
}

#[test]
fn confirmation_targets_are_sorted_deduplicated_and_bounded() {
    let normalized = normalize_targets(&[
        "b".to_owned(),
        "a".to_owned(),
        "a".to_owned(),
    ])
    .unwrap();
    assert_eq!(normalized, vec!["a", "b"]);
    assert!(normalize_targets(&[]).is_err());
    assert!(normalize_targets(&vec!["x".to_owned(); MAX_CONFIRMATION_TARGETS + 1]).is_err());
}
