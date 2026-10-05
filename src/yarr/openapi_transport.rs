//! OpenAPI-specific request serialization on the shared HTTP transport.

use anyhow::{Context, Result};
use reqwest::Method;
use serde_json::Value;

use super::response::ResponseMode;
use super::{YarrClient, auth};
use crate::config::{ServiceConfig, ServiceKind};

/// Fully encoded request payload used by generated OpenAPI operations.
pub(crate) enum EncodedRequestBody {
    Json { media_type: String, value: Value },
    Form(Vec<(String, String)>),
    Multipart(Vec<MultipartField>),
    Text { media_type: String, value: String },
    Binary { media_type: String, bytes: Vec<u8> },
}

pub(crate) enum MultipartField {
    Text {
        name: String,
        value: String,
    },
    File {
        name: String,
        file_name: String,
        media_type: String,
        bytes: Vec<u8>,
    },
}

/// Complete serialized request contract for one generated operation.
pub(crate) struct OpenApiRequest<'a> {
    pub(crate) method: Method,
    pub(crate) service: &'a ServiceConfig,
    pub(crate) url: reqwest::Url,
    pub(crate) headers: &'a [(String, String)],
    pub(crate) body: Option<EncodedRequestBody>,
    pub(crate) accept: Option<&'a str>,
    pub(crate) expected_encoding: crate::openapi::BodyEncoding,
    pub(crate) expected_media_type: &'a str,
}

impl YarrClient {
    /// Send an already serialized generated-operation request and decode the
    /// response according to the negotiated OpenAPI representation. This keeps
    /// auth, retries, response limits, and metrics on the shared transport path.
    pub(crate) async fn request_openapi_url(&self, input: OpenApiRequest<'_>) -> Result<Value> {
        let OpenApiRequest {
            method,
            service,
            url,
            headers,
            body,
            accept,
            expected_encoding,
            expected_media_type,
        } = input;
        let http = if service.kind == ServiceKind::Qbittorrent {
            let session = self.qbit_session(service)?;
            session.ensure(service).await?;
            session.client()
        } else {
            &self.client
        };
        // Caller headers replace (not join) same-named transport defaults, so
        // a supplied X-Plex-Client-Identifier is sent once, unchanged.
        let mut caller_headers = reqwest::header::HeaderMap::new();
        for (name, value) in headers {
            caller_headers.append(
                reqwest::header::HeaderName::from_bytes(name.as_bytes())
                    .with_context(|| format!("invalid header parameter name `{name}`"))?,
                reqwest::header::HeaderValue::from_str(value)
                    .with_context(|| format!("invalid value for header parameter `{name}`"))?,
            );
        }
        let mut request = http
            .request(method, url)
            .headers(auth::transport_headers(service))
            .headers(caller_headers);
        // Apply configured credentials last so a generated header/cookie
        // parameter can never replace transport authentication.
        request = auth::apply_auth(request, service);
        if let Some(accept) = accept {
            request = request.header(reqwest::header::ACCEPT, accept);
        }
        request = match body {
            None => request,
            Some(EncodedRequestBody::Json { media_type, value }) => request
                .header(reqwest::header::CONTENT_TYPE, media_type)
                .json(&value),
            Some(EncodedRequestBody::Form(values)) => request.form(&values),
            Some(EncodedRequestBody::Text { media_type, value }) => request
                .header(reqwest::header::CONTENT_TYPE, media_type)
                .body(value),
            Some(EncodedRequestBody::Binary { media_type, bytes }) => request
                .header(reqwest::header::CONTENT_TYPE, media_type)
                .body(bytes),
            Some(EncodedRequestBody::Multipart(fields)) => {
                request.multipart(build_multipart_form(fields)?)
            }
        };
        self.finish_with_retry_mode(
            service,
            request,
            ResponseMode::OpenApi {
                expected_encoding,
                expected_media_type: expected_media_type.to_string(),
            },
        )
        .await
    }
}

fn build_multipart_form(fields: Vec<MultipartField>) -> Result<reqwest::multipart::Form> {
    let mut form = reqwest::multipart::Form::new();
    for field in fields {
        form = match field {
            MultipartField::Text { name, value } => form.text(name, value),
            MultipartField::File {
                name,
                file_name,
                media_type,
                bytes,
            } => {
                let part = reqwest::multipart::Part::bytes(bytes)
                    .file_name(file_name)
                    .mime_str(&media_type)?;
                form.part(name, part)
            }
        };
    }
    Ok(form)
}

#[cfg(test)]
#[path = "openapi_transport_tests.rs"]
mod tests;
