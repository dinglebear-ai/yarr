"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StoredSecretRedactor = exports.StoredSecretProvider = void 0;
exports.redactSecrets = redactSecrets;
exports.collectSecretValues = collectSecretValues;
const promises_1 = require("node:fs/promises");
const config_codec_1 = require("./config-codec");
const paths_1 = require("./paths");
const service_catalog_1 = require("./service-catalog");
class StoredSecretProvider {
    files;
    constructor(files = {
        readFile: async (path) => (0, promises_1.readFile)(path, "utf8"),
    }) {
        this.files = files;
    }
    async currentSecrets() {
        const current = (0, config_codec_1.parseYarrEnvironment)(await this.files.readFile(paths_1.YARR_ENVIRONMENT_PATH));
        const knownGoodText = await this.readKnownGood();
        const knownGood = knownGoodText === null ? null : (0, config_codec_1.parseYarrEnvironment)(knownGoodText);
        return [...new Set([
                ...collectSecretValues(current.values),
                ...(knownGood === null ? [] : collectSecretValues(knownGood.values)),
            ])];
    }
    async readKnownGood() {
        try {
            return await this.files.readFile(paths_1.YARR_ENVIRONMENT_GOOD_PATH);
        }
        catch (error) {
            if (error.code === "ENOENT")
                return null;
            throw error;
        }
    }
}
exports.StoredSecretProvider = StoredSecretProvider;
class StoredSecretRedactor {
    provider;
    constructor(provider = new StoredSecretProvider()) {
        this.provider = provider;
    }
    async snapshot() {
        const secrets = await this.provider.currentSecrets();
        return {
            redactMany: (values) => values.map((value) => redactSecrets(value, secrets)),
        };
    }
}
exports.StoredSecretRedactor = StoredSecretRedactor;
function redactSecrets(message, secrets) {
    const unique = [...new Set(secrets.filter((secret) => secret.length > 0))].sort((left, right) => right.length - left.length || left.localeCompare(right));
    let redacted = message;
    let remainingReductionBudget = message.length;
    while (true) {
        const next = unique.reduce((candidate, secret) => candidate.replaceAll(secret, ""), redacted);
        if (next === redacted)
            return redacted;
        const reduction = redacted.length - next.length;
        if (reduction <= 0 || reduction > remainingReductionBudget) {
            throw new Error("secret redaction failed to make bounded progress");
        }
        remainingReductionBudget -= reduction;
        redacted = next;
    }
}
function collectSecretValues(values) {
    return [...new Set(Object.entries(values)
            .filter(([key, value]) => value.length > 0 && (service_catalog_1.SECRET_ENVIRONMENT_KEYS.has(key) ||
            /(?:TOKEN|SECRET|PASSWORD|USERNAME|API_KEY|APIKEY|PRIVATE_KEY)$/.test(key)))
            .sort(([left], [right]) => left.localeCompare(right))
            .map(([, value]) => value))];
}
