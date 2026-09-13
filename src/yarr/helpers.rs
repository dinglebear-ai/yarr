//! Mechanical transport helpers: URL building, query-string assembly, path
//! validation, response slimming, and log redaction.
//!
//! Everything here is shape-agnostic. The *choice* of which fields to keep
//! (`slim`) or which query params to send (`query_get`) is made in the app
//! layer; this module only provides the primitives. No business logic.

use std::future::Future;

#[cfg(test)]
use std::time::Duration;

use anyhow::{Context, Result};
use reqwest::Url;
use serde_json::Value;

use crate::capability::AuthStyle;
use crate::config::{ServiceConfig, ServiceKind};

/// One absolute deadline shared by a Code Mode script and every native operation
/// it starts. This is a request budget, not an additional per-hop timeout.
#[derive(Clone, Copy, Debug)]
pub struct RequestDeadline {
    pub instant: tokio::time::Instant,
}

impl RequestDeadline {
    #[cfg(test)]
    pub fn after(duration: Duration) -> Self {
        Self {
            instant: tokio::time::Instant::now() + duration,
        }
    }

    pub async fn until<T>(&self, future: impl Future<Output = Result<T>>) -> Result<T> {
        tokio::time::timeout_at(self.instant, future)
            .await
            .map_err(|_| anyhow::anyhow!("codemode absolute deadline exceeded"))?
    }
}

tokio::task_local! {
    static ACTIVE_REQUEST_DEADLINE: RequestDeadline;
}

pub async fn with_request_deadline<T>(
    deadline: RequestDeadline,
    future: impl Future<Output = T>,
) -> T {
    ACTIVE_REQUEST_DEADLINE.scope(deadline, future).await
}

/// The Code Mode deadline attached to this async task, if the call originated
/// from the Code Mode dispatcher. Ordinary CLI and MCP dispatch has no task-local
/// deadline and retains its configured client timeout behavior.
pub fn active_request_deadline() -> Option<RequestDeadline> {
    ACTIVE_REQUEST_DEADLINE.try_with(|deadline| *deadline).ok()
}

#[cfg(test)]
#[path = "helpers_tests.rs"]
mod tests;

/// Build the upstream URL for `path`, validating it against the kind's allowlist
/// and injecting query-string auth (SABnzbd/Tautulli `apikey`, Plex
/// `X-Plex-Token`) for query-auth kinds.
///
/// This is the single owner of *query-string* auth injection. Header auth lives
/// in [`super::auth::apply_auth`]; the two never both append the api key.
pub fn build_url(service: &ServiceConfig, path: &str) -> Result<Url> {
    validate_safe_path(path)?;
    validate_service_path(service.kind, path)?;
    let mut url = Url::parse(service.base_url.trim_end_matches('/'))
        .with_context(|| format!("{} base_url is invalid", service.name))?;
    let (path_part, query_part) = path.split_once('?').unwrap_or((path, ""));
    url.set_path(&format!(
        "{}/{}",
        url.path().trim_end_matches('/'),
        path_part.trim_start_matches('/')
    ));
    let needs_query_auth = matches!(
        service.kind.descriptor().auth_style,
        AuthStyle::QueryApiKey | AuthStyle::PlexToken
    );
    if !query_part.is_empty() || needs_query_auth {
        let mut pairs = url.query_pairs_mut();
        // Parse the already-encoded query string with the same decoder the URL
        // crate uses, then re-append. This avoids double-encoding values like
        // `foo%20bar` and preserves key-only flags such as `?flag`.
        for (key, value) in url::form_urlencoded::parse(query_part.as_bytes()) {
            pairs.append_pair(&key, &value);
        }
        append_query_auth(&mut pairs, service);
    }
    Ok(url)
}

