use super::*;
use crate::config::{ServiceConfig, ServiceKind};

fn svc(kind: ServiceKind) -> ServiceConfig {
    ServiceConfig {
        name: kind.as_str().into(),
        kind,
        base_url: "http://localhost:8989".into(),
        api_key: Some("key".into()),
        token: Some("token".into()),
        ..ServiceConfig::default()
    }
}

#[test]
fn rejects_unsafe_paths() {
    assert!(validate_safe_path("").is_err());
    assert!(validate_safe_path("https://evil.test/api").is_err());
    assert!(validate_safe_path("/api/../config").is_err());
    assert!(validate_safe_path("/api/%2e%2e/config").is_err());
    assert!(validate_safe_path("/api/%2fconfig").is_err());
    assert!(validate_safe_path("/api?apikey=secret").is_err());
}

#[test]
fn rejects_service_paths_outside_allowed_prefixes() {
    assert!(build_url(&svc(ServiceKind::Sonarr), "/api/v1/system/status").is_err());
    assert!(build_url(&svc(ServiceKind::Sonarr), "/api/v30/system/status").is_err());
    assert!(build_url(&svc(ServiceKind::Sabnzbd), "/api2").is_err());
    assert!(build_url(&svc(ServiceKind::Qbittorrent), "/api/v3/system/status").is_err());
}

#[test]
fn allows_exact_prefixes_and_prefix_path_boundaries() {
    assert!(build_url(&svc(ServiceKind::Sonarr), "/api/v3").is_ok());
    assert!(build_url(&svc(ServiceKind::Sonarr), "/api/v3/system/status").is_ok());
    assert!(build_url(&svc(ServiceKind::Sabnzbd), "/api?mode=version").is_ok());
}

#[test]
fn jellyfin_sessions_path_is_allowed() {
    // C6: /Sessions must be reachable for Jellyfin.
    assert!(build_url(&svc(ServiceKind::Jellyfin), "/Sessions").is_ok());
    assert!(build_url(&svc(ServiceKind::Jellyfin), "/System/Info/Public").is_ok());
}

#[test]
fn builds_arr_url_without_secret_in_path() {
    let url = build_url(&svc(ServiceKind::Sonarr), "/api/v3/system/status").unwrap();
    assert_eq!(url.as_str(), "http://localhost:8989/api/v3/system/status");
}

#[test]
fn allows_tracearr_health_status_path() {
    let url = build_url(&svc(ServiceKind::Tracearr), "/health").unwrap();
    assert_eq!(url.as_str(), "http://localhost:8989/health");
}

#[test]
fn allows_tracearr_api_v1_paths() {
    let url = build_url(&svc(ServiceKind::Tracearr), "/api/v1/servers").unwrap();
    assert_eq!(url.as_str(), "http://localhost:8989/api/v1/servers");
    assert!(build_url(&svc(ServiceKind::Tracearr), "/api/v2/servers").is_err());
}

#[test]
fn appends_sabnzbd_query_auth() {
    let url = build_url(&svc(ServiceKind::Sabnzbd), "/api?mode=version").unwrap();
    assert!(url.as_str().contains("mode=version"));
    assert!(url.as_str().contains("output=json"));
    assert!(url.as_str().contains("apikey=key"));
}

#[test]
fn build_url_does_not_double_encode_query_values() {
    // An already-encoded value (foo%20bar) must round-trip to a single encoding,
    // not foo%2520bar.
    let url = build_url(&svc(ServiceKind::Sonarr), "/api/v3/series?q=foo%20bar").unwrap();
    assert!(
        url.query_pairs().any(|(k, v)| k == "q" && v == "foo bar"),
        "got: {url}"
    );
    assert!(!url.as_str().contains("%2520"), "double-encoded: {url}");
}

#[test]
fn build_url_preserves_key_only_flag() {
    // A key-only flag (?flag) must survive query reconstruction.
    let url = build_url(&svc(ServiceKind::Sonarr), "/api/v3/series?flag").unwrap();
    assert!(
        url.query_pairs().any(|(k, v)| k == "flag" && v.is_empty()),
        "key-only flag dropped: {url}"
    );
}

