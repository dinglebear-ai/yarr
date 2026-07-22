import { chmod, copyFile, open, readFile, rename, rm, stat, writeFile } from "node:fs/promises";

import {
  mergeConfigInput,
  parsePluginConfig,
  parseYarrEnvironment,
  serializePluginConfig,
  serializeYarrEnvironment,
  toPublicConfig,
} from "./config-codec";
import type { ParsedConfigState, SaveYarrConfigInput, YarrConfigView } from "./config.types";
import { LockLostError, type LockLease, type LockService } from "./flock.service";
import {
  YARR_CONFIG_DIR,
  YARR_ENVIRONMENT_GOOD_PATH,
  YARR_ENVIRONMENT_GOOD_RESTORE_PATH,
  YARR_ENVIRONMENT_GOOD_TRANSACTION_PATH,
  YARR_ENVIRONMENT_NEXT_PATH,
  YARR_ENVIRONMENT_PATH,
  YARR_ENVIRONMENT_TRANSACTION_PATH,
  YARR_PLUGIN_CONFIG_GOOD_PATH,
  YARR_PLUGIN_CONFIG_GOOD_RESTORE_PATH,
  YARR_PLUGIN_CONFIG_GOOD_TRANSACTION_PATH,
  YARR_PLUGIN_CONFIG_NEXT_PATH,
  YARR_PLUGIN_CONFIG_PATH,
  YARR_PLUGIN_CONFIG_TRANSACTION_PATH,
} from "./paths";
import type { RuntimeState } from "./runtime.service";
import { collectSecretValues, redactSecrets } from "./secret-redactor";

export interface ConfigFileSystem {
  readFile(path: string): Promise<string>;
  writeFile(path: string, text: string, mode: number): Promise<void>;
  syncFile(path: string): Promise<void>;
  syncDirectory(path: string): Promise<void>;
  rename(from: string, to: string): Promise<void>;
  copyFile(from: string, to: string, mode: number): Promise<void>;
  chmod(path: string, mode: number): Promise<void>;
  exists(path: string): Promise<boolean>;
  remove(path: string): Promise<void>;
}

export interface RuntimeController {
  status(options: { lockFd: number; secrets: readonly string[] }): Promise<RuntimeState>;
  restart(options: { lockFd: number; secrets: readonly string[] }): Promise<RuntimeState>;
  stop(options: { lockFd: number; secrets: readonly string[] }): Promise<RuntimeState>;
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

  async chmod(path: string, mode: number): Promise<void> {
    await chmod(path, mode);
  }

  async exists(path: string): Promise<boolean> {
    try {
      await stat(path);
      return true;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") return false;
      throw error;
    }
  }

