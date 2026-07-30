"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawn } = require("node:child_process");
const test = require("node:test");

const launcher = path.resolve(__dirname, "..", "bin", "yarr.js");

function fixture(root, body) {
  const file = path.join(root, "fake-yarr.js");
  fs.writeFileSync(file, `#!/usr/bin/env node\n${body}\n`, { mode: 0o755 });
  fs.chmodSync(file, 0o755);
  return file;
}

function run(binary, args = []) {
  return new Promise((resolve) => {
    const child = spawn(process.execPath, [launcher, ...args], {
      env: { ...process.env, YARR_BIN: binary },
      stdio: ["ignore", "pipe", "pipe"],
    });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (chunk) => { stdout += chunk; });
    child.stderr.on("data", (chunk) => { stderr += chunk; });
    child.on("close", (code, signal) => resolve({ code, signal, stdout, stderr }));
  });
}

test("launcher asynchronously preserves arguments and exit status", async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "yarr-launcher-"));
  try {
    const binary = fixture(root, "process.stdout.write(process.argv.slice(2).join('|')); process.exit(23);");
    const result = await run(binary, ["mcp", "--stdio-contract"]);
    assert.equal(result.code, 23);
    assert.equal(result.stdout, "mcp|--stdio-contract");
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test("launcher forwards SIGTERM and exits after the child", async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "yarr-launcher-signal-"));
  const marker = path.join(root, "signal");
  const binary = fixture(root, `
process.on('SIGTERM', () => { require('node:fs').writeFileSync(${JSON.stringify(marker)}, 'SIGTERM'); process.exit(0); });
process.stdout.write('ready\\n');
setInterval(() => {}, 1000);
`);
  try {
    const child = spawn(process.execPath, [launcher, "mcp"], {
      env: { ...process.env, YARR_BIN: binary },
      stdio: ["ignore", "pipe", "pipe"],
    });
    await new Promise((resolve) => child.stdout.once("data", resolve));
    child.kill("SIGTERM");
    await new Promise((resolve) => child.once("close", resolve));
    assert.equal(fs.readFileSync(marker, "utf8"), "SIGTERM");
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test("launcher preserves the MCP stdio initialize contract", async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "yarr-launcher-stdio-"));
  const binary = fixture(root, `
const readline = require('node:readline');
readline.createInterface({ input: process.stdin }).once('line', (line) => {
  const request = JSON.parse(line);
  process.stdout.write(JSON.stringify({ jsonrpc: '2.0', id: request.id, result: { protocolVersion: '2025-11-25', serverInfo: { name: 'yarr', version: '1.1.1' }, capabilities: {} } }) + '\\n');
  process.exit(0);
});
`);
  try {
    const child = spawn(process.execPath, [launcher, "mcp"], {
      env: { ...process.env, YARR_BIN: binary },
      stdio: ["pipe", "pipe", "pipe"],
    });
    child.stdin.end(`${JSON.stringify({ jsonrpc: "2.0", id: 7, method: "initialize", params: {} })}\n`);
    let stdout = "";
    child.stdout.on("data", (chunk) => { stdout += chunk; });
    const code = await new Promise((resolve) => child.once("close", resolve));
    assert.equal(code, 0);
    const response = JSON.parse(stdout.trim());
    assert.equal(response.id, 7);
    assert.equal(response.result.serverInfo.name, "yarr");
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});
