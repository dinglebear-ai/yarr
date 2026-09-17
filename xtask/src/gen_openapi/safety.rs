//! Reviewed safety-manifest parsing and source-identity validation.

use std::collections::{BTreeMap, BTreeSet};

use anyhow::{Context, Result, bail};
use serde::Deserialize;

use super::OperationOut;

#[cfg(test)]
#[derive(Debug, Clone, PartialEq, Eq, PartialOrd, Ord)]
pub(super) struct SafetyIdentity {
    kind: String,
    operation_id: Option<String>,
    method: String,
    path: String,
}

#[cfg(test)]
impl SafetyIdentity {
    pub(super) fn new(kind: &str, operation_id: Option<&str>, method: &str, path: &str) -> Self {
        Self {
            kind: kind.to_string(),
            operation_id: operation_id.map(str::to_string),
            method: method.to_string(),
            path: path.to_string(),
        }
    }
}

#[derive(Debug, Clone)]
pub(super) struct SafetyCandidate {
    operation_id: Option<String>,
    method: String,
    path: String,
}

impl SafetyCandidate {
    pub(super) fn from_operation(operation: &OperationOut) -> Self {
        Self {
            operation_id: operation.operation_id.clone(),
            method: operation.method.clone(),
            path: operation.path.clone(),
        }
    }

    #[cfg(test)]
    pub(super) fn operation_id(operation_id: &str, method: &str, path: &str) -> Self {
        Self {
            operation_id: Some(operation_id.to_string()),
            method: method.to_string(),
            path: path.to_string(),
        }
    }

    #[cfg(test)]
    pub(super) fn method_path(method: &str, path: &str) -> Self {
        Self {
            operation_id: None,
            method: method.to_string(),
            path: path.to_string(),
        }
    }

    #[cfg(test)]
    pub(super) fn is_operation_id_keyed(&self) -> bool {
        self.operation_id.is_some()
    }

    #[cfg(test)]
    pub(super) fn identity(&self, kind: &str) -> SafetyIdentity {
        SafetyIdentity::new(kind, self.operation_id.as_deref(), &self.method, &self.path)
    }
}

#[derive(Debug, Clone)]
pub(super) struct SafetyRow {
    pub safety: String,
}

#[cfg(test)]
pub(super) fn validate_safety_manifest(
    service: &str,
    operations: &[OperationOut],
    text: &str,
    candidates: &[SafetyCandidate],
) -> Result<BTreeMap<(String, String), SafetyRow>> {
    validate_safety_manifest_for_services(service, &[service], operations, text, candidates)
}

pub(super) fn validate_safety_manifest_for_services(
    service: &str,
    known_services: &[&str],
    operations: &[OperationOut],
    text: &str,
    candidates: &[SafetyCandidate],
) -> Result<BTreeMap<(String, String), SafetyRow>> {
    let manifest = parse_manifest(text)?;
    let mut resolved = BTreeMap::new();
    let mut identities = BTreeSet::new();

    for row in &manifest.operation {
        validate_row(row)?;
        if !known_services.contains(&row.kind.as_str()) {
            bail!("unknown safety manifest service kind `{}`", row.kind);
        }
    }

    for row in manifest
        .operation
        .into_iter()
        .filter(|row| row.kind == service)
    {
        let matching = match row.operation_id.as_deref() {
            Some(operation_id) => operations
                .iter()
                .filter(|operation| operation.operation_id.as_deref() == Some(operation_id))
                .collect::<Vec<_>>(),
            None => operations
                .iter()
                .filter(|operation| {
                    operation.operation_id.is_none()
                        && operation.method == row.method
                        && operation.path == row.path
                })
                .collect::<Vec<_>>(),
        };
        if matching.len() != 1 {
            bail!(
                "safety manifest row for {service} {} {} resolves to {} operations",
                row.method,
                row.path,
                matching.len()
            );
        }
        let operation = matching[0];
        if operation.method != row.method || operation.path != row.path {
            bail!(
                "safety manifest source identity drift for {service} {} {}",
                row.method,
                row.path
            );
        }
        let is_reviewed_candidate = candidates.iter().any(|candidate| {
            candidate.operation_id == row.operation_id
                && candidate.method == row.method
                && candidate.path == row.path
        });
        if !is_reviewed_candidate && !is_permitted_non_candidate(service, &row) {
            bail!(
                "unconsumed safety manifest row for {service} {} {}",
                row.method,
                row.path
            );
        }
        let identity = (
            row.operation_id.clone(),
            row.method.clone(),
            row.path.clone(),
        );
        if !identities.insert(identity) {
            bail!(
                "duplicate safety manifest row for {service} {} {}",
                row.method,
                row.path
            );
        }
        if resolved
            .insert((row.method, row.path), SafetyRow { safety: row.safety })
            .is_some()
        {
            bail!("duplicate safety manifest method/path row for {service}");
        }
    }

    for candidate in candidates {
        let identity = (candidate.method.clone(), candidate.path.clone());
        let reviewed = resolved.contains_key(&identity)
            && operations.iter().any(|operation| {
                operation.method == candidate.method
                    && operation.path == candidate.path
                    && operation.operation_id == candidate.operation_id
            });
        if !reviewed {
            bail!(
                "unreviewed safety candidate {} {} for {service}",
                candidate.method,
                candidate.path
            );
        }
    }
    Ok(resolved)
}

/// The audited inventory intentionally includes one operation whose source ID
/// does not match the candidate selector's review triggers. Keep this exception
/// source-identity-pinned so all other source-valid but unconsumed rows fail.
fn is_permitted_non_candidate(service: &str, row: &ManifestRow) -> bool {
    matches!(
        (
            service,
            row.operation_id.as_deref(),
            row.method.as_str(),
            row.path.as_str(),
        ),
        (
            "plex",
            Some("terminateSession"),
            "POST",
            "/status/sessions/terminate",
        )
    )
}

#[cfg(test)]
pub(super) fn manifest_identities(text: &str) -> Result<BTreeSet<SafetyIdentity>> {
    Ok(parse_manifest(text)?
        .operation
        .into_iter()
        .map(|row| SafetyIdentity {
            kind: row.kind,
            operation_id: row.operation_id,
            method: row.method,
            path: row.path,
        })
        .collect())
}

fn parse_manifest(text: &str) -> Result<Manifest> {
    toml::from_str(text).context("parsing safety manifest TOML")
}

fn validate_row(row: &ManifestRow) -> Result<()> {
    if row.reason.trim().is_empty() {
        bail!(
            "safety manifest row for {} has an empty review reason",
            row.kind
        );
    }
    if row
        .operation_id
        .as_deref()
        .is_some_and(|operation_id| operation_id.trim().is_empty())
    {
        bail!("safety manifest operation_id must not be blank");
    }
    if row.method != row.method.to_ascii_uppercase() {
        bail!("safety manifest methods must be uppercase");
    }
    if !matches!(row.safety.as_str(), "ReadOnly" | "Mutation" | "Destructive") {
        bail!(
            "safety manifest row for {} has invalid safety `{}`",
            row.kind,
            row.safety
        );
    }
    Ok(())
}

#[derive(Debug, Deserialize)]
#[serde(deny_unknown_fields)]
struct Manifest {
    operation: Vec<ManifestRow>,
}

#[derive(Debug, Deserialize)]
#[serde(deny_unknown_fields)]
struct ManifestRow {
    kind: String,
    operation_id: Option<String>,
    method: String,
    path: String,
    safety: String,
    reason: String,
}
