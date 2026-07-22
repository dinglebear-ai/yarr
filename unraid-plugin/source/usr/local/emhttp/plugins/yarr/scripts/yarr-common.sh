#!/usr/bin/env bash
# Shared, non-executing configuration and process helpers for the Yarr plugin.

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
YARR_PID=${YARR_PID:-"${YARR_RUN_ROOT}/yarr.pid"}
YARR_LOCK=${YARR_LOCK:-"${YARR_LOCK_ROOT}/yarr-plugin.lock"}
YARR_LOG=${YARR_LOG:-"${YARR_LOG_ROOT}/yarr/yarr.log"}
YARR_RUNTIME_ENV=${YARR_RUNTIME_ENV:-"${YARR_RUN_ROOT}/yarr.env"}
YARR_TAILSCALE_STATE=${YARR_TAILSCALE_STATE:-"${YARR_APPDATA}/tailscale-serve.state"}
YARR_CURL_BIN=${YARR_CURL_BIN:-/usr/bin/curl}
YARR_TAILSCALE_BIN=${YARR_TAILSCALE_BIN:-/usr/bin/tailscale}

declare -Ag YARR_ENV_VALUES=()
declare -ag YARR_RUNTIME_PAIRS=()

yarr_error() {
    printf 'yarr: %s\n' "$*" >&2
}

yarr_has_control_characters() {
    [[ "$1" =~ [[:cntrl:]] ]]
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

    [[ -f "$YARR_CFG" ]] || {
        yarr_error "missing configuration: ${YARR_CFG}"
        return 1
    }
    [[ -f "$YARR_ENV" ]] || {
        yarr_error "missing environment: ${YARR_ENV}"
        return 1
    }

    local line key value
    while IFS= read -r line || [[ -n "$line" ]]; do
        line=${line%$'\r'}
        [[ -z "$line" || "$line" == \#* ]] && continue
        [[ "$line" == *=* ]] || {
            yarr_error "invalid configuration line"
            return 1
        }
        key=${line%%=*}
        value=${line#*=}
        yarr_set_config_value "$key" "$value" || return 1
    done < "$YARR_CFG"

    while IFS= read -r line || [[ -n "$line" ]]; do
        line=${line%$'\r'}
        [[ -z "$line" || "$line" == \#* ]] && continue
        [[ "$line" == *=* ]] || {
            yarr_error "invalid environment line"
            return 1
        }
        key=${line%%=*}
        value=${line#*=}
        [[ "$key" =~ ^[A-Za-z_][A-Za-z0-9_]*$ ]] || {
            yarr_error "invalid environment variable name: ${key}"
            return 1
        }
        yarr_has_control_characters "$value" && {
            yarr_error "control character in environment variable: ${key}"
            return 1
        }
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
    for part in "${parts[@]}"; do
        ((10#$part <= 255)) || return 1
    done
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
    if [[ "$host" == *::* ]]; then
        ((groups < 8))
    else
        ((groups == 8))
    fi
}

yarr_valid_ip_literal() {
    yarr_valid_ipv4 "$1" || yarr_valid_ipv6 "$1"
}

yarr_validate_config() {
    [[ "$ENABLED" == yes || "$ENABLED" == no ]] || {
        yarr_error 'ENABLED must be yes or no'
        return 1
    }
    [[ "$BIND_MODE" == loopback || "$BIND_MODE" == lan || "$BIND_MODE" == custom ]] || {
        yarr_error 'BIND_MODE must be loopback, lan, or custom'
        return 1
    }
    [[ "$PORT" =~ ^[0-9]+$ ]] && ((10#$PORT >= 1 && 10#$PORT <= 65535)) || {
        yarr_error 'PORT must be between 1 and 65535'
        return 1
    }
    case "$AUTH_MODE" in
        bearer|google-oauth|trusted-gateway) ;;
        *)
            yarr_error 'AUTH_MODE must be bearer, google-oauth, or trusted-gateway'
            return 1
            ;;
    esac
    [[ "$TAILSCALE_SERVE" == yes || "$TAILSCALE_SERVE" == no ]] || {
        yarr_error 'TAILSCALE_SERVE must be yes or no'
        return 1
    }
    [[ "$LOG_LEVEL" =~ ^(trace|debug|info|warn|error)$ ]] || {
        yarr_error 'LOG_LEVEL is invalid'
        return 1
    }
    [[ "$UPDATE_CHANNEL" =~ ^(stable|beta)$ ]] || {
        yarr_error 'UPDATE_CHANNEL is invalid'
        return 1
    }
    if [[ "$BIND_MODE" == custom ]]; then
        [[ -n "$CUSTOM_HOST" ]] && yarr_valid_ip_literal "$CUSTOM_HOST" || {
            yarr_error 'CUSTOM_HOST must be a non-empty IP literal in custom mode'
            return 1
        }
    fi
    if [[ "$TAILSCALE_SERVE" == yes ]]; then
        yarr_valid_tailscale_hostname "$TAILSCALE_HOSTNAME" || {
            yarr_error 'TAILSCALE_HOSTNAME must be a DNS-label service name when Tailscale Serve is enabled'
            return 1
        }
    fi
    [[ "$BIND_MODE" == loopback ]] && return 0
    case "$AUTH_MODE" in
        bearer)
            [[ -n "${YARR_ENV_VALUES[YARR_MCP_TOKEN]:-}" ]] || {
                yarr_error 'non-loopback bearer mode requires a non-empty YARR_MCP_TOKEN accepted by Yarr'
                return 1
            }
            ;;
        google-oauth)
            [[ -n "${YARR_ENV_VALUES[YARR_MCP_GOOGLE_CLIENT_ID]:-}" && -n "${YARR_ENV_VALUES[YARR_MCP_GOOGLE_CLIENT_SECRET]:-}" ]] || {
                yarr_error 'non-loopback google-oauth mode requires YARR_MCP_GOOGLE_CLIENT_ID and YARR_MCP_GOOGLE_CLIENT_SECRET'
                return 1
            }
            ;;
        trusted-gateway)
            [[ -n "${YARR_ENV_VALUES[YARR_MCP_ALLOWED_HOSTS]:-}" || -n "${YARR_ENV_VALUES[YARR_MCP_ALLOWED_ORIGINS]:-}" ]] || {
                yarr_error 'non-loopback trusted-gateway mode requires YARR_MCP_ALLOWED_HOSTS or YARR_MCP_ALLOWED_ORIGINS'
                return 1
            }
            ;;
    esac
}

yarr_valid_tailscale_hostname() {
    [[ "$1" =~ ^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$ ]]
}

yarr_effective_host() {
    case "$BIND_MODE" in
        loopback) printf '%s\n' '127.0.0.1' ;;
        lan) printf '%s\n' '0.0.0.0' ;;
        custom) printf '%s\n' "$CUSTOM_HOST" ;;
    esac
}

yarr_select_binary() {
    local overlay="${YARR_APPDATA}/yarr"
    local packaged="${YARR_PLUGIN_ROOT}/bin/yarr"
    if [[ -x "$overlay" ]]; then
        YARR_BINARY=$overlay
    elif [[ -x "$packaged" ]]; then
        YARR_BINARY=$packaged
    else
        yarr_error 'no executable Yarr binary found'
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
        google-oauth)
            yarr_auth_mode=oauth
            yarr_noauth=false
            ;;
        trusted-gateway)
            yarr_auth_mode=bearer
            yarr_noauth=true
            ;;
        *)
            yarr_auth_mode=bearer
            yarr_noauth=false
            ;;
    esac
    : > "$tmp" || return 1
    for key in "${!YARR_ENV_VALUES[@]}"; do
        printf '%s=%q\n' "$key" "${YARR_ENV_VALUES[$key]}" >> "$tmp" || {
            rm -f "$tmp"
            return 1
        }
    done
    printf 'YARR_MCP_HOST=%q\nYARR_MCP_PORT=%q\nYARR_MCP_AUTH_MODE=%q\nYARR_NOAUTH=%q\nYARR_HOME=%q\nRUST_LOG=%q\n' \
        "$host" "$PORT" "$yarr_auth_mode" "$yarr_noauth" "$YARR_APPDATA" "$LOG_LEVEL" >> "$tmp" || {
        rm -f "$tmp"
        return 1
    }
    chmod 600 "$tmp" || {
        rm -f "$tmp"
        return 1
    }
    mv -f "$tmp" "$YARR_RUNTIME_ENV"

    YARR_RUNTIME_PAIRS=()
    for key in "${!YARR_ENV_VALUES[@]}"; do
        YARR_RUNTIME_PAIRS+=("${key}=${YARR_ENV_VALUES[$key]}")
    done
    YARR_RUNTIME_PAIRS+=("YARR_MCP_HOST=${host}" "YARR_MCP_PORT=${PORT}" \
        "YARR_MCP_AUTH_MODE=${yarr_auth_mode}" "YARR_NOAUTH=${yarr_noauth}" \
        "YARR_HOME=${YARR_APPDATA}" "RUST_LOG=${LOG_LEVEL}")
}

