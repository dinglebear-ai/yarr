import { copyFile, open, readFile, rename, writeFile, chmod } from "node:fs/promises";

import {
  collectSecretValues,
  redactSecrets,
} from "./command-runner";
import {
  mergeConfigInput,
  parsePluginConfig,
  parseYarrEnvironment,
  serializePluginConfig,
  serializeYarrEnvironment,
  toPublicConfig,
} from "./config-codec";
import type { SaveYarrConfigInput, YarrConfigView } from "./config.types";
import { LockLostError, type LockLease, type LockService } from "./flock.service";
import {
  YARR_CONFIG_DIR,
  YARR_ENVIRONMENT_GOOD_PATH,
  YARR_ENVIRONMENT_NEXT_PATH,
  YARR_ENVIRONMENT_PATH,
  YARR_PLUGIN_CONFIG_GOOD_PATH,
  YARR_PLUGIN_CONFIG_NEXT_PATH,
  YARR_PLUGIN_CONFIG_PATH,
} from "./paths";

export interface ConfigFileSystem {
  readFile(path: string): Promise<string>;
  writeFile(path: string, text: string, mode: number): Promise<void>;
  syncFile(path: string): Promise<void>;
  syncDirectory(path: string): Promise<void>;
  rename(from: string, to: string): Promise<void>;
  copyFile(from: string, to: string, mode: number): Promise<void>;
}

export interface RuntimeController {
  restart(options: { lockFd: number; secrets: readonly string[] }): Promise<unknown>;
}

export interface SaveConfigResult {
  config: YarrConfigView;
  changed: boolean;
  restarted: boolean;
  rolledBack: boolean;
  error?: string;
}

export class NodeConfigFileSystem implements ConfigFileSystem {
  async readFile(path: string): Promise<string> {
    return readFile(path, "utf8");
  }

  async writeFile(path: string, text: string, mode: number): Promise<void> {
    await writeFile(path, text, { encoding: "utf8", mode, flag: "w" });
    await chmod(path, mode);
  }

  async syncFile(path: string): Promise<void> {
    const handle = await open(path, "r");
    try {
      await handle.sync();
    } finally {
      await handle.close();
    }
  }

  async syncDirectory(path: string): Promise<void> {
    const handle = await open(path, "r");
    try {
      await handle.sync();
    } finally {
      await handle.close();
    }
  }

  async rename(from: string, to: string): Promise<void> {
    await rename(from, to);
  }

  async copyFile(from: string, to: string, mode: number): Promise<void> {
    await copyFile(from, to);
    await chmod(to, mode);
  }
}

export class ConfigService {
  constructor(
    private readonly files: ConfigFileSystem,
    private readonly lock: LockService,
    private readonly runtime: RuntimeController,
  ) {}

  async read(): Promise<YarrConfigView> {
    return this.lock.withLock(async (lease) => {
      const state = await this.readState(lease);
      return toPublicConfig(state.plugin, state.env);
    });
  }

  async save(input: SaveYarrConfigInput): Promise<SaveConfigResult> {
    return this.lock.withLock(async (lease) => {
      const current = await this.readState(lease);
      const prospective = mergeConfigInput(current, input);
      lease.assertHeld();
      const currentPlugin = serializePluginConfig(current.plugin);
      const currentEnvironment = serializeYarrEnvironment(current.env);
      const nextPlugin = serializePluginConfig(prospective.plugin);
      const nextEnvironment = serializeYarrEnvironment(prospective.env);
      const currentView = toPublicConfig(current.plugin, current.env);
      const nextView = toPublicConfig(prospective.plugin, prospective.env);

      if (currentPlugin === nextPlugin && currentEnvironment === nextEnvironment) {
        return { config: currentView, changed: false, restarted: false, rolledBack: false };
      }

      const secrets = [...new Set([
        ...collectSecretValues(current.env.values),
        ...collectSecretValues(prospective.env.values),
      ])];
      let installed = false;
      try {
        await this.install(nextPlugin, nextEnvironment, lease);
        installed = true;
        await this.runtime.restart({ lockFd: lease.fd, secrets });
        lease.assertHeld();
        return { config: nextView, changed: true, restarted: true, rolledBack: false };
      } catch (error) {
        if (!installed) throw redactedError(error, secrets);
        const original = errorMessage(error);
        try {
          await this.restoreKnownGood(lease);
          await this.runtime.restart({
            lockFd: lease.fd,
            secrets: collectSecretValues(current.env.values),
          });
        } catch (rollbackError) {
          throw new Error(
            redactSecrets(
              `configuration rollback failed after ${original}: ${errorMessage(rollbackError)}`,
              secrets,
            ),
          );
        }
        if (error instanceof LockLostError) throw redactedError(error, secrets);
        return {
          config: currentView,
          changed: true,
          restarted: true,
          rolledBack: true,
          error: redactSecrets(original, secrets),
        };
      }
    });
  }

