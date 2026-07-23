import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { getMetadataStorage } from "class-validator";
import { Kind, parse, type DocumentNode, type FieldDefinitionNode } from "graphql";
import { NestFactory } from "@nestjs/core";
import { describe, expect, it } from "vitest";

import { ApiModule } from "./api.module";
import * as pluginExports from "./index";
import { YARR_INPUT_FIELDS, YARR_INPUT_TYPES, graphqlSchemaExtension } from "./graphql.types";
import { YarrResolver } from "./yarr.resolver";

const EXPECTED_QUERIES = [
  "yarrRuntime",
  "yarrConfig",
  "yarrDiscoveredServices",
  "yarrLogs",
  "yarrUpdateStatus",
] as const;
const EXPECTED_MUTATIONS = [
  "saveYarrConfig",
  "controlYarr",
  "previewYarrImport",
  "applyYarrImport",
  "applyYarrDiscovery",
  "updateYarrBinary",
  "resetYarrBinary",
] as const;

function extensionFields(document: DocumentNode, typeName: "Query" | "Mutation"): FieldDefinitionNode[] {
  return document.definitions
    .filter((definition) =>
      definition.kind === Kind.OBJECT_TYPE_EXTENSION && definition.name.value === typeName)
    .flatMap((definition) => definition.kind === Kind.OBJECT_TYPE_EXTENSION ? definition.fields ?? [] : []);
}

function resolverFields(source: string, decorator: "Query" | "Mutation"): string[] {
  const pattern = new RegExp(`@${decorator}\\([^]*?\\)\\s*(?:@UsePermissions\\([^]*?\\)\\s*)?async\\s+(\\w+)\\s*\\(`, "g");
  return [...source.matchAll(pattern)].map((match) => match[1]);
}

function satisfiesLiveNestLoader(value: Record<string, unknown>): boolean {
  const apiModule = value.ApiModule;
  const cliModule = value.CliModule;
  const isClass = (candidate: unknown) =>
    typeof candidate === "function" && Function.prototype.toString.call(candidate).startsWith("class");
  return value.adapter === "nestjs" &&
    (apiModule === undefined || isClass(apiModule)) &&
    (cliModule === undefined || isClass(cliModule)) &&
    (apiModule !== undefined || cliModule !== undefined);
}

describe("GraphQL extension contract", () => {
  it("keeps resolver and SDL query/mutation fields in exact bidirectional parity", async () => {
    const document = parse(await graphqlSchemaExtension());
    const resolverSource = readFileSync(resolve(process.cwd(), "src/yarr.resolver.ts"), "utf8");
    const sdlQueries = extensionFields(document, "Query").map((field) => field.name.value);
    const sdlMutations = extensionFields(document, "Mutation").map((field) => field.name.value);

    expect(sdlQueries).toEqual(EXPECTED_QUERIES);
    expect(sdlMutations).toEqual(EXPECTED_MUTATIONS);
    expect(resolverFields(resolverSource, "Query")).toEqual(EXPECTED_QUERIES);
    expect(resolverFields(resolverSource, "Mutation")).toEqual(EXPECTED_MUTATIONS);
  });

  it("publishes the exact operation signatures from the approved brief", async () => {
    const schema = await graphqlSchemaExtension();
    expect(schema).toContain("yarrLogs(lines: Int = 200): YarrLogs!");
    expect(schema).toContain("saveYarrConfig(input: SaveYarrConfigInput!): YarrConfigMutationResult!");
    expect(schema).toContain("controlYarr(action: YarrControlAction!): YarrRuntime!");
    expect(schema).toContain("previewYarrImport(input: PreviewYarrImportInput!): YarrImportPreview!");
    expect(schema).toContain("applyYarrImport(input: ApplyYarrImportInput!): YarrConfigMutationResult!");
    expect(schema).toContain("applyYarrDiscovery(input: ApplyYarrDiscoveryInput!): YarrConfigMutationResult!");
    expect(schema).toContain("updateYarrBinary(version: String!): YarrUpdateResult!");
    expect(schema).toContain("resetYarrBinary: YarrUpdateResult!");
  });

  it("has class-validator metadata for every GraphQL input field", () => {
    const metadata = getMetadataStorage();
    for (const inputType of YARR_INPUT_TYPES) {
      const validated = new Set(
        metadata.getTargetValidationMetadatas(inputType, "", false, false).map((entry) => entry.propertyName),
      );
      expect(validated, inputType.name).toEqual(new Set(YARR_INPUT_FIELDS[inputType.name]));
    }
  });

  it("uses nested validation, uniqueness, explicit maps, and no JSON scalar", () => {
    const source = readFileSync(resolve(process.cwd(), "src/graphql.types.ts"), "utf8");
    expect(source).toContain("@ValidateNested({ each: true })");
    expect(source).toContain("@ArrayUnique");
    expect(source).toContain("@MaxLength(MAX_IMPORT_TEXT_LENGTH)");
    expect(source).not.toMatch(/GraphQLJSON|JSONScalar|JSONObject/);
  });

  it("applies public Unraid permissions to every operation and avoids private imports", () => {
    const source = readFileSync(resolve(process.cwd(), "src/yarr.resolver.ts"), "utf8");
    const operations = [...EXPECTED_QUERIES, ...EXPECTED_MUTATIONS];
    for (const operation of operations) {
      const method = source.slice(0, source.indexOf(`async ${operation}(`));
      const decorator = Math.max(method.lastIndexOf("@Query"), method.lastIndexOf("@Mutation"));
      expect(method.slice(decorator, method.length)).toContain("@UsePermissions");
    }
    expect(source).toContain("@unraid/shared/use-permissions.directive.js");
    expect(source).not.toContain("@app/");
  });

  it("exports the exact mandatory public loader shape, not only truthy fields", async () => {
    expect(satisfiesLiveNestLoader(pluginExports)).toBe(true);
    expect(pluginExports.adapter).toBe("nestjs");
    expect(pluginExports.ApiModule).toBeTypeOf("function");
    expect(await pluginExports.graphqlSchemaExtension()).toContain("extend type Query");
    expect(satisfiesLiveNestLoader({ ...pluginExports, adapter: "private" })).toBe(false);
    expect(satisfiesLiveNestLoader({ ...pluginExports, ApiModule: {} })).toBe(false);
  });

  it("constructs the production module with only public Nest and Unraid dependencies", async () => {
    const application = await NestFactory.createApplicationContext(ApiModule, { logger: false });
    try {
      expect(application.get(YarrResolver)).toBeInstanceOf(YarrResolver);
    } finally {
      await application.close();
    }
  });
});
