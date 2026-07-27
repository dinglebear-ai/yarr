import { afterEach, expect, it, vi } from "vitest";

import { rollbackYarrBinary } from "./graphql";

afterEach(() => {
  vi.unstubAllGlobals();
  window.csrf_token = undefined;
});

it("sends the hand-maintained manual rollback GraphQL operation and returns its result", async () => {
  window.csrf_token = "csrf";
  const status = {
    installedVersion: "2.0.0",
    packagedVersion: "2.0.0",
    availableVersion: "2.1.0",
    updateAvailable: true,
    usingOverlay: true,
    rollbackAvailable: true,
    rolledBack: false,
    message: "Yarr rolled back to previous binary",
  };
  const fetchMock = vi.fn(async (_url: string, init: RequestInit) => {
    const body = JSON.parse(String(init.body)) as { query: string };
    expect(body.query).toContain("mutation RollbackYarrBinary");
    expect(body.query).toContain("rollbackYarrBinary");
    expect(body.query).toContain("rollbackAvailable");
    return new Response(JSON.stringify({ data: { rollbackYarrBinary: status } }), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  });
  vi.stubGlobal("fetch", fetchMock);

  await expect(rollbackYarrBinary()).resolves.toEqual(status);
  expect(fetchMock).toHaveBeenCalledOnce();
});
