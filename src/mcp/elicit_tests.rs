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
    let msg = confirm_message("delete", &["sonarr".to_owned()]);
    assert!(msg.contains("delete"));
    assert!(msg.contains("sonarr"));
    assert!(msg.contains("cannot be undone"));
}

#[test]
fn fleet_confirmation_is_single_sorted_prompt_naming_every_instance() {
    let msg = confirm_message(
        "terminate_session",
        &["plex_den".to_owned(), "plex_4k".to_owned()],
    );
    assert!(msg.contains("2 instances"), "{msg}");
    assert!(msg.contains("plex_4k, plex_den"), "{msg}");
}

#[test]
fn destructive_target_cap_fails_closed_before_prompting() {
    let error = validate_destructive_targets(
        &[
            "plex_a".to_owned(),
            "plex_b".to_owned(),
            "plex_c".to_owned(),
        ],
        2,
    )
    .unwrap_err();
    assert!(error.contains("maximum is 2"));
    assert!(error.contains("target explicitly"));
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
