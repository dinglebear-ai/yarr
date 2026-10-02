//! App-layer discovery/pairing integration tests against loopback stubs.
//!
//! No external endpoint is ever contacted: plex.tv is replaced by a local TCP
//! stub, and pairing hits local stub services via the same app transport.

use std::sync::atomic::{AtomicUsize, Ordering};
use std::sync::{Arc, Mutex};

use crate::app::YarrService;
use crate::config::{ServiceConfig, ServiceKind, YarrConfig};
use crate::fleet::discovery::{Drift, PlexDiscoveryOptions};
use crate::testing::TestEnv;

/// One-shot-capable HTTP stub: accepts connections, records the last request
/// (headers included) and answers with `body` under `status`.
async fn stub_upstream(
    status: &'static str,
    body: &'static str,
) -> (
    String,
    Arc<AtomicUsize>,
    Arc<Mutex<String>>,
    tokio::task::JoinHandle<()>,
) {
    let listener = tokio::net::TcpListener::bind("127.0.0.1:0").await.unwrap();
    let addr = listener.local_addr().unwrap();
    let calls = Arc::new(AtomicUsize::new(0));
    let captured = Arc::new(Mutex::new(String::new()));
    let handle = {
        let calls = calls.clone();
        let captured = captured.clone();
        tokio::spawn(async move {
            loop {
                let Ok((mut stream, _)) = listener.accept().await else {
                    break;
                };
                calls.fetch_add(1, Ordering::SeqCst);
                let captured = captured.clone();
                tokio::spawn(async move {
                    use tokio::io::{AsyncReadExt, AsyncWriteExt};
                    let mut request = [0_u8; 4096];
                    let n = stream.read(&mut request).await.unwrap_or(0);
                    *captured.lock().unwrap() = String::from_utf8_lossy(&request[..n]).into_owned();
                    let response = format!(
                        "HTTP/1.1 {status}\r\nContent-Type: application/json\r\nContent-Length: {}\r\nConnection: close\r\n\r\n",
                        body.len()
                    );
                    let _ = stream.write_all(response.as_bytes()).await;
                    let _ = stream.write_all(body.as_bytes()).await;
                });
            }
        })
    };
    (format!("http://{addr}"), calls, captured, handle)
}

fn discovery_service(entries: &[(&str, ServiceKind, &str)]) -> YarrService {
    let config = YarrConfig {
        services: entries
            .iter()
            .map(|(name, kind, base_url)| ServiceConfig {
                name: (*name).to_string(),
                kind: *kind,
                base_url: (*base_url).to_string(),
                api_key: Some("upstream-secret".into()),
                ..Default::default()
            })
            .collect(),
    };
    let client = crate::yarr::YarrClient::new(&config).expect("stub client builds");
    YarrService::new(client, config)
}

fn options(
    resources_url: &str,
    out: Option<std::path::PathBuf>,
    diff: bool,
) -> PlexDiscoveryOptions {
    PlexDiscoveryOptions {
        token_env: "YARR_TEST_PLEX_TOKEN".into(),
        out,
        include_shared: false,
        diff,
        resources_url: Some(reqwest::Url::parse(resources_url).unwrap()),
    }
}

const RESOURCES_BODY: &str = r#"{
  "MediaContainer": { "Device": [ {
      "name": "Den Plex", "clientIdentifier": "den-123", "owned": true,
      "provides": "server", "accessToken": "account-token",
      "connections": [ {"uri": "https://den.example.com:32400", "local": false, "relay": false, "protocol": "https"} ]
  } ] } }"#;

#[tokio::test]
async fn discovery_writes_a_marked_0600_export_and_touches_nothing_else() {
    let dir = tempfile::tempdir().unwrap();
    let (url, calls, captured, handle) = stub_upstream("200 OK", RESOURCES_BODY).await;
    let mut env = TestEnv::new();
    env.set("YARR_TEST_PLEX_TOKEN", "account-token");
    let service = discovery_service(&[]);

    // A caller-owned config file that discovery must never touch.
    let caller_config = dir.path().join("config.toml");
    std::fs::write(&caller_config, "caller-owned\n").unwrap();

    let out = dir.path().join("plex-export.env");
    let report = service
        .run_plex_discovery(&options(&url, Some(out.clone()), false))
        .await
        .expect("discovery succeeds");
    assert_eq!(report.resources.len(), 1);
    assert_eq!(calls.load(Ordering::SeqCst), 1);
    let request = captured.lock().unwrap().to_lowercase();
    assert!(
        request.contains("x-plex-token: account-token"),
        "the account token must travel as a header: {request}"
    );

    let export = std::fs::read_to_string(&out).unwrap();
    assert!(export.starts_with("# yarr discover plex export"));
    assert!(export.contains("YARR_PLEX_DEN_PLEX_TOKEN=account-token"));
    #[cfg(unix)]
    {
        use std::os::unix::fs::PermissionsExt;
        let mode = std::fs::metadata(&out).unwrap().permissions().mode() & 0o777;
        assert_eq!(mode, 0o600, "export must be private");
    }
    assert_eq!(
        std::fs::read_to_string(&caller_config).unwrap(),
        "caller-owned\n"
    );

    // A foreign file at the target path is refused, not clobbered.
    let foreign = dir.path().join("precious.env");
    std::fs::write(&foreign, "PRECIOUS=1\n").unwrap();
    let error = service
        .run_plex_discovery(&options(&url, Some(foreign.clone()), false))
        .await
        .expect_err("foreign file must be refused");
    assert!(
        error.to_string().contains("refusing to overwrite"),
        "{error:#}"
    );
    assert_eq!(std::fs::read_to_string(&foreign).unwrap(), "PRECIOUS=1\n");
    drop(handle);
}

