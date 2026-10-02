//! Action registry: the SSOT for the generic action specs and the data-driven
//! curated-command descriptor table.
//!
//! Generic (infrastructure) actions live in [`ACTION_SPECS`]. Curated commands
//! live in the [`curated_commands`] table (a runtime concat of per-capability
//! const slices) of [`CommandDescriptor`]s — NOT enum variants — so each
//! capability bead can append a const slice at one extension point without
//! editing a giant match/enum (keeps every file <500 LOC and avoids merge
//! collisions between parallel beads).

use serde_json::Value;

use super::model::{ActionSpec, ActionTransport, DENY_SCOPE, READ_SCOPE, WRITE_SCOPE};
use crate::app::YarrService;
use crate::capability::Capability;

// ── generic action specs ────────────────────────────────────────────────────────

pub const ACTION_SPECS: &[ActionSpec] = &[
    ActionSpec {
        name: "service_status",
        description: "Call the configured service's default status endpoint.",
        required_scope: Some(READ_SCOPE),
        transport: ActionTransport::Any,
        required_params: &["service"],
        optional_params: &[],
        mutates: false,
        destructive: false,
    },
    ActionSpec {
        name: "api_get",
        description: "Run a generic request only when its exact route resolves to a reviewed generated operation.",
        required_scope: Some(WRITE_SCOPE),
        transport: ActionTransport::Any,
        required_params: &["service", "path"],
        optional_params: &[],
        // GET alone is not safety evidence; the matched operation can be a mutation.
        mutates: true,
        destructive: false,
    },
    ActionSpec {
        name: "api_post",
        description: "Run a generic JSON request only when its exact route resolves to a reviewed generated operation.",
        required_scope: Some(WRITE_SCOPE),
        transport: ActionTransport::Any,
        required_params: &["service", "path"],
        optional_params: &["body"],
        mutates: true,
        destructive: false,
    },
    ActionSpec {
        name: "api_put",
        description: "Run a generic JSON request only when its exact route resolves to a reviewed generated operation.",
        required_scope: Some(WRITE_SCOPE),
        transport: ActionTransport::Any,
        required_params: &["service", "path"],
        optional_params: &["body"],
        mutates: true,
        destructive: false,
    },
    ActionSpec {
        name: "api_delete",
        description: "Run a generic request only when its exact route resolves to a reviewed generated operation.",
        required_scope: Some(WRITE_SCOPE),
        transport: ActionTransport::Any,
        required_params: &["service", "path"],
        optional_params: &["body"],
        mutates: true,
        // Destructiveness is determined by the resolved operation, never DELETE alone.
        destructive: false,
    },
    ActionSpec {
        name: "help",
        description: "Return registry-derived action help.",
        required_scope: None,
        transport: ActionTransport::Any,
        required_params: &[],
        optional_params: &[],
        mutates: false,
        destructive: false,
    },
    // Code Mode: run a JS script that calls yarr actions. MCP-only (a powerful
    // surface, not a casual REST passthrough; the CLI reaches it via the infra
    // verb path). Requires write scope since the script can perform writes,
    // including destructive deletes. Direct CLI runs use the local trust
    // boundary; MCP runs install an inner-action scope/elicitation guard.
    ActionSpec {
        name: "codemode",
        description: "Run a bounded JavaScript orchestration script.",
        required_scope: Some(WRITE_SCOPE),
        transport: ActionTransport::McpOnly,
        required_params: &["code"],
        optional_params: &[],
        mutates: true,
        destructive: false,
    },
    // Generated OpenAPI operation dispatch for the spec-backed kinds. MCP/Code-Mode
    // only (the agent reaches it via the generated `<service>.<op>()` callables).
    // Scope and destructive confirmation derive from the resolved operation's
    // reviewed metadata, not from its generated name or HTTP method.
    ActionSpec {
        name: "op",
        description: "Dispatch a generated OpenAPI operation using its reviewed safety metadata.",
        required_scope: Some(WRITE_SCOPE),
        transport: ActionTransport::McpOnly,
        required_params: &["service", "op"],
        optional_params: &["args"],
        mutates: true,
        destructive: false,
    },
    // Snippet store verbs — persisted reusable Code Mode scripts. MCP-only (CLI via
    // the `snippet` infra verb). `snippet_list` is read; save/run/delete are write.
    // Deletes are mutating-not-destructive (operator source, recoverable), so none
    // are treated as destructive.
    ActionSpec {
        name: "snippet_list",
        description: "List saved Code Mode snippets.",
        required_scope: Some(READ_SCOPE),
        transport: ActionTransport::McpOnly,
        required_params: &[],
        optional_params: &[],
        mutates: false,
        destructive: false,
    },
    ActionSpec {
        name: "snippet_save",
        description: "Atomically save a named Code Mode snippet.",
        required_scope: Some(WRITE_SCOPE),
        transport: ActionTransport::McpOnly,
        required_params: &["name", "code"],
        optional_params: &["description"],
        mutates: true,
        destructive: false,
    },
    ActionSpec {
        name: "snippet_run",
        description: "Run a saved Code Mode snippet.",
        required_scope: Some(WRITE_SCOPE),
        transport: ActionTransport::McpOnly,
        required_params: &["name"],
        optional_params: &["input"],
        mutates: true,
        destructive: false,
    },
    ActionSpec {
        name: "snippet_delete",
        description: "Delete a saved Code Mode snippet.",
        required_scope: Some(WRITE_SCOPE),
        transport: ActionTransport::McpOnly,
        required_params: &["name"],
        optional_params: &[],
        mutates: true,
        destructive: false,
    },
];

