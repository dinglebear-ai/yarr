//! Environment overlays, dotenv parsing, and legacy environment migration.

use std::{
    cell::RefCell,
    collections::BTreeMap,
    path::Path,
    sync::{Mutex, OnceLock},
};

use super::resolve_data_dir;

thread_local! {
    static LOAD_ENV_OVERLAY: RefCell<Option<BTreeMap<String, String>>> = const { RefCell::new(None) };
}

static PLUGIN_ENV_OVERLAY: OnceLock<Mutex<BTreeMap<String, String>>> = OnceLock::new();

pub(crate) fn install_plugin_env_overlay(values: BTreeMap<String, String>) {
    let overlay = PLUGIN_ENV_OVERLAY.get_or_init(|| Mutex::new(BTreeMap::new()));
    *overlay
        .lock()
        .unwrap_or_else(std::sync::PoisonError::into_inner) = values;
}

pub(crate) fn env_value(key: &str) -> Option<String> {
    overlay_value(key).or_else(|| std::env::var(key).ok())
}

/// Read a value only from the installed configuration overlay. Fleet credential
/// references use this path so parsing cannot bypass the loaded overlay and read
/// ambient process state directly.
pub(crate) fn overlay_value(key: &str) -> Option<String> {
    LOAD_ENV_OVERLAY.with(|overlay| {
        overlay
            .borrow()
            .as_ref()
            .and_then(|values| values.get(key).cloned())
    })
}

pub(super) struct EnvOverlayGuard(Option<BTreeMap<String, String>>);

impl EnvOverlayGuard {
    pub(super) fn install(values: BTreeMap<String, String>) -> Self {
        let previous = LOAD_ENV_OVERLAY.with(|overlay| overlay.replace(Some(values)));
        Self(previous)
    }
}

impl Drop for EnvOverlayGuard {
    fn drop(&mut self) {
        let previous = self.0.take();
        LOAD_ENV_OVERLAY.with(|overlay| {
            overlay.replace(previous);
        });
    }
}

pub(super) fn load_env_overlay() -> anyhow::Result<BTreeMap<String, String>> {
    // Snapshot injectable process values first so consumers that require the
    // installed overlay (fleet credential references) see the same precedence as
    // ordinary configuration reads without consulting ambient process state.
    let mut overlay = std::env::vars()
        .filter(|(key, _)| is_injectable_env_key(key))
        .collect::<BTreeMap<_, _>>();
    overlay.extend(migrate_legacy_process_env()?);
    for (key, value) in load_dotenv_defaults()? {
        if std::env::var_os(&key).is_none() {
            overlay.entry(key).or_insert(value);
        }
    }
    if let Some(plugin) = PLUGIN_ENV_OVERLAY.get() {
        for (key, value) in plugin
            .lock()
            .unwrap_or_else(std::sync::PoisonError::into_inner)
            .iter()
        {
            overlay.insert(key.clone(), value.clone());
        }
    }
    Ok(overlay)
}

pub(super) fn load_dotenv_defaults() -> anyhow::Result<BTreeMap<String, String>> {
    let data_dir = resolve_data_dir()?;
    migrate_legacy_dotenv(&data_dir)?;
    let path = data_dir.join(".env");
    let contents = match std::fs::read_to_string(&path) {
        Ok(contents) => contents,
        Err(error) if error.kind() == std::io::ErrorKind::NotFound => return Ok(BTreeMap::new()),
        Err(error) => anyhow::bail!("Failed to read {}: {error}", path.display()),
    };
    apply_dotenv_contents(&path, &contents)
}

fn apply_dotenv_contents(path: &Path, contents: &str) -> anyhow::Result<BTreeMap<String, String>> {
    let mut pending = BTreeMap::new();
    for (line_no, raw_line) in contents.lines().enumerate() {
        let line = raw_line.trim();
        if line.is_empty() || line.starts_with('#') {
            continue;
        }
        let Some((key, raw_value)) = line.split_once('=') else {
            anyhow::bail!("{}:{}: expected KEY=VALUE", path.display(), line_no + 1);
        };
        let key = key.trim();
        if key.is_empty() || key.contains(char::is_whitespace) || key.contains('\0') {
            anyhow::bail!("{}:{}: invalid env key", path.display(), line_no + 1);
        }
        if !is_injectable_env_key(key) {
            tracing::warn!(key, file = %path.display(), "ignoring unsupported key in .env; only YARR_*, legacy RUSTARR_*, and RUST_LOG are loaded");
            continue;
        }
        let target_key = migrated_env_key(key);
        let value = parse_dotenv_value(raw_value.trim())?;
        if value.contains('\0') {
            anyhow::bail!(
                "{}:{}: env value contains a null byte",
                path.display(),
                line_no + 1
            );
        }
        if let Some(existing) = pending.get(&target_key)
            && existing != &value
        {
            anyhow::bail!(
                "{}:{}: conflicting values for {target_key} after legacy key migration",
                path.display(),
                line_no + 1
            );
        }
        pending.insert(target_key, value);
    }
    Ok(pending)
}

