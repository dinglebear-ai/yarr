import type { CommandRunner } from "./command-runner";
import { YARR_UPDATE_PATH } from "./paths";

export interface UpdateStatus {
  installedVersion: string;
  packagedVersion: string;
  availableVersion: string;
  updateAvailable: boolean;
  usingOverlay: boolean;
  rolledBack: boolean;
  message: string;
}

export type UpdateResult = UpdateStatus;

const MAX_UPDATE_OUTPUT_BYTES = 64 * 1024;
const CHECK_TIMEOUT_MS = 30_000;
const MUTATION_TIMEOUT_MS = 120_000;
const UPDATE_KEYS = [
  "installedVersion",
  "packagedVersion",
  "availableVersion",
  "updateAvailable",
  "usingOverlay",
  "rolledBack",
  "message",
] as const;

export class UpdateService {
  constructor(private readonly commands: CommandRunner) {}

  async status(): Promise<UpdateStatus> {
    return this.run("check", ["check", "--json"], CHECK_TIMEOUT_MS);
  }

  async apply(version: string): Promise<UpdateResult> {
    if (!isBoundedSemVer(version)) {
      throw new Error("version must be a valid bounded SemVer");
    }
    return this.run("apply", ["apply", "--version", version, "--json"], MUTATION_TIMEOUT_MS);
  }

  async reset(): Promise<UpdateResult> {
    return this.run("reset", ["reset", "--json"], MUTATION_TIMEOUT_MS);
  }

  private async run(
    operation: "check" | "apply" | "reset",
    args: readonly string[],
    timeoutMs: number,
  ): Promise<UpdateStatus> {
    let stdout: string;
    try {
      const result = await this.commands.run(YARR_UPDATE_PATH, args, {
        timeoutMs,
        maxOutputBytes: MAX_UPDATE_OUTPUT_BYTES,
      });
      stdout = result.stdout;
    } catch {
      throw new Error(`Yarr update ${operation} failed`);
    }
    return parseUpdateResponse(stdout);
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
    !isOptionalVersion(candidate.installedVersion) ||
    !isOptionalVersion(candidate.packagedVersion) ||
    !isOptionalVersion(candidate.availableVersion) ||
    typeof candidate.updateAvailable !== "boolean" ||
    typeof candidate.usingOverlay !== "boolean" ||
    typeof candidate.rolledBack !== "boolean" ||
    !isSafeMessage(candidate.message)
  ) {
    invalidResponse();
  }
  return {
    installedVersion: candidate.installedVersion,
    packagedVersion: candidate.packagedVersion,
    availableVersion: candidate.availableVersion,
    updateAvailable: candidate.updateAvailable,
    usingOverlay: candidate.usingOverlay,
    rolledBack: candidate.rolledBack,
    message: candidate.message,
  };
}

function isOptionalVersion(value: unknown): value is string {
  return typeof value === "string" && (value === "" || isBoundedSemVer(value));
}

function isSafeMessage(value: unknown): value is string {
  if (typeof value !== "string" || value.length === 0 || value.length > 256) return false;
  return [
    /^No compatible release is available$/,
    /^Update available: \d+\.\d+\.\d+(?:[-+][0-9A-Za-z.-]+)?$/,
    /^Yarr is current$/,
    /^Yarr updated to \d+\.\d+\.\d+(?:[-+][0-9A-Za-z.-]+)?$/,
    /^Yarr reset to packaged binary$/,
    /^Yarr reset; updater backup cleanup pending$/,
    /^Update failed; previous binary restored$/,
    /^Reset failed; previous binary restored$/,
    /^Yarr updated; obsolete backup cleanup pending$/,
  ].some((pattern) => pattern.test(value));
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
