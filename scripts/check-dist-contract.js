#!/usr/bin/env node
"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const platform = require("../packages/yarr-mcp/lib/platform");

const root = path.resolve(__dirname, "..");
const read = (relative) => fs.readFileSync(path.join(root, relative), "utf8");
const json = (relative) => JSON.parse(read(relative));
const contract = json("dist.targets.json");
const packageJson = json("packages/yarr-mcp/package.json");
const server = json("server.json");
const releaseManifest = json(".release-please-manifest.json");
const releasePlease = json("release-please-config.json");

function tomlPackageVersion(relative) {
  const section = /\[package\]([\s\S]*?)(?=\n\[|$)/.exec(read(relative));
  assert.ok(section, relative + " is missing [package]");
  const version = /^version\s*=\s*"([^"]+)"/m.exec(section[1]);
  assert.ok(version, relative + " package is missing version");
  return version[1];
}

function cargoLockVersion(name) {
  for (const block of read("Cargo.lock").split("[[package]]").slice(1)) {
    if (new RegExp("^name = \"" + name + "\"$", "m").test(block)) {
      const version = /^version = "([^"]+)"/m.exec(block);
      assert.ok(version, "Cargo.lock " + name + " is missing version");
      return version[1];
    }
  }
  assert.fail("Cargo.lock is missing package " + name);
}

assert.equal(contract.schemaVersion, 1);
assert.deepEqual(contract.identity, {
  binaryName: "yarr",
  canonicalRepo: "dinglebear-ai/yarr",
  npmPackage: "yarr-mcp",
  mcpName: "ai.dinglebear/yarr-mcp",
});
assert.equal(contract.versionContract.mode, "coupled-release-tag");
assert.equal(contract.versionContract.tagPrefix, "v");
assert.equal(contract.integrity.checksumAsset, "SHA256SUMS");
assert.equal(contract.integrity.provenanceDigest, "github-release-api-sha256");
assert.equal(platform.releaseBaseUrl({}), "https://github.com/dinglebear-ai/yarr/releases/download");

const versions = new Map([
  ["Cargo.toml", tomlPackageVersion("Cargo.toml")],
  ["Cargo.lock:yarr", cargoLockVersion("yarr")],
  ["xtask/Cargo.toml", tomlPackageVersion("xtask/Cargo.toml")],
  [".release-please-manifest.json", releaseManifest["."]],
  ["packages/yarr-mcp/package.json", packageJson.version],
  ["server.json", server.version],
  ["server.json npm package", server.packages.find((entry) => entry.identifier === packageJson.name)?.version],
]);
const versionReport = [...versions].map(([file, version]) => "  " + file + ": " + version).join("\n");
assert.equal(new Set(versions.values()).size, 1, "coupled release versions differ:\n" + versionReport);
assert.equal(Object.hasOwn(packageJson, "binaryVersion"), false, "binaryVersion must not decouple launcher and runtime");
assert.equal(packageJson.name, contract.identity.npmPackage);
assert.equal(packageJson.mcpName, contract.identity.mcpName);
assert.equal(server.name, contract.identity.mcpName);
assert.equal(server.repository.url.replace(/\.git$/, ""), "https://github.com/" + contract.identity.canonicalRepo);
assert.equal(
  fs.readFileSync(path.join(root, "dist.targets.json")).equals(fs.readFileSync(path.join(root, "packages/yarr-mcp/dist.targets.json"))),
  true,
  "packaged target manifest is stale; run npm --prefix packages/yarr-mcp run prepack",
);

const extraFiles = releasePlease.packages["."]["extra-files"] || [];
for (const required of ["packages/yarr-mcp/package.json", "server.json"]) {
  assert.ok(extraFiles.some((entry) => entry.path === required), "release-please must update " + required);
}

const workflow = read(".github/workflows/release.yml");
const installer = read("install.sh");
assert.equal(installer, read("scripts/install.sh"), "published shell installers must remain byte-identical");
for (const target of contract.targets) {
  assert.deepEqual(platform.targetFor(target.nodePlatform, target.nodeArch), {
    asset: target.asset,
    binary: target.archiveBinary,
  });
  const matrixText = "- target: " + target.rustTarget + "\n            arch: " + target.releaseMatrixArch + "\n            ext: \"" + target.exeExtension + "\"";
  assert.ok(workflow.includes(matrixText), "release matrix is missing " + target.rustTarget);
  assert.ok(installer.includes(target.asset), "shell installer is missing " + target.asset);
}
for (const required of [
  "Verify coupled versions",
  "sha256sum -- *.tar.gz > SHA256SUMS",
  "SHA256SUMS",
  "npm test",
  "npm run check",
  "npm publish --provenance",
]) {
  assert.ok(workflow.includes(required), "release workflow is missing contract step: " + required);
}

const spec = packageJson.name + "@" + packageJson.version;
const mcp = json("plugins/yarr/.mcp.json").mcpServers.yarr;
const gemini = json("plugins/yarr/gemini-extension.json").mcpServers.yarr;
assert.equal(mcp.command, "npx");
assert.deepEqual(mcp.args.slice(0, 3), ["-y", spec, "mcp"]);
assert.equal(gemini.command, "npx");
assert.deepEqual(gemini.args.slice(0, 3), ["-y", spec, "mcp"]);
assert.equal(fs.existsSync(path.join(root, "plugins/yarr/bin/yarr")), false, "portable plugin must not contain a committed binary");
assert.ok(installer.includes("SHA256SUMS"));
assert.ok(installer.includes("provenance digest"));
assert.ok(installer.includes("validate_archive"));

console.log("dist contract ok: " + contract.identity.binaryName + " " + [...versions.values()][0] + " (" + contract.targets.length + " targets)");
