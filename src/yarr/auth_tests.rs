use super::*;
use crate::config::{ServiceConfig, ServiceKind};

fn svc(kind: ServiceKind) -> ServiceConfig {
    ServiceConfig {
        name: kind.as_str().into(),
        kind,
        base_url: "http://localhost:8989".into(),
        api_key: Some("key".into()),
        token: Some("tok".into()),
        ..ServiceConfig::default()
    }
}

/// Build a request through `apply_auth` and return its header map for inspection.
fn headers_for(service: &ServiceConfig) -> reqwest::header::HeaderMap {
    let client = reqwest::Client::new();
    let builder = client.get("http://localhost:8989/x");
    let request = apply_auth(builder, service)
        .build()
        .expect("request should build");
    request.headers().clone()
}

#[test]
fn arr_uses_x_api_key_header() {
    let h = headers_for(&svc(ServiceKind::Sonarr));
    assert_eq!(h.get("X-Api-Key").unwrap(), "key");
}

#[test]
fn api_key_header_kind_never_gets_bearer() {
    // S4: an ApiKeyHeader service with BOTH api_key and token must NOT leak an
    // Authorization: Bearer header alongside the X-Api-Key credential.
    let h = headers_for(&svc(ServiceKind::Sonarr));
    assert_eq!(h.get("X-Api-Key").unwrap(), "key");
    assert!(
        h.get(reqwest::header::AUTHORIZATION).is_none(),
        "ApiKeyHeader kind must not send an Authorization header even when token is set"
    );
}

#[test]
fn plex_has_no_authorization_bearer() {
    // S4: Plex token travels in the query string only — never as a bearer.
    let h = headers_for(&svc(ServiceKind::Plex));
    assert!(
        h.get(reqwest::header::AUTHORIZATION).is_none(),
        "plex must not send an Authorization header"
    );
    assert!(h.get("X-Api-Key").is_none());
}

