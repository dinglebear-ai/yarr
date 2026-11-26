//! OAuth / JWT auth sub-config ([`AuthConfig`], [`AuthMode`]) and its defaults.

use serde::{Deserialize, Serialize};

/// Acquire the process-lifetime lock that makes local SQLite OAuth mode
/// explicitly single-replica. Sharing SQLite over a network filesystem is not a
/// supported scaling mechanism; operators must use one replica until a shared
/// auth backend is implemented.
pub fn acquire_oauth_instance_lock(sqlite_path: &std::path::Path) -> anyhow::Result<std::fs::File> {
    use fs2::FileExt as _;

    let lock_path = std::path::PathBuf::from(format!("{}.instance.lock", sqlite_path.display()));
    if let Some(parent) = lock_path.parent() {
        std::fs::create_dir_all(parent)?;
    }
    let file = std::fs::OpenOptions::new()
        .create(true)
        .read(true)
        .write(true)
        .truncate(false)
        .open(&lock_path)?;
    file.try_lock_exclusive().map_err(|error| {
        anyhow::anyhow!(
            "OAuth local state is already owned by another yarr replica (lock {}): {error}. Run exactly one replica or disable local OAuth.",
            lock_path.display()
        )
    })?;
    Ok(file)
}

/// File name of the generated at-rest key, kept in the same directory as the
/// JWT signing key so existing volume mounts already persist it.
pub const TOKEN_ENCRYPTION_KEY_FILE: &str = "auth-token-encryption.key";

/// Resolve the OAuth at-rest encryption key.
///
/// labby-auth refuses to start OAuth mode without one. An explicitly
/// configured key wins; otherwise the key stored beside the JWT signing key is
/// reused, and generated (32 random bytes, hex, owner-only permissions) the
/// first time so upgraded deployments keep working without new configuration.
pub fn resolve_token_encryption_key(auth: &AuthConfig) -> anyhow::Result<String> {
    use anyhow::Context as _;
    use std::io::Write as _;

    if let Some(key) = auth
        .token_encryption_key
        .as_deref()
        .map(str::trim)
        .filter(|key| !key.is_empty())
    {
        return Ok(key.to_owned());
    }

    let path = token_encryption_key_path(auth);
    match std::fs::read_to_string(&path) {
        Ok(stored) => {
            let stored = stored.trim();
            anyhow::ensure!(
                !stored.is_empty(),
                "OAuth token encryption key file {} is empty; restore it or set YARR_MCP_TOKEN_ENCRYPTION_KEY",
                path.display()
            );
            return Ok(stored.to_owned());
        }
        Err(error) if error.kind() == std::io::ErrorKind::NotFound => {}
        Err(error) => {
            return Err(error)
                .with_context(|| format!("read OAuth token encryption key {}", path.display()));
        }
    }

    if let Some(parent) = path
        .parent()
        .filter(|parent| !parent.as_os_str().is_empty())
    {
        std::fs::create_dir_all(parent)
            .with_context(|| format!("create OAuth key directory {}", parent.display()))?;
    }
    let mut bytes = [0u8; 32];
    getrandom::fill(&mut bytes)
        .map_err(|error| anyhow::anyhow!("generate OAuth token encryption key: {error}"))?;
    let key: String = bytes.iter().map(|byte| format!("{byte:02x}")).collect();
    let mut file = lab_auth::util::create_restricted_secret_file(&path)
        .map_err(|error| anyhow::anyhow!("create OAuth token encryption key: {error}"))?;
    file.write_all(key.as_bytes())
        .and_then(|()| file.sync_all())
        .with_context(|| format!("write OAuth token encryption key {}", path.display()))?;
    tracing::info!(
        path = %path.display(),
        "generated OAuth token encryption key; back it up with the auth database"
    );
    Ok(key)
}

/// Where the generated at-rest key lives: beside the JWT signing key.
pub fn token_encryption_key_path(auth: &AuthConfig) -> std::path::PathBuf {
    std::path::Path::new(&auth.key_path).with_file_name(TOKEN_ENCRYPTION_KEY_FILE)
}

/// OAuth / JWT auth sub-config.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(default, deny_unknown_fields)]
pub struct AuthConfig {
    pub mode: AuthMode,
    pub public_url: Option<String>,
    pub google_client_id: Option<String>,
    pub google_client_secret: Option<String>,
    pub admin_email: String,
    pub allowed_emails: Vec<String>,
    pub sqlite_path: String,
    pub key_path: String,
    /// At-rest key for OAuth provider credentials and refresh replay state
    /// (`YARR_MCP_TOKEN_ENCRYPTION_KEY`: 64 hex digits or 43 base64url chars).
    /// When unset, OAuth mode generates one and keeps it beside `key_path`.
    pub token_encryption_key: Option<String>,
    pub access_token_ttl_secs: u64,
    pub refresh_token_ttl_secs: u64,
    pub auth_code_ttl_secs: u64,
    pub register_rpm: u32,
    pub authorize_rpm: u32,
    pub allowed_client_redirect_uris: Vec<String>,
    /// When OAuth is active, retire the configured static bearer token instead
    /// of keeping it as a break-glass read credential.
    pub disable_static_token_with_oauth: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default, PartialEq, Eq)]
#[serde(rename_all = "lowercase")]
pub enum AuthMode {
    #[default]
    Bearer,
    OAuth,
}

// ── defaults ──────────────────────────────────────────────────────────────────

fn default_auth_sqlite_path() -> String {
    "/data/auth.db".into()
}
fn default_auth_key_path() -> String {
    "/data/auth-jwt.pem".into()
}
fn default_access_token_ttl_secs() -> u64 {
    3600
}
fn default_refresh_token_ttl_secs() -> u64 {
    86400 * 30
}
fn default_auth_code_ttl_secs() -> u64 {
    300
}
fn default_register_rpm() -> u32 {
    10
}
fn default_authorize_rpm() -> u32 {
    60
}

impl Default for AuthConfig {
    fn default() -> Self {
        Self {
            mode: AuthMode::default(),
            public_url: None,
            google_client_id: None,
            google_client_secret: None,
            admin_email: String::new(),
            allowed_emails: Vec::new(),
            sqlite_path: default_auth_sqlite_path(),
            key_path: default_auth_key_path(),
            token_encryption_key: None,
            access_token_ttl_secs: default_access_token_ttl_secs(),
            refresh_token_ttl_secs: default_refresh_token_ttl_secs(),
            auth_code_ttl_secs: default_auth_code_ttl_secs(),
            register_rpm: default_register_rpm(),
            authorize_rpm: default_authorize_rpm(),
            allowed_client_redirect_uris: Vec::new(),
            disable_static_token_with_oauth: false,
        }
    }
}

#[cfg(test)]
#[path = "auth_tests.rs"]
mod tests;
