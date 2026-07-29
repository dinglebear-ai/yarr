#!/usr/bin/env bash
# Validate the yarr plugin artifacts shipped by this repository.
set -uo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
NC='\033[0m'

CHECKS=0
PASSED=0
FAILED=0

PLUGIN_ROOT="${PLUGIN_ROOT:-plugins/yarr}"
CLAUDE_PLUGIN_JSON="${PLUGIN_ROOT}/.claude-plugin/plugin.json"
CODEX_PLUGIN_JSON="${PLUGIN_ROOT}/.codex-plugin/plugin.json"
GEMINI_EXTENSION_JSON="${PLUGIN_ROOT}/gemini-extension.json"
MCP_JSON="${PLUGIN_ROOT}/.mcp.json"
HOOKS_JSON="${PLUGIN_ROOT}/hooks/hooks.json"
SKILLS_DIR="${PLUGIN_ROOT}/skills"

# The pinned npm launcher spec is derived from the released package version so it
# stays coupled without being hand-edited (and without tripping the scripts/ ->
# scripts/README.md coupled-file guard on the release PR).
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
EXPECTED_LAUNCHER="yarr-mcp@$(jq -r '.version' "${REPO_ROOT}/packages/yarr-mcp/package.json" 2>/dev/null)"

check() {
  local test_name="$1"
  local test_cmd="$2"

  CHECKS=$((CHECKS + 1))
  printf 'Checking: %s... ' "${test_name}"

  if eval "${test_cmd}" >/dev/null 2>&1; then
    printf '%b\n' "${GREEN}PASS${NC}"
    PASSED=$((PASSED + 1))
    return 0
  fi

  printf '%b\n' "${RED}FAIL${NC}"
  FAILED=$((FAILED + 1))
  return 1
}

echo "=== Validating yarr Plugin Layout ==="
echo "Plugin root: ${PLUGIN_ROOT}"
echo

check "jq is available" "command -v jq"

check "Claude plugin manifest exists" "test -f '${CLAUDE_PLUGIN_JSON}'"
check "Claude plugin manifest is valid JSON" "jq empty '${CLAUDE_PLUGIN_JSON}'"
check "Claude plugin name is yarr" "test \"\$(jq -er '.name' '${CLAUDE_PLUGIN_JSON}')\" = 'yarr'"
check "Claude plugin has no version field" "test \"\$(jq -er 'has(\"version\")' '${CLAUDE_PLUGIN_JSON}')\" = 'false'"
check "Claude plugin keeps MCP config external" "jq -er 'has(\"mcpServers\") | not' '${CLAUDE_PLUGIN_JSON}'"
check "Claude plugin keeps hooks config external" "jq -er 'has(\"hooks\") | not' '${CLAUDE_PLUGIN_JSON}'"
check "Claude plugin points to skills directory" "test \"\$(jq -er '.skills' '${CLAUDE_PLUGIN_JSON}')\" = './skills'"
check "Claude plugin points to monitors config" "test \"\$(jq -er '.experimental.monitors' '${CLAUDE_PLUGIN_JSON}')\" = './monitors/monitors.json'"
check "Claude plugin declares server_url userConfig" "jq -er '.userConfig.server_url.default == \"http://localhost:40070\"' '${CLAUDE_PLUGIN_JSON}'"
check "Claude plugin declares api_token as sensitive" "jq -er '.userConfig.api_token.sensitive == true' '${CLAUDE_PLUGIN_JSON}'"
check "Claude plugin declares no_auth toggle" "jq -er '.userConfig.no_auth.type == \"boolean\"' '${CLAUDE_PLUGIN_JSON}'"
check "Claude plugin declares auth_mode default" "jq -er '.userConfig.auth_mode.default == \"bearer\"' '${CLAUDE_PLUGIN_JSON}'"

check "Codex plugin manifest exists" "test -f '${CODEX_PLUGIN_JSON}'"
check "Codex plugin manifest is valid JSON" "jq empty '${CODEX_PLUGIN_JSON}'"
check "Codex plugin name is yarr-mcp" "test \"\$(jq -er '.name' '${CODEX_PLUGIN_JSON}')\" = 'yarr-mcp'"
check "Codex plugin has no version field" "test \"\$(jq -er 'has(\"version\")' '${CODEX_PLUGIN_JSON}')\" = 'false'"
check "Codex plugin keeps MCP config external" "jq -er 'has(\"mcpServers\") | not' '${CODEX_PLUGIN_JSON}'"
check "Codex plugin points to skills directory" "test \"\$(jq -er '.skills' '${CODEX_PLUGIN_JSON}')\" = './skills/'"

