#!/usr/bin/env bash
set -u

root=${YARR_TEST_ROOT:-}
plugin_root="${root}/usr/local/emhttp/plugins/yarr"
rc_yarr="${root}/etc/rc.d/rc.yarr"
result=0

if [[ -x "$rc_yarr" ]]; then
    "$rc_yarr" stop || result=1
fi
if [[ -x "$plugin_root/scripts/uninstall-api-plugin.sh" ]]; then
    "$plugin_root/scripts/uninstall-api-plugin.sh" || result=1
fi

rm -f -- "${root}/var/run/yarr.pid" "${root}/var/run/yarr.env" \
    "${root}/var/lock/yarr-plugin.lock"
rm -rf -- "${root}/var/log/yarr"

exit "$result"
