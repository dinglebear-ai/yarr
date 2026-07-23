# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

* **unraid:** add canonical settings/dashboard routes, original Yarr artwork, a persistent dashboard toggle, and a compact freshness-aware runtime widget

### Fixed

* **unraid:** enforce cache-busted page assets and canonical root-owned mode-0755 package directories

## [2.1.0](https://github.com/dinglebear-ai/yarr/compare/v2.0.1...v2.1.0) (2026-07-20)


### Added

* add shart stack lifecycle commands ([#69](https://github.com/dinglebear-ai/yarr/issues/69)) ([e45e4e6](https://github.com/dinglebear-ai/yarr/commit/e45e4e6850ba704b9c55c89003c0b8690e419911))

## [2.0.1](https://github.com/dinglebear-ai/yarr/compare/v2.0.0...v2.0.1) (2026-07-16)


### Fixed

* **release:** couple server.json YARR_VERSION placeholder to package version ([#67](https://github.com/dinglebear-ai/yarr/issues/67)) ([e11e645](https://github.com/dinglebear-ai/yarr/commit/e11e645ae3b02b90e5901f308153771545f7e334))

## [2.0.0](https://github.com/dinglebear-ai/yarr/compare/v1.1.1...v2.0.0) (2026-07-16)


### ⚠ BREAKING CHANGES

* remove the confirm=true param/--confirm flag entirely

### Added

* add api_put and api_delete passthrough actions ([c86ba59](https://github.com/dinglebear-ai/yarr/commit/c86ba591b685d1776cf6df2eb190902944a91d2c))
* add yarr npm launcher package ([82ea89f](https://github.com/dinglebear-ai/yarr/commit/82ea89f45e9afb68f1e55a647821714a330e3117))
* **C1:** ArrManager read commands (sonarr, radarr) + curated-command pattern ([c46e295](https://github.com/dinglebear-ai/yarr/commit/c46e2952ad44b9658124ac60597c99e734f9a785))
* **C2:** ArrManager write commands incl. set-quality (sonarr, radarr) ([d901aa9](https://github.com/dinglebear-ai/yarr/commit/d901aa9c8b4176bf7fcf3f334eabd02c5a41e747))
* **C3:** ArrManager v1 — lidarr (artist), readarr (author) ([0fa1b5c](https://github.com/dinglebear-ai/yarr/commit/0fa1b5c2e5ce4fd94ec2cf5d83f6d34546dcb1b7))
* **C4:** Indexer capability (prowlarr) ([656f7ea](https://github.com/dinglebear-ai/yarr/commit/656f7eac8bc6aa4fd7fbb400850da256f70d7726))
* **C5:** DownloadClient capability (sabnzbd, qbittorrent) ([35657fb](https://github.com/dinglebear-ai/yarr/commit/35657fb286ed794e552e40cbc9e006c5bba17fd5))
* **C6:** MediaServer capability (plex, jellyfin) ([7c0debf](https://github.com/dinglebear-ai/yarr/commit/7c0debfa6acf2f5adb86ccebda00beb4bca95fa8))
* **C7:** Requests capability (overseerr) ([e278615](https://github.com/dinglebear-ai/yarr/commit/e278615477fde6b5f4144f2e6b8b27bec6a74b70))
* **C8:** Stats capability (tautulli) ([10a2a7d](https://github.com/dinglebear-ai/yarr/commit/10a2a7d275bf6cec0894da55365366b47519d1d0))
* **C9+C10:** GenericOnly tier — bazarr/tracearr/wizarr/notifiarr ([5fa06cd](https://github.com/dinglebear-ai/yarr/commit/5fa06cd68a575bcddffa834158bad1b72f89d3e9))
* **cli:** add 'setup install' (copies binary to ~/.local/bin) ([b8d2310](https://github.com/dinglebear-ai/yarr/commit/b8d2310b97b2b5537ce3ccb7ab3db429589c2618))
* **codemode:** blend TEI semantic similarity into codemode.search() ([ad6fa40](https://github.com/dinglebear-ai/yarr/commit/ad6fa400bfa556066ae100bfd1748b895378fab8))
* curate bazarr and tracearr surfaces ([27965b2](https://github.com/dinglebear-ai/yarr/commit/27965b210e65d2f529f98da80c34b13c42b7d98a))
* **F1:** descriptor-table foundation — capability model + actions split ([9bb8367](https://github.com/dinglebear-ai/yarr/commit/9bb83675b8e0ef2cd95a4192584cf54f3400215d))
* **F2:** transport split + per-service auth from KindDescriptor ([5eab37c](https://github.com/dinglebear-ai/yarr/commit/5eab37c2b3ac1ed63ef5cdf5f4f9d0326ad5ecea))
* **F3:** service-grouped CLI router + generated usage ([93138ab](https://github.com/dinglebear-ai/yarr/commit/93138abdb247bb0466dea99ad5ce5117532bb6dc))
* **F4:** registry-generated MCP schema + shared action×kind validation ([cf17205](https://github.com/dinglebear-ai/yarr/commit/cf17205ca57eb2ed889dc57dfca720e7966447ea))
* **mcp:** add YARR_MCP_TOOL_MODE=flat ([b13c15b](https://github.com/dinglebear-ai/yarr/commit/b13c15bfa2172c5d61a3b71dccdd4c4e6b46aee6))
* **plugins:** default yarr plugin's MCP connection to stdio ([cee8c0b](https://github.com/dinglebear-ai/yarr/commit/cee8c0bf224d0fa539f39d9f8eedb2938025bd07))
* **plugins:** split per-service skills into standalone plugins + marketplaces ([e527d85](https://github.com/dinglebear-ai/yarr/commit/e527d854bf8b91c838e50a30d1911734aeecd536))
* **plugins:** wire up Gemini CLI's yarr MCP connection over stdio ([b8d3f30](https://github.com/dinglebear-ai/yarr/commit/b8d3f3043514e6fa564cc7c49064664e564f0f1d))
* scaffold rustarr fleet mcp server ([14f2a85](https://github.com/dinglebear-ai/yarr/commit/14f2a85f48e7c740cd383c34af9031b1f7bfa16d))
* typed upstream contracts (11 services) + in-process Code Mode ([#21](https://github.com/dinglebear-ai/yarr/issues/21)) ([cd260d1](https://github.com/dinglebear-ai/yarr/commit/cd260d1ea557052c98b146053f373d05b311acf1))
* ungate writes; gate destructive deletes via MCP elicitation ([#17](https://github.com/dinglebear-ai/yarr/issues/17)) ([c753ec1](https://github.com/dinglebear-ai/yarr/commit/c753ec1f72a8edb94f9ab561588d9944c8af3c76))
* **Z1:** mechanical CLI↔MCP parity test + docs + usage verbs ([bb81f89](https://github.com/dinglebear-ai/yarr/commit/bb81f89a29106e7b1f23817159cc75ddc5e3d218))


### Fixed

* accept qbittorrent 204 login success ([f0d2194](https://github.com/dinglebear-ai/yarr/commit/f0d21949a1395ea54bb90d38197186ea20612629))
* address CodeRabbit review (auth, query-encoding, validation, docs) ([d9448fb](https://github.com/dinglebear-ai/yarr/commit/d9448fbf2dc647f0836b397ca157808023dae574))
* address PR [#8](https://github.com/dinglebear-ai/yarr/issues/8) review findings (correctness, types, comments, tests) ([065c77e](https://github.com/dinglebear-ai/yarr/commit/065c77ec3ccc10564f751a68a6c3c88891fdc51e))
* address rustarr full-review findings ([1f297e0](https://github.com/dinglebear-ai/yarr/commit/1f297e0fd0a2a46ef9e3914df140374620cc0417))
* address yarr rebrand review findings ([333ae07](https://github.com/dinglebear-ai/yarr/commit/333ae07071965b18600776e0269dc2506971ef05))
* align rustarr docker runtime ([001a4c2](https://github.com/dinglebear-ai/yarr/commit/001a4c2f6437e2075b3b736547d75e854556b097))
* **arr:** CLI delete routes --id to singular id key (was always failing) ([a8eb2af](https://github.com/dinglebear-ai/yarr/commit/a8eb2af53e0a720e954d80973972738165bc4be7))
* **ci:** align codeql-action/analyze to v4.36.3 ([069405d](https://github.com/dinglebear-ai/yarr/commit/069405d3b72a85b103747711ea803963247954ba))
* **ci:** align codeql-action/analyze to v4.36.3 ([c87bdce](https://github.com/dinglebear-ai/yarr/commit/c87bdce92a616788cd951bdd0a22d46929675991))
* **ci:** couple plugin manifest launcher pins to release version ([#65](https://github.com/dinglebear-ai/yarr/issues/65)) ([ae7a18e](https://github.com/dinglebear-ai/yarr/commit/ae7a18e192eee53712e7f8d6d06bd168552bde2f))
* **ci:** derive plugin-layout pin from package.json; keep sync out of scripts/ ([#66](https://github.com/dinglebear-ai/yarr/issues/66)) ([b433487](https://github.com/dinglebear-ai/yarr/commit/b433487d66d7485ae724b51273a8beb195afac00))
* **ci:** replace non-ASCII glyphs in docs/comments (asciicheck) ([658d726](https://github.com/dinglebear-ai/yarr/commit/658d7269eb7d184b8c484e6913b2612ae7071982))
* **ci:** switch OpenWiki to local openai-compatible proxy ([19ea54e](https://github.com/dinglebear-ai/yarr/commit/19ea54ecc4cec7be49d86c4a62c01ec05f5fc35f))
* **ci:** update xtask patterns check for new layout; split live.rs ([aa9c176](https://github.com/dinglebear-ai/yarr/commit/aa9c176cc97b07e7a66b0bbff5eedb4e0473c481))
* **config:** stop consulting CLAUDE_PLUGIN_DATA — load ~/.rustarr/.env and write setup there (canonical appdata, honoring RUSTARR_HOME) ([effa93f](https://github.com/dinglebear-ai/yarr/commit/effa93f49976ab76e85a9e78567a4ea853223490))
* correct rustarr MCP port to assigned 40070 (was template-leftover 40060, collided with rustcane) ([1a7b7e1](https://github.com/dinglebear-ai/yarr/commit/1a7b7e15bbfc3308483ce32ef4701fae79b1cc1c))
* **deps:** bump crossbeam-epoch to 0.9.20 (RUSTSEC-2026-0204) ([47ef606](https://github.com/dinglebear-ai/yarr/commit/47ef606aef99abfd6201c927db0ac1b104d3ea7e))
* **docs:** ASCII-hygiene fix for OpenWiki testing doc ([4ad1016](https://github.com/dinglebear-ai/yarr/commit/4ad1016f3925b92d0cc75154dc2535b0f0118810))
* **docs:** replace non-ASCII check/cross emoji in openwiki/testing.md ([99a3db3](https://github.com/dinglebear-ai/yarr/commit/99a3db326132b8b68dad3dfb5376ae5ec5b85a76))
* harden container publication ([#61](https://github.com/dinglebear-ai/yarr/issues/61)) ([8b4aa13](https://github.com/dinglebear-ai/yarr/commit/8b4aa137467aec1455b628c420d954fe077607b7))
* harden rustarr cli and rest validation ([2e3df1c](https://github.com/dinglebear-ai/yarr/commit/2e3df1cc12038115f5213a6796071138b0375e4b))
* harden yarr rebrand migration closeout ([30fadfa](https://github.com/dinglebear-ai/yarr/commit/30fadfa47b1d1a3dc65f52755c3ea73b78e51f33))
* let doctor pass for healthy running server ([f7bbec8](https://github.com/dinglebear-ai/yarr/commit/f7bbec864d6871ffb931c455eaa9bdf7fe48fc0d))
* **live:** accept known Overseerr mcporter domain responses ([dc0b383](https://github.com/dinglebear-ai/yarr/commit/dc0b383245abf37e9c7c1bc79ad154872f55eb62))
* **live:** retry mcporter server startup ([63c4ff3](https://github.com/dinglebear-ai/yarr/commit/63c4ff3e4cb6590d004d30c9345578b371b88d1d))
* **logging:** wire up logging module, drop dead token_limit::truncate_if_needed ([#16](https://github.com/dinglebear-ai/yarr/issues/16)) ([7a93ab6](https://github.com/dinglebear-ai/yarr/commit/7a93ab65a3ecaa170934d89e28df29195801afa6))
* **mcp:** elicit generated DELETE ops dispatched via action=op ([3ffa393](https://github.com/dinglebear-ai/yarr/commit/3ffa393a44ef52ccc526e60ac8ff672e27c28237))
* **npm:** derive expected release tag from package.json in platform test ([3410db3](https://github.com/dinglebear-ai/yarr/commit/3410db383fd1f25aebfdcbfa11e6cc22d5fe6b84))
* **npm:** derive expected release tag from package.json in platform test ([3339187](https://github.com/dinglebear-ai/yarr/commit/33391877b80aa9dbb800aa213e23287f7f1317e8))
* **npm:** derive expected release tag from package.json in platform test ([30964e1](https://github.com/dinglebear-ai/yarr/commit/30964e1e346ac19533fae8069cd2491087154cab))
* **oauth:** emit ALLOWED_REDIRECT_URIS key lab-auth reads + auth.db chmod 600 ([bb340ee](https://github.com/dinglebear-ai/yarr/commit/bb340ee3ede04f3183e750b680f19deb29372903))
* **plugin:** align rustarr plugin metadata and test env locking ([872db6d](https://github.com/dinglebear-ai/yarr/commit/872db6d53ebad39a0804b685a1124bc37f0b4ca7))
* **plugin:** align rustarr userConfig with wired service credentials ([378b384](https://github.com/dinglebear-ai/yarr/commit/378b3840ba137c1594f4ab8c96c3d65909eff210))
* **plugins:** repo-wide skill review fixes, README refresh, GitHub repo rename ([048bc82](https://github.com/dinglebear-ai/yarr/commit/048bc82d4874f6c8be7e0bc31d31f382e06d990a))
* preserve Trivy severity gate in SARIF mode ([#63](https://github.com/dinglebear-ai/yarr/issues/63)) ([f13dcec](https://github.com/dinglebear-ai/yarr/commit/f13dcec2f2a395a49762612124cb7290a0209e22))
* remediate comprehensive project review ([#57](https://github.com/dinglebear-ai/yarr/issues/57)) ([1d52bf8](https://github.com/dinglebear-ai/yarr/commit/1d52bf8c1a5b4b92c60adda09f9cc9eb2cf138ab))
* require bearer auth for rustarr docker ([89883be](https://github.com/dinglebear-ai/yarr/commit/89883be20231e9c58d733cab414b87bd9a72b695))
* route rust builds through sccache wrapper ([e8724b0](https://github.com/dinglebear-ai/yarr/commit/e8724b03e2d4769f5b5bd73c0827e36ea8c44d37))
* unblock CI/release pipeline and correct install.sh exit code ([1047a46](https://github.com/dinglebear-ai/yarr/commit/1047a4671a1f014fff919227d1885f37159bfec7))
* **xtask:** drop dead --confirm arg from live harness, fix contract error truncation ([eec8a34](https://github.com/dinglebear-ai/yarr/commit/eec8a3404fd3fa05d8364e17b0aea1f47159d73a))
* **xtask:** seed valid provider bodies for the sonarr/radarr contract sweep ([e87efe1](https://github.com/dinglebear-ai/yarr/commit/e87efe184375be6c1c5f034210b2394d2e2dade3))


### Changed

* **live:** split contract reset operations ([9276929](https://github.com/dinglebear-ai/yarr/commit/927692900de375a2a60ff2e45d1bafec84c99d4a))
* **live:** split mcporter contract helpers ([4e8977a](https://github.com/dinglebear-ai/yarr/commit/4e8977a6281716097f773da9f0813206ea3449f6))
* **plugin:** call rustarr binary directly from hooks; port env mapping into the binary ([d203f86](https://github.com/dinglebear-ai/yarr/commit/d203f860bb551a4bfcecf97ed33140c0f46cd4ba))
* remove rest and web surfaces ([1e2d5ff](https://github.com/dinglebear-ai/yarr/commit/1e2d5ff864c2470f34a7b716f65567fa0366a716))
* remove rustarr template leftovers ([175aaf8](https://github.com/dinglebear-ai/yarr/commit/175aaf8b33b136db21b9e4c6aa15aeafe7447873))
* remove the confirm=true param/--confirm flag entirely ([fa06a8d](https://github.com/dinglebear-ai/yarr/commit/fa06a8d4202b937e86e5a7b013dc591fa052587c))
* rename internal symbols to yarr ([30f6df6](https://github.com/dinglebear-ai/yarr/commit/30f6df6e36fa1c83b5fc17756f09809f496d0072))
* rename plugin package to yarr ([924b4c7](https://github.com/dinglebear-ai/yarr/commit/924b4c7b7c326a2a2767b21c2776c196ff06c585))
* rename public runtime identity to yarr ([3cd9aea](https://github.com/dinglebear-ai/yarr/commit/3cd9aeab0f3393e5d2acd3a2d904f42915b516d5))
* rename runtime harness to yarr ([9574274](https://github.com/dinglebear-ai/yarr/commit/9574274e4ffff1376969e9d40ec54c1b9bd1a3d9))
* **rustarr-unc:** narrow library facade ([df86016](https://github.com/dinglebear-ai/yarr/commit/df860163514b8a466fb3de1e9b1fe9aa090fb910))
* **Z2:** split 3 pre-existing &gt;500 LOC files ([2a33e04](https://github.com/dinglebear-ai/yarr/commit/2a33e04c105446c0aaf8cf5c4cfff6d731054098))

## [Unreleased]

### Added

- Added guarded `cargo xtask shart start|stop|status|seed` lifecycle commands
  and matching `just shart-*` recipes for the dedicated test stack, including
  fleet-quiesced fail-closed seed, dry-run planning, and JSON status output.

## [1.1.1](https://github.com/dinglebear-ai/yarr/compare/v1.1.0...v1.1.1) (2026-07-16)

### Changed

- Hardened authentication and destructive Code Mode dispatch, staged release
  and container promotion, immutable production Compose deployment, repository
  protections, observability, runbooks, documentation, and distribution
  contracts following the full-project review.

## [1.1.0](https://github.com/dinglebear-ai/yarr/compare/v1.0.0...v1.1.0) (2026-07-09)


### Added

* **plugins:** default yarr plugin's MCP connection to stdio ([cee8c0b](https://github.com/dinglebear-ai/yarr/commit/cee8c0bf224d0fa539f39d9f8eedb2938025bd07))
* **plugins:** wire up Gemini CLI's yarr MCP connection over stdio ([b8d3f30](https://github.com/dinglebear-ai/yarr/commit/b8d3f3043514e6fa564cc7c49064664e564f0f1d))


### Fixed

* **plugins:** repo-wide skill review fixes, README refresh, GitHub repo rename ([048bc82](https://github.com/dinglebear-ai/yarr/commit/048bc82d4874f6c8be7e0bc31d31f382e06d990a))
* unblock CI/release pipeline and correct install.sh exit code ([1047a46](https://github.com/dinglebear-ai/yarr/commit/1047a4671a1f014fff919227d1885f37159bfec7))

## [1.0.0](https://github.com/dinglebear-ai/yarr/compare/v0.5.0...v1.0.0) (2026-07-09)


### ⚠ BREAKING CHANGES

* remove the confirm=true param/--confirm flag entirely

### Fixed

* **ci:** align codeql-action/analyze to v4.36.3 ([069405d](https://github.com/dinglebear-ai/yarr/commit/069405d3b72a85b103747711ea803963247954ba))
* **ci:** align codeql-action/analyze to v4.36.3 ([c87bdce](https://github.com/dinglebear-ai/yarr/commit/c87bdce92a616788cd951bdd0a22d46929675991))
* **ci:** switch OpenWiki to local openai-compatible proxy ([19ea54e](https://github.com/dinglebear-ai/yarr/commit/19ea54ecc4cec7be49d86c4a62c01ec05f5fc35f))
* **deps:** bump crossbeam-epoch to 0.9.20 (RUSTSEC-2026-0204) ([47ef606](https://github.com/dinglebear-ai/yarr/commit/47ef606aef99abfd6201c927db0ac1b104d3ea7e))
* **mcp:** elicit generated DELETE ops dispatched via action=op ([3ffa393](https://github.com/dinglebear-ai/yarr/commit/3ffa393a44ef52ccc526e60ac8ff672e27c28237))
* **xtask:** drop dead --confirm arg from live harness, fix contract error truncation ([eec8a34](https://github.com/dinglebear-ai/yarr/commit/eec8a3404fd3fa05d8364e17b0aea1f47159d73a))


### Changed

* remove the confirm=true param/--confirm flag entirely ([fa06a8d](https://github.com/dinglebear-ai/yarr/commit/fa06a8d4202b937e86e5a7b013dc591fa052587c))

## [0.5.0](https://github.com/dinglebear-ai/yarr/compare/v0.4.0...v0.5.0) (2026-07-06)


### Added

* **codemode:** blend TEI semantic similarity into codemode.search() ([ad6fa40](https://github.com/dinglebear-ai/yarr/commit/ad6fa400bfa556066ae100bfd1748b895378fab8))
* **mcp:** add YARR_MCP_TOOL_MODE=flat ([b13c15b](https://github.com/dinglebear-ai/yarr/commit/b13c15bfa2172c5d61a3b71dccdd4c4e6b46aee6))


### Fixed

* **docs:** ASCII-hygiene fix for OpenWiki testing doc ([4ad1016](https://github.com/dinglebear-ai/yarr/commit/4ad1016f3925b92d0cc75154dc2535b0f0118810))
* **docs:** replace non-ASCII check/cross emoji in openwiki/testing.md ([99a3db3](https://github.com/dinglebear-ai/yarr/commit/99a3db326132b8b68dad3dfb5376ae5ec5b85a76))
* **live:** accept known Overseerr mcporter domain responses ([dc0b383](https://github.com/dinglebear-ai/yarr/commit/dc0b383245abf37e9c7c1bc79ad154872f55eb62))
* **live:** retry mcporter server startup ([63c4ff3](https://github.com/dinglebear-ai/yarr/commit/63c4ff3e4cb6590d004d30c9345578b371b88d1d))


### Changed

* **live:** split contract reset operations ([9276929](https://github.com/dinglebear-ai/yarr/commit/927692900de375a2a60ff2e45d1bafec84c99d4a))
* **live:** split mcporter contract helpers ([4e8977a](https://github.com/dinglebear-ai/yarr/commit/4e8977a6281716097f773da9f0813206ea3449f6))

The entries below predate the Yarr rename and intentionally preserve the
historical `rustarr` names used by those releases.

## [0.4.0] — 2026-05-14

### Added

- `.github/workflows/codeql.yml` — CodeQL SAST analysis on push to main and weekly scheduled scan; results surface in the GitHub Security tab.
- `.github/workflows/cargo-deny.yml` — license compliance, duplicate dependency, advisory, and source checks via `cargo-deny`.
- `.github/workflows/msrv.yml` — compiles against the declared `rust-version` to catch MSRV regressions early.

## [0.3.0] — 2026-05-14

### Added

- `src/cli/watch.rs` — `rustarr watch` subcommand for live file-system monitoring.
- `plugins/rustarr/monitors/` — plugin monitor definitions for event-driven automation.
- `plugins/rustarr/gemini-extension.json` — Gemini extension manifest for multi-platform plugin distribution.
- `.github/dependabot.yml` + `.github/workflows/dependabot-auto-merge.yml` — automated dependency updates with auto-merge for minor/patch bumps.
- `scripts/asciicheck.py`, `scripts/check-blob-size.py`, `scripts/check-dependency-updates.sh`, `scripts/check-file-size.sh`, `scripts/check-runtime-current.sh`, `scripts/validate-plugin-layout.sh`, `scripts/blob-size-allowlist.txt` — repository validation and quality scripts.
- `tests/plugin_contract.rs` — plugin contract integration tests.
- `docs/PLUGINS.md` — documentation for the plugin system and distribution model.
- `plugins/README.md`, `plugins/rustarr/README.md`, `plugins/rustarr/CLAUDE.md` — plugin-level documentation and agent guidance.
- `apps/web/README.md`, `xtask/README.md`, `tests/README.md`, `scripts/README.md` — README coverage for every major directory.
- `.claude/` — Claude Code project settings for agent-assisted development.

### Changed

- `plugins/rustarr/hooks/plugin-setup.sh` — significant simplification; reduced from ~500 to ~50 lines by extracting reusable logic and removing duplication.
- `Justfile` — expanded with additional recipes covering plugin validation, script checks, and workflow shortcuts.
- `lefthook.yml` — pre-commit hook additions aligned with new script suite.
- `AGENTS.md`, `CLAUDE.md` — updated agent and AI tooling guidance to reflect current project structure.
- `README.md`, `docs/PATTERNS.md` — documentation refreshed for new scripts and plugin layout.

## [0.2.0] — 2026-05-14

### Changed

- Split `src/mcp.rs` into three focused modules: `src/server.rs` (`AppState`, `AuthPolicy`, `build_auth_layer`), `src/server/routes.rs` (Axum router wiring), and `src/api.rs` (REST API handlers). `src/mcp/` now contains only MCP protocol concerns (tools, schemas, prompts, server handler).
- `mcp/rmcp_server.rs` and `mcp/tools.rs` now import `AppState`/`AuthPolicy` from `crate::server` instead of `super`.
- `allowed_origins` visibility widened from `pub(super)` to `pub` to support cross-module access from `server/routes.rs`.
- Updated `src/lib.rs` and `src/main.rs` to reflect new module layout (`pub mod api`, `pub mod server`).

### Added

- `deny.toml` — `cargo-deny` configuration enforcing license allowlist, banning `openssl`/`openssl-sys`, denying yanked crates, and restricting dependency sources to crates.io and `github.com/jmagar/lab.git`. RUSTSEC-2023-0071 acknowledged with rationale.
- `apps/web/CLAUDE.md` — guidance for using the Aurora design system shadcn registry in the Next.js web app: install commands, token conventions, full component catalog, and usage rules.
- `.git/hooks/pre-commit` — enforces the no-`mod.rs` rule at commit time; blocks any staged `mod.rs` file with a clear error message.
- `docs/PATTERNS.md` updated: §1/§1a module layouts reflect new `server`/`api` structure with all `mod.rs` references removed; §5 auth section headers updated; §45 No mod.rs section now includes the git hook script; §A1/§A2 advanced patterns updated to match actual file locations.

### Removed

- `src/mcp/routes.rs` — moved to `src/server/routes.rs`.
- Several obsolete scripts: `backup.sh`, `check-runtime-current.sh`, `plugin-setup.sh`, `reset-db.sh`, `smoke-test.sh`, `test-check-runtime-current.sh`, `validate-marketplace.sh`.
- `docs/server-json-guide.md` — content superseded by `docs/MCP-REGISTRY-PUBLISH-GUIDE.md`.

## [0.1.0] — 2026-05-13

### Added

- Layered architecture: `RustarrClient` (transport) → `RustarrService` (business logic) → MCP/CLI shims
- Action-based dispatch: single `rustarr` MCP tool with `action` parameter routing
- Both transports: Streamable HTTP (`rustarr serve`) and stdio (`rustarr mcp`)
- Bearer token authentication via `RUSTARR_MCP_TOKEN`
- Google OAuth authentication via `RUSTARR_MCP_AUTH_MODE=oauth` (issues RS256 JWTs)
- Loopback/no-auth mode for local development
- MCP elicitation support (`elicit_name` action, spec 2025-06-18) with graceful fallback
- MCP resources: exposes tool schema at `rustarr://schema/mcp-tool`
- MCP prompts: `quick_start` prompt
- CLI with `greet`, `echo`, and `status` subcommands
- Test helpers: `loopback_state()` and `bearer_state()` for credential-free integration tests
- `AuthPolicy` enum making auth choice explicit at construction time
- CORS, Host header validation, request body size limiting built-in
- `resolve_auth_policy_kind()` — refuses to bind `0.0.0.0` without auth (Pattern §27)
- `default_data_dir()` — detects container vs bare-metal, returns `/data` or `~/.rustarr`
- `entrypoint.sh` — Docker entrypoint with permission setup and privilege drop to UID 1000
- `xtask` crate with `dist`, `ci`, `symlink-docs`, `check-env` commands
- `.config/nextest.toml` — nextest configuration with `default` and `ci` profiles
- `taplo.toml` — TOML formatter configuration
- `lefthook.yml` — minimal pre-commit hooks (diff_check, toml_fmt, env_guard)
- `.github/workflows/ci.yml` — CI: fmt, clippy, nextest, taplo, audit, gitleaks
- `.github/workflows/docker-publish.yml` — multi-platform Docker build + Trivy scan
- `.github/workflows/release.yml` — release binaries for linux/amd64 and linux/arm64
- `config.yarr.toml` — fully annotated config template
- `.env.rustarr` — documented secrets template
- `CHANGELOG.md` following Keep a Changelog format
- Workspace structure: root crate + `xtask/` member
- `symlink-docs` and `symlink-docs-inline` Justfile recipes
