import { readFile } from "node:fs/promises";

import { parseYarrEnvironment } from "./config-codec";
import { YARR_ENVIRONMENT_PATH } from "./paths";

export interface SecretProvider {
  currentSecrets(): Promise<readonly string[]>;
}

export interface SecretRedactor {
  redactMany(values: readonly string[]): Promise<string[]>;
}

export class StoredSecretProvider implements SecretProvider {
  async currentSecrets(): Promise<readonly string[]> {
    const environment = parseYarrEnvironment(await readFile(YARR_ENVIRONMENT_PATH, "utf8"));
    return collectSecretValues(environment.values);
  }
}

export class StoredSecretRedactor implements SecretRedactor {
  constructor(private readonly provider: SecretProvider = new StoredSecretProvider()) {}

  async redactMany(values: readonly string[]): Promise<string[]> {
    const secrets = await this.provider.currentSecrets();
    return values.map((value) => redactSecrets(value, secrets));
  }
}

export function redactSecrets(message: string, secrets: readonly string[]): string {
  const unique = [...new Set(secrets.filter((secret) => secret.length > 0))].sort(
    (left, right) => right.length - left.length || left.localeCompare(right),
  );
  return unique.reduce((redacted, secret) => redacted.replaceAll(secret, "[REDACTED]"), message);
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
