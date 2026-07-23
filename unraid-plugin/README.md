# Yarr for Unraid

This directory is the complete Unraid distribution for Yarr. It keeps the
privileged classic plugin, external Unraid API extension, settings application,
dashboard widget, package sources, release metadata, and contracts together
without changing Yarr's normal Rust, npm, Docker, or MCP distributions.

## Components and ownership

- `yarr.plg` is the classic Unraid installer. It verifies the classic package
  checksum before installation and retains one previous package for activation
  rollback.
- `source/` is the package filesystem. The classic plugin owns process,
  configuration, update, event-hook, and optional Tailscale Serve lifecycle.
- `api/` is `unraid-api-plugin-yarr`, an external NestJS GraphQL extension.
  It validates and transactionally saves configuration, controls the classic
  service through its scripts, exposes bounded redacted logs, and performs
  read-only Docker discovery.
- `web/` builds the light-DOM `<yarr-settings-app>` and `<yarr-dashboard>`
  custom elements. The classic settings page loads the settings bundle; the
  Unraid dashboard loader consumes the dashboard bundle.
- `assets/yarr.svg` is the original icon artwork; the package carries its
  256x256 RGBA `yarr-2b068b08366b.png` content-addressed rendering for both
  Unraid page entries and the widget.
- `scripts/` builds and verifies the deterministic `.txz`.
- `tests/` enforces lifecycle, updater, classic/API activation, workflow,
  release, path, inventory, mode, and secret contracts without requiring
  root.

The classic plugin is the only component allowed to perform privileged
operating-system work. The API extension never replaces that boundary.

## Installation

In Unraid, open **Plugins > Install Plugin** and enter:

```text
https://raw.githubusercontent.com/dinglebear-ai/yarr/main/unraid-plugin/yarr.plg
```

The installer downloads `yarr-2.1.0-x86_64-1.txz` from the separate
`unraid-v2.1.0-1` package release, verifies its SHA-256, installs the classic
payload, registers the external API module, and activates the web assets. A
failed activation restores the prior package and API loader state.

Configure Yarr under **Settings > Yarr**. A fresh install is disabled and uses
loopback binding until the operator saves a valid configuration and starts the
service.

## Network and authentication

Loopback is the default. It listens only on `127.0.0.1` and is the only mode
that may run without remote-client authentication.

- **Loopback:** local Unraid and reverse-proxy clients only.
- **LAN:** binds the service for network access. The API rejects this mode
  unless bearer or OAuth authentication is fully configured.
- **Custom:** binds an explicitly validated host/address. It has the same
  authentication gate as LAN mode.
- **Trusted gateway:** this plugin permits Yarr's typed `TRUSTED_GATEWAY` /
  `trusted-gateway` mode only while Yarr is bound to `127.0.0.1`, Tailscale
  Serve is disabled, and a same-host proxy is the only caller. Allowed Host and
  Origin values constrain that local proxy contract but do not authenticate a
  direct network client; both headers are spoofable on a raw socket.
- **Tailscale Serve:** keeps the Yarr process on loopback and publishes the
  configured endpoint through a service-scoped Tailscale Serve mapping. Because
  this is network exposure, bearer or Google OAuth is mandatory. Stop,
  uninstall, and failed activation remove only Yarr's mapping.

Do not expose a no-auth listener on LAN, a custom address, or a public reverse
proxy. Bearer and Google OAuth are the only approved network-exposed modes. The
API codec and shell startup preflight both enforce this boundary, including
after manual file edits; the browser warning is not the security control.

## Credentials and service import

Each Sonarr, Radarr, Prowlarr, Tautulli, Overseerr, Bazarr, Tracearr, SABnzbd,
qBittorrent, Plex, and Jellyfin credential is stored independently in:

```text
/boot/config/plugins/yarr/.env
```

Credentials are server-side only. GraphQL returns presence/status booleans,
never the secret values, and logs are redacted before they reach the UI.
Preserve and clear are explicit operations. Empty browser fields do not
silently erase existing credentials.

Structured import accepts supported Yarr configuration and reports rejected or
unmapped fields instead of guessing. A selected service must have either a
valid imported URL or a valid URL already stored in the current configuration;
a credential-only import cannot enable an unconfigured service. Credential
values remain private while the preview explains that the URL is required.
Docker discovery connects to the local Docker Engine Unix socket with
read-only `GET` list/inspect operations, strict response limits, and an
allowlist of supported labels. Discovery returns candidate service URLs and
metadata; importing any credential requires explicit operator consent. Yarr
never mounts or writes Docker configuration.

