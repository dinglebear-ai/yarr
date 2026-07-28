---
date: 2026-07-16 11:03:27 EDT
repo: git@github.com:jmagar/yarr.git
branch: main
head: f13dcec2f2a395a49762612124cb7290a0209e22
working directory: /home/jmagar/workspace/yarr-rmcp
worktree: /home/jmagar/workspace/yarr-rmcp
beads: rustarr-v1g, rustarr-xsw
---

# Comprehensive full-project review and remediation

## User Request

Run `comprehensive-review:full-review` across the entire project without pausing, then dispatch parallel agents and fix every P0, P1, P2, and P3 issue rather than a partial slice.

## Session Overview

The complete repository and live delivery surface were reviewed. The four review phases produced 76 raw findings—3 P0, 27 P1, 34 P2, and 12 P3—and every finding was remediated or closed without an accepted deferral. The work landed through PRs #57, #59, #61, and #63; final `main` was `f13dcec2f2a395a49762612124cb7290a0209e22`, the production container pipeline passed, and Dependabot and code-scanning had zero open alerts.

This session touched 412 unique paths (112 created, 298 modified, 0 renamed, 2 deleted), including the ignored full-review evidence and this session artifact.

## Sequence of Events

1. **Resolved the active checkout.** The injected `/home/jmagar/workspace/rustarr` path no longer existed; live Git evidence identified `/home/jmagar/workspace/yarr-rmcp` as the `jmagar/yarr` checkout.
2. **Established the mechanical baseline.** Ran repository-wide formatting, clippy, tests, documentation drift, package, plugin, Compose, workflow, dependency, and security checks and recorded failures in `.full-review/`.
3. **Completed four review phases.** Reviewed quality/architecture, security/performance, testing/documentation, and best practices/DevOps, preserving all 76 raw findings in the final ledger.
4. **Dispatched parallel remediation agents.** Agents worked across bounded review/fix areas; remaining integration and cross-cutting repairs were completed in the root checkout.
5. **Remediated the full ledger.** Fixed MCP authorization and elicitation, OpenAPI fidelity, identity/session boundaries, Code Mode controls, packaging/plugins, CI, documentation, observability, release safety, and dependency policy.
6. **Landed and verified the primary remediation.** PR #57 delivered the comprehensive fix set and PR #59 aligned CodeQL pins and resolved the transitive `cmov` advisory.
7. **Followed production failures through to resolution.** PR #61 replaced the vulnerable shell/root runtime with pinned distroless and repaired the notifier; PR #63 preserved Trivy severity filtering in SARIF mode and fixed a qBittorrent test flake.
8. **Closed the review.** Production run 29503834462 built, scanned, and promoted the immutable digest; both beads closed, topic branches were removed, and local/remote `main` matched.
9. **Performed save-session maintenance.** No plan files required movement, relevant beads were already closed, a stale marketplace worktree gitdir was repaired, and its unrelated dirty file was preserved.

## Key Findings

- The release-blocking root cause was caller-controlled MCP `action` metadata bypassing outer scope authorization and destructive confirmation while reaching inner Code Mode operations; hidden tools were also directly callable. Remediation spans `src/mcp/` and `src/app/codemode*`.
- Generated OpenAPI dispatch dropped required parameter, serialization, representation, and binary semantics. The generator and runtime were made lossless across `src/app/openapi_ops/`, `src/openapi/`, and `xtask/src/gen_openapi/`.
- Multi-instance identity and qBittorrent cookie storage were not isolated. Instance-aware routing and per-instance sessions were added with same-host and concurrency regressions.
- Code Mode lacked effective concurrency, absolute-deadline, response-size, artifact quota/retention, cache, and nonblocking-I/O controls; bounded runtime and regression coverage were added.
- Publication originally promoted mutable/vulnerable images before a reliable scan gate. The final workflow quarantines, scans, and promotes by immutable digest; `.github/workflows/docker-publish.yml:171` preserves HIGH/CRITICAL filtering in SARIF mode.
- The production runtime used a shell/root entrypoint. `config/Dockerfile:64` now pins distroless Debian 13, runs directly as numeric non-root, and uses application-native readiness.
- Public/operator/plugin documentation contradicted implemented auth, install, runtime, metrics, backup, and API behavior. Active docs and OpenWiki were reconciled and protected with drift/contracts.

## Technical Decisions

- Authorize the resolved inner operation, not caller-supplied outer metadata; destructive operations fail closed and require the real elicitation path.
- Treat generated API operations as a lossless protocol model and preserve parameter location, serialization, content type, binary bodies, and error semantics.
- Bound Code Mode at every expensive boundary: concurrency, wall-clock execution, native calls, response bytes, stored artifacts, retention, and cache miss fan-out.
- Make registries and distribution target manifests single sources of truth and generate/check downstream documentation and package artifacts from them.
- Build a quarantined image, scan the immutable digest, and promote tags only after the security gate passes.
- Keep the upstream RSA timing advisory as an explicit, mitigated, time-bounded exception with a hard review/removal deadline of 2026-10-01.
- Preserve user-owned or ambiguous branch/worktree state instead of deleting or synchronizing it during cleanup.

## Files Changed