/// Inject query-string auth/quirks for query-auth kinds. SABnzbd additionally
/// forces `output=json`. Header-auth kinds are no-ops here.
fn append_query_auth(
    pairs: &mut url::form_urlencoded::Serializer<'_, url::UrlQuery<'_>>,
    service: &ServiceConfig,
) {
    match service.kind.descriptor().auth_style {
        AuthStyle::QueryApiKey => {
            if service.kind == ServiceKind::Sabnzbd {
                pairs.append_pair("output", "json");
            }
            if let Some(key) = service.api_key.as_deref() {
                pairs.append_pair("apikey", key);
            }
        }
        AuthStyle::PlexToken => {
            if let Some(token) = service.token.as_deref().or(service.api_key.as_deref()) {
                pairs.append_pair("X-Plex-Token", token);
            }
        }
        AuthStyle::ApiKeyHeader
        | AuthStyle::CookieSession
        | AuthStyle::JellyfinToken
        | AuthStyle::BearerToken => {}
    }
}

/// Build a URL for a query-style API (SABnzbd `?mode=`, Tautulli `?cmd=`),
/// percent-encoding every param value via `append_pair`.
///
/// User-supplied text MUST reach upstream through this (or `build_url`), never
/// via `format!` into a path string — otherwise a value like
/// `"foo&monitored=false"` would inject a second query parameter (S6).
pub fn query_get(service: &ServiceConfig, base: &str, params: &[(&str, &str)]) -> Result<Url> {
    validate_safe_path(base)?;
    validate_service_path(service.kind, base)?;
    let mut url = Url::parse(service.base_url.trim_end_matches('/'))
        .with_context(|| format!("{} base_url is invalid", service.name))?;
    url.set_path(&format!(
        "{}/{}",
        url.path().trim_end_matches('/'),
        base.trim_start_matches('/')
    ));
    {
        let mut pairs = url.query_pairs_mut();
        for (key, value) in params {
            pairs.append_pair(key, value);
        }
        append_query_auth(&mut pairs, service);
    }
    Ok(url)
}

/// Build the upstream URL for a **generated OpenAPI operation**.
///
/// Unlike [`build_url`]/[`query_get`] (which serve user-supplied passthrough paths
/// and enforce the per-kind path allowlist), the operation `path_template` is
/// spec-derived and therefore trusted; only the param *values* are user input, and
/// those are percent-encoded here (path segments via `path_segments_mut().push`,
/// query values via `append_pair`). The allowlist is intentionally NOT enforced so
/// the full generated operation surface is reachable. Query-string auth
/// (Plex `X-Plex-Token`, SABnzbd/Tautulli `apikey`) is still injected.
///
/// `path_args` maps each `{name}` placeholder in `path_template` to its value;
/// `query` is the (already name-filtered) query params. Errors if a placeholder's
/// value is missing/empty, or is a `.`/`..` dot-segment (which `push` would
/// normalize into a parent-climb rather than encode — see the loop).
pub fn build_operation_url(
    service: &ServiceConfig,
    path_template: &str,
    path_args: &[(&str, String)],
    query: &[(&str, String)],
) -> Result<Url> {
    let mut url = Url::parse(service.base_url.trim_end_matches('/'))
        .with_context(|| format!("{} base_url is invalid", service.name))?;
    {
        let mut segments = url
            .path_segments_mut()
            .map_err(|_| anyhow::anyhow!("{} base_url cannot be a base", service.name))?;
        // Drop a trailing empty segment from a base_url like `http://host/` so we
        // don't emit a leading `//` in the path.
        segments.pop_if_empty();
        for raw in path_template.trim_start_matches('/').split('/') {
            if raw.is_empty() {
                continue;
            }
            // A segment may be a whole placeholder (`{id}`) OR embed one or more
            // (`stream.{container}`, `{id}.json`). Substitute every `{name}` with its
            // value, then `push` percent-encodes the WHOLE resulting segment (a value
            // containing `/` becomes `%2F`, never a new segment).
            if raw.contains('{') {
                let seg = substitute_path_segment(raw, path_args, &service.name)?;
                // `push` performs RFC-3986 dot-segment NORMALIZATION on exactly "."/
                // ".." (popping a parent) rather than encoding them — and the per-kind
                // allowlist is bypassed for the generated surface — so a segment that
                // resolves to a bare "."/".." would climb out of the operation path.
                if seg == "." || seg == ".." {
                    return Err(anyhow::anyhow!(
                        "{} operation path segment resolved to `{seg}` (would escape \
                         the operation path)",
                        service.name
                    ));
                }
                segments.push(&seg);
            } else {
                segments.push(raw);
            }
        }
    }
    if !query.is_empty() || service.kind.descriptor().query_api() {
        let mut pairs = url.query_pairs_mut();
        for (key, value) in query {
            pairs.append_pair(key, value);
        }
        append_query_auth(&mut pairs, service);
    }
    Ok(url)
}