## Persistent and runtime paths

Persistent operator state:

```text
/boot/config/plugins/yarr/yarr.cfg
/boot/config/plugins/yarr/.env
/mnt/user/appdata/yarr/
```

Runtime/package state:

```text
/usr/local/yarr/bin/yarr
/usr/local/emhttp/plugins/yarr/
/usr/local/unraid-api/node_modules/unraid-api-plugin-yarr
```

An independently updated binary is installed at:

```text
/mnt/user/appdata/yarr/bin/yarr
```

When present and valid, that overlay takes precedence over the packaged binary.
Its one-step rollback image is
`/mnt/user/appdata/yarr/bin/yarr.previous`.

Upgrade and reinstall preserve boot configuration and appdata. Uninstall stops
Yarr, removes its Tailscale mapping and API/web runtime registration, and
removes the classic payload, but intentionally retains both persistent paths.
Delete them manually only when permanent configuration and credential removal
is intended.

Daemon and wrapper-logger PID evidence includes process start ticks plus
executable and argument identity. Every signal revalidates that evidence first;
stale or reused numeric PIDs are never signaled. Status determines whether an
owned process exists before parsing configuration, so a stopped installation
with a malformed manual edit still reports canonical `STOPPED` and remains
safe to upgrade, stop, or uninstall. Unverified live PID evidence remains
fail-closed.

## Binary updater rollback and reset

The updater is independent of the classic package release. On the stable
channel it accepts only a newer release in the same major version, verifies the
published SHA-256 before extraction, requires an archive containing exactly one
regular mode-0755 `yarr` executable, checks `yarr --version`, and then performs
an atomic durable swap. Installed-version and policy checks occur while holding
the stable lifecycle lock. Metadata, checksums, and archives have independent
connect/total timeouts, retry limits, and maximum byte sizes.

Apply, reset, and **Roll back to previous version** all create durable, private,
content-verified snapshots before changing either live binary path. Apply
stages the candidate and predecessor from copies; reset retires overlay
binaries into the recovery transaction before selecting the package binary;
manual rollback stages `yarr.previous` as active while retaining the replaced
executable as the next predecessor. If commit, restart, or readiness fails,
restoration copies from the non-consumable snapshots and stops at the first
failed restoration step. `rolledBack=true` is emitted only after exact
hash/mode checks, durability syncs, and prior runtime-state readiness all pass.
An incomplete restoration fails explicitly with `rolledBack=false` and retains
the snapshots and surviving binaries under the overlay for operator recovery.
If snapshot preparation fails before either live binary is touched, the updater
removes that new recovery transaction immediately. A removal failure is
reported as `rolledBack=false` with the validated
`.yarr.update.recovery.*` or `.yarr.reset.recovery.*` identifier; the Updates
panel preserves that identifier and directs the operator to
`/mnt/user/appdata/yarr/bin`. Recovery transactions remain retained by design
after mutation begins until restoration is proven or an operator resolves the
failure.
Manual rollback is available from the Updates panel or as
`yarr-update.sh rollback --json`. **Reset to packaged** removes the appdata
overlay so `/usr/local/yarr/bin/yarr` is selected again. Neither action changes
plugin configuration or service credentials.

Every structured updater response carries closed `operation` and `outcome`
discriminators. Operations are `CHECK`, `APPLY`, `RESET`, and `ROLLBACK`;
outcomes are namespaced to their operation, such as `CHECK_UPDATE_AVAILABLE`,
`APPLY_RESTORED`, or `RESET_COMPLETED`. The API validates operation, outcome,
exit code, rollback state, cleanup state and identifier, overlay/update state,
and the bounded message class as one tuple before GraphQL or the UI receives
the response. Human-readable `message` remains display text and is never used
as the authoritative outcome discriminator.

## Trusted classic rollback

Classic rollback never derives trust from a retained archive's filename or
from hashing unknown legacy bytes. The PLG-pinned checksum first authenticates
the downloaded package, whose packaged validator then enforces canonical
paths, root ownership, safe modes/types, required payloads, and the embedded
file checksum/mode inventory. Only then is a mode-`0600`, root-owned digest
sidecar written atomically and durably beside the retained archive.

