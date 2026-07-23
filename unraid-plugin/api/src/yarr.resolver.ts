import { Args, Int, Mutation, Query, Resolver } from "@nestjs/graphql";
import { AuthAction, Resource, UsePermissions } from "@unraid/shared/use-permissions.directive.js";

import type { SaveConfigResult } from "./config.service";
import { ConfigService } from "./config.service";
import type {
  SaveYarrConfigInput as DomainSaveYarrConfigInput,
  SecretUpdate,
  YarrConfigView,
} from "./config.types";
import { DiscoveryService, type DiscoveryPreview } from "./discovery.service";
import {
  ApplyYarrDiscoveryInput,
  ApplyYarrImportInput,
  MAX_IMPORT_TEXT_LENGTH,
  PreviewYarrImportInput,
  SaveYarrConfigInput,
  YarrSecretUpdateInput,
  YarrConfig,
  YarrConfigMutationResult,
  YarrControlAction,
  YarrDiscoveryResult,
  YarrImportPreview,
  YarrLogs,
  YarrRuntime,
  YarrUpdateResult,
  YarrUpdateStatus,
} from "./graphql.types";
import { ImportService, type ImportPreview } from "./import.service";
import { LogService } from "./log.service";
import { RuntimeService, type RuntimeState } from "./runtime.service";
import { UpdateService, type UpdateStatus } from "./update.service";

const MAX_LOG_LINES = 500;
const SECRET_EXTRA_KEY = /(?:PASSWORD|TOKEN|API[_-]?KEY|SECRET|CREDENTIAL|AUTH)/i;

@Resolver()
export class YarrResolver {
  constructor(
    private readonly runtime: RuntimeService,
    private readonly config: ConfigService,
    private readonly logs: LogService,
    private readonly imports: ImportService,
    private readonly discovery: DiscoveryService,
    private readonly updates: UpdateService,
  ) {}

  @Query(() => YarrRuntime)
  @UsePermissions({ action: AuthAction.READ_ANY, resource: Resource.SERVICES })
  async yarrRuntime(): Promise<YarrRuntime> {
    return mapRuntime(await this.runtime.status());
  }

  @Query(() => YarrConfig)
  @UsePermissions({ action: AuthAction.READ_ANY, resource: Resource.SERVICES })
  async yarrConfig(): Promise<YarrConfig> {
    return mapConfig(await this.config.read());
  }

  @Query(() => YarrDiscoveryResult)
  @UsePermissions({ action: AuthAction.READ_ANY, resource: Resource.SERVICES })
  async yarrDiscoveredServices(): Promise<YarrDiscoveryResult> {
    return mapDiscovery(await this.discovery.discover());
  }

  @Query(() => YarrLogs)
  @UsePermissions({ action: AuthAction.READ_ANY, resource: Resource.SERVICES })
  async yarrLogs(@Args("lines", { type: () => Int, defaultValue: 200 }) lines = 200): Promise<YarrLogs> {
    if (!Number.isInteger(lines) || lines < 1 || lines > MAX_LOG_LINES) {
      throw new Error("lines must be an integer from 1 to 500");
    }
    const result = await this.logs.read();
    return {
      lines: result.lines.slice(-lines),
      truncated: result.truncated || result.lines.length > lines,
    };
  }

  @Query(() => YarrUpdateStatus)
  @UsePermissions({ action: AuthAction.READ_ANY, resource: Resource.SERVICES })
  async yarrUpdateStatus(): Promise<YarrUpdateStatus> {
    return mapUpdate(await this.updates.status());
  }

  @Mutation(() => YarrConfigMutationResult)
  @UsePermissions({ action: AuthAction.UPDATE_ANY, resource: Resource.SERVICES })
  async saveYarrConfig(@Args("input") input: SaveYarrConfigInput): Promise<YarrConfigMutationResult> {
    return mapMutation(await this.config.save(toConfigInput(input)));
  }