/// Substitute every `{name}` placeholder in one path-template segment with its
/// (raw, un-encoded) value from `path_args`. The caller `push`es the result as a
/// single segment, which is where percent-encoding happens. Errors if a referenced
/// param is missing/empty or the template segment is malformed (unclosed `{`).
fn substitute_path_segment(
    segment: &str,
    path_args: &[(&str, String)],
    service: &str,
) -> Result<String> {
    let mut out = String::with_capacity(segment.len());
    let mut rest = segment;
    while let Some(open) = rest.find('{') {
        out.push_str(&rest[..open]);
        let after = &rest[open + 1..];
        let close = after
            .find('}')
            .ok_or_else(|| anyhow::anyhow!("malformed path template segment `{segment}`"))?;
        let name = &after[..close];
        let value = path_args
            .iter()
            .find(|(k, _)| *k == name)
            .map(|(_, v)| v.as_str())
            .filter(|v| !v.is_empty())
            .ok_or_else(|| {
                anyhow::anyhow!("{service} operation path param `{name}` is missing or empty")
            })?;
        out.push_str(value);
        rest = &after[close + 1..];
    }
    out.push_str(rest);
    Ok(out)
}

/// Field-selection over a JSON value. Given an object, keep only `keep_fields`;
/// given an array, slim each element; otherwise return the value unchanged.
///
/// Mechanical only — the caller decides which fields matter.
pub fn slim(value: Value, keep_fields: &[&str]) -> Value {
    match value {
        Value::Array(items) => Value::Array(
            items
                .into_iter()
                .map(|item| slim(item, keep_fields))
                .collect(),
        ),
        Value::Object(mut map) => {
            let mut kept = serde_json::Map::new();
            for field in keep_fields {
                // L1-perf: move the kept value out of the owned map instead of
                // cloning it.
                if let Some(v) = map.remove(*field) {
                    kept.insert((*field).to_string(), v);
                }
            }
            Value::Object(kept)
        }
        other => other,
    }
}

const SECRET_KEYS: &[&str] = &[
    "apikey",
    "api_key",
    "x-api-key",
    "access_token",
    "access-token",
    "accesstoken",
    "auth_token",
    "auth-token",
    "authtoken",
    "token",
    "x-plex-token",
    "x-emby-token",
    "password",
];

/// Redacts three secret shapes (LOW-1): valid JSON object members by semantically
/// decoded key, plus query-string `key=value` pairs, plaintext `key: value`/`key
/// value` fragments, and JSON-style `"key":"value"` members in malformed or
/// truncated bodies. The 160-char cap and control-char stripping are applied first,
/// so redaction operates on the already-truncated preview.
pub fn body_preview(text: &str) -> String {
    let mut preview: String = text
        .chars()
        .filter(|ch| !ch.is_control() || ch.is_whitespace())
        .take(160)
        .collect();

    if let Ok(mut json) = serde_json::from_str::<Value>(&preview) {
        redact_json_value_secrets(&mut json);
        return serde_json::to_string(&json).unwrap_or_else(|_| "[redacted]".into());
    }

    redact_plaintext_secrets(&mut preview);
    redact_json_secrets(&mut preview);
    if preview.trim().is_empty() {
        "<empty body>".into()
    } else {
        preview
    }
}

