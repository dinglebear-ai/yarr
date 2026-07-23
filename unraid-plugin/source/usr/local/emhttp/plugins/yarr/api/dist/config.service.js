"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConfigService = exports.NodeConfigFileSystem = void 0;
const promises_1 = require("node:fs/promises");
const config_codec_1 = require("./config-codec");
const command_runner_1 = require("./command-runner");
const flock_service_1 = require("./flock.service");
const paths_1 = require("./paths");
const secret_redactor_1 = require("./secret-redactor");
const FATAL_MANUAL_INTERVENTION = "Yarr lifecycle state is indeterminate because the command process group did not close; configuration was not rolled back; manual intervention required";
class NodeConfigFileSystem {
    async readFile(path) {
        return (0, promises_1.readFile)(path, "utf8");
    }
    async writeFile(path, text, mode) {
        await (0, promises_1.writeFile)(path, text, { encoding: "utf8", mode, flag: "w" });
        await (0, promises_1.chmod)(path, mode);
    }
    async syncFile(path) {
        const handle = await (0, promises_1.open)(path, "r");
        try {
            await handle.sync();
        }
        finally {
            await handle.close();
        }
    }
    async syncDirectory(path) {
        const handle = await (0, promises_1.open)(path, "r");
        try {
            await handle.sync();
        }
        finally {
            await handle.close();
        }
    }
    async rename(from, to) {
        await (0, promises_1.rename)(from, to);
    }
    async copyFile(from, to, mode) {
        await (0, promises_1.copyFile)(from, to);
        await (0, promises_1.chmod)(to, mode);
    }
    async chmod(path, mode) {
        await (0, promises_1.chmod)(path, mode);
    }
    async exists(path) {
        try {
            await (0, promises_1.stat)(path);
            return true;
        }
        catch (error) {
            if (error.code === "ENOENT")
                return false;
            throw error;
        }
    }
    async remove(path) {
        await (0, promises_1.rm)(path, { force: true });
    }
}
exports.NodeConfigFileSystem = NodeConfigFileSystem;
class ConfigService {
    files;
    lock;
    runtime;
    constructor(files, lock, runtime) {
        this.files = files;
        this.lock = lock;
        this.runtime = runtime;
    }
    async read() {
        return this.lock.withLock(async (lease) => {
            const state = await this.readState(lease);
            return (0, config_codec_1.toPublicConfig)(state.plugin, state.env);
        });
    }
    async save(input) {
        return this.lock.withLock(async (lease) => {
            const current = await this.readState(lease);
            const prospective = (0, config_codec_1.mergeConfigInput)(current, input);
            lease.assertHeld();
            const currentPlugin = (0, config_codec_1.serializePluginConfig)(current.plugin);
            const currentEnvironment = (0, config_codec_1.serializeYarrEnvironment)(current.env);
            const nextPlugin = (0, config_codec_1.serializePluginConfig)(prospective.plugin);
            const nextEnvironment = (0, config_codec_1.serializeYarrEnvironment)(prospective.env);
            const currentView = (0, config_codec_1.toPublicConfig)(current.plugin, current.env);
            const nextView = (0, config_codec_1.toPublicConfig)(prospective.plugin, prospective.env);
            const secrets = [...new Set([
                    ...(0, secret_redactor_1.collectSecretValues)(current.env.values),
                    ...(0, secret_redactor_1.collectSecretValues)(prospective.env.values),
                ])];
            const currentSecrets = (0, secret_redactor_1.collectSecretValues)(current.env.values);
            const priorRuntime = await this.runtime.status({ lockFd: lease.fd, secrets: currentSecrets });
            lease.assertHeld();
            assertStablePriorRuntime(priorRuntime);
            await this.repairModes(lease);
            if (effectiveFingerprint(current) === effectiveFingerprint(prospective)) {
                return { config: currentView, changed: false, restarted: false, rolledBack: false };
            }
            let installed = false;
            let backup;
            try {
                backup = await this.install(nextPlugin, nextEnvironment, lease);
                installed = true;
                const applied = nextView.plugin.enabled
                    ? await this.runtime.restart({ lockFd: lease.fd, secrets })
                    : await this.runtime.stop({ lockFd: lease.fd, secrets });
                assertDesiredRuntime(applied, nextView.plugin.enabled);
                lease.assertHeld();
                await this.cleanupTransactionBackups(backup);
                return { config: nextView, changed: true, restarted: true, rolledBack: false };
            }
            catch (error) {
                if (error instanceof command_runner_1.FatalCommandError) {
                    throw new command_runner_1.FatalCommandError((0, secret_redactor_1.redactSecrets)(FATAL_MANUAL_INTERVENTION, secrets));
                }
                if (!installed)
                    throw redactedError(error, secrets);
                const original = errorMessage(error);
                try {
                    const rollback = await this.installKnownGoodRollback(lease);
                    const restored = priorRuntime.state === "running" && priorRuntime.ready
                        ? await this.runtime.restart({ lockFd: lease.fd, secrets: currentSecrets })
                        : await this.runtime.stop({ lockFd: lease.fd, secrets: currentSecrets });
                    assertRestoredRuntime(restored, priorRuntime);
                    await this.cleanupTransactionBackups(rollback);
                }
                catch (rollbackError) {
                    throw new Error((0, secret_redactor_1.redactSecrets)(`configuration rollback failed after ${original}: ${errorMessage(rollbackError)}`, secrets));
                }
                if (error instanceof flock_service_1.LockLostError)
                    throw redactedError(error, secrets);
                return {
                    config: currentView,
                    changed: true,
                    restarted: true,
                    rolledBack: true,
                    error: (0, secret_redactor_1.redactSecrets)(original, secrets),
                };
            }
        });
    }
    async readState(lease) {
        await this.recoverConfigTransaction(lease);
        const pluginText = await this.files.readFile(paths_1.YARR_PLUGIN_CONFIG_PATH);
        lease.assertHeld();
        const environmentText = await this.files.readFile(paths_1.YARR_ENVIRONMENT_PATH);
        lease.assertHeld();
        return {
            plugin: (0, config_codec_1.parsePluginConfig)(pluginText),
            env: (0, config_codec_1.parseYarrEnvironment)(environmentText),
        };
    }
    async install(plugin, environment, lease) {
        const hadPreviousGoodPair = await this.files.exists(paths_1.YARR_PLUGIN_CONFIG_GOOD_PATH) &&
            await this.files.exists(paths_1.YARR_ENVIRONMENT_GOOD_PATH);
        let pluginMovedToGood = false;
        let environmentMovedToGood = false;
        try {
            await this.files.writeFile(paths_1.YARR_PLUGIN_CONFIG_NEXT_PATH, plugin, 0o600);
            lease.assertHeld();
            await this.files.writeFile(paths_1.YARR_ENVIRONMENT_NEXT_PATH, environment, 0o600);
            lease.assertHeld();
            await this.files.syncFile(paths_1.YARR_PLUGIN_CONFIG_NEXT_PATH);
            await this.files.syncFile(paths_1.YARR_ENVIRONMENT_NEXT_PATH);
            await this.files.syncDirectory(paths_1.YARR_CONFIG_DIR);
            lease.assertHeld();
            await this.files.copyFile(paths_1.YARR_PLUGIN_CONFIG_PATH, paths_1.YARR_PLUGIN_CONFIG_TRANSACTION_PATH, 0o600);
            await this.files.copyFile(paths_1.YARR_ENVIRONMENT_PATH, paths_1.YARR_ENVIRONMENT_TRANSACTION_PATH, 0o600);
            await this.files.syncFile(paths_1.YARR_PLUGIN_CONFIG_TRANSACTION_PATH);
            await this.files.syncFile(paths_1.YARR_ENVIRONMENT_TRANSACTION_PATH);
            if (hadPreviousGoodPair) {
                await this.files.copyFile(paths_1.YARR_PLUGIN_CONFIG_GOOD_PATH, paths_1.YARR_PLUGIN_CONFIG_GOOD_TRANSACTION_PATH, 0o600);
                await this.files.copyFile(paths_1.YARR_ENVIRONMENT_GOOD_PATH, paths_1.YARR_ENVIRONMENT_GOOD_TRANSACTION_PATH, 0o600);
                await this.files.syncFile(paths_1.YARR_PLUGIN_CONFIG_GOOD_TRANSACTION_PATH);
                await this.files.syncFile(paths_1.YARR_ENVIRONMENT_GOOD_TRANSACTION_PATH);
            }
            await this.files.syncDirectory(paths_1.YARR_CONFIG_DIR);
            await this.files.writeFile(paths_1.YARR_CONFIG_TRANSACTION_STATE_NEXT_PATH, `version=1\nhad_previous_good=${hadPreviousGoodPair ? "yes" : "no"}\n`, 0o600);
            await this.files.syncFile(paths_1.YARR_CONFIG_TRANSACTION_STATE_NEXT_PATH);
            await this.files.rename(paths_1.YARR_CONFIG_TRANSACTION_STATE_NEXT_PATH, paths_1.YARR_CONFIG_TRANSACTION_STATE_PATH);
            await this.files.syncDirectory(paths_1.YARR_CONFIG_DIR);
            lease.assertHeld();
            await this.files.rename(paths_1.YARR_PLUGIN_CONFIG_PATH, paths_1.YARR_PLUGIN_CONFIG_GOOD_PATH);
            pluginMovedToGood = true;
            await this.files.rename(paths_1.YARR_ENVIRONMENT_PATH, paths_1.YARR_ENVIRONMENT_GOOD_PATH);
            environmentMovedToGood = true;
            await this.files.rename(paths_1.YARR_PLUGIN_CONFIG_NEXT_PATH, paths_1.YARR_PLUGIN_CONFIG_PATH);
            await this.files.rename(paths_1.YARR_ENVIRONMENT_NEXT_PATH, paths_1.YARR_ENVIRONMENT_PATH);
            await this.files.syncDirectory(paths_1.YARR_CONFIG_DIR);
            await this.files.remove(paths_1.YARR_CONFIG_TRANSACTION_STATE_PATH);
            await this.files.syncDirectory(paths_1.YARR_CONFIG_DIR);
            lease.assertHeld();
            return { hadPreviousGoodPair };
        }
        catch (error) {
            try {
                if (pluginMovedToGood || environmentMovedToGood || await this.files.exists(paths_1.YARR_CONFIG_TRANSACTION_STATE_PATH)) {
                    await this.recoverConfigTransaction(lease);
                }
                else {
                    await this.cleanupTransactionBackups({ hadPreviousGoodPair });
                }
            }
            catch (recoveryError) {
                throw new Error(`configuration install recovery failed after ${errorMessage(error)}: ${errorMessage(recoveryError)}`);
            }
            throw error;
        }
    }
    async recoverConfigTransaction(lease) {
        if (!await this.files.exists(paths_1.YARR_CONFIG_TRANSACTION_STATE_PATH)) {
            lease.assertHeld();
            return;
        }
        const state = await this.files.readFile(paths_1.YARR_CONFIG_TRANSACTION_STATE_PATH);
        const legacyMatch = /^version=1\nhad_previous_good=(yes|no)\n$/.exec(state);
        const currentMatch = /^version=2\noperation=(install|rollback)\nhad_previous_good=(yes|no)\n$/.exec(state);
        if (!legacyMatch && !currentMatch) {
            throw new Error("invalid Yarr configuration transaction marker; refusing to read a possibly mixed generation");
        }
        const operation = currentMatch?.[1] ?? "install";
        const hadPreviousGoodPair = (currentMatch?.[2] ?? legacyMatch?.[1]) === "yes";
        if (operation === "rollback" && !hadPreviousGoodPair) {
            throw new Error("rollback transaction lacks a known-good pair");
        }
        if (operation === "rollback") {
            for (const path of [paths_1.YARR_PLUGIN_CONFIG_GOOD_PATH, paths_1.YARR_ENVIRONMENT_GOOD_PATH]) {
                if (!await this.files.exists(path)) {
                    throw new Error("rollback transaction lacks durable known-good evidence");
                }
            }
            await this.restorePairFromTransaction(paths_1.YARR_PLUGIN_CONFIG_GOOD_PATH, paths_1.YARR_ENVIRONMENT_GOOD_PATH, paths_1.YARR_PLUGIN_CONFIG_NEXT_PATH, paths_1.YARR_ENVIRONMENT_NEXT_PATH, paths_1.YARR_PLUGIN_CONFIG_PATH, paths_1.YARR_ENVIRONMENT_PATH);
            await this.files.remove(paths_1.YARR_CONFIG_TRANSACTION_STATE_PATH);
            await this.files.syncDirectory(paths_1.YARR_CONFIG_DIR);
            await this.cleanupTransactionBackups({ hadPreviousGoodPair: true });
            lease.assertHeld();
            return;
        }
        for (const path of [paths_1.YARR_PLUGIN_CONFIG_TRANSACTION_PATH, paths_1.YARR_ENVIRONMENT_TRANSACTION_PATH]) {
            if (!await this.files.exists(path)) {
                throw new Error("incomplete Yarr configuration transaction evidence; refusing to synthesize defaults");
            }
        }
        if (hadPreviousGoodPair) {
            for (const path of [
                paths_1.YARR_PLUGIN_CONFIG_GOOD_TRANSACTION_PATH,
                paths_1.YARR_ENVIRONMENT_GOOD_TRANSACTION_PATH,
            ]) {
                if (!await this.files.exists(path)) {
                    throw new Error("incomplete prior known-good transaction evidence; refusing unsafe recovery");
                }
            }
        }
        await this.restorePairFromTransaction(paths_1.YARR_PLUGIN_CONFIG_TRANSACTION_PATH, paths_1.YARR_ENVIRONMENT_TRANSACTION_PATH, paths_1.YARR_PLUGIN_CONFIG_NEXT_PATH, paths_1.YARR_ENVIRONMENT_NEXT_PATH, paths_1.YARR_PLUGIN_CONFIG_PATH, paths_1.YARR_ENVIRONMENT_PATH);
        if (hadPreviousGoodPair) {
            await this.restorePairFromTransaction(paths_1.YARR_PLUGIN_CONFIG_GOOD_TRANSACTION_PATH, paths_1.YARR_ENVIRONMENT_GOOD_TRANSACTION_PATH, paths_1.YARR_PLUGIN_CONFIG_GOOD_RESTORE_PATH, paths_1.YARR_ENVIRONMENT_GOOD_RESTORE_PATH, paths_1.YARR_PLUGIN_CONFIG_GOOD_PATH, paths_1.YARR_ENVIRONMENT_GOOD_PATH);
        }
        else {
            await this.files.remove(paths_1.YARR_PLUGIN_CONFIG_GOOD_PATH);
            await this.files.remove(paths_1.YARR_ENVIRONMENT_GOOD_PATH);
            await this.files.syncDirectory(paths_1.YARR_CONFIG_DIR);
        }
        await this.files.remove(paths_1.YARR_CONFIG_TRANSACTION_STATE_PATH);
        await this.files.syncDirectory(paths_1.YARR_CONFIG_DIR);
        await this.cleanupTransactionBackups({ hadPreviousGoodPair });
        lease.assertHeld();
    }
    async repairModes(lease) {
        await this.files.chmod(paths_1.YARR_PLUGIN_CONFIG_PATH, 0o600);
        await this.files.chmod(paths_1.YARR_ENVIRONMENT_PATH, 0o600);
        await this.files.syncFile(paths_1.YARR_PLUGIN_CONFIG_PATH);
        await this.files.syncFile(paths_1.YARR_ENVIRONMENT_PATH);
        await this.files.syncDirectory(paths_1.YARR_CONFIG_DIR);
        lease.assertHeld();
    }
    async restorePairFromTransaction(pluginSource, environmentSource, pluginStage, environmentStage, pluginTarget, environmentTarget) {
        await this.files.copyFile(pluginSource, pluginStage, 0o600);
        await this.files.copyFile(environmentSource, environmentStage, 0o600);
        await this.files.syncFile(pluginStage);
        await this.files.syncFile(environmentStage);
        await this.files.syncDirectory(paths_1.YARR_CONFIG_DIR);
        await this.files.rename(pluginStage, pluginTarget);
        await this.files.rename(environmentStage, environmentTarget);
        await this.files.syncDirectory(paths_1.YARR_CONFIG_DIR);
    }
    async cleanupTransactionBackups(_backup) {
        await this.files.remove(paths_1.YARR_CONFIG_TRANSACTION_STATE_PATH);
        await this.files.remove(paths_1.YARR_CONFIG_TRANSACTION_STATE_NEXT_PATH);
        await this.files.remove(paths_1.YARR_PLUGIN_CONFIG_TRANSACTION_PATH);
        await this.files.remove(paths_1.YARR_ENVIRONMENT_TRANSACTION_PATH);
        await this.files.remove(paths_1.YARR_PLUGIN_CONFIG_GOOD_TRANSACTION_PATH);
        await this.files.remove(paths_1.YARR_ENVIRONMENT_GOOD_TRANSACTION_PATH);
        await this.files.remove(paths_1.YARR_PLUGIN_CONFIG_GOOD_RESTORE_PATH);
        await this.files.remove(paths_1.YARR_ENVIRONMENT_GOOD_RESTORE_PATH);
        await this.files.syncDirectory(paths_1.YARR_CONFIG_DIR);
    }
    async installKnownGoodRollback(lease) {
        if (!await this.files.exists(paths_1.YARR_PLUGIN_CONFIG_GOOD_PATH) ||
            !await this.files.exists(paths_1.YARR_ENVIRONMENT_GOOD_PATH)) {
            throw new Error("known-good configuration pair is incomplete");
        }
        await this.files.writeFile(paths_1.YARR_CONFIG_TRANSACTION_STATE_NEXT_PATH, "version=2\noperation=rollback\nhad_previous_good=yes\n", 0o600);
        await this.files.syncFile(paths_1.YARR_CONFIG_TRANSACTION_STATE_NEXT_PATH);
        await this.files.rename(paths_1.YARR_CONFIG_TRANSACTION_STATE_NEXT_PATH, paths_1.YARR_CONFIG_TRANSACTION_STATE_PATH);
        await this.files.syncDirectory(paths_1.YARR_CONFIG_DIR);
        lease.assertHeld();
        await this.files.copyFile(paths_1.YARR_PLUGIN_CONFIG_GOOD_PATH, paths_1.YARR_PLUGIN_CONFIG_NEXT_PATH, 0o600);
        await this.files.copyFile(paths_1.YARR_ENVIRONMENT_GOOD_PATH, paths_1.YARR_ENVIRONMENT_NEXT_PATH, 0o600);
        await this.files.syncFile(paths_1.YARR_PLUGIN_CONFIG_NEXT_PATH);
        await this.files.syncFile(paths_1.YARR_ENVIRONMENT_NEXT_PATH);
        await this.files.syncDirectory(paths_1.YARR_CONFIG_DIR);
        await this.files.rename(paths_1.YARR_PLUGIN_CONFIG_NEXT_PATH, paths_1.YARR_PLUGIN_CONFIG_PATH);
        await this.files.rename(paths_1.YARR_ENVIRONMENT_NEXT_PATH, paths_1.YARR_ENVIRONMENT_PATH);
        await this.files.syncDirectory(paths_1.YARR_CONFIG_DIR);
        lease.assertHeld();
        return { hadPreviousGoodPair: true };
    }
}
exports.ConfigService = ConfigService;
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
function effectiveFingerprint(state) {
    const plugin = (0, config_codec_1.toPublicConfig)(state.plugin, state.env).plugin;
    const unknownPlugin = Object.entries(state.plugin.values)
        .filter(([key]) => !KNOWN_PLUGIN_KEYS.has(key))
        .sort(([left], [right]) => left.localeCompare(right));
    const environment = Object.entries(state.env.values)
        .sort(([left], [right]) => left.localeCompare(right));
    return JSON.stringify({ plugin, unknownPlugin, environment });
}
function assertDesiredRuntime(state, enabled) {
    if (enabled && (state.state !== "running" || !state.ready)) {
        throw new Error("enabled runtime did not become running and ready");
    }
    if (!enabled && state.state !== "stopped") {
        throw new Error("disabled runtime did not stop");
    }
}
function assertStablePriorRuntime(state) {
    if (state.state === "stopped")
        return;
    if (state.state === "running" && state.ready)
        return;
    throw new Error("prior runtime state is not stable and exactly restorable");
}
function assertRestoredRuntime(restored, prior) {
    const priorWasRunning = prior.state === "running" && prior.ready;
    if (priorWasRunning && (restored.state !== "running" || !restored.ready)) {
        throw new Error("rollback did not restore running and ready state");
    }
    if (!priorWasRunning && restored.state !== "stopped") {
        throw new Error("rollback did not restore stopped state");
    }
}
function errorMessage(error) {
    return error instanceof Error ? error.message : String(error);
}
function redactedError(error, secrets) {
    const message = (0, secret_redactor_1.redactSecrets)(errorMessage(error), secrets);
    return error instanceof command_runner_1.FatalCommandError ? new command_runner_1.FatalCommandError(message) : new Error(message);
}
