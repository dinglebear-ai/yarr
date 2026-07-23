#!/usr/bin/env python3
from __future__ import annotations

import argparse
import re
import sys
from pathlib import Path
from typing import Any

import yaml


class ContractError(Exception):
    pass


def require(condition: bool, message: str) -> None:
    if not condition:
        raise ContractError(message)


def load_workflow(path: Path) -> dict[str, Any]:
    try:
        value = yaml.safe_load(path.read_text(encoding="utf-8"))
    except (OSError, yaml.YAMLError) as exc:
        raise ContractError(f"cannot parse workflow {path}: {exc}") from exc
    require(isinstance(value, dict), f"workflow is not a mapping: {path}")
    return value


def triggers(workflow: dict[str, Any]) -> dict[str, Any]:
    value = workflow.get("on", workflow.get(True))
    require(isinstance(value, dict), "workflow triggers are not structured")
    return value


def jobs(workflow: dict[str, Any]) -> dict[str, Any]:
    value = workflow.get("jobs")
    require(isinstance(value, dict) and value, "workflow jobs are missing")
    return value


def steps(job: dict[str, Any], label: str) -> list[dict[str, Any]]:
    value = job.get("steps")
    require(isinstance(value, list) and value, f"{label} steps are missing")
    require(all(isinstance(step, dict) for step in value), f"{label} has a malformed step")
    return value


def named_step(job: dict[str, Any], name: str, label: str) -> dict[str, Any]:
    matches = [step for step in steps(job, label) if step.get("name") == name]
    require(len(matches) == 1, f"{label} must contain exactly one step named {name}")
    return matches[0]


def step_index(job: dict[str, Any], name: str, label: str) -> int:
    for index, step in enumerate(steps(job, label)):
        if step.get("name") == name:
            return index
    raise ContractError(f"{label} is missing ordered step {name}")


def executable_text(step: dict[str, Any], label: str) -> str:
    run = step.get("run")
    require(isinstance(run, str) and run.strip(), f"{label} is not an executable run step")
    lines = []
    for raw in run.splitlines():
        stripped = raw.strip()
        if not stripped or stripped.startswith("#"):
            continue
        lines.append(stripped)
    return "\n".join(lines)


def require_command(step: dict[str, Any], needle: str, message: str) -> None:
    require(needle in executable_text(step, message), message)


def require_line(step: dict[str, Any], line: str, message: str) -> None:
    require(line in executable_text(step, message).splitlines(), message)


def check_action_pins(workflow: dict[str, Any], label: str) -> None:
    count = 0
    for job_name, job in jobs(workflow).items():
        for step in steps(job, f"{label}.{job_name}"):
            uses = step.get("uses")
            if uses is None:
                continue
            count += 1
            require(
                isinstance(uses, str)
                and re.fullmatch(r"[A-Za-z0-9_.-]+/[A-Za-z0-9_.-]+@[0-9a-f]{40}", uses)
                is not None,
                f"{label} action is not pinned to an immutable SHA: {uses}",
            )
    require(count >= 2, f"{label} workflow has no meaningful action set")


def check_permissions(workflow: dict[str, Any], label: str, release: bool) -> None:
    require(workflow.get("permissions") == {"contents": "read"}, f"{label} top permissions must be contents:read")
    for job_name, job in jobs(workflow).items():
        permissions = job.get("permissions")
        if release and job_name == "publish":
            require(permissions == {"contents": "write"}, "release publish must be the only contents:write job")
        else:
            require(
                permissions in (None, {"contents": "read"}),
                f"{label} job {job_name} grants permission outside its boundary",
            )


def check_token_scope(workflow: dict[str, Any], allowed: set[tuple[str, str]], label: str) -> None:
    require("GH_TOKEN" not in (workflow.get("env") or {}), f"{label} exposes GH_TOKEN at workflow scope")
    seen: set[tuple[str, str]] = set()
    for job_name, job in jobs(workflow).items():
        require("GH_TOKEN" not in (job.get("env") or {}), f"{label} exposes GH_TOKEN at job scope: {job_name}")
        for step in steps(job, f"{label}.{job_name}"):
            env = step.get("env") or {}
            name = str(step.get("name", ""))
            if "GH_TOKEN" in env:
                pair = (job_name, name)
                require(pair in allowed, f"{label} exposes GH_TOKEN to unapproved step: {job_name}/{name}")
                require(env["GH_TOKEN"] == "${{ github.token }}", f"{label} uses an unexpected GH_TOKEN source")
                seen.add(pair)
    require(seen == allowed, f"{label} token-scoped step set differs from the contract")


def check_checkout(step: dict[str, Any], expected_ref: str, label: str) -> None:
    require(str(step.get("uses", "")).startswith("actions/checkout@"), f"{label} is not checkout")
    with_values = step.get("with") or {}
    require(with_values.get("ref") == expected_ref, f"{label} must use resolved source SHA")
    require(with_values.get("persist-credentials") is False, f"{label} must disable persisted credentials")


