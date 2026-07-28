# Yarr Unraid Plugin Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task by task.

**Goal:** Ship, release, install, configure, update, and operate the Yarr Rust binary as a first-class Unraid plugin with a classic `.plg`, an external NestJS GraphQL extension, Vue settings/dashboard custom elements, Docker-assisted service discovery, and live deployment evidence from `tootie`.

**Architecture:** Keep every Unraid-specific artifact under `unraid-plugin/`. The classic package owns installation, process lifecycle, persistent files, event hooks, and binary updates. The external API package is the sole browser-facing control plane and performs transactional configuration, redacted service import, Docker discovery, runtime control, logs, and update operations. Two Vue custom elements consume only the GraphQL contract. Root-level files may orchestrate CI and releases but may not contain plugin implementation.

**Tech Stack:** Rust/Yarr release binary, POSIX shell, Unraid `.plg` XML and Slackware `.txz`, Node.js 22, TypeScript, NestJS, GraphQL, Vitest, Vue 3 custom elements, Vite, Bash contract tests, GitHub Actions.

## Global Constraints

- Implement only in the isolated worktree `/home/jmagar/workspace/yarr/.worktrees/yarr-unraid-plugin` on branch `feat/yarr-unraid-plugin`.
- Preserve the dirty primary checkout at `/home/jmagar/workspace/yarr` without reading from or writing to its modified files.
- Put implementation under `unraid-plugin/`; root changes are restricted to workflow orchestration, `Justfile` entry points, and documentation links.
- Keep `yarr.cfg` for lifecycle/plugin settings and `.env` for Yarr settings and credentials. Never mirror either into JSON.
- Never expose stored credentials through GraphQL, logs, import previews, frontend state, shell output, or test snapshots.
- Use `/var/lock/yarr-plugin.lock` to serialize save, restart, update, reset, install, and uninstall operations.
- Fence appdata before array unmount, retain that fence across uninstall, and clear it only through a lock-held mounted-array transition used by the start hook or a mounted reinstall.
- Default to loopback binding. LAN, custom, and Tailscale exposure require bearer authentication or Google OAuth. The plugin permits typed trusted-gateway mode only on loopback with Tailscale disabled behind a same-host proxy.
- Keep the packaged binary immutable at `/usr/local/yarr/bin/yarr`; place self-updated binaries at `/mnt/user/appdata/yarr/bin/yarr` and retain one known-good predecessor.
- Verify upstream archives with the published `yarr-x86_64.tar.gz.sha256`, reject extra/missing archive entries, and swap binaries atomically.
- Use Node's HTTP client over `/var/run/docker.sock` for read-only Docker discovery. Do not import private `@app/*` modules from the Unraid API repository.
- Keep GraphQL decorator types and `graphqlSchemaExtension` SDL synchronized in the same commit.
- Use Aurora-compatible Unraid host variables and existing host typography. Do not introduce a separate color system.
- Run Cargo commands as `SOLDR_BYPASS=1 CARGO_TIMINGS=0 cargo ...` because the local soldr wrapper was proven to cross-contaminate worktree target paths.
- Update Bead `rustarr-bhf` after each completed task. Commit and push each task before beginning the next task.

---

## Task 1: Freeze the plugin filesystem and release contracts

**Files:**

- Create: `unraid-plugin/release-manifest.json`
- Create: `unraid-plugin/tests/fixtures/release-manifest.valid.json`
- Create: `unraid-plugin/tests/fixtures/release-manifest.invalid.json`
- Create: `unraid-plugin/tests/fixtures/required-package-paths.txt`
- Create: `unraid-plugin/tests/release-contract.sh`
- Create: `unraid-plugin/tests/run.sh`
- Modify: `Justfile`

**Step 1: Write the failing release-contract test**

Put this complete implementation inventory in `required-package-paths.txt` and make `release-contract.sh` validate that every entry is absolute within the package root, unique, sorted, and represented by a recognized runtime prefix:

```text
unraid-plugin/yarr.plg
unraid-plugin/release-manifest.json
unraid-plugin/source/etc/rc.d/rc.yarr
unraid-plugin/source/usr/local/emhttp/plugins/yarr/yarr.page
unraid-plugin/source/usr/local/emhttp/plugins/yarr/event/started
unraid-plugin/source/usr/local/emhttp/plugins/yarr/event/stopping_svcs
unraid-plugin/source/usr/local/emhttp/plugins/yarr/event/unmounting_disks
unraid-plugin/source/usr/local/emhttp/plugins/yarr/scripts/yarr-common.sh
unraid-plugin/source/usr/local/emhttp/plugins/yarr/scripts/yarr-update.sh
unraid-plugin/source/usr/local/emhttp/plugins/yarr/scripts/install-api-plugin.sh
unraid-plugin/source/usr/local/emhttp/plugins/yarr/scripts/uninstall-api-plugin.sh
unraid-plugin/api/package.json
unraid-plugin/web/package.json
```

The test must also parse `release-manifest.json`, reject unknown keys, require SHA-256 values to match `^[0-9a-f]{64}$`, and require the manifest package filename to match `yarr-<version>-x86_64-<build>.txz`. Task 10 will compare the declared inventory to the staged archive; Task 1 must not require future source files to exist.

**Step 2: Run the test and confirm the expected failure**

Run:

```bash
bash unraid-plugin/tests/release-contract.sh
```

Expected: non-zero exit because the manifest and declared inventory fixtures are absent.

**Step 3: Add the manifest and test runner**

Use this schema and initial release identity:

```json
{
  "schemaVersion": 1,
  "pluginVersion": "2.1.0",
  "packageBuild": 1,
  "packageFile": "yarr-2.1.0-x86_64-1.txz",
  "packageSha256": "0000000000000000000000000000000000000000000000000000000000000000",
  "packageUrl": "https://github.com/dinglebear-ai/yarr/releases/download/unraid-v2.1.0-1/yarr-2.1.0-x86_64-1.txz",
  "sourceRepository": "dinglebear-ai/yarr",
  "packageRepository": "dinglebear-ai/yarr",
  "binaryRepository": "dinglebear-ai/yarr",
  "binaryAsset": "yarr-x86_64.tar.gz",
  "apiPackage": "unraid-api-plugin-yarr",
  "apiVersion": "2.1.0",
  "settingsElement": "yarr-settings-app",
  "dashboardElement": "yarr-dashboard"
}
```

