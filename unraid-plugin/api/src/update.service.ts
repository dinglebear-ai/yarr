import type { CommandResult, CommandRunner } from "./command-runner";
import { YARR_UPDATE_PATH } from "./paths";

export enum UpdateOperation {
  CHECK = "CHECK",
  APPLY = "APPLY",
  RESET = "RESET",
  ROLLBACK = "ROLLBACK",
}

export enum UpdateOutcome {
  CHECK_NO_COMPATIBLE_RELEASE = "CHECK_NO_COMPATIBLE_RELEASE",
  CHECK_UPDATE_AVAILABLE = "CHECK_UPDATE_AVAILABLE",
  CHECK_CURRENT = "CHECK_CURRENT",
  APPLY_CURRENT = "APPLY_CURRENT",
  APPLY_UPDATED = "APPLY_UPDATED",
  APPLY_FAILED_BEFORE_ACTIVATION = "APPLY_FAILED_BEFORE_ACTIVATION",
  APPLY_RESTORED = "APPLY_RESTORED",
  APPLY_RESTORATION_INCOMPLETE = "APPLY_RESTORATION_INCOMPLETE",
  RESET_COMPLETED = "RESET_COMPLETED",
  RESET_FAILED_BEFORE_MUTATION = "RESET_FAILED_BEFORE_MUTATION",
  RESET_RESTORED = "RESET_RESTORED",
  RESET_RESTORATION_INCOMPLETE = "RESET_RESTORATION_INCOMPLETE",
  ROLLBACK_COMPLETED = "ROLLBACK_COMPLETED",
  ROLLBACK_UNAVAILABLE = "ROLLBACK_UNAVAILABLE",
  ROLLBACK_FAILED_BEFORE_ACTIVATION = "ROLLBACK_FAILED_BEFORE_ACTIVATION",
  ROLLBACK_RESTORED = "ROLLBACK_RESTORED",
  ROLLBACK_RESTORATION_INCOMPLETE = "ROLLBACK_RESTORATION_INCOMPLETE",
}

export interface UpdateStatus {
  operation: UpdateOperation;
  outcome: UpdateOutcome;
  installedVersion: string;
  packagedVersion: string;
  availableVersion: string;
  updateAvailable: boolean;
  usingOverlay: boolean;
  rollbackAvailable: boolean;
  rolledBack: boolean;
  cleanupPending: boolean;
  recoveryIdentifier: string;
  message: string;
}

export type UpdateResult = UpdateStatus;

const MAX_UPDATE_OUTPUT_BYTES = 64 * 1024;
const CHECK_TIMEOUT_MS = 30_000;
const MUTATION_TIMEOUT_MS = 120_000;
const RECOVERY_IDENTIFIER =
  /^\.yarr\.(update|reset|rollback)\.recovery\.[A-Za-z0-9]{8}$/;
const UPDATE_KEYS = [
  "operation",
  "outcome",
  "installedVersion",
  "packagedVersion",
  "availableVersion",
  "updateAvailable",
  "usingOverlay",
  "rollbackAvailable",
  "rolledBack",
  "cleanupPending",
  "recoveryIdentifier",
  "message",
] as const;

export class UpdateService {
  constructor(private readonly commands: CommandRunner) {}

  async status(): Promise<UpdateStatus> {
    return this.run(UpdateOperation.CHECK, ["check", "--json"], CHECK_TIMEOUT_MS);
  }

  async apply(version: string): Promise<UpdateResult> {
    if (!isBoundedSemVer(version)) {
      throw new Error("version must be a valid bounded SemVer");
    }
    return this.run(UpdateOperation.APPLY, ["apply", "--version", version, "--json"], MUTATION_TIMEOUT_MS);
  }

  async reset(): Promise<UpdateResult> {
    return this.run(UpdateOperation.RESET, ["reset", "--json"], MUTATION_TIMEOUT_MS);
  }

  async rollback(): Promise<UpdateResult> {
    return this.run(UpdateOperation.ROLLBACK, ["rollback", "--json"], MUTATION_TIMEOUT_MS);
  }

  private async run(
    operation: UpdateOperation,
    args: readonly string[],
    timeoutMs: number,
  ): Promise<UpdateStatus> {
    let result: CommandResult;
    try {
      result = await this.commands.run(YARR_UPDATE_PATH, args, {
        timeoutMs,
        maxOutputBytes: MAX_UPDATE_OUTPUT_BYTES,
        allowedExitCodes: [0, 1],
      });
    } catch {
      throw new Error(`Yarr update ${operation.toLowerCase()} failed`);
    }
    const parsed = parseUpdateResponse(result.stdout);
    if (!isValidOperationOutcome(operation, result.exitCode, parsed)) {
      throw new Error(`Yarr update ${operation.toLowerCase()} failed`);
    }
    return parsed;
  }
}

