use super::*;

#[tokio::test]
async fn required_query_header_cookie_and_style_explode_are_recorded() {
    let (service, mut requests) = recording_service().await;
    let config = service.service("sonarr").unwrap().clone();
    let spec = operation(
        HttpMethod::Get,
        "/params",
        &[
            ParameterSpec {
                name: "ids",
                location: ParameterLocation::Query,
                required: true,
                schema: r#"{"type":"array"}"#,
                style: ParameterStyle::Form,
                explode: false,
            },
            ParameterSpec {
                name: "filter",
                location: ParameterLocation::Query,
                required: true,
                schema: r#"{"type":"object"}"#,
                style: ParameterStyle::DeepObject,
                explode: true,
            },
            ParameterSpec {
                name: "X-Modes",
                location: ParameterLocation::Header,
                required: true,
                schema: r#"{"type":"array"}"#,
                style: ParameterStyle::Simple,
                explode: false,
            },
            ParameterSpec {
                name: "session",
                location: ParameterLocation::Cookie,
                required: true,
                schema: r#"{"type":"string"}"#,
                style: ParameterStyle::Form,
                explode: true,
            },
        ],
        None,
        JSON_RESPONSE,
    );
    let error = service
        .execute_operation_spec(&config, &spec, &json!({}))
        .await
        .unwrap_err();
    assert!(error.to_string().contains("requires query parameter `ids`"));
    assert!(requests.try_recv().is_err());
    service.execute_operation_spec(&config, &spec, &json!({"ids":[1,2],"filter":{"state":"ready"},"X-Modes":["full","safe"],"session":"a b"})).await.unwrap();
    let request = requests.recv().await.unwrap();
    assert!(request.uri.contains("ids=1%2C2"));
    assert!(request.uri.contains("filter%5Bstate%5D=ready"));
    assert_eq!(request.headers["x-modes"], "full,safe");
    assert_eq!(request.headers["cookie"], "session=a+b");
}

#[tokio::test]
async fn form_multipart_text_and_binary_requests_are_recorded() {
    let (service, mut requests) = recording_service().await;
    let config = service.service("sonarr").unwrap().clone();
    for (path, media_type, encoding, args) in [
        (
            "/form",
            "application/x-www-form-urlencoded",
            BodyEncoding::FormUrlEncoded,
            json!({"body":{"name":"a b","id":[1,2]}}),
        ),
        (
            "/text-request",
            "text/plain",
            BodyEncoding::Text,
            json!({"body":"hello text"}),
        ),
        (
            "/binary-request",
            "application/octet-stream",
            BodyEncoding::Binary,
            json!({"bodyBase64":base64::engine::general_purpose::STANDARD.encode([0,255])}),
        ),
    ] {
        let representations = Box::leak(
            vec![RepresentationSpec {
                status: None,
                media_type,
                encoding,
                schema: "null",
                encoding_metadata: "null",
            }]
            .into_boxed_slice(),
        );
        let spec = operation(
            HttpMethod::Post,
            path,
            &[],
            Some(RequestBodySpec {
                required: true,
                representations,
            }),
            JSON_RESPONSE,
        );
        service
            .execute_operation_spec(&config, &spec, &args)
            .await
            .unwrap();
    }
    assert_eq!(
        String::from_utf8(requests.recv().await.unwrap().body).unwrap(),
        "id=1&id=2&name=a+b"
    );
    let text = requests.recv().await.unwrap();
    assert_eq!(text.headers["content-type"], "text/plain");
    assert_eq!(text.body, b"hello text");
    let binary = requests.recv().await.unwrap();
    assert_eq!(binary.headers["content-type"], "application/octet-stream");
    assert_eq!(binary.body, vec![0, 255]);

    let spec = operation(
        HttpMethod::Post,
        "/multipart",
        &[],
        Some(RequestBodySpec {
            required: true,
            representations: &[RepresentationSpec {
                status: None,
                media_type: "multipart/form-data",
                encoding: BodyEncoding::Multipart,
                schema: r#"{"properties":{"archive":{"type":"string","format":"binary"}}}"#,
                encoding_metadata: r#"{"archive":{"contentType":"application/zip"}}"#,
            }],
        }),
        JSON_RESPONSE,
    );
    service.execute_operation_spec(&config, &spec, &json!({"body":{"note":"hello"},"multipartFileBase64":base64::engine::general_purpose::STANDARD.encode([1,2,3]),"fileName":"fixture.zip"})).await.unwrap();
    let multipart = requests.recv().await.unwrap();
    let body = String::from_utf8_lossy(&multipart.body);
    assert!(body.contains("name=\"archive\"; filename=\"fixture.zip\""));
    assert!(body.contains("Content-Type: application/zip"));
    assert!(body.contains("name=\"note\""));
}

