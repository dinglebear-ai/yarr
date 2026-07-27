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
Object.defineProperty(exports, "__esModule", { value: true });
exports.graphqlSchemaExtension = exports.YARR_INPUT_FIELDS = exports.YARR_INPUT_TYPES = exports.ApplyYarrDiscoveryInput = exports.ApplyYarrImportInput = exports.YarrCredentialConsentInput = exports.PreviewYarrImportInput = exports.SaveYarrConfigInput = exports.SaveYarrServiceInput = exports.YarrSecretUpdateInput = exports.YarrUpdateResult = exports.YarrUpdateStatus = exports.YarrDiscoveryResult = exports.YarrDiscoveryError = exports.YarrDiscoveryCandidate = exports.YarrImportPreview = exports.YarrImportMapping = exports.YarrLogs = exports.YarrConfigMutationResult = exports.YarrConfig = exports.YarrServiceConfig = exports.YarrPluginConfig = exports.YarrRuntime = exports.YarrKeyValue = exports.YarrSecretUpdateKind = exports.YarrLogLevel = exports.YarrAuthMode = exports.YarrBindMode = exports.YarrControlAction = exports.MAX_IMPORT_TEXT_LENGTH = void 0;
const class_transformer_1 = require("class-transformer");
const class_validator_1 = require("class-validator");
const graphql_1 = require("@nestjs/graphql");
const update_service_1 = require("./update.service");
exports.MAX_IMPORT_TEXT_LENGTH = 256 * 1024;
const SERVICE_IDS = [
    "sonarr", "radarr", "prowlarr", "tautulli", "overseerr", "bazarr", "tracearr",
    "sabnzbd", "qbittorrent", "plex", "jellyfin",
];
const OPAQUE_ID_LENGTH = 32;
const SERVICE_ID_MIN_LENGTH = 4;
const SERVICE_ID_MAX_LENGTH = 12;
const SERVICE_ID_PATTERN = /^[a-z][a-z0-9]*$/;
var YarrControlAction;
(function (YarrControlAction) {
    YarrControlAction["START"] = "START";
    YarrControlAction["STOP"] = "STOP";
    YarrControlAction["RESTART"] = "RESTART";
})(YarrControlAction || (exports.YarrControlAction = YarrControlAction = {}));
var YarrBindMode;
(function (YarrBindMode) {
    YarrBindMode["LOOPBACK"] = "loopback";
    YarrBindMode["LAN"] = "lan";
    YarrBindMode["CUSTOM"] = "custom";
})(YarrBindMode || (exports.YarrBindMode = YarrBindMode = {}));
var YarrAuthMode;
(function (YarrAuthMode) {
    YarrAuthMode["BEARER"] = "bearer";
    YarrAuthMode["GOOGLE_OAUTH"] = "google-oauth";
    YarrAuthMode["TRUSTED_GATEWAY"] = "trusted-gateway";
})(YarrAuthMode || (exports.YarrAuthMode = YarrAuthMode = {}));
var YarrLogLevel;
(function (YarrLogLevel) {
    YarrLogLevel["TRACE"] = "trace";
    YarrLogLevel["DEBUG"] = "debug";
    YarrLogLevel["INFO"] = "info";
    YarrLogLevel["WARN"] = "warn";
    YarrLogLevel["ERROR"] = "error";
})(YarrLogLevel || (exports.YarrLogLevel = YarrLogLevel = {}));
var YarrSecretUpdateKind;
(function (YarrSecretUpdateKind) {
    YarrSecretUpdateKind["PRESERVE"] = "preserve";
    YarrSecretUpdateKind["SET"] = "set";
    YarrSecretUpdateKind["CLEAR"] = "clear";
})(YarrSecretUpdateKind || (exports.YarrSecretUpdateKind = YarrSecretUpdateKind = {}));
(0, graphql_1.registerEnumType)(YarrControlAction, { name: "YarrControlAction" });
(0, graphql_1.registerEnumType)(YarrBindMode, { name: "YarrBindMode" });
(0, graphql_1.registerEnumType)(YarrAuthMode, { name: "YarrAuthMode" });
(0, graphql_1.registerEnumType)(YarrLogLevel, { name: "YarrLogLevel" });
(0, graphql_1.registerEnumType)(YarrSecretUpdateKind, { name: "YarrSecretUpdateKind" });
(0, graphql_1.registerEnumType)(update_service_1.UpdateOperation, { name: "YarrUpdateOperation" });
(0, graphql_1.registerEnumType)(update_service_1.UpdateOutcome, { name: "YarrUpdateOutcome" });
let YarrKeyValue = class YarrKeyValue {
    key;
    value;
};
exports.YarrKeyValue = YarrKeyValue;
__decorate([
    (0, graphql_1.Field)(() => String),
    __metadata("design:type", String)
], YarrKeyValue.prototype, "key", void 0);
__decorate([
    (0, graphql_1.Field)(() => String),
    __metadata("design:type", String)
], YarrKeyValue.prototype, "value", void 0);
exports.YarrKeyValue = YarrKeyValue = __decorate([
    (0, graphql_1.ObjectType)()
], YarrKeyValue);
let YarrRuntime = class YarrRuntime {
    state;
    pid;
    version;
    bindAddress;
    port;
    ready;
    healthMessage;
    uptimeSeconds;
};
exports.YarrRuntime = YarrRuntime;
__decorate([
    (0, graphql_1.Field)(() => String),
    __metadata("design:type", String)
], YarrRuntime.prototype, "state", void 0);
__decorate([
    (0, graphql_1.Field)(() => graphql_1.Int, { nullable: true }),
    __metadata("design:type", Object)
], YarrRuntime.prototype, "pid", void 0);
__decorate([
    (0, graphql_1.Field)(() => String, { nullable: true }),
    __metadata("design:type", Object)
], YarrRuntime.prototype, "version", void 0);
__decorate([
    (0, graphql_1.Field)(() => String),
    __metadata("design:type", String)
], YarrRuntime.prototype, "bindAddress", void 0);
__decorate([
    (0, graphql_1.Field)(() => graphql_1.Int),
    __metadata("design:type", Number)
], YarrRuntime.prototype, "port", void 0);
__decorate([
    (0, graphql_1.Field)(() => Boolean),
    __metadata("design:type", Boolean)
], YarrRuntime.prototype, "ready", void 0);
__decorate([
    (0, graphql_1.Field)(() => String),
    __metadata("design:type", String)
], YarrRuntime.prototype, "healthMessage", void 0);
__decorate([
    (0, graphql_1.Field)(() => graphql_1.Int, { nullable: true }),
    __metadata("design:type", Object)
], YarrRuntime.prototype, "uptimeSeconds", void 0);
exports.YarrRuntime = YarrRuntime = __decorate([
    (0, graphql_1.ObjectType)()
], YarrRuntime);
let YarrPluginConfig = class YarrPluginConfig {
    enabled;
    dashboardWidgetEnable;
    bindMode;
    customHost;
    port;
    authMode;
    tailscaleServe;
    tailscaleHostname;
    logLevel;
    updateChannel;
};
exports.YarrPluginConfig = YarrPluginConfig;
__decorate([
    (0, graphql_1.Field)(() => Boolean),
    __metadata("design:type", Boolean)
], YarrPluginConfig.prototype, "enabled", void 0);
__decorate([
    (0, graphql_1.Field)(() => Boolean),
    __metadata("design:type", Boolean)
], YarrPluginConfig.prototype, "dashboardWidgetEnable", void 0);
__decorate([
    (0, graphql_1.Field)(() => YarrBindMode),
    __metadata("design:type", String)
], YarrPluginConfig.prototype, "bindMode", void 0);
__decorate([
    (0, graphql_1.Field)(() => String),
    __metadata("design:type", String)
], YarrPluginConfig.prototype, "customHost", void 0);
__decorate([
    (0, graphql_1.Field)(() => graphql_1.Int),
    __metadata("design:type", Number)
], YarrPluginConfig.prototype, "port", void 0);
__decorate([
    (0, graphql_1.Field)(() => YarrAuthMode),
    __metadata("design:type", String)
], YarrPluginConfig.prototype, "authMode", void 0);
__decorate([
    (0, graphql_1.Field)(() => Boolean),
    __metadata("design:type", Boolean)
], YarrPluginConfig.prototype, "tailscaleServe", void 0);
__decorate([
    (0, graphql_1.Field)(() => String),
    __metadata("design:type", String)
], YarrPluginConfig.prototype, "tailscaleHostname", void 0);
__decorate([
    (0, graphql_1.Field)(() => YarrLogLevel),
    __metadata("design:type", String)
], YarrPluginConfig.prototype, "logLevel", void 0);
__decorate([
    (0, graphql_1.Field)(() => String),
    __metadata("design:type", String)
], YarrPluginConfig.prototype, "updateChannel", void 0);
exports.YarrPluginConfig = YarrPluginConfig = __decorate([
    (0, graphql_1.ObjectType)()
], YarrPluginConfig);
let YarrServiceConfig = class YarrServiceConfig {
    service;
    enabled;
    baseUrl;
    username;
    hasPassword;
    hasApiKey;
    extra;
};
exports.YarrServiceConfig = YarrServiceConfig;
__decorate([
    (0, graphql_1.Field)(() => String),
    __metadata("design:type", String)
], YarrServiceConfig.prototype, "service", void 0);
__decorate([
    (0, graphql_1.Field)(() => Boolean),
    __metadata("design:type", Boolean)
], YarrServiceConfig.prototype, "enabled", void 0);
__decorate([
    (0, graphql_1.Field)(() => String),
    __metadata("design:type", String)
], YarrServiceConfig.prototype, "baseUrl", void 0);
__decorate([
    (0, graphql_1.Field)(() => String, { nullable: true }),
    __metadata("design:type", Object)
], YarrServiceConfig.prototype, "username", void 0);
__decorate([
    (0, graphql_1.Field)(() => Boolean),
    __metadata("design:type", Boolean)
], YarrServiceConfig.prototype, "hasPassword", void 0);
__decorate([
    (0, graphql_1.Field)(() => Boolean),
    __metadata("design:type", Boolean)
], YarrServiceConfig.prototype, "hasApiKey", void 0);
__decorate([
    (0, graphql_1.Field)(() => [YarrKeyValue]),
    __metadata("design:type", Array)
], YarrServiceConfig.prototype, "extra", void 0);
exports.YarrServiceConfig = YarrServiceConfig = __decorate([
    (0, graphql_1.ObjectType)()
], YarrServiceConfig);
let YarrConfig = class YarrConfig {
    plugin;
    services;
};
exports.YarrConfig = YarrConfig;
__decorate([
    (0, graphql_1.Field)(() => YarrPluginConfig),
    __metadata("design:type", YarrPluginConfig)
], YarrConfig.prototype, "plugin", void 0);
__decorate([
    (0, graphql_1.Field)(() => [YarrServiceConfig]),
    __metadata("design:type", Array)
], YarrConfig.prototype, "services", void 0);
exports.YarrConfig = YarrConfig = __decorate([
    (0, graphql_1.ObjectType)()
], YarrConfig);
let YarrConfigMutationResult = class YarrConfigMutationResult {
    config;
    changed;
    restarted;
    rolledBack;
    error;
};
exports.YarrConfigMutationResult = YarrConfigMutationResult;
__decorate([
    (0, graphql_1.Field)(() => YarrConfig),
    __metadata("design:type", YarrConfig)
], YarrConfigMutationResult.prototype, "config", void 0);
__decorate([
    (0, graphql_1.Field)(() => Boolean),
    __metadata("design:type", Boolean)
], YarrConfigMutationResult.prototype, "changed", void 0);
__decorate([
    (0, graphql_1.Field)(() => Boolean),
    __metadata("design:type", Boolean)
], YarrConfigMutationResult.prototype, "restarted", void 0);
__decorate([
    (0, graphql_1.Field)(() => Boolean),
    __metadata("design:type", Boolean)
], YarrConfigMutationResult.prototype, "rolledBack", void 0);
__decorate([
    (0, graphql_1.Field)(() => String, { nullable: true }),
    __metadata("design:type", Object)
], YarrConfigMutationResult.prototype, "error", void 0);
exports.YarrConfigMutationResult = YarrConfigMutationResult = __decorate([
    (0, graphql_1.ObjectType)()
], YarrConfigMutationResult);
let YarrLogs = class YarrLogs {
    lines;
    truncated;
};
exports.YarrLogs = YarrLogs;
__decorate([
    (0, graphql_1.Field)(() => [String]),
    __metadata("design:type", Array)
], YarrLogs.prototype, "lines", void 0);
__decorate([
    (0, graphql_1.Field)(() => Boolean),
    __metadata("design:type", Boolean)
], YarrLogs.prototype, "truncated", void 0);
exports.YarrLogs = YarrLogs = __decorate([
    (0, graphql_1.ObjectType)()
], YarrLogs);
let YarrImportMapping = class YarrImportMapping {
    serviceId;
    baseUrl;
    hasUsername;
    hasPassword;
    hasApiKey;
    urlRequired;
};
exports.YarrImportMapping = YarrImportMapping;
__decorate([
    (0, graphql_1.Field)(() => String),
    __metadata("design:type", String)
], YarrImportMapping.prototype, "serviceId", void 0);
__decorate([
    (0, graphql_1.Field)(() => String, { nullable: true }),
    __metadata("design:type", Object)
], YarrImportMapping.prototype, "baseUrl", void 0);
__decorate([
    (0, graphql_1.Field)(() => Boolean),
    __metadata("design:type", Boolean)
], YarrImportMapping.prototype, "hasUsername", void 0);
__decorate([
    (0, graphql_1.Field)(() => Boolean),
    __metadata("design:type", Boolean)
], YarrImportMapping.prototype, "hasPassword", void 0);
__decorate([
    (0, graphql_1.Field)(() => Boolean),
    __metadata("design:type", Boolean)
], YarrImportMapping.prototype, "hasApiKey", void 0);
__decorate([
    (0, graphql_1.Field)(() => Boolean),
    __metadata("design:type", Boolean)
], YarrImportMapping.prototype, "urlRequired", void 0);
exports.YarrImportMapping = YarrImportMapping = __decorate([
    (0, graphql_1.ObjectType)()
], YarrImportMapping);
let YarrImportPreview = class YarrImportPreview {
    previewId;
    mappings;
    warnings;
};
exports.YarrImportPreview = YarrImportPreview;
__decorate([
    (0, graphql_1.Field)(() => String),
    __metadata("design:type", String)
], YarrImportPreview.prototype, "previewId", void 0);
__decorate([
    (0, graphql_1.Field)(() => [YarrImportMapping]),
    __metadata("design:type", Array)
], YarrImportPreview.prototype, "mappings", void 0);
__decorate([
    (0, graphql_1.Field)(() => [String]),
    __metadata("design:type", Array)
], YarrImportPreview.prototype, "warnings", void 0);
exports.YarrImportPreview = YarrImportPreview = __decorate([
    (0, graphql_1.ObjectType)()
], YarrImportPreview);
let YarrDiscoveryCandidate = class YarrDiscoveryCandidate {
    candidateId;
    source;
    serviceId;
    confidence;
    reasons;
    baseUrl;
    hasCredential;
};
exports.YarrDiscoveryCandidate = YarrDiscoveryCandidate;
__decorate([
    (0, graphql_1.Field)(() => String),
    __metadata("design:type", String)
], YarrDiscoveryCandidate.prototype, "candidateId", void 0);
__decorate([
    (0, graphql_1.Field)(() => String),
    __metadata("design:type", String)
], YarrDiscoveryCandidate.prototype, "source", void 0);
__decorate([
    (0, graphql_1.Field)(() => String),
    __metadata("design:type", String)
], YarrDiscoveryCandidate.prototype, "serviceId", void 0);
__decorate([
    (0, graphql_1.Field)(() => graphql_1.Int),
    __metadata("design:type", Number)
], YarrDiscoveryCandidate.prototype, "confidence", void 0);
__decorate([
    (0, graphql_1.Field)(() => [String]),
    __metadata("design:type", Array)
], YarrDiscoveryCandidate.prototype, "reasons", void 0);
__decorate([
    (0, graphql_1.Field)(() => String),
    __metadata("design:type", String)
], YarrDiscoveryCandidate.prototype, "baseUrl", void 0);
__decorate([
    (0, graphql_1.Field)(() => Boolean),
    __metadata("design:type", Boolean)
], YarrDiscoveryCandidate.prototype, "hasCredential", void 0);
exports.YarrDiscoveryCandidate = YarrDiscoveryCandidate = __decorate([
    (0, graphql_1.ObjectType)()
], YarrDiscoveryCandidate);
let YarrDiscoveryError = class YarrDiscoveryError {
    code;
    message;
};
exports.YarrDiscoveryError = YarrDiscoveryError;
__decorate([
    (0, graphql_1.Field)(() => String),
    __metadata("design:type", String)
], YarrDiscoveryError.prototype, "code", void 0);
__decorate([
    (0, graphql_1.Field)(() => String),
    __metadata("design:type", String)
], YarrDiscoveryError.prototype, "message", void 0);
exports.YarrDiscoveryError = YarrDiscoveryError = __decorate([
    (0, graphql_1.ObjectType)()
], YarrDiscoveryError);
let YarrDiscoveryResult = class YarrDiscoveryResult {
    discoveryId;
    candidates;
    errors;
};
exports.YarrDiscoveryResult = YarrDiscoveryResult;
__decorate([
    (0, graphql_1.Field)(() => String),
    __metadata("design:type", String)
], YarrDiscoveryResult.prototype, "discoveryId", void 0);
__decorate([
    (0, graphql_1.Field)(() => [YarrDiscoveryCandidate]),
    __metadata("design:type", Array)
], YarrDiscoveryResult.prototype, "candidates", void 0);
__decorate([
    (0, graphql_1.Field)(() => [YarrDiscoveryError]),
    __metadata("design:type", Array)
], YarrDiscoveryResult.prototype, "errors", void 0);
exports.YarrDiscoveryResult = YarrDiscoveryResult = __decorate([
    (0, graphql_1.ObjectType)()
], YarrDiscoveryResult);
let YarrUpdateStatus = class YarrUpdateStatus {
    operation;
    outcome;
    installedVersion;
    packagedVersion;
    availableVersion;
    updateAvailable;
    usingOverlay;
    rollbackAvailable;
    rolledBack;
    cleanupPending;
    recoveryIdentifier;
    message;
};
exports.YarrUpdateStatus = YarrUpdateStatus;
__decorate([
    (0, graphql_1.Field)(() => update_service_1.UpdateOperation),
    __metadata("design:type", String)
], YarrUpdateStatus.prototype, "operation", void 0);
__decorate([
    (0, graphql_1.Field)(() => update_service_1.UpdateOutcome),
    __metadata("design:type", String)
], YarrUpdateStatus.prototype, "outcome", void 0);
__decorate([
    (0, graphql_1.Field)(() => String),
    __metadata("design:type", String)
], YarrUpdateStatus.prototype, "installedVersion", void 0);
__decorate([
    (0, graphql_1.Field)(() => String),
    __metadata("design:type", String)
], YarrUpdateStatus.prototype, "packagedVersion", void 0);
__decorate([
    (0, graphql_1.Field)(() => String),
    __metadata("design:type", String)
], YarrUpdateStatus.prototype, "availableVersion", void 0);
__decorate([
    (0, graphql_1.Field)(() => Boolean),
    __metadata("design:type", Boolean)
], YarrUpdateStatus.prototype, "updateAvailable", void 0);
__decorate([
    (0, graphql_1.Field)(() => Boolean),
    __metadata("design:type", Boolean)
], YarrUpdateStatus.prototype, "usingOverlay", void 0);
__decorate([
    (0, graphql_1.Field)(() => Boolean),
    __metadata("design:type", Boolean)
], YarrUpdateStatus.prototype, "rollbackAvailable", void 0);
__decorate([
    (0, graphql_1.Field)(() => Boolean),
    __metadata("design:type", Boolean)
], YarrUpdateStatus.prototype, "rolledBack", void 0);
__decorate([
    (0, graphql_1.Field)(() => Boolean),
    __metadata("design:type", Boolean)
], YarrUpdateStatus.prototype, "cleanupPending", void 0);
__decorate([
    (0, graphql_1.Field)(() => String),
    __metadata("design:type", String)
], YarrUpdateStatus.prototype, "recoveryIdentifier", void 0);
__decorate([
    (0, graphql_1.Field)(() => String),
    __metadata("design:type", String)
], YarrUpdateStatus.prototype, "message", void 0);
exports.YarrUpdateStatus = YarrUpdateStatus = __decorate([
    (0, graphql_1.ObjectType)()
], YarrUpdateStatus);
let YarrUpdateResult = class YarrUpdateResult extends YarrUpdateStatus {
};
exports.YarrUpdateResult = YarrUpdateResult;
exports.YarrUpdateResult = YarrUpdateResult = __decorate([
    (0, graphql_1.ObjectType)()
], YarrUpdateResult);
let YarrSecretUpdateInput = class YarrSecretUpdateInput {
    kind;
    value;
};
exports.YarrSecretUpdateInput = YarrSecretUpdateInput;
__decorate([
    (0, graphql_1.Field)(() => YarrSecretUpdateKind),
    (0, class_validator_1.IsEnum)(YarrSecretUpdateKind),
    __metadata("design:type", String)
], YarrSecretUpdateInput.prototype, "kind", void 0);
__decorate([
    (0, graphql_1.Field)(() => String, { nullable: true }),
    (0, class_validator_1.ValidateIf)((input) => input.kind === YarrSecretUpdateKind.SET),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(1),
    (0, class_validator_1.MaxLength)(64 * 1024),
    __metadata("design:type", String)
], YarrSecretUpdateInput.prototype, "value", void 0);
exports.YarrSecretUpdateInput = YarrSecretUpdateInput = __decorate([
    (0, graphql_1.InputType)()
], YarrSecretUpdateInput);
let SaveYarrServiceInput = class SaveYarrServiceInput {
    service;
    enabled;
    baseUrl;
    username;
    password;
    apiKey;
};
exports.SaveYarrServiceInput = SaveYarrServiceInput;
__decorate([
    (0, graphql_1.Field)(() => String),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(SERVICE_ID_MIN_LENGTH),
    (0, class_validator_1.MaxLength)(SERVICE_ID_MAX_LENGTH),
    (0, class_validator_1.Matches)(SERVICE_ID_PATTERN),
    (0, class_validator_1.IsIn)(SERVICE_IDS),
    __metadata("design:type", String)
], SaveYarrServiceInput.prototype, "service", void 0);
__decorate([
    (0, graphql_1.Field)(() => Boolean, { nullable: true }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], SaveYarrServiceInput.prototype, "enabled", void 0);
__decorate([
    (0, graphql_1.Field)(() => String, { nullable: true }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(2048),
    __metadata("design:type", String)
], SaveYarrServiceInput.prototype, "baseUrl", void 0);
__decorate([
    (0, graphql_1.Field)(() => String, { nullable: true }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(1024),
    __metadata("design:type", String)
], SaveYarrServiceInput.prototype, "username", void 0);
__decorate([
    (0, graphql_1.Field)(() => YarrSecretUpdateInput, { nullable: true }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => YarrSecretUpdateInput),
    __metadata("design:type", YarrSecretUpdateInput)
], SaveYarrServiceInput.prototype, "password", void 0);
__decorate([
    (0, graphql_1.Field)(() => YarrSecretUpdateInput, { nullable: true }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => YarrSecretUpdateInput),
    __metadata("design:type", YarrSecretUpdateInput)
], SaveYarrServiceInput.prototype, "apiKey", void 0);
exports.SaveYarrServiceInput = SaveYarrServiceInput = __decorate([
    (0, graphql_1.InputType)()
], SaveYarrServiceInput);
let SaveYarrConfigInput = class SaveYarrConfigInput {
    enabled;
    dashboardWidgetEnable;
    bindMode;
    customHost;
    port;
    authMode;
    tailscaleServe;
    tailscaleHostname;
    logLevel;
    updateChannel;
    bearerToken;
    googleClientId;
    googleClientSecret;
    trustedGatewayHosts;
    trustedGatewayOrigins;
    services;
};
exports.SaveYarrConfigInput = SaveYarrConfigInput;
__decorate([
    (0, graphql_1.Field)(() => Boolean, { nullable: true }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], SaveYarrConfigInput.prototype, "enabled", void 0);
__decorate([
    (0, graphql_1.Field)(() => Boolean, { nullable: true }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], SaveYarrConfigInput.prototype, "dashboardWidgetEnable", void 0);
__decorate([
    (0, graphql_1.Field)(() => YarrBindMode, { nullable: true }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(YarrBindMode),
    __metadata("design:type", String)
], SaveYarrConfigInput.prototype, "bindMode", void 0);
__decorate([
    (0, graphql_1.Field)(() => String, { nullable: true }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(253),
    __metadata("design:type", String)
], SaveYarrConfigInput.prototype, "customHost", void 0);
__decorate([
    (0, graphql_1.Field)(() => graphql_1.Int, { nullable: true }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(65535),
    __metadata("design:type", Number)
], SaveYarrConfigInput.prototype, "port", void 0);
__decorate([
    (0, graphql_1.Field)(() => YarrAuthMode, { nullable: true }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(YarrAuthMode),
    __metadata("design:type", String)
], SaveYarrConfigInput.prototype, "authMode", void 0);
__decorate([
    (0, graphql_1.Field)(() => Boolean, { nullable: true }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], SaveYarrConfigInput.prototype, "tailscaleServe", void 0);
__decorate([
    (0, graphql_1.Field)(() => String, { nullable: true }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(253),
    __metadata("design:type", String)
], SaveYarrConfigInput.prototype, "tailscaleHostname", void 0);
__decorate([
    (0, graphql_1.Field)(() => YarrLogLevel, { nullable: true }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(YarrLogLevel),
    __metadata("design:type", String)
], SaveYarrConfigInput.prototype, "logLevel", void 0);
__decorate([
    (0, graphql_1.Field)(() => String, { nullable: true }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsIn)(["stable"]),
    __metadata("design:type", String)
], SaveYarrConfigInput.prototype, "updateChannel", void 0);
__decorate([
    (0, graphql_1.Field)(() => YarrSecretUpdateInput, { nullable: true }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => YarrSecretUpdateInput),
    __metadata("design:type", YarrSecretUpdateInput)
], SaveYarrConfigInput.prototype, "bearerToken", void 0);
__decorate([
    (0, graphql_1.Field)(() => String, { nullable: true }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(1024),
    __metadata("design:type", String)
], SaveYarrConfigInput.prototype, "googleClientId", void 0);
__decorate([
    (0, graphql_1.Field)(() => YarrSecretUpdateInput, { nullable: true }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => YarrSecretUpdateInput),
    __metadata("design:type", YarrSecretUpdateInput)
], SaveYarrConfigInput.prototype, "googleClientSecret", void 0);
__decorate([
    (0, graphql_1.Field)(() => String, { nullable: true }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(8192),
    __metadata("design:type", String)
], SaveYarrConfigInput.prototype, "trustedGatewayHosts", void 0);
__decorate([
    (0, graphql_1.Field)(() => String, { nullable: true }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(8192),
    __metadata("design:type", String)
], SaveYarrConfigInput.prototype, "trustedGatewayOrigins", void 0);
__decorate([
    (0, graphql_1.Field)(() => [SaveYarrServiceInput], { nullable: true }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ArrayMaxSize)(SERVICE_IDS.length),
    (0, class_validator_1.ArrayUnique)((service) => service.service),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => SaveYarrServiceInput),
    __metadata("design:type", Array)
], SaveYarrConfigInput.prototype, "services", void 0);
exports.SaveYarrConfigInput = SaveYarrConfigInput = __decorate([
    (0, graphql_1.InputType)()
], SaveYarrConfigInput);
let PreviewYarrImportInput = class PreviewYarrImportInput {
    text;
};
exports.PreviewYarrImportInput = PreviewYarrImportInput;
__decorate([
    (0, graphql_1.Field)(() => String),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(exports.MAX_IMPORT_TEXT_LENGTH),
    __metadata("design:type", String)
], PreviewYarrImportInput.prototype, "text", void 0);
exports.PreviewYarrImportInput = PreviewYarrImportInput = __decorate([
    (0, graphql_1.InputType)()
], PreviewYarrImportInput);
let YarrCredentialConsentInput = class YarrCredentialConsentInput {
    serviceId;
    consent;
};
exports.YarrCredentialConsentInput = YarrCredentialConsentInput;
__decorate([
    (0, graphql_1.Field)(() => String),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(SERVICE_ID_MIN_LENGTH),
    (0, class_validator_1.MaxLength)(SERVICE_ID_MAX_LENGTH),
    (0, class_validator_1.Matches)(SERVICE_ID_PATTERN),
    (0, class_validator_1.IsIn)(SERVICE_IDS),
    __metadata("design:type", String)
], YarrCredentialConsentInput.prototype, "serviceId", void 0);
__decorate([
    (0, graphql_1.Field)(() => Boolean),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], YarrCredentialConsentInput.prototype, "consent", void 0);
exports.YarrCredentialConsentInput = YarrCredentialConsentInput = __decorate([
    (0, graphql_1.InputType)()
], YarrCredentialConsentInput);
let ApplyYarrImportInput = class ApplyYarrImportInput {
    previewId;
    selectedServiceIds;
    credentialConsent;
};
exports.ApplyYarrImportInput = ApplyYarrImportInput;
__decorate([
    (0, graphql_1.Field)(() => String),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(OPAQUE_ID_LENGTH),
    (0, class_validator_1.MaxLength)(OPAQUE_ID_LENGTH),
    (0, class_validator_1.Matches)(/^[A-Za-z0-9_-]+$/),
    __metadata("design:type", String)
], ApplyYarrImportInput.prototype, "previewId", void 0);
__decorate([
    (0, graphql_1.Field)(() => [String]),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ArrayMinSize)(1),
    (0, class_validator_1.ArrayMaxSize)(SERVICE_IDS.length),
    (0, class_validator_1.ArrayUnique)(),
    (0, class_validator_1.IsString)({ each: true }),
    (0, class_validator_1.MinLength)(SERVICE_ID_MIN_LENGTH, { each: true }),
    (0, class_validator_1.MaxLength)(SERVICE_ID_MAX_LENGTH, { each: true }),
    (0, class_validator_1.Matches)(SERVICE_ID_PATTERN, { each: true }),
    (0, class_validator_1.IsIn)(SERVICE_IDS, { each: true }),
    __metadata("design:type", Array)
], ApplyYarrImportInput.prototype, "selectedServiceIds", void 0);
__decorate([
    (0, graphql_1.Field)(() => [YarrCredentialConsentInput]),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ArrayMaxSize)(SERVICE_IDS.length),
    (0, class_validator_1.ArrayUnique)((entry) => entry.serviceId),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => YarrCredentialConsentInput),
    __metadata("design:type", Array)
], ApplyYarrImportInput.prototype, "credentialConsent", void 0);
exports.ApplyYarrImportInput = ApplyYarrImportInput = __decorate([
    (0, graphql_1.InputType)()
], ApplyYarrImportInput);
let ApplyYarrDiscoveryInput = class ApplyYarrDiscoveryInput {
    discoveryId;
    selectedCandidateIds;
    credentialConsent;
};
exports.ApplyYarrDiscoveryInput = ApplyYarrDiscoveryInput;
__decorate([
    (0, graphql_1.Field)(() => String),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(OPAQUE_ID_LENGTH),
    (0, class_validator_1.MaxLength)(OPAQUE_ID_LENGTH),
    (0, class_validator_1.Matches)(/^[A-Za-z0-9_-]+$/),
    __metadata("design:type", String)
], ApplyYarrDiscoveryInput.prototype, "discoveryId", void 0);
__decorate([
    (0, graphql_1.Field)(() => [String]),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ArrayMinSize)(1),
    (0, class_validator_1.ArrayMaxSize)(256),
    (0, class_validator_1.ArrayUnique)(),
    (0, class_validator_1.IsString)({ each: true }),
    (0, class_validator_1.MinLength)(OPAQUE_ID_LENGTH, { each: true }),
    (0, class_validator_1.MaxLength)(OPAQUE_ID_LENGTH, { each: true }),
    (0, class_validator_1.Matches)(/^[A-Za-z0-9_-]+$/, { each: true }),
    __metadata("design:type", Array)
], ApplyYarrDiscoveryInput.prototype, "selectedCandidateIds", void 0);
__decorate([
    (0, graphql_1.Field)(() => [YarrCredentialConsentInput]),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ArrayMaxSize)(SERVICE_IDS.length),
    (0, class_validator_1.ArrayUnique)((entry) => entry.serviceId),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => YarrCredentialConsentInput),
    __metadata("design:type", Array)
], ApplyYarrDiscoveryInput.prototype, "credentialConsent", void 0);
exports.ApplyYarrDiscoveryInput = ApplyYarrDiscoveryInput = __decorate([
    (0, graphql_1.InputType)()
], ApplyYarrDiscoveryInput);
exports.YARR_INPUT_TYPES = [
    YarrSecretUpdateInput,
    SaveYarrServiceInput,
    SaveYarrConfigInput,
    PreviewYarrImportInput,
    YarrCredentialConsentInput,
    ApplyYarrImportInput,
    ApplyYarrDiscoveryInput,
];
exports.YARR_INPUT_FIELDS = {
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
const graphqlSchemaExtension = async () => `
  enum YarrControlAction { START STOP RESTART }
  enum YarrBindMode { LOOPBACK LAN CUSTOM }
  enum YarrAuthMode { BEARER GOOGLE_OAUTH TRUSTED_GATEWAY }
  enum YarrLogLevel { TRACE DEBUG INFO WARN ERROR }
  enum YarrSecretUpdateKind { PRESERVE SET CLEAR }
  enum YarrUpdateOperation { CHECK APPLY RESET ROLLBACK }
  enum YarrUpdateOutcome {
    CHECK_NO_COMPATIBLE_RELEASE CHECK_UPDATE_AVAILABLE CHECK_CURRENT
    APPLY_CURRENT APPLY_UPDATED APPLY_FAILED_BEFORE_ACTIVATION APPLY_RESTORED APPLY_RESTORATION_INCOMPLETE
    RESET_COMPLETED RESET_FAILED_BEFORE_MUTATION RESET_RESTORED RESET_RESTORATION_INCOMPLETE
    ROLLBACK_COMPLETED ROLLBACK_UNAVAILABLE ROLLBACK_FAILED_BEFORE_ACTIVATION ROLLBACK_RESTORED ROLLBACK_RESTORATION_INCOMPLETE
  }

  type YarrKeyValue { key: String!, value: String! }
  type YarrRuntime { state: String!, pid: Int, version: String, bindAddress: String!, port: Int!, ready: Boolean!, healthMessage: String!, uptimeSeconds: Int }
  type YarrPluginConfig { enabled: Boolean!, dashboardWidgetEnable: Boolean!, bindMode: YarrBindMode!, customHost: String!, port: Int!, authMode: YarrAuthMode!, tailscaleServe: Boolean!, tailscaleHostname: String!, logLevel: YarrLogLevel!, updateChannel: String! }
  type YarrServiceConfig { service: String!, enabled: Boolean!, baseUrl: String!, username: String, hasPassword: Boolean!, hasApiKey: Boolean!, extra: [YarrKeyValue!]! }
  type YarrConfig { plugin: YarrPluginConfig!, services: [YarrServiceConfig!]! }
  type YarrConfigMutationResult { config: YarrConfig!, changed: Boolean!, restarted: Boolean!, rolledBack: Boolean!, error: String }
  type YarrLogs { lines: [String!]!, truncated: Boolean! }
  type YarrImportMapping { serviceId: String!, baseUrl: String, hasUsername: Boolean!, hasPassword: Boolean!, hasApiKey: Boolean!, urlRequired: Boolean! }
  type YarrImportPreview { previewId: String!, mappings: [YarrImportMapping!]!, warnings: [String!]! }
  type YarrDiscoveryCandidate { candidateId: String!, source: String!, serviceId: String!, confidence: Int!, reasons: [String!]!, baseUrl: String!, hasCredential: Boolean! }
  type YarrDiscoveryError { code: String!, message: String! }
  type YarrDiscoveryResult { discoveryId: String!, candidates: [YarrDiscoveryCandidate!]!, errors: [YarrDiscoveryError!]! }
  type YarrUpdateStatus { operation: YarrUpdateOperation!, outcome: YarrUpdateOutcome!, installedVersion: String!, packagedVersion: String!, availableVersion: String!, updateAvailable: Boolean!, usingOverlay: Boolean!, rollbackAvailable: Boolean!, rolledBack: Boolean!, cleanupPending: Boolean!, recoveryIdentifier: String!, message: String! }
  type YarrUpdateResult { operation: YarrUpdateOperation!, outcome: YarrUpdateOutcome!, installedVersion: String!, packagedVersion: String!, availableVersion: String!, updateAvailable: Boolean!, usingOverlay: Boolean!, rollbackAvailable: Boolean!, rolledBack: Boolean!, cleanupPending: Boolean!, recoveryIdentifier: String!, message: String! }

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
exports.graphqlSchemaExtension = graphqlSchemaExtension;
