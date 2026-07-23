"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateService = void 0;
const paths_1 = require("./paths");
const MAX_UPDATE_OUTPUT_BYTES = 64 * 1024;
const CHECK_TIMEOUT_MS = 30_000;
const MUTATION_TIMEOUT_MS = 120_000;
const UPDATE_KEYS = [
    "installedVersion",
    "packagedVersion",
    "availableVersion",
    "updateAvailable",
    "usingOverlay",
    "rollbackAvailable",
    "rolledBack",
    "message",
];
class UpdateService {
    commands;
    constructor(commands) {
        this.commands = commands;
    }
    async status() {
        return this.run("check", ["check", "--json"], CHECK_TIMEOUT_MS);
    }
    async apply(version) {
        if (!isBoundedSemVer(version)) {
            throw new Error("version must be a valid bounded SemVer");
        }
        return this.run("apply", ["apply", "--version", version, "--json"], MUTATION_TIMEOUT_MS);
    }
    async reset() {
        return this.run("reset", ["reset", "--json"], MUTATION_TIMEOUT_MS);
    }
    async rollback() {
        return this.run("rollback", ["rollback", "--json"], MUTATION_TIMEOUT_MS);
    }
    async run(operation, args, timeoutMs) {
        let result;
        try {
            result = await this.commands.run(paths_1.YARR_UPDATE_PATH, args, {
                timeoutMs,
                maxOutputBytes: MAX_UPDATE_OUTPUT_BYTES,
                allowedExitCodes: operation === "check" ? [0] : [0, 1],
            });
        }
        catch {
            throw new Error(`Yarr update ${operation} failed`);
        }
        const parsed = parseUpdateResponse(result.stdout);
        if (result.exitCode !== 0 && !isExpectedNonzeroOutcome(operation, parsed)) {
            throw new Error(`Yarr update ${operation} failed`);
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
    if (!isOptionalVersion(candidate.installedVersion) ||
        !isOptionalVersion(candidate.packagedVersion) ||
        !isOptionalVersion(candidate.availableVersion) ||
        typeof candidate.updateAvailable !== "boolean" ||
        typeof candidate.usingOverlay !== "boolean" ||
        typeof candidate.rollbackAvailable !== "boolean" ||
        typeof candidate.rolledBack !== "boolean" ||
        !isSafeMessage(candidate.message)) {
        invalidResponse();
    }
    return {
        installedVersion: candidate.installedVersion,
        packagedVersion: candidate.packagedVersion,
        availableVersion: candidate.availableVersion,
        updateAvailable: candidate.updateAvailable,
        usingOverlay: candidate.usingOverlay,
        rollbackAvailable: candidate.rollbackAvailable,
        rolledBack: candidate.rolledBack,
        message: candidate.message,
    };
}
function isOptionalVersion(value) {
    return typeof value === "string" && (value === "" || isBoundedSemVer(value));
}
function isSafeMessage(value) {
    if (typeof value !== "string" || value.length === 0 || value.length > 256)
        return false;
    return [
        /^No compatible release is available$/,
        /^Update available: \d+\.\d+\.\d+(?:[-+][0-9A-Za-z.-]+)?$/,
        /^Yarr is current$/,
        /^Yarr updated to \d+\.\d+\.\d+(?:[-+][0-9A-Za-z.-]+)?$/,
        /^Yarr reset to packaged binary$/,
        /^Yarr rolled back to previous binary$/,
        /^Yarr reset; updater backup cleanup pending$/,
        /^Update failed; previous binary restored$/,
        /^Reset failed; previous binary restored$/,
        /^Rollback failed; current binary restored$/,
        /^Rollback failed; restoration incomplete; recovery snapshots retained$/,
        /^Manual rollback is unavailable; no previous binary exists$/,
        /^Yarr rolled back; recovery snapshot cleanup pending$/,
        /^Yarr updated; obsolete backup cleanup pending$/,
    ].some((pattern) => pattern.test(value));
}
function isExpectedNonzeroOutcome(operation, value) {
    if (operation === "apply") {
        return value.message === "Update failed; previous binary restored"
            ? value.rolledBack
            : value.message === "Yarr updated; obsolete backup cleanup pending" && !value.rolledBack;
    }
    if (operation === "reset") {
        return value.message === "Reset failed; previous binary restored"
            ? value.rolledBack
            : value.message === "Yarr reset; updater backup cleanup pending" && !value.rolledBack;
    }
    if (operation === "rollback") {
        if (value.message === "Rollback failed; current binary restored")
            return value.rolledBack;
        if (value.message === "Rollback failed; restoration incomplete; recovery snapshots retained") {
            return !value.rolledBack;
        }
        if (value.message === "Yarr rolled back; recovery snapshot cleanup pending") {
            return !value.rolledBack;
        }
        return value.message === "Manual rollback is unavailable; no previous binary exists" &&
            !value.rolledBack &&
            !value.rollbackAvailable;
    }
    return false;
}
function isBoundedSemVer(value) {
    if (value.length === 0 || value.length > 128)
        return false;
    const match = /^(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)(?:-([0-9A-Za-z.-]+))?(?:\+([0-9A-Za-z.-]+))?$/.exec(value);
    if (!match || match.slice(1, 4).some((part) => part.length > 10))
        return false;
    return validIdentifiers(match[4], true) && validIdentifiers(match[5], false);
}
function validIdentifiers(value, rejectNumericLeadingZero) {
    if (value === undefined)
        return true;
    return value.split(".").every((identifier) => identifier.length > 0 &&
        identifier.length <= 32 &&
        /^[0-9A-Za-z-]+$/.test(identifier) &&
        (!rejectNumericLeadingZero || !/^0[0-9]+$/.test(identifier)));
}
function isRecord(value) {
    return value !== null && typeof value === "object" && !Array.isArray(value);
}
function invalidResponse() {
    throw new Error("invalid update response");
}
