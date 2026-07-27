#!/usr/bin/env bash
set -euo pipefail

root=${YARR_TEST_ROOT:-}
plugin_root="${root}/usr/local/emhttp/plugins/yarr"
config_root="${root}/boot/config/plugins/yarr"
rc_yarr="${root}/etc/rc.d/rc.yarr"
user_mount="${root}/mnt/user"
if [[ -n "$root" ]]; then
    export YARR_PLUGIN_ROOT="$plugin_root"
    export YARR_BOOT_ROOT="${root}/boot"
    export YARR_APPDATA_ROOT="${root}/mnt/user/appdata"
    export YARR_RUN_ROOT="${root}/var/run"
    export YARR_LOCK_ROOT="${root}/var/lock"
    export YARR_LOG_ROOT="${root}/var/log"
fi
# shellcheck source=/usr/local/emhttp/plugins/yarr/scripts/yarr-common.sh
source "$plugin_root/scripts/yarr-common.sh"

install_default() {
    local source=$1 destination=$2
    [[ -e "$destination" ]] && return 0
    install -D -m 0600 -- "$source" "$destination"
}

install_classic_locked() {
    yarr_recover_config_transaction
    mkdir -p "$config_root"
    install_default "$plugin_root/default.cfg" "$config_root/yarr.cfg"
    install_default "$plugin_root/default.env" "$config_root/.env"
    chmod 0600 "$config_root/yarr.cfg" "$config_root/.env"

    "$plugin_root/scripts/install-api-plugin.sh"

    if [[ -x "$rc_yarr" ]] && \
        grep -Eq '^ENABLED=yes$' "$config_root/yarr.cfg" && \
        mountpoint -q "$user_mount" 2>/dev/null; then
        YARR_ARRAY_MOUNTED_REQUEST=yes \
            "$rc_yarr" --lock-fd "$YARR_ACTIVE_LOCK_FD" start
    fi
}

if [[ "${1:-}" == --lock-fd ]]; then
    [[ $# -eq 2 ]] || { printf 'usage: %s [--lock-fd FD]\n' "$0" >&2; exit 2; }
    yarr_with_inherited_lock "$2" install_classic_locked
elif [[ $# -eq 0 ]]; then
    YARR_LOCK_WAIT_SECONDS=${YARR_PACKAGE_LOCK_WAIT_SECONDS:-30} yarr_with_lock install_classic_locked
else
    printf 'usage: %s [--lock-fd FD]\n' "$0" >&2
    exit 2
fi
