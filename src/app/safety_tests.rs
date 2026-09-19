use super::*;

#[test]
fn matcher_compares_raw_segments_without_decoding() {
    // The matcher itself never percent-decodes: `a%2Fb` is one raw segment and
    // cannot split a segment. Runtime admission rejects encoded separators
    // earlier (see `encoded_separator_routes_fail_closed_before_matching`), so
    // this stays defense in depth rather than a reachable match.
    assert!(path_matches_template(
        "/Audio/a%2Fb/stream.mp3",
        "/Audio/{itemId}/stream.{container}",
    ));
    assert!(!path_matches_template(
        "/Audio/a/b/stream.mp3",
        "/Audio/{itemId}/stream.{container}",
    ));
}

#[test]
fn encoded_separator_routes_fail_closed_before_matching() {
    let encoded = classify_generic_route(
        ServiceKind::Jellyfin,
        HttpMethod::Get,
        "/Audio/a%2Fb/stream.mp3",
    )
    .expect_err("encoded separators are rejected by path validation");
    assert!(
        encoded
            .to_string()
            .contains("path must not contain encoded path separators"),
        "error: {encoded}"
    );
}

#[test]
fn reviewed_routes_resolve_to_their_safety() {
    // A reviewed GET resolves to its manifest classification, not the verb.
    let read = classify_generic_route(
        ServiceKind::Jellyfin,
        HttpMethod::Get,
        "/Auth/PasswordResetProviders?include=ignored",
    )
    .expect("reviewed GET route resolves");
    assert_eq!(read, OperationSafety::ReadOnly);

    // A DELETE that the manifest records as a Mutation is not destructive.
    let mutation =
        classify_generic_route(ServiceKind::Sonarr, HttpMethod::Delete, "/api/v3/queue/5")
            .expect("reviewed DELETE route resolves");
    assert_eq!(mutation, OperationSafety::Mutation);

    // A DELETE the manifest records as Destructive keeps that classification:
    // the verb never decides it, the permitted input does (`deleteFiles`).
    let destructive_delete =
        classify_generic_route(ServiceKind::Sonarr, HttpMethod::Delete, "/api/v3/series/1")
            .expect("reviewed file-deleting DELETE route resolves");
    assert_eq!(destructive_delete, OperationSafety::Destructive);

    // A route the manifest records as Destructive keeps that classification.
    let destructive = classify_generic_route(
        ServiceKind::Sonarr,
        HttpMethod::Post,
        "/api/v3/system/backup/restore/1",
    )
    .expect("reviewed destructive route resolves");
    assert_eq!(destructive, OperationSafety::Destructive);
}

#[test]
fn unmatched_and_ambiguous_routes_fail_closed() {
    let unmatched = classify_generic_route(
        ServiceKind::Sonarr,
        HttpMethod::Get,
        "/api/v3/not-a-generated-route",
    )
    .expect_err("unmatched routes fail closed");
    assert!(
        unmatched
            .to_string()
            .contains("no unique generated operation match"),
        "error: {unmatched}"
    );

    // `/api/v3/series/editor` is a real DELETE operation, but the raw path also
    // matches the `series/{id}` template — ambiguity fails closed rather than
    // guessing which operation the caller meant.
    let ambiguous = classify_generic_route(
        ServiceKind::Sonarr,
        HttpMethod::Delete,
        "/api/v3/series/editor",
    )
    .expect_err("ambiguous routes fail closed");
    assert!(
        ambiguous
            .to_string()
            .contains("ambiguous generated operation match"),
        "error: {ambiguous}"
    );

    // Methods are part of route identity: a GET is not admitted by a POST route.
    let wrong_method = classify_generic_route(
        ServiceKind::Sonarr,
        HttpMethod::Get,
        "/api/v3/system/backup/restore/1",
    )
    .expect_err("method mismatch fails closed");
    assert!(
        wrong_method
            .to_string()
            .contains("no unique generated operation match"),
        "error: {wrong_method}"
    );
}
