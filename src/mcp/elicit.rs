//! Destructive-action elicitation gate (MCP-only).
//!
//! Operations classified [`crate::openapi::OperationSafety::Destructive`] get a
//! real, interactive confirmation prompt on the MCP surface via *elicitation*
//! (rmcp [`Peer::elicit_with_timeout`]). Before a destructive action dispatches,
//! the server asks the connected client to confirm. There is no reusable grant or
//! argument-based bypass: the client must actually answer for that concrete call.
//! A client without elicitation capability fails closed; this remote protocol
//! surface never treats missing confirmation as approval.
//!
//! This lives in the MCP protocol layer (not `tools.rs` / the app layer) because
//! elicitation needs the client [`Peer`], exactly like the scope checks in
//! `rmcp_server.rs`. `tools.rs` stays a thin dispatcher.

use std::time::Duration;

use rmcp::{
    RoleServer,
    service::{ElicitationError, Peer},
};
use schemars::JsonSchema;
use serde::Deserialize;

/// Max time to wait for the user to answer a destructive-operation prompt. On
/// expiry the elicit call returns a timeout error which `normalize` treats as
/// `Refused` — a stuck prompt fails safe instead of holding the request open
/// indefinitely.
const ELICIT_TIMEOUT: Duration = Duration::from_secs(300);

/// Structured payload requested from the user for a destructive operation. A
/// single boolean: the client renders a confirm prompt from the generated schema.
/// `Accept` with `confirm=true` proceeds; anything else aborts.
#[derive(Debug, Deserialize, JsonSchema)]
pub(crate) struct DeleteConfirmation {
    /// Set true to confirm and run this destructive operation.
    pub confirm: bool,
}

rmcp::elicit_safe!(DeleteConfirmation);

/// How a destructive action should be handled on the MCP surface.
#[derive(Debug, PartialEq, Eq)]
pub(crate) enum DeleteGate {
    /// The user explicitly approved the elicitation prompt.
    Proceed,
    /// The user declined/cancelled (or the prompt failed) — do NOT run it.
    Declined,
}

/// The outcome of an elicitation round-trip, normalized away from rmcp's
/// `Result<Option<_>, ElicitationError>`. This intermediate exists so the gate
/// decision ([`classify`]) is a pure, fully unit-testable function: rmcp's
/// `ElicitationError` is `#[non_exhaustive]` and cannot be constructed by a
/// downstream crate, so the error arms of [`normalize`] are not directly
/// testable — but everything downstream of this enum is.
#[derive(Debug, PartialEq, Eq)]
enum ElicitOutcome {
    /// User explicitly approved (`confirm = true`).
    Confirmed,
    /// Fail-safe bucket: user declined/cancelled, sent `confirm=false`/no content,
    /// or the prompt failed for any reason (parse/transport/timeout).
    Refused,
    /// The client does not support elicitation at all.
    Unsupported,
}

/// The elicitation prompt shown to the user before a destructive operation.
pub(crate) fn confirm_message(action: &str, service: &str) -> String {
    format!(
        "Confirm destructive action '{action}' on service '{service}'. This permanently \
         deletes data and cannot be undone. Approve to proceed."
    )
}

/// Pure decision: map a normalized [`ElicitOutcome`] to a [`DeleteGate`]. Fully
/// unit-testable (no `Peer`, no rmcp error types).
fn classify(outcome: ElicitOutcome) -> DeleteGate {
    match outcome {
        ElicitOutcome::Confirmed => DeleteGate::Proceed,
        ElicitOutcome::Refused | ElicitOutcome::Unsupported => DeleteGate::Declined,
    }
}

/// Normalize an rmcp elicit result to an [`ElicitOutcome`]. The non-`Confirmed`
/// collapse is the fail-safe default: anything other than an explicit
/// `confirm=true` (decline, cancel, empty, parse/transport error, timeout)
/// becomes `Refused`; only a declared missing capability is `Unsupported`. The
/// `Ok` arms are unit-tested; the `Err` arms cannot be (non-constructible
/// `#[non_exhaustive]` error), so they are kept to a trivial, obviously-safe
/// match.
fn normalize(result: Result<Option<DeleteConfirmation>, ElicitationError>) -> ElicitOutcome {
    match result {
        Ok(Some(DeleteConfirmation { confirm: true })) => ElicitOutcome::Confirmed,
        Ok(Some(DeleteConfirmation { confirm: false })) | Ok(None) => ElicitOutcome::Refused,
        Err(ElicitationError::CapabilityNotSupported) => ElicitOutcome::Unsupported,
        Err(_) => ElicitOutcome::Refused,
    }
}

/// Gate a destructive `action` targeting `service` on the MCP surface.
///
/// 1. Client can't elicit → [`DeleteGate::Declined`] (fail closed).
/// 2. Otherwise prompt (with a timeout) and map the outcome ([`normalize`] +
///    [`classify`]) — there is no way to skip this prompt from the call
///    arguments.
pub(crate) async fn gate_destructive(
    peer: &Peer<RoleServer>,
    action: &str,
    service: &str,
) -> DeleteGate {
    if peer.supported_elicitation_modes().is_empty() {
        return DeleteGate::Declined;
    }
    let result = peer
        .elicit_with_timeout::<DeleteConfirmation>(
            confirm_message(action, service),
            Some(ELICIT_TIMEOUT),
        )
        .await;
    classify(normalize(result))
}

#[cfg(test)]
#[path = "elicit_tests.rs"]
mod tests;
