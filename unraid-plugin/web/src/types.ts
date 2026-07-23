export type YarrControlAction = "START" | "STOP" | "RESTART";
export type YarrBindMode = "LOOPBACK" | "LAN" | "CUSTOM";
export type YarrAuthMode = "BEARER" | "GOOGLE_OAUTH" | "TRUSTED_GATEWAY";
export type YarrLogLevel = "TRACE" | "DEBUG" | "INFO" | "WARN" | "ERROR";
export type YarrSecretUpdateKind = "PRESERVE" | "SET" | "CLEAR";

export interface YarrRuntime {
  state: string;
  pid: number | null;
  version: string | null;
  bindAddress: string;
  port: number;
  ready: boolean;
  healthMessage: string;
  uptimeSeconds: number | null;
}

export interface YarrKeyValue {
  key: string;
  value: string;
}

export interface YarrPluginConfig {
  enabled: boolean;
  dashboardWidgetEnable: boolean;
  bindMode: YarrBindMode;
  customHost: string;
  port: number;
  authMode: YarrAuthMode;
  tailscaleServe: boolean;
  tailscaleHostname: string;
  logLevel: YarrLogLevel;
  updateChannel: string;
}

export interface YarrServiceConfig {
  service: string;
  enabled: boolean;
  baseUrl: string;
  username: string | null;
  hasPassword: boolean;
  hasApiKey: boolean;
  extra: YarrKeyValue[];
}

export interface YarrConfig {
  plugin: YarrPluginConfig;
  services: YarrServiceConfig[];
}

export interface YarrConfigMutationResult {
  config: YarrConfig;
  changed: boolean;
  restarted: boolean;
  rolledBack: boolean;
  error: string | null;
}

export type YarrSecretUpdate =
  | { kind: "PRESERVE" }
  | { kind: "CLEAR" }
  | { kind: "SET"; value: string };

export interface SaveYarrServiceInput {
  service: string;
  enabled?: boolean;
  baseUrl?: string;
  username?: string;
  password?: YarrSecretUpdate;
  apiKey?: YarrSecretUpdate;
}

export interface SaveYarrConfigInput {
  enabled?: boolean;
  dashboardWidgetEnable?: boolean;
  bindMode?: YarrBindMode;
  customHost?: string;
  port?: number;
  authMode?: YarrAuthMode;
  tailscaleServe?: boolean;
  tailscaleHostname?: string;
  logLevel?: YarrLogLevel;
  updateChannel?: string;
  bearerToken?: YarrSecretUpdate;
  googleClientId?: string;
  googleClientSecret?: YarrSecretUpdate;
  trustedGatewayHosts?: string;
  trustedGatewayOrigins?: string;
  services?: SaveYarrServiceInput[];
}

export interface YarrLogs {
  lines: string[];
  truncated: boolean;
}

export interface YarrImportMapping {
  serviceId: string;
  baseUrl: string | null;
  hasUsername: boolean;
  hasPassword: boolean;
  hasApiKey: boolean;
}

export interface YarrImportPreview {
  previewId: string;
  mappings: YarrImportMapping[];
  warnings: string[];
}

export interface YarrDiscoveryCandidate {
  candidateId: string;
  source: string;
  serviceId: string;
  confidence: number;
  reasons: string[];
  baseUrl: string;
  hasCredential: boolean;
}

export interface YarrDiscoveryError {
  code: string;
  message: string;
}

export interface YarrDiscoveryResult {
  discoveryId: string;
  candidates: YarrDiscoveryCandidate[];
  errors: YarrDiscoveryError[];
}

export interface YarrUpdateStatus {
  installedVersion: string;
  packagedVersion: string;
  availableVersion: string;
  updateAvailable: boolean;
  usingOverlay: boolean;
  rolledBack: boolean;
  message: string;
}

export type YarrUpdateResult = YarrUpdateStatus;

export interface YarrCredentialConsentInput {
  serviceId: string;
  consent: boolean;
}

export interface ApplyYarrImportInput {
  previewId: string;
  selectedServiceIds: string[];
  credentialConsent: YarrCredentialConsentInput[];
}

export interface ApplyYarrDiscoveryInput {
  discoveryId: string;
  selectedCandidateIds: string[];
  credentialConsent: YarrCredentialConsentInput[];
}

export interface YarrAuthDraft {
  bearerToken: YarrSecretUpdate;
  googleClientId: string;
  googleClientSecret: YarrSecretUpdate;
  trustedGatewayHosts: string;
  trustedGatewayOrigins: string;
}

export interface YarrServiceDraft extends YarrServiceConfig {
  password: YarrSecretUpdate;
  apiKey: YarrSecretUpdate;
}
