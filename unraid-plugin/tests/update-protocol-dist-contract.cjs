#!/usr/bin/env node
"use strict";

const assert = require("node:assert/strict");
const path = require("node:path");

const Operation = Object.freeze({
  CHECK: "CHECK",
  APPLY: "APPLY",
  RESET: "RESET",
  ROLLBACK: "ROLLBACK",
});
const Outcome = Object.freeze({
  CHECK_NO_COMPATIBLE_RELEASE: "CHECK_NO_COMPATIBLE_RELEASE",
  CHECK_UPDATE_AVAILABLE: "CHECK_UPDATE_AVAILABLE",
  CHECK_CURRENT: "CHECK_CURRENT",
  APPLY_CURRENT: "APPLY_CURRENT",
  APPLY_UPDATED: "APPLY_UPDATED",
  APPLY_FAILED_BEFORE_ACTIVATION: "APPLY_FAILED_BEFORE_ACTIVATION",
  APPLY_RESTORED: "APPLY_RESTORED",
  APPLY_RESTORATION_INCOMPLETE: "APPLY_RESTORATION_INCOMPLETE",
  RESET_COMPLETED: "RESET_COMPLETED",
  RESET_FAILED_BEFORE_MUTATION: "RESET_FAILED_BEFORE_MUTATION",
  RESET_RESTORED: "RESET_RESTORED",
  RESET_RESTORATION_INCOMPLETE: "RESET_RESTORATION_INCOMPLETE",
  ROLLBACK_COMPLETED: "ROLLBACK_COMPLETED",
  ROLLBACK_UNAVAILABLE: "ROLLBACK_UNAVAILABLE",
  ROLLBACK_FAILED_BEFORE_ACTIVATION: "ROLLBACK_FAILED_BEFORE_ACTIVATION",
  ROLLBACK_RESTORED: "ROLLBACK_RESTORED",
  ROLLBACK_RESTORATION_INCOMPLETE: "ROLLBACK_RESTORATION_INCOMPLETE",
});

function response(operation, outcome, overrides = {}) {
  return {
    operation,
    outcome,
    installedVersion: "2.0.0",
    packagedVersion: "2.0.0",
    availableVersion: "",
    updateAvailable: false,
    usingOverlay: false,
    rollbackAvailable: false,
    rolledBack: false,
    cleanupPending: false,
    recoveryIdentifier: "",
    message: "Yarr is current",
    ...overrides,
  };
}

