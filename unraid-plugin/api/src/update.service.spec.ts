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
import {
  UpdateOperation,
  UpdateOutcome,
  UpdateService,
  validateUpdateProtocolResponse,
  type UpdateStatus,
} from "./update.service";

type ValidCase = {
  name: string;
  operation: UpdateOperation;
  exitCode: 0 | 1;
  value: UpdateStatus;
};

function response(
  operation: UpdateOperation,
  outcome: UpdateOutcome,
  overrides: Partial<UpdateStatus>,
): UpdateStatus {
  return {
    operation,
    outcome,
    installedVersion: "2.0.0",
    packagedVersion: "2.0.0",
    availableVersion: "",
    updateAvailable: false,
    usingOverlay: false,
    rollbackAvailable: false,
    rolledBack: false,
    cleanupPending: false,
    recoveryIdentifier: "",
    message: "Yarr is current",
    ...overrides,
  };
}

const VALID_CASES: readonly ValidCase[] = [
  { name: "check without a compatible release", operation: UpdateOperation.CHECK, exitCode: 0, value: response(UpdateOperation.CHECK, UpdateOutcome.CHECK_NO_COMPATIBLE_RELEASE, { message: "No compatible release is available" }) },
  { name: "check with an update", operation: UpdateOperation.CHECK, exitCode: 0, value: response(UpdateOperation.CHECK, UpdateOutcome.CHECK_UPDATE_AVAILABLE, { availableVersion: "2.1.0", updateAvailable: true, message: "Update available: 2.1.0" }) },
  { name: "check when current", operation: UpdateOperation.CHECK, exitCode: 0, value: response(UpdateOperation.CHECK, UpdateOutcome.CHECK_CURRENT, { availableVersion: "2.0.0" }) },
  { name: "apply no-op when current", operation: UpdateOperation.APPLY, exitCode: 0, value: response(UpdateOperation.APPLY, UpdateOutcome.APPLY_CURRENT, { availableVersion: "2.0.0" }) },
  { name: "apply committed", operation: UpdateOperation.APPLY, exitCode: 0, value: response(UpdateOperation.APPLY, UpdateOutcome.APPLY_UPDATED, { installedVersion: "2.1.0", availableVersion: "2.1.0", usingOverlay: true, rollbackAvailable: true, message: "Yarr updated to 2.1.0" }) },
  { name: "apply committed with cleanup pending", operation: UpdateOperation.APPLY, exitCode: 1, value: response(UpdateOperation.APPLY, UpdateOutcome.APPLY_UPDATED, { installedVersion: "2.1.0", availableVersion: "2.1.0", usingOverlay: true, rollbackAvailable: true, cleanupPending: true, recoveryIdentifier: ".yarr.update.recovery.C1e2A3n4", message: "Yarr updated; obsolete backup cleanup pending" }) },
  { name: "apply failed before activation", operation: UpdateOperation.APPLY, exitCode: 1, value: response(UpdateOperation.APPLY, UpdateOutcome.APPLY_FAILED_BEFORE_ACTIVATION, { availableVersion: "2.1.0", updateAvailable: true, message: "Update failed before activation" }) },
  { name: "apply failed before activation with cleanup pending", operation: UpdateOperation.APPLY, exitCode: 1, value: response(UpdateOperation.APPLY, UpdateOutcome.APPLY_FAILED_BEFORE_ACTIVATION, { availableVersion: "2.1.0", updateAvailable: true, cleanupPending: true, recoveryIdentifier: ".yarr.update.recovery.Ab12Cd34", message: "Update failed before activation" }) },
  { name: "apply restored", operation: UpdateOperation.APPLY, exitCode: 1, value: response(UpdateOperation.APPLY, UpdateOutcome.APPLY_RESTORED, { availableVersion: "2.1.0", updateAvailable: true, rolledBack: true, message: "Update failed; previous binary restored" }) },
  { name: "apply restored with cleanup pending", operation: UpdateOperation.APPLY, exitCode: 1, value: response(UpdateOperation.APPLY, UpdateOutcome.APPLY_RESTORED, { availableVersion: "2.1.0", updateAvailable: true, rolledBack: true, cleanupPending: true, recoveryIdentifier: ".yarr.update.recovery.R3s4T5o6", message: "Update failed; previous binary restored" }) },
  { name: "apply restoration incomplete", operation: UpdateOperation.APPLY, exitCode: 1, value: response(UpdateOperation.APPLY, UpdateOutcome.APPLY_RESTORATION_INCOMPLETE, { availableVersion: "2.1.0", updateAvailable: true, usingOverlay: true, message: "Update failed; restoration incomplete; recovery snapshots retained" }) },
  { name: "reset completed", operation: UpdateOperation.RESET, exitCode: 0, value: response(UpdateOperation.RESET, UpdateOutcome.RESET_COMPLETED, { message: "Yarr reset to packaged binary" }) },
  { name: "reset completed with cleanup pending", operation: UpdateOperation.RESET, exitCode: 1, value: response(UpdateOperation.RESET, UpdateOutcome.RESET_COMPLETED, { cleanupPending: true, recoveryIdentifier: ".yarr.reset.recovery.C1e2A3n4", message: "Yarr reset; updater backup cleanup pending" }) },
  { name: "reset failed before mutation", operation: UpdateOperation.RESET, exitCode: 1, value: response(UpdateOperation.RESET, UpdateOutcome.RESET_FAILED_BEFORE_MUTATION, { usingOverlay: true, rollbackAvailable: true, message: "Reset failed before mutation" }) },
  { name: "reset failed before mutation with cleanup pending", operation: UpdateOperation.RESET, exitCode: 1, value: response(UpdateOperation.RESET, UpdateOutcome.RESET_FAILED_BEFORE_MUTATION, { usingOverlay: true, rollbackAvailable: true, cleanupPending: true, recoveryIdentifier: ".yarr.reset.recovery.Z9y8X7w6", message: "Reset failed before mutation" }) },
  { name: "reset restored", operation: UpdateOperation.RESET, exitCode: 1, value: response(UpdateOperation.RESET, UpdateOutcome.RESET_RESTORED, { usingOverlay: true, rollbackAvailable: true, rolledBack: true, message: "Reset failed; previous binary restored" }) },
  { name: "reset restored with cleanup pending", operation: UpdateOperation.RESET, exitCode: 1, value: response(UpdateOperation.RESET, UpdateOutcome.RESET_RESTORED, { usingOverlay: true, rollbackAvailable: true, rolledBack: true, cleanupPending: true, recoveryIdentifier: ".yarr.reset.recovery.R3s4T5o6", message: "Reset failed; previous binary restored" }) },
  { name: "reset restoration incomplete", operation: UpdateOperation.RESET, exitCode: 1, value: response(UpdateOperation.RESET, UpdateOutcome.RESET_RESTORATION_INCOMPLETE, { message: "Reset failed; restoration incomplete; recovery snapshots retained" }) },
  { name: "rollback completed", operation: UpdateOperation.ROLLBACK, exitCode: 0, value: response(UpdateOperation.ROLLBACK, UpdateOutcome.ROLLBACK_COMPLETED, { installedVersion: "2.0.1", usingOverlay: true, rollbackAvailable: true, message: "Yarr rolled back to previous binary" }) },
  { name: "rollback completed with cleanup pending", operation: UpdateOperation.ROLLBACK, exitCode: 1, value: response(UpdateOperation.ROLLBACK, UpdateOutcome.ROLLBACK_COMPLETED, { installedVersion: "2.0.1", usingOverlay: true, rollbackAvailable: true, cleanupPending: true, recoveryIdentifier: ".yarr.rollback.recovery.C1e2A3n4", message: "Yarr rolled back; recovery snapshot cleanup pending" }) },
  { name: "rollback unavailable", operation: UpdateOperation.ROLLBACK, exitCode: 1, value: response(UpdateOperation.ROLLBACK, UpdateOutcome.ROLLBACK_UNAVAILABLE, { message: "Manual rollback is unavailable; no previous binary exists" }) },
  { name: "rollback failed before activation", operation: UpdateOperation.ROLLBACK, exitCode: 1, value: response(UpdateOperation.ROLLBACK, UpdateOutcome.ROLLBACK_FAILED_BEFORE_ACTIVATION, { usingOverlay: true, rollbackAvailable: true, message: "Rollback failed before activation" }) },
  { name: "rollback failed before activation with cleanup pending", operation: UpdateOperation.ROLLBACK, exitCode: 1, value: response(UpdateOperation.ROLLBACK, UpdateOutcome.ROLLBACK_FAILED_BEFORE_ACTIVATION, { usingOverlay: true, rollbackAvailable: true, cleanupPending: true, recoveryIdentifier: ".yarr.rollback.recovery.P1r2E3p4", message: "Rollback failed before activation" }) },
  { name: "rollback restored", operation: UpdateOperation.ROLLBACK, exitCode: 1, value: response(UpdateOperation.ROLLBACK, UpdateOutcome.ROLLBACK_RESTORED, { usingOverlay: true, rollbackAvailable: true, rolledBack: true, message: "Rollback failed; current binary restored" }) },
  { name: "rollback restored with cleanup pending", operation: UpdateOperation.ROLLBACK, exitCode: 1, value: response(UpdateOperation.ROLLBACK, UpdateOutcome.ROLLBACK_RESTORED, { usingOverlay: true, rollbackAvailable: true, rolledBack: true, cleanupPending: true, recoveryIdentifier: ".yarr.rollback.recovery.R3s4T5o6", message: "Rollback failed; current binary restored" }) },
  { name: "rollback restoration incomplete", operation: UpdateOperation.ROLLBACK, exitCode: 1, value: response(UpdateOperation.ROLLBACK, UpdateOutcome.ROLLBACK_RESTORATION_INCOMPLETE, { usingOverlay: true, rollbackAvailable: true, message: "Rollback failed; restoration incomplete; recovery snapshots retained" }) },
];