  @Mutation(() => YarrRuntime)
  @UsePermissions({ action: AuthAction.UPDATE_ANY, resource: Resource.SERVICES })
  async controlYarr(@Args("action", { type: () => YarrControlAction }) action: YarrControlAction): Promise<YarrRuntime> {
    if (action === YarrControlAction.START) return mapRuntime(await this.runtime.start());
    if (action === YarrControlAction.STOP) return mapRuntime(await this.runtime.stop());
    if (action === YarrControlAction.RESTART) return mapRuntime(await this.runtime.restart());
    throw new Error("unsupported Yarr control action");
  }

  @Mutation(() => YarrImportPreview)
  @UsePermissions({ action: AuthAction.UPDATE_ANY, resource: Resource.SERVICES })
  async previewYarrImport(@Args("input") input: PreviewYarrImportInput): Promise<YarrImportPreview> {
    return mapImportPreview(await this.imports.preview(parseImportText(input.text)));
  }

  @Mutation(() => YarrConfigMutationResult)
  @UsePermissions({ action: AuthAction.UPDATE_ANY, resource: Resource.SERVICES })
  async applyYarrImport(@Args("input") input: ApplyYarrImportInput): Promise<YarrConfigMutationResult> {
    return mapMutation(await this.imports.apply({
      previewId: input.previewId,
      selectedServiceIds: [...input.selectedServiceIds],
      credentialConsent: consentMap(input.credentialConsent),
    }));
  }

  @Mutation(() => YarrConfigMutationResult)
  @UsePermissions({ action: AuthAction.UPDATE_ANY, resource: Resource.SERVICES })
  async applyYarrDiscovery(@Args("input") input: ApplyYarrDiscoveryInput): Promise<YarrConfigMutationResult> {
    return mapMutation(await this.discovery.apply({
      discoveryId: input.discoveryId,
      selectedCandidateIds: [...input.selectedCandidateIds],
      credentialConsent: consentMap(input.credentialConsent),
    }));
  }

  @Mutation(() => YarrUpdateResult)
  @UsePermissions({ action: AuthAction.UPDATE_ANY, resource: Resource.SERVICES })
  async updateYarrBinary(@Args("version") version: string): Promise<YarrUpdateResult> {
    return mapUpdate(await this.updates.apply(version));
  }

  @Mutation(() => YarrUpdateResult)
  @UsePermissions({ action: AuthAction.UPDATE_ANY, resource: Resource.SERVICES })
  async resetYarrBinary(): Promise<YarrUpdateResult> {
    return mapUpdate(await this.updates.reset());
  }
}

function mapRuntime(value: RuntimeState): YarrRuntime {
  return {
    state: value.state,
    pid: value.pid,
    version: value.version,
    bindAddress: value.bindAddress,
    port: value.port,
    ready: value.ready,
    healthMessage: value.healthMessage,
    uptimeSeconds: value.uptimeSeconds,
  };
}

function mapConfig(value: YarrConfigView): YarrConfig {
  return {
    plugin: {
      enabled: value.plugin.enabled,
      bindMode: value.plugin.bindMode as YarrConfig["plugin"]["bindMode"],
      customHost: value.plugin.customHost,
      port: value.plugin.port,
      authMode: value.plugin.authMode as YarrConfig["plugin"]["authMode"],
      tailscaleServe: value.plugin.tailscaleServe,
      tailscaleHostname: value.plugin.tailscaleHostname,
      logLevel: value.plugin.logLevel as YarrConfig["plugin"]["logLevel"],
      updateChannel: value.plugin.updateChannel,
    },
    services: value.services.map((service) => ({
      service: service.service,
      enabled: service.enabled,
      baseUrl: service.baseUrl,
      username: service.username,
      hasPassword: service.hasPassword,
      hasApiKey: service.hasApiKey,
      extra: Object.entries(service.extra)
        .filter(([key]) => !SECRET_EXTRA_KEY.test(key))
        .map(([key, entryValue]) => ({ key, value: entryValue })),
    })),
  };
}

function mapMutation(value: SaveConfigResult): YarrConfigMutationResult {
  return {
    config: mapConfig(value.config),
    changed: value.changed,
    restarted: value.restarted,
    rolledBack: value.rolledBack,
    error: value.error ?? null,
  };
}

