//! Snippet store: persisted, named, reusable Code Mode scripts.
//!
//! Each snippet is one atomic JSON record under
//! `<data_dir>/codemode/snippets/<name>.json`. Legacy split `.js` + metadata
//! records remain readable and are replaced by the atomic format on the next
//! save. All filesystem + name-validation logic lives here.
//!
//! Security (S7): the snippet name is the ONLY caller-controlled filename
//! component. [`validate_snippet_name`] is the sole, sufficient control — it
//! allowlists `[A-Za-z0-9._-]`, forbids a leading dot, `..`, and any path
//! separator, so `dir.join("<name>.json")` is always a direct child of the store
//! dir (no traversal possible). No symlink/canonicalize dance is claimed.

use std::path::{Path, PathBuf};
use std::sync::atomic::{AtomicU64, Ordering};

use serde::{Deserialize, Serialize};

use super::{CODEMODE_MAX_SNIPPET_NAME_LEN, CODEMODE_SNIPPETS_SUBDIR};

/// Metadata persisted alongside a snippet's source (`<name>.json`).
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct SnippetMeta {
    pub name: String,
    #[serde(default)]
    pub description: Option<String>,
    /// Source size at save time.
    #[serde(default)]
    pub bytes: u64,
}

#[derive(Debug, Serialize, Deserialize)]
struct SnippetRecord {
    meta: SnippetMeta,
    code: String,
}

static SAVE_SEQUENCE: AtomicU64 = AtomicU64::new(0);

/// Validate a caller-supplied snippet name. Allowlist-only; fail-closed.
pub fn validate_snippet_name(name: &str) -> Result<(), String> {
    if name.is_empty() {
        return Err("snippet name must not be empty".to_string());
    }
    if name.len() > CODEMODE_MAX_SNIPPET_NAME_LEN {
        return Err(format!(
            "snippet name is too long (max {CODEMODE_MAX_SNIPPET_NAME_LEN})"
        ));
    }
    if name.starts_with('.') {
        return Err("snippet name must not start with a dot".to_string());
    }
    if name.contains("..") {
        return Err("snippet name must not contain `..`".to_string());
    }
    if !name
        .chars()
        .all(|c| c.is_ascii_alphanumeric() || matches!(c, '.' | '_' | '-'))
    {
        return Err("snippet name may only contain letters, digits, `.`, `_`, `-`".to_string());
    }
    Ok(())
}

/// The snippets directory under the data dir.
pub fn snippets_dir(data_dir: &Path) -> PathBuf {
    data_dir.join(CODEMODE_SNIPPETS_SUBDIR)
}

fn source_path(data_dir: &Path, name: &str) -> PathBuf {
    snippets_dir(data_dir).join(format!("{name}.js"))
}

fn meta_path(data_dir: &Path, name: &str) -> PathBuf {
    snippets_dir(data_dir).join(format!("{name}.json"))
}

/// Save (create or overwrite) one atomic snippet record. The temporary file is
/// written and synced in the destination directory before the final rename, so
/// readers observe either the prior complete record or the new complete record.
pub fn save(
    data_dir: &Path,
    name: &str,
    code: &str,
    description: Option<&str>,
) -> Result<SnippetMeta, String> {
    validate_snippet_name(name)?;
    if crate::fleet::snippets::get(name).is_some() {
        return Err(format!("protected snippet `{name}` cannot be overwritten"));
    }
    let dir = snippets_dir(data_dir);
    std::fs::create_dir_all(&dir).map_err(|e| format!("could not create snippets dir: {e}"))?;
    let meta = SnippetMeta {
        name: name.to_string(),
        description: description.map(str::to_string),
        bytes: code.len() as u64,
    };
    let record = SnippetRecord {
        meta: meta.clone(),
        code: code.to_owned(),
    };
    let encoded = serde_json::to_vec_pretty(&record)
        .map_err(|e| format!("could not encode snippet record: {e}"))?;
    let sequence = SAVE_SEQUENCE.fetch_add(1, Ordering::Relaxed);
    let temporary = dir.join(format!(".{name}.{}.{}.tmp", std::process::id(), sequence));
    let result = (|| -> Result<(), String> {
        use std::io::Write as _;
        let mut file = std::fs::OpenOptions::new()
            .create_new(true)
            .write(true)
            .open(&temporary)
            .map_err(|e| format!("could not create temporary snippet record: {e}"))?;
        file.write_all(&encoded)
            .and_then(|()| file.sync_all())
            .map_err(|e| format!("could not persist temporary snippet record: {e}"))?;
        std::fs::rename(&temporary, meta_path(data_dir, name))
            .map_err(|e| format!("could not commit snippet record: {e}"))?;
        Ok(())
    })();
    if result.is_err() {
        let _ = std::fs::remove_file(&temporary);
    }
    result?;
    // A successful atomic save supersedes a legacy split record.
    let _ = std::fs::remove_file(source_path(data_dir, name));
    Ok(meta)
}

