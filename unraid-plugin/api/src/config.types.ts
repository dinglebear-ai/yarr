export type BindMode = "loopback" | "lan" | "custom";
export type AuthMode = "bearer" | "google-oauth" | "trusted-gateway";
export type LogLevel = "trace" | "debug" | "info" | "warn" | "error";

export interface YarrPluginConfig {
  enabled: boolean;
  bindMode: BindMode;
  customHost: string;
  port: number;
  authMode: AuthMode;
  tailscaleServe: boolean;
  tailscaleHostname: string;
  logLevel: LogLevel;
  updateChannel: "stable";
}

export interface YarrServiceConfig {
  service: string;
  enabled: boolean;
  baseUrl: string;
  username: string | null;
  hasPassword: boolean;
  hasApiKey: boolean;
  extra: Record<string, string>;
}

export interface ParsedPluginConfig {
  values: Record<string, string>;
}

export interface ParsedYarrEnvironment {
  values: Record<string, string>;
}

export interface ParsedConfigState {
  plugin: ParsedPluginConfig;
  env: ParsedYarrEnvironment;
}

export type SecretUpdate =
  | { kind: "preserve" }
  | { kind: "set"; value: string }
  | { kind: "clear" };

export interface SaveYarrConfigInput {
  enabled?: boolean;
  bindMode?: BindMode;
  customHost?: string;
  port?: number;
  authMode?: AuthMode;
  tailscaleServe?: boolean;
  tailscaleHostname?: string;
  logLevel?: LogLevel;
  updateChannel?: "stable";
  bearerToken?: SecretUpdate;
  googleClientId?: string;
  googleClientSecret?: SecretUpdate;
  trustedGatewayHosts?: string;
  trustedGatewayOrigins?: string;
}

export interface YarrConfigView {
  plugin: YarrPluginConfig;
  services: YarrServiceConfig[];
}
