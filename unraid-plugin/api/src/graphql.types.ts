import { Type } from "class-transformer";
import {
  ArrayMaxSize,
  ArrayMinSize,
  ArrayUnique,
  IsArray,
  IsBoolean,
  IsEnum,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateIf,
  ValidateNested,
} from "class-validator";
import { Field, InputType, Int, ObjectType, registerEnumType } from "@nestjs/graphql";

export const MAX_IMPORT_TEXT_LENGTH = 256 * 1024;
const SERVICE_IDS = [
  "sonarr", "radarr", "prowlarr", "tautulli", "overseerr", "bazarr", "tracearr",
  "sabnzbd", "qbittorrent", "plex", "jellyfin",
] as const;
const OPAQUE_ID_LENGTH = 32;
const SERVICE_ID_MIN_LENGTH = 4;
const SERVICE_ID_MAX_LENGTH = 12;
const SERVICE_ID_PATTERN = /^[a-z][a-z0-9]*$/;

export enum YarrControlAction {
  START = 'START',
  STOP = 'STOP',
  RESTART = 'RESTART',
}

export enum YarrBindMode {
  LOOPBACK = "loopback",
  LAN = "lan",
  CUSTOM = "custom",
}

export enum YarrAuthMode {
  BEARER = "bearer",
  GOOGLE_OAUTH = "google-oauth",
  TRUSTED_GATEWAY = "trusted-gateway",
}

export enum YarrLogLevel {
  TRACE = "trace",
  DEBUG = "debug",
  INFO = "info",
  WARN = "warn",
  ERROR = "error",
}

export enum YarrSecretUpdateKind {
  PRESERVE = "preserve",
  SET = "set",
  CLEAR = "clear",
}

registerEnumType(YarrControlAction, { name: "YarrControlAction" });
registerEnumType(YarrBindMode, { name: "YarrBindMode" });
registerEnumType(YarrAuthMode, { name: "YarrAuthMode" });
registerEnumType(YarrLogLevel, { name: "YarrLogLevel" });
registerEnumType(YarrSecretUpdateKind, { name: "YarrSecretUpdateKind" });

@ObjectType()
export class YarrKeyValue {
  @Field(() => String)
  key!: string;

  @Field(() => String)
  value!: string;
}

@ObjectType()
export class YarrRuntime {
  @Field(() => String)
  state!: string;
  @Field(() => Int, { nullable: true })
  pid!: number | null;
  @Field(() => String, { nullable: true })
  version!: string | null;
  @Field(() => String)
  bindAddress!: string;
  @Field(() => Int)
  port!: number;
  @Field(() => Boolean)
  ready!: boolean;
  @Field(() => String)
  healthMessage!: string;
  @Field(() => Int, { nullable: true })
  uptimeSeconds!: number | null;
}

@ObjectType()
export class YarrPluginConfig {
  @Field(() => Boolean)
  enabled!: boolean;
  @Field(() => Boolean)
  dashboardWidgetEnable!: boolean;
  @Field(() => YarrBindMode)
  bindMode!: YarrBindMode;
  @Field(() => String)
  customHost!: string;
  @Field(() => Int)
  port!: number;
  @Field(() => YarrAuthMode)
  authMode!: YarrAuthMode;
  @Field(() => Boolean)
  tailscaleServe!: boolean;
  @Field(() => String)
  tailscaleHostname!: string;
  @Field(() => YarrLogLevel)
  logLevel!: YarrLogLevel;
  @Field(() => String)
  updateChannel!: string;
}

@ObjectType()
export class YarrServiceConfig {
  @Field(() => String)
  service!: string;
  @Field(() => Boolean)
  enabled!: boolean;
  @Field(() => String)
  baseUrl!: string;
  @Field(() => String, { nullable: true })
  username!: string | null;
  @Field(() => Boolean)
  hasPassword!: boolean;
  @Field(() => Boolean)
  hasApiKey!: boolean;
  @Field(() => [YarrKeyValue])
  extra!: YarrKeyValue[];
}

