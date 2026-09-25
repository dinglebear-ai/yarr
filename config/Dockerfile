# syntax=docker/dockerfile:1.7@sha256:a57df69d0ea827fb7266491f2813635de6f17269be881f696fbfdf2d83dda33e
# =============================================================================
# Dockerfile — Build the yarr-mcp container image
#
# Build stages:
#   builder  — Rust compilation with BuildKit cache mounts (fast incremental builds)
#   runtime  — Distroless glibc runtime with only the binary and CA certificates
# =============================================================================

# ── Stage 1: Builder ──────────────────────────────────────────────────────────
# Builder uses Rust 1.97 (>= the declared MSRV of 1.90). The multi-platform
# manifest digest was resolved from Docker Hub on 2026-07-16; Dependabot should
# propose deliberate digest refreshes.
FROM rust:1.97-slim-bookworm@sha256:6d220bf85c74e842a79da63997af8d2e74455c0b8847d8bb3a5888572334991d AS builder

WORKDIR /app

# Install build dependencies.
# pkg-config and libssl-dev are needed for openssl-sys (used by reqwest/lab-auth).
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
      pkg-config=1.8.1-1 \
      libssl-dev=3.0.20-1~deb12u2 && \
    rm -rf /var/lib/apt/lists/*

# ── Dependency caching layer ──────────────────────────────────────────────────
# Copy the workspace manifests + lockfile first and build a stub binary. This
# lets Docker/BuildKit cache the compiled dependencies as a separate layer —
# subsequent builds that only change src/ skip this expensive step entirely.
#
# The xtask workspace member is kept (with a stub main) rather than stripped:
# stripping it from Cargo.toml while keeping the full Cargo.lock makes `cargo
# build --locked` fail ("cannot update the lock file") because xtask's
# dependencies would have to be pruned from the lock. Keeping the member intact
# means the lockfile matches the manifest, so --locked succeeds. xtask itself is
# never compiled here (-p yarr selects only the main crate).
COPY Cargo.toml Cargo.lock ./
COPY xtask/Cargo.toml xtask/Cargo.toml

RUN --mount=type=cache,id=yarr-cargo-registry,target=/usr/local/cargo/registry,sharing=locked \
    --mount=type=cache,id=yarr-cargo-git,target=/usr/local/cargo/git,sharing=locked \
    --mount=type=cache,id=yarr-cargo-target,target=/app/target,sharing=locked \
    mkdir -p src xtask/src && \
    echo "fn main() {}" > src/main.rs && \
    echo "fn main() {}" > xtask/src/main.rs && \
    cargo build --release --locked -p yarr

# ── Application build ─────────────────────────────────────────────────────────
# Now copy the real source and build the actual binary.
# The `touch src/main.rs` forces Cargo to re-link even when timestamps haven't
# changed (Docker layer caching can confuse Cargo's incremental build detection).
COPY src/ src/
RUN --mount=type=cache,id=yarr-cargo-registry,target=/usr/local/cargo/registry,sharing=locked \
    --mount=type=cache,id=yarr-cargo-git,target=/usr/local/cargo/git,sharing=locked \
    --mount=type=cache,id=yarr-cargo-target,target=/app/target,sharing=locked \
    touch src/main.rs && cargo build --release --locked -p yarr && \
    cp target/release/yarr /usr/local/bin/yarr && \
    install -d -m 0750 -o 1000 -g 1000 /runtime-data

# ── Stage 2: Runtime ──────────────────────────────────────────────────────────
# The multi-platform manifest digest was resolved from gcr.io on 2026-07-16.
# Distroless cc-debian13 supplies glibc, libgcc, and CA certificates without a
# package manager, shell, or general-purpose operating-system utilities.
FROM gcr.io/distroless/cc-debian13:nonroot@sha256:d97bc0a941b8d4be647dc0ee75b264ddbb772f1ac5ba690a4309c00723b23775

COPY --from=builder --chown=1000:1000 /usr/local/bin/yarr /usr/local/bin/yarr
COPY --from=builder --chown=1000:1000 /runtime-data/ /data/

# Default log level. Override with RUST_LOG env var in docker-compose or at runtime.
ENV RUST_LOG=info

# ENV YARR_MCP_HOST=0.0.0.0
# ENV YARR_MCP_PORT=40070

# Numeric ownership preserves the established host-volume contract without
# requiring passwd/group entries or a privileged startup wrapper.
USER 1000:1000

EXPOSE 40070/tcp

# Readiness requires at least one configured upstream service. It is public and
# local-only inside the container, so orchestration can fail closed on bad config.
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD ["/usr/local/bin/yarr", "watch", "--once", "--url", "http://127.0.0.1:40070/ready"]

# MCP registry label — used by Claude Code plugin discovery.
LABEL io.modelcontextprotocol.server.name="ai.dinglebear/yarr-mcp"

# The application is PID 1 and receives signals directly.
ENTRYPOINT ["/usr/local/bin/yarr"]
CMD ["serve", "mcp"]