const validCases = [
  ["check without release", Operation.CHECK, 0, response(Operation.CHECK, Outcome.CHECK_NO_COMPATIBLE_RELEASE, { message: "No compatible release is available" })],
  ["check update", Operation.CHECK, 0, response(Operation.CHECK, Outcome.CHECK_UPDATE_AVAILABLE, { availableVersion: "2.1.0", updateAvailable: true, message: "Update available: 2.1.0" })],
  ["check current", Operation.CHECK, 0, response(Operation.CHECK, Outcome.CHECK_CURRENT, { availableVersion: "2.0.0" })],
  ["apply current", Operation.APPLY, 0, response(Operation.APPLY, Outcome.APPLY_CURRENT, { availableVersion: "2.0.0" })],
  ["apply committed", Operation.APPLY, 0, response(Operation.APPLY, Outcome.APPLY_UPDATED, { installedVersion: "2.1.0", availableVersion: "2.1.0", usingOverlay: true, rollbackAvailable: true, message: "Yarr updated to 2.1.0" })],
  ["apply committed cleanup", Operation.APPLY, 1, response(Operation.APPLY, Outcome.APPLY_UPDATED, { installedVersion: "2.1.0", availableVersion: "2.1.0", usingOverlay: true, rollbackAvailable: true, cleanupPending: true, recoveryIdentifier: ".yarr.update.recovery.C1e2A3n4", message: "Yarr updated; obsolete backup cleanup pending" })],
  ["apply pre-activation failure", Operation.APPLY, 1, response(Operation.APPLY, Outcome.APPLY_FAILED_BEFORE_ACTIVATION, { availableVersion: "2.1.0", updateAvailable: true, message: "Update failed before activation" })],
  ["apply pre-activation cleanup", Operation.APPLY, 1, response(Operation.APPLY, Outcome.APPLY_FAILED_BEFORE_ACTIVATION, { availableVersion: "2.1.0", updateAvailable: true, cleanupPending: true, recoveryIdentifier: ".yarr.update.recovery.Ab12Cd34", message: "Update failed before activation" })],
  ["apply restored", Operation.APPLY, 1, response(Operation.APPLY, Outcome.APPLY_RESTORED, { availableVersion: "2.1.0", updateAvailable: true, rolledBack: true, message: "Update failed; previous binary restored" })],
  ["apply restored cleanup", Operation.APPLY, 1, response(Operation.APPLY, Outcome.APPLY_RESTORED, { availableVersion: "2.1.0", updateAvailable: true, rolledBack: true, cleanupPending: true, recoveryIdentifier: ".yarr.update.recovery.R3s4T5o6", message: "Update failed; previous binary restored" })],
  ["apply restoration incomplete", Operation.APPLY, 1, response(Operation.APPLY, Outcome.APPLY_RESTORATION_INCOMPLETE, { availableVersion: "2.1.0", updateAvailable: true, usingOverlay: true, message: "Update failed; restoration incomplete; recovery snapshots retained" })],
  ["reset completed", Operation.RESET, 0, response(Operation.RESET, Outcome.RESET_COMPLETED, { message: "Yarr reset to packaged binary" })],
  ["reset completed cleanup", Operation.RESET, 1, response(Operation.RESET, Outcome.RESET_COMPLETED, { cleanupPending: true, recoveryIdentifier: ".yarr.reset.recovery.C1e2A3n4", message: "Yarr reset; updater backup cleanup pending" })],
  ["reset pre-mutation failure", Operation.RESET, 1, response(Operation.RESET, Outcome.RESET_FAILED_BEFORE_MUTATION, { usingOverlay: true, rollbackAvailable: true, message: "Reset failed before mutation" })],
  ["reset pre-mutation cleanup", Operation.RESET, 1, response(Operation.RESET, Outcome.RESET_FAILED_BEFORE_MUTATION, { usingOverlay: true, rollbackAvailable: true, cleanupPending: true, recoveryIdentifier: ".yarr.reset.recovery.Z9y8X7w6", message: "Reset failed before mutation" })],
  ["reset restored", Operation.RESET, 1, response(Operation.RESET, Outcome.RESET_RESTORED, { usingOverlay: true, rollbackAvailable: true, rolledBack: true, message: "Reset failed; previous binary restored" })],
  ["reset restored cleanup", Operation.RESET, 1, response(Operation.RESET, Outcome.RESET_RESTORED, { usingOverlay: true, rollbackAvailable: true, rolledBack: true, cleanupPending: true, recoveryIdentifier: ".yarr.reset.recovery.R3s4T5o6", message: "Reset failed; previous binary restored" })],
  ["reset restoration incomplete", Operation.RESET, 1, response(Operation.RESET, Outcome.RESET_RESTORATION_INCOMPLETE, { message: "Reset failed; restoration incomplete; recovery snapshots retained" })],
  ["rollback completed", Operation.ROLLBACK, 0, response(Operation.ROLLBACK, Outcome.ROLLBACK_COMPLETED, { installedVersion: "2.0.1", usingOverlay: true, rollbackAvailable: true, message: "Yarr rolled back to previous binary" })],
  ["rollback completed cleanup", Operation.ROLLBACK, 1, response(Operation.ROLLBACK, Outcome.ROLLBACK_COMPLETED, { installedVersion: "2.0.1", usingOverlay: true, rollbackAvailable: true, cleanupPending: true, recoveryIdentifier: ".yarr.rollback.recovery.C1e2A3n4", message: "Yarr rolled back; recovery snapshot cleanup pending" })],
  ["rollback unavailable", Operation.ROLLBACK, 1, response(Operation.ROLLBACK, Outcome.ROLLBACK_UNAVAILABLE, { message: "Manual rollback is unavailable; no previous binary exists" })],
  ["rollback pre-activation failure", Operation.ROLLBACK, 1, response(Operation.ROLLBACK, Outcome.ROLLBACK_FAILED_BEFORE_ACTIVATION, { usingOverlay: true, rollbackAvailable: true, message: "Rollback failed before activation" })],
  ["rollback pre-activation cleanup", Operation.ROLLBACK, 1, response(Operation.ROLLBACK, Outcome.ROLLBACK_FAILED_BEFORE_ACTIVATION, { usingOverlay: true, rollbackAvailable: true, cleanupPending: true, recoveryIdentifier: ".yarr.rollback.recovery.P1r2E3p4", message: "Rollback failed before activation" })],
  ["rollback restored", Operation.ROLLBACK, 1, response(Operation.ROLLBACK, Outcome.ROLLBACK_RESTORED, { usingOverlay: true, rollbackAvailable: true, rolledBack: true, message: "Rollback failed; current binary restored" })],
  ["rollback restored cleanup", Operation.ROLLBACK, 1, response(Operation.ROLLBACK, Outcome.ROLLBACK_RESTORED, { usingOverlay: true, rollbackAvailable: true, rolledBack: true, cleanupPending: true, recoveryIdentifier: ".yarr.rollback.recovery.R3s4T5o6", message: "Rollback failed; current binary restored" })],
  ["rollback restoration incomplete", Operation.ROLLBACK, 1, response(Operation.ROLLBACK, Outcome.ROLLBACK_RESTORATION_INCOMPLETE, { usingOverlay: true, rollbackAvailable: true, message: "Rollback failed; restoration incomplete; recovery snapshots retained" })],
];

