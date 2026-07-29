#!/usr/bin/env bash
# Setup script for the Yarr plugin. Run it manually: no lifecycle hooks ship here.
# Bridges only declared service settings into non-executable JSON files used by
# the bundled fallback skills. The MCP process receives its env directly from
# .mcp.json and does not need settings persisted here.
set -euo pipefail

command -v node >/dev/null 2>&1 || {
  printf 'yarr plugin setup: node is required to persist plugin settings safely\n' >&2
  exit 1
}

config_home="${XDG_CONFIG_HOME:-$HOME/.config}"
umask 077
node - "${config_home}" <<'NODE'
const fs = require('node:fs');
const path = require('node:path');

const configHome = process.argv[2];
const services = {
  sonarr: ['SONARR_URL', 'SONARR_API_KEY', 'SONARR_DEFAULT_QUALITY_PROFILE'],
  radarr: ['RADARR_URL', 'RADARR_API_KEY', 'RADARR_DEFAULT_QUALITY_PROFILE'],
  prowlarr: ['PROWLARR_URL', 'PROWLARR_API_KEY'],
  overseerr: ['OVERSEERR_URL', 'OVERSEERR_API_KEY'],
  sabnzbd: ['SABNZBD_URL', 'SABNZBD_API_KEY'],
  qbittorrent: ['QBITTORRENT_URL', 'QBITTORRENT_USERNAME', 'QBITTORRENT_PASSWORD'],
  plex: ['PLEX_URL', 'PLEX_TOKEN'],
  jellyfin: ['JELLYFIN_URL', 'JELLYFIN_API_KEY'],
  tautulli: ['TAUTULLI_URL', 'TAUTULLI_API_KEY'],
  tracearr: ['TRACEARR_URL'],
  bazarr: ['BAZARR_URL', 'BAZARR_API_KEY'],
};

let count = 0;
for (const [service, allowed] of Object.entries(services)) {
  const values = {};
  for (const key of allowed) {
    const value = process.env[`CLAUDE_PLUGIN_OPTION_${key}`]
      ?? process.env[`CLAUDE_PLUGIN_OPTION_${key.toLowerCase()}`];
    if (typeof value === 'string' && value.length > 0) values[key] = value;
  }
  if (Object.keys(values).length === 0) continue;
  const directory = path.join(configHome, `lab-${service}`);
  const file = path.join(directory, 'config.json');
  const temporary = `${file}.tmp.${process.pid}`;
  fs.mkdirSync(directory, { recursive: true, mode: 0o700 });
  fs.chmodSync(directory, 0o700);
  try {
    fs.writeFileSync(temporary, JSON.stringify(values, null, 2) + '\n', { mode: 0o600 });
    fs.renameSync(temporary, file);
    fs.chmodSync(file, 0o600);
  } finally {
    fs.rmSync(temporary, { force: true });
  }
  count += Object.keys(values).length;
}
process.stdout.write(`yarr plugin setup: wrote ${count} fallback settings\n`);
NODE
