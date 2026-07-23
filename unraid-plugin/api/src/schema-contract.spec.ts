import { strict as assert } from "node:assert";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { Module, type INestApplicationContext } from "@nestjs/common";
import { GraphQLSchemaBuilderModule, GraphQLSchemaFactory } from "@nestjs/graphql";
import { NestFactory } from "@nestjs/core";
import { plainToInstance } from "class-transformer";
import { getMetadataStorage, validate } from "class-validator";
import {
  Kind,
  buildSchema,
  extendSchema,
  parse,
  type DocumentNode,
  type FieldDefinitionNode,
  type GraphQLNamedType,
  type GraphQLSchema,
  type GraphQLType,
} from "graphql";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { ApiModule } from "./api.module";
import * as pluginExports from "./index";
import {
  ApplyYarrDiscoveryInput,
  ApplyYarrImportInput,
  SaveYarrServiceInput,
  YARR_INPUT_FIELDS,
  YARR_INPUT_TYPES,
  YarrCredentialConsentInput,
  graphqlSchemaExtension,
} from "./graphql.types";
import { YarrResolver } from "./yarr.resolver";

@Module({ imports: [GraphQLSchemaBuilderModule] })
class SchemaFactoryModule {}

const BASE_SCHEMA = "type Query { _base: Boolean } type Mutation { _base: Boolean }";

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
  "rollbackYarrBinary",
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

type CanonicalArgument = { name: string; type: string; defaultValue: string };
type CanonicalField = { name: string; type: string; arguments?: CanonicalArgument[]; defaultValue?: string };
type CanonicalType =
  | { kind: "enum"; values: string[] }
  | { kind: "input"; fields: CanonicalField[] }
  | { kind: "object"; fields: CanonicalField[] };
type CanonicalContract = {
  roots: Record<"Mutation" | "Query", CanonicalField[]>;
  types: Record<string, CanonicalType>;
};

function defaultValue(value: unknown): string {
  return value === undefined ? "<undefined>" : JSON.stringify(value);
}

function fieldContract(field: {
  name: string;
  type: GraphQLType;
  args?: readonly { name: string; type: GraphQLType; defaultValue: unknown }[];
}): CanonicalField {
  const result: CanonicalField = { name: field.name, type: String(field.type) };
  if (field.args !== undefined) {
    result.arguments = [...field.args]
      .map((argument) => ({
        name: argument.name,
        type: String(argument.type),
        defaultValue: defaultValue(argument.defaultValue),
      }))
      .sort((left, right) => left.name.localeCompare(right.name));
  }
  return result;
}

function canonicalContract(schema: GraphQLSchema): CanonicalContract {
  const types: Record<string, CanonicalType> = {};
  const seen = new Set<string>();

  const visit = (type: GraphQLType): void => {
    let named = type as GraphQLType & { ofType?: GraphQLType };
    while (named.ofType !== undefined) named = named.ofType as typeof named;
    const concrete = named as GraphQLNamedType;
    const kind = concrete.constructor.name;
    if (kind === "GraphQLScalarType" || concrete.name.startsWith("__") || seen.has(concrete.name)) return;
    seen.add(concrete.name);
    if (kind === "GraphQLEnumType") {
      const enumType = concrete as GraphQLNamedType & { getValues(): Array<{ name: string }> };
      types[concrete.name] = {
        kind: "enum",
        values: enumType.getValues().map((value) => value.name).sort(),
      };
      return;
    }
    if (kind === "GraphQLInputObjectType") {
      const inputType = concrete as GraphQLNamedType & { getFields(): Record<string, { name: string; type: GraphQLType; defaultValue: unknown }> };
      const fields = Object.values(inputType.getFields())
        .map((field) => ({
          name: field.name,
          type: String(field.type),
          defaultValue: defaultValue(field.defaultValue),
        }))
        .sort((left, right) => left.name.localeCompare(right.name));
      types[concrete.name] = { kind: "input", fields };
      for (const field of Object.values(inputType.getFields())) visit(field.type);
      return;
    }
    if (kind === "GraphQLObjectType") {
      const objectType = concrete as GraphQLNamedType & { getFields(): Record<string, { name: string; type: GraphQLType; args: Array<{ name: string; type: GraphQLType; defaultValue: unknown }> }> };
      const fields = Object.values(objectType.getFields())
        .map((field) => fieldContract(field))
        .sort((left, right) => left.name.localeCompare(right.name));
      types[concrete.name] = { kind: "object", fields };
      for (const field of Object.values(objectType.getFields())) {
        visit(field.type);
        for (const argument of field.args) visit(argument.type);
      }
      return;
    }
    throw new Error(`unsupported reachable GraphQL type ${concrete.name}`);
  };

  const rootFields = (rootName: "Mutation" | "Query") => {
    const root = rootName === "Query" ? schema.getQueryType() : schema.getMutationType();
    if (!root) throw new Error(`missing ${rootName} root`);
    const fields = Object.values(root.getFields()).filter((field) => field.name !== "_base");
    for (const field of fields) {
      visit(field.type);
      for (const argument of field.args) visit(argument.type);
    }
    return fields.map((field) => fieldContract(field)).sort((left, right) => left.name.localeCompare(right.name));
  };

  return {
    roots: { Mutation: rootFields("Mutation"), Query: rootFields("Query") },
    types: Object.fromEntries(Object.entries(types).sort(([left], [right]) => left.localeCompare(right))),
  };
}

