"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateService = exports.UpdateOutcome = exports.UpdateOperation = void 0;
exports.validateUpdateProtocolResponse = validateUpdateProtocolResponse;
const paths_1 = require("./paths");
var UpdateOperation;
(function (UpdateOperation) {
    UpdateOperation["CHECK"] = "CHECK";
    UpdateOperation["APPLY"] = "APPLY";
    UpdateOperation["RESET"] = "RESET";
    UpdateOperation["ROLLBACK"] = "ROLLBACK";
})(UpdateOperation || (exports.UpdateOperation = UpdateOperation = {}));
var UpdateOutcome;
(function (UpdateOutcome) {
    UpdateOutcome["CHECK_NO_COMPATIBLE_RELEASE"] = "CHECK_NO_COMPATIBLE_RELEASE";
    UpdateOutcome["CHECK_UPDATE_AVAILABLE"] = "CHECK_UPDATE_AVAILABLE";
    UpdateOutcome["CHECK_CURRENT"] = "CHECK_CURRENT";
    UpdateOutcome["APPLY_CURRENT"] = "APPLY_CURRENT";
    UpdateOutcome["APPLY_UPDATED"] = "APPLY_UPDATED";
    UpdateOutcome["APPLY_FAILED_BEFORE_ACTIVATION"] = "APPLY_FAILED_BEFORE_ACTIVATION";
    UpdateOutcome["APPLY_RESTORED"] = "APPLY_RESTORED";
    UpdateOutcome["APPLY_RESTORATION_INCOMPLETE"] = "APPLY_RESTORATION_INCOMPLETE";
    UpdateOutcome["RESET_COMPLETED"] = "RESET_COMPLETED";
    UpdateOutcome["RESET_FAILED_BEFORE_MUTATION"] = "RESET_FAILED_BEFORE_MUTATION";
    UpdateOutcome["RESET_RESTORED"] = "RESET_RESTORED";
    UpdateOutcome["RESET_RESTORATION_INCOMPLETE"] = "RESET_RESTORATION_INCOMPLETE";
    UpdateOutcome["ROLLBACK_COMPLETED"] = "ROLLBACK_COMPLETED";
    UpdateOutcome["ROLLBACK_UNAVAILABLE"] = "ROLLBACK_UNAVAILABLE";
    UpdateOutcome["ROLLBACK_FAILED_BEFORE_ACTIVATION"] = "ROLLBACK_FAILED_BEFORE_ACTIVATION";
    UpdateOutcome["ROLLBACK_RESTORED"] = "ROLLBACK_RESTORED";
    UpdateOutcome["ROLLBACK_RESTORATION_INCOMPLETE"] = "ROLLBACK_RESTORATION_INCOMPLETE";
})(UpdateOutcome || (exports.UpdateOutcome = UpdateOutcome = {}));
const MAX_UPDATE_OUTPUT_BYTES = 64 * 1024;
const CHECK_TIMEOUT_MS = 30_000;
const MUTATION_TIMEOUT_MS = 120_000;
const RECOVERY_IDENTIFIER = /^\.yarr\.(update|reset|rollback)\.recovery\.[A-Za-z0-9]{8}$/;
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
];
class UpdateService {
    commands;
    constructor(commands) {
        this.commands = commands;
    }
    async status() {
        return this.run(UpdateOperation.CHECK, ["check", "--json"], CHECK_TIMEOUT_MS);
    }
    async apply(version) {
        if (!isYarrReleaseVersion(version)) {
            throw new Error("version must be a valid bounded Yarr release version");
        }
        return this.run(UpdateOperation.APPLY, ["apply", "--version", version, "--json"], MUTATION_TIMEOUT_MS);
    }
    async reset() {
        return this.run(UpdateOperation.RESET, ["reset", "--json"], MUTATION_TIMEOUT_MS);
    }
    async rollback() {
        return this.run(UpdateOperation.ROLLBACK, ["rollback", "--json"], MUTATION_TIMEOUT_MS);
    }
    async run(operation, args, timeoutMs) {
        let result;
        try {
            result = await this.commands.run(paths_1.YARR_UPDATE_PATH, args, {
                timeoutMs,
                maxOutputBytes: MAX_UPDATE_OUTPUT_BYTES,
                allowedExitCodes: [0, 1],
            });
        }
        catch {
            throw new Error(`Yarr update ${operation.toLowerCase()} failed`);
        }
        const parsed = parseUpdateResponse(result.stdout);
        if (!isValidOperationOutcome(operation, result.exitCode, parsed)) {
            throw new Error(`Yarr update ${operation.toLowerCase()} failed`);
        }
        return parsed;
    }
}
exports.UpdateService = UpdateService;
function parseUpdateResponse(text) {
    if (Buffer.byteLength(text, "utf8") > MAX_UPDATE_OUTPUT_BYTES)
        invalidResponse();
    let value;
    try {
        value = JSON.parse(text);
    }
    catch {
        invalidResponse();
    }
    if (!isRecord(value) || Object.keys(value).sort().join("\0") !== [...UPDATE_KEYS].sort().join("\0")) {
        invalidResponse();
    }
    const candidate = value;
    if (!isUpdateOperation(candidate.operation) ||
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
        !isBoundedMessage(candidate.message)) {
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
function isVersion(value) {
    return typeof value === "string" && isYarrReleaseVersion(value);
}
function isOptionalVersion(value) {
    return typeof value === "string" && (value === "" || isYarrReleaseVersion(value));
}
function isUpdateOperation(value) {
    return typeof value === "string" &&
        Object.values(UpdateOperation).includes(value);
}
function isUpdateOutcome(value) {
    return typeof value === "string" &&
        Object.values(UpdateOutcome).includes(value);
}
function isBoundedMessage(value) {
    return typeof value === "string" && value.length > 0 && value.length <= 256;
}
function isCleanupState(cleanupPending, recoveryIdentifier) {
    return cleanupPending
        ? RECOVERY_IDENTIFIER.test(recoveryIdentifier)
        : recoveryIdentifier === "";
}
const exactMessage = (expected) => (value) => value.message === expected;
const versionMessage = (prefix) => (value) => value.availableVersion !== "" && value.message === `${prefix}${value.availableVersion}`;
const noAvailable = (value) => value.availableVersion === "" && !value.updateAvailable;
const updateAvailable = (value) => value.availableVersion !== "" &&
    value.updateAvailable &&
    compareYarrReleaseVersions(value.availableVersion, value.installedVersion) === 1;
const current = (value) => value.availableVersion !== "" &&
    !value.updateAvailable &&
    compareYarrReleaseVersions(value.availableVersion, value.installedVersion) === 0;
const updated = (value) => current(value) &&
    value.installedVersion === value.availableVersion &&
    value.usingOverlay;
const applyRestorationIncomplete = (value) => value.availableVersion !== "";
const resetCompleted = (value) => noAvailable(value) &&
    value.installedVersion === value.packagedVersion &&
    !value.usingOverlay &&
    !value.rollbackAvailable;
const rollbackCompleted = (value) => noAvailable(value) &&
    value.usingOverlay &&
    value.rollbackAvailable;
const rollbackUnavailable = (value) => noAvailable(value) && !value.rollbackAvailable;
const rollbackPrepared = (value) => noAvailable(value) &&
    value.usingOverlay &&
    value.rollbackAvailable;
const OUTCOME_MATRIX = [
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
    { operation: UpdateOperation.APPLY, outcome: UpdateOutcome.APPLY_RESTORATION_INCOMPLETE, exitCode: 1, rolledBack: false, cleanupPending: false, message: exactMessage("Update failed; restoration incomplete; recovery snapshots retained"), state: applyRestorationIncomplete },
    { operation: UpdateOperation.RESET, outcome: UpdateOutcome.RESET_COMPLETED, exitCode: 0, rolledBack: false, cleanupPending: false, usingOverlay: false, message: exactMessage("Yarr reset to packaged binary"), state: resetCompleted },
    { operation: UpdateOperation.RESET, outcome: UpdateOutcome.RESET_COMPLETED, exitCode: 1, rolledBack: false, cleanupPending: true, usingOverlay: false, message: exactMessage("Yarr reset; updater backup cleanup pending"), state: resetCompleted },
    { operation: UpdateOperation.RESET, outcome: UpdateOutcome.RESET_FAILED_BEFORE_MUTATION, exitCode: 1, rolledBack: false, cleanupPending: false, message: exactMessage("Reset failed before mutation"), state: noAvailable },
    { operation: UpdateOperation.RESET, outcome: UpdateOutcome.RESET_FAILED_BEFORE_MUTATION, exitCode: 1, rolledBack: false, cleanupPending: true, message: exactMessage("Reset failed before mutation"), state: noAvailable },
    { operation: UpdateOperation.RESET, outcome: UpdateOutcome.RESET_RESTORED, exitCode: 1, rolledBack: true, cleanupPending: false, message: exactMessage("Reset failed; previous binary restored"), state: noAvailable },
    { operation: UpdateOperation.RESET, outcome: UpdateOutcome.RESET_RESTORED, exitCode: 1, rolledBack: true, cleanupPending: true, message: exactMessage("Reset failed; previous binary restored"), state: noAvailable },
    { operation: UpdateOperation.RESET, outcome: UpdateOutcome.RESET_RESTORATION_INCOMPLETE, exitCode: 1, rolledBack: false, cleanupPending: false, message: exactMessage("Reset failed; restoration incomplete; recovery snapshots retained"), state: noAvailable },
    { operation: UpdateOperation.ROLLBACK, outcome: UpdateOutcome.ROLLBACK_COMPLETED, exitCode: 0, rolledBack: false, cleanupPending: false, usingOverlay: true, message: exactMessage("Yarr rolled back to previous binary"), state: rollbackCompleted },
    { operation: UpdateOperation.ROLLBACK, outcome: UpdateOutcome.ROLLBACK_COMPLETED, exitCode: 1, rolledBack: false, cleanupPending: true, usingOverlay: true, message: exactMessage("Yarr rolled back; recovery snapshot cleanup pending"), state: rollbackCompleted },
    { operation: UpdateOperation.ROLLBACK, outcome: UpdateOutcome.ROLLBACK_UNAVAILABLE, exitCode: 1, rolledBack: false, cleanupPending: false, message: exactMessage("Manual rollback is unavailable; no previous binary exists"), state: rollbackUnavailable },
    { operation: UpdateOperation.ROLLBACK, outcome: UpdateOutcome.ROLLBACK_FAILED_BEFORE_ACTIVATION, exitCode: 1, rolledBack: false, cleanupPending: false, usingOverlay: true, message: exactMessage("Rollback failed before activation"), state: rollbackPrepared },
    { operation: UpdateOperation.ROLLBACK, outcome: UpdateOutcome.ROLLBACK_FAILED_BEFORE_ACTIVATION, exitCode: 1, rolledBack: false, cleanupPending: true, usingOverlay: true, message: exactMessage("Rollback failed before activation"), state: rollbackPrepared },
    { operation: UpdateOperation.ROLLBACK, outcome: UpdateOutcome.ROLLBACK_RESTORED, exitCode: 1, rolledBack: true, cleanupPending: false, usingOverlay: true, message: exactMessage("Rollback failed; current binary restored"), state: rollbackPrepared },
    { operation: UpdateOperation.ROLLBACK, outcome: UpdateOutcome.ROLLBACK_RESTORED, exitCode: 1, rolledBack: true, cleanupPending: true, usingOverlay: true, message: exactMessage("Rollback failed; current binary restored"), state: rollbackPrepared },
    { operation: UpdateOperation.ROLLBACK, outcome: UpdateOutcome.ROLLBACK_RESTORATION_INCOMPLETE, exitCode: 1, rolledBack: false, cleanupPending: false, message: exactMessage("Rollback failed; restoration incomplete; recovery snapshots retained"), state: noAvailable },
];
function isValidOperationOutcome(requestedOperation, exitCode, value) {
    if (value.operation !== requestedOperation ||
        !cleanupMatchesOperation(value) ||
        !hasValidDerivedState(value)) {
        return false;
    }
    const rule = OUTCOME_MATRIX.find((candidate) => candidate.operation === value.operation &&
        candidate.outcome === value.outcome &&
        candidate.exitCode === exitCode &&
        candidate.rolledBack === value.rolledBack &&
        candidate.cleanupPending === value.cleanupPending &&
        (candidate.usingOverlay === undefined || candidate.usingOverlay === value.usingOverlay));
    return rule !== undefined && rule.message(value) && rule.state(value);
}
function validateUpdateProtocolResponse(requestedOperation, exitCode, text) {
    const parsed = parseUpdateResponse(text);
    if (!isValidOperationOutcome(requestedOperation, exitCode, parsed)) {
        invalidResponse();
    }
    return parsed;
}
function cleanupMatchesOperation(value) {
    if (!value.cleanupPending)
        return value.recoveryIdentifier === "";
    const label = value.operation === UpdateOperation.APPLY
        ? "update"
        : value.operation.toLowerCase();
    return value.operation !== UpdateOperation.CHECK &&
        new RegExp(`^\\.yarr\\.${label}\\.recovery\\.[A-Za-z0-9]{8}$`).test(value.recoveryIdentifier);
}
const MAX_SHELL_VERSION_COMPONENT = 9223372036854775807n;
function parseYarrReleaseVersion(value) {
    if (value.length === 0 || value.length > 128)
        return undefined;
    const match = /^(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)$/.exec(value);
    if (!match)
        return undefined;
    const parts = [BigInt(match[1]), BigInt(match[2]), BigInt(match[3])];
    return parts.every((part) => part <= MAX_SHELL_VERSION_COMPONENT)
        ? parts
        : undefined;
}
function isYarrReleaseVersion(value) {
    return parseYarrReleaseVersion(value) !== undefined;
}
function compareYarrReleaseVersions(left, right) {
    const leftParts = parseYarrReleaseVersion(left);
    const rightParts = parseYarrReleaseVersion(right);
    if (!leftParts || !rightParts)
        return undefined;
    for (let index = 0; index < leftParts.length; index += 1) {
        if (leftParts[index] < rightParts[index])
            return -1;
        if (leftParts[index] > rightParts[index])
            return 1;
    }
    return 0;
}
function hasValidDerivedState(value) {
    const installed = parseYarrReleaseVersion(value.installedVersion);
    const packaged = parseYarrReleaseVersion(value.packagedVersion);
    if (!installed || !packaged || installed[0] !== packaged[0])
        return false;
    if (!value.usingOverlay && value.installedVersion !== value.packagedVersion)
        return false;
    if (value.rollbackAvailable && !value.usingOverlay)
        return false;
    if (value.availableVersion === "") {
        return !value.updateAvailable;
    }
    const available = parseYarrReleaseVersion(value.availableVersion);
    if (!available || available[0] !== packaged[0])
        return false;
    const comparison = compareYarrReleaseVersions(value.availableVersion, value.installedVersion);
    return comparison !== undefined && value.updateAvailable === (comparison === 1);
}
function isRecord(value) {
    return value !== null && typeof value === "object" && !Array.isArray(value);
}
function invalidResponse() {
    throw new Error("invalid update response");
}