@ObjectType()
export class YarrConfig {
  @Field(() => YarrPluginConfig)
  plugin!: YarrPluginConfig;
  @Field(() => [YarrServiceConfig])
  services!: YarrServiceConfig[];
}

@ObjectType()
export class YarrConfigMutationResult {
  @Field(() => YarrConfig)
  config!: YarrConfig;
  @Field(() => Boolean)
  changed!: boolean;
  @Field(() => Boolean)
  restarted!: boolean;
  @Field(() => Boolean)
  rolledBack!: boolean;
  @Field(() => String, { nullable: true })
  error!: string | null;
}

@ObjectType()
export class YarrLogs {
  @Field(() => [String])
  lines!: string[];
  @Field(() => Boolean)
  truncated!: boolean;
}

@ObjectType()
export class YarrImportMapping {
  @Field(() => String)
  serviceId!: string;
  @Field(() => String, { nullable: true })
  baseUrl!: string | null;
  @Field(() => Boolean)
  hasUsername!: boolean;
  @Field(() => Boolean)
  hasPassword!: boolean;
  @Field(() => Boolean)
  hasApiKey!: boolean;
}

@ObjectType()
export class YarrImportPreview {
  @Field(() => String)
  previewId!: string;
  @Field(() => [YarrImportMapping])
  mappings!: YarrImportMapping[];
  @Field(() => [String])
  warnings!: string[];
}

@ObjectType()
export class YarrDiscoveryCandidate {
  @Field(() => String)
  candidateId!: string;
  @Field(() => String)
  source!: string;
  @Field(() => String)
  serviceId!: string;
  @Field(() => Int)
  confidence!: number;
  @Field(() => [String])
  reasons!: string[];
  @Field(() => String)
  baseUrl!: string;
  @Field(() => Boolean)
  hasCredential!: boolean;
}

@ObjectType()
export class YarrDiscoveryError {
  @Field(() => String)
  code!: string;
  @Field(() => String)
  message!: string;
}

@ObjectType()
export class YarrDiscoveryResult {
  @Field(() => String)
  discoveryId!: string;
  @Field(() => [YarrDiscoveryCandidate])
  candidates!: YarrDiscoveryCandidate[];
  @Field(() => [YarrDiscoveryError])
  errors!: YarrDiscoveryError[];
}

@ObjectType()
export class YarrUpdateStatus {
  @Field(() => String)
  installedVersion!: string;
  @Field(() => String)
  packagedVersion!: string;
  @Field(() => String)
  availableVersion!: string;
  @Field(() => Boolean)
  updateAvailable!: boolean;
  @Field(() => Boolean)
  usingOverlay!: boolean;
  @Field(() => Boolean)
  rollbackAvailable!: boolean;
  @Field(() => Boolean)
  rolledBack!: boolean;
  @Field(() => String)
  message!: string;
}

@ObjectType()
export class YarrUpdateResult extends YarrUpdateStatus {}

@InputType()
export class YarrSecretUpdateInput {
  @Field(() => YarrSecretUpdateKind)
  @IsEnum(YarrSecretUpdateKind)
  kind!: YarrSecretUpdateKind;

  @Field(() => String, { nullable: true })
  @ValidateIf((input: YarrSecretUpdateInput) => input.kind === YarrSecretUpdateKind.SET)
  @IsString()
  @MinLength(1)
  @MaxLength(64 * 1024)
  value?: string;
}

@InputType()
export class SaveYarrServiceInput {
  @Field(() => String)
  @IsString()
  @MinLength(SERVICE_ID_MIN_LENGTH)
  @MaxLength(SERVICE_ID_MAX_LENGTH)
  @Matches(SERVICE_ID_PATTERN)
  @IsIn(SERVICE_IDS)
  service!: string;

