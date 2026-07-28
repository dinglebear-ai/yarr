import { describe, expect, it } from "vitest";

import { collectSecretValues, redactSecrets } from "./secret-redactor";
import { SECRET_ENVIRONMENT_KEYS, SERVICE_CATALOG } from "./service-catalog";

describe("secret redaction catalog contract", () => {
  it("classifies every accepted catalog credential alias as secret", () => {
    const catalogAliases = SERVICE_CATALOG.flatMap((entry) => [
      ...entry.usernameKeys,
      ...entry.passwordKeys,
      ...entry.apiKeyKeys,
    ]);

    for (const [index, alias] of catalogAliases.entries()) {
      const sentinel = `catalog-secret-${index}`;
      expect(SECRET_ENVIRONMENT_KEYS.has(alias), alias).toBe(true);
      expect(collectSecretValues({ [alias]: sentinel }), alias).toEqual([sentinel]);
      expect(redactSecrets(`before:${sentinel}:after`, [sentinel]), alias).toBe("before::after");
    }
  });

  it("covers every legacy APIKEY spelling and reaches a fixed point", () => {
    const values = Object.fromEntries(
      SERVICE_CATALOG.flatMap((entry, index) =>
        entry.apiKeyKeys.map((key, aliasIndex) => [key, `${entry.id}-${index}-${aliasIndex}-secret`]),
      ),
    );
    const secrets = collectSecretValues(values);
    const once = redactSecrets(JSON.stringify(values), secrets);
    const twice = redactSecrets(once, secrets);

    expect(secrets).toHaveLength(Object.keys(values).length);
    expect(once).not.toContain("secret");
    expect(twice).toBe(once);
  });
});