The zero checksum is allowed only in the fixture and initial source manifest; the packaging task must replace it and the final contract must reject it.

Add `just unraid-test` as a root orchestration command that invokes `bash unraid-plugin/tests/run.sh`.

**Step 4: Re-run the focused test**

Run:

```bash
bash unraid-plugin/tests/release-contract.sh
```

Expected: manifest, inventory declaration, and runner contracts pass without depending on artifacts scheduled for later tasks.

**Step 5: Commit and push**

```bash
git add Justfile unraid-plugin/release-manifest.json unraid-plugin/tests
git commit -m "test(rustarr-bhf): define Unraid plugin release contract"
git push
bd comments add rustarr-bhf "Task 1 complete: filesystem and release contracts committed and pushed."
```

---

## Task 2: Implement shared shell configuration and process lifecycle

**Files:**

- Create: `unraid-plugin/source/usr/local/emhttp/plugins/yarr/scripts/yarr-common.sh`
- Create: `unraid-plugin/source/etc/rc.d/rc.yarr`
- Create: `unraid-plugin/source/usr/local/emhttp/plugins/yarr/event/started`
- Create: `unraid-plugin/source/usr/local/emhttp/plugins/yarr/event/stopping_svcs`
- Create: `unraid-plugin/source/usr/local/emhttp/plugins/yarr/event/unmounting_disks`
- Create: `unraid-plugin/tests/lifecycle-contract.sh`
- Modify: `unraid-plugin/tests/run.sh`

**Step 1: Write lifecycle tests against a temporary filesystem root**

The shell implementation must honor `YARR_PLUGIN_ROOT`, `YARR_BOOT_ROOT`, `YARR_APPDATA_ROOT`, `YARR_RUN_ROOT`, and `YARR_LOCK_ROOT` test overrides. Test these cases without root privileges:

```text
default config binds 127.0.0.1:40070
LAN mode resolves to 0.0.0.0
custom mode requires a non-empty valid IP literal
non-loopback without an accepted auth mode is rejected before launch
overlay binary wins over packaged binary only when executable
stale PID files are removed
stop refuses to signal a PID whose /proc/<pid>/exe is not the selected Yarr binary
start is idempotent
event hooks delegate to rc.yarr and propagate failure
generated process environment has mode 0600 and shell-safe values
```

**Step 2: Run the lifecycle contract and confirm failure**

```bash
bash unraid-plugin/tests/lifecycle-contract.sh
```

Expected: non-zero exit because `yarr-common.sh` and `rc.yarr` are absent.

**Step 3: Implement `yarr-common.sh`**

Expose these shell functions and constants:

```sh
yarr_load_config
yarr_validate_config
yarr_effective_host
yarr_select_binary
yarr_write_runtime_env
yarr_pid_is_owned
yarr_wait_ready
yarr_with_lock
YARR_CFG=/boot/config/plugins/yarr/yarr.cfg
YARR_ENV=/boot/config/plugins/yarr/.env
YARR_APPDATA=/mnt/user/appdata/yarr
YARR_PID=/var/run/yarr.pid
YARR_LOCK=/var/lock/yarr-plugin.lock
```

The lifecycle configuration keys are exactly:

```ini
ENABLED=yes
BIND_MODE=loopback
CUSTOM_HOST=
PORT=40070
AUTH_MODE=bearer
TAILSCALE_SERVE=no
TAILSCALE_HOSTNAME=
LOG_LEVEL=info
UPDATE_CHANNEL=stable
```

Parse config without `eval` or `source`. Accept only known keys, trim CRLF, reject control characters, and quote generated env values rather than executing them.

**Step 4: Implement `rc.yarr`**

Support `start`, `stop`, `restart`, `status`, and `reload`. `start` must:

```text
acquire /var/lock/yarr-plugin.lock
load and validate both configuration files
select the persistent overlay or packaged binary
create /mnt/user/appdata/yarr and /var/log/yarr
write a root-only runtime environment
launch with YARR_HOME=/mnt/user/appdata/yarr
record the PID atomically
wait for /ready through 127.0.0.1 when bound to loopback or wildcard, and through the configured address for custom binding
remove the PID and terminate the process when readiness fails
configure Tailscale Serve only after local readiness succeeds
```

`stop` must remove Tailscale Serve first, send `TERM`, wait up to 20 seconds, send `KILL` only to a PID proven to be the selected executable, and clean runtime files.

**Step 5: Add event hooks**

`started` starts only when `ENABLED=yes`. Both stop hooks call `rc.yarr stop` and are safe when the service is absent.

**Step 6: Run the focused contract**

```bash
bash unraid-plugin/tests/lifecycle-contract.sh
```

Expected: all lifecycle cases pass.

**Step 7: Commit and push**

```bash
git add unraid-plugin/source unraid-plugin/tests
git commit -m "feat(rustarr-bhf): add Yarr lifecycle service"
git push
bd comments add rustarr-bhf "Task 2 complete: validated config parser, rc service, and array hooks committed and pushed."
```

---

## Task 3: Implement verified independent binary updates

**Files:**

- Create: `unraid-plugin/source/usr/local/emhttp/plugins/yarr/scripts/yarr-update.sh`
- Create: `unraid-plugin/tests/update-contract.sh`
- Create: `unraid-plugin/tests/fixtures/releases.json`
- Modify: `unraid-plugin/tests/run.sh`

**Step 1: Write update tests with local release fixtures**

Support `YARR_UPDATE_API_URL` and `YARR_UPDATE_DOWNLOAD_ROOT` overrides. Cover:

```text
stable channel selects the highest non-prerelease semantic version in the installed major
major-version changes are rejected
the release JSON must contain yarr-x86_64.tar.gz and yarr-x86_64.tar.gz.sha256
the checksum parser accepts the upstream single-line digest format
checksum mismatch leaves every installed binary unchanged
an archive with any entry other than yarr is rejected
the extracted file must be a regular executable and not a symlink
successful update preserves the previous overlay
failed readiness restores the previous overlay and restarts it
reset removes the overlay and starts the packaged binary
status output contains versions and availability but no environment values
```

