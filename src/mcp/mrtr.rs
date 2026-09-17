//! SEP-2322 multi-round-trip destructive confirmation for MCP 2026-07-28.
//!
//! Modern MCP requests are stateless. Confirmation therefore cannot use a
//! server-initiated request on a retained Peer; instead the server returns an
//! InputRequiredResult and the client retries the original tools/call with an
//! inputResponses entry plus the opaque requestState handle.

use std::{
    collections::HashMap,
    sync::{Mutex, OnceLock},
    time::{Duration, Instant},
};

use base64::{Engine as _, engine::general_purpose::URL_SAFE_NO_PAD};
use lab_auth::AuthContext;
use rmcp::{
    ErrorData, RoleServer,
    model::{
        ElicitRequest, ElicitRequestParams, ElicitResult, ElicitationAction, ElicitationSchema,
        InputRequest, InputRequests, InputRequiredResult, InputResponses, ProtocolVersion,
    },
    service::RequestContext,
};
use serde_json::{Value, json};

const CONFIRM_INPUT: &str = "confirm";
const PENDING_TTL: Duration = Duration::from_secs(300);
const MAX_PENDING: usize = 256;

#[derive(Debug)]
struct PendingDestructiveCall {
    created_at: Instant,
    principal: Option<String>,
    tool_name: String,
    action: String,
    arguments: Value,
}

fn pending() -> &'static Mutex<HashMap<String, PendingDestructiveCall>> {
    static PENDING: OnceLock<Mutex<HashMap<String, PendingDestructiveCall>>> = OnceLock::new();
    PENDING.get_or_init(|| Mutex::new(HashMap::new()))
}

pub(crate) enum DeleteGate {
    Legacy,
    InputRequired(InputRequiredResult),
    Proceed,
    Declined,
}

pub(crate) fn gate_destructive(
    context: &RequestContext<RoleServer>,
    auth: Option<&AuthContext>,
    tool_name: &str,
    action: &str,
    arguments: &Value,
    request_state: Option<&str>,
    input_responses: Option<&InputResponses>,
) -> Result<DeleteGate, ErrorData> {
    let modern = context
        .protocol_version()
        .is_some_and(|version| version >= ProtocolVersion::V_2026_07_28);
    if !modern {
        return Ok(DeleteGate::Legacy);
    }

    if !supports_form_elicitation(context) {
        return Ok(DeleteGate::Declined);
    }

    let principal = auth.map(|auth| auth.sub.clone());
    match request_state {
        None => {
            if input_responses.is_some() {
                return Err(ErrorData::invalid_params(
                    "inputResponses requires the requestState from the preceding input_required result",
                    None,
                ));
            }
            let handle = insert_pending(PendingDestructiveCall {
                created_at: Instant::now(),
                principal,
                tool_name: tool_name.to_owned(),
                action: action.to_owned(),
                arguments: arguments.clone(),
            })?;
            Ok(DeleteGate::InputRequired(input_required(
                action,
                tool_name,
                handle,
            )?))
        }
        Some(handle) => resume_pending(
            handle,
            principal.as_deref(),
            tool_name,
            action,
            arguments,
            input_responses,
        ),
    }
}

fn supports_form_elicitation(context: &RequestContext<RoleServer>) -> bool {
    context
        .client_capabilities()
        .and_then(|capabilities| capabilities.elicitation)
        .is_some_and(|elicitation| {
            elicitation.form.is_some()
                || (elicitation.form.is_none() && elicitation.url.is_none())
        })
}

fn insert_pending(call: PendingDestructiveCall) -> Result<String, ErrorData> {
    let mut store = pending().lock().map_err(|_| {
        ErrorData::internal_error("MRTR destructive-confirmation state is unavailable", None)
    })?;
    prune_expired(&mut store);
    if store.len() >= MAX_PENDING {
        return Err(ErrorData::internal_error(
            "too many pending destructive confirmations",
            None,
        ));
    }
    for _ in 0..4 {
        let handle = random_handle()?;
        if !store.contains_key(&handle) {
            store.insert(handle.clone(), call);
            return Ok(handle);
        }
    }
    Err(ErrorData::internal_error(
        "could not allocate unique destructive-confirmation state",
        None,
    ))
}

fn resume_pending(
    handle: &str,
    principal: Option<&str>,
    tool_name: &str,
    action: &str,
    arguments: &Value,
    input_responses: Option<&InputResponses>,
) -> Result<DeleteGate, ErrorData> {
    let mut store = pending().lock().map_err(|_| {
        ErrorData::internal_error("MRTR destructive-confirmation state is unavailable", None)
    })?;
    prune_expired(&mut store);

    let Some(saved) = store.get(handle) else {
        return Err(ErrorData::invalid_params(
            "requestState is unknown, expired, or already consumed",
            None,
        ));
    };
    if saved.principal.as_deref() != principal
        || saved.tool_name != tool_name
        || saved.action != action
        || saved.arguments != *arguments
    {
        store.remove(handle);
        return Err(ErrorData::invalid_params(
            "requestState does not belong to this authenticated tool call",
            None,
        ));
    }

    let Some(response) = input_responses.and_then(|responses| responses.get(CONFIRM_INPUT)) else {
        drop(store);
        return Ok(DeleteGate::InputRequired(input_required(
            action,
            tool_name,
            handle.to_owned(),
        )?));
    };

    let elicitation: ElicitResult = serde_json::from_value(response.clone()).map_err(|_| {
        store.remove(handle);
        ErrorData::invalid_params("invalid destructive-confirmation input response", None)
    })?;
    let confirmed = matches!(elicitation.action, ElicitationAction::Accept)
        && elicitation
            .content
            .as_ref()
            .and_then(|content| content.get("confirm"))
            .and_then(Value::as_bool)
            == Some(true);

    // Consume before dispatch. If the client retries after losing the execution
    // response, the same confirmation can never execute the mutation twice.
    store.remove(handle);
    if confirmed {
        Ok(DeleteGate::Proceed)
    } else {
        Ok(DeleteGate::Declined)
    }
}

fn input_required(
    action: &str,
    tool_name: &str,
    request_state: String,
) -> Result<InputRequiredResult, ErrorData> {
    let requested_schema: ElicitationSchema = serde_json::from_value(json!({
        "type": "object",
        "properties": {
            "confirm": {
                "type": "boolean",
                "description": "Set true to authorize this destructive operation"
            }
        },
        "required": ["confirm"]
    }))
    .map_err(|error| ErrorData::internal_error(error.to_string(), None))?;
    let mut requests = InputRequests::new();
    requests.insert(
        CONFIRM_INPUT.to_owned(),
        InputRequest::Elicitation(ElicitRequest::new(
            ElicitRequestParams::FormElicitationParams {
                meta: None,
                message: super::elicit::confirm_message(action, tool_name),
                requested_schema,
            },
        )),
    );
    Ok(InputRequiredResult::new(Some(requests), Some(request_state)))
}

fn random_handle() -> Result<String, ErrorData> {
    let mut bytes = [0_u8; 32];
    getrandom::fill(&mut bytes).map_err(|error| {
        ErrorData::internal_error(
            format!("failed to allocate destructive-confirmation state: {error}"),
            None,
        )
    })?;
    Ok(URL_SAFE_NO_PAD.encode(bytes))
}

fn prune_expired(store: &mut HashMap<String, PendingDestructiveCall>) {
    store.retain(|_, call| call.created_at.elapsed() <= PENDING_TTL);
}