  async remove(path: string): Promise<void> {
    await rm(path, { force: true });
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
      const secrets = [...new Set([
        ...collectSecretValues(current.env.values),
        ...collectSecretValues(prospective.env.values),
      ])];
      const currentSecrets = collectSecretValues(current.env.values);
      const priorRuntime = await this.runtime.status({ lockFd: lease.fd, secrets: currentSecrets });
      lease.assertHeld();
      assertStablePriorRuntime(priorRuntime);
      await this.repairModes(lease);

      if (effectiveFingerprint(current) === effectiveFingerprint(prospective)) {
        return { config: currentView, changed: false, restarted: false, rolledBack: false };
      }

      let installed = false;
      let backup: RotationBackup | undefined;
      try {
        backup = await this.install(nextPlugin, nextEnvironment, lease);
        installed = true;
        const applied = nextView.plugin.enabled
          ? await this.runtime.restart({ lockFd: lease.fd, secrets })
          : await this.runtime.stop({ lockFd: lease.fd, secrets });
        assertDesiredRuntime(applied, nextView.plugin.enabled);
        lease.assertHeld();
        await this.cleanupTransactionBackups(backup!);
        return { config: nextView, changed: true, restarted: true, rolledBack: false };
      } catch (error) {
        if (!installed) throw redactedError(error, secrets);
        const original = errorMessage(error);
        try {
          await this.restoreKnownGood(lease);
          const restored = priorRuntime.state === "running" && priorRuntime.ready
            ? await this.runtime.restart({ lockFd: lease.fd, secrets: currentSecrets })
            : await this.runtime.stop({ lockFd: lease.fd, secrets: currentSecrets });
          assertRestoredRuntime(restored, priorRuntime);
          if (backup) await this.cleanupTransactionBackups(backup);
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

  private async install(
    plugin: string,
    environment: string,
    lease: LockLease,
  ): Promise<RotationBackup> {
    const hadPreviousGoodPair =
      await this.files.exists(YARR_PLUGIN_CONFIG_GOOD_PATH) &&
      await this.files.exists(YARR_ENVIRONMENT_GOOD_PATH);
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
      await this.files.copyFile(YARR_PLUGIN_CONFIG_PATH, YARR_PLUGIN_CONFIG_TRANSACTION_PATH, 0o600);
      await this.files.copyFile(YARR_ENVIRONMENT_PATH, YARR_ENVIRONMENT_TRANSACTION_PATH, 0o600);
      await this.files.syncFile(YARR_PLUGIN_CONFIG_TRANSACTION_PATH);
      await this.files.syncFile(YARR_ENVIRONMENT_TRANSACTION_PATH);
      if (hadPreviousGoodPair) {
        await this.files.copyFile(
          YARR_PLUGIN_CONFIG_GOOD_PATH,
          YARR_PLUGIN_CONFIG_GOOD_TRANSACTION_PATH,
          0o600,
        );
        await this.files.copyFile(
          YARR_ENVIRONMENT_GOOD_PATH,
          YARR_ENVIRONMENT_GOOD_TRANSACTION_PATH,
          0o600,
        );
        await this.files.syncFile(YARR_PLUGIN_CONFIG_GOOD_TRANSACTION_PATH);
        await this.files.syncFile(YARR_ENVIRONMENT_GOOD_TRANSACTION_PATH);
      }
      await this.files.syncDirectory(YARR_CONFIG_DIR);
      await this.files.rename(YARR_PLUGIN_CONFIG_PATH, YARR_PLUGIN_CONFIG_GOOD_PATH);
      pluginMovedToGood = true;
      await this.files.rename(YARR_ENVIRONMENT_PATH, YARR_ENVIRONMENT_GOOD_PATH);
      environmentMovedToGood = true;
      await this.files.rename(YARR_PLUGIN_CONFIG_NEXT_PATH, YARR_PLUGIN_CONFIG_PATH);
      await this.files.rename(YARR_ENVIRONMENT_NEXT_PATH, YARR_ENVIRONMENT_PATH);
      await this.files.syncDirectory(YARR_CONFIG_DIR);
      lease.assertHeld();
      return { hadPreviousGoodPair };
    } catch (error) {
      try {
        if (pluginMovedToGood || environmentMovedToGood) {
          await this.restorePairFromTransaction(
            YARR_PLUGIN_CONFIG_TRANSACTION_PATH,
            YARR_ENVIRONMENT_TRANSACTION_PATH,
            YARR_PLUGIN_CONFIG_NEXT_PATH,
            YARR_ENVIRONMENT_NEXT_PATH,
            YARR_PLUGIN_CONFIG_PATH,
            YARR_ENVIRONMENT_PATH,
          );
          if (hadPreviousGoodPair) {
            await this.restorePairFromTransaction(
              YARR_PLUGIN_CONFIG_GOOD_TRANSACTION_PATH,
              YARR_ENVIRONMENT_GOOD_TRANSACTION_PATH,
              YARR_PLUGIN_CONFIG_GOOD_RESTORE_PATH,
              YARR_ENVIRONMENT_GOOD_RESTORE_PATH,
              YARR_PLUGIN_CONFIG_GOOD_PATH,
              YARR_ENVIRONMENT_GOOD_PATH,
            );
          } else {
            await this.files.remove(YARR_PLUGIN_CONFIG_GOOD_PATH);
            await this.files.remove(YARR_ENVIRONMENT_GOOD_PATH);
            await this.files.syncDirectory(YARR_CONFIG_DIR);
          }
        }
        await this.cleanupTransactionBackups({ hadPreviousGoodPair });
      } catch (recoveryError) {
        throw new Error(
          `configuration install recovery failed after ${errorMessage(error)}: ${errorMessage(recoveryError)}`,
        );
      }
      throw error;
    }
  }

  private async repairModes(lease: LockLease): Promise<void> {
    await this.files.chmod(YARR_PLUGIN_CONFIG_PATH, 0o600);
    await this.files.chmod(YARR_ENVIRONMENT_PATH, 0o600);
    await this.files.syncFile(YARR_PLUGIN_CONFIG_PATH);
    await this.files.syncFile(YARR_ENVIRONMENT_PATH);
    await this.files.syncDirectory(YARR_CONFIG_DIR);
    lease.assertHeld();
  }

  private async restorePairFromTransaction(
    pluginSource: string,
    environmentSource: string,
    pluginStage: string,
    environmentStage: string,
    pluginTarget: string,
    environmentTarget: string,
  ): Promise<void> {
    await this.files.copyFile(pluginSource, pluginStage, 0o600);
    await this.files.copyFile(environmentSource, environmentStage, 0o600);
    await this.files.syncFile(pluginStage);
    await this.files.syncFile(environmentStage);
    await this.files.syncDirectory(YARR_CONFIG_DIR);
    await this.files.rename(pluginStage, pluginTarget);
    await this.files.rename(environmentStage, environmentTarget);
    await this.files.syncDirectory(YARR_CONFIG_DIR);
  }

  private async cleanupTransactionBackups(backup: RotationBackup): Promise<void> {
    await this.files.remove(YARR_PLUGIN_CONFIG_TRANSACTION_PATH);
    await this.files.remove(YARR_ENVIRONMENT_TRANSACTION_PATH);
    if (backup.hadPreviousGoodPair) {
      await this.files.remove(YARR_PLUGIN_CONFIG_GOOD_TRANSACTION_PATH);
      await this.files.remove(YARR_ENVIRONMENT_GOOD_TRANSACTION_PATH);
    }
    await this.files.syncDirectory(YARR_CONFIG_DIR);
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

interface RotationBackup {
  hadPreviousGoodPair: boolean;
}

const KNOWN_PLUGIN_KEYS = new Set([
  "ENABLED",
  "BIND_MODE",
  "CUSTOM_HOST",
  "PORT",
  "AUTH_MODE",
  "TAILSCALE_SERVE",
  "TAILSCALE_HOSTNAME",
  "LOG_LEVEL",
  "UPDATE_CHANNEL",
]);

function effectiveFingerprint(state: ParsedConfigState): string {
  const plugin = toPublicConfig(state.plugin, state.env).plugin;
  const unknownPlugin = Object.entries(state.plugin.values)
    .filter(([key]) => !KNOWN_PLUGIN_KEYS.has(key))
    .sort(([left], [right]) => left.localeCompare(right));
  const environment = Object.entries(state.env.values)
    .sort(([left], [right]) => left.localeCompare(right));
  return JSON.stringify({ plugin, unknownPlugin, environment });
}

function assertDesiredRuntime(state: RuntimeState, enabled: boolean): void {
  if (enabled && (state.state !== "running" || !state.ready)) {
    throw new Error("enabled runtime did not become running and ready");
  }
  if (!enabled && state.state !== "stopped") {
    throw new Error("disabled runtime did not stop");
  }
}

function assertStablePriorRuntime(state: RuntimeState): void {
  if (state.state === "stopped") return;
  if (state.state === "running" && state.ready) return;
  throw new Error("prior runtime state is not stable and exactly restorable");
}

function assertRestoredRuntime(restored: RuntimeState, prior: RuntimeState): void {
  const priorWasRunning = prior.state === "running" && prior.ready;
  if (priorWasRunning && (restored.state !== "running" || !restored.ready)) {
    throw new Error("rollback did not restore running and ready state");
  }
  if (!priorWasRunning && restored.state !== "stopped") {
    throw new Error("rollback did not restore stopped state");
  }
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function redactedError(error: unknown, secrets: readonly string[]): Error {
  return new Error(redactSecrets(errorMessage(error), secrets));
}
