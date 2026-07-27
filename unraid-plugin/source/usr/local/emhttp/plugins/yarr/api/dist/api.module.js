"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApiModule = void 0;
const common_1 = require("@nestjs/common");
const command_runner_1 = require("./command-runner");
const config_service_1 = require("./config.service");
const discovery_service_1 = require("./discovery.service");
const docker_service_1 = require("./docker.service");
const flock_service_1 = require("./flock.service");
const import_service_1 = require("./import.service");
const log_service_1 = require("./log.service");
const runtime_service_1 = require("./runtime.service");
const secret_redactor_1 = require("./secret-redactor");
const update_service_1 = require("./update.service");
const yarr_resolver_1 = require("./yarr.resolver");
let ApiModule = class ApiModule {
};
exports.ApiModule = ApiModule;
exports.ApiModule = ApiModule = __decorate([
    (0, common_1.Module)({
        providers: [
            command_runner_1.SafeCommandRunner,
            flock_service_1.FlockService,
            config_service_1.NodeConfigFileSystem,
            runtime_service_1.NodeRuntimeFileSystem,
            runtime_service_1.NodeHttpClient,
            log_service_1.NodeBoundedLogReader,
            secret_redactor_1.StoredSecretRedactor,
            docker_service_1.DockerService,
            {
                provide: runtime_service_1.RuntimeService,
                inject: [command_runner_1.SafeCommandRunner, runtime_service_1.NodeRuntimeFileSystem, runtime_service_1.NodeHttpClient],
                useFactory: (commands, files, http) => new runtime_service_1.RuntimeService(commands, files, http),
            },
            {
                provide: config_service_1.ConfigService,
                inject: [config_service_1.NodeConfigFileSystem, flock_service_1.FlockService, runtime_service_1.RuntimeService],
                useFactory: (files, lock, runtime) => new config_service_1.ConfigService(files, lock, runtime),
            },
            {
                provide: log_service_1.LogService,
                inject: [log_service_1.NodeBoundedLogReader, secret_redactor_1.StoredSecretRedactor, flock_service_1.FlockService],
                useFactory: (reader, redactor, lock) => new log_service_1.LogService(reader, redactor, lock),
            },
            {
                provide: import_service_1.ImportService,
                inject: [config_service_1.ConfigService],
                useFactory: (config) => new import_service_1.ImportService(config),
            },
            {
                provide: discovery_service_1.DiscoveryService,
                inject: [docker_service_1.DockerService, config_service_1.ConfigService],
                useFactory: (docker, config) => new discovery_service_1.DiscoveryService(docker, config),
            },
            {
                provide: update_service_1.UpdateService,
                inject: [command_runner_1.SafeCommandRunner],
                useFactory: (commands) => new update_service_1.UpdateService(commands),
            },
            yarr_resolver_1.YarrResolver,
        ],
    })
], ApiModule);
