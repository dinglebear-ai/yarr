import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  controlYarr,
  mutateYarrConfig,
  queryYarrConfig,
  queryYarrRuntime,
} from "./graphql";

const runtime = {
  state: "running",
  pid: 123,
  version: "1.2.3",
  bindAddress: "127.0.0.1",
  port: 40070,
  ready: true,
  healthMessage: "Ready",
  uptimeSeconds: 60,
};

function graphqlResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

describe("Yarr GraphQL client", () => {
  beforeEach(() => {
    window.csrf_token = "host-csrf-token";
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("posts the runtime query with Unraid's same-origin CSRF convention", async () => {
    vi.mocked(fetch).mockResolvedValue(graphqlResponse({ data: { yarrRuntime: runtime } }));

    await expect(queryYarrRuntime()).resolves.toEqual(runtime);

    expect(fetch).toHaveBeenCalledWith("/graphql", expect.objectContaining({
      method: "POST",
      credentials: "same-origin",
      headers: expect.objectContaining({
        "Content-Type": "application/json",
        "x-csrf-token": "host-csrf-token",
      }),
    }));
    expect(JSON.parse(String(vi.mocked(fetch).mock.calls[0]?.[1]?.body))).toMatchObject({
      query: expect.stringContaining("yarrRuntime"),
    });
  });

  it("returns a user-safe error for GraphQL failures", async () => {
    vi.mocked(fetch).mockResolvedValue(graphqlResponse({ errors: [{ message: "internal secret detail" }] }));

    await expect(queryYarrConfig()).rejects.toThrow("Unable to complete this request.");
  });

  it("returns a user-safe error for HTTP failures", async () => {
    vi.mocked(fetch).mockResolvedValue(graphqlResponse({ message: "forbidden secret detail" }, 403));

    await expect(controlYarr("RESTART")).rejects.toThrow("Unable to complete this request.");
  });

  it("aborts a request after eight seconds", async () => {
    vi.useFakeTimers();
    vi.mocked(fetch).mockImplementation((_url, init) => new Promise((_resolve, reject) => {
      init?.signal?.addEventListener("abort", () => reject(init.signal?.reason));
    }));

    const request = queryYarrRuntime();
    const outcome = expect(request).rejects.toThrow("Request timed out.");
    await vi.advanceTimersByTimeAsync(8_000);

    await outcome;
    vi.useRealTimers();
  });

  it("does not log mutation variables or include them in user-facing errors", async () => {
    const secret = "do-not-expose-this-value";
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);
    vi.mocked(fetch).mockResolvedValue(graphqlResponse({ errors: [{ message: secret }] }));

    await expect(mutateYarrConfig({ bearerToken: { kind: "SET", value: secret } })).rejects.not.toThrow(secret);
    expect(errorSpy).not.toHaveBeenCalled();
  });
});