| status | path | previous path | purpose | evidence |
|---|---|---|---|---|
| modified | `.env.example` | — | Build, release, configuration, metadata, or repository contract remediation. | `1d52bf8` |
| created | `.full-review/00-scope.md` | — | Full-review scope, phase evidence, state, or final report. | `local review artifact` |
| created | `.full-review/01-quality-architecture.md` | — | Full-review scope, phase evidence, state, or final report. | `local review artifact` |
| created | `.full-review/02-security-performance.md` | — | Full-review scope, phase evidence, state, or final report. | `local review artifact` |
| created | `.full-review/03-testing-documentation.md` | — | Full-review scope, phase evidence, state, or final report. | `local review artifact` |
| created | `.full-review/04-best-practices.md` | — | Full-review scope, phase evidence, state, or final report. | `local review artifact` |
| created | `.full-review/05-final-report.md` | — | Full-review scope, phase evidence, state, or final report. | `local review artifact` |
| created | `.full-review/state.json` | — | Full-review scope, phase evidence, state, or final report. | `local review artifact` |
| created | `.github/CODEOWNERS` | — | Repository ownership and review routing. | `1d52bf8` |
| modified | `.github/workflows/check-no-mcp-drift.yml` | — | CI, security, release, publication, or repository automation hardening. | `1d52bf8` |
| modified | `.github/workflows/ci.yml` | — | CI, security, release, publication, or repository automation hardening. | `1d52bf8` |
| modified | `.github/workflows/codeql.yml` | — | CI, security, release, publication, or repository automation hardening. | `0266086` |
| modified | `.github/workflows/dependabot-auto-merge.yml` | — | CI, security, release, publication, or repository automation hardening. | `1d52bf8` |
| modified | `.github/workflows/docker-publish.yml` | — | CI, security, release, publication, or repository automation hardening. | `1d52bf8, 8b4aa13, f13dcec` |
| modified | `.github/workflows/openwiki-update.yml` | — | CI, security, release, publication, or repository automation hardening. | `1d52bf8` |
| modified | `.github/workflows/release-please.yml` | — | CI, security, release, publication, or repository automation hardening. | `1d52bf8` |
| modified | `.github/workflows/release.yml` | — | CI, security, release, publication, or repository automation hardening. | `1d52bf8` |
| modified | `.github/workflows/scheduled.yml` | — | CI, security, release, publication, or repository automation hardening. | `1d52bf8` |
| modified | `.github/workflows/sync-marketplace-no-mcp.yml` | — | CI, security, release, publication, or repository automation hardening. | `1d52bf8` |
| modified | `.release-please-manifest.json` | — | Build, release, configuration, metadata, or repository contract remediation. | `1d52bf8` |
| modified | `Cargo.lock` | — | Dependency, advisory, feature, or build-policy remediation. | `1d52bf8, 0266086` |
| modified | `Cargo.toml` | — | Dependency, advisory, feature, or build-policy remediation. | `1d52bf8` |
| modified | `CHANGELOG.md` | — | Public project and release documentation alignment. | `1d52bf8` |
| modified | `CLAUDE.md` | — | Canonical repository agent guidance aligned with current contracts. | `1d52bf8` |
| modified | `config.example.toml` | — | Build, release, configuration, metadata, or repository contract remediation. | `1d52bf8` |
| modified | `config/Dockerfile` | — | Container/runtime configuration and deployment hardening. | `1d52bf8, 8b4aa13` |
| created | `config/prometheus/yarr-alerts.yml` | — | Container/runtime configuration and deployment hardening. | `1d52bf8` |
| modified | `deny.toml` | — | Dependency, advisory, feature, or build-policy remediation. | `1d52bf8` |
| created | `dist.targets.json` | — | Build, release, configuration, metadata, or repository contract remediation. | `1d52bf8` |
| modified | `docker-compose.prod.yml` | — | Container/runtime configuration and deployment hardening. | `1d52bf8, 8b4aa13` |
| modified | `docs/API.md` | — | Documentation aligned with implemented runtime and delivery contracts. | `1d52bf8` |
| modified | `docs/ARCHITECTURE.md` | — | Documentation aligned with implemented runtime and delivery contracts. | `1d52bf8` |
| modified | `docs/AUTH.md` | — | Documentation aligned with implemented runtime and delivery contracts. | `1d52bf8` |
| modified | `docs/CI.md` | — | Documentation aligned with implemented runtime and delivery contracts. | `1d52bf8` |
| modified | `docs/CLAUDE.md` | — | Documentation aligned with implemented runtime and delivery contracts. | `1d52bf8` |
| modified | `docs/CONFIG.md` | — | Documentation aligned with implemented runtime and delivery contracts. | `1d52bf8` |
| modified | `docs/DEPLOYMENT.md` | — | Documentation aligned with implemented runtime and delivery contracts. | `1d52bf8` |
| modified | `docs/DOCKER.md` | — | Documentation aligned with implemented runtime and delivery contracts. | `1d52bf8, 8b4aa13` |
| modified | `docs/ENV.md` | — | Documentation aligned with implemented runtime and delivery contracts. | `1d52bf8` |
| modified | `docs/JUSTFILE.md` | — | Documentation aligned with implemented runtime and delivery contracts. | `1d52bf8` |
| modified | `docs/LIVE_ENDPOINT_COVERAGE.md` | — | Documentation aligned with implemented runtime and delivery contracts. | `1d52bf8` |
| modified | `docs/MCP-REGISTRY-PUBLISH-GUIDE.md` | — | Documentation aligned with implemented runtime and delivery contracts. | `1d52bf8` |
| modified | `docs/OBSERVABILITY.md` | — | Documentation aligned with implemented runtime and delivery contracts. | `1d52bf8` |
| modified | `docs/PATTERNS.md` | — | Documentation aligned with implemented runtime and delivery contracts. | `1d52bf8, 8b4aa13` |
| modified | `docs/PHILOSOPHY.md` | — | Documentation aligned with implemented runtime and delivery contracts. | `1d52bf8` |
| modified | `docs/PLUGINS.md` | — | Documentation aligned with implemented runtime and delivery contracts. | `1d52bf8` |
| modified | `docs/PRE-COMMIT.md` | — | Documentation aligned with implemented runtime and delivery contracts. | `1d52bf8` |
| modified | `docs/reports/codemode-lab-alignment.md` | — | Documentation aligned with implemented runtime and delivery contracts. | `1d52bf8` |
| created | `docs/runbooks/authentication-failures.md` | — | Operational incident and recovery runbook. | `1d52bf8` |
| created | `docs/runbooks/dependency-response.md` | — | Operational incident and recovery runbook. | `1d52bf8` |
| created | `docs/runbooks/deployment-rollback.md` | — | Operational incident and recovery runbook. | `1d52bf8` |
| created | `docs/runbooks/partial-release.md` | — | Operational incident and recovery runbook. | `1d52bf8` |
| created | `docs/runbooks/resource-pressure.md` | — | Operational incident and recovery runbook. | `1d52bf8` |
| created | `docs/runbooks/upstream-failures.md` | — | Operational incident and recovery runbook. | `1d52bf8` |
| modified | `docs/RUST.md` | — | Documentation aligned with implemented runtime and delivery contracts. | `1d52bf8` |
| modified | `docs/SCRIPTS.md` | — | Documentation aligned with implemented runtime and delivery contracts. | `1d52bf8` |
| created | `docs/sessions/2026-07-16-comprehensive-review-and-remediation.md` | — | Complete session record and maintenance handoff. | `save-to-md` |
| modified | `docs/SYSTEMD.md` | — | Documentation aligned with implemented runtime and delivery contracts. | `1d52bf8` |
| modified | `docs/TESTING.md` | — | Documentation aligned with implemented runtime and delivery contracts. | `1d52bf8` |
| modified | `docs/TOOLS_ACTIONS_ENDPOINTS.md` | — | Documentation aligned with implemented runtime and delivery contracts. | `1d52bf8` |
| deleted | `entrypoint.sh` | — | Removed shell-based root entrypoint from the production image. | `8b4aa13` |
| modified | `install.sh` | — | Build, release, configuration, metadata, or repository contract remediation. | `1d52bf8` |
| modified | `Justfile` | — | Build, release, configuration, metadata, or repository contract remediation. | `1d52bf8` |
| modified | `lefthook.yml` | — | Build, release, configuration, metadata, or repository contract remediation. | `1d52bf8` |
| modified | `openwiki/architecture.md` | — | Documentation aligned with implemented runtime and delivery contracts. | `1d52bf8` |
| modified | `openwiki/configuration.md` | — | Documentation aligned with implemented runtime and delivery contracts. | `1d52bf8` |
| modified | `openwiki/domain.md` | — | Documentation aligned with implemented runtime and delivery contracts. | `1d52bf8` |
| modified | `openwiki/integrations.md` | — | Documentation aligned with implemented runtime and delivery contracts. | `1d52bf8` |
| modified | `openwiki/operations.md` | — | Documentation aligned with implemented runtime and delivery contracts. | `1d52bf8` |
| modified | `openwiki/quickstart.md` | — | Documentation aligned with implemented runtime and delivery contracts. | `1d52bf8` |
| modified | `openwiki/testing.md` | — | Documentation aligned with implemented runtime and delivery contracts. | `1d52bf8` |
| modified | `packages/yarr-mcp/bin/yarr.js` | — | Portable npm distribution, installer, launcher, package metadata, or tests. | `1d52bf8` |
| created | `packages/yarr-mcp/dist.targets.json` | — | Portable npm distribution, installer, launcher, package metadata, or tests. | `1d52bf8` |
| created | `packages/yarr-mcp/lib/download.js` | — | Portable npm distribution, installer, launcher, package metadata, or tests. | `1d52bf8` |
| modified | `packages/yarr-mcp/lib/platform.js` | — | Portable npm distribution, installer, launcher, package metadata, or tests. | `1d52bf8` |
| created | `packages/yarr-mcp/LICENSE` | — | Portable npm distribution, installer, launcher, package metadata, or tests. | `1d52bf8` |
| modified | `packages/yarr-mcp/package.json` | — | Portable npm distribution, installer, launcher, package metadata, or tests. | `1d52bf8` |
| modified | `packages/yarr-mcp/README.md` | — | Portable npm distribution, installer, launcher, package metadata, or tests. | `1d52bf8` |
| created | `packages/yarr-mcp/scripts/check-package.js` | — | Portable npm distribution, installer, launcher, package metadata, or tests. | `1d52bf8` |
| modified | `packages/yarr-mcp/scripts/install.js` | — | Portable npm distribution, installer, launcher, package metadata, or tests. | `1d52bf8` |
| created | `packages/yarr-mcp/scripts/sync-readme.js` | — | Portable npm distribution, installer, launcher, package metadata, or tests. | `1d52bf8` |
| created | `packages/yarr-mcp/scripts/sync-targets.js` | — | Portable npm distribution, installer, launcher, package metadata, or tests. | `1d52bf8` |
| created | `packages/yarr-mcp/test/download.test.js` | — | Portable npm distribution, installer, launcher, package metadata, or tests. | `1d52bf8` |
| created | `packages/yarr-mcp/test/install.integration.test.js` | — | Portable npm distribution, installer, launcher, package metadata, or tests. | `1d52bf8` |
| created | `packages/yarr-mcp/test/launcher.test.js` | — | Portable npm distribution, installer, launcher, package metadata, or tests. | `1d52bf8` |
| modified | `packages/yarr-mcp/test/platform.test.js` | — | Portable npm distribution, installer, launcher, package metadata, or tests. | `1d52bf8` |
| modified | `plugins/bazarr/CHANGELOG.md` | — | Plugin runtime, configuration, documentation, or fallback-client hardening. | `1d52bf8` |
| modified | `plugins/bazarr/README.md` | — | Plugin runtime, configuration, documentation, or fallback-client hardening. | `1d52bf8` |
| modified | `plugins/bazarr/scripts/setup.sh` | — | Plugin runtime, configuration, documentation, or fallback-client hardening. | `1d52bf8` |
| modified | `plugins/bazarr/skills/bazarr/README.md` | — | Plugin runtime, configuration, documentation, or fallback-client hardening. | `1d52bf8` |
| modified | `plugins/bazarr/skills/bazarr/references/troubleshooting.md` | — | Plugin runtime, configuration, documentation, or fallback-client hardening. | `1d52bf8` |
| modified | `plugins/bazarr/skills/bazarr/scripts/bazarr-api.sh` | — | Plugin runtime, configuration, documentation, or fallback-client hardening. | `1d52bf8` |
| created | `plugins/bazarr/skills/bazarr/scripts/load-config.sh` | — | Plugin runtime, configuration, documentation, or fallback-client hardening. | `1d52bf8` |
| modified | `plugins/bazarr/skills/bazarr/SKILL.md` | — | Plugin runtime, configuration, documentation, or fallback-client hardening. | `1d52bf8` |
| modified | `plugins/jellyfin/CHANGELOG.md` | — | Plugin runtime, configuration, documentation, or fallback-client hardening. | `1d52bf8` |
| modified | `plugins/jellyfin/README.md` | — | Plugin runtime, configuration, documentation, or fallback-client hardening. | `1d52bf8` |
| modified | `plugins/jellyfin/scripts/setup.sh` | — | Plugin runtime, configuration, documentation, or fallback-client hardening. | `1d52bf8` |
| modified | `plugins/jellyfin/skills/jellyfin/scripts/jellyfin-api.sh` | — | Plugin runtime, configuration, documentation, or fallback-client hardening. | `1d52bf8` |
| created | `plugins/jellyfin/skills/jellyfin/scripts/load-config.sh` | — | Plugin runtime, configuration, documentation, or fallback-client hardening. | `1d52bf8` |
| modified | `plugins/jellyfin/skills/jellyfin/SKILL.md` | — | Plugin runtime, configuration, documentation, or fallback-client hardening. | `1d52bf8` |
| modified | `plugins/overseerr/CHANGELOG.md` | — | Plugin runtime, configuration, documentation, or fallback-client hardening. | `1d52bf8` |
| modified | `plugins/overseerr/README.md` | — | Plugin runtime, configuration, documentation, or fallback-client hardening. | `1d52bf8` |
| modified | `plugins/overseerr/scripts/setup.sh` | — | Plugin runtime, configuration, documentation, or fallback-client hardening. | `1d52bf8` |
| modified | `plugins/overseerr/skills/overseerr/README.md` | — | Plugin runtime, configuration, documentation, or fallback-client hardening. | `1d52bf8` |
| modified | `plugins/overseerr/skills/overseerr/references/quick-reference.md` | — | Plugin runtime, configuration, documentation, or fallback-client hardening. | `1d52bf8` |
| modified | `plugins/overseerr/skills/overseerr/references/troubleshooting.md` | — | Plugin runtime, configuration, documentation, or fallback-client hardening. | `1d52bf8` |
| modified | `plugins/overseerr/skills/overseerr/scripts/lib.mjs` | — | Plugin runtime, configuration, documentation, or fallback-client hardening. | `1d52bf8` |
| modified | `plugins/overseerr/skills/overseerr/SKILL.md` | — | Plugin runtime, configuration, documentation, or fallback-client hardening. | `1d52bf8` |
| modified | `plugins/plex/CHANGELOG.md` | — | Plugin runtime, configuration, documentation, or fallback-client hardening. | `1d52bf8` |
| modified | `plugins/plex/README.md` | — | Plugin runtime, configuration, documentation, or fallback-client hardening. | `1d52bf8` |
| modified | `plugins/plex/scripts/setup.sh` | — | Plugin runtime, configuration, documentation, or fallback-client hardening. | `1d52bf8` |
| modified | `plugins/plex/skills/plex/README.md` | — | Plugin runtime, configuration, documentation, or fallback-client hardening. | `1d52bf8` |
| modified | `plugins/plex/skills/plex/references/quick-reference.md` | — | Plugin runtime, configuration, documentation, or fallback-client hardening. | `1d52bf8` |
| created | `plugins/plex/skills/plex/scripts/load-config.sh` | — | Plugin runtime, configuration, documentation, or fallback-client hardening. | `1d52bf8` |
| modified | `plugins/plex/skills/plex/scripts/plex-api.sh` | — | Plugin runtime, configuration, documentation, or fallback-client hardening. | `1d52bf8` |
| modified | `plugins/plex/skills/plex/SKILL.md` | — | Plugin runtime, configuration, documentation, or fallback-client hardening. | `1d52bf8` |
| modified | `plugins/prowlarr/CHANGELOG.md` | — | Plugin runtime, configuration, documentation, or fallback-client hardening. | `1d52bf8` |
| modified | `plugins/prowlarr/README.md` | — | Plugin runtime, configuration, documentation, or fallback-client hardening. | `1d52bf8` |
| modified | `plugins/prowlarr/scripts/setup.sh` | — | Plugin runtime, configuration, documentation, or fallback-client hardening. | `1d52bf8` |
| modified | `plugins/prowlarr/skills/prowlarr/README.md` | — | Plugin runtime, configuration, documentation, or fallback-client hardening. | `1d52bf8` |
| modified | `plugins/prowlarr/skills/prowlarr/references/api-endpoints.md` | — | Plugin runtime, configuration, documentation, or fallback-client hardening. | `1d52bf8` |
| modified | `plugins/prowlarr/skills/prowlarr/references/quick-reference.md` | — | Plugin runtime, configuration, documentation, or fallback-client hardening. | `1d52bf8` |
| created | `plugins/prowlarr/skills/prowlarr/scripts/load-config.sh` | — | Plugin runtime, configuration, documentation, or fallback-client hardening. | `1d52bf8` |
| modified | `plugins/prowlarr/skills/prowlarr/scripts/prowlarr-api.sh` | — | Plugin runtime, configuration, documentation, or fallback-client hardening. | `1d52bf8` |
| modified | `plugins/prowlarr/skills/prowlarr/SKILL.md` | — | Plugin runtime, configuration, documentation, or fallback-client hardening. | `1d52bf8` |
| modified | `plugins/qbittorrent/CHANGELOG.md` | — | Plugin runtime, configuration, documentation, or fallback-client hardening. | `1d52bf8` |
| modified | `plugins/qbittorrent/README.md` | — | Plugin runtime, configuration, documentation, or fallback-client hardening. | `1d52bf8` |
| modified | `plugins/qbittorrent/scripts/setup.sh` | — | Plugin runtime, configuration, documentation, or fallback-client hardening. | `1d52bf8` |
| modified | `plugins/qbittorrent/skills/qbittorrent/README.md` | — | Plugin runtime, configuration, documentation, or fallback-client hardening. | `1d52bf8` |
| modified | `plugins/qbittorrent/skills/qbittorrent/references/api-endpoints.md` | — | Plugin runtime, configuration, documentation, or fallback-client hardening. | `1d52bf8` |
| modified | `plugins/qbittorrent/skills/qbittorrent/references/quick-reference.md` | — | Plugin runtime, configuration, documentation, or fallback-client hardening. | `1d52bf8` |
| created | `plugins/qbittorrent/skills/qbittorrent/scripts/load-config.sh` | — | Plugin runtime, configuration, documentation, or fallback-client hardening. | `1d52bf8` |
| modified | `plugins/qbittorrent/skills/qbittorrent/scripts/qbit-api.sh` | — | Plugin runtime, configuration, documentation, or fallback-client hardening. | `1d52bf8` |
| modified | `plugins/qbittorrent/skills/qbittorrent/SKILL.md` | — | Plugin runtime, configuration, documentation, or fallback-client hardening. | `1d52bf8` |
| modified | `plugins/radarr/CHANGELOG.md` | — | Plugin runtime, configuration, documentation, or fallback-client hardening. | `1d52bf8` |
| modified | `plugins/radarr/README.md` | — | Plugin runtime, configuration, documentation, or fallback-client hardening. | `1d52bf8` |
| modified | `plugins/radarr/scripts/setup.sh` | — | Plugin runtime, configuration, documentation, or fallback-client hardening. | `1d52bf8` |
| modified | `plugins/radarr/skills/radarr/README.md` | — | Plugin runtime, configuration, documentation, or fallback-client hardening. | `1d52bf8` |
| modified | `plugins/radarr/skills/radarr/references/troubleshooting.md` | — | Plugin runtime, configuration, documentation, or fallback-client hardening. | `1d52bf8` |
| created | `plugins/radarr/skills/radarr/scripts/load-config.sh` | — | Plugin runtime, configuration, documentation, or fallback-client hardening. | `1d52bf8` |
| modified | `plugins/radarr/skills/radarr/scripts/radarr.sh` | — | Plugin runtime, configuration, documentation, or fallback-client hardening. | `1d52bf8` |
| modified | `plugins/radarr/skills/radarr/SKILL.md` | — | Plugin runtime, configuration, documentation, or fallback-client hardening. | `1d52bf8` |
| modified | `plugins/README.md` | — | Plugin runtime, configuration, documentation, or fallback-client hardening. | `1d52bf8` |
| modified | `plugins/sabnzbd/CHANGELOG.md` | — | Plugin runtime, configuration, documentation, or fallback-client hardening. | `1d52bf8` |
| modified | `plugins/sabnzbd/README.md` | — | Plugin runtime, configuration, documentation, or fallback-client hardening. | `1d52bf8` |
| modified | `plugins/sabnzbd/scripts/setup.sh` | — | Plugin runtime, configuration, documentation, or fallback-client hardening. | `1d52bf8` |
| modified | `plugins/sabnzbd/skills/sabnzbd/README.md` | — | Plugin runtime, configuration, documentation, or fallback-client hardening. | `1d52bf8` |
| modified | `plugins/sabnzbd/skills/sabnzbd/references/troubleshooting.md` | — | Plugin runtime, configuration, documentation, or fallback-client hardening. | `1d52bf8` |
| created | `plugins/sabnzbd/skills/sabnzbd/scripts/load-config.sh` | — | Plugin runtime, configuration, documentation, or fallback-client hardening. | `1d52bf8` |
| modified | `plugins/sabnzbd/skills/sabnzbd/scripts/sab-api.sh` | — | Plugin runtime, configuration, documentation, or fallback-client hardening. | `1d52bf8` |
| modified | `plugins/sabnzbd/skills/sabnzbd/SKILL.md` | — | Plugin runtime, configuration, documentation, or fallback-client hardening. | `1d52bf8` |
| modified | `plugins/sonarr/CHANGELOG.md` | — | Plugin runtime, configuration, documentation, or fallback-client hardening. | `1d52bf8` |
| modified | `plugins/sonarr/README.md` | — | Plugin runtime, configuration, documentation, or fallback-client hardening. | `1d52bf8` |
| modified | `plugins/sonarr/scripts/setup.sh` | — | Plugin runtime, configuration, documentation, or fallback-client hardening. | `1d52bf8` |
| modified | `plugins/sonarr/skills/sonarr/README.md` | — | Plugin runtime, configuration, documentation, or fallback-client hardening. | `1d52bf8` |
| modified | `plugins/sonarr/skills/sonarr/references/api-endpoints.md` | — | Plugin runtime, configuration, documentation, or fallback-client hardening. | `1d52bf8` |
| modified | `plugins/sonarr/skills/sonarr/references/quick-reference.md` | — | Plugin runtime, configuration, documentation, or fallback-client hardening. | `1d52bf8` |
| created | `plugins/sonarr/skills/sonarr/scripts/load-config.sh` | — | Plugin runtime, configuration, documentation, or fallback-client hardening. | `1d52bf8` |
| modified | `plugins/sonarr/skills/sonarr/scripts/sonarr.sh` | — | Plugin runtime, configuration, documentation, or fallback-client hardening. | `1d52bf8` |
| modified | `plugins/sonarr/skills/sonarr/SKILL.md` | — | Plugin runtime, configuration, documentation, or fallback-client hardening. | `1d52bf8` |
| modified | `plugins/tautulli/CHANGELOG.md` | — | Plugin runtime, configuration, documentation, or fallback-client hardening. | `1d52bf8` |
| modified | `plugins/tautulli/README.md` | — | Plugin runtime, configuration, documentation, or fallback-client hardening. | `1d52bf8` |
| modified | `plugins/tautulli/scripts/setup.sh` | — | Plugin runtime, configuration, documentation, or fallback-client hardening. | `1d52bf8` |
| modified | `plugins/tautulli/skills/tautulli/README.md` | — | Plugin runtime, configuration, documentation, or fallback-client hardening. | `1d52bf8` |
| modified | `plugins/tautulli/skills/tautulli/references/quick-reference.md` | — | Plugin runtime, configuration, documentation, or fallback-client hardening. | `1d52bf8` |
| modified | `plugins/tautulli/skills/tautulli/references/troubleshooting.md` | — | Plugin runtime, configuration, documentation, or fallback-client hardening. | `1d52bf8` |
| created | `plugins/tautulli/skills/tautulli/scripts/load-config.sh` | — | Plugin runtime, configuration, documentation, or fallback-client hardening. | `1d52bf8` |
| modified | `plugins/tautulli/skills/tautulli/scripts/tautulli-api.sh` | — | Plugin runtime, configuration, documentation, or fallback-client hardening. | `1d52bf8` |
| modified | `plugins/tautulli/skills/tautulli/SKILL.md` | — | Plugin runtime, configuration, documentation, or fallback-client hardening. | `1d52bf8` |
| modified | `plugins/tracearr/CHANGELOG.md` | — | Plugin runtime, configuration, documentation, or fallback-client hardening. | `1d52bf8` |
| modified | `plugins/tracearr/README.md` | — | Plugin runtime, configuration, documentation, or fallback-client hardening. | `1d52bf8` |
| modified | `plugins/tracearr/scripts/setup.sh` | — | Plugin runtime, configuration, documentation, or fallback-client hardening. | `1d52bf8` |
| created | `plugins/tracearr/skills/tracearr/scripts/load-config.sh` | — | Plugin runtime, configuration, documentation, or fallback-client hardening. | `1d52bf8` |
| modified | `plugins/tracearr/skills/tracearr/scripts/tracearr-api.sh` | — | Plugin runtime, configuration, documentation, or fallback-client hardening. | `1d52bf8` |
| modified | `plugins/tracearr/skills/tracearr/SKILL.md` | — | Plugin runtime, configuration, documentation, or fallback-client hardening. | `1d52bf8` |
| modified | `plugins/yarr/.mcp.json` | — | Plugin runtime, configuration, documentation, or fallback-client hardening. | `1d52bf8` |
| deleted | `plugins/yarr/bin/yarr` | — | Plugin runtime, configuration, documentation, or fallback-client hardening. | `1d52bf8` |
| modified | `plugins/yarr/CLAUDE.md` | — | Plugin runtime, configuration, documentation, or fallback-client hardening. | `1d52bf8` |
| modified | `plugins/yarr/gemini-extension.json` | — | Plugin runtime, configuration, documentation, or fallback-client hardening. | `1d52bf8` |
| modified | `plugins/yarr/hooks/hooks.json` | — | Plugin runtime, configuration, documentation, or fallback-client hardening. | `1d52bf8` |
| modified | `plugins/yarr/README.md` | — | Plugin runtime, configuration, documentation, or fallback-client hardening. | `1d52bf8` |
| modified | `plugins/yarr/scripts/plugin-setup.sh` | — | Plugin runtime, configuration, documentation, or fallback-client hardening. | `1d52bf8` |
| modified | `plugins/yarr/skills/bazarr/README.md` | — | Plugin runtime, configuration, documentation, or fallback-client hardening. | `1d52bf8` |
| modified | `plugins/yarr/skills/bazarr/references/troubleshooting.md` | — | Plugin runtime, configuration, documentation, or fallback-client hardening. | `1d52bf8` |
| modified | `plugins/yarr/skills/bazarr/scripts/bazarr-api.sh` | — | Plugin runtime, configuration, documentation, or fallback-client hardening. | `1d52bf8` |
| created | `plugins/yarr/skills/bazarr/scripts/load-config.sh` | — | Plugin runtime, configuration, documentation, or fallback-client hardening. | `1d52bf8` |
| modified | `plugins/yarr/skills/bazarr/SKILL.md` | — | Plugin runtime, configuration, documentation, or fallback-client hardening. | `1d52bf8` |
| modified | `plugins/yarr/skills/jellyfin/scripts/jellyfin-api.sh` | — | Plugin runtime, configuration, documentation, or fallback-client hardening. | `1d52bf8` |
| created | `plugins/yarr/skills/jellyfin/scripts/load-config.sh` | — | Plugin runtime, configuration, documentation, or fallback-client hardening. | `1d52bf8` |
| modified | `plugins/yarr/skills/jellyfin/SKILL.md` | — | Plugin runtime, configuration, documentation, or fallback-client hardening. | `1d52bf8` |
| modified | `plugins/yarr/skills/overseerr/README.md` | — | Plugin runtime, configuration, documentation, or fallback-client hardening. | `1d52bf8` |
| modified | `plugins/yarr/skills/overseerr/references/quick-reference.md` | — | Plugin runtime, configuration, documentation, or fallback-client hardening. | `1d52bf8` |
| modified | `plugins/yarr/skills/overseerr/references/troubleshooting.md` | — | Plugin runtime, configuration, documentation, or fallback-client hardening. | `1d52bf8` |
| modified | `plugins/yarr/skills/overseerr/scripts/lib.mjs` | — | Plugin runtime, configuration, documentation, or fallback-client hardening. | `1d52bf8` |
| modified | `plugins/yarr/skills/overseerr/SKILL.md` | — | Plugin runtime, configuration, documentation, or fallback-client hardening. | `1d52bf8` |
| modified | `plugins/yarr/skills/plex/README.md` | — | Plugin runtime, configuration, documentation, or fallback-client hardening. | `1d52bf8` |
| modified | `plugins/yarr/skills/plex/references/quick-reference.md` | — | Plugin runtime, configuration, documentation, or fallback-client hardening. | `1d52bf8` |
| created | `plugins/yarr/skills/plex/scripts/load-config.sh` | — | Plugin runtime, configuration, documentation, or fallback-client hardening. | `1d52bf8` |
| modified | `plugins/yarr/skills/plex/scripts/plex-api.sh` | — | Plugin runtime, configuration, documentation, or fallback-client hardening. | `1d52bf8` |
| modified | `plugins/yarr/skills/plex/SKILL.md` | — | Plugin runtime, configuration, documentation, or fallback-client hardening. | `1d52bf8` |
| modified | `plugins/yarr/skills/prowlarr/README.md` | — | Plugin runtime, configuration, documentation, or fallback-client hardening. | `1d52bf8` |
| modified | `plugins/yarr/skills/prowlarr/references/api-endpoints.md` | — | Plugin runtime, configuration, documentation, or fallback-client hardening. | `1d52bf8` |
| modified | `plugins/yarr/skills/prowlarr/references/quick-reference.md` | — | Plugin runtime, configuration, documentation, or fallback-client hardening. | `1d52bf8` |
| created | `plugins/yarr/skills/prowlarr/scripts/load-config.sh` | — | Plugin runtime, configuration, documentation, or fallback-client hardening. | `1d52bf8` |
| modified | `plugins/yarr/skills/prowlarr/scripts/prowlarr-api.sh` | — | Plugin runtime, configuration, documentation, or fallback-client hardening. | `1d52bf8` |
| modified | `plugins/yarr/skills/prowlarr/SKILL.md` | — | Plugin runtime, configuration, documentation, or fallback-client hardening. | `1d52bf8` |
| modified | `plugins/yarr/skills/qbittorrent/README.md` | — | Plugin runtime, configuration, documentation, or fallback-client hardening. | `1d52bf8` |
| modified | `plugins/yarr/skills/qbittorrent/references/api-endpoints.md` | — | Plugin runtime, configuration, documentation, or fallback-client hardening. | `1d52bf8` |
| modified | `plugins/yarr/skills/qbittorrent/references/quick-reference.md` | — | Plugin runtime, configuration, documentation, or fallback-client hardening. | `1d52bf8` |
| created | `plugins/yarr/skills/qbittorrent/scripts/load-config.sh` | — | Plugin runtime, configuration, documentation, or fallback-client hardening. | `1d52bf8` |
| modified | `plugins/yarr/skills/qbittorrent/scripts/qbit-api.sh` | — | Plugin runtime, configuration, documentation, or fallback-client hardening. | `1d52bf8` |
| modified | `plugins/yarr/skills/qbittorrent/SKILL.md` | — | Plugin runtime, configuration, documentation, or fallback-client hardening. | `1d52bf8` |
| modified | `plugins/yarr/skills/radarr/README.md` | — | Plugin runtime, configuration, documentation, or fallback-client hardening. | `1d52bf8` |
| modified | `plugins/yarr/skills/radarr/references/troubleshooting.md` | — | Plugin runtime, configuration, documentation, or fallback-client hardening. | `1d52bf8` |
| created | `plugins/yarr/skills/radarr/scripts/load-config.sh` | — | Plugin runtime, configuration, documentation, or fallback-client hardening. | `1d52bf8` |
| modified | `plugins/yarr/skills/radarr/scripts/radarr.sh` | — | Plugin runtime, configuration, documentation, or fallback-client hardening. | `1d52bf8` |
| modified | `plugins/yarr/skills/radarr/SKILL.md` | — | Plugin runtime, configuration, documentation, or fallback-client hardening. | `1d52bf8` |
| modified | `plugins/yarr/skills/sabnzbd/README.md` | — | Plugin runtime, configuration, documentation, or fallback-client hardening. | `1d52bf8` |
| modified | `plugins/yarr/skills/sabnzbd/references/troubleshooting.md` | — | Plugin runtime, configuration, documentation, or fallback-client hardening. | `1d52bf8` |
| created | `plugins/yarr/skills/sabnzbd/scripts/load-config.sh` | — | Plugin runtime, configuration, documentation, or fallback-client hardening. | `1d52bf8` |
| modified | `plugins/yarr/skills/sabnzbd/scripts/sab-api.sh` | — | Plugin runtime, configuration, documentation, or fallback-client hardening. | `1d52bf8` |
| modified | `plugins/yarr/skills/sabnzbd/SKILL.md` | — | Plugin runtime, configuration, documentation, or fallback-client hardening. | `1d52bf8` |
| modified | `plugins/yarr/skills/sonarr/README.md` | — | Plugin runtime, configuration, documentation, or fallback-client hardening. | `1d52bf8` |
| modified | `plugins/yarr/skills/sonarr/references/api-endpoints.md` | — | Plugin runtime, configuration, documentation, or fallback-client hardening. | `1d52bf8` |
| modified | `plugins/yarr/skills/sonarr/references/quick-reference.md` | — | Plugin runtime, configuration, documentation, or fallback-client hardening. | `1d52bf8` |
| created | `plugins/yarr/skills/sonarr/scripts/load-config.sh` | — | Plugin runtime, configuration, documentation, or fallback-client hardening. | `1d52bf8` |
| modified | `plugins/yarr/skills/sonarr/scripts/sonarr.sh` | — | Plugin runtime, configuration, documentation, or fallback-client hardening. | `1d52bf8` |
| modified | `plugins/yarr/skills/sonarr/SKILL.md` | — | Plugin runtime, configuration, documentation, or fallback-client hardening. | `1d52bf8` |
| modified | `plugins/yarr/skills/tautulli/README.md` | — | Plugin runtime, configuration, documentation, or fallback-client hardening. | `1d52bf8` |
| modified | `plugins/yarr/skills/tautulli/references/quick-reference.md` | — | Plugin runtime, configuration, documentation, or fallback-client hardening. | `1d52bf8` |
| modified | `plugins/yarr/skills/tautulli/references/troubleshooting.md` | — | Plugin runtime, configuration, documentation, or fallback-client hardening. | `1d52bf8` |
| created | `plugins/yarr/skills/tautulli/scripts/load-config.sh` | — | Plugin runtime, configuration, documentation, or fallback-client hardening. | `1d52bf8` |
| modified | `plugins/yarr/skills/tautulli/scripts/tautulli-api.sh` | — | Plugin runtime, configuration, documentation, or fallback-client hardening. | `1d52bf8` |
| modified | `plugins/yarr/skills/tautulli/SKILL.md` | — | Plugin runtime, configuration, documentation, or fallback-client hardening. | `1d52bf8` |
| created | `plugins/yarr/skills/tracearr/scripts/load-config.sh` | — | Plugin runtime, configuration, documentation, or fallback-client hardening. | `1d52bf8` |
| modified | `plugins/yarr/skills/tracearr/scripts/tracearr-api.sh` | — | Plugin runtime, configuration, documentation, or fallback-client hardening. | `1d52bf8` |
| modified | `plugins/yarr/skills/tracearr/SKILL.md` | — | Plugin runtime, configuration, documentation, or fallback-client hardening. | `1d52bf8` |
| modified | `plugins/yarr/skills/yarr/SKILL.md` | — | Plugin runtime, configuration, documentation, or fallback-client hardening. | `1d52bf8` |
| modified | `README.md` | — | Public project and release documentation alignment. | `1d52bf8` |
| modified | `release-please-config.json` | — | Build, release, configuration, metadata, or repository contract remediation. | `1d52bf8` |
| modified | `scripts/blob-size-allowlist.txt` | — | Automation, installer, security, distribution, or regression contract. | `1d52bf8` |
| modified | `scripts/block-env-commits.sh` | — | Automation, installer, security, distribution, or regression contract. | `1d52bf8` |
| modified | `scripts/check-coupled-files.sh` | — | Automation, installer, security, distribution, or regression contract. | `1d52bf8` |
| created | `scripts/check-dist-contract.js` | — | Automation, installer, security, distribution, or regression contract. | `1d52bf8` |
| modified | `scripts/check-plugin-hook-contract.py` | — | Automation, installer, security, distribution, or regression contract. | `1d52bf8` |
| created | `scripts/check-security-exceptions.sh` | — | Automation, installer, security, distribution, or regression contract. | `1d52bf8` |
| modified | `scripts/install.sh` | — | Automation, installer, security, distribution, or regression contract. | `1d52bf8` |
| modified | `scripts/pre-release-check.sh` | — | Automation, installer, security, distribution, or regression contract. | `1d52bf8` |
| modified | `scripts/README.md` | — | Automation, installer, security, distribution, or regression contract. | `1d52bf8, f13dcec` |
| modified | `scripts/refresh-docs.sh` | — | Automation, installer, security, distribution, or regression contract. | `1d52bf8` |
| created | `scripts/test-installers.js` | — | Automation, installer, security, distribution, or regression contract. | `1d52bf8` |
| created | `scripts/test-plugin-distribution.js` | — | Automation, installer, security, distribution, or regression contract. | `1d52bf8` |
| created | `scripts/test-plugin-http.js` | — | Automation, installer, security, distribution, or regression contract. | `1d52bf8` |
| modified | `scripts/test-template-features.sh` | — | Automation, installer, security, distribution, or regression contract. | `1d52bf8, f13dcec` |
| modified | `scripts/validate-plugin-layout.sh` | — | Automation, installer, security, distribution, or regression contract. | `1d52bf8` |
| modified | `server.json` | — | Build, release, configuration, metadata, or repository contract remediation. | `1d52bf8` |
| modified | `src/actions.rs` | — | Rust application, MCP, transport, configuration, performance, or service remediation. | `1d52bf8` |
| modified | `src/actions/commands/download.rs` | — | Rust application, MCP, transport, configuration, performance, or service remediation. | `1d52bf8` |
| modified | `src/actions/commands/stats.rs` | — | Rust application, MCP, transport, configuration, performance, or service remediation. | `1d52bf8` |
| modified | `src/actions/commands/trace.rs` | — | Rust application, MCP, transport, configuration, performance, or service remediation. | `1d52bf8` |
| modified | `src/actions/dispatch.rs` | — | Rust application, MCP, transport, configuration, performance, or service remediation. | `1d52bf8` |
| modified | `src/actions/help.rs` | — | Rust application, MCP, transport, configuration, performance, or service remediation. | `1d52bf8` |
| modified | `src/actions/model.rs` | — | Rust application, MCP, transport, configuration, performance, or service remediation. | `1d52bf8` |
| modified | `src/actions/parse_tests.rs` | — | Rust regression coverage for remediated behavior. | `1d52bf8` |
| modified | `src/actions/parse.rs` | — | Rust application, MCP, transport, configuration, performance, or service remediation. | `1d52bf8` |
| created | `src/actions/registry_queries_tests.rs` | — | Rust regression coverage for remediated behavior. | `1d52bf8` |
| created | `src/actions/registry_queries.rs` | — | Rust application, MCP, transport, configuration, performance, or service remediation. | `1d52bf8` |
| modified | `src/actions/registry_tests.rs` | — | Rust regression coverage for remediated behavior. | `1d52bf8` |
| modified | `src/actions/registry.rs` | — | Rust application, MCP, transport, configuration, performance, or service remediation. | `1d52bf8` |
| modified | `src/app_tests.rs` | — | Rust regression coverage for remediated behavior. | `1d52bf8` |
| modified | `src/app.rs` | — | Rust application, MCP, transport, configuration, performance, or service remediation. | `1d52bf8` |
| created | `src/app/codemode_artifacts_tests.rs` | — | Rust regression coverage for remediated behavior. | `1d52bf8` |
| created | `src/app/codemode_artifacts.rs` | — | Rust application, MCP, transport, configuration, performance, or service remediation. | `1d52bf8` |
| created | `src/app/codemode_dispatch_tests.rs` | — | Rust regression coverage for remediated behavior. | `1d52bf8` |
| created | `src/app/codemode_dispatch.rs` | — | Rust application, MCP, transport, configuration, performance, or service remediation. | `1d52bf8` |
| created | `src/app/codemode_runtime_tests.rs` | — | Rust regression coverage for remediated behavior. | `1d52bf8` |
| created | `src/app/codemode_runtime.rs` | — | Rust application, MCP, transport, configuration, performance, or service remediation. | `1d52bf8` |
| created | `src/app/codemode_snippets_tests.rs` | — | Rust regression coverage for remediated behavior. | `1d52bf8` |
| created | `src/app/codemode_snippets.rs` | — | Rust application, MCP, transport, configuration, performance, or service remediation. | `1d52bf8` |
| modified | `src/app/codemode_tests.rs` | — | Rust regression coverage for remediated behavior. | `1d52bf8` |
| modified | `src/app/codemode.rs` | — | Rust application, MCP, transport, configuration, performance, or service remediation. | `1d52bf8` |
| modified | `src/app/openapi_ops_tests.rs` | — | Rust regression coverage for remediated behavior. | `1d52bf8` |
| created | `src/app/openapi_ops_tests/recording_tests.rs` | — | Rust regression coverage for remediated behavior. | `1d52bf8` |
| created | `src/app/openapi_ops_tests/recording.rs` | — | Rust regression coverage for remediated behavior. | `1d52bf8` |
| modified | `src/app/openapi_ops.rs` | — | Rust application, MCP, transport, configuration, performance, or service remediation. | `1d52bf8` |
| created | `src/app/openapi_ops/body_tests.rs` | — | Rust regression coverage for remediated behavior. | `1d52bf8` |
| created | `src/app/openapi_ops/body.rs` | — | Rust application, MCP, transport, configuration, performance, or service remediation. | `1d52bf8` |
| created | `src/app/openapi_ops/parameters_tests.rs` | — | Rust regression coverage for remediated behavior. | `1d52bf8` |
| created | `src/app/openapi_ops/parameters.rs` | — | Rust application, MCP, transport, configuration, performance, or service remediation. | `1d52bf8` |
| modified | `src/cli.rs` | — | Rust application, MCP, transport, configuration, performance, or service remediation. | `1d52bf8, 8b4aa13` |
| modified | `src/cli/command.rs` | — | Rust application, MCP, transport, configuration, performance, or service remediation. | `8b4aa13` |
| modified | `src/cli/parse_tests.rs` | — | Rust regression coverage for remediated behavior. | `8b4aa13` |
| modified | `src/cli/parse.rs` | — | Rust application, MCP, transport, configuration, performance, or service remediation. | `8b4aa13` |
| created | `src/cli/router_infra_tests.rs` | — | Rust regression coverage for remediated behavior. | `1d52bf8, 8b4aa13` |
| created | `src/cli/router_infra.rs` | — | Rust application, MCP, transport, configuration, performance, or service remediation. | `1d52bf8, 8b4aa13` |
| modified | `src/cli/router_tests.rs` | — | Rust regression coverage for remediated behavior. | `1d52bf8` |
| modified | `src/cli/router.rs` | — | Rust application, MCP, transport, configuration, performance, or service remediation. | `1d52bf8` |
| modified | `src/cli/setup_tests.rs` | — | Rust regression coverage for remediated behavior. | `1d52bf8` |
| modified | `src/cli/setup/plugin_tests.rs` | — | Rust regression coverage for remediated behavior. | `1d52bf8` |
| modified | `src/cli/setup/plugin.rs` | — | Rust application, MCP, transport, configuration, performance, or service remediation. | `1d52bf8` |
| modified | `src/cli/usage.rs` | — | Rust application, MCP, transport, configuration, performance, or service remediation. | `8b4aa13` |
| modified | `src/cli/watch_tests.rs` | — | Rust regression coverage for remediated behavior. | `8b4aa13` |
| modified | `src/cli/watch.rs` | — | Rust application, MCP, transport, configuration, performance, or service remediation. | `8b4aa13` |
| modified | `src/codemode.rs` | — | Rust application, MCP, transport, configuration, performance, or service remediation. | `1d52bf8` |
| modified | `src/codemode/proxy.rs` | — | Rust application, MCP, transport, configuration, performance, or service remediation. | `1d52bf8` |
| modified | `src/codemode/semantic_tests.rs` | — | Rust regression coverage for remediated behavior. | `1d52bf8` |
| modified | `src/codemode/semantic.rs` | — | Rust application, MCP, transport, configuration, performance, or service remediation. | `1d52bf8` |
| modified | `src/codemode/store_tests.rs` | — | Rust regression coverage for remediated behavior. | `1d52bf8` |
| modified | `src/codemode/store.rs` | — | Rust application, MCP, transport, configuration, performance, or service remediation. | `1d52bf8` |
| modified | `src/config_tests.rs` | — | Rust regression coverage for remediated behavior. | `1d52bf8` |
| modified | `src/config.rs` | — | Rust application, MCP, transport, configuration, performance, or service remediation. | `1d52bf8` |
| modified | `src/config/auth_tests.rs` | — | Rust regression coverage for remediated behavior. | `1d52bf8` |
| modified | `src/config/auth.rs` | — | Rust application, MCP, transport, configuration, performance, or service remediation. | `1d52bf8` |
| created | `src/config/environment_tests.rs` | — | Rust regression coverage for remediated behavior. | `1d52bf8` |
| created | `src/config/environment.rs` | — | Rust application, MCP, transport, configuration, performance, or service remediation. | `1d52bf8` |
| modified | `src/config/mcp_tests.rs` | — | Rust regression coverage for remediated behavior. | `1d52bf8` |
| modified | `src/config/mcp.rs` | — | Rust application, MCP, transport, configuration, performance, or service remediation. | `1d52bf8` |
| modified | `src/config/services_tests.rs` | — | Rust regression coverage for remediated behavior. | `1d52bf8` |
| modified | `src/config/services.rs` | — | Rust application, MCP, transport, configuration, performance, or service remediation. | `1d52bf8` |
| modified | `src/lib.rs` | — | Rust application, MCP, transport, configuration, performance, or service remediation. | `1d52bf8` |
| modified | `src/logging_tests.rs` | — | Rust regression coverage for remediated behavior. | `1d52bf8` |
| modified | `src/logging.rs` | — | Rust application, MCP, transport, configuration, performance, or service remediation. | `1d52bf8` |
| modified | `src/logging/aurora.rs` | — | Rust application, MCP, transport, configuration, performance, or service remediation. | `1d52bf8` |
| modified | `src/main.rs` | — | Rust application, MCP, transport, configuration, performance, or service remediation. | `1d52bf8, 8b4aa13` |
| modified | `src/mcp/elicit_tests.rs` | — | Rust regression coverage for remediated behavior. | `1d52bf8` |
| modified | `src/mcp/elicit.rs` | — | Rust application, MCP, transport, configuration, performance, or service remediation. | `1d52bf8` |
| created | `src/mcp/rmcp_server_definitions_tests.rs` | — | Rust regression coverage for remediated behavior. | `1d52bf8` |
| created | `src/mcp/rmcp_server_definitions.rs` | — | Rust application, MCP, transport, configuration, performance, or service remediation. | `1d52bf8` |
| created | `src/mcp/rmcp_server_errors_tests.rs` | — | Rust regression coverage for remediated behavior. | `1d52bf8` |
| created | `src/mcp/rmcp_server_errors.rs` | — | Rust application, MCP, transport, configuration, performance, or service remediation. | `1d52bf8` |
| modified | `src/mcp/rmcp_server_tests.rs` | — | Rust regression coverage for remediated behavior. | `1d52bf8` |
| modified | `src/mcp/rmcp_server.rs` | — | Rust application, MCP, transport, configuration, performance, or service remediation. | `1d52bf8` |
| modified | `src/mcp/schemas.rs` | — | Rust application, MCP, transport, configuration, performance, or service remediation. | `1d52bf8` |
| modified | `src/mcp/tools.rs` | — | Rust application, MCP, transport, configuration, performance, or service remediation. | `1d52bf8` |
| created | `src/models/tracearr_activity_tests.rs` | — | Rust regression coverage for remediated behavior. | `1d52bf8` |
| created | `src/models/tracearr_activity.rs` | — | Rust application, MCP, transport, configuration, performance, or service remediation. | `1d52bf8` |
| created | `src/models/tracearr_core_tests.rs` | — | Rust regression coverage for remediated behavior. | `1d52bf8` |
| created | `src/models/tracearr_core.rs` | — | Rust application, MCP, transport, configuration, performance, or service remediation. | `1d52bf8` |
| created | `src/models/tracearr_history_tests.rs` | — | Rust regression coverage for remediated behavior. | `1d52bf8` |
| created | `src/models/tracearr_history.rs` | — | Rust application, MCP, transport, configuration, performance, or service remediation. | `1d52bf8` |
| modified | `src/models/tracearr_tests.rs` | — | Rust regression coverage for remediated behavior. | `1d52bf8` |
| modified | `src/models/tracearr.rs` | — | Rust application, MCP, transport, configuration, performance, or service remediation. | `1d52bf8` |
| modified | `src/openapi_tests.rs` | — | Rust regression coverage for remediated behavior. | `1d52bf8` |
| modified | `src/openapi.rs` | — | Rust application, MCP, transport, configuration, performance, or service remediation. | `1d52bf8` |
| modified | `src/openapi/generated/jellyfin.rs` | — | Rust application, MCP, transport, configuration, performance, or service remediation. | `1d52bf8` |
| modified | `src/openapi/generated/overseerr.rs` | — | Rust application, MCP, transport, configuration, performance, or service remediation. | `1d52bf8` |
| modified | `src/openapi/generated/plex.rs` | — | Rust application, MCP, transport, configuration, performance, or service remediation. | `1d52bf8` |
| modified | `src/openapi/generated/prowlarr.rs` | — | Rust application, MCP, transport, configuration, performance, or service remediation. | `1d52bf8` |
| modified | `src/openapi/generated/radarr.rs` | — | Rust application, MCP, transport, configuration, performance, or service remediation. | `1d52bf8` |
| modified | `src/openapi/generated/sonarr.rs` | — | Rust application, MCP, transport, configuration, performance, or service remediation. | `1d52bf8` |
| modified | `src/server_tests.rs` | — | Rust regression coverage for remediated behavior. | `1d52bf8` |
| modified | `src/server.rs` | — | Rust application, MCP, transport, configuration, performance, or service remediation. | `1d52bf8` |
| modified | `src/server/routes_tests.rs` | — | Rust regression coverage for remediated behavior. | `1d52bf8` |
| created | `src/server/routes_tests/auth_tests.rs` | — | Rust regression coverage for remediated behavior. | `1d52bf8` |
| created | `src/server/routes_tests/auth.rs` | — | Rust regression coverage for remediated behavior. | `1d52bf8` |
| created | `src/server/routes_tests/metrics_tests.rs` | — | Rust regression coverage for remediated behavior. | `1d52bf8` |
| created | `src/server/routes_tests/metrics.rs` | — | Rust regression coverage for remediated behavior. | `1d52bf8` |
| modified | `src/server/routes.rs` | — | Rust application, MCP, transport, configuration, performance, or service remediation. | `1d52bf8` |
| created | `src/server/token_rate_limit_tests.rs` | — | Rust regression coverage for remediated behavior. | `1d52bf8` |
| created | `src/server/token_rate_limit.rs` | — | Rust application, MCP, transport, configuration, performance, or service remediation. | `1d52bf8` |
| modified | `src/yarr_tests.rs` | — | Rust regression coverage for remediated behavior. | `1d52bf8` |
| modified | `src/yarr.rs` | — | Rust application, MCP, transport, configuration, performance, or service remediation. | `1d52bf8` |
| modified | `src/yarr/auth_tests.rs` | — | Rust regression coverage for remediated behavior. | `1d52bf8, f13dcec` |
| modified | `src/yarr/auth.rs` | — | Rust application, MCP, transport, configuration, performance, or service remediation. | `1d52bf8` |
| created | `src/yarr/openapi_transport_tests.rs` | — | Rust regression coverage for remediated behavior. | `1d52bf8` |
| created | `src/yarr/openapi_transport.rs` | — | Rust application, MCP, transport, configuration, performance, or service remediation. | `1d52bf8` |
| created | `src/yarr/response_tests.rs` | — | Rust regression coverage for remediated behavior. | `1d52bf8` |
| created | `src/yarr/response.rs` | — | Rust application, MCP, transport, configuration, performance, or service remediation. | `1d52bf8` |
| modified | `tests/plugin_contract.rs` | — | Repository-level contract, parity, plugin, or dispatch regression coverage. | `1d52bf8` |
| created | `tests/plugin_contract/common.rs` | — | Repository-level contract, parity, plugin, or dispatch regression coverage. | `1d52bf8` |
| created | `tests/plugin_contract/manifests.rs` | — | Repository-level contract, parity, plugin, or dispatch regression coverage. | `1d52bf8` |
| created | `tests/plugin_contract/oauth.rs` | — | Repository-level contract, parity, plugin, or dispatch regression coverage. | `1d52bf8` |
| created | `tests/plugin_contract/setup.rs` | — | Repository-level contract, parity, plugin, or dispatch regression coverage. | `1d52bf8` |
| modified | `tests/template_invariants.rs` | — | Repository-level contract, parity, plugin, or dispatch regression coverage. | `1d52bf8` |
| modified | `tests/tool_dispatch.rs` | — | Repository-level contract, parity, plugin, or dispatch regression coverage. | `1d52bf8` |
| modified | `xtask/Cargo.toml` | — | Canonical CI, generation, live-contract, documentation, or policy tooling. | `1d52bf8` |
| created | `xtask/src/ci_tests.rs` | — | xtask regression and contract coverage. | `1d52bf8` |
| created | `xtask/src/ci.rs` | — | Canonical CI, generation, live-contract, documentation, or policy tooling. | `1d52bf8` |
| modified | `xtask/src/gen_openapi_tests.rs` | — | xtask regression and contract coverage. | `1d52bf8` |
| modified | `xtask/src/gen_openapi.rs` | — | Canonical CI, generation, live-contract, documentation, or policy tooling. | `1d52bf8` |
| created | `xtask/src/gen_openapi/emit.rs` | — | Canonical CI, generation, live-contract, documentation, or policy tooling. | `1d52bf8` |
| created | `xtask/src/gen_openapi/extract.rs` | — | Canonical CI, generation, live-contract, documentation, or policy tooling. | `1d52bf8` |
| created | `xtask/src/gen_openapi/naming.rs` | — | Canonical CI, generation, live-contract, documentation, or policy tooling. | `1d52bf8` |
| created | `xtask/src/gen_openapi/types.rs` | — | Canonical CI, generation, live-contract, documentation, or policy tooling. | `1d52bf8` |
| modified | `xtask/src/live.rs` | — | Canonical CI, generation, live-contract, documentation, or policy tooling. | `1d52bf8` |
| modified | `xtask/src/live/contract_tests.rs` | — | xtask regression and contract coverage. | `1d52bf8` |
| modified | `xtask/src/live/contract.rs` | — | Canonical CI, generation, live-contract, documentation, or policy tooling. | `1d52bf8` |
| modified | `xtask/src/live/contract/fixture_args.rs` | — | Canonical CI, generation, live-contract, documentation, or policy tooling. | `1d52bf8` |
| created | `xtask/src/live/contract/fixture_args/values.rs` | — | Canonical CI, generation, live-contract, documentation, or policy tooling. | `1d52bf8` |
| created | `xtask/src/live/contract/harvest.rs` | — | Canonical CI, generation, live-contract, documentation, or policy tooling. | `1d52bf8` |
| created | `xtask/src/live/contract/operations.rs` | — | Canonical CI, generation, live-contract, documentation, or policy tooling. | `1d52bf8` |
| modified | `xtask/src/live/contract/synth_tests.rs` | — | xtask regression and contract coverage. | `1d52bf8` |
| modified | `xtask/src/live/contract/synth.rs` | — | Canonical CI, generation, live-contract, documentation, or policy tooling. | `1d52bf8` |
| created | `xtask/src/live/contract/synth/relax.rs` | — | Canonical CI, generation, live-contract, documentation, or policy tooling. | `1d52bf8` |
| modified | `xtask/src/live/coverage/services_part1.rs` | — | Canonical CI, generation, live-contract, documentation, or policy tooling. | `1d52bf8` |
| modified | `xtask/src/live/coverage/services_part2.rs` | — | Canonical CI, generation, live-contract, documentation, or policy tooling. | `1d52bf8` |
| modified | `xtask/src/live/lifecycles.rs` | — | Canonical CI, generation, live-contract, documentation, or policy tooling. | `1d52bf8` |
| created | `xtask/src/live/lifecycles/services.rs` | — | Canonical CI, generation, live-contract, documentation, or policy tooling. | `1d52bf8` |
| modified | `xtask/src/live/mcporter.rs` | — | Canonical CI, generation, live-contract, documentation, or policy tooling. | `1d52bf8` |
| modified | `xtask/src/live/mcporter/classify.rs` | — | Canonical CI, generation, live-contract, documentation, or policy tooling. | `1d52bf8` |
| created | `xtask/src/live/mcporter/classify/domain.rs` | — | Canonical CI, generation, live-contract, documentation, or policy tooling. | `1d52bf8` |
| created | `xtask/src/live/mcporter/classify/services.rs` | — | Canonical CI, generation, live-contract, documentation, or policy tooling. | `1d52bf8` |
| created | `xtask/src/live/mcporter/execution.rs` | — | Canonical CI, generation, live-contract, documentation, or policy tooling. | `1d52bf8` |
| modified | `xtask/src/live/surface.rs` | — | Canonical CI, generation, live-contract, documentation, or policy tooling. | `1d52bf8` |
| modified | `xtask/src/main.rs` | — | Canonical CI, generation, live-contract, documentation, or policy tooling. | `1d52bf8` |
| modified | `xtask/src/patterns/checks.rs` | — | Canonical CI, generation, live-contract, documentation, or policy tooling. | `1d52bf8, 8b4aa13` |
| modified | `xtask/src/patterns/surfaces.rs` | — | Canonical CI, generation, live-contract, documentation, or policy tooling. | `1d52bf8` |
| created | `xtask/src/tool_docs_tests.rs` | — | xtask regression and contract coverage. | `1d52bf8` |
| modified | `xtask/src/tool_docs.rs` | — | Canonical CI, generation, live-contract, documentation, or policy tooling. | `1d52bf8` |
| modified | `xtask/src/tool_docs/endpoints.rs` | — | Canonical CI, generation, live-contract, documentation, or policy tooling. | `1d52bf8` |
| created | `xtask/src/tool_docs/render_tests.rs` | — | xtask regression and contract coverage. | `1d52bf8` |
| created | `xtask/src/tool_docs/render.rs` | — | Canonical CI, generation, live-contract, documentation, or policy tooling. | `1d52bf8` |