#[tokio::test]
async fn text_and_binary_response_bytes_are_preserved() {
    let (service, mut requests) = recording_service().await;
    let config = service.service("sonarr").unwrap().clone();
    for (path, media_type, encoding) in [
        ("/text", "text/plain", BodyEncoding::Text),
        ("/binary", "application/octet-stream", BodyEncoding::Binary),
    ] {
        let response = Box::leak(
            vec![RepresentationSpec {
                status: Some("200"),
                media_type,
                encoding,
                schema: "null",
                encoding_metadata: "null",
            }]
            .into_boxed_slice(),
        );
        let spec = operation(HttpMethod::Get, path, &[], None, response);
        let value = service
            .execute_operation_spec(&config, &spec, &json!({}))
            .await
            .unwrap();
        if encoding == BodyEncoding::Text {
            assert_eq!(value, json!("plain response"));
        } else {
            assert_eq!(
                value["base64"],
                base64::engine::general_purpose::STANDARD.encode([0, 159, 146, 150])
            );
        }
        requests.recv().await.unwrap();
    }
}

#[tokio::test]
async fn plex_list_content_sends_transport_client_identifier() {
    let (service, mut requests) = recording_service().await;
    service
        .execute_operation("plex", "list_content", &json!({"sectionId": 1}))
        .await
        .unwrap();
    let request = requests.recv().await.unwrap();
    assert!(request.uri.starts_with("/library/sections/1/all"));
    let identifiers = request
        .headers
        .get_all("x-plex-client-identifier")
        .iter()
        .collect::<Vec<_>>();
    assert_eq!(identifiers, ["yarr"]);
    assert_eq!(request.headers["x-plex-product"], "yarr");
}

#[tokio::test]
async fn plex_caller_client_identifier_is_sent_once_unchanged() {
    let (service, mut requests) = recording_service().await;
    service
        .execute_operation(
            "plex",
            "list_content",
            &json!({"sectionId": 1, "X-Plex-Client-Identifier": "caller-id"}),
        )
        .await
        .unwrap();
    let request = requests.recv().await.unwrap();
    let identifiers = request
        .headers
        .get_all("x-plex-client-identifier")
        .iter()
        .collect::<Vec<_>>();
    assert_eq!(identifiers, ["caller-id"]);
}

#[tokio::test]
async fn plex_passthrough_requests_json() {
    let (service, mut requests) = recording_service().await;
    service
        .api_get("plex", "/library/sections/1/all")
        .await
        .unwrap();
    let request = requests.recv().await.unwrap();
    assert_eq!(request.headers["accept"], "application/json");
    assert_eq!(request.headers["x-plex-client-identifier"], "yarr");

    service
        .api_get("sonarr", "/api/v3/system/status")
        .await
        .unwrap();
    let request = requests.recv().await.unwrap();
    // reqwest's default `*/*`; only Plex passthrough asks for JSON.
    assert_eq!(request.headers["accept"], "*/*");
    assert!(request.headers.get("x-plex-client-identifier").is_none());
}

#[tokio::test]
async fn plex_subtitle_search_and_download_requests() {
    let (service, mut requests) = recording_service().await;
    service
        .execute_operation(
            "plex",
            "search_subtitles",
            &json!({"ids": "100", "language": "en", "hearingImpaired": 3, "forced": 0}),
        )
        .await
        .unwrap();
    let search = requests.recv().await.unwrap();
    assert!(search.uri.starts_with("/library/metadata/100/subtitles?"));
    for pair in ["language=en", "hearingImpaired=3", "forced=0"] {
        assert!(search.uri.contains(pair), "{} lacks {pair}", search.uri);
    }
    assert_eq!(search.headers["accept"], "application/json");

    service
        .execute_operation(
            "plex",
            "download_subtitles",
            &json!({"ids": "100", "key": "/library/streams/200"}),
        )
        .await
        .unwrap();
    let download = requests.recv().await.unwrap();
    assert!(download.uri.contains("key=%2Flibrary%2Fstreams%2F200"));

    let error = service
        .execute_operation("plex", "download_subtitles", &json!({"ids": "100"}))
        .await
        .unwrap_err();
    assert!(error.to_string().contains("requires query parameter `key`"));
}
