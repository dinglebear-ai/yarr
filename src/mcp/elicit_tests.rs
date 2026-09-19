//! Tests for the destructive-delete elicitation gate.
//!
//! The peer round-trip is not exercised here (it needs a live client); instead we
//! cover the pure decision surface: the prompt text, the `normalize`
//! accept/refuse mapping over the constructible `Ok` arms, and the full
//! `classify` decision (including fail-closed `Unsupported → Declined`). The `Err` arms of `normalize` use rmcp's
//! `#[non_exhaustive]` `ElicitationError`, which a downstream crate cannot
//! construct, so they are covered by review + the trivial match rather than a
//! unit test.

use super::*;

#[test]
fn confirm_message_names_action_and_service() {
    let msg = confirm_message("delete", "sonarr");
    assert!(msg.contains("delete"));
    assert!(msg.contains("sonarr"));
    assert!(msg.contains("cannot be undone"));
}

// ── normalize: rmcp Ok result → ElicitOutcome (Err arms not constructible) ───────

#[test]
fn normalize_accept_with_confirm_true_is_confirmed() {
    assert_eq!(
        normalize(Ok(Some(DeleteConfirmation { confirm: true }))),
        ElicitOutcome::Confirmed
    );
}

#[test]
fn normalize_accept_with_confirm_false_refuses() {
    assert_eq!(
        normalize(Ok(Some(DeleteConfirmation { confirm: false }))),
        ElicitOutcome::Refused
    );
}

#[test]
fn normalize_empty_content_refuses() {
    assert_eq!(normalize(Ok(None)), ElicitOutcome::Refused);
}

// ── classify: ElicitOutcome → DeleteGate (the gate decision, fully covered) ──────

#[test]
fn classify_confirmed_proceeds() {
    assert_eq!(classify(ElicitOutcome::Confirmed), DeleteGate::Proceed);
}

#[test]
fn classify_refused_declines() {
    assert_eq!(classify(ElicitOutcome::Refused), DeleteGate::Declined);
}

#[test]
fn classify_unsupported_declines() {
    assert_eq!(classify(ElicitOutcome::Unsupported), DeleteGate::Declined);
}

// ── fleet batch prompt: lists exactly the frozen destructive set ─────────────

#[test]
fn fleet_message_lists_every_leaf_exactly_once() {
    let leaves = vec![
        crate::fleet::FleetLeafLabel {
            service: "sonarr".to_owned(),
            action: "api_post".to_owned(),
        },
        crate::fleet::FleetLeafLabel {
            service: "radarr".to_owned(),
            action: "delete_movie_by_id".to_owned(),
        },
    ];
    let message = super::confirm_fleet_message(&leaves);
    assert!(message.contains("2 destructive operation(s)"), "{message}");
    assert!(message.contains("- 'api_post' on 'sonarr'"), "{message}");
    assert!(
        message.contains("- 'delete_movie_by_id' on 'radarr'"),
        "{message}"
    );
    // Exactness: the prompt names the set and nothing wider — no service-wide
    // or wildcard wording that could read as a broader grant.
    assert!(message.contains("exactly these calls"), "{message}");
    for widening in ["all destructive", "any destructive", "any operation"] {
        assert!(!message.contains(widening), "{message}");
    }
}