def check_ci(workflow: dict[str, Any]) -> None:
    check_action_pins(workflow, "CI")
    check_permissions(workflow, "CI", release=False)
    check_token_scope(
        workflow,
        {("verify", "Download checksummed upstream binary inputs")},
        "CI",
    )
    event = triggers(workflow)
    require("workflow_dispatch" in event, "CI workflow lacks manual trigger")
    for trigger in ("push", "pull_request"):
        paths = event.get(trigger, {}).get("paths", [])
        require("unraid-plugin/**" in paths, f"CI {trigger} is not path-scoped to unraid-plugin")
    verify = jobs(workflow).get("verify")
    require(isinstance(verify, dict), "CI verify job is missing")
    require(verify.get("runs-on") == "ubuntu-24.04", "CI runner generation is not fixed")

    api = named_step(verify, "Test and build API extension", "CI.verify")
    web = named_step(verify, "Test and build settings and dashboard elements", "CI.verify")
    semantic = named_step(verify, "Validate workflow syntax and semantics", "CI.verify")
    contracts = named_step(verify, "Run shell and static contracts", "CI.verify")
    download = named_step(verify, "Download checksummed upstream binary inputs", "CI.verify")
    reproduce = named_step(verify, "Build twice and verify committed deterministic package", "CI.verify")
    require_line(api, "cd unraid-plugin/api && npm ci && npm test && npx tsc --noEmit && npx tsc", "CI API gate is incomplete")
    require_line(web, "cd unraid-plugin/web && npm ci && npm test && npx vue-tsc --noEmit && npm run build", "CI web gate is incomplete")
    require_line(semantic, "actionlint .github/workflows/unraid-plugin-ci.yml .github/workflows/unraid-plugin-release.yml", "CI does not run actionlint")
    require_command(semantic, "python3 unraid-plugin/tests/workflow_contract.py", "CI does not run semantic workflow validation")
    require_command(contracts, "bash unraid-plugin/tests/run.sh", "CI aggregate contract gate is missing")
    require_line(download, 'test "$asset_digest" = "sha256:${UPSTREAM_SHA256}"', "CI omits committed upstream digest comparison")
    require_line(download, 'test "$actual_upstream_sha" = "$UPSTREAM_SHA256"', "CI omits downloaded upstream digest comparison")
    require_line(reproduce, 'cmp -- .ci/committed/"$package" "unraid-plugin/packages/$package"', "CI rebuild does not byte-match committed package")
    require_line(reproduce, 'test "$(sha256sum "unraid-plugin/packages/$package" | cut -d\' \' -f1)" = "$PACKAGE_SHA256"', "CI rebuild omits committed package digest comparison")
    require(
        step_index(verify, "Validate workflow syntax and semantics", "CI.verify")
        < step_index(verify, "Run shell and static contracts", "CI.verify")
        < step_index(verify, "Download checksummed upstream binary inputs", "CI.verify")
        < step_index(verify, "Build twice and verify committed deterministic package", "CI.verify"),
        "CI validation/build step order is unsafe",
    )