## Beads Activity

| bead | title | actions | final status | why it mattered |
|---|---|---|---|---|
| `rustarr-v1g` | Comprehensive full-project review and P0-P3 remediation | Created, claimed, updated with review/remediation evidence, and closed | closed | Tracked the entire 76-finding review and required full verification. |
| `rustarr-xsw` | Fix post-review container scan and notifier failures | Created after the first production failure, claimed, updated, and closed with the production run evidence | closed | Ensured the container runtime, notifier, SARIF severity gate, regression contracts, and production promotion were genuinely fixed. |

The final close reason for `rustarr-xsw` records distroless runtime, app-native readiness, repository-scoped notification, SARIF severity enforcement, regression contracts, and production build/scan/promotion. A `bd dolt push` was attempted earlier and reported that no remote was configured, so the bead state remains in local Dolt storage.

## Repository Maintenance

### Plans

- `find docs/plans -maxdepth 2 -type f` returned no plan files. No completed plans were moved and no plan directory was created.

### Beads

- Read `rustarr-v1g` and `rustarr-xsw` before considering tracker changes. Both were already closed with observed implementation and verification evidence, so no additional bead mutation or follow-up bead was needed.

### Worktrees and branches

- The primary worktree was clean on `main`; `HEAD` and `origin/main` both resolved to `f13dcec2f2a395a49762612124cb7290a0209e22`.
- Delivered squash-merged topic branches `codex/container-scan-remediation` and `codex/trivy-sarif-severity` were safely force-deleted locally after their PRs were confirmed merged and remote branches were gone.
- The registered `marketplace-no-mcp` worktree had a broken `.git` pointer to retired `/home/jmagar/workspace/rustarr`. `git worktree repair /home/jmagar/workspace/_no_mcp_worktrees/rustarr` repaired it.
- After repair, that worktree showed an unrelated modification to `scripts/cargo-rustc-wrapper`. It was not changed, reset, synchronized, or removed. The local branch remains behind its remote for its owning workflow.
- Open Dependabot/release PR branches and remote branches with unclear ownership or retained post-merge refs were not deleted. Evidence came from `git branch -r -vv` and `gh pr list --state all --head ...`.

