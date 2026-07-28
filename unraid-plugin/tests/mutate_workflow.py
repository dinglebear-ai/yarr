#!/usr/bin/env python3
from __future__ import annotations

import argparse
from pathlib import Path
from typing import Any

import yaml


def find_step(job: dict[str, Any], name: str) -> dict[str, Any]:
    matches = [step for step in job["steps"] if step.get("name") == name]
    if len(matches) != 1:
        raise SystemExit(f"mutation fixture cannot find step: {name}")
    return matches[0]


parser = argparse.ArgumentParser()
parser.add_argument("input", type=Path)
parser.add_argument("output", type=Path)
parser.add_argument(
    "mutation",
    choices=[
        "wrong-needs",
        "tag-checkout",
        "publish-before-verify",
        "write-outside-publish",
        "job-token",
        "missing-committed-digest",
    ],
)
args = parser.parse_args()
document = yaml.safe_load(args.input.read_text(encoding="utf-8"))
jobs = document["jobs"]

if args.mutation == "wrong-needs":
    jobs["publish"]["needs"] = ["build"]
elif args.mutation == "tag-checkout":
    checkout = find_step(jobs["build"], "Check out resolved package commit")
    checkout["with"]["ref"] = "${{ needs.prepare.outputs.package_tag }}"
elif args.mutation == "publish-before-verify":
    publish_steps = jobs["publish"]["steps"]
    verify_index = next(
        index for index, step in enumerate(publish_steps)
        if step.get("name") == "Final immutable input verification"
    )
    publish_index = next(
        index for index, step in enumerate(publish_steps)
        if step.get("name") == "Publish package release transactionally"
    )
    publish_steps[verify_index], publish_steps[publish_index] = (
        publish_steps[publish_index],
        publish_steps[verify_index],
    )
elif args.mutation == "write-outside-publish":
    jobs["build"]["permissions"] = {"contents": "write"}
elif args.mutation == "job-token":
    jobs["build"].setdefault("env", {})["GH_TOKEN"] = "${{ github.token }}"
elif args.mutation == "missing-committed-digest":
    step = find_step(jobs["build"], "Build twice and byte-match committed package")
    step["run"] = "\n".join(
        (
            f"# {line.lstrip()}"
            if 'sha256sum "unraid-plugin/packages/$PACKAGE_FILE"' in line
            else line
        )
        for line in step["run"].splitlines()
    )

args.output.write_text(yaml.safe_dump(document, sort_keys=False), encoding="utf-8")