yarr_pid_is_owned() {
    local pid actual expected candidate
    [[ -f "$YARR_PID" ]] || return 1
    pid=$(<"$YARR_PID")
    [[ "$pid" =~ ^[1-9][0-9]*$ ]] && kill -0 "$pid" 2>/dev/null || {
        rm -f "$YARR_PID"
        return 1
    }
    actual=$(readlink -f "${YARR_PROC_ROOT}/${pid}/exe" 2>/dev/null || true)
    for candidate in "${YARR_APPDATA}/yarr" "${YARR_PLUGIN_ROOT}/bin/yarr"; do
        expected=$(readlink -f "$candidate" 2>/dev/null || true)
        [[ -n "$actual" && "$actual" == "$expected" ]] && return 0
    done
    rm -f "$YARR_PID"
    return 1
}

yarr_wait_ready() {
    local host=$1 attempt url
    [[ "$host" == 0.0.0.0 || "$host" == 127.0.0.1 ]] && host=127.0.0.1
    [[ "$host" == *:* ]] && host="[${host}]"
    url="http://${host}:${PORT}/ready"
    for ((attempt = 0; attempt < ${YARR_READY_ATTEMPTS:-30}; attempt++)); do
        "$YARR_CURL_BIN" --fail --silent --show-error --max-time 2 "$url" >/dev/null 2>&1 && return 0
        sleep "${YARR_READY_INTERVAL:-1}"
    done
    yarr_error "readiness check failed: ${url}"
    return 1
}

yarr_with_lock() {
    mkdir -p "$(dirname "$YARR_LOCK")" || return 1
    (
        flock -n 9 || return 1
        "$@"
    ) 9>"$YARR_LOCK"
}
