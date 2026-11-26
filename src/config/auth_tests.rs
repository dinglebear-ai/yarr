//! Tests for [`AuthConfig`] defaults and the [`AuthMode`] default.

use super::*;

#[test]
fn auth_mode_defaults_to_bearer() {
    assert_eq!(AuthMode::default(), AuthMode::Bearer);
}

#[test]
fn auth_config_defaults() {
    let cfg = AuthConfig::default();
    assert_eq!(cfg.mode, AuthMode::Bearer);
    assert!(cfg.public_url.is_none());
    assert!(cfg.google_client_id.is_none());
    assert!(cfg.admin_email.is_empty());
    assert!(cfg.allowed_emails.is_empty());
    assert_eq!(cfg.sqlite_path, "/data/auth.db");
    assert_eq!(cfg.key_path, "/data/auth-jwt.pem");
    assert_eq!(cfg.access_token_ttl_secs, 3600);
    assert_eq!(cfg.refresh_token_ttl_secs, 86400 * 30);
    assert_eq!(cfg.auth_code_ttl_secs, 300);
    assert_eq!(cfg.register_rpm, 10);
    assert_eq!(cfg.authorize_rpm, 60);
    assert!(!cfg.disable_static_token_with_oauth);
}

#[test]
fn documented_oauth_static_token_control_parses() {
    let cfg: crate::config::Config = toml::from_str(
        r#"
        [mcp.auth]
        mode = "oauth"
        public_url = "https://yarr.example.com"
        disable_static_token_with_oauth = true
        "#,
    )
    .expect("documented auth block should parse");

    assert_eq!(cfg.mcp.auth.mode, AuthMode::OAuth);
    assert!(cfg.mcp.auth.disable_static_token_with_oauth);
}

#[test]
fn unknown_auth_keys_are_rejected() {
    let error = toml::from_str::<crate::config::Config>(
        r#"
        [mcp.auth]
        mode = "oauth"
        disable_static_token_with_oath = true
        "#,
    )
    .expect_err("misspelled auth controls must fail closed");

    assert!(
        error.to_string().contains("unknown field"),
        "unexpected parse error: {error}"
    );
}

#[test]
fn oauth_local_state_allows_only_one_replica() {
    let dir = tempfile::tempdir().unwrap();
    let sqlite = dir.path().join("auth.db");
    let first = acquire_oauth_instance_lock(&sqlite).unwrap();
    let error = acquire_oauth_instance_lock(&sqlite)
        .expect_err("a second local OAuth replica must fail closed");
    assert!(error.to_string().contains("exactly one replica"), "{error}");
    drop(first);
    acquire_oauth_instance_lock(&sqlite).expect("lock must be released on clean shutdown");
}

fn auth_in(dir: &std::path::Path) -> AuthConfig {
    AuthConfig {
        key_path: dir.join("auth-jwt.pem").display().to_string(),
        ..AuthConfig::default()
    }
}

#[test]
fn explicit_token_encryption_key_wins_and_writes_nothing() {
    let dir = tempfile::tempdir().unwrap();
    let auth = AuthConfig {
        token_encryption_key: Some(format!("  {}  ", "ab".repeat(32))),
        ..auth_in(dir.path())
    };
    assert_eq!(
        resolve_token_encryption_key(&auth).unwrap(),
        "ab".repeat(32)
    );
    assert!(!token_encryption_key_path(&auth).exists());
}

#[test]
fn generated_token_encryption_key_is_persisted_and_reused() {
    let dir = tempfile::tempdir().unwrap();
    let auth = auth_in(dir.path());
    let first = resolve_token_encryption_key(&auth).unwrap();
    assert_eq!(first.len(), 64);
    assert!(first.bytes().all(|b| b.is_ascii_hexdigit()));
    lab_auth::at_rest::TokenEncryptionKey::from_encoded(&first)
        .expect("generated key must be accepted by labby-auth");

    let path = token_encryption_key_path(&auth);
    assert_eq!(path, dir.path().join(TOKEN_ENCRYPTION_KEY_FILE));
    #[cfg(unix)]
    {
        use std::os::unix::fs::PermissionsExt as _;
        let mode = std::fs::metadata(&path).unwrap().permissions().mode() & 0o777;
        assert_eq!(mode, 0o600, "key file must be owner-only");
    }
    assert_eq!(resolve_token_encryption_key(&auth).unwrap(), first);
}

#[test]
fn empty_token_encryption_key_file_fails_closed() {
    let dir = tempfile::tempdir().unwrap();
    let auth = auth_in(dir.path());
    std::fs::write(token_encryption_key_path(&auth), "\n").unwrap();
    let error = resolve_token_encryption_key(&auth).unwrap_err().to_string();
    assert!(error.contains("YARR_MCP_TOKEN_ENCRYPTION_KEY"), "{error}");
}