fn redact_json_value_secrets(value: &mut Value) {
    match value {
        Value::Array(items) => {
            for item in items {
                redact_json_value_secrets(item);
            }
        }
        Value::Object(fields) => {
            for (key, value) in fields {
                if SECRET_KEYS
                    .iter()
                    .any(|secret| key.eq_ignore_ascii_case(secret))
                {
                    *value = Value::String("[redacted]".into());
                } else {
                    redact_json_value_secrets(value);
                }
            }
        }
        _ => {}
    }
}

/// Redact `key=value`, `key: value`, and `key value` credentials, including
/// single- and double-quoted plaintext values. A quoted value ends at the first
/// unescaped matching quote;
/// an unclosed quote is redacted through the bounded preview's end.
///
/// A credential alias must begin at a text-token boundary, so a word such as
/// `notaccessToken` and URL path text are not mistaken for credentials. Values
/// end at common text, form, or bracket delimiters; the delimiter is retained
/// so surrounding diagnostic text stays readable.
fn redact_plaintext_secrets(preview: &mut String) {
    for key in SECRET_KEYS {
        let mut from = 0;
        loop {
            let lower = preview.to_ascii_lowercase();
            let Some(rel) = lower[from..].find(key) else {
                break;
            };
            let key_at = from + rel;
            let after_key = key_at + key.len();
            if !is_plaintext_key_boundary(preview, key_at) {
                from = after_key;
                continue;
            }

            let bytes = preview.as_bytes();
            let mut value_start = after_key;
            while value_start < bytes.len() && bytes[value_start].is_ascii_whitespace() {
                value_start += 1;
            }
            if matches!(bytes.get(value_start), Some(b'=' | b':')) {
                value_start += 1;
                while value_start < bytes.len() && bytes[value_start].is_ascii_whitespace() {
                    value_start += 1;
                }
            } else if value_start == after_key {
                from = after_key;
                continue;
            }
            if value_start == bytes.len() {
                from = after_key;
                continue;
            }
            let value_end = if matches!(bytes[value_start], b'\'' | b'"') {
                quoted_string_end(bytes, value_start)
                    .map(|end| end + 1)
                    .unwrap_or(bytes.len())
            } else {
                if is_secret_value_delimiter(bytes[value_start]) {
                    from = after_key;
                    continue;
                }
                bytes[value_start..]
                    .iter()
                    .position(|byte| is_secret_value_delimiter(*byte))
                    .map(|offset| value_start + offset)
                    .unwrap_or(bytes.len())
            };
            preview.replace_range(key_at..value_end, "[redacted]");
            from = key_at + "[redacted]".len();
        }
    }
}

/// Returns the byte offset of a single- or double-quoted plaintext value's closing
/// delimiter. Delimiters preceded by an odd-length backslash run are escaped.
fn quoted_string_end(bytes: &[u8], start: usize) -> Option<usize> {
    let quote = bytes[start];
    let mut i = start + 1;
    let mut backslash_run = 0;
    while i < bytes.len() {
        match bytes[i] {
            b'\\' => backslash_run += 1,
            byte if byte == quote && backslash_run % 2 == 0 => return Some(i),
            _ => backslash_run = 0,
        }
        i += 1;
    }
    None
}

fn is_plaintext_key_boundary(preview: &str, key_at: usize) -> bool {
    preview[..key_at].chars().next_back().is_none_or(|ch| {
        ch.is_ascii_whitespace() || matches!(ch, '[' | '{' | '(' | ',' | ';' | '&' | '?')
    })
}

fn is_secret_value_delimiter(byte: u8) -> bool {
    byte.is_ascii_whitespace()
        || matches!(byte, b',' | b';' | b'&' | b']' | b'}' | b')' | b'"' | b'\'')
}

