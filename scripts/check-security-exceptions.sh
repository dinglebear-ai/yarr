#!/usr/bin/env bash
set -euo pipefail

# No deadline is needed when every advisory is enforced.
if python3 -c 'import tomllib; import sys; sys.exit(bool(tomllib.load(open("deny.toml", "rb"))["advisories"].get("ignore", [])))'; then
  echo "no advisory exceptions configured"
  exit 0
fi

deadline="$(sed -nE 's/^# Reviewed exception deadline: ([0-9]{4}-[0-9]{2}-[0-9]{2}).*/\1/p' deny.toml)"
if [[ -z "$deadline" ]]; then
  echo "deny.toml must declare a reviewed advisory-exception deadline" >&2
  exit 1
fi

today="${SECURITY_EXCEPTION_CHECK_DATE:-$(date -u +%F)}"
if [[ "$today" > "$deadline" || "$today" == "$deadline" ]]; then
  echo "dependency-security exception expired on $deadline; remove it or complete a fresh threat-model review" >&2
  exit 1
fi

echo "security exception review deadline: $deadline"
