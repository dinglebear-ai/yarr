#!/usr/bin/env bash
# Install a provenance-verified yarr release binary.
set -euo pipefail

REPO="${YARR_REPO:-dinglebear-ai/yarr}"
VERSION="${YARR_VERSION:-${YARR_MCP_VERSION:-latest}}"
INSTALL_DIR="${INSTALL_DIR:-${YARR_MCP_INSTALL_DIR:-${HOME}/.local/bin}}"
CONNECT_TIMEOUT="${YARR_DOWNLOAD_CONNECT_TIMEOUT:-10}"
TOTAL_TIMEOUT="${YARR_DOWNLOAD_TIMEOUT:-120}"
MAX_METADATA_BYTES=2097152
MAX_ARCHIVE_BYTES=209715200
TMP_DIR=""

usage() {
  cat <<'USAGE'
Install yarr from GitHub Releases after verifying GitHub release provenance and
the published SHA256SUMS manifest.

Environment:
  INSTALL_DIR / YARR_MCP_INSTALL_DIR  Destination directory (default: ~/.local/bin)
  YARR_VERSION / YARR_MCP_VERSION    Release tag such as v1.1.1 (default: latest)
  YARR_REPO                          GitHub owner/repo (default: dinglebear-ai/yarr)
USAGE
}

fail() {
  printf 'error: %s\n' "$*" >&2
  exit 1
}

need() {
  command -v "$1" >/dev/null 2>&1 || fail "$1 is required"
}

validate_url() {
  python3 - "$1" "${YARR_TEST_ALLOW_HTTP:-0}" <<'PY'
import ipaddress
import sys
from urllib.parse import urlparse

url = urlparse(sys.argv[1])
allow_test_http = sys.argv[2] == "1"
loopback = False
try:
    loopback = ipaddress.ip_address(url.hostname or "").is_loopback
except ValueError:
    loopback = (url.hostname == "localhost")
if url.scheme != "https" and not (allow_test_http and url.scheme == "http" and loopback):
    raise SystemExit(f"error: download URL must use HTTPS: {sys.argv[1]}")
PY
}

curl_fetch() {
  local url="$1" destination="$2" max_bytes="$3"
  validate_url "$url"
  local protocols="=https"
  if [[ "${YARR_TEST_ALLOW_HTTP:-0}" == "1" ]]; then
    protocols="=http,https"
  fi
  curl --fail-with-body --silent --show-error --location --max-redirs 5 \
    --connect-timeout "${CONNECT_TIMEOUT}" --max-time "${TOTAL_TIMEOUT}" \
    --proto "${protocols}" --proto-redir "${protocols}" \
    --max-filesize "${max_bytes}" --output "${destination}.part" "$url"
  mv -- "${destination}.part" "$destination"
}

sha256_file() {
  sha256sum -- "$1" | awk '{print $1}'
}

target_asset() {
  local os arch
  os="$(uname -s | tr '[:upper:]' '[:lower:]')"
  arch="$(uname -m)"
  case "${os}:${arch}" in
    linux:x86_64|linux:amd64)
      ASSET="yarr-x86_64.tar.gz"
      ARCHIVE_BINARY="yarr"
      INSTALL_BINARY="yarr"
      ;;
    mingw*:x86_64|msys*:x86_64|cygwin*:x86_64)
      ASSET="yarr-windows-x86_64.tar.gz"
      ARCHIVE_BINARY="yarr.exe"
      INSTALL_BINARY="yarr.exe"
      ;;
    *)
      fail "unsupported platform ${os}/${arch}"
      ;;
  esac
}

release_api_url() {
  if [[ -n "${YARR_RELEASE_API_URL:-}" ]]; then
    printf '%s\n' "${YARR_RELEASE_API_URL}"
  elif [[ "$VERSION" == "latest" ]]; then
    printf 'https://api.github.com/repos/%s/releases/latest\n' "$REPO"
  else
    local tag="$VERSION"
    [[ "$tag" == v* ]] || tag="v${tag}"
    printf 'https://api.github.com/repos/%s/releases/tags/%s\n' "$REPO" "$tag"
  fi
}

metadata_fields() {
  python3 - "$1" "$ASSET" "$VERSION" <<'PY'
import json
import re
import sys

metadata_path, asset_name, requested = sys.argv[1:]
with open(metadata_path, encoding="utf-8") as handle:
    metadata = json.load(handle)
tag = metadata.get("tag_name")
if requested != "latest":
    expected = requested if requested.startswith("v") else "v" + requested
    if tag != expected:
        raise SystemExit(f"error: release metadata tag {tag!r} does not match {expected!r}")
assets = {asset.get("name"): asset for asset in metadata.get("assets", [])}
selected = assets.get(asset_name)
sums = assets.get("SHA256SUMS")
if not selected or not sums:
    raise SystemExit("error: release metadata is missing the archive or SHA256SUMS asset")
fields = []
for label, item in ((asset_name, selected), ("SHA256SUMS", sums)):
    url = item.get("browser_download_url", "")
    digest = item.get("digest", "")
    if not url:
        raise SystemExit(f"error: {label} is missing a download URL")
    if not re.fullmatch(r"sha256:[0-9a-fA-F]{64}", digest):
        raise SystemExit(f"error: {label} is missing a valid SHA-256 provenance digest")
    fields.extend((url, digest.removeprefix("sha256:").lower()))
print("\t".join(fields))
PY
}