def check_release(workflow: dict[str, Any]) -> None:
    check_action_pins(workflow, "release")
    check_permissions(workflow, "release", release=True)
    allowed_tokens = {
        ("prepare", "Resolve immutable package tag"),
        ("build", "Snapshot and download upstream binary inputs"),
        ("publish", "Final immutable input verification"),
        ("publish", "Publish package release transactionally"),
    }
    check_token_scope(workflow, allowed_tokens, "release")
    event = triggers(workflow)
    require("workflow_dispatch" in event, "release workflow lacks manual trigger")
    require("unraid-v*" in event.get("push", {}).get("tags", []), "release workflow does not isolate unraid-v* tags")

    release_jobs = jobs(workflow)
    prepare = release_jobs.get("prepare")
    build = release_jobs.get("build")
    publish = release_jobs.get("publish")
    require(all(isinstance(job, dict) for job in (prepare, build, publish)), "release jobs are incomplete")
    require(build.get("needs") == "prepare", "release build job must depend on prepare")
    publish_needs = publish.get("needs")
    require(
        isinstance(publish_needs, list) and set(publish_needs) == {"prepare", "build"} and len(publish_needs) == 2,
        "release publish job must depend on prepare and build",
    )
    for job_name, job in (("prepare", prepare), ("build", build), ("publish", publish)):
        require(job.get("runs-on") == "ubuntu-24.04", f"release {job_name} runner generation is not fixed")

    outputs = prepare.get("outputs") or {}
    require(
        outputs.get("source_sha") == "${{ steps.resolve.outputs.source_sha }}",
        "release prepare does not expose resolved source SHA",
    )
    resolve = named_step(prepare, "Resolve immutable package tag", "release.prepare")
    frozen = named_step(prepare, "Validate frozen release identity", "release.prepare")
    prepare_checkout = named_step(prepare, "Check out resolved package commit", "release.prepare")
    check_checkout(prepare_checkout, "${{ steps.resolve.outputs.source_sha }}", "release prepare checkout")
    require_command(resolve, 'gh api "repos/${GITHUB_REPOSITORY}/git/ref/tags/${PACKAGE_TAG}"', "release prepare does not resolve tag through GitHub")
    require_command(resolve, '[[ "$object_type" == commit && "$object_sha" =~ ^[0-9a-f]{40}$ ]]', "release prepare does not require a commit SHA")
    require_command(frozen, '--arg repository "$GITHUB_REPOSITORY"', "release identity does not bind the manifest to the workflow repository")
    require_command(frozen, ".sourceRepository == $repository", "release identity omits the source repository contract")
    require_command(frozen, ".packageRepository == $repository", "release identity omits the package repository contract")
    require(
        step_index(prepare, "Resolve immutable package tag", "release.prepare")
        < step_index(prepare, "Check out resolved package commit", "release.prepare")
        < step_index(prepare, "Validate frozen release identity", "release.prepare"),
        "release prepare provenance order is unsafe",
    )

    build_checkout = named_step(build, "Check out resolved package commit", "release.build")
    check_checkout(build_checkout, "${{ needs.prepare.outputs.source_sha }}", "release build checkout")
    committed = named_step(build, "Snapshot committed release inputs", "release.build")
    upstream = named_step(build, "Snapshot and download upstream binary inputs", "release.build")
    rebuild = named_step(build, "Build twice and byte-match committed package", "release.build")
    assemble = named_step(build, "Assemble committed checksummed release inventory", "release.build")
    require_line(committed, 'test "$committed_package_sha" = "$PACKAGE_SHA256"', "release build omits committed package digest comparison")
    require_line(committed, 'test "$plugin_package_sha" = "$PACKAGE_SHA256"', "release build omits PLG/package digest comparison")
    require_line(upstream, 'test "$asset_digest" = "sha256:${UPSTREAM_SHA256}"', "release build omits committed upstream digest comparison")
    require_line(upstream, 'test "$actual_upstream_sha" = "$UPSTREAM_SHA256"', "release build omits downloaded upstream digest comparison")
    require_line(rebuild, 'cmp -- .release/committed/"$PACKAGE_FILE" "unraid-plugin/packages/$PACKAGE_FILE"', "release rebuild does not byte-match committed package")
    require_line(rebuild, 'test "$(sha256sum "unraid-plugin/packages/$PACKAGE_FILE" | cut -d\' \' -f1)" = "$PACKAGE_SHA256"', "release rebuild omits committed package digest comparison")
    require_line(assemble, 'cp -- .release/committed/"$PACKAGE_FILE" .release/assets/', "release candidate is not the verified committed package")
    require(
        step_index(build, "Snapshot committed release inputs", "release.build")
        < step_index(build, "Snapshot and download upstream binary inputs", "release.build")
        < step_index(build, "Build twice and byte-match committed package", "release.build")
        < step_index(build, "Assemble committed checksummed release inventory", "release.build"),
        "release frozen-input build order is unsafe",
    )

    publish_checkout = named_step(publish, "Check out resolved package commit", "release.publish")
    check_checkout(publish_checkout, "${{ needs.prepare.outputs.source_sha }}", "release publish checkout")
    local_verify = named_step(publish, "Reverify every local asset", "release.publish")
    final_verify = named_step(publish, "Final immutable input verification", "release.publish")
    transaction = named_step(publish, "Publish package release transactionally", "release.publish")
    require_line(local_verify, 'test "$(jq -r \'.packageSha256\' release-assets/release-manifest.json)" = "$PACKAGE_SHA256"', "release publish omits committed candidate digest comparison")
    provenance_command = (
        'bash unraid-plugin/scripts/github-release-provenance.sh verify '
        '"$GITHUB_REPOSITORY" "$PACKAGE_TAG" "$SOURCE_SHA" '
        '"v${PLUGIN_VERSION}" release-assets/upstream-asset-snapshot.json'
    )
    require_line(final_verify, provenance_command, "release final provenance verification is missing")
    require_line(
        transaction,
        'bash unraid-plugin/scripts/publish-package-release.sh "$GITHUB_REPOSITORY" "$PACKAGE_TAG" "$SOURCE_SHA" "$PLUGIN_VERSION" "$PACKAGE_BUILD" release-assets release-assets/upstream-asset-snapshot.json',
        "release transaction helper is not executed",
    )
    require(
        step_index(publish, "Reverify every local asset", "release.publish")
        < step_index(publish, "Final immutable input verification", "release.publish")
        < step_index(publish, "Publish package release transactionally", "release.publish"),
        "release publication occurs before final verification",
    )


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--ci", type=Path, required=True)
    parser.add_argument("--release", type=Path, required=True)
    args = parser.parse_args()
    try:
        check_ci(load_workflow(args.ci))
        check_release(load_workflow(args.release))
    except ContractError as exc:
        print(f"workflow contract: {exc}", file=sys.stderr)
        return 1
    print("workflow contract: PASS")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