function parseUpdateResponse(text: string): UpdateStatus {
  if (Buffer.byteLength(text, "utf8") > MAX_UPDATE_OUTPUT_BYTES) invalidResponse();
  let value: unknown;
  try {
    value = JSON.parse(text);
  } catch {
    invalidResponse();
  }
  if (!isRecord(value) || Object.keys(value).sort().join("\0") !== [...UPDATE_KEYS].sort().join("\0")) {
    invalidResponse();
  }
  const candidate = value as Record<(typeof UPDATE_KEYS)[number], unknown>;
  if (
    !isUpdateOperation(candidate.operation) ||
    !isUpdateOutcome(candidate.outcome) ||
    !isVersion(candidate.installedVersion) ||
    !isVersion(candidate.packagedVersion) ||
    !isOptionalVersion(candidate.availableVersion) ||
    typeof candidate.updateAvailable !== "boolean" ||
    typeof candidate.usingOverlay !== "boolean" ||
    typeof candidate.rollbackAvailable !== "boolean" ||
    typeof candidate.rolledBack !== "boolean" ||
    typeof candidate.cleanupPending !== "boolean" ||
    typeof candidate.recoveryIdentifier !== "string" ||
    !isCleanupState(candidate.cleanupPending, candidate.recoveryIdentifier) ||
    !isBoundedMessage(candidate.message)
  ) {
    invalidResponse();
  }
  return {
    operation: candidate.operation,
    outcome: candidate.outcome,
    installedVersion: candidate.installedVersion,
    packagedVersion: candidate.packagedVersion,
    availableVersion: candidate.availableVersion,
    updateAvailable: candidate.updateAvailable,
    usingOverlay: candidate.usingOverlay,
    rollbackAvailable: candidate.rollbackAvailable,
    rolledBack: candidate.rolledBack,
    cleanupPending: candidate.cleanupPending,
    recoveryIdentifier: candidate.recoveryIdentifier,
    message: candidate.message,
  };
}

function isVersion(value: unknown): value is string {
  return typeof value === "string" && isBoundedSemVer(value);
}

function isOptionalVersion(value: unknown): value is string {
  return typeof value === "string" && (value === "" || isBoundedSemVer(value));
}

function isUpdateOperation(value: unknown): value is UpdateOperation {
  return typeof value === "string" &&
    (Object.values(UpdateOperation) as string[]).includes(value);
}

function isUpdateOutcome(value: unknown): value is UpdateOutcome {
  return typeof value === "string" &&
    (Object.values(UpdateOutcome) as string[]).includes(value);
}

function isBoundedMessage(value: unknown): value is string {
  return typeof value === "string" && value.length > 0 && value.length <= 256;
}

function isCleanupState(cleanupPending: boolean, recoveryIdentifier: string): boolean {
  return cleanupPending
    ? RECOVERY_IDENTIFIER.test(recoveryIdentifier)
    : recoveryIdentifier === "";
}

interface OutcomeRule {
  operation: UpdateOperation;
  outcome: UpdateOutcome;
  exitCode: 0 | 1;
  rolledBack: boolean;
  cleanupPending: boolean;
  usingOverlay?: boolean;
  message: (value: UpdateStatus) => boolean;
  state: (value: UpdateStatus) => boolean;
}

const exactMessage = (expected: string) => (value: UpdateStatus): boolean =>
  value.message === expected;
const versionMessage = (prefix: string) => (value: UpdateStatus): boolean =>
  value.availableVersion !== "" && value.message === `${prefix}${value.availableVersion}`;
const noAvailable = (value: UpdateStatus): boolean =>
  value.availableVersion === "" && !value.updateAvailable;
const updateAvailable = (value: UpdateStatus): boolean =>
  value.availableVersion !== "" && value.updateAvailable;
const current = (value: UpdateStatus): boolean =>
  value.availableVersion !== "" && !value.updateAvailable;
const updated = (value: UpdateStatus): boolean =>
  current(value) && value.installedVersion === value.availableVersion;