function mapImportPreview(value: ImportPreview): YarrImportPreview {
  return {
    previewId: value.previewId,
    mappings: value.mappings.map((mapping) => ({
      serviceId: mapping.serviceId,
      baseUrl: mapping.baseUrl,
      hasUsername: mapping.hasUsername,
      hasPassword: mapping.hasPassword,
      hasApiKey: mapping.hasApiKey,
    })),
    warnings: [...value.warnings],
  };
}

function mapDiscovery(value: DiscoveryPreview): YarrDiscoveryResult {
  return {
    discoveryId: value.discoveryId,
    candidates: value.candidates.map((candidate) => ({
      candidateId: candidate.candidateId,
      source: candidate.source,
      serviceId: candidate.serviceId,
      confidence: candidate.confidence,
      reasons: [...candidate.reasons],
      baseUrl: candidate.baseUrl,
      hasCredential: candidate.hasCredential,
    })),
    errors: value.errors.map((error) => ({ code: error.code, message: error.message })),
  };
}

function mapUpdate(value: UpdateStatus): YarrUpdateStatus {
  return {
    installedVersion: value.installedVersion,
    packagedVersion: value.packagedVersion,
    availableVersion: value.availableVersion,
    updateAvailable: value.updateAvailable,
    usingOverlay: value.usingOverlay,
    rolledBack: value.rolledBack,
    message: value.message,
  };
}

function toConfigInput(input: SaveYarrConfigInput): DomainSaveYarrConfigInput {
  return {
    enabled: input.enabled,
    bindMode: input.bindMode,
    customHost: input.customHost,
    port: input.port,
    authMode: input.authMode,
    tailscaleServe: input.tailscaleServe,
    tailscaleHostname: input.tailscaleHostname,
    logLevel: input.logLevel,
    updateChannel: input.updateChannel,
    bearerToken: toSecretUpdate(input.bearerToken),
    googleClientId: input.googleClientId,
    googleClientSecret: toSecretUpdate(input.googleClientSecret),
    trustedGatewayHosts: input.trustedGatewayHosts,
    trustedGatewayOrigins: input.trustedGatewayOrigins,
    services: input.services?.map((service) => ({
      service: service.service,
      enabled: service.enabled,
      baseUrl: service.baseUrl,
      username: service.username,
      password: toSecretUpdate(service.password),
      apiKey: toSecretUpdate(service.apiKey),
    })),
  };
}

function toSecretUpdate(input: YarrSecretUpdateInput | undefined): SecretUpdate | undefined {
  if (input === undefined) return undefined;
  if (input.kind === "preserve") return { kind: "preserve" };
  if (input.kind === "clear") return { kind: "clear" };
  if (input.kind === "set" && input.value !== undefined) return { kind: "set", value: input.value };
  throw new Error("set secret updates require a value");
}

function consentMap(entries: readonly { serviceId: string; consent: boolean }[]): Record<string, boolean> {
  const result: Record<string, boolean> = Object.create(null) as Record<string, boolean>;
  for (const entry of entries) {
    if (Object.hasOwn(result, entry.serviceId)) throw new Error("duplicate credential consent service");
    result[entry.serviceId] = entry.consent;
  }
  return result;
}

function parseImportText(text: string): Record<string, string> {
  if (Buffer.byteLength(text, "utf8") > MAX_IMPORT_TEXT_LENGTH) {
    throw new Error("import text must not exceed 256 KiB");
  }
  const result: Record<string, string> = Object.create(null) as Record<string, string>;
  const lines = text.replaceAll("\r\n", "\n").split("\n");
  for (let index = 0; index < lines.length; index += 1) {
    let line = lines[index].trim();
    if (line === "" || line.startsWith("#")) continue;
    if (line.startsWith("export ")) line = line.slice(7).trimStart();
    const separator = line.indexOf("=");
    const key = separator === -1 ? "" : line.slice(0, separator).trim();
    if (!/^[A-Za-z_][A-Za-z0-9_.-]{0,127}$/.test(key) || Object.hasOwn(result, key)) {
      throw new Error(`invalid import entry on line ${index + 1}`);
    }
    let value = line.slice(separator + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (value.includes("\u0000")) throw new Error(`invalid import entry on line ${index + 1}`);
    result[key] = value;
  }
  return result;
}