  private async readState(lease: LockLease) {
    const pluginText = await this.files.readFile(YARR_PLUGIN_CONFIG_PATH);
    lease.assertHeld();
    const environmentText = await this.files.readFile(YARR_ENVIRONMENT_PATH);
    lease.assertHeld();
    return {
      plugin: parsePluginConfig(pluginText),
      env: parseYarrEnvironment(environmentText),
    };
  }

  private async install(plugin: string, environment: string, lease: LockLease): Promise<void> {
    let pluginMovedToGood = false;
    let environmentMovedToGood = false;
    try {
      await this.files.writeFile(YARR_PLUGIN_CONFIG_NEXT_PATH, plugin, 0o600);
      lease.assertHeld();
      await this.files.writeFile(YARR_ENVIRONMENT_NEXT_PATH, environment, 0o600);
      lease.assertHeld();
      await this.files.syncFile(YARR_PLUGIN_CONFIG_NEXT_PATH);
      await this.files.syncFile(YARR_ENVIRONMENT_NEXT_PATH);
      await this.files.syncDirectory(YARR_CONFIG_DIR);
      lease.assertHeld();
      await this.files.rename(YARR_PLUGIN_CONFIG_PATH, YARR_PLUGIN_CONFIG_GOOD_PATH);
      pluginMovedToGood = true;
      await this.files.rename(YARR_ENVIRONMENT_PATH, YARR_ENVIRONMENT_GOOD_PATH);
      environmentMovedToGood = true;
      await this.files.rename(YARR_PLUGIN_CONFIG_NEXT_PATH, YARR_PLUGIN_CONFIG_PATH);
      await this.files.rename(YARR_ENVIRONMENT_NEXT_PATH, YARR_ENVIRONMENT_PATH);
      await this.files.syncDirectory(YARR_CONFIG_DIR);
      lease.assertHeld();
    } catch (error) {
      try {
        if (pluginMovedToGood && environmentMovedToGood) {
          await this.restoreKnownGood(lease);
        } else if (pluginMovedToGood) {
          await this.files.rename(YARR_PLUGIN_CONFIG_GOOD_PATH, YARR_PLUGIN_CONFIG_PATH);
          await this.files.syncDirectory(YARR_CONFIG_DIR);
        }
      } catch (recoveryError) {
        throw new Error(
          `configuration install recovery failed after ${errorMessage(error)}: ${errorMessage(recoveryError)}`,
        );
      }
      throw error;
    }
  }

  private async restoreKnownGood(_lease: LockLease): Promise<void> {
    await this.files.copyFile(YARR_PLUGIN_CONFIG_GOOD_PATH, YARR_PLUGIN_CONFIG_NEXT_PATH, 0o600);
    await this.files.copyFile(YARR_ENVIRONMENT_GOOD_PATH, YARR_ENVIRONMENT_NEXT_PATH, 0o600);
    await this.files.syncFile(YARR_PLUGIN_CONFIG_NEXT_PATH);
    await this.files.syncFile(YARR_ENVIRONMENT_NEXT_PATH);
    await this.files.syncDirectory(YARR_CONFIG_DIR);
    await this.files.rename(YARR_PLUGIN_CONFIG_NEXT_PATH, YARR_PLUGIN_CONFIG_PATH);
    await this.files.rename(YARR_ENVIRONMENT_NEXT_PATH, YARR_ENVIRONMENT_PATH);
    await this.files.syncDirectory(YARR_CONFIG_DIR);
  }
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function redactedError(error: unknown, secrets: readonly string[]): Error {
  return new Error(redactSecrets(errorMessage(error), secrets));
}