function extensionSchema(extension: string): GraphQLSchema {
  return extendSchema(buildSchema(BASE_SCHEMA), parse(extension));
}

function assertSchemaParity(decorated: GraphQLSchema, extension: GraphQLSchema): void {
  assert.deepStrictEqual(canonicalContract(extension), canonicalContract(decorated));
}

function validationConstraints(value: object, property: string): Promise<Set<string>> {
  return validate(value, { whitelist: true, forbidNonWhitelisted: true }).then((errors) =>
    new Set(errors.find((error) => error.property === property)?.constraints
      ? Object.keys(errors.find((error) => error.property === property)!.constraints!)
      : []),
  );
}

function installVitestParameterMetadata(): void {
  for (const method of [
    "yarrLogs",
    "saveYarrConfig",
    "controlYarr",
    "previewYarrImport",
    "applyYarrImport",
    "applyYarrDiscovery",
    "updateYarrBinary",
    "rollbackYarrBinary",
  ]) {
    Reflect.defineMetadata("design:paramtypes", [Object], YarrResolver.prototype, method);
  }
}

describe("GraphQL extension contract", () => {
  let schemaApplication: INestApplicationContext;
  let decoratedSchema: GraphQLSchema;
  let extensionText: string;

  beforeAll(async () => {
    installVitestParameterMetadata();
    schemaApplication = await NestFactory.createApplicationContext(SchemaFactoryModule, { logger: false });
    decoratedSchema = await schemaApplication.get(GraphQLSchemaFactory).create([YarrResolver], { skipCheck: true });
    extensionText = await graphqlSchemaExtension();
  });

  afterAll(async () => {
    await schemaApplication.close();
  });

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
    expect(schema).toContain("rollbackYarrBinary: YarrUpdateResult!");
    expect(schema).toContain("operation: YarrUpdateOperation!");
    expect(schema).toContain("outcome: YarrUpdateOutcome!");
    expect(schema).toContain("cleanupPending: Boolean!");
    expect(schema).toContain("recoveryIdentifier: String!");
    expect(schema).toContain("enum YarrUpdateOperation { CHECK APPLY RESET ROLLBACK }");
    expect(schema).toContain("APPLY_RESTORATION_INCOMPLETE");
    expect(schema).toContain("ROLLBACK_RESTORATION_INCOMPLETE");
  });

  it("matches every reachable decorated and hand-maintained schema contract bidirectionally", () => {
    assertSchemaParity(decoratedSchema, extensionSchema(extensionText));
  });

  it.each([
    ["type", "port: Int!", "port: String!"],
    ["nullability", "version: String, bindAddress", "version: String!, bindAddress"],
    ["default", "lines: Int = 200", "lines: Int = 201"],
    ["enum", "enum YarrControlAction { START STOP RESTART }", "enum YarrControlAction { START STOP }"],
    ["argument", "controlYarr(action: YarrControlAction!", "controlYarr(command: YarrControlAction!"],
  ])("detects %s drift in the hand-maintained extension", (_kind, before, after) => {
    const mutated = extensionText.replace(before, after);
    expect(mutated).not.toBe(extensionText);
    expect(() => assertSchemaParity(decoratedSchema, extensionSchema(mutated))).toThrow();
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

  it("enforces exact opaque ID length and base64url constraints in whitelist mode", async () => {
    for (const length of [31, 33]) {
      const importInput = plainToInstance(ApplyYarrImportInput, {
        previewId: "p".repeat(length),
        selectedServiceIds: ["sonarr"],
        credentialConsent: [],
      });
      const discoveryInput = plainToInstance(ApplyYarrDiscoveryInput, {
        discoveryId: "d".repeat(length),
        selectedCandidateIds: ["c".repeat(32)],
        credentialConsent: [],
      });
      expect(await validationConstraints(importInput, "previewId")).toContain(length < 32 ? "minLength" : "maxLength");
      expect(await validationConstraints(discoveryInput, "discoveryId")).toContain(length < 32 ? "minLength" : "maxLength");
    }

    for (const [candidateId, constraint] of [
      ["c".repeat(31), "minLength"],
      ["c".repeat(33), "maxLength"],
      [`${"c".repeat(31)}!`, "matches"],
    ] as const) {
      const input = plainToInstance(ApplyYarrDiscoveryInput, {
        discoveryId: "d".repeat(32),
        selectedCandidateIds: [candidateId],
        credentialConsent: [],
      });
      expect(await validationConstraints(input, "selectedCandidateIds")).toContain(constraint);
    }
  });

  it("bounds every catalog service ID input in whitelist mode", async () => {
    for (const [serviceId, constraint] of [["abc", "minLength"], ["x".repeat(13), "maxLength"]] as const) {
      const service = plainToInstance(SaveYarrServiceInput, { service: serviceId });
      const consent = plainToInstance(YarrCredentialConsentInput, { serviceId, consent: false });
      const apply = plainToInstance(ApplyYarrImportInput, {
        previewId: "p".repeat(32),
        selectedServiceIds: [serviceId],
        credentialConsent: [],
      });
      expect(await validationConstraints(service, "service")).toContain(constraint);
      expect(await validationConstraints(consent, "serviceId")).toContain(constraint);
      expect(await validationConstraints(apply, "selectedServiceIds")).toContain(constraint);
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
