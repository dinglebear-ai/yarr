import { describe, expect, it, vi } from "vitest";

import type { CommandRunner } from "./command-runner";
import { YARR_UPDATE_PATH } from "./paths";
import { UpdateService } from "./update.service";

const validStatus = {
  installedVersion: "2.0.0",
  packagedVersion: "2.0.0",
  availableVersion: "2.1.0",
  updateAvailable: true,
  usingOverlay: false,
  rolledBack: false,
  message: "Update available: 2.1.0",
};

function harness(stdout = JSON.stringify(validStatus)) {
  const run = vi.fn<CommandRunner["run"]>(async () => ({ exitCode: 0, stdout, stderr: "" }));
  return {
    service: new UpdateService({ run } as CommandRunner),
    run,
  };
}

describe("UpdateService", () => {
  it("uses only the allowlisted updater JSON commands and returns typed results", async () => {
    const { service, run } = harness();

    await expect(service.status()).resolves.toEqual(validStatus);
    await expect(service.apply("2.1.0")).resolves.toEqual(validStatus);
    await expect(service.reset()).resolves.toEqual(validStatus);

    expect(run.mock.calls.map(([command, args]) => [command, args])).toEqual([
      [YARR_UPDATE_PATH, ["check", "--json"]],
      [YARR_UPDATE_PATH, ["apply", "--version", "2.1.0", "--json"]],
      [YARR_UPDATE_PATH, ["reset", "--json"]],
    ]);
    expect(run.mock.calls.every(([, , options]) => options?.maxOutputBytes === 64 * 1024)).toBe(true);
  });

  it.each([
    "2.01.0",
    "02.1.0",
    "2.1",
    "2.1.0-01",
    "2.1.0+",
    "2.1.0\n--json",
    `${"1".repeat(11)}.0.0`,
  ])("rejects invalid or unbounded SemVer input: %s", async (version) => {
    const { service, run } = harness();
    await expect(service.apply(version)).rejects.toThrow("valid bounded SemVer");
    expect(run).not.toHaveBeenCalled();
  });

  it.each([
    "not-json",
    JSON.stringify([]),
    JSON.stringify({ ...validStatus, secret: "private" }),
    JSON.stringify({ ...validStatus, updateAvailable: "yes" }),
    JSON.stringify({ ...validStatus, installedVersion: "02.0.0" }),
    JSON.stringify({ ...validStatus, message: "remote-private-value" }),
    `${JSON.stringify(validStatus)} trailing`,
    "x".repeat(64 * 1024 + 1),
  ])("rejects malformed, unsafe, or oversized updater output", async (stdout) => {
    const { service } = harness(stdout);
    await expect(service.status()).rejects.toThrow("invalid update response");
  });

  it("does not reflect command output from failures", async () => {
    const run = vi.fn<CommandRunner["run"]>(async () => {
      throw new Error("command failed: private-output");
    });
    const service = new UpdateService({ run } as CommandRunner);

    await expect(service.status()).rejects.toThrow("Yarr update check failed");
    await expect(service.status()).rejects.not.toThrow("private-output");
  });

  it.each([
    "No compatible release is available",
    "Update available: 2.1.0",
    "Yarr is current",
    "Yarr reset; updater backup cleanup pending",
    "Yarr updated; obsolete backup cleanup pending",
    "Update failed; previous binary restored",
    "Yarr updated to 2.1.0",
    "Reset failed; previous binary restored",
    "Yarr reset to packaged binary",
  ])("accepts the shell updater's exact bounded message contract: %s", async (message) => {
    const { service } = harness(JSON.stringify({ ...validStatus, message }));
    await expect(service.status()).resolves.toMatchObject({ message });
  });
});
