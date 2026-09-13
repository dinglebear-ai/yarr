//! Lossless generated-operation executor.

use anyhow::{Result, anyhow, ensure};
use serde_json::Value;

use crate::app::YarrService;
use crate::openapi::{self, OperationSpec};
use crate::yarr::{OpenApiRequest, helpers::build_operation_url};

mod body;
mod parameters;

use body::{encode_request_body, select_response};
use parameters::prepare_parameters;

impl YarrService {
    /// Execute a supported generated operation. Unsupported operations are absent
    /// from `find_operation` and exposed through the generated omission table.
    pub async fn execute_operation(&self, service: &str, op: &str, args: &Value) -> Result<Value> {
        let config = self.service(service)?;
        let spec = openapi::find_operation(config.kind, op).ok_or_else(|| {
            anyhow!(
                "unknown or unsupported {} operation `{op}`",
                config.kind.as_str()
            )
        })?;
        // Fail closed before parameter encoding or upstream dispatch when a
        // generated write lacks an audited safety classification.
        openapi::safety::classify_operation(config.kind, spec).map_err(anyhow::Error::msg)?;
        self.execute_operation_spec(config, spec, args).await
    }

    async fn execute_operation_spec(
        &self,
        config: &crate::config::ServiceConfig,
        spec: &OperationSpec,
        args: &Value,
    ) -> Result<Value> {
        let object = args
            .as_object()
            .ok_or_else(|| anyhow!("operation `{}` args must be an object", spec.name))?;
        ensure!(
            !object.contains_key("multipartFixture"),
            "multipartFixture is not supported; submit multipartFileBase64 and fileName"
        );
        let encoded = prepare_parameters(spec, object)?;
        let path = encoded
            .path
            .iter()
            .map(|(name, value)| (name.as_str(), value.clone()))
            .collect::<Vec<_>>();
        let query = encoded
            .query
            .iter()
            .map(|(name, value)| (name.as_str(), value.clone()))
            .collect::<Vec<_>>();
        let url = build_operation_url(config, spec.path, &path, &query)?;
        let body = encode_request_body(spec, object)?;
        let response = select_response(spec, object)?;
        self.client_ref()
            .request_openapi_url(OpenApiRequest {
                method: spec.method.as_reqwest(),
                service: config,
                url,
                headers: &encoded.headers,
                body,
                accept: Some(response.media_type),
                expected_encoding: response.encoding,
                expected_media_type: response.media_type,
            })
            .await
    }
}

// Focused compatibility helpers retained for existing unit tests.
#[cfg(test)]
fn serialize_parameter(
    parameter: &crate::openapi::ParameterSpec,
    value: &Value,
) -> Result<Vec<(String, String)>> {
    parameters::serialize_parameter(parameter, value)
}

#[cfg(test)]
fn query_arg_values(name: &str, value: &Value) -> Result<Vec<(String, String)>> {
    parameters::serialize_named(name, crate::openapi::ParameterStyle::Form, true, value)
}

#[cfg(test)]
#[path = "openapi_ops_tests.rs"]
mod tests;