check "Gemini extension manifest exists" "test -f '${GEMINI_EXTENSION_JSON}'"
check "Gemini extension manifest is valid JSON" "jq empty '${GEMINI_EXTENSION_JSON}'"
check "Gemini extension name is yarr-mcp" "test \"\$(jq -er '.name' '${GEMINI_EXTENSION_JSON}')\" = 'yarr-mcp'"
check "Gemini extension has no version field" "test \"\$(jq -er 'has(\"version\")' '${GEMINI_EXTENSION_JSON}')\" = 'false'"
check "Gemini extension points to skills directory" "test \"\$(jq -er '.skills' '${GEMINI_EXTENSION_JSON}')\" = './skills'"
if [[ "${PLUGIN_ROOT}" == "plugins/yarr" ]]; then
  check "Gemini extension declares pinned npm stdio MCP server" "jq -er --arg spec '${EXPECTED_LAUNCHER}' '.mcpServers.yarr.command == \"npx\" and .mcpServers.yarr.args[0:3] == [\"-y\", \$spec, \"mcp\"]' '${GEMINI_EXTENSION_JSON}'"
else
  check "Gemini extension keeps MCP config external" "jq -er 'has(\"mcpServers\") | not' '${GEMINI_EXTENSION_JSON}'"
fi

if [[ "${PLUGIN_ROOT}" == "plugins/yarr" ]]; then
  check "MCP config exists (yarr uses stdio MCP)" "test -f '${MCP_JSON}'"
  check "MCP config uses stdio transport" "jq -er '.mcpServers.yarr.type == \"stdio\"' '${MCP_JSON}'"
  check "MCP config uses pinned npm launcher" "jq -er --arg spec '${EXPECTED_LAUNCHER}' '.mcpServers.yarr.command == \"npx\" and .mcpServers.yarr.args[0:3] == [\"-y\", \$spec, \"mcp\"]' '${MCP_JSON}'"
else
  check "MCP config is absent for skills-only standalone plugin" "test ! -f '${MCP_JSON}'"
fi

check "hooks config exists" "test -f '${HOOKS_JSON}'"
check "hooks config is valid JSON" "jq empty '${HOOKS_JSON}'"
check "SessionStart runs safe plugin setup" "jq -er '.hooks.SessionStart[]?.hooks[]?.command == \"\${CLAUDE_PLUGIN_ROOT}/scripts/plugin-setup.sh\"' '${HOOKS_JSON}'"
check "ConfigChange runs safe plugin setup" "jq -er '.hooks.ConfigChange[]? | select(.matcher == \"user_settings\") | .hooks[]?.command == \"\${CLAUDE_PLUGIN_ROOT}/scripts/plugin-setup.sh\"' '${HOOKS_JSON}'"
check "plugin setup script exists" "test -f '${PLUGIN_ROOT}/scripts/plugin-setup.sh'"
check "plugin setup script is executable" "test -x '${PLUGIN_ROOT}/scripts/plugin-setup.sh'"
check "plugin contains no committed binary" "test ! -e '${PLUGIN_ROOT}/bin/yarr'"

check "skills directory exists" "test -d '${SKILLS_DIR}'"

skill_count=0
if [[ -d "${SKILLS_DIR}" ]]; then
  while IFS= read -r skill_file; do
    skill_count=$((skill_count + 1))
    skill_dir="$(basename "$(dirname "${skill_file}")")"
    check "skill ${skill_dir} has front matter name" "awk 'BEGIN {found=0} /^name:[[:space:]]*${skill_dir}[[:space:]]*$/ {found=1} END {exit found ? 0 : 1}' '${skill_file}'"
    check "skill ${skill_dir} has description" "awk 'BEGIN {found=0} /^description:[[:space:]]*[^[:space:]]/ {found=1} END {exit found ? 0 : 1}' '${skill_file}'"
  done < <(find "${SKILLS_DIR}" -mindepth 2 -maxdepth 2 -name SKILL.md | sort)
fi

CHECKS=$((CHECKS + 1))
printf 'Checking: at least one plugin skill exists... '
if (( skill_count > 0 )); then
  printf '%b\n' "${GREEN}PASS${NC}"
  PASSED=$((PASSED + 1))
else
  printf '%b\n' "${RED}FAIL${NC}"
  FAILED=$((FAILED + 1))
fi

echo
echo "=== Results ==="
echo "Total checks: ${CHECKS}"
printf '%b\n' "${GREEN}Passed: ${PASSED}${NC}"
if (( FAILED > 0 )); then
  printf '%b\n' "${RED}Failed: ${FAILED}${NC}"
  exit 1
fi

printf '%b\n' "${GREEN}All checks passed.${NC}"
