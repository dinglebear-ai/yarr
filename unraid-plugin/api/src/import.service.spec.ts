import { describe, expect, it, vi } from "vitest";

import type { SaveYarrConfigInput, YarrConfigView } from "./config.types";
import * as codec from "./config-codec";
import { ImportService } from "./import.service";
import { collectSecretValues } from "./secret-redactor";

function configHarness(services: YarrConfigView["services"] = []) {
  const inputs: SaveYarrConfigInput[] = [];
  return {
    inputs,
    config: {
      read: vi.fn(async () => ({ plugin: {} as never, services })),
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
  it("previews both real .env and Yarr TOML through the service boundary", async () => {
    const { config } = configHarness();
    const service = new ImportService(config);

    const env = await service.previewText(
      "SONARR_URL=http://sonarr:8989\nSONARR_API_KEY=private-env\n",
    );
    const toml = await service.previewText(`
      [[yarr.services]]
      kind = "qbittorrent"
      base_url = "http://qbittorrent:8080"
      username = "jacob"
      password = "private-toml"
    `);

    expect(env.mappings).toEqual([
      expect.objectContaining({ serviceId: "sonarr", hasApiKey: true }),
    ]);
    expect(toml.mappings).toEqual([
      expect.objectContaining({
        serviceId: "qbittorrent",
        baseUrl: "http://qbittorrent:8080",
        hasUsername: true,
        hasPassword: true,
      }),
    ]);
    expect(JSON.stringify({ env, toml })).not.toMatch(/private-env|private-toml|jacob/);
  });

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
        urlRequired: false,
      },
      {
        serviceId: "qbittorrent",
        baseUrl: null,
        hasUsername: true,
        hasPassword: true,
        hasApiKey: false,
        urlRequired: true,
      },
    ]);
    expect(preview.warnings).toContain("Unknown structured key was ignored");
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

  it("never reflects unknown values or unsupported YARR_SERVICES entries", async () => {
    const { config } = configHarness();
    const service = new ImportService(config);

    const preview = await service.preview({
      YARR_SERVICES: "sonarr,private-unsupported-service",
      UNKNOWN_SECRET: "private-unknown-value",
    });

    expect(preview.warnings).toEqual([
      "YARR_SERVICES contains 1 unsupported entry",
      "Unknown structured key was ignored",
    ]);
    expect(JSON.stringify(preview)).not.toMatch(/private-unsupported-service|private-unknown-value/);
  });

  it("rejects query, fragment, malformed, and overlength imported URLs without reflection", async () => {
    const { config } = configHarness();
    const service = new ImportService(config);
    const preview = await service.preview({
      SONARR_URL: "http://sonarr:8989/?token=private-query",
      RADARR_URL: "http://radarr:7878/#private-fragment",
      PROWLARR_URL: "malformed-private-value",
      BAZARR_URL: `http://bazarr:6767/${"x".repeat(2048)}`,
    });

    expect(preview.mappings).toEqual([]);
    expect(JSON.stringify(preview)).not.toMatch(
      /private-query|private-fragment|malformed-private-value/,
    );
    expect(preview.warnings).toHaveLength(4);
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

  it("requires an imported or existing URL before credential-only enablement", async () => {
    const unconfigured = configHarness();
    const unconfiguredService = new ImportService(unconfigured.config);
    const blocked = await unconfiguredService.preview({
      QBITTORRENT_USERNAME: "private-user",
    });

    expect(blocked.mappings).toEqual([
      expect.objectContaining({
        serviceId: "qbittorrent",
        baseUrl: null,
        hasUsername: true,
        urlRequired: true,
      }),
    ]);
    await expect(unconfiguredService.apply({
      previewId: blocked.previewId,
      selectedServiceIds: ["qbittorrent"],
      credentialConsent: { qbittorrent: true },
    })).rejects.toThrow("qbittorrent requires a valid URL before it can be enabled");
    expect(unconfigured.inputs).toEqual([]);

    const configured = configHarness([{
      service: "qbittorrent",
      enabled: false,
      baseUrl: "http://qbittorrent:8080",
      username: null,
      hasPassword: false,
      hasApiKey: false,
      extra: {},
    }]);
    const configuredService = new ImportService(configured.config);
    const accepted = await configuredService.preview({
      QBITTORRENT_USERNAME: "private-user",
    });
    expect(accepted.mappings[0]).toMatchObject({ baseUrl: null, urlRequired: false });
    await configuredService.apply({
      previewId: accepted.previewId,
      selectedServiceIds: ["qbittorrent"],
      credentialConsent: { qbittorrent: true },
    });
    expect(configured.inputs[0]?.services).toEqual([
      expect.objectContaining({
        service: "qbittorrent",
        enabled: true,
        baseUrl: "http://qbittorrent:8080",
        username: "private-user",
      }),
    ]);

    const declined = await configuredService.preview({
      QBITTORRENT_USERNAME: "declined-user",
    });
    await configuredService.apply({
      previewId: declined.previewId,
      selectedServiceIds: ["qbittorrent"],
      credentialConsent: { qbittorrent: false },
    });
    expect(configured.inputs[1]?.services?.[0]?.username).toBeUndefined();
    expect(JSON.stringify(configured.inputs[1])).not.toContain("declined-user");
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

  it("returns supported non-password usernames while retaining defense-in-depth log redaction", async () => {
    let state = {
      plugin: codec.parsePluginConfig("ENABLED=yes\nBIND_MODE=loopback\n"),
      env: codec.parseYarrEnvironment(""),
    };
    const config = {
      read: vi.fn(async () => codec.toPublicConfig(state.plugin, state.env)),
      save: vi.fn(async (input: SaveYarrConfigInput) => {
        state = codec.mergeConfigInput(state, input);
        return {
          config: codec.toPublicConfig(state.plugin, state.env),
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

    expect(result.config.services.find((service) => service.service === "qbittorrent")?.username).toBe(
      "private-user",
    );
    expect(collectSecretValues({ YARR_QBITTORRENT_USERNAME: "private-user" })).toEqual([
      "private-user",
    ]);

    const declinedPreview = await service.preview({
      QBITTORRENT_USERNAME: "declined-user",
    });
    const declined = await service.apply({
      previewId: declinedPreview.previewId,
      selectedServiceIds: ["qbittorrent"],
      credentialConsent: { qbittorrent: false },
    });
    expect(declined.config.services.find((item) => item.service === "qbittorrent")?.username).toBe(
      "private-user",
    );
    expect(codec.toPublicConfig(state.plugin, state.env).services
      .find((item) => item.service === "qbittorrent")?.username).toBe("private-user");
  });
});
