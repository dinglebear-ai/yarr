#!/usr/bin/env python3
from __future__ import annotations

import argparse
import re
import subprocess
import sys
import urllib.parse
from pathlib import Path

INLINE_LINK = re.compile(r"!?\[[^\]]*\]\(([^)]+)\)")
REFERENCE_LINK = re.compile(r"^\s*\[[^\]]+\]:\s*(\S+)", re.MULTILINE)
HEADING = re.compile(r"^(#{1,6})\s+(.+?)\s*#*\s*$", re.MULTILINE)
FENCED_BLOCK = re.compile(r"(?:~~~|```).*?(?:~~~|```)", re.DOTALL)
HTML_COMMENT = re.compile(r"<!--.*?-->", re.DOTALL)
EXTERNAL_PREFIXES = ("http://", "https://", "mailto:", "tel:", "data:", "//")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Validate tracked Markdown relative links and heading anchors."
    )
    parser.add_argument(
        "--root",
        type=Path,
        default=Path(__file__).resolve().parent.parent,
        help="repository root; defaults to the parent of scripts/",
    )
    return parser.parse_args()


def tracked_markdown(root: Path) -> list[Path]:
    completed = subprocess.run(
        ["git", "-C", str(root), "ls-files", "-z", "--", "*.md"],
        check=True,
        stdout=subprocess.PIPE,
    )
    return [root / item.decode() for item in completed.stdout.split(b"\0") if item]


def visible_markdown(text: str) -> str:
    return HTML_COMMENT.sub("", FENCED_BLOCK.sub("", text))


def github_slug(text: str) -> str:
    text = re.sub(r"<[^>]+>", "", text)
    text = text.replace(chr(96), "")
    text = re.sub(r"[*_~]", "", text).strip().lower()
    text = re.sub(r"[^\w\- ]", "", text, flags=re.UNICODE)
    return re.sub(r"[ -]+", "-", text).strip("-")


def heading_anchors(path: Path) -> set[str]:
    seen: dict[str, int] = {}
    anchors: set[str] = set()
    for _level, heading in HEADING.findall(path.read_text(encoding="utf-8")):
        base = github_slug(heading)
        count = seen.get(base, 0)
        seen[base] = count + 1
        anchors.add(base if count == 0 else f"{base}-{count}")
    return anchors


def normalize_target(raw: str) -> str:
    raw = raw.strip()
    if raw.startswith("<") and raw.endswith(">"):
        return raw[1:-1]
    return raw.split(maxsplit=1)[0]


def within_root(root: Path, target: Path) -> bool:
    try:
        target.relative_to(root)
    except ValueError:
        return False
    return True


def check(root: Path) -> list[str]:
    root = root.resolve()
    anchor_cache: dict[Path, set[str]] = {}
    failures: list[str] = []

    for source in tracked_markdown(root):
        text = visible_markdown(source.read_text(encoding="utf-8"))
        raw_targets = [match.group(1) for match in INLINE_LINK.finditer(text)]
        raw_targets.extend(match.group(1) for match in REFERENCE_LINK.finditer(text))

        for raw in raw_targets:
            target_text = normalize_target(raw)
            if not target_text or target_text.startswith(EXTERNAL_PREFIXES):
                continue
            if target_text.startswith("/"):
                failures.append(
                    f"{source.relative_to(root)}: {target_text}: repository links must be relative"
                )
                continue

            decoded = urllib.parse.unquote(target_text)
            path_text, _separator, fragment = decoded.partition("#")
            target = source if not path_text else (source.parent / path_text).resolve()

            if not within_root(root, target):
                failures.append(
                    f"{source.relative_to(root)}: {target_text}: target escapes repository"
                )
                continue
            if path_text and not target.exists():
                failures.append(
                    f"{source.relative_to(root)}: {target_text}: target does not exist"
                )
                continue
            if target.is_dir():
                readme = target / "README.md"
                if not readme.exists():
                    failures.append(
                        f"{source.relative_to(root)}: {target_text}: directory has no README.md"
                    )
                    continue
                target = readme

            if fragment and target.suffix.lower() == ".md":
                anchors = anchor_cache.setdefault(target, heading_anchors(target))
                if fragment.lower() not in anchors:
                    failures.append(
                        f"{source.relative_to(root)}: {target_text}: heading anchor does not exist"
                    )

    return failures


def main() -> int:
    args = parse_args()
    failures = check(args.root)
    if failures:
        for failure in failures:
            print(failure, file=sys.stderr)
        print(f"documentation links: FAIL ({len(failures)} issue(s))", file=sys.stderr)
        return 1
    count = len(tracked_markdown(args.root.resolve()))
    print(f"documentation links: PASS ({count} tracked Markdown files)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
