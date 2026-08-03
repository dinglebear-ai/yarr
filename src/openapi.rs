//! Generated OpenAPI operation surface (runtime side).
//!
//! For the 6 spec-backed services (Sonarr, Radarr, Prowlarr, Overseerr, Jellyfin,
//! Plex) the entire upstream API — every operation and every component type — is
//! **generated from the vendored OpenAPI specs** under `specs/` by
//! `cargo xtask gen-openapi`, not hand-written. This module holds the runtime
//! shapes the generated tables fill in ([`OperationSpec`], [`TypeDef`]), the
//! per-kind registry, and the generic executor that turns one
//! `(service, op, args)` call into an upstream request.
//!
//! Discovery (`codemode.search`/`describe`) and the per-service callable namespace
//! are driven entirely off these tables, so adding/refreshing a service is a
//! regeneration step — there is no hand-rolled curated command or model for these
//! kinds.

use serde_json::Value;

use crate::config::ServiceKind;

// Generated tables (one module per spec-backed service). Each provides
// `pub static OPERATIONS: &[OperationSpec]` and `pub static TYPES: &[TypeDef]`.
pub mod generated;
mod safety;

pub use safety::{OperationSafety, classify_operation, operation_safety, validate_write_inventory};

#[cfg(test)]
#[path = "openapi_tests.rs"]
mod tests;

#[cfg(test)]
#[path = "openapi/safety_tests.rs"]
mod safety_tests;

/// HTTP method for a generated upstream operation.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum HttpMethod {
    Get,
    Post,
    Put,
    Delete,
    Patch,
}

impl HttpMethod {
    pub const fn as_str(self) -> &'static str {
        match self {
            Self::Get => "GET",
            Self::Post => "POST",
            Self::Put => "PUT",
            Self::Delete => "DELETE",
            Self::Patch => "PATCH",
        }
    }

    pub const fn is_read(self) -> bool {
        matches!(self, Self::Get)
    }

    pub const fn is_delete(self) -> bool {
        matches!(self, Self::Delete)
    }

    pub fn as_reqwest(self) -> reqwest::Method {
        match self {
            Self::Get => reqwest::Method::GET,
            Self::Post => reqwest::Method::POST,
            Self::Put => reqwest::Method::PUT,
            Self::Delete => reqwest::Method::DELETE,
            Self::Patch => reqwest::Method::PATCH,
        }
    }
}

/// One generated upstream operation — the data behind a single Code Mode callable
/// (`<service>.<name>(args)`). Path/method are spec-derived (trusted); only the
/// arg *values* are user input and are encoded at execution time.
#[derive(Debug, Clone, Copy)]
pub struct OperationSpec {
    /// Code Mode method name, e.g. `list_series`. Globally unique per service.
    pub name: &'static str,
    /// HTTP method.
    pub method: HttpMethod,
    /// Path template with `{param}` placeholders, e.g. `/api/v3/series/{id}`.
    pub path: &'static str,
    /// Compatibility projection of path parameter names. New code should use
    /// [`Self::parameters`] so requiredness and serialization are retained.
    pub path_params: &'static [&'static str],
    /// Compatibility projection of query parameter names. New code should use
    /// [`Self::parameters`].
    pub query_params: &'static [&'static str],
    /// Compatibility projection of [`Self::request_body`].
    pub has_body: bool,
    /// Every OpenAPI parameter with its wire location and serialization contract.
    pub parameters: &'static [ParameterSpec],
    /// Request-body requiredness and every declared representation.
    pub request_body: Option<RequestBodySpec>,
    /// Successful response representations, including their status/media type.
    pub responses: &'static [RepresentationSpec],
    /// Request-body component type name, if any (a key into [`TypeDef`]).
    pub request_type: Option<&'static str>,
    /// 2xx response component type name, if any (a key into [`TypeDef`]).
    pub response_type: Option<&'static str>,
    /// OpenAPI tag (used to group callables in discovery).
    pub tag: &'static str,
    /// One-line summary from the spec (operation summary/description).
    pub summary: &'static str,
}

/// OpenAPI parameter location.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum ParameterLocation {
    Path,
    Query,
    Header,
    Cookie,
}

/// OpenAPI parameter serialization style.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum ParameterStyle {
    Simple,
    Label,
    Matrix,
    Form,
    SpaceDelimited,
    PipeDelimited,
    DeepObject,
}

/// One lossless parameter row. `schema` is compact JSON so constraints and refs
/// remain available to discovery even when runtime serialization only needs the
/// value shape.
#[derive(Debug, Clone, Copy)]
pub struct ParameterSpec {
    pub name: &'static str,
    pub location: ParameterLocation,
    pub required: bool,
    pub schema: &'static str,
    pub style: ParameterStyle,
    pub explode: bool,
}