Rollback requires the exact archive/sidecar basename binding, recomputes
SHA-256, reruns the strict validator, and executes a separately verified copy
from a root-only runtime directory. A legacy archive without provenance fails
closed before daemon stop or `upgradepkg`; it is never trusted by calculating
a new digest. Package pruning preserves the current pair and one trusted prior
pair, and removes archive/sidecar pairs together only after activation commits.

## API and web loader behavior

API-plugin uninstall treats `unraid-api start` as launch only. A running host
must pass the same authenticated GraphQL and new-log readiness checks used by
activation, with all Yarr query/mutation fields absent, before detached
activation artifacts are deleted. Failure restores the exact loader files,
target, and immutable store, restarts the prior state, and proves its
readiness. If rollback readiness is unproven, the mode-`0700` recovery
transaction remains under the API module directory and uninstall returns
failure.

The real `unraid-api status` command inherits PM2 mini-list behavior: an
intentionally stopped API can return exit `0` with no output. Uninstall accepts
that tuple as stopped only after a `/proc` identity scan proves there is no
live or ambiguous Node process for the exact `/usr/local/unraid-api` cwd and
`dist/main.js` entrypoint. Empty status with live evidence, online status
without owned evidence, command errors, and unrecognized output fail before
recovery creation or loader mutation. A proven stopped API remains stopped.

Before mutation, uninstall copies, byte/mode-verifies, and durably syncs the
loader documents into a private transaction. Any preparation failure removes
that transaction without invoking rollback. If removal itself fails, exactly
one validated mode-`0700` transaction is retained and its bounded identifier
and cleanup action are reported. Runtime rollback is reserved for failures
after the loader/runtime transaction starts.

The classic package stages production-only JavaScript for
`unraid-api-plugin-yarr`. Activation installs a content-addressed module,
updates the Unraid API loader registration transactionally, restarts
`unraid-api`, checks only the new GraphQL log segment for loader failures, and
runs an authenticated `yarrRuntime` probe without placing the Unraid API key in
process arguments. Activation loads the exact staged package, awaits its
`graphqlSchemaExtension()` exporter, and parses the resolved SDL. Any failure
restores the previous module, loader document, and API process before returning
an error.

`Yarr.page` is exposed at `/Settings/Yarr`, safely bootstraps the host CSRF
token, and cache-busts settings CSS/JS with SHA-256 content tokens.
`YarrDashboard.page` independently uses SHA-256 content tokens for the compact
dashboard CSS/JS and mounts `<yarr-dashboard>` without loading the settings
bundle. Both descriptors and the dashboard component use the immutable
content-hashed icon filename. `DASHBOARD_WIDGET_ENABLE=true` is the persistent default and
the Server & Auth settings toggle can hide the widget. Both surfaces inherit
Unraid's light/dark variables and contain no credential or upstream media
detail.

## Troubleshooting and logs

Start with the settings **Status** and **Logs** tabs, then inspect:

```bash
/etc/rc.d/rc.yarr status
tail -n 200 /var/log/yarr/yarr.log
tail -n 200 /var/log/graphql-api.log
```

The UI log query is line-, byte-, and time-bounded. Known credentials are
redacted from normal output, command failures, readiness errors, and historical
log reads. Do not paste raw boot configuration or unredacted upstream service
logs into an issue.

Common checks:

- A start rejected in LAN/custom mode means authentication is incomplete.
- An API module error requires checking the new lines in
  `/var/log/graphql-api.log`; the activation transaction should already have
  restored the prior module.
- A failed update with `rolledBack=true` has proven the prior executable and
  runtime state. A `restoration incomplete` result has not; inspect the retained
  recovery directory before retrying rollback or reset.
- Missing discovery candidates usually mean Docker is unavailable or the
  container lacks supported labels; discovery does not scan arbitrary files.
- A stale Tailscale route should be corrected by stop/start. Cleanup is scoped
  to Yarr and must not reset unrelated Serve configuration.

## Uninstall

Use Unraid's **Plugins** page to remove Yarr. The uninstall transaction stops
and proves process quiescence under the stable lock first, removes the external API registration, restarts and verifies
the prior Unraid API state, then removes runtime files. If API cleanup cannot be
completed safely, classic removal aborts rather than stranding a loaded module.
The lock inode is never unlinked. Boot configuration and appdata are retained.

The following are retained by design:

