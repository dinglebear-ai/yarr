//! MCP protocol layer — tool dispatch, schemas, prompts, and server handler.
//!
//! This module is strictly MCP concerns: the `ServerHandler` impl, tool schemas,
//! prompt templates, and dispatch shims. Application state lives in `crate::server`.

mod elicit;
mod mrtr;
mod prompts;
pub mod rmcp_server;
mod schemas;
mod tools;
mod transport;

pub use rmcp_server::rmcp_server;
pub use transport::{allowed_origins, streamable_http_config, streamable_http_service};

#[cfg(any(test, feature = "test-support"))]
#[doc(hidden)]
pub use tools::execute_tool_without_peer_for_test;

#[cfg(test)]
#[path = "mcp_tests.rs"]
mod tests;