**Step 2: Run the update contract and confirm failure**

```bash
bash unraid-plugin/tests/update-contract.sh
```

Expected: non-zero exit because the updater is absent.

**Step 3: Implement updater commands**

Expose:

```bash
yarr-update.sh check --json
yarr-update.sh apply --version 2.1.0 --json
yarr-update.sh reset --json
```

Use `curl`, `jq`, `tar`, `sha256sum`, `install`, and `mv`. Download into a
private bounded directory created by `mktemp -d` outside appdata without
holding the lifecycle lock. Acquire `YARR_LOCK` before reading installed state
or beginning any state-changing operation, then revalidate the staged
candidate and policy under that lock. Never use `curl | sh`.

Before apply or reset changes a live overlay path, create private durable
content/mode snapshots outside unconditional temporary cleanup. Stage every
replacement from a copy and atomically rename it into place. Restoration stops
after its first failed step, retains snapshots and surviving binaries, and
reports `rolledBack=true` only after exact binary identity, directory
durability, and prior runtime-state readiness are all proven.

The JSON result keys are:

```json
{
  "operation": "CHECK",
  "outcome": "CHECK_CURRENT",
  "installedVersion": "2.1.0",
  "packagedVersion": "2.1.0",
  "availableVersion": "2.1.0",
  "updateAvailable": false,
  "usingOverlay": false,
  "rollbackAvailable": false,
  "rolledBack": false,
  "cleanupPending": false,
  "recoveryIdentifier": "",
  "message": "Yarr is current"
}
```

`operation` and its namespaced `outcome` form a closed machine contract.
Validate them together with exit code, update/overlay state, rollback truth,
cleanup truth and identifier, and the outcome-bound display message. Do not
infer an updater outcome from arbitrary human-readable text.

**Step 4: Run the focused contract**

```bash
bash unraid-plugin/tests/update-contract.sh
```

Expected: all updater and rollback cases pass using local fixtures only.

**Step 5: Commit and push**

```bash
git add unraid-plugin/source/usr/local/emhttp/plugins/yarr/scripts/yarr-update.sh unraid-plugin/tests
git commit -m "feat(rustarr-bhf): add verified Yarr self-update flow"
git push
bd comments add rustarr-bhf "Task 3 complete: checksummed same-major update, rollback, and reset committed and pushed."
```

---

## Task 4: Create the external Unraid API package and config domain

**Files:**

- Create: `unraid-plugin/api/package.json`
- Create: `unraid-plugin/api/package-lock.json`
- Create: `unraid-plugin/api/tsconfig.json`
- Create: `unraid-plugin/api/vitest.config.ts`
- Create: `unraid-plugin/api/.ci-stubs/unraid-shared/package.json`
- Create: `unraid-plugin/api/.ci-stubs/unraid-shared/index.d.ts`
- Create: `unraid-plugin/api/src/paths.ts`
- Create: `unraid-plugin/api/src/config.types.ts`
- Create: `unraid-plugin/api/src/config-codec.ts`
- Create: `unraid-plugin/api/src/config-codec.spec.ts`

**Step 1: Add package metadata**

The package identity and external-plugin contract are:

```json
{
  "name": "unraid-api-plugin-yarr",
  "version": "2.1.0",
  "type": "commonjs",
  "main": "dist/index.js",
  "unraid": {
    "apiVersion": "1",
    "adapter": "nestjs"
  }
}
```

Use the same NestJS, GraphQL, validation, and Unraid shared peer-dependency ranges as the live upstream plugin loader. Keep Vitest and TypeScript in dev dependencies.

**Step 2: Write failing codec tests**

Model this public safe configuration:

```ts
export type BindMode = 'loopback' | 'lan' | 'custom';
export type AuthMode = 'bearer' | 'google-oauth' | 'trusted-gateway';

export interface YarrPluginConfig {
  enabled: boolean;
  bindMode: BindMode;
  customHost: string;
  port: number;
  authMode: AuthMode;
  tailscaleServe: boolean;
  tailscaleHostname: string;
  logLevel: 'trace' | 'debug' | 'info' | 'warn' | 'error';
  updateChannel: 'stable';
}

export interface YarrServiceConfig {
  service: string;
  enabled: boolean;
  baseUrl: string;
  username: string | null;
  hasPassword: boolean;
  hasApiKey: boolean;
  extra: Record<string, string>;
}
```

Tests must prove:

```text
unknown yarr.cfg keys are preserved but never accepted from GraphQL input
unknown .env keys are preserved
known secrets are represented only by hasPassword/hasApiKey booleans
an omitted secret means preserve existing
an explicit clear flag removes an existing secret
CRLF input round-trips as LF
duplicate keys are rejected
non-loopback without supported auth is rejected
all writes end with one newline
```

**Step 3: Run the tests and confirm failure**

```bash
cd unraid-plugin/api
npm test -- --run src/config-codec.spec.ts
```

Expected: non-zero exit because the codec is not implemented.

**Step 4: Implement pure parse, redact, merge, validate, and serialize functions**

Export:

```ts
parsePluginConfig(text: string): ParsedPluginConfig
serializePluginConfig(config: ParsedPluginConfig): string
parseYarrEnvironment(text: string): ParsedYarrEnvironment
serializeYarrEnvironment(config: ParsedYarrEnvironment): string
toPublicConfig(plugin: ParsedPluginConfig, env: ParsedYarrEnvironment): YarrConfigView
mergeConfigInput(current: ParsedConfigState, input: SaveYarrConfigInput): ParsedConfigState
validateConfigState(state: ParsedConfigState): void
```

The parser must never execute shell syntax. Values are plain UTF-8 strings with escaped newline support only where Yarr's current environment contract accepts it.

**Step 5: Run focused tests and typecheck**

```bash
cd unraid-plugin/api
npm test -- --run src/config-codec.spec.ts
npx tsc --noEmit
```

Expected: focused tests and typecheck pass.

**Step 6: Commit and push**

