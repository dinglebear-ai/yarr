import { readFile } from "node:fs/promises";

import { parseYarrEnvironment } from "./config-codec";
import { YARR_ENVIRONMENT_GOOD_PATH, YARR_ENVIRONMENT_PATH } from "./paths";

export interface SecretFileSystem {
  readFile(path: string): Promise<string>;
}

export interface SecretProvider {
  currentSecrets(): Promise<readonly string[]>;
}

export interface SecretRedactor {
  snapshot(): Promise<RedactionSnapshot>;
}

export interface RedactionSnapshot {
  redactMany(values: readonly string[]): string[];
}

export class StoredSecretProvider implements SecretProvider {
  constructor(
    private readonly files: SecretFileSystem = {
      readFile: async (path) => readFile(path, "utf8"),
    },
  ) {}

  async currentSecrets(): Promise<readonly string[]> {
    const current = parseYarrEnvironment(await this.files.readFile(YARR_ENVIRONMENT_PATH));
    const knownGoodText = await this.readKnownGood();
    const knownGood = knownGoodText === null ? null : parseYarrEnvironment(knownGoodText);
    return [...new Set([
      ...collectSecretValues(current.values),
      ...(knownGood === null ? [] : collectSecretValues(knownGood.values)),
    ])];
  }

  private async readKnownGood(): Promise<string | null> {
    try {
      return await this.files.readFile(YARR_ENVIRONMENT_GOOD_PATH);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") return null;
      throw error;
    }
  }
}

export class StoredSecretRedactor implements SecretRedactor {
  constructor(private readonly provider: SecretProvider = new StoredSecretProvider()) {}

  async snapshot(): Promise<RedactionSnapshot> {
    const secrets = await this.provider.currentSecrets();
    return {
      redactMany: (values) => values.map((value) => redactSecrets(value, secrets)),
    };
  }
}

export function redactSecrets(message: string, secrets: readonly string[]): string {
  const unique = [...new Set(secrets.filter((secret) => secret.length > 0))].sort(
    (left, right) => right.length - left.length || left.localeCompare(right),
  );
  let redacted = message;
  let remainingReductionBudget = message.length;

  while (true) {
    const next = unique.reduce(
      (candidate, secret) => candidate.replaceAll(secret, ""),
      redacted,
    );
    if (next === redacted) return redacted;

    const reduction = redacted.length - next.length;
    if (reduction <= 0 || reduction > remainingReductionBudget) {
      throw new Error("secret redaction failed to make bounded progress");
    }
    remainingReductionBudget -= reduction;
    redacted = next;
  }
}

export function collectSecretValues(values: Record<string, string>): string[] {
  return [...new Set(
    Object.entries(values)
      .filter(([key, value]) =>
        value.length > 0 && /(?:TOKEN|SECRET|PASSWORD|API_KEY|PRIVATE_KEY)$/.test(key),
      )
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([, value]) => value),
  )];
}
