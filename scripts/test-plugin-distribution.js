#!/usr/bin/env node
"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

const root = path.resolve(__dirname, "..");
const services = ["sonarr", "radarr", "prowlarr", "overseerr", "sabnzbd", "qbittorrent", "plex", "jellyfin", "tautulli", "tracearr", "bazarr"];
const malicious = `'; touch SHOULD_NOT_EXIST; # $() \\ "`;

for (const service of services) {
  const manifest = JSON.parse(fs.readFileSync(path.join(root, "plugins", service, ".claude-plugin", "plugin.json"), "utf8"));
  const keys = Object.keys(manifest.userConfig).map((key) => key.toUpperCase());
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), `yarr-${service}-options-`));
  const marker = path.join(temp, "SHOULD_NOT_EXIST");
  const first = keys[0];
  const setup = path.join(root, "plugins", service, "scripts", "setup.sh");
  const result = spawnSync("bash", [setup], {
    env: {
      ...process.env,
      HOME: temp,
      XDG_CONFIG_HOME: path.join(temp, "config"),
      [`CLAUDE_PLUGIN_OPTION_${first}`]: malicious.replace("SHOULD_NOT_EXIST", marker),
      CLAUDE_PLUGIN_OPTION_NOT_DECLARED: `$(touch ${marker})`,
    },
    encoding: "utf8",
  });
  assert.equal(result.status, 0, `${service}: ${result.stderr}`);
  const config = path.join(temp, "config", `lab-${service}`, "config.json");
  assert.equal(fs.statSync(config).mode & 0o777, 0o600, `${service}: config mode`);
  const parsed = JSON.parse(fs.readFileSync(config, "utf8"));
  assert.equal(parsed[first], malicious.replace("SHOULD_NOT_EXIST", marker), `${service}: malicious value round trip`);
  assert.equal(Object.hasOwn(parsed, "NOT_DECLARED"), false, `${service}: unknown option rejected`);
  assert.equal(fs.existsSync(marker), false, `${service}: setup executed option value`);

  if (service !== "overseerr") {
    const loader = path.join(root, "plugins", service, "skills", service, "scripts", "load-config.sh");
    const read = spawnSync("bash", ["-c", 'source "$1"; load_plugin_config "$2" "${@:3}"; printf "%s" "${!3}"', "bash", loader, config, ...keys], {
      encoding: "utf8",
    });
    assert.equal(read.status, 0, `${service}: ${read.stderr}`);
    assert.equal(read.stdout, parsed[first], `${service}: parsed value round trip`);
    assert.equal(fs.existsSync(marker), false, `${service}: loader executed option value`);
  }

  fs.rmSync(temp, { recursive: true, force: true });
}

{
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), "yarr-bundle-options-"));
  const marker = path.join(temp, "SHOULD_NOT_EXIST");
  const value = malicious.replace("SHOULD_NOT_EXIST", marker);
  const result = spawnSync("bash", [path.join(root, "plugins", "yarr", "scripts", "plugin-setup.sh")], {
    env: {
      ...process.env,
      HOME: temp,
      XDG_CONFIG_HOME: path.join(temp, "config"),
      CLAUDE_PLUGIN_OPTION_SONARR_URL: value,
      CLAUDE_PLUGIN_OPTION_SONARR_API_KEY: "key",
      CLAUDE_PLUGIN_OPTION_NOT_DECLARED: `$(touch ${marker})`,
    },
    encoding: "utf8",
  });
  assert.equal(result.status, 0, result.stderr);
  const config = path.join(temp, "config", "lab-sonarr", "config.json");
  assert.equal(fs.statSync(config).mode & 0o777, 0o600);
  assert.equal(JSON.parse(fs.readFileSync(config, "utf8")).SONARR_URL, value);
  assert.equal(fs.existsSync(marker), false, "bundled setup executed an option value");
  fs.rmSync(temp, { recursive: true, force: true });
}

for (const service of services) {
  const standalone = path.join(root, "plugins", service, "skills", service);
  const bundled = path.join(root, "plugins", "yarr", "skills", service);
  for (const relative of fs.readdirSync(path.join(standalone, "scripts"))) {
    const left = path.join(standalone, "scripts", relative);
    const right = path.join(bundled, "scripts", relative);
    assert.equal(fs.existsSync(right), true, `${service}: bundled script missing ${relative}`);
    assert.equal(fs.readFileSync(left).equals(fs.readFileSync(right)), true, `${service}: bundled ${relative} drift`);
  }
}

const packageJson = JSON.parse(fs.readFileSync(path.join(root, "packages", "yarr-mcp", "package.json"), "utf8"));
const pinned = `yarr-mcp@${packageJson.version}`;
const mcp = JSON.parse(fs.readFileSync(path.join(root, "plugins", "yarr", ".mcp.json"), "utf8")).mcpServers.yarr;
const gemini = JSON.parse(fs.readFileSync(path.join(root, "plugins", "yarr", "gemini-extension.json"), "utf8")).mcpServers.yarr;
assert.equal(mcp.command, "npx");
assert.deepEqual(mcp.args.slice(0, 3), ["-y", pinned, "mcp"]);
assert.equal(gemini.command, "npx");
assert.deepEqual(gemini.args.slice(0, 3), ["-y", pinned, "mcp"]);
const hooks = JSON.parse(fs.readFileSync(path.join(root, "plugins", "yarr", "hooks", "hooks.json"), "utf8")).hooks;
for (const hook of [hooks.SessionStart[0].hooks[0], hooks.ConfigChange[0].hooks[0]]) {
  assert.equal(hook.command, "${CLAUDE_PLUGIN_ROOT}/scripts/plugin-setup.sh");
}
assert.equal(fs.existsSync(path.join(root, "plugins", "yarr", "bin", "yarr")), false, "stale bundled binary must be removed");

console.log("plugin distribution contract ok");