```bash
git add unraid-plugin/api
git commit -m "feat(rustarr-bhf): define Yarr API config domain"
git push
bd comments add rustarr-bhf "Task 4 complete: external API package and redacting config codec committed and pushed."
```

---

## Task 5: Add transactional config persistence and runtime control services

**Files:**

- Create: `unraid-plugin/api/src/command-runner.ts`
- Create: `unraid-plugin/api/src/config.service.ts`
- Create: `unraid-plugin/api/src/config.service.spec.ts`
- Create: `unraid-plugin/api/src/runtime.service.ts`
- Create: `unraid-plugin/api/src/runtime.service.spec.ts`
- Create: `unraid-plugin/api/src/log.service.ts`
- Create: `unraid-plugin/api/src/log.service.spec.ts`

**Step 1: Write service tests with injected filesystem, HTTP, and command boundaries**

Test this transaction:

```text
validate complete prospective state
acquire the plugin lock through flock
write yarr.cfg.next and .env.next with mode 0600
fsync both files and their parent directory
copy the current pair and prior known-good pair to transaction evidence
atomically publish and fsync yarr.cfg.transaction-state
rename current files to known-good copies
atomically rename next files into place
remove and fsync the marker as the pair commit point
recover any surviving marker before every API/shell read and startup
restart only when effective state changed
wait for /ready
restore both known-good files and restart when readiness fails
return the redacted restored state with rolledBack=true
```

Also test status parsing, idempotent start/stop/restart, bounded log reads, ANSI/control-character stripping, and secret redaction in command failures.

**Step 2: Run focused tests and confirm failure**

```bash
cd unraid-plugin/api
npm test -- --run src/config.service.spec.ts src/runtime.service.spec.ts src/log.service.spec.ts
```

Expected: non-zero exit because services are absent.

**Step 3: Implement narrow injectable boundaries**

Use these interfaces:

```ts
export interface CommandRunner {
  run(command: string, args: readonly string[], options?: RunOptions): Promise<CommandResult>;
}

export interface RuntimeState {
  state: 'running' | 'stopped' | 'starting' | 'error';
  pid: number | null;
  version: string | null;
  bindAddress: string;
  port: number;
  ready: boolean;
  healthMessage: string;
  uptimeSeconds: number | null;
}
```

Permit commands only through fixed absolute paths and fixed argument allowlists:

```text
/usr/sbin/flock
/etc/rc.d/rc.yarr
/usr/local/emhttp/plugins/yarr/scripts/yarr-update.sh
/usr/bin/tail
```

Do not invoke a shell. Cap captured stdout/stderr and redact every current secret before logging or returning errors.

**Step 4: Implement bounded logs**

Read at most 500 lines and 256 KiB from `/var/log/yarr/yarr.log`. Return sanitized lines and a truncation flag. Never read arbitrary user-provided paths.

**Step 5: Run focused tests and typecheck**

```bash
cd unraid-plugin/api
npm test -- --run src/config.service.spec.ts src/runtime.service.spec.ts src/log.service.spec.ts
npx tsc --noEmit
```

Expected: all focused tests and typecheck pass.

**Step 6: Commit and push**

```bash
git add unraid-plugin/api/src
git commit -m "feat(rustarr-bhf): add transactional Yarr runtime services"
git push
bd comments add rustarr-bhf "Task 5 complete: transactional config, runtime control, and bounded logs committed and pushed."
```

---

## Task 6: Add structured import and read-only Docker discovery

**Files:**

- Create: `unraid-plugin/api/src/service-catalog.ts`
- Create: `unraid-plugin/api/src/import.service.ts`
- Create: `unraid-plugin/api/src/import.service.spec.ts`
- Create: `unraid-plugin/api/src/docker.service.ts`
- Create: `unraid-plugin/api/src/docker.service.spec.ts`
- Create: `unraid-plugin/api/src/discovery.service.ts`
- Create: `unraid-plugin/api/src/discovery.service.spec.ts`

**Step 1: Define one explicit supported-service catalog**

Derive service identifiers, URL variables, username/password variables, API-key variables, and non-secret extras from Yarr's current public configuration contract. The catalog must be the only mapper used by config rendering, structured import, and Docker discovery.

Each entry has this shape:

```ts
export interface ServiceCatalogEntry {
  id: string;
  displayName: string;
  urlKeys: readonly string[];
  usernameKeys: readonly string[];
  passwordKeys: readonly string[];
  apiKeyKeys: readonly string[];
  defaultPort: number | null;
  containerHints: readonly string[];
}
```

**Step 2: Write failing import and Docker tests**

Cover:

```text
structured key/value imports normalize known aliases
unknown keys appear in preview warnings and are not silently dropped
preview never returns secret values
apply without includeCredentials preserves current secrets
apply with includeCredentials imports only explicitly selected services
Docker client issues only GET /containers/json and GET /containers/<encoded-id>/json
socket timeout, malformed JSON, and missing socket return typed non-fatal errors
container labels, environment, published ports, and network addresses produce ranked candidates
Docker environment secrets only set hasCredential=true in discovery output
discovery application requires explicit selected candidate IDs and per-service credential consent
```

**Step 3: Run focused tests and confirm failure**

```bash
cd unraid-plugin/api
npm test -- --run src/import.service.spec.ts src/docker.service.spec.ts src/discovery.service.spec.ts
```

Expected: non-zero exit because import/discovery services are absent.

**Step 4: Implement the Docker unix-socket client**

Use `node:http.request` with:

```ts
{
  socketPath: '/var/run/docker.sock',
  method: 'GET',
  path,
  headers: { Accept: 'application/json' },
  timeout: 3000,
}
```

Reject any method other than `GET`, any endpoint outside the two allowed forms, responses over 2 MiB, and non-2xx status codes. URL-encode container IDs.

**Step 5: Implement preview and apply semantics**

Return candidates with `source`, `confidence`, `reasons`, `baseUrl`, and credential-presence booleans. Keep raw container environment data inside the request scope and discard it after applying selected values server-side.

**Step 6: Run focused tests and typecheck**