#[test]
fn appends_plex_token_in_query_only() {
    let url = build_url(&svc(ServiceKind::Plex), "/identity").unwrap();
    assert!(url.as_str().contains("X-Plex-Token=token"));
}

#[test]
fn query_get_percent_encodes_param_values() {
    // S6: an injection-style value must be percent-encoded, not a second param.
    let url = query_get(
        &svc(ServiceKind::Tautulli),
        "/api/v2",
        &[("cmd", "get_history"), ("search", "foo&monitored=false")],
    )
    .unwrap();
    let s = url.as_str();
    assert!(s.contains("search=foo%26monitored%3Dfalse"), "got: {s}");
    // Must NOT have leaked a real `monitored` query parameter.
    assert!(
        !url.query_pairs().any(|(k, _)| k == "monitored"),
        "injection leaked a monitored param: {s}"
    );
    // Tautulli apikey is injected by the helper, not the caller.
    assert!(url.query_pairs().any(|(k, v)| k == "apikey" && v == "key"));
}

#[test]
fn query_get_appends_sabnzbd_output_json() {
    let url = query_get(&svc(ServiceKind::Sabnzbd), "/api", &[("mode", "queue")]).unwrap();
    assert!(url.query_pairs().any(|(k, v)| k == "output" && v == "json"));
    assert!(url.query_pairs().any(|(k, v)| k == "apikey" && v == "key"));
}

#[test]
fn slim_keeps_only_requested_fields_on_object() {
    let value = serde_json::json!({ "id": 1, "title": "x", "secret": "s" });
    let out = slim(value, &["id", "title"]);
    assert_eq!(out, serde_json::json!({ "id": 1, "title": "x" }));
}

#[test]
fn slim_maps_over_arrays() {
    let value = serde_json::json!([
        { "id": 1, "x": 9 },
        { "id": 2, "x": 8 },
    ]);
    let out = slim(value, &["id"]);
    assert_eq!(out, serde_json::json!([{ "id": 1 }, { "id": 2 }]));
}

#[test]
fn slim_leaves_scalars_untouched() {
    assert_eq!(slim(serde_json::json!(7), &["id"]), serde_json::json!(7));
}

#[test]
fn body_preview_redacts_emby_token() {
    let preview = body_preview("error x-emby-token=abc123 more");
    assert!(!preview.contains("abc123"), "got: {preview}");
    assert!(preview.contains("[redacted]"));
}

#[test]
fn body_preview_redacts_form_encoded_password_and_api_key() {
    // A form-encoded / query-string `password=` (qBittorrent's login form) and
    // `x-api-key=` must be redacted on the query pass, not just the JSON pass.
    let preview = body_preview("invalid request: username=admin&password=hunter2&x-api-key=sekret");
    assert!(!preview.contains("hunter2"), "password leaked: {preview}");
    assert!(!preview.contains("sekret"), "x-api-key leaked: {preview}");
    assert!(preview.contains("[redacted]"), "got: {preview}");
    // The non-secret username survives.
    assert!(preview.contains("admin"), "got: {preview}");
}

