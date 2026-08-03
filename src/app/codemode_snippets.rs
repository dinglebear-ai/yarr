//! Persisted Code Mode snippet lifecycle.

use std::path::{Path, PathBuf};

use anyhow::Result;
use serde_json::{Value, json};

use super::CodeModeCallGuard;
use crate::{
    app::YarrService,
    codemode::{self, CODEMODE_MAX_CODE_BYTES},
};

const BUILTIN_SNIPPETS: &[(&str, &str, &str)] = &[
    (
        "fleet_activity",
        "Current playback sessions from every Plex instance.",
        r#"async () => fleet.map("plex", s => s.list_sessions())"#,
    ),
    (
        "fleet_health",
        "Reachability and status across every configured instance.",
        r#"async () => fleet.status()"#,
    ),
    (
        "fleet_library_sizes",
        "Library section inventories from every Plex instance.",
        r#"async () => fleet.map("plex", s => s.get_sections())"#,
    ),
    (
        "fleet_transcode_load",
        "Playback sessions annotated with a per-instance transcode count.",
        r#"async () => {
            const rows = await fleet.map("plex", s => s.list_sessions());
            const count = (value) => {
                if (value == null || typeof value !== "object") return 0;
                let total = Object.prototype.hasOwnProperty.call(value, "TranscodeSession") ? 1 : 0;
                for (const child of Object.values(value)) total += count(child);
                return total;
            };
            return rows.map(row => row.ok ? Object.assign({}, row, { transcodes: count(row.value) }) : row);
        }"#,
    ),
];

impl YarrService {
    fn snippet_store_root(&self) -> Result<PathBuf> {
        self.data_dir().map(Path::to_path_buf).ok_or_else(|| {
            anyhow::anyhow!("snippets are unavailable: no data dir is configured for this server")
        })
    }

    pub async fn snippet_list(&self) -> Result<Value> {
        let result = (|| {
            let mut snippets = BUILTIN_SNIPPETS
                .iter()
                .map(|(name, description, code)| {
                    json!({
                        "name": name, "description": description,
                        "bytes": code.len(), "built_in": true,
                    })
                })
                .collect::<Vec<_>>();
            if let Ok(dir) = self.snippet_store_root() {
                snippets.extend(
                    codemode::store::list(&dir)
                        .map_err(|error| anyhow::anyhow!("{error}"))?
                        .into_iter()
                        .map(|meta| {
                            json!({
                                "name": meta.name, "description": meta.description,
                                "bytes": meta.bytes, "built_in": false,
                            })
                        }),
                );
            }
            snippets.sort_by(|left, right| left["name"].as_str().cmp(&right["name"].as_str()));
            Ok(json!({ "snippets": snippets }))
        })();
        record_snippet_operation("list", &result);
        result
    }

    pub async fn snippet_save(
        &self,
        name: &str,
        code: &str,
        description: Option<&str>,
    ) -> Result<Value> {
        let result = (|| {
            reject_builtin_name(name)?;
            if code.trim().is_empty() {
                anyhow::bail!("snippet_save requires a non-empty `code`");
            }
            if code.len() > CODEMODE_MAX_CODE_BYTES {
                anyhow::bail!("snippet `code` exceeds {CODEMODE_MAX_CODE_BYTES} bytes");
            }
            let dir = self.snippet_store_root()?;
            let metadata = codemode::store::save(&dir, name, code, description)
                .map_err(|error| anyhow::anyhow!("{error}"))?;
            Ok(json!({ "saved": metadata }))
        })();
        record_snippet_operation("save", &result);
        result
    }

    pub async fn snippet_run(&self, name: &str, input: &Value) -> Result<Value> {
        let result = self.snippet_run_inner(name, input, None).await;
        record_snippet_operation("run", &result);
        result
    }

    pub(crate) async fn snippet_run_with_guard(
        &self,
        name: &str,
        input: &Value,
        guard: Option<std::sync::Arc<dyn CodeModeCallGuard>>,
    ) -> Result<Value> {
        let result = self.snippet_run_inner(name, input, guard).await;
        record_snippet_operation("run", &result);
        result
    }

    async fn snippet_run_inner(
        &self,
        name: &str,
        input: &Value,
        guard: Option<std::sync::Arc<dyn CodeModeCallGuard>>,
    ) -> Result<Value> {
        let source = match builtin_source(name) {
            Some(source) => source.to_owned(),
            None => {
                let dir = self.snippet_store_root()?;
                codemode::store::load_source(&dir, name)
                    .map_err(|error| anyhow::anyhow!("{error}"))?
            }
        };
        let input_json = serde_json::to_string(input).map_err(|error| {
            anyhow::anyhow!("snippet input is not serializable as JSON: {error}")
        })?;
        Box::pin(self.run_script(&source, Some(input_json), true, guard)).await
    }

    pub async fn snippet_delete(&self, name: &str) -> Result<Value> {
        let result = (|| {
            reject_builtin_name(name)?;
            let dir = self.snippet_store_root()?;
            let existed =
                codemode::store::delete(&dir, name).map_err(|error| anyhow::anyhow!("{error}"))?;
            Ok(json!({ "deleted": existed, "name": name }))
        })();
        record_snippet_operation("delete", &result);
        result
    }
}

fn builtin_source(name: &str) -> Option<&'static str> {
    BUILTIN_SNIPPETS
        .iter()
        .find(|(builtin, _, _)| *builtin == name)
        .map(|(_, _, source)| *source)
}

fn reject_builtin_name(name: &str) -> Result<()> {
    if builtin_source(name).is_some() {
        anyhow::bail!("snippet `{name}` is built in and cannot be overwritten or deleted");
    }
    Ok(())
}

fn record_snippet_operation(operation: &'static str, result: &Result<Value>) {
    let outcome = if result.is_ok() { "success" } else { "error" };
    axum_prometheus::metrics::counter!(
        "yarr_snippet_operations_total",
        "operation" => operation,
        "outcome" => outcome
    )
    .increment(1);
}
