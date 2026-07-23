import { describe, expect, it, vi } from "vitest";

import type { SaveYarrConfigInput } from "./config.types";
import * as codec from "./config-codec";
import { ImportService } from "./import.service";
import { collectSecretValues } from "./secret-redactor";

function configHarness() {
  const inputs: SaveYarrConfigInput[] = [];
  return {
    inputs,
    config: {
      save: vi.fn(async (input: SaveYarrConfigInput) => {
        inputs.push(input);
        return {
          config: { plugin: {} as never, services: [] },
          changed: true,
          restarted: true,
          rolledBack: false,
        };
      }),
    },
  };
}

describe("ImportService", () => {
  it("normalizes known aliases and reports unknown keys without returning secrets", async () => {
    const { config } = configHarness();
    const service = new ImportService(config);

    const preview = await service.preview({
      "sonarr-url": "http://sonarr.internal:8989/",
      YARR_SONARR_API_KEY: "sonarr-private",
      QBITTORRENT_USERNAME: "jacob",
      YARR_QBITTORRENT_PASSWORD: "qbit-private",
      UNKNOWN_SETTING: "unknown-private",
    });

    expect(preview.mappings).toEqual([
      {
        serviceId: "sonarr",
        baseUrl: "http://sonarr.internal:8989",
        hasUsername: false,
        hasPassword: false,
        hasApiKey: true,
      },
      {
        serviceId: "qbittorrent",
        baseUrl: null,
        hasUsername: true,
        hasPassword: true,
        hasApiKey: false,
      },
    ]);
    expect(preview.warnings).toContain("Unknown structured key UNKNOWN_SETTING");
    expect(JSON.stringify(preview)).not.toMatch(/sonarr-private|qbit-private|unknown-private|jacob/);
    expect(preview.previewId).toMatch(/^[A-Za-z0-9_-]{32,}$/);
  });

  it("rejects non-http URLs and URLs containing credentials", async () => {
    const { config } = configHarness();
    const service = new ImportService(config);

    const preview = await service.preview({
      SONARR_URL: "ftp://sonarr.internal",
      RADARR_URL: "http://admin:private@radarr.internal:7878",
    });

    expect(preview.mappings).toEqual([]);
    expect(preview.warnings).toEqual([
      "SONARR_URL must be an http or https URL without embedded credentials",
      "RADARR_URL must be an http or https URL without embedded credentials",
    ]);
    expect(JSON.stringify(preview)).not.toContain("private");
  });

  it("preserves credentials unless consent explicitly authorizes them", async () => {
    const { config, inputs } = configHarness();
    const service = new ImportService(config);
    const preview = await service.preview({
      SONARR_URL: "https://sonarr.example.test/",
      SONARR_API_KEY: "new-private",
    });

    await service.apply({
      previewId: preview.previewId,
      selectedServiceIds: ["sonarr"],
      credentialConsent: { sonarr: false },
    });

    expect(inputs).toEqual([
      {
        services: [
          {
            service: "sonarr",
            enabled: true,
            baseUrl: "https://sonarr.example.test",
            username: undefined,
            password: { kind: "preserve" },
            apiKey: { kind: "preserve" },
          },
        ],
      },
    ]);
    expect(JSON.stringify(inputs)).not.toContain("new-private");
  });

  it("imports credentials only for selected services with explicit consent", async () => {
    const { config, inputs } = configHarness();
    const service = new ImportService(config);
    const preview = await service.preview({
      SONARR_URL: "http://sonarr:8989",
      SONARR_API_KEY: "sonarr-private",
      RADARR_URL: "http://radarr:7878",
      RADARR_API_KEY: "radarr-private",
    });

    await service.apply({
      previewId: preview.previewId,
      selectedServiceIds: ["sonarr"],
      credentialConsent: { sonarr: true, radarr: true },
    });

    expect(inputs[0].services).toEqual([
      expect.objectContaining({
        service: "sonarr",
        apiKey: { kind: "set", value: "sonarr-private" },
      }),
    ]);
    expect(JSON.stringify(inputs)).not.toContain("radarr-private");
    await expect(
      service.apply({
        previewId: preview.previewId,
        selectedServiceIds: ["sonarr"],
        credentialConsent: { sonarr: true },
      }),
    ).rejects.toThrow("invalid or expired import preview");
  });

  it("cannot select a service outside the preview and expires bounded sessions", async () => {
    let now = 100;
    const { config } = configHarness();
    const service = new ImportService(config, { ttlMs: 10, maxSessions: 1, now: () => now });
    const first = await service.preview({ SONARR_URL: "http://sonarr:8989" });

    await expect(
      service.apply({
        previewId: first.previewId,
        selectedServiceIds: ["radarr"],
        credentialConsent: {},
      }),
    ).rejects.toThrow("service radarr was not present in this import preview");

    const expired = await service.preview({ SONARR_URL: "http://sonarr:8989" });
    now += 11;
    await expect(
      service.apply({
        previewId: expired.previewId,
        selectedServiceIds: ["sonarr"],
        credentialConsent: {},
      }),
    ).rejects.toThrow("invalid or expired import preview");
  });

  it("never returns imported usernames and includes them in stored credential redaction", async () => {
    const state = {
      plugin: codec.parsePluginConfig("ENABLED=yes\nBIND_MODE=loopback\n"),
      env: codec.parseYarrEnvironment(""),
    };
    const config = {
      save: vi.fn(async (input: SaveYarrConfigInput) => {
        const merged = codec.mergeConfigInput(state, input);
        return {
          config: codec.toPublicConfig(merged.plugin, merged.env),
          changed: true,
          restarted: true,
          rolledBack: false,
        };
      }),
    };
    const service = new ImportService(config);
    const preview = await service.preview({
      QBITTORRENT_URL: "http://qbittorrent:8080",
      QBITTORRENT_USERNAME: "private-user",
    });

    const result = await service.apply({
      previewId: preview.previewId,
      selectedServiceIds: ["qbittorrent"],
      credentialConsent: { qbittorrent: true },
    });

    expect(JSON.stringify(result)).not.toContain("private-user");
    expect(collectSecretValues({ YARR_QBITTORRENT_USERNAME: "private-user" })).toEqual([
      "private-user",
    ]);
  });
});
