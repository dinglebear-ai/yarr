import { describe, expect, it } from "vitest";

import * as codec from "./config-codec";
import type { SaveYarrConfigInput } from "./config.types";
import { normalizeServiceUrl } from "./service-catalog";

const pluginConfig = `ENABLED=yes\nDASHBOARD_WIDGET_ENABLE=true\nBIND_MODE=loopback\nCUSTOM_HOST=\nPORT=40070\nAUTH_MODE=bearer\nTAILSCALE_SERVE=no\nTAILSCALE_HOSTNAME=\nLOG_LEVEL=info\nUPDATE_CHANNEL=stable\n`;

describe("Yarr configuration codec", () => {
  it("preserves unknown yarr.cfg keys without accepting them from input", () => {
    const parsed = codec.parsePluginConfig(`${pluginConfig}EXISTING_KEY=preserve\n`);
    const current = { plugin: parsed, env: codec.parseYarrEnvironment("") };

    expect(() =>
      codec.mergeConfigInput(current, { port: 40100, injected: "reject" } as unknown as import("./config.types").SaveYarrConfigInput),
    ).toThrow("unknown configuration input field injected");

    const merged = codec.mergeConfigInput(current, { port: 40100 });

    expect(merged.plugin.values.EXISTING_KEY).toBe("preserve");
    expect(codec.serializePluginConfig(merged.plugin)).toContain("EXISTING_KEY=preserve\n");
  });

  it("preserves unknown environment keys", () => {
    const env = codec.parseYarrEnvironment("KEEP_ME=unchanged\nYARR_MCP_TOKEN=private\n");

    expect(codec.serializeYarrEnvironment(env)).toContain("KEEP_ME=unchanged\n");
  });

  it("redacts known secrets from the public configuration", () => {
    const view = codec.toPublicConfig(
      codec.parsePluginConfig(pluginConfig),
      codec.parseYarrEnvironment(
        "YARR_MCP_TOKEN=private-token\nYARR_MCP_GOOGLE_CLIENT_SECRET=private-secret\n",
      ),
    );

    expect(view.services).toContainEqual(
      expect.objectContaining({ hasApiKey: true, hasPassword: true }),
    );
    expect(JSON.stringify(view)).not.toContain("private-token");
    expect(JSON.stringify(view)).not.toContain("private-secret");
  });

  it("preserves an omitted secret update", () => {
    const current = {
      plugin: codec.parsePluginConfig(pluginConfig),
      env: codec.parseYarrEnvironment("YARR_MCP_TOKEN=private-token\n"),
    };

    const merged = codec.mergeConfigInput(current, { port: 40100 });

    expect(merged.env.values.YARR_MCP_TOKEN).toBe("private-token");
  });

  it("defaults, validates, and persists dashboard widget visibility", () => {
    const withoutDashboardKey = codec.parsePluginConfig(
      pluginConfig.replace("DASHBOARD_WIDGET_ENABLE=true\n", ""),
    );
    expect(codec.toPublicConfig(withoutDashboardKey, codec.parseYarrEnvironment("")).plugin)
      .toMatchObject({ dashboardWidgetEnable: true });

    const merged = codec.mergeConfigInput(
      { plugin: withoutDashboardKey, env: codec.parseYarrEnvironment("") },
      { dashboardWidgetEnable: false },
    );
    expect(merged.plugin.values.DASHBOARD_WIDGET_ENABLE).toBe("false");
    expect(codec.toPublicConfig(merged.plugin, merged.env).plugin.dashboardWidgetEnable).toBe(false);

    expect(() => codec.toPublicConfig(
      codec.parsePluginConfig(
        pluginConfig.replace("DASHBOARD_WIDGET_ENABLE=true", "DASHBOARD_WIDGET_ENABLE=no"),
      ),
      codec.parseYarrEnvironment(""),
    )).toThrow("DASHBOARD_WIDGET_ENABLE must be true or false");
  });

  it("clears an explicitly cleared secret", () => {
    const current = {
      plugin: codec.parsePluginConfig(pluginConfig),
      env: codec.parseYarrEnvironment("YARR_MCP_TOKEN=private-token\n"),
    };

    const merged = codec.mergeConfigInput(current, {
      bearerToken: { kind: "clear" },
    });

    expect(merged.env.values.YARR_MCP_TOKEN).toBeUndefined();
  });

  it("normalizes CRLF input to LF output", () => {
    const parsed = codec.parsePluginConfig(pluginConfig.replaceAll("\n", "\r\n"));

    expect(codec.serializePluginConfig(parsed)).not.toContain("\r");
  });

  it("rejects duplicate keys", () => {
    expect(() => codec.parseYarrEnvironment("YARR_MCP_TOKEN=one\nYARR_MCP_TOKEN=two\n")).toThrow(
      "duplicate key",
    );
  });

  it("rejects non-loopback configuration without supported authentication", () => {
    const state = {
      plugin: codec.parsePluginConfig(pluginConfig.replace("BIND_MODE=loopback", "BIND_MODE=lan")),
      env: codec.parseYarrEnvironment(""),
    };

    expect(() => codec.validateConfigState(state)).toThrow("authentication");
  });

  it("writes exactly one trailing newline", () => {
    const plugin = codec.parsePluginConfig(`${pluginConfig}\n\n`);
    const env = codec.parseYarrEnvironment("YARR_MCP_TOKEN=private\n\n");

    expect(codec.serializePluginConfig(plugin)).toMatch(/[^\n]\n$/);
    expect(codec.serializePluginConfig(plugin)).not.toMatch(/\n\n$/);
    expect(codec.serializeYarrEnvironment(env)).toMatch(/[^\n]\n$/);
    expect(codec.serializeYarrEnvironment(env)).not.toMatch(/\n\n$/);
  });

  it.each(["\r", "\n", "\r\n"])(
    "rejects line breaks in every domain string input (%j)",
    (lineBreak) => {
      const current = {
        plugin: codec.parsePluginConfig(pluginConfig),
        env: codec.parseYarrEnvironment(""),
      };

      for (const input of [
        { customHost: `192.0.2.10${lineBreak}INJECTED=yes` },
        { tailscaleHostname: `yarr${lineBreak}INJECTED=yes` },
        { googleClientId: `client${lineBreak}INJECTED=yes` },
        { bearerToken: { kind: "set", value: `token${lineBreak}INJECTED=yes` } },
      ] satisfies SaveYarrConfigInput[]) {
        expect(() => codec.mergeConfigInput(current, input)).toThrow("line break");
      }
    },
  );

  it("rejects line breaks from both serializers", () => {
    expect(() =>
      codec.serializePluginConfig({ values: { ...codec.parsePluginConfig(pluginConfig).values, CUSTOM_HOST: "192.0.2.10\nINJECTED=yes" } }),
    ).toThrow("line break");
    expect(() =>
      codec.serializeYarrEnvironment({ values: { UNKNOWN: "value\rINJECTED=yes" } }),
    ).toThrow("line break");
  });

  it("preserves literal backslash sequences and round-trips accepted environment values", () => {
    const parsed = codec.parseYarrEnvironment(
      "UNKNOWN=literal\\ntext\nYARR_MCP_TOKEN=token\\nvalue\n",
    );
    const serialized = codec.serializeYarrEnvironment(parsed);

    expect(parsed.values.UNKNOWN).toBe("literal\\ntext");
    expect(parsed.values.YARR_MCP_TOKEN).toBe("token\\nvalue");
    expect(serialized).toContain("UNKNOWN=literal\\ntext\n");
    expect(codec.parseYarrEnvironment(serialized)).toEqual(parsed);
  });

  it("rejects raw newline environment assignments", () => {
    expect(() => codec.parseYarrEnvironment("UNKNOWN=first\nsecond\n")).toThrow("expected KEY=value");
  });

  it("allows trusted gateway only at the same-host loopback boundary", () => {
    const trustedPlugin = codec.parsePluginConfig(
      pluginConfig.replace("AUTH_MODE=bearer", "AUTH_MODE=trusted-gateway"),
    );

    expect(() =>
      codec.validateConfigState({
        plugin: trustedPlugin,
        env: codec.parseYarrEnvironment("YARR_MCP_ALLOWED_HOSTS= proxy.example.test , proxy.internal \n"),
      }),
    ).not.toThrow();
    expect(() =>
      codec.validateConfigState({
        plugin: trustedPlugin,
        env: codec.parseYarrEnvironment("YARR_MCP_ALLOWED_HOSTS= , , \nYARR_MCP_ALLOWED_ORIGINS=\t\n"),
      }),
    ).toThrow("requires at least one allowed host or origin");
  });

  it("accepts bearer and Google OAuth for network exposure but rejects spoofable trusted gateway", () => {
    const lanConfig = (authMode: string) =>
      codec.parsePluginConfig(
        pluginConfig
          .replace("BIND_MODE=loopback", "BIND_MODE=lan")
          .replace("AUTH_MODE=bearer", `AUTH_MODE=${authMode}`),
      );

    expect(() =>
      codec.validateConfigState({
        plugin: lanConfig("bearer"),
        env: codec.parseYarrEnvironment("YARR_MCP_TOKEN=token\n"),
      }),
    ).not.toThrow();
    expect(() =>
      codec.validateConfigState({
        plugin: lanConfig("google-oauth"),
        env: codec.parseYarrEnvironment(
          "YARR_MCP_GOOGLE_CLIENT_ID=client\nYARR_MCP_GOOGLE_CLIENT_SECRET=secret\n",
        ),
      }),
    ).not.toThrow();
    for (const spoofedProvenance of [
      "YARR_MCP_ALLOWED_HOSTS=proxy.example.test\n",
      "YARR_MCP_ALLOWED_ORIGINS=https://proxy.example.test\n",
      "YARR_MCP_ALLOWED_HOSTS=127.0.0.1\nYARR_MCP_ALLOWED_ORIGINS=http://127.0.0.1\n",
    ]) {
      expect(() =>
        codec.validateConfigState({
          plugin: lanConfig("trusted-gateway"),
          env: codec.parseYarrEnvironment(spoofedProvenance),
        }),
      ).toThrow("restricted to loopback");
    }
  });

  it("treats Tailscale Serve as network exposure and rejects trusted gateway", () => {
    const tailscaleTrusted = codec.parsePluginConfig(
      pluginConfig
        .replace("AUTH_MODE=bearer", "AUTH_MODE=trusted-gateway")
        .replace("TAILSCALE_SERVE=no", "TAILSCALE_SERVE=yes")
        .replace("TAILSCALE_HOSTNAME=", "TAILSCALE_HOSTNAME=yarr"),
    );
    expect(() =>
      codec.validateConfigState({
        plugin: tailscaleTrusted,
        env: codec.parseYarrEnvironment(
          "YARR_MCP_ALLOWED_HOSTS=yarr.example.ts.net\nYARR_MCP_ALLOWED_ORIGINS=https://yarr.example.ts.net\n",
        ),
      }),
    ).toThrow("restricted to loopback");
  });

  it("accepts only ASCII configuration keys", () => {
    expect(() => codec.parseYarrEnvironment("YARR_É=invalid\n")).toThrow("expected KEY=value");
  });

  it("strictly normalizes safe service URLs through the catalog boundary", () => {
    expect(normalizeServiceUrl(" HTTPS://Example.COM:443/a/../b// ")).toBe(
      "https://example.com/b",
    );
    expect(normalizeServiceUrl("http://[2001:DB8::1]:8080/path/" )).toBe(
      "http://[2001:db8::1]:8080/path",
    );
  });

  it.each([
    "http://user@example.test:8989",
    "http://user:password@example.test:8989",
    "http://example.test:8989/?token=private-query",
    "http://example.test:8989/#private-fragment",
    "http://example.test:0",
    "http://example.test:65536",
    "not-a-url",
    `http://${"a".repeat(64)}.example.test`,
    `http://example.test/${"a".repeat(1025)}`,
    `http://example.test/${"a".repeat(2048)}`,
  ])("rejects unsafe service URL %s", (url) => {
    expect(normalizeServiceUrl(url)).toBeNull();
    const current = {
      plugin: codec.parsePluginConfig(pluginConfig),
      env: codec.parseYarrEnvironment(""),
    };
    expect(() =>
      codec.mergeConfigInput(current, {
        services: [{ service: "sonarr", enabled: true, baseUrl: url }],
      }),
    ).toThrow("without credentials, query, or fragment");
  });

  it("defensively hides unsafe pre-existing service URLs from public rendering", () => {
    const view = codec.toPublicConfig(
      codec.parsePluginConfig(pluginConfig),
      codec.parseYarrEnvironment(
        "YARR_SERVICES=sonarr,radarr\nYARR_SONARR_URL=http://sonarr:8989/?token=private-query\nYARR_RADARR_URL=http://user:private-password@radarr:7878\n",
      ),
    );

    expect(view.services.find((service) => service.service === "sonarr")?.baseUrl).toBe("");
    expect(view.services.find((service) => service.service === "radarr")?.baseUrl).toBe("");
    expect(JSON.stringify(view)).not.toMatch(/private-query|private-password/);
  });

  it("round trips the real UI-shaped service payload without erasing supported usernames", () => {
    const current = {
      plugin: codec.parsePluginConfig(pluginConfig),
      env: codec.parseYarrEnvironment(
        "YARR_SERVICES=sonarr,qbittorrent\n" +
        "YARR_SONARR_URL=http://sonarr:8989\n" +
        "YARR_SONARR_API_KEY=sonarr-private\n" +
        "YARR_QBITTORRENT_URL=http://qbittorrent:8080\n" +
        "YARR_QBITTORRENT_USERNAME=jacob\n" +
        "YARR_QBITTORRENT_PASSWORD=qbit-private\n",
      ),
    };
    const view = codec.toPublicConfig(current.plugin, current.env);
    const services = view.services
      .filter((service) => service.service !== "yarr")
      .map((service) => ({
        service: service.service,
        enabled: service.enabled,
        ...(service.baseUrl === "" ? {} : { baseUrl: service.baseUrl }),
        ...(service.username === null ? {} : { username: service.username }),
        password: { kind: "preserve" as const },
        apiKey: { kind: "preserve" as const },
      }));

    expect(services.find((service) => service.service === "sonarr")).not.toHaveProperty("username");
    expect(services.find((service) => service.service === "qbittorrent")).toMatchObject({
      username: "jacob",
    });

    const merged = codec.mergeConfigInput(current, { services });
    expect(merged.env.values.YARR_QBITTORRENT_USERNAME).toBe("jacob");
    expect(merged.env.values.YARR_QBITTORRENT_PASSWORD).toBe("qbit-private");
    expect(merged.env.values.YARR_SONARR_API_KEY).toBe("sonarr-private");
  });
});