#[test]
fn jellyfin_uses_mediabrowser_not_bearer() {
    // S4: Jellyfin must use the quoted MediaBrowser form, not Authorization:Bearer.
    let h = headers_for(&svc(ServiceKind::Jellyfin));
    let authz = h
        .get(reqwest::header::AUTHORIZATION)
        .and_then(|v| v.to_str().ok())
        .unwrap();
    assert_eq!(authz, r#"MediaBrowser Token="key""#);
    assert!(!authz.starts_with("Bearer"), "must not be a bearer token");
    // X-Emby-Token fallback is still present.
    assert_eq!(h.get("X-Emby-Token").unwrap(), "key");
}

#[test]
fn accepts_qbittorrent_login_success_variants() {
    use reqwest::StatusCode;
    assert!(qbittorrent_login_accepted(StatusCode::OK, "Ok."));
    assert!(qbittorrent_login_accepted(StatusCode::OK, " Ok.\n"));
    assert!(qbittorrent_login_accepted(StatusCode::NO_CONTENT, ""));
    assert!(!qbittorrent_login_accepted(StatusCode::OK, "Fails."));
    assert!(!qbittorrent_login_accepted(StatusCode::UNAUTHORIZED, "Ok."));
}

#[tokio::test]
async fn qbittorrent_login_records_bounded_upstream_metrics() {
    use std::io::{BufRead, BufReader, Write};
    use std::net::TcpListener;
    use tower::ServiceExt as _;

    let listener = TcpListener::bind("127.0.0.1:0").expect("bind test server");
    let addr = listener.local_addr().unwrap();
    let handle = std::thread::spawn(move || {
        let (mut stream, _) = listener.accept().expect("accept login");
        let mut reader = BufReader::new(stream.try_clone().unwrap());
        let mut request_line = String::new();
        reader.read_line(&mut request_line).unwrap();
        assert!(request_line.contains("/api/v2/auth/login"));
        loop {
            let mut line = String::new();
            if reader.read_line(&mut line).unwrap_or(0) == 0 || line == "\r\n" {
                break;
            }
        }
        write!(
            stream,
            "HTTP/1.1 200 OK\r\nSet-Cookie: SID=secret-sid; path=/\r\nContent-Length: 3\r\n\r\nOk."
        )
        .unwrap();
        stream.flush().unwrap();
    });

    let metrics = crate::router(crate::testing::loopback_state());
    let service = ServiceConfig {
        name: "qbit-metrics-regression".into(),
        kind: ServiceKind::Qbittorrent,
        base_url: format!("http://{addr}"),
        username: Some("metrics-user".into()),
        password: Some("metrics-password".into()),
        ..ServiceConfig::default()
    };
    QbittorrentSession::new(std::time::Duration::from_secs(1))
        .unwrap()
        .ensure(&service)
        .await
        .unwrap();
    handle.join().unwrap();

    let response = metrics
        .oneshot(
            axum::http::Request::builder()
                .uri("/metrics")
                .body(axum::body::Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();
    let body = axum::body::to_bytes(response.into_body(), usize::MAX)
        .await
        .unwrap();
    let text = String::from_utf8(body.to_vec()).unwrap();
    assert!(
        text.contains(
            "yarr_upstream_requests_total{service=\"qbit-metrics-regression\",kind=\"qbittorrent\",outcome=\"success\"} 1"
        ),
        "{text}"
    );
    assert!(
        text.contains("yarr_upstream_request_duration_seconds"),
        "{text}"
    );
    assert!(!text.contains("metrics-password"), "{text}");
    assert!(!text.contains("secret-sid"), "{text}");
    assert!(!text.contains(&addr.to_string()), "{text}");
}

/// Concurrent cold-start qBittorrent requests must single-flight through exactly
/// one `/api/v2/auth/login`, then reuse that SID within the TTL.
#[tokio::test]
async fn qbit_session_login_is_single_flight_and_cached() {
    use std::io::{BufRead, BufReader, Read, Write};
    use std::net::TcpListener;
    use std::sync::Arc;
    use std::sync::atomic::{AtomicBool, AtomicUsize, Ordering};

    let listener = TcpListener::bind("127.0.0.1:0").expect("bind test server");
    listener
        .set_nonblocking(true)
        .expect("set listener nonblocking");
    let addr = listener.local_addr().unwrap();
    let login_count = Arc::new(AtomicUsize::new(0));
    let stop = Arc::new(AtomicBool::new(false));

    let srv_logins = login_count.clone();
    let srv_stop = stop.clone();
    let handle = std::thread::spawn(move || {
        while !srv_stop.load(Ordering::SeqCst) {
            match listener.accept() {
                Ok((mut stream, _)) => {
                    stream.set_nonblocking(false).ok();
                    let mut reader = BufReader::new(stream.try_clone().unwrap());
                    let mut request_line = String::new();
                    reader.read_line(&mut request_line).ok();
                    loop {
                        let mut line = String::new();
                        if reader.read_line(&mut line).unwrap_or(0) == 0 {
                            break;
                        }
                        if line == "\r\n" || line == "\n" {
                            break;
                        }
                    }
                    let mut sink = [0_u8; 256];
                    reader
                        .get_mut()
                        .set_read_timeout(Some(std::time::Duration::from_millis(20)))
                        .ok();
                    let _ = reader.get_mut().read(&mut sink);

                    let is_login = request_line.contains("/api/v2/auth/login");
                    if is_login {
                        srv_logins.fetch_add(1, Ordering::SeqCst);
                    }
                    let (extra, body) = if is_login {
                        ("Set-Cookie: SID=sid; path=/\r\n", "Ok.")
                    } else {
                        ("", "{\"ok\":true}")
                    };
                    let _ = write!(
                        stream,
                        "HTTP/1.1 200 OK\r\nContent-Type: application/json\r\nConnection: close\r\n{extra}Content-Length: {}\r\n\r\n{body}",
                        body.len()
                    );
                    let _ = stream.flush();
                }
                Err(ref e) if e.kind() == std::io::ErrorKind::WouldBlock => {
                    std::thread::sleep(std::time::Duration::from_millis(5));
                }
                Err(_) => break,
            }
        }
    });

    let base = format!("http://{addr}");
    let qbit = ServiceConfig {
        name: "qbittorrent".into(),
        kind: ServiceKind::Qbittorrent,
        base_url: base,
        username: Some("u".into()),
        password: Some("p".into()),
        ..ServiceConfig::default()
    };
    let config = crate::config::YarrConfig {
        services: vec![qbit.clone()],
    };
    let client = crate::yarr::YarrClient::new(&config).unwrap();

    let (a, b, c, d) = tokio::join!(
        client.get_json(&qbit, "/api/v2/app/version"),
        client.get_json(&qbit, "/api/v2/app/version"),
        client.get_json(&qbit, "/api/v2/app/version"),
        client.get_json(&qbit, "/api/v2/app/version"),
    );
    a.unwrap();
    b.unwrap();
    c.unwrap();
    d.unwrap();
    let _ = client.get_json(&qbit, "/api/v2/app/version").await;

    // Simulate TTL expiry, then prove the next concurrent wave collapses into
    // exactly one additional login too.
    client.expire_qbit_session_for_test(&qbit).await;
    let (e, f, g, h) = tokio::join!(
        client.get_json(&qbit, "/api/v2/app/version"),
        client.get_json(&qbit, "/api/v2/app/version"),
        client.get_json(&qbit, "/api/v2/app/version"),
        client.get_json(&qbit, "/api/v2/app/version"),
    );
    e.unwrap();
    f.unwrap();
    g.unwrap();
    h.unwrap();

    stop.store(true, Ordering::SeqCst);
    handle.join().unwrap();

    assert_eq!(
        login_count.load(Ordering::SeqCst),
        2,
        "cold and expired caller waves must each single-flight one login"
    );
}

#[tokio::test]
async fn qbit_cookie_jars_are_isolated_for_same_host_different_ports() {
    use std::io::{BufRead, BufReader, Read, Write};
    use std::net::TcpListener;
    use std::sync::mpsc;

    fn spawn_instance(
        sid: &'static str,
    ) -> (
        std::net::SocketAddr,
        mpsc::Receiver<Vec<String>>,
        std::thread::JoinHandle<()>,
    ) {
        let listener = TcpListener::bind("127.0.0.1:0").expect("bind qbit instance");
        let addr = listener.local_addr().unwrap();
        let (tx, rx) = mpsc::channel();
        let handle = std::thread::spawn(move || {
            for request_index in 0..2 {
                let (mut stream, _) = listener.accept().expect("accept");
                let mut reader = BufReader::new(stream.try_clone().unwrap());
                let mut headers = Vec::new();
                loop {
                    let mut line = String::new();
                    if reader.read_line(&mut line).unwrap_or(0) == 0
                        || line == "\r\n"
                        || line == "\n"
                    {
                        break;
                    }
                    headers.push(line.trim_end().to_owned());
                }
                reader
                    .get_mut()
                    .set_read_timeout(Some(std::time::Duration::from_millis(20)))
                    .ok();
                let _ = reader.get_mut().read(&mut [0_u8; 256]);
                tx.send(headers).unwrap();

                let (extra, body) = if request_index == 0 {
                    (format!("Set-Cookie: SID={sid}; path=/\r\n"), "Ok.")
                } else {
                    (String::new(), "{\"ok\":true}")
                };
                write!(
                    stream,
                    "HTTP/1.1 200 OK\r\nContent-Type: application/json\r\n{extra}Content-Length: {}\r\n\r\n{body}",
                    body.len()
                )
                .unwrap();
                stream.flush().unwrap();
            }
        });
        (addr, rx, handle)
    }

    let (addr_a, rx_a, handle_a) = spawn_instance("instance-a");
    let (addr_b, rx_b, handle_b) = spawn_instance("instance-b");
    let a = ServiceConfig {
        name: "qbit-a".into(),
        kind: ServiceKind::Qbittorrent,
        base_url: format!("http://{addr_a}"),
        username: Some("u".into()),
        password: Some("p".into()),
        ..ServiceConfig::default()
    };
    let b = ServiceConfig {
        name: "qbit-b".into(),
        kind: ServiceKind::Qbittorrent,
        base_url: format!("http://{addr_b}"),
        username: Some("u".into()),
        password: Some("p".into()),
        ..ServiceConfig::default()
    };
    let config = crate::config::YarrConfig {
        services: vec![a.clone(), b.clone()],
    };
    let client = crate::yarr::YarrClient::new(&config).unwrap();

    client.get_json(&a, "/api/v2/app/version").await.unwrap();
    client.get_json(&b, "/api/v2/app/version").await.unwrap();

    let a_login = rx_a.recv().unwrap();
    let a_call = rx_a.recv().unwrap();
    let b_login = rx_b.recv().unwrap();
    let b_call = rx_b.recv().unwrap();
    handle_a.join().unwrap();
    handle_b.join().unwrap();

    let cookies = |headers: &[String]| {
        headers
            .iter()
            .find(|header| header.to_ascii_lowercase().starts_with("cookie:"))
            .cloned()
    };
    assert_eq!(cookies(&a_login), None);
    assert!(cookies(&a_call).is_some_and(|value| value.contains("SID=instance-a")));
    assert_eq!(cookies(&b_login), None, "instance B login leaked A's SID");
    assert!(cookies(&b_call).is_some_and(|value| value.contains("SID=instance-b")));
}

/// S1: after a qBittorrent login sets a SID cookie, a request to a *different*
/// service on the *same host* must NOT carry that cookie. The shared client has
/// no cookie jar; only the dedicated qbit client does.
#[tokio::test]
async fn qbit_cookie_does_not_bleed_to_other_service() {
    use std::io::{BufRead, BufReader, Read, Write};
    use std::net::TcpListener;
    use std::sync::mpsc;

    let listener = TcpListener::bind("127.0.0.1:0").expect("bind test server");
    let addr = listener.local_addr().unwrap();
    let (tx, rx) = mpsc::channel::<Vec<String>>();

    // Serve: (1) qbit login -> Set-Cookie SID, (2) qbit app/version,
    // (3) sonarr request. Record each request's header lines.
    let handle = std::thread::spawn(move || {
        for i in 0..3 {
            let (mut stream, _) = listener.accept().expect("accept");
            let mut reader = BufReader::new(stream.try_clone().unwrap());
            let mut header_lines = Vec::new();
            loop {
                let mut line = String::new();
                if reader.read_line(&mut line).unwrap() == 0 {
                    break;
                }
                if line == "\r\n" || line == "\n" {
                    break;
                }
                header_lines.push(line.trim_end().to_string());
            }
            // Drain a possible request body so the socket closes cleanly.
            let mut sink = [0_u8; 256];
            let _ = reader
                .get_mut()
                .set_read_timeout(Some(std::time::Duration::from_millis(20)));
            let _ = reader.get_mut().read(&mut sink);
            tx.send(header_lines).unwrap();

            let (status, extra, body) = if i == 0 {
                ("200 OK", "Set-Cookie: SID=secret-sid; path=/\r\n", "Ok.")
            } else {
                ("200 OK", "", "{\"ok\":true}")
            };
            write!(
                stream,
                "HTTP/1.1 {status}\r\nContent-Type: application/json\r\n{extra}Content-Length: {}\r\n\r\n{body}",
                body.len()
            )
            .unwrap();
            let _ = stream.flush();
        }
    });

    let base = format!("http://{addr}");
    let qbit = ServiceConfig {
        name: "qbittorrent".into(),
        kind: ServiceKind::Qbittorrent,
        base_url: base.clone(),
        username: Some("u".into()),
        password: Some("p".into()),
        ..ServiceConfig::default()
    };
    let sonarr = ServiceConfig {
        name: "sonarr".into(),
        kind: ServiceKind::Sonarr,
        base_url: base,
        api_key: Some("key".into()),
        ..ServiceConfig::default()
    };
    let config = crate::config::YarrConfig {
        services: vec![qbit.clone(), sonarr.clone()],
    };
    let client = crate::yarr::YarrClient::new(&config).unwrap();

    // qbit request: triggers login (req 0) + app/version (req 1).
    let _ = client.get_json(&qbit, "/api/v2/app/version").await;
    // non-qbit request on the same host (req 2).
    let _ = client.get_json(&sonarr, "/api/v3/system/status").await;

    let login = rx.recv().unwrap();
    let qbit_call = rx.recv().unwrap();
    let sonarr_call = rx.recv().unwrap();
    handle.join().unwrap();

    let has_sid = |hdrs: &[String]| {
        hdrs.iter()
            .any(|h| h.to_ascii_lowercase().starts_with("cookie:") && h.contains("SID=secret-sid"))
    };
    assert!(!has_sid(&login), "login itself sends no prior cookie");
    assert!(
        has_sid(&qbit_call),
        "qbit follow-up SHOULD carry its own SID via the dedicated cookie client"
    );
    assert!(
        !has_sid(&sonarr_call),
        "sonarr request must NOT carry the qbit SID cookie (S1)"
    );
}