/// Request/response wire encoding selected from an OpenAPI media type.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum BodyEncoding {
    Json,
    FormUrlEncoded,
    Multipart,
    Text,
    Binary,
}

/// One media-type representation. Request rows have no `status`; response rows
/// retain the successful status key. `encoding_metadata` is compact OpenAPI JSON.
#[derive(Debug, Clone, Copy)]
pub struct RepresentationSpec {
    pub status: Option<&'static str>,
    pub media_type: &'static str,
    pub encoding: BodyEncoding,
    pub schema: &'static str,
    pub encoding_metadata: &'static str,
}

#[derive(Debug, Clone, Copy)]
pub struct RequestBodySpec {
    pub required: bool,
    pub representations: &'static [RepresentationSpec],
}

/// An operation intentionally absent from callable discovery because its wire
/// contract cannot be represented safely by the runtime.
#[derive(Debug, Clone, Copy)]
pub struct OmittedOperationSpec {
    pub name: &'static str,
    pub method: HttpMethod,
    pub path: &'static str,
    pub reason: &'static str,
}

/// One generated component type, rendered as a TypeScript interface so
/// `codemode.describe("<service>.<TypeName>")` can surface it on demand.
#[derive(Debug, Clone, Copy)]
pub struct TypeDef {
    /// Component name, e.g. `SeriesResource`.
    pub name: &'static str,
    /// The generated TypeScript interface declaration.
    pub ts: &'static str,
}

/// Whether a kind's API is generated from an OpenAPI spec (vs the doc-based,
/// hand-modeled kinds). Drives whether the per-service callable surface comes from
/// generated operations or the legacy curated commands.
pub fn is_generated(kind: ServiceKind) -> bool {
    !operations_for_kind(kind).is_empty()
}

/// The generated operations for a kind (empty for the doc-based kinds).
pub fn operations_for_kind(kind: ServiceKind) -> &'static [OperationSpec] {
    match kind {
        ServiceKind::Sonarr => generated::sonarr::OPERATIONS,
        ServiceKind::Radarr => generated::radarr::OPERATIONS,
        ServiceKind::Prowlarr => generated::prowlarr::OPERATIONS,
        ServiceKind::Overseerr => generated::overseerr::OPERATIONS,
        ServiceKind::Jellyfin => generated::jellyfin::OPERATIONS,
        ServiceKind::Plex => generated::plex::OPERATIONS,
        _ => &[],
    }
}

/// Explicit support-matrix rows for operations the generator intentionally
/// omitted from callable discovery.
pub fn omitted_operations_for_kind(kind: ServiceKind) -> &'static [OmittedOperationSpec] {
    match kind {
        ServiceKind::Sonarr => generated::sonarr::OMITTED_OPERATIONS,
        ServiceKind::Radarr => generated::radarr::OMITTED_OPERATIONS,
        ServiceKind::Prowlarr => generated::prowlarr::OMITTED_OPERATIONS,
        ServiceKind::Overseerr => generated::overseerr::OMITTED_OPERATIONS,
        ServiceKind::Jellyfin => generated::jellyfin::OMITTED_OPERATIONS,
        ServiceKind::Plex => generated::plex::OMITTED_OPERATIONS,
        _ => &[],
    }
}

/// The generated component types for a kind (empty for the doc-based kinds).
pub fn types_for_kind(kind: ServiceKind) -> &'static [TypeDef] {
    match kind {
        ServiceKind::Sonarr => generated::sonarr::TYPES,
        ServiceKind::Radarr => generated::radarr::TYPES,
        ServiceKind::Prowlarr => generated::prowlarr::TYPES,
        ServiceKind::Overseerr => generated::overseerr::TYPES,
        ServiceKind::Jellyfin => generated::jellyfin::TYPES,
        ServiceKind::Plex => generated::plex::TYPES,
        _ => &[],
    }
}

/// Look up one generated operation by kind + name.
pub fn find_operation(kind: ServiceKind, name: &str) -> Option<&'static OperationSpec> {
    operations_for_kind(kind).iter().find(|op| op.name == name)
}

/// Render a value as a string for use in a path segment or query param. Strings
/// pass through; numbers/bools stringify; everything else (objects/arrays/null)
/// yields `None` so the caller can reject it rather than send `[object Object]`.
pub fn scalar_to_string(value: &Value) -> Option<String> {
    match value {
        Value::String(s) => Some(s.clone()),
        Value::Number(n) => Some(n.to_string()),
        Value::Bool(b) => Some(b.to_string()),
        _ => None,
    }
}