### Stale documentation

- Runtime/container guidance was checked with `rg` against `entrypoint.sh`, Debian version, distroless, `watch --once`, and Trivy SARIF severity behavior.
- Active documentation consistently describes the pinned distroless runtime and application-native readiness. No additional stale-doc edit was required during the save pass.

### Transcript transparency

- The only Claude transcript discovered for the repository predated this Codex session, and no matching current Codex JSONL transcript was found. It was not attributed to this session; this document was reconstructed from live repository, review artifacts, Git/GitHub evidence, beads, and active conversation context.

## Tools and Skills Used

- **Skills.** `comprehensive-review:full-review` drove the four-phase review; `vibin:save-to-md` drove this artifact, maintenance pass, and docs-only landing.
- **Parallel agents.** Review and remediation agents handled bounded areas concurrently. Shared-checkout collisions and capacity were managed by integrating verified changes in the root checkout.
- **Shell and file tools.** `rg`, Git, Cargo, npm, shell/Python/JavaScript contract scripts, Docker, Trivy, and patch-based file editing were used for inspection, implementation, and verification.
- **GitHub CLI/API.** `gh` inspected PRs, checks, workflow runs, annotations, security alerts, upstream action behavior, and performed PR creation/merge.
- **Beads CLI.** `bd` created, claimed, inspected, updated, closed, and attempted to synchronize the two session issues.
- **MCP/browser tools.** No Labby MCP server or browser automation was required; repository, container, and GitHub evidence were sufficient.
- **Issues encountered.** Production scan behavior, notifier repository context, a test HTTP keepalive flake, squash-merge ancestry cleanup, and a renamed-repository worktree pointer required targeted diagnosis and retries.

