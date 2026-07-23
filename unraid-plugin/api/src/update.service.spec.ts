import { EventEmitter } from "node:events";
import { PassThrough } from "node:stream";

import { describe, expect, it, vi } from "vitest";

import {
  SafeCommandRunner,
  type CommandProcess,
  type CommandRunner,
  type CommandSpawn,
} from "./command-runner";
import { YARR_UPDATE_PATH } from "./paths";
import { UpdateService } from "./update.service";

const validStatus = {
  installedVersion: "2.0.0",
  packagedVersion: "2.0.0",
  availableVersion: "2.1.0",
  updateAvailable: true,
  usingOverlay: false,
  rollbackAvailable: true,
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

function boundaryHarness(stdout: string, exitCode: number, stderr = ""): UpdateService {
  const spawnCommand: CommandSpawn = () => {
    const events = new EventEmitter();
    const stdoutStream = new PassThrough();
    const stderrStream = new PassThrough();
    const child = Object.assign(events, {
      pid: 4242,
      stdout: stdoutStream,
      stderr: stderrStream,
      kill: () => true,
    }) as unknown as CommandProcess;
    queueMicrotask(() => {
      stdoutStream.end(stdout);
      stderrStream.end(stderr);
      events.emit("close", exitCode, null);
    });
    return child;
  };
  return new UpdateService(new SafeCommandRunner(spawnCommand, vi.fn()));
}

describe("UpdateService", () => {
  it("uses only the allowlisted updater JSON commands and returns typed results", async () => {
    const { service, run } = harness();

    await expect(service.status()).resolves.toEqual(validStatus);
    await expect(service.apply("2.1.0")).resolves.toEqual(validStatus);
    await expect(service.reset()).resolves.toEqual(validStatus);
    await expect(service.rollback()).resolves.toEqual(validStatus);

    expect(run.mock.calls.map(([command, args]) => [command, args])).toEqual([
      [YARR_UPDATE_PATH, ["check", "--json"]],
      [YARR_UPDATE_PATH, ["apply", "--version", "2.1.0", "--json"]],
      [YARR_UPDATE_PATH, ["reset", "--json"]],
      [YARR_UPDATE_PATH, ["rollback", "--json"]],
    ]);
    expect(run.mock.calls.every(([, , options]) => options?.maxOutputBytes === 64 * 1024)).toBe(true);
    expect(run.mock.calls.map(([, , options]) => options?.allowedExitCodes)).toEqual([
      [0],
      [0, 1],
      [0, 1],
      [0, 1],
    ]);
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
    JSON.stringify({
      ...validStatus,
      message: "Update failed before activation; recovery cleanup pending: ../../private",
    }),
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

  it("preserves structured nonzero rollback and cleanup outcomes through the real command runner", async () => {
    const rolledBack = {
      ...validStatus,
      rolledBack: true,
      message: "Update failed; previous binary restored",
    };
    const cleanupPending = {
      ...validStatus,
      usingOverlay: true,
      message: "Yarr updated; obsolete backup cleanup pending",
    };
    const manualRollbackFailed = {
      ...validStatus,
      rolledBack: true,
      message: "Rollback failed; current binary restored",
    };
    const restorationIncomplete = {
      ...validStatus,
      rolledBack: false,
      message: "Rollback failed; restoration incomplete; recovery snapshots retained",
    };
    const updateRestorationIncomplete = {
      ...validStatus,
      rolledBack: false,
      message: "Update failed; restoration incomplete; recovery snapshots retained",
    };
    const resetRestorationIncomplete = {
      ...validStatus,
      rolledBack: false,
      message: "Reset failed; restoration incomplete; recovery snapshots retained",
    };
    const updatePreparationCleanupPending = {
      ...validStatus,
      rolledBack: false,
      message: "Update failed before activation; recovery cleanup pending: .yarr.update.recovery.Ab12Cd34",
    };
    const resetPreparationCleanupPending = {
      ...validStatus,
      rolledBack: false,
      message: "Reset failed before mutation; recovery cleanup pending: .yarr.reset.recovery.Z9y8X7w6",
    };

    await expect(
      boundaryHarness(JSON.stringify(rolledBack), 1).apply("2.1.0"),
    ).resolves.toEqual(rolledBack);
    await expect(
      boundaryHarness(JSON.stringify(cleanupPending), 1).apply("2.1.0"),
    ).resolves.toEqual(cleanupPending);
    await expect(
      boundaryHarness(JSON.stringify(manualRollbackFailed), 1).rollback(),
    ).resolves.toEqual(manualRollbackFailed);
    await expect(
      boundaryHarness(JSON.stringify(restorationIncomplete), 1).rollback(),
    ).resolves.toEqual(restorationIncomplete);
    await expect(
      boundaryHarness(JSON.stringify(updateRestorationIncomplete), 1).apply("2.1.0"),
    ).resolves.toEqual(updateRestorationIncomplete);
    await expect(
      boundaryHarness(JSON.stringify(resetRestorationIncomplete), 1).reset(),
    ).resolves.toEqual(resetRestorationIncomplete);
    await expect(
      boundaryHarness(JSON.stringify(updatePreparationCleanupPending), 1).apply("2.1.0"),
    ).resolves.toEqual(updatePreparationCleanupPending);
    await expect(
      boundaryHarness(JSON.stringify(resetPreparationCleanupPending), 1).reset(),
    ).resolves.toEqual(resetPreparationCleanupPending);
  });

  it("keeps malformed and unexpected real-runner nonzero exits as failures", async () => {
    await expect(boundaryHarness("not-json", 1).reset()).rejects.toThrow("invalid update response");
    await expect(
      boundaryHarness(JSON.stringify(validStatus), 1).reset(),
    ).rejects.toThrow("Yarr update reset failed");
    await expect(
      boundaryHarness(JSON.stringify({
        ...validStatus,
        rolledBack: false,
        message: "Rollback failed; current binary restored",
      }), 1).rollback(),
    ).rejects.toThrow("Yarr update rollback failed");
    await expect(
      boundaryHarness(JSON.stringify({
        ...validStatus,
        rolledBack: true,
        message: "Rollback failed; restoration incomplete; recovery snapshots retained",
      }), 1).rollback(),
    ).rejects.toThrow("Yarr update rollback failed");
    await expect(
      boundaryHarness(JSON.stringify({
        ...validStatus,
        rolledBack: true,
        message: "Update failed; restoration incomplete; recovery snapshots retained",
      }), 1).apply("2.1.0"),
    ).rejects.toThrow("Yarr update apply failed");
    await expect(
      boundaryHarness(JSON.stringify({
        ...validStatus,
        rolledBack: true,
        message: "Reset failed; restoration incomplete; recovery snapshots retained",
      }), 1).reset(),
    ).rejects.toThrow("Yarr update reset failed");
    await expect(
      boundaryHarness(JSON.stringify({
        ...validStatus,
        rolledBack: true,
        message: "Update failed before activation; recovery cleanup pending: .yarr.update.recovery.Ab12Cd34",
      }), 1).apply("2.1.0"),
    ).rejects.toThrow("Yarr update apply failed");
    await expect(
      boundaryHarness(JSON.stringify({
        ...validStatus,
        rolledBack: false,
        message: "Reset failed before mutation; recovery cleanup pending: .yarr.reset.recovery.Z9y8X7w6",
      }), 1).apply("2.1.0"),
    ).rejects.toThrow("Yarr update apply failed");
    await expect(
      boundaryHarness(JSON.stringify(validStatus), 2, "private-output").reset(),
    ).rejects.toThrow("Yarr update reset failed");
  });

  it.each([
    "No compatible release is available",
    "Update available: 2.1.0",
    "Yarr is current",
    "Yarr reset; updater backup cleanup pending",
    "Yarr updated; obsolete backup cleanup pending",
    "Update failed; previous binary restored",
    "Update failed; restoration incomplete; recovery snapshots retained",
    "Reset failed; restoration incomplete; recovery snapshots retained",
    "Update failed before activation",
    "Reset failed before mutation",
    "Update failed before activation; recovery cleanup pending: .yarr.update.recovery.Ab12Cd34",
    "Reset failed before mutation; recovery cleanup pending: .yarr.reset.recovery.Z9y8X7w6",
    "Rollback failed; current binary restored",
    "Rollback failed; restoration incomplete; recovery snapshots retained",
    "Manual rollback is unavailable; no previous binary exists",
    "Yarr rolled back; recovery snapshot cleanup pending",
    "Yarr updated to 2.1.0",
    "Reset failed; previous binary restored",
    "Yarr reset to packaged binary",
    "Yarr rolled back to previous binary",
  ])("accepts the shell updater's exact bounded message contract: %s", async (message) => {
    const { service } = harness(JSON.stringify({ ...validStatus, message }));
    await expect(service.status()).resolves.toMatchObject({ message });
  });
});