```bash
cd unraid-plugin/api
npm test -- --run src/import.service.spec.ts src/docker.service.spec.ts src/discovery.service.spec.ts
npx tsc --noEmit
```

Expected: all focused tests and typecheck pass.

**Step 7: Commit and push**

```bash
git add unraid-plugin/api/src
git commit -m "feat(rustarr-bhf): add safe Yarr service discovery"
git push
bd comments add rustarr-bhf "Task 6 complete: structured import and read-only Docker discovery committed and pushed."
```

---

## Task 7: Publish the complete GraphQL extension

**Files:**

- Create: `unraid-plugin/api/src/graphql.types.ts`
- Create: `unraid-plugin/api/src/yarr.resolver.ts`
- Create: `unraid-plugin/api/src/yarr.resolver.spec.ts`
- Create: `unraid-plugin/api/src/api.module.ts`
- Create: `unraid-plugin/api/src/index.ts`
- Create: `unraid-plugin/api/src/schema-contract.spec.ts`

**Step 1: Write failing resolver and schema-parity tests**

The extension must expose these fields:

```graphql
extend type Query {
  yarrRuntime: YarrRuntime!
  yarrConfig: YarrConfig!
  yarrDiscoveredServices: YarrDiscoveryResult!
  yarrLogs(lines: Int = 200): YarrLogs!
  yarrUpdateStatus: YarrUpdateStatus!
}

extend type Mutation {
  saveYarrConfig(input: SaveYarrConfigInput!): YarrConfigMutationResult!
  controlYarr(action: YarrControlAction!): YarrRuntime!
  previewYarrImport(input: PreviewYarrImportInput!): YarrImportPreview!
  applyYarrImport(input: ApplyYarrImportInput!): YarrConfigMutationResult!
  applyYarrDiscovery(input: ApplyYarrDiscoveryInput!): YarrConfigMutationResult!
  updateYarrBinary(version: String!): YarrUpdateResult!
  resetYarrBinary: YarrUpdateResult!
}
```

Test that every resolver field appears in `graphqlSchemaExtension`, every SDL field has a resolver, all mutation inputs use `class-validator`, and all secret-bearing domain fields are absent from serialized GraphQL results.

**Step 2: Run focused tests and confirm failure**

```bash
cd unraid-plugin/api
npm test -- --run src/yarr.resolver.spec.ts src/schema-contract.spec.ts
```

Expected: non-zero exit because the resolver and module are absent.

**Step 3: Implement decorated GraphQL types and resolver**

Use `@ObjectType`, `@InputType`, `@Field`, `@Resolver`, `@Query`, and `@Mutation`. Apply `@IsString`, `@IsBoolean`, `@IsInt`, `@Min`, `@Max`, `@IsEnum`, `@IsOptional`, and nested validation to every input field so Unraid's whitelist validation retains intended values.

The action enum is exactly:

```ts
export enum YarrControlAction {
  START = 'START',
  STOP = 'STOP',
  RESTART = 'RESTART',
}
```

Require explicit service selections in apply inputs and cap free-form import text at 256 KiB.

**Step 4: Export the Nest external plugin**

`src/index.ts` must export:

```ts
export { ApiModule } from './api.module';
export { graphqlSchemaExtension } from './graphql.types';
```

`ApiModule` registers the resolver and services without importing any upstream-private module path.

**Step 5: Run package gates**

```bash
cd unraid-plugin/api
npm test
npx tsc --noEmit
npx tsc
node -e "const p=require('./dist'); if(!p.ApiModule || !p.graphqlSchemaExtension) process.exit(1)"
```

Expected: tests, typecheck, build, and package export smoke all pass.

**Step 6: Commit and push**

```bash
git add unraid-plugin/api
git commit -m "feat(rustarr-bhf): expose Yarr Unraid GraphQL API"
git push
bd comments add rustarr-bhf "Task 7 complete: authenticated GraphQL extension and schema parity tests committed and pushed."
```

---

## Task 8: Build the Vue custom-element foundation

**Files:**

- Create: `unraid-plugin/web/package.json`
- Create: `unraid-plugin/web/package-lock.json`
- Create: `unraid-plugin/web/tsconfig.json`
- Create: `unraid-plugin/web/vite.config.ts`
- Create: `unraid-plugin/web/vitest.config.ts`
- Create: `unraid-plugin/web/src/graphql.ts`
- Create: `unraid-plugin/web/src/types.ts`
- Create: `unraid-plugin/web/src/style.css`
- Create: `unraid-plugin/web/src/settings-entry.ts`
- Create: `unraid-plugin/web/src/dashboard-entry.ts`
- Create: `unraid-plugin/web/src/components/StatusBadge.vue`
- Create: `unraid-plugin/web/src/components/SecretField.vue`
- Create: `unraid-plugin/web/src/graphql.spec.ts`

**Step 1: Write the GraphQL-client tests**

Test request success, GraphQL errors, HTTP errors, abort timeout, CSRF-compatible same-origin credentials, and the guarantee that mutation variables are not logged.

**Step 2: Run the focused test and confirm failure**

```bash
cd unraid-plugin/web
npm test -- --run src/graphql.spec.ts
```

Expected: non-zero exit because the client is absent.

**Step 3: Implement the typed same-origin GraphQL client**

Expose:

```ts
queryYarrRuntime(signal?: AbortSignal): Promise<YarrRuntime>
queryYarrConfig(signal?: AbortSignal): Promise<YarrConfig>
mutateYarrConfig(input: SaveYarrConfigInput, signal?: AbortSignal): Promise<YarrConfigMutationResult>
controlYarr(action: YarrControlAction, signal?: AbortSignal): Promise<YarrRuntime>
```

Use `fetch('/graphql', { method: 'POST', credentials: 'same-origin' })` with an eight-second timeout and user-safe errors.

**Step 4: Register both custom elements**

Use Vue's `defineCustomElement` and register exactly:

```ts
customElements.define('yarr-settings-app', YarrSettingsElement);
customElements.define('yarr-dashboard', YarrDashboardElement);
```

Guard duplicate registration so Unraid page transitions cannot throw.

**Step 5: Establish host-native visual tokens**

Map component variables to Unraid host properties with resilient fallbacks:

```css
:host {
  --yarr-accent: var(--primary, #29b6f6);
  --yarr-text: var(--text-color, #e6f4fb);
  --yarr-muted: var(--text-color-muted, #a7bcc9);
  --yarr-surface: var(--background-color, #07131c);
  --yarr-border: var(--border-color, #1d3d4e);
}
```

Honor reduced motion, keyboard focus, narrow viewports, and host light/dark mode.

**Step 6: Run focused tests and typecheck**

```bash
cd unraid-plugin/web
npm test -- --run src/graphql.spec.ts
npx vue-tsc --noEmit
```

Expected: focused tests and Vue typecheck pass.

**Step 7: Commit and push**

```bash
git add unraid-plugin/web
git commit -m "feat(rustarr-bhf): scaffold Yarr Unraid web elements"
git push
bd comments add rustarr-bhf "Task 8 complete: typed GraphQL client and custom-element foundation committed and pushed."
```

---

## Task 9: Implement settings, discovery, updates, logs, and dashboard UX

**Files:**

- Create: `unraid-plugin/web/src/YarrSettings.ce.vue`
- Create: `unraid-plugin/web/src/YarrDashboard.ce.vue`
- Create: `unraid-plugin/web/src/components/OverviewPanel.vue`
- Create: `unraid-plugin/web/src/components/ServicesPanel.vue`
- Create: `unraid-plugin/web/src/components/ServerAuthPanel.vue`
- Create: `unraid-plugin/web/src/components/UpdatesPanel.vue`
- Create: `unraid-plugin/web/src/components/LogsPanel.vue`
- Create: `unraid-plugin/web/src/components/ImportDialog.vue`
- Create: `unraid-plugin/web/src/components/DiscoveryDialog.vue`
- Create: `unraid-plugin/web/src/settings.spec.ts`
- Create: `unraid-plugin/web/src/dashboard.spec.ts`
- Modify: `unraid-plugin/web/src/graphql.ts`
- Modify: `unraid-plugin/web/src/types.ts`

**Step 1: Write component behavior tests**

Test:

```text
settings load runtime and config in parallel
five tabs are Overview, Services, Server & Auth, Updates, and Logs
failed requests render an actionable retry state
save shows restart and rollback results
non-loopback bind warns and blocks unsupported auth
secret fields initially show only configured/not-configured state
blank secret input preserves current value
clear credential requires an explicit control
import preview shows unmapped keys and never renders secret text
Docker candidates require explicit selection
credential import consent is per service
credential-only import is selectable only when an imported or existing valid URL is available
update, preservation-first manual rollback, and reset require confirmation and
show verified restoration or explicit snapshot-retained recovery failure
logs support bounded line count and manual refresh
dashboard displays state, readiness, version, endpoint, and one safe control action
```

**Step 2: Run focused tests and confirm failure**

```bash
cd unraid-plugin/web
npm test -- --run src/settings.spec.ts src/dashboard.spec.ts
```

Expected: non-zero exit because the components are absent.

**Step 3: Implement the settings application**

Use a deliberate operations-console layout rather than generic cards: a compact identity rail, high-information runtime strip, keyboard-accessible tab row, and dense configuration panels. Keep destructive and network-exposure actions visually distinct. Use only GraphQL operations from Task 7.

**Step 4: Implement structured import and discovery interactions**

The browser may send pasted import text to preview, but it must discard the text
when the dialog closes. A preview marks a service URL as required when neither
the import nor current configuration supplies one; that row is not selectable.
The backend rechecks the effective URL at apply and refuses to enable a
credential-only unconfigured service. Discovery responses contain no credential
material. The final apply mutation includes selected candidate IDs and a
separate list of service IDs whose credentials may be imported.

**Step 5: Implement the dashboard element**

Keep the dashboard bundle independent and small. Poll runtime every 30 seconds only while visible, cancel on disconnect, and provide a link into the classic settings page.

**Step 6: Run web gates and build both bundles**

```bash
cd unraid-plugin/web
npm test
npx vue-tsc --noEmit
npm run build
test -s dist/settings/yarr-settings.js
test -s dist/settings/yarr-settings.css
test -s dist/dashboard/yarr-dashboard.js
```

Expected: tests/typecheck/build pass and all three artifacts are non-empty.

**Step 7: Commit and push**

```bash
git add unraid-plugin/web
git commit -m "feat(rustarr-bhf): build Yarr Unraid settings UI"
git push
bd comments add rustarr-bhf "Task 9 complete: settings, discovery, updater, logs, and dashboard UX committed and pushed."
```

---

## Task 10: Package and activate the classic and API plugins

**Files:**

- Create: `unraid-plugin/yarr.plg`
- Create: `unraid-plugin/source/usr/local/emhttp/plugins/yarr/Yarr.page`
- Create: `unraid-plugin/source/usr/local/emhttp/plugins/yarr/default.cfg`
- Create: `unraid-plugin/source/usr/local/emhttp/plugins/yarr/default.env`
- Create: `unraid-plugin/source/usr/local/emhttp/plugins/yarr/scripts/install-api-plugin.sh`
- Create: `unraid-plugin/source/usr/local/emhttp/plugins/yarr/scripts/uninstall-api-plugin.sh`
- Create: `unraid-plugin/scripts/build-package.sh`
- Create: `unraid-plugin/scripts/verify-package.sh`
- Create: `unraid-plugin/tests/classic-contract.sh`
- Modify: `unraid-plugin/tests/run.sh`

**Step 1: Write the classic-package contract**

Assert:

```text
yarr.plg is valid XML
all downloadable artifacts use HTTPS and SHA-256 verification
install creates missing persistent config without overwriting existing config
install places API and web artifacts at exact runtime paths
API activation uses a temporary symlink and atomic rename
API activation reloads unraid-api and checks /var/log/graphql-api.log
failed activation restores the prior API package
API uninstall treats PM2 exit-0/empty as stopped only with no exact or ambiguous owned process evidence
API uninstall rejects status/process contradictions before loader mutation
API uninstall preparation faults remove recovery without rollback; cleanup failure retains one validated transaction
uninstall stops Yarr before removing volatile files
uninstall retains /boot config and /mnt/user/appdata/yarr
package paths cannot escape staging roots
archive inventory exactly matches release-manifest.json expectations
source files match packaged files byte-for-byte
```