## Commands Executed

| command | result |
|---|---|
| `cargo xtask ci` | Passed all 13 canonical CI phases after remediation. |
| `cargo test` and targeted Rust suites | Passed 647 current Rust tests; targeted qBittorrent retry-disabled stress passed 30/30. |
| `cargo fmt --check && cargo clippy --all-targets --all-features -- -D warnings` | Passed formatting and warning-free lint gates. |
| `npm test --prefix packages/yarr-mcp` | Passed 18 npm tests. |
| Plugin/package/feature contract scripts | Passed 61 plugin checks and 7 workflow feature contracts. |
| `docker build`, health smoke, and Trivy scan | Distroless image became healthy and had zero HIGH/CRITICAL findings locally. |
| `gh run view 29503834462` | Production build, immutable-digest scan, SARIF upload, and promotion succeeded. |
| `gh api repos/jmagar/yarr/dependabot/alerts` | Returned no open Dependabot alerts. |
| `gh api repos/jmagar/yarr/code-scanning/alerts` | Returned no open code-scanning alerts. |
| `git branch -D codex/container-scan-remediation codex/trivy-sarif-severity` | Removed the two proven-delivered local squash-merged branches. |
| `git worktree repair /home/jmagar/workspace/_no_mcp_worktrees/rustarr` | Repaired the stale gitdir pointer; status exposed an unrelated dirty file that was preserved. |
| `git rev-parse HEAD && git rev-parse origin/main` | Both returned `f13dcec2f2a395a49762612124cb7290a0209e22` before this session-log commit. |