/// List saved snippets (metadata only), sorted by name. Corrupt atomic records
/// are reported. Legacy split records are accepted only when their `.js` source
/// exists, so corruption cannot be silently synthesized away.
pub fn list(data_dir: &Path) -> Result<Vec<SnippetMeta>, String> {
    let dir = snippets_dir(data_dir);
    let mut out: Vec<SnippetMeta> = Vec::new();
    let entries = match std::fs::read_dir(&dir) {
        Ok(entries) => entries,
        Err(e) if e.kind() == std::io::ErrorKind::NotFound => return Ok(out),
        Err(e) => return Err(format!("could not read snippets dir: {e}")),
    };
    for entry in entries.flatten() {
        let path = entry.path();
        if path.extension().and_then(|e| e.to_str()) != Some("json") {
            continue;
        }
        let Some(name) = path.file_stem().and_then(|s| s.to_str()) else {
            continue;
        };
        // Allowlist-gate on read too: a manually-dropped file with an invalid name
        // is skipped (it could never be loaded by name anyway).
        if validate_snippet_name(name).is_err() {
            continue;
        }
        let raw = std::fs::read_to_string(&path)
            .map_err(|e| format!("could not read snippet `{name}`: {e}"))?;
        let meta = match serde_json::from_str::<SnippetRecord>(&raw) {
            Ok(record) => record.meta,
            Err(record_error) if source_path(data_dir, name).is_file() => {
                serde_json::from_str::<SnippetMeta>(&raw).map_err(|meta_error| {
                    format!(
                        "snippet `{name}` is corrupt: record error: {record_error}; metadata error: {meta_error}"
                    )
                })?
            }
            Err(error) => return Err(format!("snippet `{name}` is corrupt: {error}")),
        };
        if meta.name != name {
            return Err(format!(
                "snippet `{name}` is corrupt: record name is `{}`",
                meta.name
            ));
        }
        out.push(meta);
    }
    out.sort_by(|a, b| a.name.cmp(&b.name));
    Ok(out)
}

/// Load a snippet's source by name.
pub fn load_source(data_dir: &Path, name: &str) -> Result<String, String> {
    validate_snippet_name(name)?;
    match std::fs::read_to_string(meta_path(data_dir, name)) {
        Ok(raw) => match serde_json::from_str::<SnippetRecord>(&raw) {
            Ok(record) if record.meta.name == name => Ok(record.code),
            Ok(_) => Err(format!("snippet `{name}` has mismatched record metadata")),
            Err(_) => std::fs::read_to_string(source_path(data_dir, name))
                .map_err(|_| format!("snippet `{name}` is corrupt")),
        },
        Err(_) => std::fs::read_to_string(source_path(data_dir, name))
            .map_err(|_| format!("no snippet named `{name}`")),
    }
}

/// Delete a snippet's source + metadata. Returns true if the source existed.
pub fn delete(data_dir: &Path, name: &str) -> Result<bool, String> {
    validate_snippet_name(name)?;
    if crate::fleet::snippets::get(name).is_some() {
        return Err(format!("protected snippet `{name}` cannot be deleted"));
    }
    let record = meta_path(data_dir, name);
    let src = source_path(data_dir, name);
    let existed = record.exists() || src.exists();
    for path in [&record, &src] {
        match std::fs::remove_file(path) {
            Ok(()) => {}
            Err(error) if error.kind() == std::io::ErrorKind::NotFound => {}
            Err(error) => return Err(format!("could not delete snippet: {error}")),
        }
    }
    Ok(existed)
}

#[cfg(test)]
#[path = "store_tests.rs"]
mod tests;
