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

const MAX_RESPONSE_BYTES = 1_000_000;
const encoder = new TextEncoder();

function graphqlResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function streamResponse(chunks: Uint8Array[], options: { contentLength?: string; close?: boolean } = {}) {
  const cancel = vi.fn();
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      for (const chunk of chunks) controller.enqueue(chunk);
      if (options.close !== false) controller.close();
    },
    cancel,
  });
  return {
    response: new Response(stream, { headers: options.contentLength ? { "Content-Length": options.contentLength } : undefined }),
    cancel,
  };
}

function runtimeJson(filler = ""): string {
  return `{"data":{"yarrRuntime":{"filler":"${filler}"}}}`;
}

describe("Yarr GraphQL client", () => {
  beforeEach(() => {
    window.csrf_token = "host-csrf-token";
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.useRealTimers();
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
    expect(vi.getTimerCount()).toBe(0);
  });

  it("uses a chunked response without a Content-Length header", async () => {
    const body = encoder.encode(JSON.stringify({ data: { yarrRuntime: runtime } }));
    const response = streamResponse([body.slice(0, 15), body.slice(15)]);
    vi.mocked(fetch).mockResolvedValue(response.response);

    await expect(queryYarrRuntime()).resolves.toEqual(runtime);
  });

  it("cancels a dishonest-length stream once byte count exceeds the limit", async () => {
    const response = streamResponse([new Uint8Array(MAX_RESPONSE_BYTES + 1)], { contentLength: "1", close: false });
    vi.mocked(fetch).mockResolvedValue(response.response);

    await expect(queryYarrRuntime()).rejects.toThrow("Unable to complete this request.");
    expect(response.cancel).toHaveBeenCalledTimes(1);
  });

  it("counts multibyte response data by byte length", async () => {
    const prefix = '{"data":{"yarrRuntime":{"filler":"';
    const suffix = '"}}}';
    const filler = "é".repeat(Math.floor((MAX_RESPONSE_BYTES - encoder.encode(prefix + suffix).byteLength) / 2) + 1);
    const response = streamResponse([encoder.encode(`${prefix}${filler}${suffix}`)], { close: false });
    vi.mocked(fetch).mockResolvedValue(response.response);

    await expect(queryYarrRuntime()).rejects.toThrow("Unable to complete this request.");
    expect(response.cancel).toHaveBeenCalledTimes(1);
  });

  it("accepts a response exactly at the byte limit", async () => {
    const prefix = '{"data":{"yarrRuntime":{"filler":"';
    const suffix = '"}}}';
    const filler = "a".repeat(MAX_RESPONSE_BYTES - encoder.encode(prefix + suffix).byteLength);
    const response = streamResponse([encoder.encode(`${prefix}${filler}${suffix}`)], { contentLength: String(MAX_RESPONSE_BYTES) });
    vi.mocked(fetch).mockResolvedValue(response.response);

    await expect(queryYarrRuntime()).resolves.toMatchObject({ filler });
  });

  it("cancels an oversized response before reading its body", async () => {
    const response = streamResponse([], { contentLength: String(MAX_RESPONSE_BYTES + 1), close: false });
    vi.mocked(fetch).mockResolvedValue(response.response);

    await expect(queryYarrRuntime()).rejects.toThrow("Unable to complete this request.");
    expect(response.cancel).toHaveBeenCalledTimes(1);
  });

  it("returns a safe error for malformed JSON", async () => {
    vi.mocked(fetch).mockResolvedValue(new Response("not json"));

    await expect(queryYarrRuntime()).rejects.toThrow("Unable to complete this request.");
  });

  it("composes a caller abort into the request", async () => {
    vi.mocked(fetch).mockImplementation((_url, init) => new Promise((_resolve, reject) => {
      init?.signal?.addEventListener("abort", () => reject(init.signal?.reason));
    }));
    const caller = new AbortController();
    const request = queryYarrRuntime(caller.signal);
    const outcome = expect(request).rejects.toThrow("Request cancelled.");

    caller.abort();

    await outcome;
  });

  it("removes the caller abort listener after a completed request", async () => {
    const caller = new AbortController();
    const removeListener = vi.spyOn(caller.signal, "removeEventListener");
    vi.mocked(fetch).mockResolvedValue(graphqlResponse({ data: { yarrRuntime: runtime } }));

    await queryYarrRuntime(caller.signal);

    expect(removeListener).toHaveBeenCalledWith("abort", expect.any(Function));
  });

  it("cleans up CSRF polling timers after its bounded wait", async () => {
    vi.useFakeTimers();
    window.csrf_token = undefined;
    vi.mocked(fetch).mockResolvedValue(graphqlResponse({ data: { yarrRuntime: runtime } }));

    const request = queryYarrRuntime();
    await vi.advanceTimersByTimeAsync(2_000);
    await request;

    expect(vi.getTimerCount()).toBe(0);
  });

  it("does not log mutation variables or include them in user-facing errors", async () => {
    const secret = "do-not-expose-this-value";
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);
    vi.mocked(fetch).mockResolvedValue(graphqlResponse({ errors: [{ message: secret }] }));

    await expect(mutateYarrConfig({ bearerToken: { kind: "SET", value: secret } })).rejects.not.toThrow(secret);
    expect(errorSpy).not.toHaveBeenCalled();
  });
});