/// Redact JSON-style secret members `"<key>":"<value>"` in place, case-insensitive
/// on both the key and any surrounding whitespace between the colon and value.
/// The value (including its surrounding quotes) is replaced with `[redacted]`.
fn redact_json_secrets(preview: &mut String) {
    // Collect (value_start, value_end) byte ranges to replace, then apply from
    // the end so earlier offsets stay valid.
    let mut ranges: Vec<(usize, usize)> = Vec::new();
    let bytes = preview.as_bytes();
    let mut from = 0;
    while let Some(key_start_rel) = bytes[from..].iter().position(|byte| *byte == b'"') {
        let key_start = from + key_start_rel;
        let Some(key_end) = json_string_end(bytes, key_start) else {
            break;
        };
        from = key_end + 1;

        let mut i = key_end + 1;
        while i < bytes.len() && is_json_ascii_whitespace(bytes[i]) {
            i += 1;
        }
        if i >= bytes.len() || bytes[i] != b':' {
            continue;
        }
        i += 1;
        while i < bytes.len() && is_json_ascii_whitespace(bytes[i]) {
            i += 1;
        }
        if i >= bytes.len() || bytes[i] != b'"' {
            continue;
        }

        let Some(key) = decode_json_key(&preview[key_start + 1..key_end]) else {
            continue;
        };
        if !SECRET_KEYS
            .iter()
            .any(|secret| key.eq_ignore_ascii_case(secret))
        {
            continue;
        }

        // Keep scanning malformed/truncated previews rather than parsing them.
        let value_end = json_string_end(bytes, i).map_or(preview.len(), |end| end + 1);
        ranges.push((i, value_end));
    }
    ranges.sort_unstable();
    // Merge overlapping/adjacent ranges so a value matched by two keys (or nested
    // matches) is redacted as ONE span — plain `dedup` only drops exact duplicates
    // and would leave a partial leak when ranges overlap without being identical.
    let mut merged: Vec<(usize, usize)> = Vec::with_capacity(ranges.len());
    for (start, end) in ranges {
        match merged.last_mut() {
            Some(last) if start <= last.1 => last.1 = last.1.max(end),
            _ => merged.push((start, end)),
        }
    }
    // Apply from the end so earlier offsets stay valid as the string shrinks.
    for (start, end) in merged.into_iter().rev() {
        if start <= preview.len() && end <= preview.len() {
            preview.replace_range(start..end, "[redacted]");
        }
    }
}

/// Returns the byte offset of a JSON string's closing quote. Quotes preceded by
/// an odd-length backslash run are escaped and remain part of the string.
fn json_string_end(bytes: &[u8], start: usize) -> Option<usize> {
    let mut i = start + 1;
    let mut backslash_run = 0;
    while i < bytes.len() {
        match bytes[i] {
            b'\\' => backslash_run += 1,
            b'"' if backslash_run % 2 == 0 => return Some(i),
            _ => backslash_run = 0,
        }
        i += 1;
    }
    None
}

/// Decodes a quoted JSON key without requiring the enclosing object to parse.
/// Invalid escapes reject the token, keeping malformed non-JSON text from being
/// mistaken for a credential-bearing JSON member.
fn decode_json_key(key: &str) -> Option<String> {
    let mut decoded = String::with_capacity(key.len());
    let mut chars = key.chars();
    while let Some(ch) = chars.next() {
        if ch != '\\' {
            if ch.is_control() {
                return None;
            }
            decoded.push(ch);
            continue;
        }
        match chars.next()? {
            '"' => decoded.push('"'),
            '\\' => decoded.push('\\'),
            '/' => decoded.push('/'),
            'b' => decoded.push('\u{0008}'),
            'f' => decoded.push('\u{000C}'),
            'n' => decoded.push('\n'),
            'r' => decoded.push('\r'),
            't' => decoded.push('\t'),
            'u' => {
                let code_unit = decode_json_hex(&mut chars)?;
                let scalar = if (0xD800..=0xDBFF).contains(&code_unit) {
                    if chars.next()? != '\\' || chars.next()? != 'u' {
                        return None;
                    }
                    let low = decode_json_hex(&mut chars)?;
                    if !(0xDC00..=0xDFFF).contains(&low) {
                        return None;
                    }
                    0x1_0000 + ((code_unit - 0xD800) << 10) + (low - 0xDC00)
                } else if (0xDC00..=0xDFFF).contains(&code_unit) {
                    return None;
                } else {
                    code_unit
                };
                decoded.push(char::from_u32(scalar)?);
            }
            _ => return None,
        }
    }
    Some(decoded)
}