const overlayTrue = new Set([
  Outcome.APPLY_UPDATED,
  Outcome.ROLLBACK_COMPLETED,
  Outcome.ROLLBACK_FAILED_BEFORE_ACTIVATION,
  Outcome.ROLLBACK_RESTORED,
]);
const overlayFalse = new Set([Outcome.RESET_COMPLETED]);
const rollbackTrue = new Set([
  Outcome.ROLLBACK_COMPLETED,
  Outcome.ROLLBACK_FAILED_BEFORE_ACTIVATION,
  Outcome.ROLLBACK_RESTORED,
]);
const rollbackFalse = new Set([Outcome.RESET_COMPLETED, Outcome.ROLLBACK_UNAVAILABLE]);
const currentOutcomes = new Set([Outcome.CHECK_CURRENT, Outcome.APPLY_CURRENT]);
const aheadOutcomes = new Set([
  Outcome.CHECK_UPDATE_AVAILABLE,
  Outcome.APPLY_FAILED_BEFORE_ACTIVATION,
  Outcome.APPLY_RESTORED,
]);

function impossibleMutations(candidate) {
  const [, operation, , value] = candidate;
  const mutate = (name, overrides) => [name, { ...value, ...overrides }];
  const sibling = validCases.find((other) => other[1] === operation && other[3].outcome !== value.outcome);
  const mutations = [
    mutate("installed leading zero", { installedVersion: "02.0.0" }),
    mutate("installed prerelease", { installedVersion: "2.0.0-rc.1" }),
    mutate("installed overflow", { installedVersion: "9223372036854775808.0.0" }),
    mutate("packaged metadata", { packagedVersion: "2.0.0+build" }),
    mutate("packaged major", { packagedVersion: "3.0.0" }),
    mutate("available grammar", { availableVersion: "2.1.0-rc.1" }),
    mutate("available major", { availableVersion: "3.0.0" }),
    mutate("update flag", { updateAvailable: !value.updateAvailable }),
    mutate("rolled-back flag", { rolledBack: !value.rolledBack }),
    mutate("cleanup flag", { cleanupPending: !value.cleanupPending }),
    mutate("recovery traversal", { recoveryIdentifier: "../.yarr.update.recovery.Ab12Cd34" }),
    mutate("message class", { message: `${value.message}!` }),
    value.availableVersion === ""
      ? mutate("unexpected available", { availableVersion: "2.0.1" })
      : mutate("missing available", { availableVersion: "" }),
  ];
  if (sibling) mutations.push(mutate("same-operation outcome", { outcome: sibling[3].outcome }));
  if (!value.usingOverlay) mutations.push(mutate("packaged selection", { installedVersion: "2.0.1" }));
  if (value.rollbackAvailable) {
    mutations.push(mutate("rollback without overlay", { usingOverlay: false }));
  } else if (!value.usingOverlay) {
    mutations.push(mutate("rollback advertised without overlay", { rollbackAvailable: true }));
  }
  if (overlayTrue.has(value.outcome) || overlayFalse.has(value.outcome)) {
    mutations.push(mutate("outcome overlay", { usingOverlay: !value.usingOverlay }));
  }
  if (rollbackTrue.has(value.outcome) || rollbackFalse.has(value.outcome)) {
    mutations.push(mutate("outcome rollback", { rollbackAvailable: !value.rollbackAvailable }));
  }
  if (currentOutcomes.has(value.outcome)) {
    mutations.push(mutate("current inequality", { availableVersion: "2.0.1" }));
  }
  if (aheadOutcomes.has(value.outcome)) {
    mutations.push(mutate("required update equality", {
      availableVersion: value.installedVersion,
      updateAvailable: true,
    }));
    mutations.push(mutate("required update downgrade", {
      availableVersion: "2.0.0",
      installedVersion: "2.0.1",
      updateAvailable: true,
      usingOverlay: true,
    }));
  }
  if (value.outcome === Outcome.APPLY_UPDATED) {
    mutations.push(mutate("committed mismatch", { installedVersion: "2.0.9" }));
  }
  if (value.outcome === Outcome.RESET_COMPLETED) {
    mutations.push(mutate("reset package mismatch", {
      installedVersion: "2.0.1",
      usingOverlay: true,
    }));
  }
  for (const key of Object.keys(value)) {
    mutations.push(mutate(`${key} nullability`, { [key]: null }));
  }
  return mutations;
}

