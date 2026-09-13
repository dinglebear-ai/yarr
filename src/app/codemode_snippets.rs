//! Persisted Code Mode snippet lifecycle.

use std::path::{Path, PathBuf};

use anyhow::Result;
use serde_json::{Value, json};

use super::CodeModeCallGuard;
use crate::{
    app::YarrService,
    codemode::{self, CODEMODE_MAX_CODE_BYTES},
};

impl YarrService {
    fn snippet_store_root(&self) -> Result<PathBuf> {
        self.data_dir().map(Path::to_path_buf).ok_or_else(|| {
            anyhow::anyhow!("snippets are unavailable: no data dir is configured for this server")
        })
    }

    pub async fn snippet_list(&self) -> Result<Value> {
        let result = (|| {
            let dir = self.snippet_store_root()?;
            let snippets =
                codemode::store::list(&dir).map_err(|error| anyhow::anyhow!("{error}"))?;
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

    pub(crate) fn snippet_source_for_preflight(&self, name: &str) -> Result<String> {
        let dir = self.snippet_store_root()?;
        codemode::store::load_source(&dir, name).map_err(|error| anyhow::anyhow!("{error}"))
    }

    async fn snippet_run_inner(
        &self,
        name: &str,
        input: &Value,
        guard: Option<std::sync::Arc<dyn CodeModeCallGuard>>,
    ) -> Result<Value> {
        let source = self.snippet_source_for_preflight(name)?;
        let input_json = serde_json::to_string(input).map_err(|error| {
            anyhow::anyhow!("snippet input is not serializable as JSON: {error}")
        })?;
        Box::pin(self.run_script(&source, Some(input_json), true, guard)).await
    }

    pub async fn snippet_delete(&self, name: &str) -> Result<Value> {
        let result = (|| {
            let dir = self.snippet_store_root()?;
            let existed =
                codemode::store::delete(&dir, name).map_err(|error| anyhow::anyhow!("{error}"))?;
            Ok(json!({ "deleted": existed, "name": name }))
        })();
        record_snippet_operation("delete", &result);
        result
    }
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
