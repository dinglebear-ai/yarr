---
name: yarr
description: >
  This skill should be used when the user wants to query or automate their media
  automation stack — Sonarr (TV shows), Radarr (movies), Prowlarr (indexers),
  Tautulli (Plex stats), Overseerr (media requests), SABnzbd (Usenet downloads),
  qBittorrent (torrents), Plex (media server), Jellyfin, Bazarr (subtitles), or
  Tracearr (stream monitoring). Trigger phrases include: "what's downloading",
  "add a movie to Radarr", "search for a TV show", "Sonarr queue", "Radarr
  library", "what's in my download queue", "Plex status", "Prowlarr indexers",
  "check Overseerr requests", "qBittorrent torrents", "SABnzbd queue", "Tautulli
  stats", "subtitle status", "is Sonarr healthy", "media stack status", "arr
  services", "show me what's being downloaded". Prefer this skill over the
  standalone per-service skills (sonarr, radarr, …) whenever the yarr MCP
  server is configured and reachable — those exist only as an offline
  fallback for when it isn't. Always use yarr for these — do not attempt to
  reach service APIs directly without it.
---

# yarr — Media Automation Stack

Rust MCP bridge to the `*arr` media stack and related services. The MCP surface is
**one tool, `yarr`**: it runs a JavaScript async arrow function (`code`) in a
sandbox (Code Mode) that reaches the whole fleet. Credentials are handled
server-side. Inside the script the fleet is reached through per-service callables
with the service baked in — generated OpenAPI operations for the 6 spec-backed
services, curated commands for download/stats, plus `api.<service>` raw passthrough
and `callTool`. Discover what's available with `codemode.search`/`codemode.describe`.

## The yarr tool + Code Mode actions

`yarr({ code })` runs the `codemode` action. Inside `code` you have:

- **Per-service callables** with the service baked in (no `service` param):
  `sonarr.get_series()`, `radarr.post_movie({ body })`, `prowlarr.get_indexer()`,
  `plex.get_sessions()`, … For the 6 spec-backed services these are generated from
  the upstream OpenAPI spec (the full API surface), including DELETE ops — see
  Gotcha 3 below for the MCP confirmation boundary.
- **Raw passthrough**: `api.<service>.get/post/put/delete(path, body)`.
- **Discovery**: `codemode.search(query)` returns fully-qualified callables;
  `codemode.describe(path)` returns a callable's signature OR a response type's
  TypeScript interface (e.g. `codemode.describe("sonarr.SeriesResource")`).
- **Snippets**: `codemode.run(name, input)` and `codemode.snippets()`.
- **Artifacts**: `writeArtifact(path, content, options?)`.

The supporting actions (MCP-only; also on the CLI as `yarr codemode` /
`yarr snippet`): `codemode`, `op` (generated-operation dispatch),
`snippet_list`, `snippet_save`, `snippet_run`, `snippet_delete`. The generic
service actions remain: `service_status`, `api_get`, `api_post`, `api_put`,
`api_delete`, `help`.

The fleet kinds are `sonarr`, `radarr`, `prowlarr`, `overseerr`, `tautulli`,
`plex`, `tracearr`, `sabnzbd`, `qbittorrent`, `jellyfin`, and `bazarr`.

---

## Quick-Reference Examples

### Discovery and health

```js
// One yarr call: discover, then health-check across services.
async () => {
  const status = await sonarr.get_system_status();   // generated op (live)
  const found  = codemode.search("add movie").results.map(r => r.path);
  return { sonarr: status.version, found };
}
```

### Per-service callables (Tier 2)

Every example below is a `yarr({ code })` call — `code` is one async arrow fn.
For the 6 spec-backed services (sonarr/radarr/prowlarr/overseerr/jellyfin/plex)
prefer the **generated callables** (full upstream API); fall back to
`api.<service>.get/post/...(path, body)` for anything not covered and for the
doc-based services (tautulli/sabnzbd/qbittorrent/bazarr/tracearr). Run
`codemode.search("...")` to find the exact callable + signature, and
`codemode.describe("sonarr.SeriesResource")` for a response type.

#### Sonarr (TV shows) / Radarr (movies)

