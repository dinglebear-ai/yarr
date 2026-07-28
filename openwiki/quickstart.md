# Quickstart

Yarr provides a service-grouped CLI and MCP access to 11 supported media-stack
service kinds. Use the verified native installer by default:

```bash
curl -fsSL https://raw.githubusercontent.com/dinglebear-ai/yarr/main/install.sh | bash
yarr --version
```

Configure one service and validate it:

```bash
export YARR_SERVICES=sonarr
export YARR_SONARR_URL=http://127.0.0.1:8989
export YARR_SONARR_API_KEY=replace-me
yarr doctor --json
yarr sonarr status
yarr mcp
```

The npm launcher is usable only when the exact coupled version exists. Check
before invoking it and never fall back to unpinned `latest`:

```bash
YARR_VERSION=2.1.0
npm view "yarr-mcp@${YARR_VERSION}" version
npx -y "yarr-mcp@${YARR_VERSION}" mcp
```

GitHub release `v2.1.0` is currently public while `yarr-mcp@2.1.0` is absent
from npm; [issue #80](https://github.com/dinglebear-ai/yarr/issues/80) tracks
recovery. Use the native binary, source build, or independent Unraid package
until the exact npm version resolves.

The default MCP mode advertises one `yarr` tool whose `code` argument is an
async JavaScript arrow function. Discover the current callable table instead of
guessing names:

```javascript
async () => codemode.search("sonarr system status")
```

Six services have generated OpenAPI metadata tables. The executor preserves
their declared parameter serialization, request-media, and successful-response
transport contract. Operations that cannot be represented losslessly are not
published; read [Domain concepts](domain.md) and the generated capability matrix
in `docs/TOOLS_ACTIONS_ENDPOINTS.md` for exact counts and omission reasons.

For HTTP MCP, run `yarr serve` with bearer or OAuth authentication and connect
at `/mcp`. `/health`, `/ready`, `/status`, and `/metrics` are public probe
routes and should be restricted by network or reverse-proxy policy.

For the complete maintained guide, use `docs/QUICKSTART.md`; OpenWiki is an
orientation layer and not runtime authority.