const OUTCOME_MATRIX: readonly OutcomeRule[] = [
  { operation: UpdateOperation.CHECK, outcome: UpdateOutcome.CHECK_NO_COMPATIBLE_RELEASE, exitCode: 0, rolledBack: false, cleanupPending: false, message: exactMessage("No compatible release is available"), state: noAvailable },
  { operation: UpdateOperation.CHECK, outcome: UpdateOutcome.CHECK_UPDATE_AVAILABLE, exitCode: 0, rolledBack: false, cleanupPending: false, message: versionMessage("Update available: "), state: updateAvailable },
  { operation: UpdateOperation.CHECK, outcome: UpdateOutcome.CHECK_CURRENT, exitCode: 0, rolledBack: false, cleanupPending: false, message: exactMessage("Yarr is current"), state: current },
  { operation: UpdateOperation.APPLY, outcome: UpdateOutcome.APPLY_CURRENT, exitCode: 0, rolledBack: false, cleanupPending: false, message: exactMessage("Yarr is current"), state: current },
  { operation: UpdateOperation.APPLY, outcome: UpdateOutcome.APPLY_UPDATED, exitCode: 0, rolledBack: false, cleanupPending: false, usingOverlay: true, message: versionMessage("Yarr updated to "), state: updated },
  { operation: UpdateOperation.APPLY, outcome: UpdateOutcome.APPLY_UPDATED, exitCode: 1, rolledBack: false, cleanupPending: true, usingOverlay: true, message: exactMessage("Yarr updated; obsolete backup cleanup pending"), state: updated },
  { operation: UpdateOperation.APPLY, outcome: UpdateOutcome.APPLY_FAILED_BEFORE_ACTIVATION, exitCode: 1, rolledBack: false, cleanupPending: false, message: exactMessage("Update failed before activation"), state: updateAvailable },
  { operation: UpdateOperation.APPLY, outcome: UpdateOutcome.APPLY_FAILED_BEFORE_ACTIVATION, exitCode: 1, rolledBack: false, cleanupPending: true, message: exactMessage("Update failed before activation"), state: updateAvailable },
  { operation: UpdateOperation.APPLY, outcome: UpdateOutcome.APPLY_RESTORED, exitCode: 1, rolledBack: true, cleanupPending: false, message: exactMessage("Update failed; previous binary restored"), state: updateAvailable },
  { operation: UpdateOperation.APPLY, outcome: UpdateOutcome.APPLY_RESTORED, exitCode: 1, rolledBack: true, cleanupPending: true, message: exactMessage("Update failed; previous binary restored"), state: updateAvailable },
  { operation: UpdateOperation.APPLY, outcome: UpdateOutcome.APPLY_RESTORATION_INCOMPLETE, exitCode: 1, rolledBack: false, cleanupPending: false, message: exactMessage("Update failed; restoration incomplete; recovery snapshots retained"), state: (value) => value.availableVersion !== "" },
  { operation: UpdateOperation.RESET, outcome: UpdateOutcome.RESET_COMPLETED, exitCode: 0, rolledBack: false, cleanupPending: false, usingOverlay: false, message: exactMessage("Yarr reset to packaged binary"), state: noAvailable },
  { operation: UpdateOperation.RESET, outcome: UpdateOutcome.RESET_COMPLETED, exitCode: 1, rolledBack: false, cleanupPending: true, usingOverlay: false, message: exactMessage("Yarr reset; updater backup cleanup pending"), state: noAvailable },
  { operation: UpdateOperation.RESET, outcome: UpdateOutcome.RESET_FAILED_BEFORE_MUTATION, exitCode: 1, rolledBack: false, cleanupPending: false, message: exactMessage("Reset failed before mutation"), state: noAvailable },
  { operation: UpdateOperation.RESET, outcome: UpdateOutcome.RESET_FAILED_BEFORE_MUTATION, exitCode: 1, rolledBack: false, cleanupPending: true, message: exactMessage("Reset failed before mutation"), state: noAvailable },
  { operation: UpdateOperation.RESET, outcome: UpdateOutcome.RESET_RESTORED, exitCode: 1, rolledBack: true, cleanupPending: false, message: exactMessage("Reset failed; previous binary restored"), state: noAvailable },
  { operation: UpdateOperation.RESET, outcome: UpdateOutcome.RESET_RESTORED, exitCode: 1, rolledBack: true, cleanupPending: true, message: exactMessage("Reset failed; previous binary restored"), state: noAvailable },
  { operation: UpdateOperation.RESET, outcome: UpdateOutcome.RESET_RESTORATION_INCOMPLETE, exitCode: 1, rolledBack: false, cleanupPending: false, message: exactMessage("Reset failed; restoration incomplete; recovery snapshots retained"), state: noAvailable },
  { operation: UpdateOperation.ROLLBACK, outcome: UpdateOutcome.ROLLBACK_COMPLETED, exitCode: 0, rolledBack: false, cleanupPending: false, usingOverlay: true, message: exactMessage("Yarr rolled back to previous binary"), state: noAvailable },
  { operation: UpdateOperation.ROLLBACK, outcome: UpdateOutcome.ROLLBACK_COMPLETED, exitCode: 1, rolledBack: false, cleanupPending: true, usingOverlay: true, message: exactMessage("Yarr rolled back; recovery snapshot cleanup pending"), state: noAvailable },
  { operation: UpdateOperation.ROLLBACK, outcome: UpdateOutcome.ROLLBACK_UNAVAILABLE, exitCode: 1, rolledBack: false, cleanupPending: false, message: exactMessage("Manual rollback is unavailable; no previous binary exists"), state: (value) => noAvailable(value) && !value.rollbackAvailable },
  { operation: UpdateOperation.ROLLBACK, outcome: UpdateOutcome.ROLLBACK_FAILED_BEFORE_ACTIVATION, exitCode: 1, rolledBack: false, cleanupPending: false, usingOverlay: true, message: exactMessage("Rollback failed before activation"), state: (value) => noAvailable(value) && value.rollbackAvailable },
  { operation: UpdateOperation.ROLLBACK, outcome: UpdateOutcome.ROLLBACK_FAILED_BEFORE_ACTIVATION, exitCode: 1, rolledBack: false, cleanupPending: true, usingOverlay: true, message: exactMessage("Rollback failed before activation"), state: (value) => noAvailable(value) && value.rollbackAvailable },
  { operation: UpdateOperation.ROLLBACK, outcome: UpdateOutcome.ROLLBACK_RESTORED, exitCode: 1, rolledBack: true, cleanupPending: false, usingOverlay: true, message: exactMessage("Rollback failed; current binary restored"), state: (value) => noAvailable(value) && value.rollbackAvailable },
  { operation: UpdateOperation.ROLLBACK, outcome: UpdateOutcome.ROLLBACK_RESTORED, exitCode: 1, rolledBack: true, cleanupPending: true, usingOverlay: true, message: exactMessage("Rollback failed; current binary restored"), state: (value) => noAvailable(value) && value.rollbackAvailable },
  { operation: UpdateOperation.ROLLBACK, outcome: UpdateOutcome.ROLLBACK_RESTORATION_INCOMPLETE, exitCode: 1, rolledBack: false, cleanupPending: false, message: exactMessage("Rollback failed; restoration incomplete; recovery snapshots retained"), state: noAvailable },
];

