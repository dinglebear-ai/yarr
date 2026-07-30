"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const {
  binaryVersion,
  downloadUrl,
  releaseVersion,
  targetFor,
} = require("../lib/platform");
const { version: packageVersion } = require("../package.json");

test("maps supported platforms to release assets", () => {
  assert.deepEqual(targetFor("linux", "x64"), {
    asset: "yarr-x86_64.tar.gz",
    binary: "yarr",
  });
  assert.deepEqual(targetFor("win32", "x64"), {
    asset: "yarr-windows-x86_64.tar.gz",
    binary: "yarr.exe",
  });
});

test("rejects unsupported platforms", () => {
  assert.throws(() => targetFor("linux", "riscv64"), /Unsupported platform/);
});

test("uses the coupled package/runtime version as the binary tag", () => {
  assert.equal(binaryVersion(), packageVersion);
  assert.equal(releaseVersion({}), `v${packageVersion}`);
});

test("allows release tag override", () => {
  const env = { YARR_VERSION: "v9.9.9", YARR_RELEASE_BASE_URL: "https://example.test/releases" };
  assert.equal(downloadUrl(targetFor("linux", "x64"), env), "https://example.test/releases/v9.9.9/yarr-x86_64.tar.gz");
});