```text
/boot/config/plugins/yarr/
/mnt/user/appdata/yarr/
```

Reinstalling adopts those files. Remove them manually after uninstall only when
you want to erase settings, per-service credentials, updated binaries, and
rollback state.

## Local verification

Prerequisites are Bash, GNU tar/coreutils, `jq`, `xmllint`, `shellcheck`,
Node.js 22.18.0, npm, and authenticated `gh` read access to the upstream binary
release assets.

Run the complete rootless contract suite:

```bash
just unraid-test
```

Run backend and frontend gates:

```bash
cd unraid-plugin/api
npm ci
npm test
npx tsc --noEmit
npx tsc

cd ../web
npm ci
npm test
npx vue-tsc --noEmit
npm run build
```

Build and verify the committed package identity:

```bash
cd ../..
just unraid-build 2.1.0 1
just unraid-release-check
```

`build-package.sh` verifies the upstream archive checksum and embedded version
before staging anything. It normalizes ownership, modes, path order, and
timestamps; verifies the candidate package; and only then replaces the package,
manifest, and `.plg` metadata. The archive never contains a `./` member, and
every packaged directory is root-owned mode `0755` under any caller umask.

## Two-version release procedure

Yarr uses two separate release identities:

- `v2.1.0` owns the upstream Rust binary archive
  `yarr-x86_64.tar.gz` and its checksum.
- `unraid-v2.1.0-1` owns the classic `.txz`, `yarr.plg`, release manifest,
  per-file SHA-256 files, embedded payload inventory, and machine-readable
  release inventory.

The package build may read the two exact `v2.1.0` assets. It must never upload
to, edit, publish, or delete that binary release. The coordinated workflow is
triggered by an existing `unraid-vVERSION-BUILD` tag or an explicit manual
input of the same shape.

Release sequence:

1. Ensure API and web lockfiles are current and all local verification passes.
2. Build twice under umask `022` and `077`; require byte-identical `.txz`
   output.
3. Verify the embedded Yarr version equals `pluginVersion`, every input
   checksum, the independently committed upstream archive SHA-256, archive
   path/type/mode/owner, source parity, committed package SHA-256, `.plg`
   checksum, and release URL. Rebuilds must byte-match the package committed at
   the immutable package-tag commit.
4. Stage the package, installer, manifest, embedded payload inventory,
   machine-readable inventory, and a checksum file for every artifact.
5. Create a new `unraid-v*` GitHub release as a draft, upload and download all
   assets, compare every byte, confirm both the package tag commit and upstream
   `v*` asset snapshot are unchanged, and only then publish with
   `latest=false`. The create request carries the resolved SHA as
   `target_commitish`; because GitHub ignores that field when a tag already
   exists, repeated immutable tag resolution remains the authoritative commit
   check and the per-run marker records the same SHA.
6. If any pre-publication step fails, delete only the newly created package
   draft after re-reading it by release ID and proving it is still an owned
   draft. Ambiguous create/upload/publish responses are reconciled from server
   state using a per-run marker; a published release is never deleted.

The workflow refuses an already existing package release rather than clobbering
assets. It does not implicitly publish the existing `v2.1.0` draft.

## Disposable-Unraid live release gate

Hosted CI is intentionally rootless. Before declaring a package release ready,
deploy the exact verified `.plg` to a disposable Unraid host and record
evidence for:

1. Fresh install, upgrade, failed activation rollback, uninstall, and retained
   boot/appdata state.
2. Real `unraid-api` loader discovery, schema fields, authenticated GraphQL
   queries/mutations, restart rollback, settings custom element, and dashboard
   custom element.
3. Disabled/started/stopped lifecycle, daemon/logger PID ownership and reuse,
   malformed-stopped upgrade/uninstall behavior, health/readiness, array hooks,
   reboot persistence, and bounded/redacted logs.
4. Loopback reachability, rejection of unauthenticated LAN/custom binding,
   authenticated LAN/custom access, and optional Tailscale Serve setup/cleanup.
5. Structured import, credential-only URL enforcement, and read-only Docker
   discovery with no Docker or media mutation and no credential returned to the
   browser.
6. Checksummed independent update, apply/reset/manual-rollback restoration
   faults, retained recovery snapshots, reset to packaged binary, and preserved
   configuration.
7. MCP initialization plus representative read-only service calls without
   adding, deleting, or changing media.

Do not run this privileged gate against a production Unraid host.
