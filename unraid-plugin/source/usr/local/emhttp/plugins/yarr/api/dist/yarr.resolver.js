"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.YarrResolver = void 0;
const graphql_1 = require("@nestjs/graphql");
const use_permissions_directive_js_1 = require("@unraid/shared/use-permissions.directive.js");
const config_service_1 = require("./config.service");
const discovery_service_1 = require("./discovery.service");
const graphql_types_1 = require("./graphql.types");
const import_service_1 = require("./import.service");
const log_service_1 = require("./log.service");
const runtime_service_1 = require("./runtime.service");
const service_catalog_1 = require("./service-catalog");
const update_service_1 = require("./update.service");
const MAX_LOG_LINES = 500;
let YarrResolver = class YarrResolver {
    runtime;
    config;
    logs;
    imports;
    discovery;
    updates;
    constructor(runtime, config, logs, imports, discovery, updates) {
        this.runtime = runtime;
        this.config = config;
        this.logs = logs;
        this.imports = imports;
        this.discovery = discovery;
        this.updates = updates;
    }
    async yarrRuntime() {
        return mapRuntime(await this.runtime.status());
    }
    async yarrConfig() {
        return mapConfig(await this.config.read());
    }
    async yarrDiscoveredServices() {
        return mapDiscovery(await this.discovery.discover());
    }
    async yarrLogs(lines = 200) {
        if (!Number.isInteger(lines) || lines < 1 || lines > MAX_LOG_LINES) {
            throw new Error("lines must be an integer from 1 to 500");
        }
        const result = await this.logs.read();
        return {
            lines: result.lines.slice(-lines),
            truncated: result.truncated || result.lines.length > lines,
        };
    }
    async yarrUpdateStatus() {
        return mapUpdate(await this.updates.status());
    }
    async saveYarrConfig(input) {
        return mapMutation(await this.config.save(toConfigInput(input)));
    }
    async controlYarr(action) {
        if (action === graphql_types_1.YarrControlAction.START)
            return mapRuntime(await this.runtime.start());
        if (action === graphql_types_1.YarrControlAction.STOP)
            return mapRuntime(await this.runtime.stop());
        if (action === graphql_types_1.YarrControlAction.RESTART)
            return mapRuntime(await this.runtime.restart());
        throw new Error("unsupported Yarr control action");
    }
    async previewYarrImport(input) {
        if (Buffer.byteLength(input.text, "utf8") > graphql_types_1.MAX_IMPORT_TEXT_LENGTH) {
            throw new Error("import text must not exceed 256 KiB");
        }
        return mapImportPreview(await this.imports.previewText(input.text));
    }
    async applyYarrImport(input) {
        return mapMutation(await this.imports.apply({
            previewId: input.previewId,
            selectedServiceIds: [...input.selectedServiceIds],
            credentialConsent: consentMap(input.credentialConsent),
        }));
    }
    async applyYarrDiscovery(input) {
        return mapMutation(await this.discovery.apply({
            discoveryId: input.discoveryId,
            selectedCandidateIds: [...input.selectedCandidateIds],
            credentialConsent: consentMap(input.credentialConsent),
        }));
    }
    async updateYarrBinary(version) {
        return mapUpdate(await this.updates.apply(version));
    }
    async resetYarrBinary() {
        return mapUpdate(await this.updates.reset());
    }
    async rollbackYarrBinary() {
        return mapUpdate(await this.updates.rollback());
    }
};
exports.YarrResolver = YarrResolver;
__decorate([
    (0, graphql_1.Query)(() => graphql_types_1.YarrRuntime),
    (0, use_permissions_directive_js_1.UsePermissions)({ action: use_permissions_directive_js_1.AuthAction.READ_ANY, resource: use_permissions_directive_js_1.Resource.SERVICES }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], YarrResolver.prototype, "yarrRuntime", null);
__decorate([
    (0, graphql_1.Query)(() => graphql_types_1.YarrConfig),
    (0, use_permissions_directive_js_1.UsePermissions)({ action: use_permissions_directive_js_1.AuthAction.READ_ANY, resource: use_permissions_directive_js_1.Resource.SERVICES }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], YarrResolver.prototype, "yarrConfig", null);
__decorate([
    (0, graphql_1.Query)(() => graphql_types_1.YarrDiscoveryResult),
    (0, use_permissions_directive_js_1.UsePermissions)({ action: use_permissions_directive_js_1.AuthAction.READ_ANY, resource: use_permissions_directive_js_1.Resource.SERVICES }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], YarrResolver.prototype, "yarrDiscoveredServices", null);
__decorate([
    (0, graphql_1.Query)(() => graphql_types_1.YarrLogs),
    (0, use_permissions_directive_js_1.UsePermissions)({ action: use_permissions_directive_js_1.AuthAction.READ_ANY, resource: use_permissions_directive_js_1.Resource.SERVICES }),
    __param(0, (0, graphql_1.Args)("lines", { type: () => graphql_1.Int, nullable: true, defaultValue: 200 })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], YarrResolver.prototype, "yarrLogs", null);
__decorate([
    (0, graphql_1.Query)(() => graphql_types_1.YarrUpdateStatus),
    (0, use_permissions_directive_js_1.UsePermissions)({ action: use_permissions_directive_js_1.AuthAction.READ_ANY, resource: use_permissions_directive_js_1.Resource.SERVICES }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], YarrResolver.prototype, "yarrUpdateStatus", null);
__decorate([
    (0, graphql_1.Mutation)(() => graphql_types_1.YarrConfigMutationResult),
    (0, use_permissions_directive_js_1.UsePermissions)({ action: use_permissions_directive_js_1.AuthAction.UPDATE_ANY, resource: use_permissions_directive_js_1.Resource.SERVICES }),
    __param(0, (0, graphql_1.Args)("input", { type: () => graphql_types_1.SaveYarrConfigInput })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [graphql_types_1.SaveYarrConfigInput]),
    __metadata("design:returntype", Promise)
], YarrResolver.prototype, "saveYarrConfig", null);
__decorate([
    (0, graphql_1.Mutation)(() => graphql_types_1.YarrRuntime),
    (0, use_permissions_directive_js_1.UsePermissions)({ action: use_permissions_directive_js_1.AuthAction.UPDATE_ANY, resource: use_permissions_directive_js_1.Resource.SERVICES }),
    __param(0, (0, graphql_1.Args)("action", { type: () => graphql_types_1.YarrControlAction })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], YarrResolver.prototype, "controlYarr", null);
__decorate([
    (0, graphql_1.Mutation)(() => graphql_types_1.YarrImportPreview),
    (0, use_permissions_directive_js_1.UsePermissions)({ action: use_permissions_directive_js_1.AuthAction.UPDATE_ANY, resource: use_permissions_directive_js_1.Resource.SERVICES }),
    __param(0, (0, graphql_1.Args)("input", { type: () => graphql_types_1.PreviewYarrImportInput })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [graphql_types_1.PreviewYarrImportInput]),
    __metadata("design:returntype", Promise)
], YarrResolver.prototype, "previewYarrImport", null);
__decorate([
    (0, graphql_1.Mutation)(() => graphql_types_1.YarrConfigMutationResult),
    (0, use_permissions_directive_js_1.UsePermissions)({ action: use_permissions_directive_js_1.AuthAction.UPDATE_ANY, resource: use_permissions_directive_js_1.Resource.SERVICES }),
    __param(0, (0, graphql_1.Args)("input", { type: () => graphql_types_1.ApplyYarrImportInput })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [graphql_types_1.ApplyYarrImportInput]),
    __metadata("design:returntype", Promise)
], YarrResolver.prototype, "applyYarrImport", null);
__decorate([
    (0, graphql_1.Mutation)(() => graphql_types_1.YarrConfigMutationResult),
    (0, use_permissions_directive_js_1.UsePermissions)({ action: use_permissions_directive_js_1.AuthAction.UPDATE_ANY, resource: use_permissions_directive_js_1.Resource.SERVICES }),
    __param(0, (0, graphql_1.Args)("input", { type: () => graphql_types_1.ApplyYarrDiscoveryInput })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [graphql_types_1.ApplyYarrDiscoveryInput]),
    __metadata("design:returntype", Promise)
], YarrResolver.prototype, "applyYarrDiscovery", null);
__decorate([
    (0, graphql_1.Mutation)(() => graphql_types_1.YarrUpdateResult),
    (0, use_permissions_directive_js_1.UsePermissions)({ action: use_permissions_directive_js_1.AuthAction.UPDATE_ANY, resource: use_permissions_directive_js_1.Resource.SERVICES }),
    __param(0, (0, graphql_1.Args)("version", { type: () => String })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], YarrResolver.prototype, "updateYarrBinary", null);
__decorate([
    (0, graphql_1.Mutation)(() => graphql_types_1.YarrUpdateResult),
    (0, use_permissions_directive_js_1.UsePermissions)({ action: use_permissions_directive_js_1.AuthAction.UPDATE_ANY, resource: use_permissions_directive_js_1.Resource.SERVICES }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], YarrResolver.prototype, "resetYarrBinary", null);
__decorate([
    (0, graphql_1.Mutation)(() => graphql_types_1.YarrUpdateResult),
    (0, use_permissions_directive_js_1.UsePermissions)({ action: use_permissions_directive_js_1.AuthAction.UPDATE_ANY, resource: use_permissions_directive_js_1.Resource.SERVICES }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], YarrResolver.prototype, "rollbackYarrBinary", null);
exports.YarrResolver = YarrResolver = __decorate([
    (0, graphql_1.Resolver)(),
    __metadata("design:paramtypes", [runtime_service_1.RuntimeService,
        config_service_1.ConfigService,
        log_service_1.LogService,
        import_service_1.ImportService,
        discovery_service_1.DiscoveryService,
        update_service_1.UpdateService])
], YarrResolver);
function mapRuntime(value) {
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
function mapConfig(value) {
    return {
        plugin: {
            enabled: value.plugin.enabled,
            dashboardWidgetEnable: value.plugin.dashboardWidgetEnable,
            bindMode: value.plugin.bindMode,
            customHost: value.plugin.customHost,
            port: value.plugin.port,
            authMode: value.plugin.authMode,
            tailscaleServe: value.plugin.tailscaleServe,
            tailscaleHostname: value.plugin.tailscaleHostname,
            logLevel: value.plugin.logLevel,
            updateChannel: value.plugin.updateChannel,
        },
        services: value.services.map((service) => ({
            service: service.service,
            enabled: service.enabled,
            baseUrl: service.baseUrl,
            username: service.username,
            hasPassword: service.hasPassword,
            hasApiKey: service.hasApiKey,
            extra: (service_catalog_1.PUBLIC_EXTRA_KEYS_BY_SERVICE.get(service.service) ?? []).flatMap((key) => {
                const entryValue = service.extra[key];
                return entryValue === undefined ? [] : [{ key, value: entryValue }];
            }),
        })),
    };
}
function mapMutation(value) {
    return {
        config: mapConfig(value.config),
        changed: value.changed,
        restarted: value.restarted,
        rolledBack: value.rolledBack,
        error: value.error ?? null,
    };
}
function mapImportPreview(value) {
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
function mapDiscovery(value) {
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
function mapUpdate(value) {
    return {
        installedVersion: value.installedVersion,
        packagedVersion: value.packagedVersion,
        availableVersion: value.availableVersion,
        updateAvailable: value.updateAvailable,
        usingOverlay: value.usingOverlay,
        rollbackAvailable: value.rollbackAvailable,
        rolledBack: value.rolledBack,
        message: value.message,
    };
}
function toConfigInput(input) {
    return {
        enabled: input.enabled,
        dashboardWidgetEnable: input.dashboardWidgetEnable,
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
function toSecretUpdate(input) {
    if (input === undefined)
        return undefined;
    if (input.kind === "preserve")
        return { kind: "preserve" };
    if (input.kind === "clear")
        return { kind: "clear" };
    if (input.kind === "set" && input.value !== undefined)
        return { kind: "set", value: input.value };
    throw new Error("set secret updates require a value");
}
function consentMap(entries) {
    const result = Object.create(null);
    for (const entry of entries) {
        if (Object.hasOwn(result, entry.serviceId))
            throw new Error("duplicate credential consent service");
        result[entry.serviceId] = entry.consent;
    }
    return result;
}