**Step 2: Run the classic contract and confirm failure**

```bash
bash unraid-plugin/tests/classic-contract.sh
```

Expected: non-zero exit because package/install artifacts are absent.

**Step 3: Implement the classic settings page**

`Yarr.page` loads the built CSS and JS from `/plugins/yarr/web/`, mounts
`<yarr-settings-app>`, bootstraps the host CSRF token, and cache-busts stable
asset names with SHA-256 content tokens. It contains no direct config-writing
PHP endpoint and no credential handling. `YarrDashboard.page` uses SHA-256
content tokens for its compact bundle, references the immutable
content-hashed icon filename shared with settings, reads the persistent
dashboard toggle, and loads only the compact dashboard bundle.

**Step 4: Implement API activation and rollback**

Stage the built API package under `/usr/local/emhttp/plugins/yarr/api/`, install locked production dependencies there, then atomically point `/usr/local/unraid-api/node_modules/unraid-api-plugin-yarr` at the staged package. Reload the API using the supported Unraid service entry point. Treat a new fatal/module-load error in `/var/log/graphql-api.log` or failure to expose `yarrRuntime` as activation failure. Uninstall uses the same authenticated GraphQL/new-log readiness helper: a running host must become ready with all Yarr fields absent before detached target/store artifacts are deleted; rollback restores exact loader state and proves prior readiness, retaining a bounded mode-0700 recovery transaction on incomplete recovery. A deterministically stopped API remains stopped.

Classic package retention uses an exact archive plus mode-0600 trusted-digest
sidecar pair. The sidecar may be created only after the current PLG-pinned
SHA-256 and strict packaged archive validator independently authenticate the
archive. Rollback revalidates the pair and executes only a root-only verified
copy. Legacy archives without provenance and malformed, linked, unsafe, or
misbound pairs fail before `upgradepkg`; pruning never separates the only
trusted recovery pair.

**Step 5: Implement deterministic package building**

`build-package.sh` must:

```text
accept plugin version and package build as required arguments
download the matching upstream Linux x86_64 archive and checksum
verify the checksum and exact one-file archive inventory
build API and both web bundles
stage the Yarr binary at /usr/local/yarr/bin/yarr
stage API dist, package metadata, and locked production dependencies
stage settings and dashboard bundles
write an embedded file manifest with SHA-256 and mode
create the Slackware txz
update release-manifest.json and yarr.plg checksums atomically
```

Use a temporary directory and cleanup trap. Never build a release package from partial source without the complete binary/API/web payload.

**Step 6: Run contracts and package verification**

```bash
bash unraid-plugin/tests/classic-contract.sh
bash unraid-plugin/scripts/build-package.sh 2.1.0 1
bash unraid-plugin/scripts/verify-package.sh
```

Expected: contract passes, package is created, manifest has a non-zero checksum, and verifier reports exact inventory/source parity.

**Step 7: Commit and push**

```bash
git add unraid-plugin
git commit -m "feat(rustarr-bhf): package Yarr for Unraid"
git push
bd comments add rustarr-bhf "Task 10 complete: classic plugin, API activation rollback, and deterministic package build committed and pushed."
```

---

## Task 11: Add CI and coordinated release orchestration

**Files:**

- Create: `.github/workflows/unraid-plugin-ci.yml`
- Create: `.github/workflows/unraid-plugin-release.yml`
- Modify: `Justfile`
- Modify: `README.md`
- Create: `unraid-plugin/README.md`

**Step 1: Add a workflow-contract test**

Extend `release-contract.sh` to parse both workflows and require immutable action SHAs, minimal permissions, artifact checksums, API tests/typecheck/build, web tests/typecheck/build, classic contracts, package verification, and release-manifest consistency.

**Step 2: Run the test and confirm failure**

```bash
bash unraid-plugin/tests/release-contract.sh
```

Expected: non-zero exit because workflows are absent.

**Step 3: Implement CI**

The CI workflow must run only plugin-relevant paths and execute:

```bash
cd unraid-plugin/api && npm ci && npm test && npx tsc --noEmit && npx tsc
cd unraid-plugin/web && npm ci && npm test && npx vue-tsc --noEmit && npm run build
bash unraid-plugin/tests/run.sh
bash unraid-plugin/scripts/build-package.sh 2.1.0 1
bash unraid-plugin/scripts/verify-package.sh
```

Use the upstream Unraid shared stub only in CI dependency installation; production keeps the peer dependency contract.

**Step 4: Implement coordinated release**

Trigger manually and on `unraid-v*` tags. Build the classic package, attach the `.txz`, updated `.plg`, release manifest, SHA-256 files, and a machine-readable inventory. Refuse to publish when the embedded Yarr binary version differs from `pluginVersion`.

**Step 5: Document installation and security boundaries**

Document loopback default, auth requirements for broader binding, Tailscale Serve, persistent paths, Docker socket read-only behavior, explicit credential consent, independent binary updates, rollback/reset, upgrade retention, uninstall retention, and disposable-Unraid release gate.

**Step 6: Run focused contracts**

```bash
bash unraid-plugin/tests/release-contract.sh
just unraid-test
```

Expected: workflow and plugin contracts pass.

**Step 7: Commit and push**

```bash
git add .github/workflows Justfile README.md unraid-plugin
git commit -m "ci(rustarr-bhf): automate Yarr Unraid plugin releases"
git push
bd comments add rustarr-bhf "Task 11 complete: pinned CI, coordinated release, and operator docs committed and pushed."
```

---

## Task 12: Run complete local gates and independent review

**Files:**

- Modify only files identified by failing gates or review findings.

**Step 1: Run the existing Yarr regression suite**

```bash
SOLDR_BYPASS=1 CARGO_TIMINGS=0 cargo test --workspace --locked
```

Expected: all existing Rust tests pass; baseline is 729 passing tests with documented ignored doctests.

**Step 2: Run every plugin gate**