const modulePaths = process.argv.slice(2);
if (modulePaths.length === 0) {
  process.stderr.write("usage: update-protocol-dist-contract.cjs UPDATE_SERVICE_JS [...]\n");
  process.exit(2);
}

let rejectedMutations = 0;
for (const requestedPath of modulePaths) {
  const modulePath = path.resolve(requestedPath);
  const { validateUpdateProtocolResponse } = require(modulePath);
  assert.equal(
    typeof validateUpdateProtocolResponse,
    "function",
    `${modulePath} does not export validateUpdateProtocolResponse`,
  );
  for (const candidate of validCases) {
    const [name, operation, exitCode, value] = candidate;
    assert.deepEqual(
      validateUpdateProtocolResponse(operation, exitCode, JSON.stringify(value)),
      value,
      `${modulePath}: legitimate row rejected: ${name}`,
    );
    for (const [mutationName, mutation] of impossibleMutations(candidate)) {
      rejectedMutations += 1;
      assert.throws(
        () => validateUpdateProtocolResponse(operation, exitCode, JSON.stringify(mutation)),
        /invalid update response/,
        `${modulePath}: impossible tuple accepted: ${name}: ${mutationName}`,
      );
    }
  }
}

process.stdout.write(
  `updater protocol dist contract: PASS (${modulePaths.length} modules, ${validCases.length} rows, ${rejectedMutations} rejected mutations)\n`,
);
