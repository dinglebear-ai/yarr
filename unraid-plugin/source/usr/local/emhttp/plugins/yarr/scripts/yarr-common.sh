#!/usr/bin/env bash
# Shared, non-executing configuration, recovery, locking, logging, and process helpers.

YARR_COMMON_PATH=$(readlink -f "${BASH_SOURCE[0]}" 2>/dev/null || printf '%s' "${BASH_SOURCE[0]}")
case "$YARR_COMMON_PATH" in
    /usr/local/emhttp/plugins/yarr/scripts/yarr-common.sh|*/usr/local/emhttp/plugins/yarr/scripts/yarr-common.sh)
        [[ "$YARR_COMMON_PATH" == */unraid-plugin/source/* ]] && YARR_COMMON_INSTALLED=false || YARR_COMMON_INSTALLED=true
        ;;
    *) YARR_COMMON_INSTALLED=false ;;
esac

if [[ "$YARR_COMMON_INSTALLED" == true ]]; then
    YARR_PLUGIN_ROOT=/usr/local/emhttp/plugins/yarr
    YARR_BOOT_ROOT=/boot
    YARR_APPDATA_ROOT=/mnt/user/appdata
    YARR_RUN_ROOT=/var/run
    YARR_LOCK_ROOT=/var/lock
    YARR_LOG_ROOT=/var/log
    YARR_PROC_ROOT=/proc
    YARR_CFG=/boot/config/plugins/yarr/yarr.cfg
    YARR_ENV=/boot/config/plugins/yarr/.env
    YARR_APPDATA=/mnt/user/appdata/yarr
    YARR_OVERLAY_DIR=/mnt/user/appdata/yarr/bin
    YARR_PACKAGED_BINARY=/usr/local/yarr/bin/yarr
    YARR_PID=/var/run/yarr.pid
    YARR_PID_META=/var/run/yarr.pid.meta
    YARR_LOGGER_PID=/var/run/yarr-logger.pid
    YARR_LOG_PIPE=/var/run/yarr-log.pipe
    YARR_LOCK=/var/lock/yarr-plugin.lock
    YARR_LOG=/var/log/yarr/yarr.log
    YARR_RUNTIME_ENV=/var/run/yarr.env
    YARR_TAILSCALE_STATE=/mnt/user/appdata/yarr/tailscale-serve.state
    YARR_FLOCK_BIN=/usr/bin/flock
else
    YARR_PLUGIN_ROOT=${YARR_PLUGIN_ROOT:-/usr/local/emhttp/plugins/yarr}
    YARR_BOOT_ROOT=${YARR_BOOT_ROOT:-/boot}
    YARR_APPDATA_ROOT=${YARR_APPDATA_ROOT:-/mnt/user/appdata}
    YARR_RUN_ROOT=${YARR_RUN_ROOT:-/var/run}
    YARR_LOCK_ROOT=${YARR_LOCK_ROOT:-/var/lock}
    YARR_LOG_ROOT=${YARR_LOG_ROOT:-/var/log}
    YARR_PROC_ROOT=${YARR_PROC_ROOT:-/proc}
    YARR_CFG=${YARR_CFG:-"${YARR_BOOT_ROOT}/config/plugins/yarr/yarr.cfg"}
    YARR_ENV=${YARR_ENV:-"${YARR_BOOT_ROOT}/config/plugins/yarr/.env"}
    YARR_APPDATA=${YARR_APPDATA:-"${YARR_APPDATA_ROOT}/yarr"}
    YARR_OVERLAY_DIR=${YARR_OVERLAY_DIR:-"${YARR_APPDATA}/bin"}
    YARR_PACKAGED_BINARY=${YARR_PACKAGED_BINARY:-"${YARR_PLUGIN_ROOT}/bin/yarr"}
    YARR_PID=${YARR_PID:-"${YARR_RUN_ROOT}/yarr.pid"}
    YARR_PID_META=${YARR_PID_META:-"${YARR_RUN_ROOT}/yarr.pid.meta"}
    YARR_LOGGER_PID=${YARR_LOGGER_PID:-"${YARR_RUN_ROOT}/yarr-logger.pid"}
    YARR_LOG_PIPE=${YARR_LOG_PIPE:-"${YARR_RUN_ROOT}/yarr-log.pipe"}
    YARR_LOCK="${YARR_LOCK_ROOT}/yarr-plugin.lock"
    YARR_LOG=${YARR_LOG:-"${YARR_LOG_ROOT}/yarr/yarr.log"}
    YARR_RUNTIME_ENV=${YARR_RUNTIME_ENV:-"${YARR_RUN_ROOT}/yarr.env"}
    YARR_TAILSCALE_STATE=${YARR_TAILSCALE_STATE:-"${YARR_APPDATA}/tailscale-serve.state"}
    if [[ -x /usr/bin/flock ]]; then
        YARR_FLOCK_BIN=/usr/bin/flock
    else
        YARR_FLOCK_BIN=${YARR_FLOCK_BIN:-/home/linuxbrew/.linuxbrew/bin/flock}
    fi
fi
YARR_CURL_BIN=${YARR_CURL_BIN:-/usr/bin/curl}
YARR_TAILSCALE_BIN=${YARR_TAILSCALE_BIN:-/usr/bin/tailscale}
YARR_SYNC_BIN=${YARR_SYNC_BIN:-/usr/bin/sync}
YARR_INSTALL_BIN=${YARR_INSTALL_BIN:-/usr/bin/install}
YARR_CONFIG_DIR=$(dirname "$YARR_CFG")
YARR_CFG_NEXT="${YARR_CFG}.next"
YARR_ENV_NEXT="${YARR_ENV}.next"
YARR_CFG_GOOD="${YARR_CFG}.good"
YARR_ENV_GOOD="${YARR_ENV}.good"
YARR_CFG_TRANSACTION="${YARR_CFG}.transaction"
YARR_ENV_TRANSACTION="${YARR_ENV}.transaction"
YARR_CFG_GOOD_TRANSACTION="${YARR_CFG_GOOD}.transaction"
YARR_ENV_GOOD_TRANSACTION="${YARR_ENV_GOOD}.transaction"
YARR_CFG_GOOD_RESTORE="${YARR_CFG_GOOD}.restore"
YARR_ENV_GOOD_RESTORE="${YARR_ENV_GOOD}.restore"
YARR_CONFIG_JOURNAL="${YARR_CFG}.transaction-state"
YARR_CONFIG_JOURNAL_NEXT="${YARR_CONFIG_JOURNAL}.next"
YARR_LOG_MAX_BYTES=${YARR_LOG_MAX_BYTES:-1048576}
YARR_LOG_RETENTION=${YARR_LOG_RETENTION:-3}

declare -Ag YARR_ENV_VALUES=()

yarr_error() {
    printf 'yarr: %s\n' "$*" >&2
}

yarr_has_control_characters() {
    [[ "$1" =~ [[:cntrl:]] ]]
}

yarr_regular_file_no_link() {
    [[ -f "$1" && ! -L "$1" ]]
}

yarr_sync_config_dir() {
    "$YARR_SYNC_BIN" -f "$YARR_CONFIG_DIR"
}

yarr_restore_config_pair() {
    local plugin_source=$1 env_source=$2 plugin_stage=$3 env_stage=$4 plugin_target=$5 env_target=$6
    yarr_regular_file_no_link "$plugin_source" && yarr_regular_file_no_link "$env_source" || return 1
    "$YARR_INSTALL_BIN" -m 0600 -- "$plugin_source" "$plugin_stage" || return 1
    "$YARR_INSTALL_BIN" -m 0600 -- "$env_source" "$env_stage" || return 1
    "$YARR_SYNC_BIN" -f "$plugin_stage" || return 1
    "$YARR_SYNC_BIN" -f "$env_stage" || return 1
    yarr_sync_config_dir || return 1
    mv -f -- "$plugin_stage" "$plugin_target" || return 1
    mv -f -- "$env_stage" "$env_target" || return 1
    yarr_sync_config_dir
}

yarr_cleanup_orphaned_config_artifacts() {
    rm -f -- "$YARR_CFG_NEXT" "$YARR_ENV_NEXT" \
        "$YARR_CFG_TRANSACTION" "$YARR_ENV_TRANSACTION" \
        "$YARR_CFG_GOOD_TRANSACTION" "$YARR_ENV_GOOD_TRANSACTION" \
        "$YARR_CFG_GOOD_RESTORE" "$YARR_ENV_GOOD_RESTORE" \
        "$YARR_CONFIG_JOURNAL_NEXT"
    yarr_sync_config_dir
}

yarr_recover_config_transaction() {
    local artifact
    [[ -e "$YARR_CONFIG_JOURNAL" ]] || {
        [[ -d "$YARR_CONFIG_DIR" ]] || return 0
        for artifact in \
            "$YARR_CFG_NEXT" "$YARR_ENV_NEXT" \
            "$YARR_CFG_TRANSACTION" "$YARR_ENV_TRANSACTION" \
            "$YARR_CFG_GOOD_TRANSACTION" "$YARR_ENV_GOOD_TRANSACTION" \
            "$YARR_CFG_GOOD_RESTORE" "$YARR_ENV_GOOD_RESTORE" \
            "$YARR_CONFIG_JOURNAL_NEXT"; do
            if [[ -e "$artifact" || -L "$artifact" ]]; then
                yarr_cleanup_orphaned_config_artifacts
                break
            fi
        done
        return
    }
    yarr_regular_file_no_link "$YARR_CONFIG_JOURNAL" || {
        yarr_error 'configuration transaction marker is not a regular file'
        return 1
    }

    local line key value version='' had_previous_good='' seen_version=false seen_good=false
    while IFS= read -r line || [[ -n "$line" ]]; do
        [[ "$line" == *=* ]] || { yarr_error 'configuration transaction marker is malformed'; return 1; }
        key=${line%%=*}
        value=${line#*=}
        case "$key" in
            version)
                [[ "$seen_version" == false ]] || { yarr_error 'duplicate transaction marker version'; return 1; }
                version=$value
                seen_version=true
                ;;
            had_previous_good)
                [[ "$seen_good" == false ]] || { yarr_error 'duplicate transaction marker good-pair state'; return 1; }
                had_previous_good=$value
                seen_good=true
                ;;
            *) yarr_error 'unknown configuration transaction marker field'; return 1 ;;
        esac
    done < "$YARR_CONFIG_JOURNAL"
    [[ "$version" == 1 && ( "$had_previous_good" == yes || "$had_previous_good" == no ) ]] || {
        yarr_error 'configuration transaction marker has unsupported state'
        return 1
    }
    yarr_restore_config_pair "$YARR_CFG_TRANSACTION" "$YARR_ENV_TRANSACTION" \
        "$YARR_CFG_NEXT" "$YARR_ENV_NEXT" "$YARR_CFG" "$YARR_ENV" || {
        yarr_error 'could not recover the pre-transaction configuration pair'
        return 1
    }
    if [[ "$had_previous_good" == yes ]]; then
        yarr_restore_config_pair "$YARR_CFG_GOOD_TRANSACTION" "$YARR_ENV_GOOD_TRANSACTION" \
            "$YARR_CFG_GOOD_RESTORE" "$YARR_ENV_GOOD_RESTORE" "$YARR_CFG_GOOD" "$YARR_ENV_GOOD" || {
            yarr_error 'could not recover the prior known-good configuration pair'
            return 1
        }
    else
        rm -f -- "$YARR_CFG_GOOD" "$YARR_ENV_GOOD"
        yarr_sync_config_dir || return 1
    fi

    rm -f -- "$YARR_CONFIG_JOURNAL"
    yarr_sync_config_dir || return 1
    yarr_cleanup_orphaned_config_artifacts || return 1
    yarr_error 'recovered an interrupted configuration transaction'
}

yarr_set_config_value() {
    local key=$1 value=$2
    case "$key" in
        ENABLED|BIND_MODE|CUSTOM_HOST|PORT|AUTH_MODE|TAILSCALE_SERVE|TAILSCALE_HOSTNAME|LOG_LEVEL|UPDATE_CHANNEL)
            yarr_has_control_characters "$value" && {
                yarr_error "control character in ${key}"
                return 1
            }
            printf -v "$key" '%s' "$value"
            ;;
        *)
            yarr_error "unknown configuration key: ${key}"
            return 1
            ;;
    esac
}

yarr_load_config() {
    yarr_recover_config_transaction || return 1
    ENABLED=yes
    BIND_MODE=loopback
    CUSTOM_HOST=''
    PORT=40070
    AUTH_MODE=bearer
    TAILSCALE_SERVE=no
    TAILSCALE_HOSTNAME=''
    LOG_LEVEL=info
    UPDATE_CHANNEL=stable
    YARR_ENV_VALUES=()

    [[ -f "$YARR_CFG" ]] || { yarr_error "missing configuration: ${YARR_CFG}"; return 1; }
    [[ -f "$YARR_ENV" ]] || { yarr_error "missing environment: ${YARR_ENV}"; return 1; }

    local line key value
    while IFS= read -r line || [[ -n "$line" ]]; do
        line=${line%$'\r'}
        [[ -z "$line" || "$line" == \#* ]] && continue
        [[ "$line" == *=* ]] || { yarr_error 'invalid configuration line'; return 1; }
        key=${line%%=*}
        value=${line#*=}
        yarr_set_config_value "$key" "$value" || return 1
    done < "$YARR_CFG"

    while IFS= read -r line || [[ -n "$line" ]]; do
        line=${line%$'\r'}
        [[ -z "$line" || "$line" == \#* ]] && continue
        [[ "$line" == *=* ]] || { yarr_error 'invalid environment line'; return 1; }
        key=${line%%=*}
        value=${line#*=}
        [[ "$key" =~ ^[A-Za-z_][A-Za-z0-9_]*$ ]] || { yarr_error "invalid environment variable name: ${key}"; return 1; }
        yarr_has_control_characters "$value" && { yarr_error "control character in environment variable: ${key}"; return 1; }
        case "$key" in
            YARR_MCP_HOST|YARR_MCP_PORT|YARR_MCP_NO_AUTH|YARR_NOAUTH|YARR_MCP_AUTH_MODE|YARR_HOME|RUST_LOG|\
            BASH_ENV|BASHOPTS|CDPATH|ENV|GCONV_PATH|IFS|LD_*|MALLOC_*|NODE_OPTIONS|PATH|\
            PERL5*|PYTHON*|RUBY*|SHELLOPTS|DYLD_*)
                yarr_error "environment variable is managed by plugin configuration: ${key}"
                return 1
                ;;
        esac
        YARR_ENV_VALUES["$key"]=$value
    done < "$YARR_ENV"
}

yarr_valid_ipv4() {
    local host=$1 part
    [[ "$host" =~ ^[0-9]{1,3}(\.[0-9]{1,3}){3}$ ]] || return 1
    IFS='.' read -r -a parts <<< "$host"
    for part in "${parts[@]}"; do ((10#$part <= 255)) || return 1; done
}

yarr_valid_ipv6() {
    local host=$1 compact groups=0 group
    [[ "$host" == *:* && "$host" =~ ^[0-9A-Fa-f:]+$ ]] || return 1
    compact=${host/::/:}
    [[ "$compact" != *::* ]] || return 1
    compact=${compact#:}
    compact=${compact%:}
    if [[ -n "$compact" ]]; then
        IFS=':' read -r -a ipv6_parts <<< "$compact"
        for group in "${ipv6_parts[@]}"; do
            [[ "$group" =~ ^[0-9A-Fa-f]{1,4}$ ]] || return 1
            groups=$((groups + 1))
        done
    fi
    if [[ "$host" == *::* ]]; then ((groups < 8)); else ((groups == 8)); fi
}

yarr_valid_ip_literal() {
    yarr_valid_ipv4 "$1" || yarr_valid_ipv6 "$1"
}

yarr_valid_tailscale_hostname() {
    [[ "$1" =~ ^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$ ]]
}

yarr_validate_config() {
    [[ "$ENABLED" == yes || "$ENABLED" == no ]] || { yarr_error 'ENABLED must be yes or no'; return 1; }
    [[ "$BIND_MODE" == loopback || "$BIND_MODE" == lan || "$BIND_MODE" == custom ]] || { yarr_error 'BIND_MODE must be loopback, lan, or custom'; return 1; }
    [[ "$PORT" =~ ^[0-9]+$ ]] && ((10#$PORT >= 1 && 10#$PORT <= 65535)) || { yarr_error 'PORT must be between 1 and 65535'; return 1; }
    case "$AUTH_MODE" in
        bearer|google-oauth|trusted-gateway) ;;
        *) yarr_error 'AUTH_MODE must be bearer, google-oauth, or trusted-gateway'; return 1 ;;
    esac
    [[ "$TAILSCALE_SERVE" == yes || "$TAILSCALE_SERVE" == no ]] || { yarr_error 'TAILSCALE_SERVE must be yes or no'; return 1; }
    [[ "$LOG_LEVEL" =~ ^(trace|debug|info|warn|error)$ ]] || { yarr_error 'LOG_LEVEL is invalid'; return 1; }
    [[ "$UPDATE_CHANNEL" == stable ]] || { yarr_error 'UPDATE_CHANNEL must be stable'; return 1; }
    if [[ "$BIND_MODE" == custom ]]; then
        [[ -n "$CUSTOM_HOST" ]] && yarr_valid_ip_literal "$CUSTOM_HOST" || { yarr_error 'CUSTOM_HOST must be a non-empty IP literal in custom mode'; return 1; }
    fi
    if [[ "$TAILSCALE_SERVE" == yes ]]; then
        yarr_valid_tailscale_hostname "$TAILSCALE_HOSTNAME" || { yarr_error 'TAILSCALE_HOSTNAME must be a DNS-label service name when Tailscale Serve is enabled'; return 1; }
    fi

    if [[ "$AUTH_MODE" == trusted-gateway ]]; then
        [[ "$BIND_MODE" == loopback && "$TAILSCALE_SERVE" == no ]] || {
            yarr_error 'trusted-gateway authentication is restricted to loopback without Tailscale Serve'
            return 1
        }
        [[ -n "${YARR_ENV_VALUES[YARR_MCP_ALLOWED_HOSTS]:-}" || -n "${YARR_ENV_VALUES[YARR_MCP_ALLOWED_ORIGINS]:-}" ]] || {
            yarr_error 'trusted-gateway mode requires YARR_MCP_ALLOWED_HOSTS or YARR_MCP_ALLOWED_ORIGINS'
            return 1
        }
        return 0
    fi

    if [[ "$BIND_MODE" == loopback && "$TAILSCALE_SERVE" == no ]]; then
        return 0
    fi
    case "$AUTH_MODE" in
        bearer)
            [[ -n "${YARR_ENV_VALUES[YARR_MCP_TOKEN]:-}" ]] || { yarr_error 'network exposure with bearer mode requires a non-empty YARR_MCP_TOKEN'; return 1; }
            ;;
        google-oauth)
            [[ -n "${YARR_ENV_VALUES[YARR_MCP_GOOGLE_CLIENT_ID]:-}" && -n "${YARR_ENV_VALUES[YARR_MCP_GOOGLE_CLIENT_SECRET]:-}" ]] || {
                yarr_error 'network exposure with google-oauth requires YARR_MCP_GOOGLE_CLIENT_ID and YARR_MCP_GOOGLE_CLIENT_SECRET'
                return 1
            }
            ;;
    esac
}

yarr_effective_host() {
    case "$BIND_MODE" in
        loopback) printf '%s\n' '127.0.0.1' ;;
        lan) printf '%s\n' '0.0.0.0' ;;
        custom) printf '%s\n' "$CUSTOM_HOST" ;;
    esac
}

yarr_select_binary() {
    local overlay="${YARR_OVERLAY_DIR}/yarr"
    if [[ -f "$overlay" && ! -L "$overlay" && -x "$overlay" ]]; then
        YARR_BINARY=$overlay
    elif [[ -f "$YARR_PACKAGED_BINARY" && ! -L "$YARR_PACKAGED_BINARY" && -x "$YARR_PACKAGED_BINARY" ]]; then
        YARR_BINARY=$YARR_PACKAGED_BINARY
    else
        yarr_error 'no regular executable Yarr binary found'
        return 1
    fi
}

yarr_write_runtime_env() {
    local directory tmp key host yarr_auth_mode yarr_noauth
    directory=$(dirname "$YARR_RUNTIME_ENV")
    mkdir -p "$directory" || return 1
    umask 077
    tmp="${YARR_RUNTIME_ENV}.$$"
    host=$(yarr_effective_host)
    case "$AUTH_MODE" in
        google-oauth) yarr_auth_mode=oauth; yarr_noauth=false ;;
        trusted-gateway) yarr_auth_mode=bearer; yarr_noauth=true ;;
        *) yarr_auth_mode=bearer; yarr_noauth=false ;;
    esac
    : > "$tmp" || return 1
    while IFS= read -r key; do
        printf 'export %s=%q\n' "$key" "${YARR_ENV_VALUES[$key]}" >> "$tmp" || { rm -f "$tmp"; return 1; }
    done < <(printf '%s\n' "${!YARR_ENV_VALUES[@]}" | sort)
    printf 'export YARR_MCP_HOST=%q\nexport YARR_MCP_PORT=%q\nexport YARR_MCP_AUTH_MODE=%q\nexport YARR_NOAUTH=%q\nexport YARR_HOME=%q\nexport RUST_LOG=%q\n' \
        "$host" "$PORT" "$yarr_auth_mode" "$yarr_noauth" "$YARR_APPDATA" "$LOG_LEVEL" >> "$tmp" || { rm -f "$tmp"; return 1; }
    chmod 600 "$tmp" || { rm -f "$tmp"; return 1; }
    "$YARR_SYNC_BIN" -f "$tmp" || { rm -f "$tmp"; return 1; }
    mv -f "$tmp" "$YARR_RUNTIME_ENV"
}

yarr_process_start_ticks() {
    local pid=$1 stat_line remainder
    [[ -r "${YARR_PROC_ROOT}/${pid}/stat" ]] || return 1
    stat_line=$(<"${YARR_PROC_ROOT}/${pid}/stat")
    [[ "$stat_line" == *') '* ]] || return 1
    remainder=${stat_line##*) }
    set -- $remainder
    [[ $# -ge 20 && "${20}" =~ ^[0-9]+$ ]] || return 1
    printf '%s\n' "${20}"
}

yarr_expected_argv_sha() {
    printf '%s\0%s\0%s\0' "$1" serve mcp | sha256sum | awk '{print $1}'
}

yarr_record_pid_metadata() {
    local pid=$1 binary=$2 attempt start_ticks executable_id argv_sha tmp matched=false
    executable_id=$(stat -Lc '%d:%i' "$binary" 2>/dev/null) || return 1
    argv_sha=$(yarr_expected_argv_sha "$binary") || return 1
    for ((attempt = 0; attempt < 50; attempt++)); do
        start_ticks=$(yarr_process_start_ticks "$pid" 2>/dev/null || true)
        if [[ -n "$start_ticks" && -r "${YARR_PROC_ROOT}/${pid}/cmdline" ]] && \
            [[ $(sha256sum "${YARR_PROC_ROOT}/${pid}/cmdline" | awk '{print $1}') == "$argv_sha" ]]; then
            matched=true
            break
        fi
        kill -0 "$pid" 2>/dev/null || return 1
        sleep 0.02
    done
    [[ "$matched" == true && -n "$start_ticks" ]] || return 1
    umask 077
    tmp="${YARR_PID_META}.$$"
    printf 'pid=%s\nstart_ticks=%s\nbinary=%s\nexecutable_id=%s\nargv_sha256=%s\n' \
        "$pid" "$start_ticks" "$binary" "$executable_id" "$argv_sha" > "$tmp" || return 1
    chmod 600 "$tmp" || { rm -f "$tmp"; return 1; }
    mv -f "$tmp" "$YARR_PID_META"
}

yarr_pid_is_owned() {
    local pid line key value meta_pid='' meta_start='' meta_binary='' meta_id='' meta_argv='' actual_start actual_id actual_link actual_path actual_argv
    [[ -f "$YARR_PID" ]] || { [[ ! -e "$YARR_PID_META" ]] || rm -f "$YARR_PID_META"; return 1; }
    pid=$(<"$YARR_PID")
    [[ "$pid" =~ ^[1-9][0-9]*$ ]] || { yarr_error 'PID evidence is malformed'; return 2; }
    if ! kill -0 "$pid" 2>/dev/null; then
        rm -f "$YARR_PID" "$YARR_PID_META"
        return 1
    fi
    yarr_regular_file_no_link "$YARR_PID_META" || { yarr_error "live PID ${pid} has no trustworthy ownership metadata"; return 2; }
    while IFS= read -r line || [[ -n "$line" ]]; do
        [[ "$line" == *=* ]] || { yarr_error 'PID metadata is malformed'; return 2; }
        key=${line%%=*}; value=${line#*=}
        case "$key" in
            pid) meta_pid=$value ;;
            start_ticks) meta_start=$value ;;
            binary) meta_binary=$value ;;
            executable_id) meta_id=$value ;;
            argv_sha256) meta_argv=$value ;;
            *) yarr_error 'PID metadata has an unknown field'; return 2 ;;
        esac
    done < "$YARR_PID_META"
    [[ "$meta_pid" == "$pid" && "$meta_start" =~ ^[0-9]+$ && "$meta_id" =~ ^[0-9]+:[0-9]+$ && "$meta_argv" =~ ^[0-9a-f]{64}$ ]] || {
        yarr_error 'PID metadata is incomplete'
        return 2
    }
    [[ "$meta_binary" == "${YARR_OVERLAY_DIR}/yarr" || "$meta_binary" == "$YARR_PACKAGED_BINARY" ]] || {
        yarr_error 'PID metadata names an unexpected executable'
        return 2
    }
    actual_start=$(yarr_process_start_ticks "$pid" 2>/dev/null || true)
    actual_id=$(stat -Lc '%d:%i' "${YARR_PROC_ROOT}/${pid}/exe" 2>/dev/null || true)
    actual_link=$(readlink "${YARR_PROC_ROOT}/${pid}/exe" 2>/dev/null || true)
    actual_path=${actual_link%' (deleted)'}
    actual_argv=$(sha256sum "${YARR_PROC_ROOT}/${pid}/cmdline" 2>/dev/null | awk '{print $1}')
    [[ "$actual_start" == "$meta_start" && "$actual_id" == "$meta_id" && "$actual_path" == "$meta_binary" && "$actual_argv" == "$meta_argv" ]] || {
        yarr_error "live PID ${pid} does not match retained Yarr ownership evidence"
        return 2
    }
    return 0
}

yarr_pid_owns_listening_port() {
    local pid=$1 port=$2 port_hex table inode fd link
    local -A listening=()
    printf -v port_hex '%04X' "$port"
    for table in "${YARR_PROC_ROOT}/net/tcp" "${YARR_PROC_ROOT}/net/tcp6"; do
        [[ -r "$table" ]] || continue
        while IFS= read -r inode; do [[ -n "$inode" ]] && listening["$inode"]=1; done < <(
            awk -v suffix=":${port_hex}" 'toupper($2) ~ suffix "$" && $4 == "0A" { print $10 }' "$table"
        )
    done
    ((${#listening[@]} > 0)) || return 1
    for fd in "${YARR_PROC_ROOT}/${pid}/fd/"*; do
        [[ -e "$fd" || -L "$fd" ]] || continue
        link=$(readlink "$fd" 2>/dev/null || true)
        [[ "$link" =~ ^socket:\[([0-9]+)\]$ ]] || continue
        inode=${BASH_REMATCH[1]}
        [[ -n "${listening[$inode]:-}" ]] && return 0
    done
    return 1
}

yarr_escape_glob() {
    local value=$1
    value=${value//\\/\\\\}
    value=${value//\*/\\*}
    value=${value//\?/\\?}
    value=${value//\[/\\[}
    value=${value//\]/\\]}
    printf '%s' "$value"
}

yarr_redact_log_line() {
    local line=$1 secret pattern next changed=true budget=${#1}
    while [[ "$changed" == true ]]; do
        changed=false
        for secret in "${YARR_ENV_VALUES[@]}"; do
            [[ -n "$secret" ]] || continue
            pattern=$(yarr_escape_glob "$secret")
            next=${line//$pattern/}
            if [[ "$next" != "$line" ]]; then
                ((${#line} - ${#next} <= budget)) || return 1
                budget=$((budget - ${#line} + ${#next}))
                line=$next
                changed=true
            fi
        done
    done
    printf '%s' "$line"
}

yarr_prepare_log() {
    local directory size index source destination
    [[ "$YARR_LOG_MAX_BYTES" =~ ^[1-9][0-9]*$ ]] || { yarr_error 'invalid log size limit'; return 1; }
    [[ "$YARR_LOG_RETENTION" =~ ^[1-9]$ ]] || { yarr_error 'invalid log retention'; return 1; }
    directory=$(dirname "$YARR_LOG")
    [[ ! -L "$directory" ]] || { yarr_error 'refusing symlink log directory'; return 1; }
    install -d -m 0755 -- "$directory" || return 1
    [[ ! -L "$YARR_LOG" && ( ! -e "$YARR_LOG" || -f "$YARR_LOG" ) ]] || { yarr_error 'refusing unsafe log path'; return 1; }
    for ((index = 1; index <= YARR_LOG_RETENTION; index++)); do
        [[ ! -L "${YARR_LOG}.${index}" && ( ! -e "${YARR_LOG}.${index}" || -f "${YARR_LOG}.${index}" ) ]] || { yarr_error 'refusing unsafe rotated log path'; return 1; }
    done
    if [[ -f "$YARR_LOG" ]]; then size=$(stat -c %s "$YARR_LOG") || return 1; else size=0; fi
    if ((size >= YARR_LOG_MAX_BYTES)); then
        rm -f -- "${YARR_LOG}.${YARR_LOG_RETENTION}"
        for ((index = YARR_LOG_RETENTION - 1; index >= 1; index--)); do
            source="${YARR_LOG}.${index}"; destination="${YARR_LOG}.$((index + 1))"
            [[ ! -e "$source" ]] || mv -f -- "$source" "$destination" || return 1
        done
        [[ ! -e "$YARR_LOG" ]] || mv -f -- "$YARR_LOG" "${YARR_LOG}.1" || return 1
    fi
    umask 077
    : >> "$YARR_LOG" || return 1
    chmod 600 "$YARR_LOG" || return 1
    for ((index = 1; index <= YARR_LOG_RETENTION; index++)); do [[ ! -f "${YARR_LOG}.${index}" ]] || chmod 600 "${YARR_LOG}.${index}" || return 1; done
}

yarr_log() {
    local message
    message=$(yarr_redact_log_line "$*" 2>/dev/null || printf '%s' '[redaction failure]')
    message=${message:0:8192}
    yarr_prepare_log || return 1
    printf '%s yarr: %s\n' "$(date -Is)" "$message" >> "$YARR_LOG"
}

yarr_stream_log() {
    local line sanitized
    while IFS= read -r line || [[ -n "$line" ]]; do
        sanitized=$(yarr_redact_log_line "$line" 2>/dev/null || printf '%s' '[redaction failure]')
        yarr_log "runtime: ${sanitized:0:8192}" || return 1
    done
}

yarr_stop_logger() {
    local logger_pid='' attempt
    if [[ -f "$YARR_LOGGER_PID" ]]; then logger_pid=$(<"$YARR_LOGGER_PID"); fi
    if [[ "$logger_pid" =~ ^[1-9][0-9]*$ ]]; then
        for ((attempt = 0; attempt < 50; attempt++)); do kill -0 "$logger_pid" 2>/dev/null || break; sleep 0.02; done
        kill -0 "$logger_pid" 2>/dev/null && kill -TERM "$logger_pid" 2>/dev/null || true
    fi
    rm -f "$YARR_LOGGER_PID"
    [[ ! -e "$YARR_LOG_PIPE" || -p "$YARR_LOG_PIPE" ]] || { yarr_error 'refusing to remove unsafe log pipe path'; return 1; }
    rm -f "$YARR_LOG_PIPE"
}

yarr_wait_ready() {
    local host=$1 pid=$2 attempt url ownership_status
    [[ "$host" == 0.0.0.0 || "$host" == 127.0.0.1 ]] && host=127.0.0.1
    [[ "$host" == *:* ]] && host="[${host}]"
    url="http://${host}:${PORT}/ready"
    for ((attempt = 0; attempt < ${YARR_READY_ATTEMPTS:-30}; attempt++)); do
        if yarr_pid_is_owned; then
            yarr_pid_owns_listening_port "$pid" "$PORT" && \
                "$YARR_CURL_BIN" --fail --silent --show-error --max-time 2 "$url" >/dev/null 2>&1 && return 0
        else
            ownership_status=$?
            [[ "$ownership_status" == 1 ]] && break
        fi
        sleep "${YARR_READY_INTERVAL:-1}"
    done
    yarr_error "readiness ownership check failed: ${url}"
    return 1
}

yarr_validate_inherited_lock_fd() {
    local lock_fd=$1 actual expected
    [[ "$lock_fd" =~ ^[0-9]{1,3}$ ]] || return 1
    ((10#$lock_fd >= 3 && 10#$lock_fd <= 255)) || return 1
    [[ -e "/proc/$$/fd/${lock_fd}" ]] || return 1
    actual=$(readlink -f "/proc/$$/fd/${lock_fd}" 2>/dev/null) || return 1
    expected=$(readlink -f "$YARR_LOCK" 2>/dev/null) || return 1
    [[ "$actual" == "$expected" ]] || return 1
    "$YARR_FLOCK_BIN" -n "$lock_fd"
}

yarr_with_inherited_lock() {
    local lock_fd=$1
    shift
    yarr_validate_inherited_lock_fd "$lock_fd" || { yarr_error 'invalid or unowned inherited lifecycle lock'; return 1; }
    local YARR_ACTIVE_LOCK_FD=$lock_fd
    "$@"
}

yarr_with_lock() {
    local wait_seconds=${YARR_LOCK_WAIT_SECONDS:-0}
    [[ "$wait_seconds" =~ ^([0-9]+)(\.[0-9]+)?$ ]] || { yarr_error 'invalid lock wait'; return 1; }
    mkdir -p "$(dirname "$YARR_LOCK")" || return 1
    (
        umask 077
        exec 9>>"$YARR_LOCK"
        chmod 600 "$YARR_LOCK" || return 1
        "$YARR_FLOCK_BIN" --exclusive --wait "$wait_seconds" 9 || { yarr_error 'another Yarr operation holds the lifecycle lock'; return 1; }
        local YARR_ACTIVE_LOCK_FD=9
        "$@"
    )
}