## Errors Encountered

- **Wrong injected path.** `/home/jmagar/workspace/rustarr` did not exist because the checkout is now `/home/jmagar/workspace/yarr-rmcp`; remote and worktree evidence established the target.
- **First production publication failure.** Debian 12 runtime packages produced HIGH/CRITICAL findings and the notifier lacked repository context. PR #61 moved to pinned distroless/non-root and explicit repository context.
- **Second scan failure.** The pinned Trivy action unset `TRIVY_SEVERITY` in SARIF mode unless `limit-severities-for-sarif` was enabled. PR #63 enabled and regression-tested it.
- **qBittorrent test flake.** The mock HTTP/1.1 server retained connections unexpectedly; explicit `Connection: close` made retry-disabled stress deterministic.
- **Local branch cleanup warning.** `git branch -d` did not recognize squash ancestry. Confirmed merged PRs/deleted remotes justified `git branch -D` for only those branches.
- **Broken secondary worktree pointer.** The marketplace worktree referenced the retired repo path. `git worktree repair` fixed it; its unrelated dirty file prevented further cleanup and was preserved.
- **Initial save patch placement.** The app injected the retired working directory, so the first relative patch did not materialize. Structural validation caught it before staging; the patch was reapplied with `apply_patch` explicitly rooted in the live repo.

