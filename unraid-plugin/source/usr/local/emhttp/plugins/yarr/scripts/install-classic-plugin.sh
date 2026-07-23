#!/usr/bin/env bash
set -euo pipefail

root=${YARR_TEST_ROOT:-}
plugin_root="${root}/usr/local/emhttp/plugins/yarr"
config_root="${root}/boot/config/plugins/yarr"
rc_yarr="${root}/etc/rc.d/rc.yarr"

install_default() {
    local source=$1 destination=$2
    [[ -e "$destination" ]] && return 0
    install -D -m 0600 -- "$source" "$destination"
}

mkdir -p "$config_root"
install_default "$plugin_root/default.cfg" "$config_root/yarr.cfg"
install_default "$plugin_root/default.env" "$config_root/.env"

"$plugin_root/scripts/install-api-plugin.sh"

if [[ -z "$root" && -x "$rc_yarr" ]] && \
    grep -Eq '^ENABLED=yes$' "$config_root/yarr.cfg" && \
    mountpoint -q /mnt/user 2>/dev/null; then
    "$rc_yarr" start
fi