```bash
cd unraid-plugin/api && npm ci && npm test && npx tsc --noEmit && npx tsc
cd ../web && npm ci && npm test && npx vue-tsc --noEmit && npm run build
cd ../../ && bash unraid-plugin/tests/run.sh
bash unraid-plugin/scripts/verify-package.sh
```

Expected: all backend, frontend, shell, XML, package, and source-parity checks pass.

**Step 3: Run static shell and repository hygiene checks**

```bash
shellcheck unraid-plugin/source/etc/rc.d/rc.yarr unraid-plugin/source/usr/local/emhttp/plugins/yarr/event/* unraid-plugin/source/usr/local/emhttp/plugins/yarr/scripts/*.sh unraid-plugin/scripts/*.sh unraid-plugin/tests/*.sh
rg -n 'eval|curl[^\n]*\|[^\n]*(sh|bash)|@app/|password[^\n]*console|apiKey[^\n]*console' unraid-plugin
```

Expected: ShellCheck passes and the policy scan has no unsafe implementation hits.

**Step 4: Request two independent reviews**

One reviewer checks security, lifecycle, rollback, packaging, and secret handling. A second reviewer checks GraphQL contract parity, Unraid host integration, responsive UX, accessibility, and test completeness. Fix every confirmed P0-P2 finding and add a regression test per behavior change.

**Step 5: Re-run affected gates once after fixes**

Run the complete commands from Steps 1-3 after the review-fix commit.

Expected: all gates pass with no open P0-P2 findings.

**Step 6: Commit and push review fixes**

```bash
git add unraid-plugin .github/workflows Justfile README.md
git commit -m "fix(rustarr-bhf): harden Yarr Unraid integration"
git push
bd comments add rustarr-bhf "Task 12 complete: full local gates and two independent reviews pass with no open P0-P2 findings."
```

Skip the commit only when review produces no file changes; still record exact gate and review results on the Bead.

---

## Task 13: Deploy and verify on disposable Unraid host `tootie`

**Files:**

- Create: `unraid-plugin/tests/live-contract.sh`
- Create: `docs/testing/yarr-unraid-tootie.md`
- Modify: `unraid-plugin/README.md`

**Step 1: Add an opt-in live contract before deployment**

Require `YARR_UNRAID_LIVE_TEST=1` and an explicit host. The script must refuse localhost and run only read-only or Yarr-scoped operations. It checks:

```text
plugin package installed and embedded manifest valid
API package active in unraid-api
yarrConfig query returns redacted fields
yarrRuntime reports packaged version
loopback endpoint health and readiness
start, stop, restart, array hook idempotency
Docker discovery returns candidates without credential values
failed config health check rolls back both files
self-update no-op for current version
reset returns to packaged binary
settings and dashboard assets return successfully
uninstall/reinstall preserves config and appdata
```

**Step 2: Stage backups on `tootie`**

Before changes, record and copy any existing Yarr-scoped paths under `/boot/config/plugins/yarr`, `/mnt/user/appdata/yarr`, `/usr/local/emhttp/plugins/yarr`, and `/usr/local/unraid-api/node_modules/unraid-api-plugin-yarr` into a timestamped directory under `/boot/config/plugins/yarr-backups/`. Do not alter unrelated services or Docker containers.

**Step 3: Transfer and install the built package**

```bash
scp unraid-plugin/dist/yarr-2.1.0-x86_64-1.txz tootie:/tmp/
scp unraid-plugin/yarr.plg tootie:/tmp/
ssh tootie 'plugin install /tmp/yarr.plg'
```

Expected: plugin installation succeeds, API reload has no new fatal errors, and Yarr starts on loopback when enabled.

**Step 4: Run the live contract**

```bash
YARR_UNRAID_LIVE_TEST=1 YARR_UNRAID_HOST=tootie bash unraid-plugin/tests/live-contract.sh
```

Expected: every live boundary passes without mutating media services.

**Step 5: Exercise authenticated exposure modes**

Configure a temporary test bearer credential through GraphQL, verify LAN mode binds and rejects unauthenticated requests, return to loopback, then enable Tailscale Serve and verify its endpoint before removing the Serve rule. Never print the bearer value.

**Step 6: Verify uninstall/reinstall retention**

Uninstall the classic plugin, prove Yarr/API volatile artifacts are removed while boot config and appdata remain, reinstall, and prove the prior redacted configuration and healthy runtime return.

**Step 7: Record evidence**

Write `docs/testing/yarr-unraid-tootie.md` with package checksum, installed binary version, command names, pass/fail table, rollback evidence, retention evidence, API log result, endpoint status codes, and cleanup state. Redact tokens, API keys, passwords, and private service URLs.

**Step 8: Commit and push**

```bash
git add unraid-plugin/tests/live-contract.sh unraid-plugin/README.md docs/testing/yarr-unraid-tootie.md
git commit -m "test(rustarr-bhf): verify Yarr plugin on Unraid"
git push
bd comments add rustarr-bhf "Task 13 complete: tootie install, runtime, rollback, discovery, update/reset, and uninstall/reinstall retention all verified."
```

---

## Task 14: Close the Bead and publish the implementation branch

**Files:**

- Modify only release metadata required by the final package checksum.

**Step 1: Confirm release artifacts agree**

```bash
bash unraid-plugin/scripts/verify-package.sh
git diff --exit-code
```

Expected: verifier passes and the worktree has no uncommitted changes.

**Step 2: Close and sync Beads**

```bash
bd close rustarr-bhf --reason "Full Yarr Unraid plugin implemented, reviewed, packaged, deployed, and verified on tootie."
bd dolt push
```

**Step 3: Rebase, push, and open the pull request**

```bash
git pull --rebase origin main
git push
gh pr create --base main --head feat/yarr-unraid-plugin --title "feat: add Yarr Unraid plugin" --body-file docs/superpowers/specs/2026-07-22-yarr-unraid-plugin-design.md
```

Expected: branch is current with `origin/main`, all commits are pushed, and the pull request URL is recorded on Bead `rustarr-bhf`.

**Step 4: Report final state**

Report the pull request, package checksum, local gate totals, review findings resolved, live `tootie` evidence, preserved persistent paths, and any non-blocking release caveats.