pub fn action_names() -> Vec<&'static str> {
    ACTION_SPECS.iter().map(|spec| spec.name).collect()
}

pub fn is_known_action(action: &str) -> bool {
    ACTION_SPECS.iter().any(|spec| spec.name == action) || curated_command(action).is_some()
}

pub fn rest_action_names() -> Vec<&'static str> {
    ACTION_SPECS
        .iter()
        .filter(|spec| spec.transport == ActionTransport::Any)
        .map(|spec| spec.name)
        .collect()
}

#[allow(dead_code)]
pub fn is_rest_action(action: &str) -> bool {
    action_spec(action)
        .map(|spec| spec.transport == ActionTransport::Any)
        .unwrap_or(false)
}

pub fn mcp_only_action_names() -> Vec<&'static str> {
    ACTION_SPECS
        .iter()
        .filter(|spec| spec.transport == ActionTransport::McpOnly)
        .map(|spec| spec.name)
        .collect()
}

pub fn required_scope_for_action(action: &str) -> Option<&'static str> {
    if let Some(spec) = action_spec(action) {
        return spec.required_scope;
    }
    if let Some(cmd) = curated_command(action) {
        return Some(cmd.required_scope);
    }
    Some(DENY_SCOPE)
}

pub fn action_spec(action: &str) -> Option<&'static ActionSpec> {
    ACTION_SPECS.iter().find(|spec| spec.name == action)
}

// ── curated command descriptor table (data-driven, not an enum) ──────────────────

/// The JSON type a curated-command param is advertised as in the MCP tool schema.
///
/// This is the SSOT for "what JSON type does this param accept" (P2-4). The schema
/// generator in the MCP schema properties module derives each curated param's
/// `type` (and `items` for arrays) from this enum instead of a hand-written match,
/// so a new non-string param can no longer silently fall back to `string` under
/// `additionalProperties:false`. The variants mirror the parse extractors in
/// [`crate::actions::parse`]: `String`→`string_arg`/`optional_string`,
/// `Integer`→`i64_arg`/`optional_i64`, `IntegerArray`→`i64_array_arg`,
/// `StringArray`→`string_array_arg`, `Boolean`→`bool_arg`.
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum ParamType {
    String,
    Integer,
    IntegerArray,
    StringArray,
    Boolean,
}

impl ParamType {
    /// The JSON Schema type fragment for this param type, as a [`serde_json::Value`].
    pub fn json_schema_type(self) -> Value {
        match self {
            ParamType::String => serde_json::json!({ "type": "string" }),
            ParamType::Integer => serde_json::json!({ "type": "integer" }),
            ParamType::Boolean => serde_json::json!({ "type": "boolean" }),
            ParamType::IntegerArray => {
                serde_json::json!({ "type": "array", "items": { "type": "integer" } })
            }
            ParamType::StringArray => {
                serde_json::json!({ "type": "array", "items": { "type": "string" } })
            }
        }
    }
}

/// Future of a curated command handler.
pub type CommandFuture<'a> =
    std::pin::Pin<Box<dyn std::future::Future<Output = anyhow::Result<Value>> + Send + 'a>>;

/// Handler signature for a curated command: borrows the service + args, returns a
/// boxed future. Boxing cost is negligible for network-bound calls.
pub type CommandHandler = for<'a> fn(&'a YarrService, &'a Value) -> CommandFuture<'a>;

