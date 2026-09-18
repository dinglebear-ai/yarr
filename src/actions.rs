//! Action layer facade.
//!
//! The action surface is split into submodules to keep every file <500 LOC and
//! to make the curated-command registry data-driven (so each capability bead
//! appends a const slice rather than editing a giant enum):
//!
//!   - [`model`]    — `YarrAction`, `ActionSpec`, `ValidationError`, scopes
//!   - [`registry`] — `ACTION_SPECS`, name/scope lookups, the `CommandDescriptor`
//!     table, and `action_allowed_for_kind` validation
//!   - [`parse`]    — shared param extractors + `YarrAction` construction
//!   - [`dispatch`] — `execute_service_action`
//!   - [`help`]     — `rest_help`
//!
//! All previously top-level items are re-exported here so `crate::actions::*`
//! imports across `cli.rs` and `mcp/*` resolve unchanged.

pub mod commands;
pub mod dispatch;
pub mod help;
pub mod model;
pub mod parse;
pub mod registry;

// ── re-exports: stable `crate::actions::` surface ───────────────────────────────

pub(crate) use dispatch::ActionClassification;
pub(crate) use dispatch::classify_action;
pub use dispatch::execute_service_action;
pub use help::rest_help;
#[cfg(test)]
pub use model::DENY_SCOPE;
pub use model::{
    ActionSpec, ActionTransport, READ_SCOPE, ValidationError, WRITE_SCOPE, YarrAction,
    is_validation_error, scopes_satisfy,
};
#[allow(unused_imports)]
pub use registry::{
    ACTION_SPECS, CommandDescriptor, CommandFuture, CommandHandler, action_allowed_for_kind,
    action_has_route_dependent_safety, action_is_destructive, action_may_mutate, action_names,
    action_spec, actions_for_curated_param, all_action_names, allowed_kind_names_for_action,
    capability_digest, curated_command, curated_command_names, curated_commands,
    curated_param_names, is_known_action, is_rest_action, mcp_only_action_names,
    required_params_for_action, required_scope_for_action, rest_action_names,
    valid_actions_for_kind,
};

#[cfg(test)]
#[path = "actions_tests.rs"]
mod tests;