  @Field(() => Boolean, { nullable: true })
  @IsOptional()
  @IsBoolean()
  enabled?: boolean;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(2048)
  baseUrl?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(1024)
  username?: string;

  @Field(() => YarrSecretUpdateInput, { nullable: true })
  @IsOptional()
  @ValidateNested()
  @Type(() => YarrSecretUpdateInput)
  password?: YarrSecretUpdateInput;

  @Field(() => YarrSecretUpdateInput, { nullable: true })
  @IsOptional()
  @ValidateNested()
  @Type(() => YarrSecretUpdateInput)
  apiKey?: YarrSecretUpdateInput;
}

@InputType()
export class SaveYarrConfigInput {
  @Field(() => Boolean, { nullable: true })
  @IsOptional()
  @IsBoolean()
  enabled?: boolean;
  @Field(() => Boolean, { nullable: true })
  @IsOptional()
  @IsBoolean()
  dashboardWidgetEnable?: boolean;
  @Field(() => YarrBindMode, { nullable: true })
  @IsOptional()
  @IsEnum(YarrBindMode)
  bindMode?: YarrBindMode;
  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(253)
  customHost?: string;
  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(65535)
  port?: number;
  @Field(() => YarrAuthMode, { nullable: true })
  @IsOptional()
  @IsEnum(YarrAuthMode)
  authMode?: YarrAuthMode;
  @Field(() => Boolean, { nullable: true })
  @IsOptional()
  @IsBoolean()
  tailscaleServe?: boolean;
  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(253)
  tailscaleHostname?: string;
  @Field(() => YarrLogLevel, { nullable: true })
  @IsOptional()
  @IsEnum(YarrLogLevel)
  logLevel?: YarrLogLevel;
  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsIn(["stable"])
  updateChannel?: "stable";
  @Field(() => YarrSecretUpdateInput, { nullable: true })
  @IsOptional()
  @ValidateNested()
  @Type(() => YarrSecretUpdateInput)
  bearerToken?: YarrSecretUpdateInput;
  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(1024)
  googleClientId?: string;
  @Field(() => YarrSecretUpdateInput, { nullable: true })
  @IsOptional()
  @ValidateNested()
  @Type(() => YarrSecretUpdateInput)
  googleClientSecret?: YarrSecretUpdateInput;
  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(8192)
  trustedGatewayHosts?: string;
  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(8192)
  trustedGatewayOrigins?: string;
  @Field(() => [SaveYarrServiceInput], { nullable: true })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(SERVICE_IDS.length)
  @ArrayUnique((service: SaveYarrServiceInput) => service.service)
  @ValidateNested({ each: true })
  @Type(() => SaveYarrServiceInput)
  services?: SaveYarrServiceInput[];
}

@InputType()
export class PreviewYarrImportInput {
  @Field(() => String)
  @IsString()
  @MaxLength(MAX_IMPORT_TEXT_LENGTH)
  text!: string;
}

@InputType()
export class YarrCredentialConsentInput {
  @Field(() => String)
  @IsString()
  @MinLength(SERVICE_ID_MIN_LENGTH)
  @MaxLength(SERVICE_ID_MAX_LENGTH)
  @Matches(SERVICE_ID_PATTERN)
  @IsIn(SERVICE_IDS)
  serviceId!: string;
  @Field(() => Boolean)
  @IsBoolean()
  consent!: boolean;
}

@InputType()
export class ApplyYarrImportInput {
  @Field(() => String)
  @IsString()
  @MinLength(OPAQUE_ID_LENGTH)
  @MaxLength(OPAQUE_ID_LENGTH)
  @Matches(/^[A-Za-z0-9_-]+$/)
  previewId!: string;
  @Field(() => [String])
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(SERVICE_IDS.length)
  @ArrayUnique()
  @IsString({ each: true })
  @MinLength(SERVICE_ID_MIN_LENGTH, { each: true })
  @MaxLength(SERVICE_ID_MAX_LENGTH, { each: true })
  @Matches(SERVICE_ID_PATTERN, { each: true })
  @IsIn(SERVICE_IDS, { each: true })
  selectedServiceIds!: string[];
  @Field(() => [YarrCredentialConsentInput])
  @IsArray()
  @ArrayMaxSize(SERVICE_IDS.length)
  @ArrayUnique((entry: YarrCredentialConsentInput) => entry.serviceId)
  @ValidateNested({ each: true })
  @Type(() => YarrCredentialConsentInput)
  credentialConsent!: YarrCredentialConsentInput[];
}

