#!/usr/bin/env bash
# Setup script for the qbittorrent plugin. Run it manually: no lifecycle hooks ship here.
# Persists only manifest-declared options as non-executable JSON.
set -euo pipefail

CONFIG_DIR="${XDG_CONFIG_HOME:-$HOME/.config}/lab-qbittorrent"
CONFIG_FILE="${CONFIG_DIR}/config.json"
ALLOWED_KEYS=("QBITTORRENT_URL" "QBITTORRENT_USERNAME" "QBITTORRENT_PASSWORD")

command -v node >/dev/null 2>&1 || {
  printf 'qbittorrent: node is required to persist plugin settings safely\n' >&2
  exit 1
}
mkdir -p "${CONFIG_DIR}"
chmod 700 "${CONFIG_DIR}" 2>/dev/null || true
umask 077

count="$(node - "${CONFIG_FILE}" "${ALLOWED_KEYS[@]}" <<'NODE'
const fs = require("node:fs");
const [file, ...allowed] = process.argv.slice(2);
const values = {};
for (const key of allowed) {
  const value = process.env[`CLAUDE_PLUGIN_OPTION_${key}`]
    ?? process.env[`CLAUDE_PLUGIN_OPTION_${key.toLowerCase()}`];
  if (typeof value === "string" && value.length > 0) values[key] = value;
}
const temporary = `${file}.tmp.${process.pid}`;
try {
  fs.writeFileSync(temporary, JSON.stringify(values, null, 2) + "\n", { mode: 0o600 });
  fs.renameSync(temporary, file);
  fs.chmodSync(file, 0o600);
} finally {
  fs.rmSync(temporary, { force: true });
}
process.stdout.write(String(Object.keys(values).length));
NODE
)"

if [[ "${count}" -eq 0 ]]; then
  printf 'qbittorrent: not configured yet - set the service URL/key in plugin settings.\n' >&2
else
  printf 'qbittorrent: wrote %s settings to %s\n' "${count}" "${CONFIG_FILE}"
fi
