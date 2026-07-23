#!/usr/bin/env bash
set -u

root=${YARR_TEST_ROOT:-}
plugin_root="${root}/usr/local/emhttp/plugins/yarr"
rc_yarr="${root}/etc/rc.d/rc.yarr"
if [[ -n "$root" ]]; then
    export YARR_PLUGIN_ROOT="$plugin_root"
    export YARR_BOOT_ROOT="${root}/boot"
    export YARR_APPDATA_ROOT="${root}/mnt/user/appdata"
    export YARR_RUN_ROOT="${root}/var/run"
    export YARR_LOCK_ROOT="${root}/var/lock"
    export YARR_LOG_ROOT="${root}/var/log"
fi
# shellcheck source=/usr/local/emhttp/plugins/yarr/scripts/yarr-common.sh
source "$plugin_root/scripts/yarr-common.sh" || exit 1

uninstall_classic_locked() {
    local status=0
    if [[ -x "$rc_yarr" ]]; then
        "$rc_yarr" --lock-fd "$YARR_ACTIVE_LOCK_FD" stop || return 1
        "$rc_yarr" --lock-fd "$YARR_ACTIVE_LOCK_FD" status >/dev/null 2>&1 || status=$?
        [[ "$status" == 3 ]] || { yarr_error 'uninstall could not prove Yarr quiescence'; return 1; }
    fi
    if [[ -x "$plugin_root/scripts/uninstall-api-plugin.sh" ]]; then
        "$plugin_root/scripts/uninstall-api-plugin.sh" || return 1
    fi
    # Preserve the array-stopping fence across uninstall. An updater that was
    # already waiting for this lock must still fail closed after package
    # removal. A later installer clears it only after proving /mnt/user mounted.
    rm -f -- "${root}/var/run/yarr.pid" "${root}/var/run/yarr.pid.meta" \
        "${root}/var/run/yarr-logger.pid" "${root}/var/run/yarr.env"
    [[ ! -e "${root}/var/run/yarr-log.pipe" || -p "${root}/var/run/yarr-log.pipe" ]] || return 1
    rm -f -- "${root}/var/run/yarr-log.pipe"
    rm -rf -- "${root}/var/log/yarr"
}

if [[ "${1:-}" == --lock-fd ]]; then
    [[ $# -eq 2 ]] || { printf 'usage: %s [--lock-fd FD]\n' "$0" >&2; exit 2; }
    yarr_with_inherited_lock "$2" uninstall_classic_locked
elif [[ $# -eq 0 ]]; then
    YARR_LOCK_WAIT_SECONDS=${YARR_PACKAGE_LOCK_WAIT_SECONDS:-30} yarr_with_lock uninstall_classic_locked
else
    printf 'usage: %s [--lock-fd FD]\n' "$0" >&2
    exit 2
fi
