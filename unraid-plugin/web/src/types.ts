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