#[test]
fn body_preview_redacts_json_secrets() {
    // LOW-1: JSON-shaped `"key":"value"` secrets must be redacted too.
    let preview = body_preview(r#"{"apiKey":"abc123","status":"ok"}"#);
    assert!(!preview.contains("abc123"), "apiKey leaked: {preview}");
    assert!(preview.contains("[redacted]"), "got: {preview}");
    // Non-secret fields survive.
    assert!(
        preview.contains("status"),
        "lost non-secret field: {preview}"
    );
}

#[test]
fn body_preview_redacts_json_secrets_case_insensitive_and_spaced() {
    let preview = body_preview(r#"{ "Password" : "hunter2", "token": "t0k" }"#);
    assert!(!preview.contains("hunter2"), "password leaked: {preview}");
    assert!(!preview.contains("t0k"), "token leaked: {preview}");
    assert_eq!(preview.matches("[redacted]").count(), 2, "got: {preview}");
}

#[test]
fn body_preview_redacts_valid_json_newline_separated_access_token() {
    const NEWLINE_ACCESS_TOKEN: &str = "VALID_JSON_NEWLINE_ACCESS_TOKEN_SECRET";
    let preview = body_preview(&format!(
        "{{\"accessToken\"\n:\n\"{NEWLINE_ACCESS_TOKEN}\",\"status\":\"ok\"}}"
    ));

    assert!(
        !preview.contains(NEWLINE_ACCESS_TOKEN),
        "newline-separated JSON credential leaked: {preview}"
    );
    assert!(preview.contains("[redacted]"), "got: {preview}");
    assert!(
        preview.contains("status"),
        "lost non-secret field: {preview}"
    );
}

#[test]
fn body_preview_redacts_valid_json_escaped_unicode_access_token_key() {
    const ESCAPED_KEY_ACCESS_TOKEN: &str = "VALID_JSON_ESCAPED_KEY_ACCESS_TOKEN_SECRET";
    let preview = body_preview(&format!(
        r#"{{"access\u0054oken":"{ESCAPED_KEY_ACCESS_TOKEN}","status":"ok"}}"#
    ));

    assert!(
        !preview.contains(ESCAPED_KEY_ACCESS_TOKEN),
        "escaped-key JSON credential leaked: {preview}"
    );
    assert!(preview.contains("[redacted]"), "got: {preview}");
    assert!(
        preview.contains("status"),
        "lost non-secret field: {preview}"
    );
}

#[test]
fn body_preview_redacts_nested_valid_json_secret_values_of_any_type() {
    const NESTED_SECRET: &str = "NESTED_VALID_JSON_ACCESS_TOKEN_SECRET";
    let preview = body_preview(&format!(
        r#"{{"password":1234,"items":[{{"accessToken":{{"value":"{NESTED_SECRET}"}},"name":"keep"}}]}}"#
    ));

    assert!(
        !preview.contains("1234"),
        "numeric secret leaked: {preview}"
    );
    assert!(
        !preview.contains(NESTED_SECRET),
        "nested secret leaked: {preview}"
    );
    assert!(preview.contains("keep"), "lost non-secret field: {preview}");
    assert_eq!(preview.matches("[redacted]").count(), 2, "got: {preview}");
}

#[test]
fn body_preview_redacts_json_secrets_through_escaped_quotes() {
    const ESCAPED_QUOTE_SUFFIX: &str = "JSON_ESCAPED_SUFFIX_SECRET";
    let preview = body_preview(&format!(
        r#"{{"accessToken":"prefix\"{ESCAPED_QUOTE_SUFFIX}"}}"#
    ));
    assert!(
        !preview.contains(ESCAPED_QUOTE_SUFFIX),
        "escaped-quote suffix leaked: {preview}"
    );
    assert_eq!(preview, r#"{"accessToken":"[redacted]"}"#);

    let escaped_backslash = body_preview(r#"{"accessToken":"prefix\\","status":"ok"}"#);
    assert_eq!(
        escaped_backslash, r#"{"accessToken":"[redacted]","status":"ok"}"#,
        "an even backslash run must allow the quote to close the JSON string"
    );
}

#[test]
fn body_preview_redacts_truncated_json_with_scanner_fallback() {
    const TRUNCATED_ACCESS_TOKEN: &str = "TRUNCATED_JSON_ACCESS_TOKEN_SECRET";
    let preview = body_preview(&format!(r#"{{"accessToken":"{TRUNCATED_ACCESS_TOKEN}"#));

    assert!(
        !preview.contains(TRUNCATED_ACCESS_TOKEN),
        "truncated JSON credential leaked: {preview}"
    );
    assert!(preview.contains("[redacted]"), "got: {preview}");
}

#[test]
fn body_preview_redacts_truncated_json_with_escaped_secret_key() {
    const ESCAPED_KEY_SECRET: &str = "TRUNCATED_ESCAPED_KEY_UNIQUE_SECRET";
    let preview = body_preview(&format!(r#"{{"access\u0054oken":"{ESCAPED_KEY_SECRET}"#));

    assert!(
        !preview.contains(ESCAPED_KEY_SECRET),
        "escaped-key truncated JSON credential leaked: {preview}"
    );
    assert!(preview.contains("[redacted]"), "got: {preview}");
}

#[test]
fn body_preview_redacts_x_api_key_json() {
    let preview = body_preview(r#"{"x-api-key":"sekret"}"#);
    assert!(!preview.contains("sekret"), "got: {preview}");
    assert!(preview.contains("[redacted]"));
}

#[test]
fn body_preview_redacts_plex_token_aliases_in_json_and_query_shapes() {
    let preview = body_preview(
        r#"{"AccessToken":"json-access","AUTH_TOKEN":"json-auth"} accessToken=query-access&auth-token=query-auth"#,
    );
    for secret in ["json-access", "json-auth", "query-access", "query-auth"] {
        assert!(!preview.contains(secret), "secret leaked: {preview}");
    }
    assert_eq!(preview.matches("[redacted]").count(), 4, "got: {preview}");
}

#[test]
fn body_preview_redacts_plaintext_plex_token_aliases_without_overredacting() {
    let preview = body_preview(
        "Plex rejected request: AccessToken: PLAIN_ALIAS_COLON_SECRET, AUTH_token PLAIN_ALIAS_SPACE_SECRET; retry https://plex.example/identity",
    );
    for secret in ["PLAIN_ALIAS_COLON_SECRET", "PLAIN_ALIAS_SPACE_SECRET"] {
        assert!(!preview.contains(secret), "secret leaked: {preview}");
    }
    assert_eq!(preview.matches("[redacted]").count(), 2, "got: {preview}");
    assert!(
        preview.contains("Plex rejected request"),
        "lost diagnosis: {preview}"
    );
    assert!(
        preview.contains("https://plex.example/identity"),
        "over-redacted URL: {preview}"
    );
}

#[test]
fn body_preview_redacts_quoted_plaintext_aliases_without_losing_diagnostics() {
    const QUOTED_COLON_SECRET: &str = "UNIT_QUOTED_PLAINTEXT_COLON_SECRET";
    const QUOTED_EQUALS_SECRET: &str = "UNIT_QUOTED_PLAINTEXT_EQUALS_SECRET";
    let preview = body_preview(&format!(
        "Plex failure: accessToken: \"{QUOTED_COLON_SECRET}\"; auth-token = \"{QUOTED_EQUALS_SECRET}\"; status=500"
    ));

    for secret in [QUOTED_COLON_SECRET, QUOTED_EQUALS_SECRET] {
        assert!(
            !preview.contains(secret),
            "quoted plaintext credential leaked"
        );
    }
    assert_eq!(preview.matches("[redacted]").count(), 2);
    assert!(preview.contains("Plex failure:"));
    assert!(preview.contains("status=500"));
}

#[test]
fn body_preview_redacts_quoted_plaintext_values_through_escaped_quote_parity() {
    const ESCAPED_QUOTE_SECRET: &str = "UNIT_ESCAPED_QUOTE_PLAINTEXT_SECRET";
    const EVEN_BACKSLASH_SECRET: &str = "UNIT_EVEN_BACKSLASH_PLAINTEXT_SECRET";
    let preview = body_preview(&format!(
        r#"Plex failure: accessToken: "prefix\"{ESCAPED_QUOTE_SECRET}"; auth-token = "{EVEN_BACKSLASH_SECRET}\\"; status=500"#
    ));

    for secret in [ESCAPED_QUOTE_SECRET, EVEN_BACKSLASH_SECRET] {
        assert!(
            !preview.contains(secret),
            "quoted plaintext credential leaked"
        );
    }
    assert_eq!(preview.matches("[redacted]").count(), 2);
    assert!(preview.contains("status=500"));
}

#[test]
fn body_preview_redacts_single_quoted_plaintext_values_through_escaped_quote_parity() {
    const COLON_SECRET: &str = "SQ_COLON";
    const EQUALS_SECRET: &str = "SQ_EQUALS";
    const WHITESPACE_SECRET: &str = "SQ_SPACE";
    const ESCAPED_QUOTE_SECRET: &str = "SQ_ESCAPED";
    const EVEN_BACKSLASH_SECRET: &str = "SQ_EVEN";
    let preview = body_preview(&format!(
        r#"Plex failure: accessToken: '{COLON_SECRET}'; auth-token = '{EQUALS_SECRET}'; token '{WHITESPACE_SECRET}'; access_token: 'prefix\'{ESCAPED_QUOTE_SECRET}'; authToken = '{EVEN_BACKSLASH_SECRET}\\'; status=500"#
    ));

    for secret in [
        COLON_SECRET,
        EQUALS_SECRET,
        WHITESPACE_SECRET,
        ESCAPED_QUOTE_SECRET,
        EVEN_BACKSLASH_SECRET,
    ] {
        assert!(
            !preview.contains(secret),
            "single-quoted plaintext credential leaked"
        );
    }
    assert_eq!(preview.matches("[redacted]").count(), 5);
    assert!(preview.contains("status=500"));
}

#[test]
fn body_preview_redacts_unclosed_single_quoted_plaintext_value_to_preview_end() {
    const UNCLOSED_SECRET: &str = "UNIT_SINGLE_QUOTED_UNCLOSED_SECRET";
    let preview = body_preview(&format!("Plex failure: auth-token = '{UNCLOSED_SECRET}"));

    assert!(
        !preview.contains(UNCLOSED_SECRET),
        "unclosed single-quoted plaintext credential leaked"
    );
    assert_eq!(preview, "Plex failure: [redacted]");
}

#[test]
fn body_preview_redacts_truncated_quoted_plaintext_value() {
    const TRUNCATED_QUOTED_SECRET: &str = "UNIT_TRUNCATED_QUOTED_PLAINTEXT_SECRET";
    let preview = body_preview(&format!(
        "Plex failure: auth-token = \"{TRUNCATED_QUOTED_SECRET}"
    ));

    assert!(
        !preview.contains(TRUNCATED_QUOTED_SECRET),
        "truncated quoted plaintext credential leaked"
    );
    assert!(preview.contains("Plex failure:"));
    assert!(preview.contains("[redacted]"));
}

#[test]
fn body_preview_redacts_plaintext_aliases_with_whitespace_before_delimiters() {
    // A whitespace gap before `=` or `:` must not turn the alias into a
    // whitespace-separated form and leave the following credential visible.
    let preview = body_preview(
        "errors: ACCESS_TOKEN = LEAK_EQ; AUTH-TOKEN : LEAK_COLON, apiKey\t=\tLEAK_TAB",
    );
    for secret in ["LEAK_EQ", "LEAK_COLON", "LEAK_TAB"] {
        assert!(!preview.contains(secret), "secret leaked: {preview}");
    }
    assert_eq!(
        preview, "errors: [redacted]; [redacted], [redacted]",
        "must retain only surrounding text and delimiters: {preview}"
    );
}

#[test]
fn body_preview_leaves_non_secret_json_untouched() {
    let preview = body_preview(r#"{"title":"My Movie","year":2020}"#);
    assert!(preview.contains("My Movie"), "got: {preview}");
    assert!(!preview.contains("[redacted]"), "over-redacted: {preview}");
}

// ── build_operation_url (generated-operation path/query encoding, S6/S7) ──────────

#[test]
fn build_operation_url_substitutes_and_encodes_path_params() {
    let url = build_operation_url(
        &svc(ServiceKind::Sonarr),
        "/api/v3/series/{id}",
        &[("id", "123".to_string())],
        &[],
    )
    .unwrap();
    assert_eq!(url.path(), "/api/v3/series/123");
}

#[test]
fn build_operation_url_encodes_path_value_as_single_segment_no_traversal() {
    // A value containing `/` must become `%2F` (one segment), never a new segment
    // that could escape the operation path (S7 path confinement).
    let url = build_operation_url(
        &svc(ServiceKind::Sonarr),
        "/api/v3/series/{id}",
        &[("id", "a/b/c".to_string())],
        &[],
    )
    .unwrap();
    let segs: Vec<&str> = url.path_segments().unwrap().collect();
    // /api /v3 /series /<one encoded segment> — exactly 4, not 6.
    assert_eq!(segs, vec!["api", "v3", "series", "a%2Fb%2Fc"]);
}

#[test]
fn build_operation_url_rejects_dot_segment_path_params() {
    // `.`/`..` would be NORMALIZED by `push` into a parent-climb (the allowlist is
    // bypassed for generated ops), so they must be rejected outright.
    for evil in ["..", "."] {
        let err = build_operation_url(
            &svc(ServiceKind::Sonarr),
            "/api/v3/series/{id}/folder",
            &[("id", evil.to_string())],
            &[],
        )
        .expect_err("dot-segment path param must be rejected");
        assert!(err.to_string().contains("path segment"), "got: {err}");
    }
    // The intended endpoint with a normal id is unaffected.
    assert!(
        build_operation_url(
            &svc(ServiceKind::Sonarr),
            "/api/v3/series/{id}/folder",
            &[("id", "7".to_string())],
            &[],
        )
        .is_ok()
    );
}

#[test]
fn build_operation_url_rejects_missing_or_empty_path_param() {
    assert!(
        build_operation_url(&svc(ServiceKind::Sonarr), "/api/v3/series/{id}", &[], &[]).is_err()
    );
    assert!(
        build_operation_url(
            &svc(ServiceKind::Sonarr),
            "/api/v3/series/{id}",
            &[("id", String::new())],
            &[],
        )
        .is_err()
    );
}

#[test]
fn build_operation_url_percent_encodes_query_and_cannot_inject_a_second_param() {
    // A query value smuggling `&apikey=evil` must be encoded, not split into a
    // second pair (S6 query injection).
    let url = build_operation_url(
        &svc(ServiceKind::Sonarr),
        "/api/v3/series/lookup",
        &[],
        &[("term", "foo&apikey=evil".to_string())],
    )
    .unwrap();
    assert!(
        url.query_pairs()
            .any(|(k, v)| k == "term" && v == "foo&apikey=evil")
    );
    // No injected second apikey pair (Sonarr is header-auth → no apikey at all).
    assert!(!url.query_pairs().any(|(k, _)| k == "apikey"));
}

#[test]
fn build_operation_url_injects_query_auth_exactly_once_for_query_kinds() {
    // Plex carries its token in the query string; it must appear exactly once and a
    // caller cannot pre-inject a duplicate via a query value.
    let url = build_operation_url(
        &svc(ServiceKind::Plex),
        "/library/sections",
        &[],
        &[("X-Plex-Token", "spoofed".to_string())],
    )
    .unwrap();
    let tokens: Vec<String> = url
        .query_pairs()
        .filter(|(k, _)| k == "X-Plex-Token")
        .map(|(_, v)| v.into_owned())
        .collect();
    // The real token is appended by auth injection; the caller's value is also
    // present as a (harmless, encoded) pair, but the authentic one is injected once.
    assert!(
        tokens.iter().any(|t| t == "token"),
        "auth token must be injected: {tokens:?}"
    );
}

#[test]
fn build_operation_url_handles_trailing_slash_base_url() {
    let mut service = svc(ServiceKind::Sonarr);
    service.base_url = "http://localhost:8989/".into();
    let url = build_operation_url(&service, "/api/v3/series", &[], &[]).unwrap();
    assert_eq!(
        url.path(),
        "/api/v3/series",
        "no leading // from trailing-slash base"
    );
}

#[test]
fn build_operation_url_substitutes_in_segment_placeholders() {
    // Jellyfin-style embedded placeholder `stream.{container}` must be filled, not
    // sent literally; the value is encoded within the segment.
    let url = build_operation_url(
        &svc(ServiceKind::Jellyfin),
        "/Audio/{itemId}/stream.{container}",
        &[
            ("itemId", "abc".to_string()),
            ("container", "mp4".to_string()),
        ],
        &[],
    )
    .unwrap();
    let segs: Vec<&str> = url.path_segments().unwrap().collect();
    assert_eq!(segs, vec!["Audio", "abc", "stream.mp4"]);
    // A `/` in an embedded value stays inside the one segment.
    let url2 = build_operation_url(
        &svc(ServiceKind::Jellyfin),
        "/x/{id}.json",
        &[("id", "a/b".to_string())],
        &[],
    )
    .unwrap();
    assert_eq!(
        url2.path_segments().unwrap().next_back().unwrap(),
        "a%2Fb.json"
    );
}
