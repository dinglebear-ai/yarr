#!/usr/bin/env node
"use strict";

// sync-plugin-manifests.js — keep every hard-coded `@dinglebear/yarr@<version>` launcher
// pin coupled to packages/yarr-mcp/package.json, the single version release-please
// bumps on a release. release-please can update JSON scalar fields (server.json
// $.version, package.json $.version) but cannot template a version embedded inside
// a launcher-arg string such as `["-y", "@dinglebear/yarr@1.1.1", "mcp"]`, so those pins
// drift on every release and break the coupled-version contract checks.
//
// Usage:
//   node scripts/sync-plugin-manifests.js          # rewrite pins in place
//   node scripts/sync-plugin-manifests.js --check   # fail (non-zero) on drift

const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const check = process.argv.includes("--check");

const packageJson = JSON.parse(
  fs.readFileSync(path.join(root, "packages/yarr-mcp/package.json"), "utf8"),
);
const { name, version } = packageJson;
const spec = `${name}@${version}`; // e.g. @dinglebear/yarr@2.0.0

// Files that pin the npm launcher spec `@dinglebear/yarr@<semver>`. Listed explicitly so
// an unrelated match can never be rewritten by accident.
// NB: deliberately excludes scripts/validate-plugin-layout.sh — that checker
// derives the expected pin from package.json at runtime, so it never needs
// rewriting (and rewriting it here would trip the scripts/ -> scripts/README.md
// coupled-file guard on the release PR, where README does not also change).
const pinnedLauncherFiles = [
  "plugins/yarr/.mcp.json",
  "plugins/yarr/gemini-extension.json",
  "server.json",
  "docs/PLUGINS.md",
  "plugins/README.md",
  "plugins/yarr/README.md",
  "plugins/yarr/CLAUDE.md",
];

const launcherPin = new RegExp(`${name}@\\d+\\.\\d+\\.\\d+`, "g");
// server.json _meta.buildInfo.version travels with the launcher pin (release-please
// only owns the top-level and packages[] version scalars, not this metadata block).
const buildInfoVersion = /("buildInfo"\s*:\s*\{\s*"version"\s*:\s*")\d+\.\d+\.\d+(")/;
// server.json's YARR_VERSION env var advertises the matching release tag as its
// placeholder; keep that example tag coupled so it never points at a stale release.
const yarrVersionPlaceholder =
  /("name"\s*:\s*"YARR_VERSION"[\s\S]*?"placeholder"\s*:\s*"v)\d+\.\d+\.\d+(")/;

const drift = new Set();

function apply(relative, transform) {
  const file = path.join(root, relative);
  const before = fs.readFileSync(file, "utf8");
  const after = transform(before);
  if (before === after) return;
  drift.add(relative);
  if (!check) fs.writeFileSync(file, after);
}

for (const relative of pinnedLauncherFiles) {
  apply(relative, (text) => text.replace(launcherPin, spec));
}
apply("server.json", (text) => text.replace(buildInfoVersion, `$1${version}$2`));
apply("server.json", (text) => text.replace(yarrVersionPlaceholder, `$1${version}$2`));

if (drift.size === 0) {
  console.log(`plugin manifest launcher pins already at ${spec}`);
  process.exit(0);
}

const list = [...drift].map((f) => "  " + f).join("\n");

if (check) {
  console.error(
    `plugin manifest launcher pins are out of sync with ${spec}:\n${list}\n\n` +
      "Run: node scripts/sync-plugin-manifests.js",
  );
  process.exit(1);
}

console.log(`synced ${drift.size} file(s) to ${spec}:\n${list}`);
