import { Module } from "@nestjs/common";

import { SafeCommandRunner } from "./command-runner";
import { ConfigService, NodeConfigFileSystem } from "./config.service";
import { DiscoveryService } from "./discovery.service";
import { DockerService } from "./docker.service";
import { FlockService } from "./flock.service";
import { ImportService } from "./import.service";
import { LogService, NodeBoundedLogReader } from "./log.service";
import { NodeHttpClient, NodeRuntimeFileSystem, RuntimeService } from "./runtime.service";
import { StoredSecretRedactor } from "./secret-redactor";
import { UpdateService } from "./update.service";
import { YarrResolver } from "./yarr.resolver";

@Module({
  providers: [
    SafeCommandRunner,
    FlockService,
    NodeConfigFileSystem,
    NodeRuntimeFileSystem,
    NodeHttpClient,
    NodeBoundedLogReader,
    StoredSecretRedactor,
    DockerService,
    {
      provide: RuntimeService,
      inject: [SafeCommandRunner, NodeRuntimeFileSystem, NodeHttpClient],
      useFactory: (commands: SafeCommandRunner, files: NodeRuntimeFileSystem, http: NodeHttpClient) =>
        new RuntimeService(commands, files, http),
    },
    {
      provide: ConfigService,
      inject: [NodeConfigFileSystem, FlockService, RuntimeService],
      useFactory: (files: NodeConfigFileSystem, lock: FlockService, runtime: RuntimeService) =>
        new ConfigService(files, lock, runtime),
    },
    {
      provide: LogService,
      inject: [NodeBoundedLogReader, StoredSecretRedactor, FlockService],
      useFactory: (reader: NodeBoundedLogReader, redactor: StoredSecretRedactor, lock: FlockService) =>
        new LogService(reader, redactor, lock),
    },
    {
      provide: ImportService,
      inject: [ConfigService],
      useFactory: (config: ConfigService) => new ImportService(config),
    },
    {
      provide: DiscoveryService,
      inject: [DockerService, ConfigService],
      useFactory: (docker: DockerService, config: ConfigService) => new DiscoveryService(docker, config),
    },
    {
      provide: UpdateService,
      inject: [SafeCommandRunner],
      useFactory: (commands: SafeCommandRunner) => new UpdateService(commands),
    },
    YarrResolver,
  ],
})
export class ApiModule {}