@InputType()
export class ApplyYarrDiscoveryInput {
  @Field(() => String)
  @IsString()
  @MinLength(OPAQUE_ID_LENGTH)
  @MaxLength(OPAQUE_ID_LENGTH)
  @Matches(/^[A-Za-z0-9_-]+$/)
  discoveryId!: string;
  @Field(() => [String])
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(256)
  @ArrayUnique()
  @IsString({ each: true })
  @MinLength(OPAQUE_ID_LENGTH, { each: true })
  @MaxLength(OPAQUE_ID_LENGTH, { each: true })
  @Matches(/^[A-Za-z0-9_-]+$/, { each: true })
  selectedCandidateIds!: string[];
  @Field(() => [YarrCredentialConsentInput])
  @IsArray()
  @ArrayMaxSize(SERVICE_IDS.length)
  @ArrayUnique((entry: YarrCredentialConsentInput) => entry.serviceId)
  @ValidateNested({ each: true })
  @Type(() => YarrCredentialConsentInput)
  credentialConsent!: YarrCredentialConsentInput[];
}

export const YARR_INPUT_TYPES = [
  YarrSecretUpdateInput,
  SaveYarrServiceInput,
  SaveYarrConfigInput,
  PreviewYarrImportInput,
  YarrCredentialConsentInput,
  ApplyYarrImportInput,
  ApplyYarrDiscoveryInput,
] as const;

export const YARR_INPUT_FIELDS: Readonly<Record<string, readonly string[]>> = {
  YarrSecretUpdateInput: ["kind", "value"],
  SaveYarrServiceInput: ["service", "enabled", "baseUrl", "username", "password", "apiKey"],
  SaveYarrConfigInput: [
    "enabled", "dashboardWidgetEnable", "bindMode", "customHost", "port", "authMode", "tailscaleServe",
    "tailscaleHostname", "logLevel", "updateChannel", "bearerToken", "googleClientId",
    "googleClientSecret", "trustedGatewayHosts", "trustedGatewayOrigins", "services",
  ],
  PreviewYarrImportInput: ["text"],
  YarrCredentialConsentInput: ["serviceId", "consent"],
  ApplyYarrImportInput: ["previewId", "selectedServiceIds", "credentialConsent"],
  ApplyYarrDiscoveryInput: ["discoveryId", "selectedCandidateIds", "credentialConsent"],
};