function isValidOperationOutcome(
  requestedOperation: UpdateOperation,
  exitCode: number,
  value: UpdateStatus,
): boolean {
  if (value.operation !== requestedOperation || !cleanupMatchesOperation(value)) return false;
  const rule = OUTCOME_MATRIX.find((candidate) =>
    candidate.operation === value.operation &&
    candidate.outcome === value.outcome &&
    candidate.exitCode === exitCode &&
    candidate.rolledBack === value.rolledBack &&
    candidate.cleanupPending === value.cleanupPending &&
    (candidate.usingOverlay === undefined || candidate.usingOverlay === value.usingOverlay),
  );
  return rule !== undefined && rule.message(value) && rule.state(value);
}

function cleanupMatchesOperation(value: UpdateStatus): boolean {
  if (!value.cleanupPending) return value.recoveryIdentifier === "";
  const label = value.operation === UpdateOperation.APPLY
    ? "update"
    : value.operation.toLowerCase();
  return value.operation !== UpdateOperation.CHECK &&
    new RegExp(`^\\.yarr\\.${label}\\.recovery\\.[A-Za-z0-9]{8}$`).test(value.recoveryIdentifier);
}

function isBoundedSemVer(value: string): boolean {
  if (value.length === 0 || value.length > 128) return false;
  const match = /^(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)(?:-([0-9A-Za-z.-]+))?(?:\+([0-9A-Za-z.-]+))?$/.exec(value);
  if (!match || match.slice(1, 4).some((part) => part.length > 10)) return false;
  return validIdentifiers(match[4], true) && validIdentifiers(match[5], false);
}

function validIdentifiers(value: string | undefined, rejectNumericLeadingZero: boolean): boolean {
  if (value === undefined) return true;
  return value.split(".").every((identifier) =>
    identifier.length > 0 &&
    identifier.length <= 32 &&
    /^[0-9A-Za-z-]+$/.test(identifier) &&
    (!rejectNumericLeadingZero || !/^0[0-9]+$/.test(identifier)),
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function invalidResponse(): never {
  throw new Error("invalid update response");
}
