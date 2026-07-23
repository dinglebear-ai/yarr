import { EventEmitter } from "node:events";
import type { ClientRequest, IncomingMessage, RequestOptions } from "node:http";
import { PassThrough } from "node:stream";

import { describe, expect, it } from "vitest";

import { DockerService, type DockerRequestFactory } from "./docker.service";

class FakeRequest extends EventEmitter {
  destroyed = false;

  constructor(private readonly start: () => void) {
    super();
  }

  end(): void {
    queueMicrotask(this.start);
  }

  destroy(): this {
    this.destroyed = true;
    return this;
  }
}

function responseFactory(
  body: string,
  statusCode = 200,
): { factory: DockerRequestFactory; requests: RequestOptions[] } {
  const requests: RequestOptions[] = [];
  const factory: DockerRequestFactory = (options, callback) => {
    requests.push(options);
    const request = new FakeRequest(() => {
      const response = new PassThrough() as PassThrough & { statusCode: number };
      response.statusCode = statusCode;
      callback(response as unknown as IncomingMessage);
      response.end(body);
    });
    return request as unknown as ClientRequest;
  };
  return { factory, requests };
}

describe("DockerService", () => {
  it("issues only fixed GET list and encoded inspect requests over the Docker socket", async () => {
    const { factory, requests } = responseFactory("[]");
    const service = new DockerService(factory);

    await service.listContainers();
    await service.inspectContainer("container/../?secret=yes");

    expect(requests).toEqual([
      {
        socketPath: "/var/run/docker.sock",
        method: "GET",
        path: "/containers/json",
        headers: { Accept: "application/json" },
        timeout: 3000,
      },
      {
        socketPath: "/var/run/docker.sock",
        method: "GET",
        path: "/containers/container%2F..%2F%3Fsecret%3Dyes/json",
        headers: { Accept: "application/json" },
        timeout: 3000,
      },
    ]);
  });

  it("returns typed non-fatal timeout, malformed JSON, and missing socket errors", async () => {
    const timeoutFactory: DockerRequestFactory = (_options, _callback) => {
      const request = new FakeRequest(() => request.emit("timeout"));
      return request as unknown as ClientRequest;
    };
    const malformed = responseFactory("not-json");
    const missingFactory: DockerRequestFactory = (_options, _callback) => {
      const request = new FakeRequest(() => {
        const error = Object.assign(new Error("connect ENOENT /var/run/docker.sock"), {
          code: "ENOENT",
        });
        request.emit("error", error);
      });
      return request as unknown as ClientRequest;
    };

    expect(await new DockerService(timeoutFactory).listContainers()).toEqual({
      ok: false,
      error: { code: "timeout", message: "Docker socket request timed out" },
    });
    expect(await new DockerService(malformed.factory).listContainers()).toEqual({
      ok: false,
      error: { code: "invalid_json", message: "Docker returned malformed JSON" },
    });
    expect(await new DockerService(missingFactory).listContainers()).toEqual({
      ok: false,
      error: { code: "socket_unavailable", message: "Docker socket is unavailable" },
    });
  });

  it("rejects non-2xx responses and bodies over 2 MiB without throwing", async () => {
    const denied = responseFactory('{"message":"private"}', 403);
    const oversized = responseFactory(`"${"x".repeat(2 * 1024 * 1024)}"`);

    expect(await new DockerService(denied.factory).listContainers()).toEqual({
      ok: false,
      error: { code: "http_status", message: "Docker returned HTTP 403" },
    });
    expect(await new DockerService(oversized.factory).listContainers()).toEqual({
      ok: false,
      error: { code: "response_too_large", message: "Docker response exceeded 2 MiB" },
    });
  });
});