const DEFAULT_BY_OPERATION = new Map<UpdateOperation, ValidCase>([
  [UpdateOperation.CHECK, VALID_CASES[1]!],
  [UpdateOperation.APPLY, VALID_CASES[4]!],
  [UpdateOperation.RESET, VALID_CASES[11]!],
  [UpdateOperation.ROLLBACK, VALID_CASES[18]!],
]);

function operationForCommand(command: string | undefined): UpdateOperation {
  if (command === "check") return UpdateOperation.CHECK;
  if (command === "apply") return UpdateOperation.APPLY;
  if (command === "reset") return UpdateOperation.RESET;
  return UpdateOperation.ROLLBACK;
}

function harness(stdout?: string) {
  const run = vi.fn<CommandRunner["run"]>(async (_command, args) => {
    const operation = operationForCommand(args[0]);
    const selected = DEFAULT_BY_OPERATION.get(operation);
    if (!selected) throw new Error("missing test response");
    return { exitCode: selected.exitCode, stdout: stdout ?? JSON.stringify(selected.value), stderr: "" };
  });
  return { service: new UpdateService({ run } as CommandRunner), run };
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

function invoke(service: UpdateService, operation: UpdateOperation): Promise<UpdateStatus> {
  if (operation === UpdateOperation.CHECK) return service.status();
  if (operation === UpdateOperation.APPLY) return service.apply("2.1.0");
  if (operation === UpdateOperation.RESET) return service.reset();
  return service.rollback();
}

const OVERLAY_TRUE_OUTCOMES = new Set<UpdateOutcome>([
  UpdateOutcome.APPLY_UPDATED,
  UpdateOutcome.ROLLBACK_COMPLETED,
  UpdateOutcome.ROLLBACK_FAILED_BEFORE_ACTIVATION,
  UpdateOutcome.ROLLBACK_RESTORED,
]);
const OVERLAY_FALSE_OUTCOMES = new Set<UpdateOutcome>([
  UpdateOutcome.RESET_COMPLETED,
]);
const ROLLBACK_TRUE_OUTCOMES = new Set<UpdateOutcome>([
  UpdateOutcome.ROLLBACK_COMPLETED,
  UpdateOutcome.ROLLBACK_FAILED_BEFORE_ACTIVATION,
  UpdateOutcome.ROLLBACK_RESTORED,
]);
const ROLLBACK_FALSE_OUTCOMES = new Set<UpdateOutcome>([
  UpdateOutcome.RESET_COMPLETED,
  UpdateOutcome.ROLLBACK_UNAVAILABLE,
]);
const CURRENT_OUTCOMES = new Set<UpdateOutcome>([
  UpdateOutcome.CHECK_CURRENT,
  UpdateOutcome.APPLY_CURRENT,
]);
const UPDATE_AHEAD_OUTCOMES = new Set<UpdateOutcome>([
  UpdateOutcome.CHECK_UPDATE_AVAILABLE,
  UpdateOutcome.APPLY_FAILED_BEFORE_ACTIVATION,
  UpdateOutcome.APPLY_RESTORED,
]);

type TupleMutation = {
  name: string;
  value: UpdateStatus;
};

function impossibleTupleMutations(candidate: ValidCase): readonly TupleMutation[] {
  const value = candidate.value;
  const mutate = (
    name: string,
    overrides: Partial<Record<keyof UpdateStatus, unknown>>,
  ): TupleMutation => ({
    name,
    value: { ...value, ...overrides } as UpdateStatus,
  });
  const sibling = VALID_CASES.find((other) =>
    other.operation === candidate.operation &&
    other.value.outcome !== value.outcome
  );
  const mutations: TupleMutation[] = [
    mutate("installed version leading zero", { installedVersion: "02.0.0" }),
    mutate("installed version prerelease", { installedVersion: "2.0.0-rc.1" }),
    mutate("installed version component overflow", { installedVersion: "9223372036854775808.0.0" }),
    mutate("packaged version build metadata", { packagedVersion: "2.0.0+build" }),
    mutate("installed and packaged major mismatch", { packagedVersion: "3.0.0" }),
    mutate("available version grammar", { availableVersion: "2.1.0-rc.1" }),
    mutate("available version major mismatch", { availableVersion: "3.0.0" }),
    mutate("derived update flag", { updateAvailable: !value.updateAvailable }),
    mutate("rolled-back flag", { rolledBack: !value.rolledBack }),
    mutate("cleanup flag without matching identifier transition", { cleanupPending: !value.cleanupPending }),
    mutate("recovery identifier traversal", { recoveryIdentifier: "../.yarr.update.recovery.Ab12Cd34" }),
    mutate("message class", { message: `${value.message}!` }),
  ];

  if (sibling) {
    mutations.push(mutate("same-operation outcome", { outcome: sibling.value.outcome }));
  }
  if (value.availableVersion === "") {
    mutations.push(mutate("unexpected available version", { availableVersion: "2.0.1" }));
  } else {
    mutations.push(mutate("missing available version", { availableVersion: "" }));
  }
  if (!value.usingOverlay) {
    mutations.push(mutate("packaged selection mismatch", { installedVersion: "2.0.1" }));
  }
  if (value.rollbackAvailable) {
    mutations.push(mutate("rollback without active overlay", { usingOverlay: false }));
  } else if (!value.usingOverlay) {
    mutations.push(mutate("rollback advertised without overlay", { rollbackAvailable: true }));
  }
  if (OVERLAY_TRUE_OUTCOMES.has(value.outcome) || OVERLAY_FALSE_OUTCOMES.has(value.outcome)) {
    mutations.push(mutate("outcome overlay invariant", { usingOverlay: !value.usingOverlay }));
  }
  if (ROLLBACK_TRUE_OUTCOMES.has(value.outcome) || ROLLBACK_FALSE_OUTCOMES.has(value.outcome)) {
    mutations.push(mutate("outcome rollback invariant", { rollbackAvailable: !value.rollbackAvailable }));
  }
  if (CURRENT_OUTCOMES.has(value.outcome)) {
    mutations.push(mutate("current version inequality", { availableVersion: "2.0.1" }));
  }
  if (UPDATE_AHEAD_OUTCOMES.has(value.outcome)) {
    mutations.push(mutate("required update equality", {
      availableVersion: value.installedVersion,
      updateAvailable: true,
    }));
    mutations.push(mutate("required update downgrade", {
      availableVersion: "2.0.0",
      installedVersion: "2.0.1",
      updateAvailable: true,
      usingOverlay: true,
    }));
  }
  if (value.outcome === UpdateOutcome.APPLY_UPDATED) {
    mutations.push(mutate("committed version mismatch", { installedVersion: "2.0.9" }));
  }
  if (value.outcome === UpdateOutcome.RESET_COMPLETED) {
    mutations.push(mutate("reset did not select package", {
      installedVersion: "2.0.1",
      usingOverlay: true,
    }));
  }

  for (const key of Object.keys(value) as (keyof UpdateStatus)[]) {
    mutations.push(mutate(`${key} nullability`, { [key]: null }));
  }
  return mutations;
}

describe("UpdateService", () => {
  it("uses only allowlisted updater JSON commands and validates typed operation results", async () => {
    const { service, run } = harness();

    for (const operation of Object.values(UpdateOperation)) {
      await expect(invoke(service, operation)).resolves.toEqual(DEFAULT_BY_OPERATION.get(operation)?.value);
    }

    expect(run.mock.calls.map(([command, args]) => [command, args])).toEqual([
      [YARR_UPDATE_PATH, ["check", "--json"]],
      [YARR_UPDATE_PATH, ["apply", "--version", "2.1.0", "--json"]],
      [YARR_UPDATE_PATH, ["reset", "--json"]],
      [YARR_UPDATE_PATH, ["rollback", "--json"]],
    ]);
    expect(run.mock.calls.every(([, , options]) => options?.maxOutputBytes === 64 * 1024)).toBe(true);
    expect(run.mock.calls.map(([, , options]) => options?.allowedExitCodes)).toEqual([
      [0, 1], [0, 1], [0, 1], [0, 1],
    ]);
  });

  it.each([
    "2.01.0", "02.1.0", "2.1", "2.1.0-01", "2.1.0-rc.1", "2.1.0+build",
    "2.1.0+", "2.1.0\n--json", "9223372036854775808.0.0",
  ])("rejects invalid or ambiguous Yarr release version input: %s", async (version) => {
    const { service, run } = harness();
    await expect(service.apply(version)).rejects.toThrow("valid bounded Yarr release version");
    expect(run).not.toHaveBeenCalled();
  });

  it.each([
    "not-json",
    JSON.stringify([]),
    JSON.stringify({ ...VALID_CASES[1].value, secret: "private" }),
    JSON.stringify({ ...VALID_CASES[1].value, operation: "STATUS" }),
    JSON.stringify({ ...VALID_CASES[1].value, outcome: "CHECK_PRIVATE" }),
    JSON.stringify({ ...VALID_CASES[1].value, updateAvailable: "yes" }),
    JSON.stringify({ ...VALID_CASES[1].value, installedVersion: "02.0.0" }),
    JSON.stringify({ ...VALID_CASES[1].value, message: "" }),
    JSON.stringify({ ...VALID_CASES[1].value, cleanupPending: "yes" }),
    JSON.stringify({ ...VALID_CASES[1].value, recoveryIdentifier: ".yarr.update.recovery.Ab12Cd34" }),
    `${JSON.stringify(VALID_CASES[1].value)} trailing`,
    "x".repeat(64 * 1024 + 1),
  ])("rejects malformed, unknown, contradictory, or oversized updater output", async (stdout) => {
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

  it.each(VALID_CASES)("accepts the closed matrix row: $name", async ({ operation, exitCode, value }) => {
    await expect(invoke(boundaryHarness(JSON.stringify(value), exitCode), operation)).resolves.toEqual(value);
  });

  it("rejects every impossible state-field and version-relation mutation from every legitimate row", () => {
    let mutationCount = 0;
    for (const candidate of VALID_CASES) {
      expect(validateUpdateProtocolResponse(
        candidate.operation,
        candidate.exitCode,
        JSON.stringify(candidate.value),
      )).toEqual(candidate.value);
      for (const mutation of impossibleTupleMutations(candidate)) {
        mutationCount += 1;
        expect(
          () => validateUpdateProtocolResponse(
            candidate.operation,
            candidate.exitCode,
            JSON.stringify(mutation.value),
          ),
          `${candidate.name}: ${mutation.name}`,
        ).toThrow("invalid update response");
      }
    }
    expect(mutationCount).toBeGreaterThan(700);
  });

  it("rejects the full cross-product of responses from every other operation", async () => {
    for (const requested of Object.values(UpdateOperation)) {
      for (const candidate of VALID_CASES) {
        if (candidate.operation === requested) continue;
        await expect(invoke(
          boundaryHarness(JSON.stringify(candidate.value), candidate.exitCode),
          requested,
        )).rejects.toThrow(`Yarr update ${requested.toLowerCase()} failed`);
        await expect(invoke(
          boundaryHarness(JSON.stringify({ ...candidate.value, operation: requested }), candidate.exitCode),
          requested,
        )).rejects.toThrow(`Yarr update ${requested.toLowerCase()} failed`);
      }
    }
  });

  it("rejects every valid row when its exit code is flipped", async () => {
    for (const candidate of VALID_CASES) {
      const wrongExit = candidate.exitCode === 0 ? 1 : 0;
      await expect(invoke(
        boundaryHarness(JSON.stringify(candidate.value), wrongExit),
        candidate.operation,
      )).rejects.toThrow(`Yarr update ${candidate.operation.toLowerCase()} failed`);
    }
  });

  it.each([
    ["message/outcome mismatch", { ...VALID_CASES[1].value, message: "Yarr is current" }, UpdateOperation.CHECK, 0],
    ["rolled-back contradiction", { ...VALID_CASES[8].value, rolledBack: false }, UpdateOperation.APPLY, 1],
    ["cleanup without identifier", { ...VALID_CASES[7].value, recoveryIdentifier: "" }, UpdateOperation.APPLY, 1],
    ["identifier traversal", { ...VALID_CASES[7].value, recoveryIdentifier: "../.yarr.update.recovery.Ab12Cd34" }, UpdateOperation.APPLY, 1],
    ["identifier prefix mismatch", { ...VALID_CASES[14].value, recoveryIdentifier: ".yarr.update.recovery.Z9y8X7w6" }, UpdateOperation.RESET, 1],
    ["overlay mismatch", { ...VALID_CASES[11].value, usingOverlay: true }, UpdateOperation.RESET, 0],
    ["update-state mismatch", { ...VALID_CASES[1].value, updateAvailable: false }, UpdateOperation.CHECK, 0],
    ["version/message mismatch", { ...VALID_CASES[4].value, availableVersion: "2.2.0" }, UpdateOperation.APPLY, 0],
    ["rollback availability mismatch", { ...VALID_CASES[20].value, rollbackAvailable: true }, UpdateOperation.ROLLBACK, 1],
  ])("rejects invalid matrix tuple: %s", async (_name, value, operation, exitCode) => {
    await expect(invoke(
      boundaryHarness(JSON.stringify(value), exitCode as number),
      operation as UpdateOperation,
    )).rejects.toThrow();
  });

  it("keeps malformed and disallowed real-runner exits as failures", async () => {
    await expect(boundaryHarness("not-json", 1).reset()).rejects.toThrow("invalid update response");
    await expect(
      boundaryHarness(JSON.stringify(VALID_CASES[11].value), 2, "private-output").reset(),
    ).rejects.toThrow("Yarr update reset failed");
  });
});