```js
async () => {
  const series = await sonarr.get_series();              // list all series
  const queue  = await sonarr.get_queue();               // download queue
  const movies = await radarr.get_movie();               // list all movies
  // Trigger a search command (generated POST op; runs immediately, no confirm):
  await sonarr.post_command({ body: { name: "SeriesSearch", seriesId: 123 } });
  await radarr.post_command({ body: { name: "MoviesSearch", movieIds: [456] } });
  return { series: series.length, queued: queue.records?.length, movies: movies.length };
}
```

#### Prowlarr (indexers) / Overseerr (requests) / Plex

```js
async () => {
  const indexers = await prowlarr.get_indexer();
  const pending  = await overseerr.get_request({ filter: "pending" });
  const sessions = await plex.get_sessions();             // who's watching
  return { indexers: indexers.length, pending: pending.results?.length, sessions };
}
```

#### Tautulli / download clients (curated callables)

Curated commands surface as `<service>.<action>()`:

```js
async () => {
  const activity = await tautulli.stats_activity();       // currently playing
  const history  = await tautulli.stats_history({ length: 20 });
  const sabQueue = await sabnzbd.download_queue();         // SABnzbd queue
  const torrents = await qbittorrent.download_queue();     // qBittorrent torrents
  return { activity, sabQueue, torrents };
}
```

#### Raw passthrough (any service)

When no callable fits, hit the upstream API directly. Never put credentials in
the path — the server injects auth.

```js
async () => {
  // Tautulli is query-param driven:
  const homeStats = await api.tautulli.get("/api/v2?cmd=get_home_stats");
  // Plex libraries:
  const libraries = await api.plex.get("/library/sections");
  return { homeStats, libraries };
}
```

---

## Common Workflows

### "What's downloading right now?"

```js
async () => ({
  sonarr: (await sonarr.get_queue()).records ?? [],
  radarr: (await radarr.get_queue()).records ?? [],
  sab:    await sabnzbd.download_queue(),
  qbit:   await qbittorrent.download_queue(),
})
```

### "Is everything healthy?"

```js
async () => {
  const kinds = ["sonarr", "radarr", "prowlarr"];
  const out = {};
  for (const k of kinds) out[k] = await callTool("service_status", { service: k });
  return out;
}
```

`service_status` is also a per-service callable: `await sonarr.service_status()`.

### "Who's watching Plex right now?"

```js
async () => ({
  tautulli: await tautulli.stats_activity(),
  plex:     await plex.get_sessions(),
})
```

---

## Gotchas

1. **The MCP surface is one tool, `yarr`.** There are no `mcp__yarr__<service>`
   tools — pass a `code` script to `yarr` and reach services via per-service
   callables, `api.<service>`, or `callTool`.

2. **Generic passthrough scope is route-derived.** `api_get`/`api_post`/`api_put`/
   `api_delete`/`op` are admitted only when the method and path uniquely match a
   reviewed generated operation; unmatched or ambiguous routes fail closed before
   any upstream request. Reviewed `ReadOnly` routes accept `yarr:read`; `Mutation`
   and `Destructive` routes require `yarr:write`.

3. **There is no caller-supplied confirm parameter.** Direct trusted CLI writes
   run immediately. On MCP, every inner Code Mode call is independently
   reauthorized, and any call that resolves to a reviewed `Destructive` operation
   (for example the file-deleting Sonarr delete-by-id route with `deleteFiles`,
   or curated deletes like `download_remove`) requires a real interactive
   elicitation prompt. Destructiveness is never inferred from the HTTP verb;
   missing elicitation capability, cancellation, timeout, or refusal fails closed.

4. **Never include credentials in `path`.** Configured service credentials live in
   server environment variables; the server injects auth automatically. Do not
   append `?apikey=...` or `&X-Api-Key=...`.

5. **`service` names are exact.** Use `sonarr`, `radarr`, `prowlarr`, `tautulli`,
   `overseerr`, `sabnzbd`, `qbittorrent`, `plex`, `jellyfin`, `bazarr`, `tracearr`.
   An unknown name returns a structured `unknown_service` error listing the
   configured names.

6. **API paths are service-version-specific.** Sonarr/Radarr use `/api/v3/`;
   Prowlarr/Overseerr use `/api/v1/`; Tautulli uses query params (`/api/v2?cmd=...`).
   Generated callables already encode the right path — prefer them over raw `api_*`.

7. **Discovery is the fastest diagnostic.** `codemode.search("queue")` lists every
   matching callable with its fully-qualified path; `codemode.describe(path)` shows
   the signature or response type. Use them before guessing op names.