fn decode_json_hex(chars: &mut std::str::Chars<'_>) -> Option<u32> {
    let mut value = 0;
    for _ in 0..4 {
        value = (value << 4) | chars.next()?.to_digit(16)?;
    }
    Some(value)
}

fn is_json_ascii_whitespace(byte: u8) -> bool {
    matches!(byte, b' ' | b'\t' | b'\n' | b'\r')
}

/// Reject traversal, absolute URLs, encoded separators, and inline secrets.
pub fn validate_safe_path(path: &str) -> Result<()> {
    if path.trim().is_empty() {
        anyhow::bail!("path is required");
    }
    if path.starts_with("http://") || path.starts_with("https://") || path.starts_with("//") {
        anyhow::bail!("path must be relative to the configured service base_url");
    }
    for segment in path.split(['/', '?', '&']) {
        let decoded = percent_decode(segment)?;
        if segment == ".." || decoded == ".." {
            anyhow::bail!("path must not contain parent directory segments");
        }
        if decoded.contains('/') || decoded.contains('\\') {
            anyhow::bail!("path must not contain encoded path separators");
        }
    }
    let lower = path.to_ascii_lowercase();
    for secret_name in [
        "apikey=",
        "api_key=",
        "x-api-key=",
        "token=",
        "x-plex-token=",
        "x-emby-token=",
        "password=",
    ] {
        if lower.contains(secret_name) {
            anyhow::bail!(
                "path must not include query-string secrets; configure credentials instead"
            );
        }
    }
    Ok(())
}

/// Enforce the per-kind path allowlist (from `KindDescriptor.path_allowlist`).
///
/// The allowlist keeps each service constrained to its documented API surface.
pub fn validate_service_path(kind: ServiceKind, path: &str) -> Result<()> {
    let path_part = path.split_once('?').map(|(path, _)| path).unwrap_or(path);
    let allowed = kind.descriptor().path_allowlist;
    if allowed.iter().any(|prefix| {
        path_part == *prefix
            || path_part
                .strip_prefix(prefix)
                .is_some_and(|rest| rest.starts_with('/'))
    }) {
        Ok(())
    } else {
        anyhow::bail!(
            "path is outside the allowed API prefixes for {}",
            kind.as_str()
        )
    }
}

fn percent_decode(segment: &str) -> Result<String> {
    let bytes = segment.as_bytes();
    let mut out = Vec::with_capacity(bytes.len());
    let mut i = 0;
    while i < bytes.len() {
        if bytes[i] == b'%' {
            if i + 2 >= bytes.len() {
                anyhow::bail!("path contains invalid percent encoding");
            }
            let hex = std::str::from_utf8(&bytes[i + 1..i + 3])
                .map_err(|_| anyhow::anyhow!("path contains invalid percent encoding"))?;
            let value = u8::from_str_radix(hex, 16)
                .map_err(|_| anyhow::anyhow!("path contains invalid percent encoding"))?;
            out.push(value);
            i += 3;
        } else {
            out.push(bytes[i]);
            i += 1;
        }
    }
    String::from_utf8(out).map_err(|_| anyhow::anyhow!("path contains invalid UTF-8 encoding"))
}
