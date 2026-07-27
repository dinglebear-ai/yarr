# Bad image and deployment rollback

Owner: `@jmagar`

## Before deployment

```bash
docker inspect --format '{{.Config.Image}}' yarr-mcp | tee .yarr-previous-image
export YARR_MCP_IMAGE='ghcr.io/dinglebear-ai/yarr@sha256:<verified-digest>'
docker compose -f docker-compose.prod.yml config --quiet
docker compose -f docker-compose.prod.yml run --rm --no-deps yarr-mcp doctor --json
```

The new digest must come from the clean Docker Publish promotion. Do not deploy
the quarantine candidate tag or resolve `latest` during the change.

## Deploy and verify

```bash
docker compose -f docker-compose.prod.yml up -d --wait --force-recreate yarr-mcp
curl --fail http://127.0.0.1:40070/ready
docker inspect --format '{{.Config.Image}} {{.State.Health.Status}}' yarr-mcp
```

Then test authenticated MCP read behavior and one representative upstream read.

## Rollback

```bash
export YARR_MCP_IMAGE="$(cat .yarr-previous-image)"
docker compose -f docker-compose.prod.yml up -d --wait --force-recreate yarr-mcp
curl --fail http://127.0.0.1:40070/ready
```

Preserve the failed digest, workflow URL, container logs, and doctor output.
Never retag the failed digest as `latest` during investigation.