checksum_for_asset() {
  python3 - "$1" "$ASSET" <<'PY'
import pathlib
import re
import sys

manifest, asset = sys.argv[1:]
for line in pathlib.Path(manifest).read_text(encoding="utf-8").splitlines():
    match = re.fullmatch(r"([0-9a-fA-F]{64})\s+\*?(.+?)\s*", line)
    if match and pathlib.PurePosixPath(match.group(2)).name == asset:
        print(match.group(1).lower())
        break
else:
    raise SystemExit(f"error: SHA256SUMS does not contain {asset}")
PY
}

validate_archive() {
  local archive="$1" listing member details
  listing="$(tar -tzf "$archive")" || fail "could not list release archive"
  [[ -n "$listing" && "$listing" != *$'\n'* ]] || fail "archive must contain exactly one member"
  member="${listing#./}"
  [[ "$member" == "$ARCHIVE_BINARY" ]] || fail "unexpected archive member: $listing"
  [[ "$listing" != /* && "$listing" != *'..'* && "$listing" != *\\* ]] || fail "unsafe archive member path: $listing"
  details="$(tar -tvzf "$archive")" || fail "could not inspect release archive"
  [[ "${details:0:1}" == "-" ]] || fail "archive member is not a regular file"
}

main() {
  if [[ "${1:-}" == "-h" || "${1:-}" == "--help" ]]; then
    usage
    exit 0
  fi
  for command in curl tar mktemp python3 sha256sum install; do need "$command"; done

  target_asset
  TMP_DIR="$(mktemp -d)"
  trap '[[ -n "$TMP_DIR" ]] && rm -rf -- "$TMP_DIR"' EXIT

  local metadata_url metadata fields asset_url asset_digest sums_url sums_digest
  metadata_url="$(release_api_url)"
  metadata="$TMP_DIR/release.json"
  curl_fetch "$metadata_url" "$metadata" "$MAX_METADATA_BYTES"
  fields="$(metadata_fields "$metadata")"
  IFS=$'\t' read -r asset_url asset_digest sums_url sums_digest <<<"$fields"
  validate_url "$asset_url"
  validate_url "$sums_url"

  local sums sums_actual expected archive archive_actual
  sums="$TMP_DIR/SHA256SUMS"
  curl_fetch "$sums_url" "$sums" "$MAX_METADATA_BYTES"
  sums_actual="$(sha256_file "$sums")"
  [[ "$sums_actual" == "$sums_digest" ]] || fail "SHA256SUMS provenance checksum mismatch"

  expected="$(checksum_for_asset "$sums")"
  [[ "$expected" == "$asset_digest" ]] || fail "$ASSET checksum disagrees with GitHub release provenance digest"

  archive="$TMP_DIR/$ASSET"
  curl_fetch "$asset_url" "$archive" "$MAX_ARCHIVE_BYTES"
  archive_actual="$(sha256_file "$archive")"
  [[ "$archive_actual" == "$asset_digest" ]] || fail "$ASSET provenance checksum mismatch"
  [[ "$archive_actual" == "$expected" ]] || fail "$ASSET checksum mismatch"
  validate_archive "$archive"

  local staging source destination version_output expected_version
  staging="$TMP_DIR/extract"
  mkdir -p "$staging"
  tar --no-same-owner --no-same-permissions -xzf "$archive" -C "$staging"
  source="$staging/$ARCHIVE_BINARY"
  [[ -f "$source" && ! -L "$source" ]] || fail "extracted binary is not a regular file"

  mkdir -p "$INSTALL_DIR"
  [[ -w "$INSTALL_DIR" ]] || fail "install dir is not writable: $INSTALL_DIR"
  destination="$INSTALL_DIR/$INSTALL_BINARY"
  install -m 755 "$source" "$destination"

  expected_version="${VERSION#v}"
  if [[ "$VERSION" != "latest" ]]; then
    version_output="$("$destination" --version)" || fail "installed binary failed --version"
    [[ "$version_output" == "yarr $expected_version" ]] || {
      rm -f -- "$destination"
      fail "installed runtime version mismatch: expected yarr $expected_version, got $version_output"
    }
  fi

  printf 'Installed provenance-verified yarr to %s\n' "$destination"
  printf 'Run: %s --version\n' "$destination"
}

main "$@"
