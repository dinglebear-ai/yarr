//! Application-layer admission for generic upstream passthroughs (`api_*`).
//!
//! Every generic call — from the CLI, the MCP shims, Code Mode, or a direct
//! caller of [`crate::app::YarrService`] — is admitted here before any upstream
//! request can be built. Admission is exact and fail-closed:
//!
//! - the raw path must pass [`crate::yarr::validate_safe_path`];
//! - query text is stripped for route identity only (never decoded, so an
//!   encoded separator like `%2F` stays a single segment);
//! - exactly one generated `(method, path-template)` pair must match for the
//!   configured kind — unmatched or ambiguous routes deny the call.
//!
//! The matched operation's reviewed [`OperationSafety`] is the single source of
//! per-route read/write/destructive policy: `ReadOnly` admits read scope,
//! `Mutation`/`Destructive` require write scope, and only `Destructive` asks
//! the MCP transports for confirmation. HTTP verbs establish none of this.

use anyhow::{Result, anyhow};

use crate::config::ServiceKind;
use crate::openapi::{HttpMethod, OperationSafety, operations_for_kind};

/// Resolve a generic `(method, raw path)` call to the reviewed safety of the
/// single generated operation it addresses, or fail closed.
///
/// Route identity ignores query text only; the raw path is what validation and
/// transport receive, so `%2F`-style encoding is never re-interpreted as a
/// segment separator.
pub(crate) fn classify_generic_route(
    kind: ServiceKind,
    method: HttpMethod,
    path: &str,
) -> Result<OperationSafety> {
    crate::yarr::validate_safe_path(path)?;
    let route = path.split_once('?').map_or(path, |(route, _)| route);
    let matches = operations_for_kind(kind)
        .iter()
        .filter(|spec| spec.method == method && path_matches_template(route, spec.path))
        .collect::<Vec<_>>();
    match matches.as_slice() {
        [spec] => Ok(spec.safety),
        [] => Err(anyhow!(
            "generic {} `{route}` has no unique generated operation match for kind={}",
            method.as_str(),
            kind.as_str()
        )),
        _ => Err(anyhow!(
            "generic {} `{route}` has an ambiguous generated operation match for kind={}",
            method.as_str(),
            kind.as_str()
        )),
    }
}

/// Match path segments without decoding. Placeholders may occupy part of a
/// segment (`stream.{container}`), not just an entire segment.
pub(crate) fn path_matches_template(path: &str, template: &str) -> bool {
    path.split('/')
        .zip(template.split('/'))
        .all(|(value, pattern)| segment_matches_template(value, pattern))
        && path.split('/').count() == template.split('/').count()
}

fn segment_matches_template(value: &str, pattern: &str) -> bool {
    let mut rest = pattern;
    let mut value_rest = value;
    while let Some(open) = rest.find('{') {
        let literal = &rest[..open];
        let Some(after_literal) = value_rest.strip_prefix(literal) else {
            return false;
        };
        let Some(close) = rest[open + 1..].find('}') else {
            return false;
        };
        let after_placeholder = &rest[open + close + 2..];
        let next_literal = after_placeholder.split('{').next().unwrap_or_default();
        if next_literal.is_empty() {
            if after_literal.is_empty() {
                return false;
            }
            value_rest = "";
        } else {
            let Some(index) = after_literal.find(next_literal) else {
                return false;
            };
            if index == 0 {
                return false;
            }
            value_rest = &after_literal[index..];
        }
        rest = after_placeholder;
    }
    value_rest == rest
}

#[cfg(test)]
#[path = "safety_tests.rs"]
mod tests;