## Behavior Changes (Before/After)

| area | before | after |
|---|---|---|
| MCP authorization | Caller metadata could bypass scope/destructive controls and invoke hidden or nested operations. | Authorization uses the resolved operation; hidden/destructive paths fail closed and are adversarially tested. |
| OpenAPI operations | Generated dispatch lost protocol semantics and could expose invalid fixture behavior. | Parameter, serialization, representation, binary, and body semantics are preserved and tested. |
| Multi-instance services | Identity and qBittorrent cookies could collapse across instances. | Instance-aware routing and isolated sessions support same-host multi-instance use. |
| Code Mode | Expensive runtimes, calls, bodies, artifacts, and cache misses were insufficiently bounded. | Concurrency, deadlines, bytes, quotas, retention, caching, and I/O are bounded. |
| Plugin/npm distribution | Bundled Linux binary, executable settings, weak redirects, and sync launch were unsafe/nonportable. | Targets are verified, settings data-only, downloads bounded/integrity-checked, and launcher lifecycle correct. |
| Container runtime | Debian/root shell entrypoint and liveness probe expanded risk. | Pinned distroless Debian 13 runs directly as UID/GID 1000 with app-native readiness. |
| Image publication | Tags could be promoted before a reliable vulnerability gate. | A quarantined immutable digest must pass HIGH/CRITICAL scanning before promotion. |
| CI and operations | Gates, ownership, alerts, rollback, and runbooks were incomplete or contradictory. | CI mirrors policy and delivery has ownership, observability, notifications, rollback, and incident guidance. |

