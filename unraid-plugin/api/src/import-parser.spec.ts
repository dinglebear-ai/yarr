import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

import { parseImportText } from "./import-parser";

describe("Yarr import text parser", () => {
  it("parses .env input deliberately, including export and quoted values", () => {
    expect(parseImportText(
      "export SONARR_URL=\"http://sonarr:8989\"\nSONARR_API_KEY='private-value'\n",
    )).toEqual({
      format: "env",
      values: {
        SONARR_URL: "http://sonarr:8989",
        SONARR_API_KEY: "private-value",
      },
      warnings: [],
    });
  });

  it("parses real Yarr TOML service array tables without dropping supported fields", () => {
    const parsed = parseImportText(`
      [[yarr.services]]
      name = "Download client"
      kind = "qbittorrent"
      base_url = "http://qbittorrent:8080"
      username = "jacob"
      password = "private-password"
    `);

    expect(parsed.format).toBe("toml");
    expect(parsed.values).toEqual({
      YARR_QBITTORRENT_URL: "http://qbittorrent:8080",
      YARR_QBITTORRENT_USERNAME: "jacob",
      YARR_QBITTORRENT_PASSWORD: "private-password",
    });
    expect(parsed.warnings).toContain("Yarr TOML display name for qbittorrent was not imported");
  });

  it("accepts the repository's complete config.example.toml and reports every non-service field", () => {
    const example = readFileSync(resolve(process.cwd(), "../../config.example.toml"), "utf8");
    const parsed = parseImportText(example);

    expect(parsed.format).toBe("toml");
    expect(parsed.values).toEqual({});
    expect(parsed.warnings).toContain(
      "Yarr TOML field [mcp].host is valid but is not imported as a service setting",
    );
    expect(parsed.warnings).toContain(
      "Yarr TOML field [mcp.auth].allowed_client_redirect_uris is valid but is not imported as a service setting",
    );
  });

  it.each([
    ["unknown format", "this is not configuration", ".env assignments or Yarr TOML"],
    ["malformed TOML", "[yarr\nservices = []", "invalid Yarr TOML"],
    ["unsupported table", "[other]\nvalue = true", "unsupported TOML table"],
    ["unsupported field", "[mcp]\nunknown = true", "unsupported Yarr TOML field"],
    ["unsupported credential", "[[yarr.services]]\nkind = \"sonarr\"\nusername = \"nope\"", "does not support username"],
    ["conflicting service forms", "[yarr]\nservices = []\n[[yarr.services]]\nkind = \"sonarr\"", "cannot define both"],
  ])("rejects %s clearly", (_label, input, message) => {
    expect(() => parseImportText(input)).toThrow(message);
  });
});
