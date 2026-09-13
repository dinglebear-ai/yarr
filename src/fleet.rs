//! Fleet-only helpers that are intentionally unavailable to MCP and Code Mode.
//!
//! Provider discovery is an explicit CLI operator workflow; it is never part of
//! normal service dispatch.

pub mod discovery;
pub mod pairing;