#[tokio::test]
async fn discovery_requires_the_token_environment_and_never_calls_out_without_it() {
    let (url, calls, _captured, handle) = stub_upstream("200 OK", RESOURCES_BODY).await;
    let mut env = TestEnv::new();
    env.remove("YARR_TEST_PLEX_TOKEN");
    let service = discovery_service(&[]);
    let error = service
        .run_plex_discovery(&options(&url, None, false))
        .await
        .expect_err("missing token must fail");
    assert!(
        error.to_string().contains("YARR_TEST_PLEX_TOKEN"),
        "{error:#}"
    );
    assert_eq!(
        calls.load(Ordering::SeqCst),
        0,
        "no request without a token"
    );
    drop(handle);
}

#[tokio::test]
async fn plex_tv_status_is_preserved_and_the_token_never_leaks() {
    let (url, _calls, _captured, handle) =
        stub_upstream("401 Unauthorized", r#"{"error":"invalid token"}"#).await;
    let mut env = TestEnv::new();
    env.set("YARR_TEST_PLEX_TOKEN", "super-secret-token");
    let service = discovery_service(&[]);
    let error = service
        .run_plex_discovery(&options(&url, None, false))
        .await
        .expect_err("401 must fail");
    let message = format!("{error:#}");
    assert!(message.contains("HTTP 401"), "status preserved: {message}");
    assert!(
        !message.contains("super-secret-token"),
        "token must never appear: {message}"
    );
    drop(handle);
}

#[tokio::test]
async fn diff_mode_reports_drift_without_writing() {
    let dir = tempfile::tempdir().unwrap();
    let (url, _calls, _captured, handle) = stub_upstream("200 OK", RESOURCES_BODY).await;
    let mut env = TestEnv::new();
    env.set("YARR_TEST_PLEX_TOKEN", "account-token");
    let service = discovery_service(&[(
        "plex_den_plex",
        ServiceKind::Plex,
        "https://old.example.com:32400",
    )]);
    let out = dir.path().join("plex-export.env");
    let report = service
        .run_plex_discovery(&options(&url, Some(out.clone()), true))
        .await
        .expect("diff discovery succeeds");
    assert!(!out.exists(), "diff mode must not write");
    assert!(
        report.drift.contains(&Drift::UrlChanged {
            name: "plex_den_plex".into(),
            from: "https://old.example.com:32400".into(),
            to: "https://den.example.com:32400".into(),
        }),
        "drift: {:?}",
        report.drift
    );
    drop(handle);
}

#[tokio::test]
async fn malformed_resources_response_fails_with_context() {
    let (url, _calls, _captured, handle) = stub_upstream("200 OK", "not json").await;
    let mut env = TestEnv::new();
    env.set("YARR_TEST_PLEX_TOKEN", "account-token");
    let service = discovery_service(&[]);
    let error = service
        .run_plex_discovery(&options(&url, None, false))
        .await
        .expect_err("malformed body must fail");
    assert!(error.to_string().contains("not JSON"), "{error:#}");
    drop(handle);
}

#[tokio::test]
async fn pairing_reads_configured_services_and_reports_mixed_outcomes() {
    let (tautulli_url, _calls, _captured, tautulli_handle) = stub_upstream(
        "200 OK",
        r#"{"response":{"data":{"pms_identifier":"shared-id"}}}"#,
    )
    .await;
    let (plex_url, _calls2, _captured2, plex_handle) = stub_upstream(
        "200 OK",
        r#"{"MediaContainer":{"machineIdentifier":"shared-id"}}"#,
    )
    .await;
    let service = discovery_service(&[
        ("tautulli-main", ServiceKind::Tautulli, &tautulli_url),
        ("plex-den", ServiceKind::Plex, &plex_url),
        ("sonarr", ServiceKind::Sonarr, &plex_url), // ignored kinds are skipped
    ]);
    let report = service
        .pair_configured_tautulli_to_plex()
        .await
        .expect("pairing succeeds");
    assert_eq!(report.pairs.len(), 1);
    assert_eq!(report.pairs[0].tautulli_service, "tautulli-main");
    assert_eq!(report.pairs[0].plex_service, "plex-den");
    drop(tautulli_handle);
    drop(plex_handle);
}

#[tokio::test]
async fn pairing_missing_identifier_names_the_service() {
    let (tautulli_url, _calls, _captured, tautulli_handle) =
        stub_upstream("200 OK", r#"{"response":{"data":{}}}"#).await;
    let service = discovery_service(&[("tautulli-main", ServiceKind::Tautulli, &tautulli_url)]);
    let error = service
        .pair_configured_tautulli_to_plex()
        .await
        .expect_err("missing identifier must fail");
    let message = format!("{error:#}");
    assert!(
        message.contains("tautulli-main") && message.contains("pms_identifier"),
        "{message}"
    );
    drop(tautulli_handle);
}

#[tokio::test]
async fn rejected_schemes_are_refused_before_any_request() {
    let (url, calls, _captured, handle) = stub_upstream("200 OK", RESOURCES_BODY).await;
    let mut env = TestEnv::new();
    env.set("YARR_TEST_PLEX_TOKEN", "account-token");
    let service = discovery_service(&[]);
    // http is allowed on loopback (the stub); a remote http endpoint is not.
    let mut opts = options(&url, None, false);
    opts.resources_url = Some(reqwest::Url::parse("http://example.com/api/resources").unwrap());
    let error = service
        .run_plex_discovery(&opts)
        .await
        .expect_err("remote http must be refused");
    assert!(error.to_string().contains("not allowed"), "{error:#}");
    assert_eq!(calls.load(Ordering::SeqCst), 0);
    drop(handle);
}