pub(super) fn is_injectable_env_key(key: &str) -> bool {
    key.starts_with("YARR_") || key.starts_with("RUSTARR_") || key == "RUST_LOG"
}

fn migrated_env_key(key: &str) -> String {
    key.strip_prefix("RUSTARR_")
        .map(|suffix| format!("YARR_{suffix}"))
        .unwrap_or_else(|| key.to_owned())
}

fn migrate_legacy_process_env() -> anyhow::Result<BTreeMap<String, String>> {
    let mut overlay = BTreeMap::new();
    for (legacy_key, legacy_value) in
        std::env::vars().filter(|(key, _)| key.starts_with("RUSTARR_"))
    {
        let yarr_key = migrated_env_key(&legacy_key);
        match std::env::var(&yarr_key) {
            Ok(value) if value != legacy_value => anyhow::bail!(
                "conflicting legacy env {legacy_key} and new env {yarr_key}; unset one or make them match"
            ),
            Ok(_) => {}
            Err(std::env::VarError::NotPresent) => {
                tracing::warn!(
                    legacy = legacy_key,
                    target = yarr_key,
                    "using legacy RUSTARR_* environment variable during yarr migration"
                );
                overlay.insert(yarr_key, legacy_value);
            }
            Err(std::env::VarError::NotUnicode(_)) => {
                anyhow::bail!("legacy env {legacy_key} contains non-unicode data");
            }
        }
    }
    Ok(overlay)
}

pub(super) fn migrate_legacy_dotenv(data_dir: &Path) -> anyhow::Result<()> {
    let yarr_dotenv = data_dir.join(".env");
    if yarr_dotenv.exists() {
        return Ok(());
    }
    let Some(home) = std::env::var_os("HOME") else {
        return Ok(());
    };
    let legacy_dotenv = std::path::PathBuf::from(home).join(".rustarr/.env");
    if !legacy_dotenv.exists() {
        return Ok(());
    }
    let contents = std::fs::read_to_string(&legacy_dotenv).map_err(|error| {
        anyhow::anyhow!(
            "Failed to read legacy env {}: {error}",
            legacy_dotenv.display()
        )
    })?;
    let migrated = contents
        .lines()
        .map(|line| {
            if line.trim_start().starts_with('#') {
                return line.to_owned();
            }
            line.split_once('=').map_or_else(
                || line.to_owned(),
                |(key, value)| format!("{}={value}", migrated_env_key(key.trim())),
            )
        })
        .collect::<Vec<_>>()
        .join("\n");
    std::fs::create_dir_all(data_dir)
        .map_err(|error| anyhow::anyhow!("Failed to create {}: {error}", data_dir.display()))?;
    let tmp = data_dir.join(".env.migrating");
    write_private_file(&tmp, format!("{migrated}\n").as_bytes())
        .map_err(|error| anyhow::anyhow!("Failed to write {}: {error}", tmp.display()))?;
    std::fs::rename(&tmp, &yarr_dotenv).map_err(|error| {
        anyhow::anyhow!(
            "Failed to install migrated env {}: {error}",
            yarr_dotenv.display()
        )
    })?;
    tracing::warn!(legacy = %legacy_dotenv.display(), target = %yarr_dotenv.display(), "migrated legacy rustarr .env to yarr appdata");
    Ok(())
}

#[cfg(unix)]
fn write_private_file(path: &Path, contents: &[u8]) -> std::io::Result<()> {
    use std::io::Write;
    use std::os::unix::fs::OpenOptionsExt;
    let mut file = std::fs::OpenOptions::new()
        .write(true)
        .create_new(true)
        .mode(0o600)
        .open(path)?;
    file.write_all(contents)
}

#[cfg(not(unix))]
fn write_private_file(path: &Path, contents: &[u8]) -> std::io::Result<()> {
    std::fs::write(path, contents)
}

fn parse_dotenv_value(raw: &str) -> anyhow::Result<String> {
    if raw.len() < 2 || !raw.starts_with('"') || !raw.ends_with('"') {
        return Ok(raw.to_owned());
    }
    let mut output = String::new();
    let mut chars = raw[1..raw.len() - 1].chars();
    while let Some(ch) = chars.next() {
        if ch != '\\' {
            output.push(ch);
            continue;
        }
        match chars.next() {
            Some('"') => output.push('"'),
            Some('\\') => output.push('\\'),
            Some('n') => output.push('\n'),
            Some(other) => {
                output.push('\\');
                output.push(other);
            }
            None => output.push('\\'),
        }
    }
    Ok(output)
}

#[cfg(test)]
#[path = "environment_tests.rs"]
mod tests;
