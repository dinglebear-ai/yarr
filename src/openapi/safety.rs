//! Authoritative safety classification for generated OpenAPI operations.
//!
//! Every non-GET generated operation is classified here before execution. DELETE
//! operations are destructive by policy; POST/PUT/PATCH rows are an audited table
//! derived from the current generated registry and validated against it.

use crate::config::ServiceKind;

use super::{HttpMethod, OperationSpec, find_operation, operations_for_kind};

/// Safety authority consumed by generated execution and MCP elicitation.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct OperationSafety {
    pub mutates: bool,
    pub destructive: bool,
    pub elicitation_required: bool,
}

impl OperationSafety {
    const READ_ONLY: Self = Self {
        mutates: false,
        destructive: false,
        elicitation_required: false,
    };
    const MUTATION: Self = Self {
        mutates: true,
        destructive: false,
        elicitation_required: false,
    };
    const DESTRUCTIVE: Self = Self {
        mutates: true,
        destructive: true,
        elicitation_required: true,
    };
}

#[derive(Clone, Copy)]
pub(super) struct SafetyRow {
    kind: ServiceKind,
    operation: &'static str,
    destructive: bool,
}

impl SafetyRow {
    const fn new(kind: ServiceKind, operation: &'static str, destructive: bool) -> Self {
        Self {
            kind,
            operation,
            destructive,
        }
    }
}

// This table is deliberately exhaustive for generated POST/PUT/PATCH operations.
// Regeneration drift is rejected by validate_generated_write_classification().
mod jellyfin;
mod overseerr;
mod plex;
mod prowlarr;
mod radarr;
mod sonarr;
const AUDITED_WRITE_GROUPS: &[&[SafetyRow]] = &[
    jellyfin::ROWS,
    overseerr::ROWS,
    plex::ROWS,
    prowlarr::ROWS,
    radarr::ROWS,
    sonarr::ROWS,
];

fn audited_writes() -> impl Iterator<Item = &'static SafetyRow> {
    AUDITED_WRITE_GROUPS.iter().flat_map(|rows| rows.iter())
}

/// Find the authoritative safety classification for a known generated operation.
pub fn operation_safety(kind: ServiceKind, operation: &str) -> Option<OperationSafety> {
    let spec = find_operation(kind, operation)?;
    classify_operation(kind, spec).ok()
}

/// Classify one generated operation. Unknown generated writes fail closed.
pub fn classify_operation(
    kind: ServiceKind,
    spec: &OperationSpec,
) -> Result<OperationSafety, String> {
    match spec.method {
        HttpMethod::Get => Ok(OperationSafety::READ_ONLY),
        HttpMethod::Delete => Ok(OperationSafety::DESTRUCTIVE),
        HttpMethod::Post | HttpMethod::Put | HttpMethod::Patch => audited_writes()
            .find(|row| row.kind == kind && row.operation == spec.name)
            .map(|row| {
                if row.destructive {
                    OperationSafety::DESTRUCTIVE
                } else {
                    OperationSafety::MUTATION
                }
            })
            .ok_or_else(|| {
                format!(
                    "unclassified generated write: kind={} operation={}",
                    kind.as_str(),
                    spec.name
                )
            }),
    }
}

/// Prove the audited table covers exactly every generated POST/PUT/PATCH.
pub fn validate_generated_write_classification() -> Result<(), String> {
    for row in audited_writes() {
        let spec = find_operation(row.kind, row.operation).ok_or_else(|| {
            format!(
                "stale generated write classification: kind={} operation={}",
                row.kind.as_str(),
                row.operation
            )
        })?;
        if !matches!(
            spec.method,
            HttpMethod::Post | HttpMethod::Put | HttpMethod::Patch
        ) {
            return Err(format!(
                "non-write generated classification: kind={} operation={} method={}",
                row.kind.as_str(),
                row.operation,
                spec.method.as_str()
            ));
        }
        if audited_writes()
            .filter(|candidate| candidate.kind == row.kind && candidate.operation == row.operation)
            .count()
            != 1
        {
            return Err(format!(
                "duplicate generated write classification: kind={} operation={}",
                row.kind.as_str(),
                row.operation
            ));
        }
    }

    for kind in ServiceKind::ALL {
        for spec in operations_for_kind(kind) {
            if matches!(
                spec.method,
                HttpMethod::Post | HttpMethod::Put | HttpMethod::Patch
            ) {
                classify_operation(kind, spec)?;
            }
        }
    }
    Ok(())
}