export const graphqlSchemaExtension = async () => `
  enum YarrControlAction { START STOP RESTART }
  enum YarrBindMode { LOOPBACK LAN CUSTOM }
  enum YarrAuthMode { BEARER GOOGLE_OAUTH TRUSTED_GATEWAY }
  enum YarrLogLevel { TRACE DEBUG INFO WARN ERROR }
  enum YarrSecretUpdateKind { PRESERVE SET CLEAR }

  type YarrKeyValue { key: String!, value: String! }
  type YarrRuntime { state: String!, pid: Int, version: String, bindAddress: String!, port: Int!, ready: Boolean!, healthMessage: String!, uptimeSeconds: Int }
  type YarrPluginConfig { enabled: Boolean!, dashboardWidgetEnable: Boolean!, bindMode: YarrBindMode!, customHost: String!, port: Int!, authMode: YarrAuthMode!, tailscaleServe: Boolean!, tailscaleHostname: String!, logLevel: YarrLogLevel!, updateChannel: String! }
  type YarrServiceConfig { service: String!, enabled: Boolean!, baseUrl: String!, username: String, hasPassword: Boolean!, hasApiKey: Boolean!, extra: [YarrKeyValue!]! }
  type YarrConfig { plugin: YarrPluginConfig!, services: [YarrServiceConfig!]! }
  type YarrConfigMutationResult { config: YarrConfig!, changed: Boolean!, restarted: Boolean!, rolledBack: Boolean!, error: String }
  type YarrLogs { lines: [String!]!, truncated: Boolean! }
  type YarrImportMapping { serviceId: String!, baseUrl: String, hasUsername: Boolean!, hasPassword: Boolean!, hasApiKey: Boolean! }
  type YarrImportPreview { previewId: String!, mappings: [YarrImportMapping!]!, warnings: [String!]! }
  type YarrDiscoveryCandidate { candidateId: String!, source: String!, serviceId: String!, confidence: Int!, reasons: [String!]!, baseUrl: String!, hasCredential: Boolean! }
  type YarrDiscoveryError { code: String!, message: String! }
  type YarrDiscoveryResult { discoveryId: String!, candidates: [YarrDiscoveryCandidate!]!, errors: [YarrDiscoveryError!]! }
  type YarrUpdateStatus { installedVersion: String!, packagedVersion: String!, availableVersion: String!, updateAvailable: Boolean!, usingOverlay: Boolean!, rollbackAvailable: Boolean!, rolledBack: Boolean!, message: String! }
  type YarrUpdateResult { installedVersion: String!, packagedVersion: String!, availableVersion: String!, updateAvailable: Boolean!, usingOverlay: Boolean!, rollbackAvailable: Boolean!, rolledBack: Boolean!, message: String! }

  input YarrSecretUpdateInput { kind: YarrSecretUpdateKind!, value: String }
  input SaveYarrServiceInput { service: String!, enabled: Boolean, baseUrl: String, username: String, password: YarrSecretUpdateInput, apiKey: YarrSecretUpdateInput }
  input SaveYarrConfigInput { enabled: Boolean, dashboardWidgetEnable: Boolean, bindMode: YarrBindMode, customHost: String, port: Int, authMode: YarrAuthMode, tailscaleServe: Boolean, tailscaleHostname: String, logLevel: YarrLogLevel, updateChannel: String, bearerToken: YarrSecretUpdateInput, googleClientId: String, googleClientSecret: YarrSecretUpdateInput, trustedGatewayHosts: String, trustedGatewayOrigins: String, services: [SaveYarrServiceInput!] }
  input PreviewYarrImportInput { text: String! }
  input YarrCredentialConsentInput { serviceId: String!, consent: Boolean! }
  input ApplyYarrImportInput { previewId: String!, selectedServiceIds: [String!]!, credentialConsent: [YarrCredentialConsentInput!]! }
  input ApplyYarrDiscoveryInput { discoveryId: String!, selectedCandidateIds: [String!]!, credentialConsent: [YarrCredentialConsentInput!]! }

  extend type Query {
    yarrRuntime: YarrRuntime!
    yarrConfig: YarrConfig!
    yarrDiscoveredServices: YarrDiscoveryResult!
    yarrLogs(lines: Int = 200): YarrLogs!
    yarrUpdateStatus: YarrUpdateStatus!
  }

  extend type Mutation {
    saveYarrConfig(input: SaveYarrConfigInput!): YarrConfigMutationResult!
    controlYarr(action: YarrControlAction!): YarrRuntime!
    previewYarrImport(input: PreviewYarrImportInput!): YarrImportPreview!
    applyYarrImport(input: ApplyYarrImportInput!): YarrConfigMutationResult!
    applyYarrDiscovery(input: ApplyYarrDiscoveryInput!): YarrConfigMutationResult!
    updateYarrBinary(version: String!): YarrUpdateResult!
    resetYarrBinary: YarrUpdateResult!
    rollbackYarrBinary: YarrUpdateResult!
  }
`;