/// Static description of a curated, capability-scoped command. This is the SSOT
/// from which schema fragments, USAGE/HELP text, scope, and validation are all
/// derived (LD2).
///
/// `Copy` so per-capability const slices can be concatenated into the runtime
/// [`curated_commands`] table by value without clone bookkeeping (every field is
/// `Copy`: string slices, an enum, bools, and a fn pointer).
#[derive(Clone, Copy)]
pub struct CommandDescriptor {
    pub name: &'static str,
    pub capability: Capability,
    pub description: &'static str,
    pub required_scope: &'static str,
    pub required_params: &'static [&'static str],
    pub optional_params: &'static [&'static str],
    /// Whether this command is a *destructive* delete.
    ///
    /// `destructive` is metadata only — nothing in the app layer refuses to run
    /// a destructive action, and there is no `confirm` parameter anywhere. On
    /// the MCP surface, `destructive` drives an elicitation prompt
    /// (`src/mcp/elicit.rs::gate_destructive`) before dispatch, including inner
    /// Code Mode calls. Direct CLI execution retains its local trust boundary.
    /// The flag also drives schema/help annotations and is the SSOT for
    /// [`action_is_destructive`].
    pub destructive: bool,
    pub mutates: bool,
    /// The advertised JSON type of every param this command accepts
    /// (both required and optional), as `(param_name, ParamType)`.
    ///
    /// This is kept as a SEPARATE typed list rather than re-typing
    /// `required_params`/`optional_params` (which stay `&[&str]`) because the
    /// dispatch-time required-param enforcement in `actions::parse` iterates
    /// those slices as plain `&[&str]`. The
    /// schema generator derives each curated param's JSON type from this list
    /// (P2-4), so a non-string param can no longer silently fall back to
    /// `string`. Every name in `required_params`/`optional_params` (except the
    /// always-string `service`, which is declared globally) MUST appear here with
    /// the type matching its parse extractor — `tests::typed_params_cover_declared_params`
    /// in `registry_tests.rs` enforces that, and a `properties_tests.rs` test
    /// asserts the advertised schema type matches.
    pub typed_params: &'static [(&'static str, ParamType)],
    pub handler: CommandHandler,
}

/// THE single extension point for curated commands.
///
/// Each capability bead defines a per-capability const slice of
/// [`CommandDescriptor`]s under `src/actions/commands/<cap>.rs` and appends it to
/// the `concat` list below. This is the ONLY place to touch when adding a
/// capability's commands — every consumer (lookup, names, scope, schema, help,
/// validation, dispatch) flows through `curated_commands()`.
///
/// All six capability slices are registered (see the `registries` array in the
/// body): `ARR_COMMANDS`, `INDEXER_COMMANDS`, `DOWNLOAD_COMMANDS`,
/// `MEDIA_COMMANDS`, `REQUEST_COMMANDS`, and `STATS_COMMANDS`. A new capability
/// adds its slice to that array and nowhere else.
fn build_curated_commands() -> Vec<CommandDescriptor> {
    use crate::actions::commands::{
        DOWNLOAD_COMMANDS, STATS_COMMANDS, SUBTITLES_COMMANDS, TRACE_COMMANDS,
    };

    // ── capability beads append their const slice here ───────────────────────
    // The spec-backed capabilities (arr/indexer/requests/media_server) have NO
    // curated commands — they are served entirely by generated OpenAPI operations.
    let registries: &[&[CommandDescriptor]] = &[
        DOWNLOAD_COMMANDS,
        STATS_COMMANDS,
        SUBTITLES_COMMANDS,
        TRACE_COMMANDS,
    ];

    registries
        .iter()
        .flat_map(|slice| slice.iter().copied())
        .collect()
}

/// All curated commands, concatenated from every capability slice once. The
/// data-driven equivalent of the F1 empty curated const, now non-empty.
pub fn curated_commands() -> &'static [CommandDescriptor] {
    static CURATED: std::sync::OnceLock<Vec<CommandDescriptor>> = std::sync::OnceLock::new();
    CURATED.get_or_init(build_curated_commands)
}

/// Lookup a curated command by name.
pub fn curated_command(name: &str) -> Option<&'static CommandDescriptor> {
    curated_commands().iter().find(|cmd| cmd.name == name)
}

#[path = "registry_queries.rs"]
mod queries;
pub use queries::{
    action_allowed_for_kind, action_has_route_dependent_safety, action_is_destructive,
    action_may_mutate, actions_for_curated_param, all_action_names, allowed_kind_names_for_action,
    capability_digest, curated_command_names, curated_param_names, curated_param_type,
    required_params_for_action, valid_actions_for_kind,
};

#[cfg(test)]
#[path = "registry_tests.rs"]
mod tests;
