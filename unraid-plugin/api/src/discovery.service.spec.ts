import { describe, expect, it, vi } from "vitest";

import type { SaveYarrConfigInput } from "./config.types";
import { DiscoveryService } from "./discovery.service";
import type { DockerResult } from "./docker.service";

interface DockerHarness {
  listContainers: ReturnType<typeof vi.fn>;
  inspectContainer: ReturnType<typeof vi.fn>;
}

function ok<T>(data: T): DockerResult<T> {
  return { ok: true, data };
}

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

describe("DiscoveryService", () => {
  it("ranks label, environment, published-port, and network-address candidates safely", async () => {
    const containers = ["sonarr", "radarr", "prowlarr", "bazarr"].map((id) => ({
      Id: id,
      Names: [`/${id}`],
      Image: `lscr.io/linuxserver/${id}:latest`,
    }));
    const inspections: Record<string, unknown> = {
      sonarr: {
        Id: "sonarr",
        Name: "/sonarr",
        Config: {
          Image: "lscr.io/linuxserver/sonarr:latest",
          Env: ["SONARR_URL=http://sonarr.internal:8989/", "SONARR_API_KEY=sonarr-private"],
          Labels: {},
        },
        NetworkSettings: { Ports: {}, Networks: {} },
      },
      radarr: {
        Id: "radarr",
        Name: "/radarr",
        Config: {
          Image: "lscr.io/linuxserver/radarr:latest",
          Env: [],
          Labels: { "net.unraid.docker.webui": "https://radarr.example.test:7878/" },
        },
        NetworkSettings: { Ports: {}, Networks: {} },
      },
      prowlarr: {
        Id: "prowlarr",
        Name: "/prowlarr",
        Config: { Image: "prowlarr", Env: [], Labels: {} },
        NetworkSettings: {
          Ports: { "9696/tcp": [{ HostIp: "0.0.0.0", HostPort: "19696" }] },
          Networks: { bridge: { IPAddress: "172.18.0.4" } },
        },
      },
      bazarr: {
        Id: "bazarr",
        Name: "/bazarr",
        Config: { Image: "bazarr", Env: [], Labels: {} },
        NetworkSettings: {
          Ports: {},
          Networks: { bridge: { IPAddress: "172.18.0.5" } },
        },
      },
    };
    const docker: DockerHarness = {
      listContainers: vi.fn(async () => ok(containers)),
      inspectContainer: vi.fn(async (id: string) => ok(inspections[id])),
    };
    const { config } = configHarness();
    const service = new DiscoveryService(docker, config);

    const preview = await service.discover();

    expect(preview.candidates.map(({ serviceId, baseUrl }) => ({ serviceId, baseUrl }))).toEqual([
      { serviceId: "sonarr", baseUrl: "http://sonarr.internal:8989" },
      { serviceId: "radarr", baseUrl: "https://radarr.example.test:7878" },
      { serviceId: "prowlarr", baseUrl: "http://127.0.0.1:19696" },
      { serviceId: "bazarr", baseUrl: "http://172.18.0.5:6767" },
    ]);
    expect(preview.candidates[0]).toEqual(
      expect.objectContaining({
        source: "docker",
        hasCredential: true,
        confidence: expect.any(Number),
        reasons: expect.any(Array),
      }),
    );
    expect(preview.candidates.every((candidate) => candidate.candidateId.length >= 32)).toBe(true);
    expect(JSON.stringify(preview)).not.toMatch(/sonarr-private|net\.unraid|SONARR_API_KEY|Labels|Env/);
  });

  it("returns Docker failures as typed non-fatal discovery errors", async () => {
    const docker: DockerHarness = {
      listContainers: vi.fn(async () => ({
        ok: false,
        error: { code: "socket_unavailable", message: "Docker socket is unavailable" },
      })),
      inspectContainer: vi.fn(),
    };
    const { config } = configHarness();

    await expect(new DiscoveryService(docker, config).discover()).resolves.toEqual({
      discoveryId: expect.stringMatching(/^[A-Za-z0-9_-]{32,}$/),
      candidates: [],
      errors: [{ code: "socket_unavailable", message: "Docker socket is unavailable" }],
    });
  });

  it("re-inspects selected containers and imports credentials only with per-service consent", async () => {
    const detail = {
      Id: "qbit-container",
      Name: "/qbittorrent",
      Config: {
        Image: "lscr.io/linuxserver/qbittorrent:latest",
        Env: [
          "QBITTORRENT_URL=http://qbittorrent:8080",
          "QBITTORRENT_USERNAME=jacob",
          "QBITTORRENT_PASSWORD=qbit-private",
        ],
        Labels: {},
      },
      NetworkSettings: { Ports: {}, Networks: {} },
    };
    const docker: DockerHarness = {
      listContainers: vi.fn(async () =>
        ok([{ Id: "qbit-container", Names: ["/qbittorrent"], Image: "qbittorrent" }]),
      ),
      inspectContainer: vi.fn(async () => ok(detail)),
    };
    const { config, inputs } = configHarness();
    const service = new DiscoveryService(docker, config);
    const preview = await service.discover();

    await service.apply({
      discoveryId: preview.discoveryId,
      selectedCandidateIds: [preview.candidates[0].candidateId],
      credentialConsent: { qbittorrent: true },
    });

    expect(docker.inspectContainer).toHaveBeenCalledTimes(2);
    expect(inputs).toEqual([
      {
        services: [
          {
            service: "qbittorrent",
            enabled: true,
            baseUrl: "http://qbittorrent:8080",
            username: "jacob",
            password: { kind: "set", value: "qbit-private" },
            apiKey: { kind: "preserve" },
          },
        ],
      },
    ]);
    expect(JSON.stringify(await service.discover())).not.toContain("qbit-private");
  });

  it("preserves credentials without consent and rejects out-of-session or stale candidates", async () => {
    const detail = {
      Id: "sonarr-container",
      Name: "/sonarr",
      Config: {
        Image: "sonarr",
        Env: ["SONARR_URL=http://sonarr:8989", "SONARR_API_KEY=private"],
        Labels: {},
      },
      NetworkSettings: { Ports: {}, Networks: {} },
    };
    const docker: DockerHarness = {
      listContainers: vi.fn(async () => ok([{ Id: "sonarr-container", Names: ["/sonarr"] }])),
      inspectContainer: vi.fn(async () => ok(detail)),
    };
    const { config, inputs } = configHarness();
    const service = new DiscoveryService(docker, config);
    const preview = await service.discover();

    await expect(
      service.apply({
        discoveryId: preview.discoveryId,
        selectedCandidateIds: ["outside-candidate"],
        credentialConsent: {},
      }),
    ).rejects.toThrow("candidate outside-candidate was not present in this discovery");
    expect(inputs).toEqual([]);

    const fresh = await service.discover();
    await service.apply({
      discoveryId: fresh.discoveryId,
      selectedCandidateIds: [fresh.candidates[0].candidateId],
      credentialConsent: { sonarr: false },
    });
    expect(inputs[0].services?.[0]).toEqual(
      expect.objectContaining({
        username: undefined,
        password: { kind: "preserve" },
        apiKey: { kind: "preserve" },
      }),
    );
    await expect(
      service.apply({
        discoveryId: fresh.discoveryId,
        selectedCandidateIds: [fresh.candidates[0].candidateId],
        credentialConsent: {},
      }),
    ).rejects.toThrow("invalid or expired discovery");

    const stale = await service.discover();
    docker.inspectContainer.mockResolvedValueOnce(
      ok({ ...detail, Config: { ...detail.Config, Env: ["SONARR_URL=http://changed:8989"] } }),
    );
    await expect(
      service.apply({
        discoveryId: stale.discoveryId,
        selectedCandidateIds: [stale.candidates[0].candidateId],
        credentialConsent: {},
      }),
    ).rejects.toThrow("Docker discovery candidate changed; run discovery again");
  });

  it("bounds the number of inspected and retained Docker candidates", async () => {
    const containers = Array.from({ length: 300 }, (_, index) => ({
      Id: `sonarr-${index}`,
      Names: [`/sonarr-${index}`],
    }));
    const docker: DockerHarness = {
      listContainers: vi.fn(async () => ok(containers)),
      inspectContainer: vi.fn(async (id: string) =>
        ok({
          Id: id,
          Name: `/${id}`,
          Config: { Image: "sonarr", Env: ["SONARR_URL=http://sonarr:8989"], Labels: {} },
          NetworkSettings: { Ports: {}, Networks: {} },
        }),
      ),
    };
    const { config } = configHarness();

    const preview = await new DiscoveryService(docker, config).discover();

    expect(preview.candidates).toHaveLength(256);
    expect(docker.inspectContainer).toHaveBeenCalledTimes(256);
  });
});