## Verification Evidence

| command | expected | actual | status |
|---|---|---|---|
| `cargo xtask ci` | All canonical phases pass | 13/13 passed | pass |
| Rust test matrix | No regressions | 647/647 passed | pass |
| Plugin contracts | All plugin layouts/hooks/config clients valid | 61 checks passed | pass |
| npm tests | Portable package/install/launcher behavior | 18 tests passed | pass |
| Workflow feature contracts | Publication/notifier/security invariants enforced | 7/7 passed | pass |
| qBittorrent stress | Retry-disabled mock deterministic | 30/30 passed | pass |
| Docker local scan | No HIGH/CRITICAL findings | 0 HIGH/CRITICAL | pass |
| Main CI run 29503647343 | Successful | successful | pass |
| MSRV run 29503647380 | Successful | successful | pass |
| CodeQL run 29503647405 | Successful with no annotations | successful; annotations `[]` | pass |
| Marketplace sync run 29503647463 | Successful | successful | pass |
| Docker Publish run 29503834462 | Build, scan, promote | successful | pass |
| Published digest | Match verified candidate | `sha256:f5e2fb434277d353e248db280fdfc0ad6605fa3b0db0fb99e098b9738eb3a174` | pass |
| Security alert APIs | No open alerts | Dependabot 0; code scanning 0 | pass |
| Git synchronization | Local and remote main identical | both `f13dcec2f2a395a49762612124cb7290a0209e22` | pass |

## Risks and Rollback

- The remediation is broad. Roll back by reverting the relevant squash merge (#57, #59, #61, or #63), not by partially editing generated/source-of-truth files.
- Container rollback can pin a previous known digest while retaining scan-before-promotion; do not restore the shell/root entrypoint.
- The Marvin RSA timing advisory is mitigated but not eliminated upstream. Review or remove the exception by 2026-10-01.
- The marketplace worktree contains unrelated dirty `scripts/cargo-rustc-wrapper`; inspect ownership before updating, resetting, or removing it.

## Decisions Not Taken

- No P0-P3 finding was accepted as deferred; duplicates were tracked as shared root causes while preserving phase reports.
- Ignored `.full-review/` evidence was not added to product history; this durable session artifact summarizes it.
- Remote branches with open PRs, generated roles, or unclear ownership were not deleted.
- The dirty marketplace worktree was repaired but not synchronized or cleaned.
- No force push, hard reset, or broad staging command was used.

## References

- [PR #57 — comprehensive remediation](https://github.com/dinglebear-ai/yarr/pull/57)
- [PR #59 — CodeQL and dependency security alignment](https://github.com/dinglebear-ai/yarr/pull/59)
- [PR #61 — container publication hardening](https://github.com/dinglebear-ai/yarr/pull/61)
- [PR #63 — Trivy SARIF severity enforcement](https://github.com/dinglebear-ai/yarr/pull/63)
- [Production Docker Publish run 29503834462](https://github.com/dinglebear-ai/yarr/actions/runs/29503834462)
- Local detailed report: `.full-review/05-final-report.md`

## Next Steps

The requested review and P0-P3 remediation are finished. Follow-on maintenance, not unfinished review work:

1. Review or remove the Marvin RSA timing exception by 2026-10-01.
2. Inspect the user-owned `scripts/cargo-rustc-wrapper` modification in the `marketplace-no-mcp` worktree before updating that generated branch.
3. Continue normal release handling through the existing release-please PR after its required checks are green.

