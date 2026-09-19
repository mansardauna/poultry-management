#!/usr/bin/env bash
#
# deploy.sh — build, deploy, and launch the PFMS project on a remote
# server using PM2 (no Docker).
#
# Requirements on the deploy machine:
#   - bash, rsync (optional, tar fallback), scp, ssh
# Requirements on the target server:
#   - Node.js >=18, npm, pm2 (installed globally), curl
#
# Configuration:
#   All options can be passed as flags (see --help) or via environment
#   variables: DEPLOY_HOST, DEPLOY_USER, DEPLOY_PORT, DEPLOY_REMOTE_DIR,
#   DEPLOY_APP_PORT, DEPLOY_SSH_KEY, ENV_SOURCE_FILE.
#   A local .deploy.conf (key=value lines) is sourced if present.
#
# Examples:
#   ./deploy.sh -H 51.222.136.77 -e .env
#   ./deploy.sh -H 51.222.136.77 -e .env -p 22 -k ~/.ssh/id_ed25519
#   ./deploy.sh -H 51.222.136.77 --rollback          # restore previous .next
#   ./deploy.sh -H 51.222.136.77 --skip-sync         # rebuild from current remote source
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

DEPLOY_HOST="${DEPLOY_HOST:-}"
DEPLOY_USER="${DEPLOY_USER:-root}"
DEPLOY_PORT="${DEPLOY_PORT:-22}"
DEPLOY_REMOTE_DIR="${DEPLOY_REMOTE_DIR:-/var/www/pms.ngeggs.com}"
DEPLOY_APP_PORT="${DEPLOY_APP_PORT:-3000}"
DEPLOY_SSH_KEY="${DEPLOY_SSH_KEY:-}"
ENV_SOURCE_FILE="${ENV_SOURCE_FILE:-}"
ROLLBACK=false
SKIP_SYNC=false
DRY_RUN=false
ASSUME_YES=false
PRUNE=false

if [ -f "$SCRIPT_DIR/.deploy.conf" ]; then
  # shellcheck disable=SC1091
  source "$SCRIPT_DIR/.deploy.conf"
fi

usage() {
  cat <<'EOF'
Usage: ./deploy.sh [options]

Deploy and launch the PFMS app on a remote server with PM2.

Options:
  -H HOST    Remote server hostname/IP (required, or set DEPLOY_HOST)
  -u USER    SSH user                              [default: root]
  -p PORT    SSH port                              [default: 22]
  -d DIR     Remote deploy directory               [default: /var/www/pms.ngeggs.com]
  -P PORT    Host port the app is published on     [default: 3000]
  -k KEY     Path to SSH private key
  -e FILE    Local env file to ship to the server  [default: .env]
  -c         Prune (delete) remote files no longer present in source
  -r         Roll back to the previous build
  -s         Skip source sync (rebuild from current remote source)
  -n         Dry run: print commands without executing
  -y         Assume yes (skip confirmation prompt)
  -h         Show this help and exit

Environment overrides:
  DEPLOY_HOST, DEPLOY_USER, DEPLOY_PORT, DEPLOY_REMOTE_DIR,
  DEPLOY_APP_PORT, DEPLOY_SSH_KEY, ENV_SOURCE_FILE

A local .deploy.conf (KEY=VALUE lines) is sourced if present.
EOF
  exit 0
}

while getopts "H:u:p:d:P:k:e:crsnyh" opt; do
  case "$opt" in
    H) DEPLOY_HOST="$OPTARG" ;;
    u) DEPLOY_USER="$OPTARG" ;;
    p) DEPLOY_PORT="$OPTARG" ;;
    d) DEPLOY_REMOTE_DIR="$OPTARG" ;;
    P) DEPLOY_APP_PORT="$OPTARG" ;;
    k) DEPLOY_SSH_KEY="$OPTARG" ;;
    e) ENV_SOURCE_FILE="$OPTARG" ;;
    c) PRUNE=true ;;
    r) ROLLBACK=true ;;
    s) SKIP_SYNC=true ;;
    n) DRY_RUN=true ;;
    y) ASSUME_YES=true ;;
    h) usage ;;
    *) usage ;;
  esac
done
shift $((OPTIND - 1))

if [ -z "$DEPLOY_HOST" ]; then
  echo "ERROR: no target host. Use -H <host> or set DEPLOY_HOST." >&2
  usage
fi

SSH_BASE=(ssh -p "$DEPLOY_PORT" -oBatchMode=yes -oConnectTimeout=15 -oStrictHostKeyChecking=accept-new)
if [ -n "$DEPLOY_SSH_KEY" ]; then
  SSH_BASE+=(-i "$DEPLOY_SSH_KEY")
fi
SCP_BASE=(scp -P "$DEPLOY_PORT" -oBatchMode=yes -oStrictHostKeyChecking=accept-new)
if [ -n "$DEPLOY_SSH_KEY" ]; then
  SCP_BASE+=(-i "$DEPLOY_SSH_KEY")
fi
SSH_TARGET="${DEPLOY_USER}@${DEPLOY_HOST}"
RSYNC_RSH="ssh -p $DEPLOY_PORT -oBatchMode=yes -oStrictHostKeyChecking=accept-new"
if [ -n "$DEPLOY_SSH_KEY" ]; then
  RSYNC_RSH="$RSYNC_RSH -i $DEPLOY_SSH_KEY"
fi

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

log() { printf "${GREEN}[deploy]${NC} %s\n" "$*"; }
warn() { printf "${YELLOW}[deploy][warn]${NC} %s\n" "$*" >&2; }
fail() { printf "${RED}[deploy][error]${NC} %s\n" "$*" >&2; exit 1; }

cmd_run() {
  if $DRY_RUN; then
    printf '[dry-run] %s %s\n' "${SSH_BASE[*]}" "$*"
    return 0
  fi
  "${SSH_BASE[@]}" "$SSH_TARGET" "$@"
}

prepare_remote() {
  log "Checking remote prerequisites on ${DEPLOY_HOST} ..."
  if $DRY_RUN; then
    log "Prerequisites OK. [dry-run]"
    return
  fi
  local checks
  checks="$(cmd_run '
    set -e
    command -v node >/dev/null 2>&1 || { echo "MISSING_NODE"; exit 1; }
    command -v npm  >/dev/null 2>&1 || { echo "MISSING_NPM";  exit 1; }
    command -v pm2  >/dev/null 2>&1 || { echo "MISSING_PM2";  exit 1; }
    mkdir -p "'"$DEPLOY_REMOTE_DIR"'/data" "'"$DEPLOY_REMOTE_DIR"'/logs"
  ')"
  if echo "$checks" | grep -q MISSING_NODE; then
    fail "Node.js is not installed on the server. Install Node >= 18 first."
  fi
  if echo "$checks" | grep -q MISSING_NPM; then
    fail "npm is not installed on the server."
  fi
  if echo "$checks" | grep -q MISSING_PM2; then
    fail "pm2 is not installed on the server. Run: npm i -g pm2 && pm2 startup"
  fi
  log "Prerequisites OK (node + npm + pm2)."
}

sync_source() {
  if $SKIP_SYNC; then
    log "Skipping source sync (--skip-sync)."
    return
  fi
  log "Syncing project source to ${DEPLOY_HOST}:${DEPLOY_REMOTE_DIR} ..."
  EXCLUDES=(
    --exclude='node_modules'
    --exclude='.next'
    --exclude='.next.prev'
    --exclude='out'
    --exclude='.git'
    --exclude='.gitignore'
    --exclude='.vercel'
    --exclude='.vscode'
    --exclude='.idea'
    --exclude='scratch'
    --exclude='docs'
    --exclude='*.md'
    --exclude='.env'
    --exclude='.env.*'
    --exclude='deploy.sh'
    --exclude='.deploy.conf'
    --exclude='npm-debug.log*'
    --exclude='yarn-debug.log*'
    --exclude='yarn-error.log*'
  )

  if $DRY_RUN; then
    EXCLUDES_STR="${EXCLUDES[*]}"
    RSYNC_FLAGS="-az"
    if $PRUNE; then
      RSYNC_FLAGS="$RSYNC_FLAGS --delete"
    fi
    printf 'rsync %s %s -e "%s" %s/ %s:%s/\n' \
      "$RSYNC_FLAGS" "$EXCLUDES_STR" "$RSYNC_RSH" "$SCRIPT_DIR" "$SSH_TARGET" "$DEPLOY_REMOTE_DIR"
    log "Source sync complete. [dry-run]"
    return
  fi

  if cmd_run "command -v rsync >/dev/null 2>&1"; then
    log "rsync available — using incremental sync."
    rsync -az ${PRUNE:+--delete} "${EXCLUDES[@]}" -e "$RSYNC_RSH" \
      "$SCRIPT_DIR/" "$SSH_TARGET:$DEPLOY_REMOTE_DIR/"
  else
    warn "rsync not found — falling back to tar pipe."
    TAR_EXCLUDES=()
    for e in "${EXCLUDES[@]}"; do
      TAR_EXCLUDES+=("--exclude=${e#--exclude=}")
    done
    tar -C "$SCRIPT_DIR" -czf - "${TAR_EXCLUDES[@]}" . |
      "${SSH_BASE[@]}" "$SSH_TARGET" "mkdir -p '$DEPLOY_REMOTE_DIR' && tar -xzf - -C '$DEPLOY_REMOTE_DIR'"
  fi
  log "Source sync complete."
}

ship_env() {
  if [ -z "$ENV_SOURCE_FILE" ]; then
    ENV_SOURCE_FILE="$SCRIPT_DIR/.env"
  fi
  if ! $DRY_RUN && [ ! -f "$ENV_SOURCE_FILE" ]; then
    fail "Env file '$ENV_SOURCE_FILE' not found."
  fi
  log "Shipping environment file to ${DEPLOY_HOST}:${DEPLOY_REMOTE_DIR}/.env"
  if $DRY_RUN; then
    printf 'scp %s %s:%s/.env\n' "$ENV_SOURCE_FILE" "$SSH_TARGET" "$DEPLOY_REMOTE_DIR"
    printf 'chmod 600 %s/.env\n' "$DEPLOY_REMOTE_DIR"
  else
    "${SCP_BASE[@]}" "$ENV_SOURCE_FILE" "$SSH_TARGET:$DEPLOY_REMOTE_DIR/.env"
    cmd_run "chmod 600 '$DEPLOY_REMOTE_DIR/.env'"
  fi
}

write_ecosystem() {
  log "Writing ecosystem.config.js on the server."
  local eco
  eco="module.exports = {
  apps: [
    {
      name: \"pms\",
      script: \"npm\",
      args: \"run start\",
      cwd: \"${DEPLOY_REMOTE_DIR}\",
      instances: 1,
      exec_mode: \"fork\",
      autorestart: true,
      max_memory_restart: \"1G\",
      restart_delay: 5000,
      max_restarts: 20,
      exp_backoff_restart_delay: 1000,
      min_uptime: \"10s\",
      kill_timeout: 15000,
      listen_timeout: 30000,
      time: true,
      merge_logs: true,
      out_file: \"${DEPLOY_REMOTE_DIR}/logs/pm2.out.log\",
      err_file: \"${DEPLOY_REMOTE_DIR}/logs/pm2.err.log\",
      env: {
        NODE_ENV: \"production\",
        PORT: \"${DEPLOY_APP_PORT}\",
        HOSTNAME: \"0.0.0.0\",
        NEXT_TELEMETRY_DISABLED: \"1\"
      }
    }
  ]
};
"
  if $DRY_RUN; then
    printf 'cat > %s/ecosystem.config.js\n' "$DEPLOY_REMOTE_DIR"
  else
    printf '%s' "$eco" | cmd_run "cat > '$DEPLOY_REMOTE_DIR/ecosystem.config.js'"
  fi
}

snapshot_build() {
  log "Snapshotting current .next to .next.prev for rollback ..."
  if $DRY_RUN; then
    printf 'mv %s/.next %s/.next.prev 2>/dev/null || true\n' "$DEPLOY_REMOTE_DIR" "$DEPLOY_REMOTE_DIR"
    return
  fi
  cmd_run "cd '$DEPLOY_REMOTE_DIR' && rm -rf .next.prev && mv .next .next.prev 2>/dev/null || true"
}

restore_build() {
  log "Restoring previous .next build ..."
  if $DRY_RUN; then
    printf 'mv %s/.next.prev %s/.next 2>/dev/null || true\n' "$DEPLOY_REMOTE_DIR" "$DEPLOY_REMOTE_DIR"
    return
  fi
  cmd_run "cd '$DEPLOY_REMOTE_DIR' && [ -d .next.prev ] && mv .next.prev .next || { echo 'No previous build to restore.'; exit 1; }"
}

install_deps() {
  log "Installing npm dependencies on the server ..."
  if $DRY_RUN; then
    printf 'cd %s && npm ci --prefer-offline\n' "$DEPLOY_REMOTE_DIR"
    return
  fi
  cmd_run "cd '$DEPLOY_REMOTE_DIR' && npm ci --prefer-offline 2>&1 | tail -5"
}

build_app() {
  log "Building production bundle on the server ..."
  if $DRY_RUN; then
    printf 'cd %s && npm run build\n' "$DEPLOY_REMOTE_DIR"
    return
  fi
  cmd_run "cd '$DEPLOY_REMOTE_DIR' && npm run build 2>&1 | tail -8"
}

restart_app() {
  log "Restarting PM2 process ..."
  if $DRY_RUN; then
    printf 'cd %s && pm2 start ecosystem.config.js && pm2 save\n' "$DEPLOY_REMOTE_DIR"
    return
  fi
  cmd_run "
    cd '$DEPLOY_REMOTE_DIR'
    if pm2 describe pms >/dev/null 2>&1; then
      pm2 restart pms
    else
      pm2 start ecosystem.config.js
      pm2 startup systemd -u root --hp /root 2>/dev/null || true
    fi
    pm2 save 2>/dev/null || true
  "
}

wait_healthy() {
  log "Waiting for the app to respond on http://${DEPLOY_HOST}:${DEPLOY_APP_PORT} ..."
  local i
  for i in $(seq 1 45); do
    if $DRY_RUN; then
      log "App is healthy. [dry-run]"
      return 0
    fi
    if cmd_run "curl -sf http://127.0.0.1:${DEPLOY_APP_PORT}/login >/dev/null 2>&1"; then
      log "App is healthy (took ${i} checks)."
      return 0
    fi
    sleep 2
  done
  warn "App did not become healthy within the timeout. Recent logs:"
  cmd_run "pm2 logs pms --lines 50 --nostream" || true
  fail "Deployment failed health check."
}

confirm_or_abort() {
  if $ASSUME_YES; then
    return
  fi
  printf "Deploy PFMS to %s (%s:%s) remote dir %s via PM2? [y/N] " "$DEPLOY_HOST" "$DEPLOY_USER" "$DEPLOY_PORT" "$DEPLOY_REMOTE_DIR"
  read -r answer
  case "$answer" in
    y|Y|yes|YES) ;;
    *) fail "Aborted by user." ;;
  esac
}

main() {
  log "PFMS deployment to ${DEPLOY_HOST} (PM2)"
  echo "  user:       ${DEPLOY_USER}@${DEPLOY_HOST}:${DEPLOY_PORT}"
  echo "  remote dir: ${DEPLOY_REMOTE_DIR}"
  echo "  app port:   ${DEPLOY_APP_PORT}"
  echo "  mode:       $([ "$ROLLBACK" = true ] && echo 'rollback' || echo 'deploy')"

  confirm_or_abort

  prepare_remote

  if $ROLLBACK; then
    restore_build
    restart_app
    wait_healthy
    log "Rollback complete. http://${DEPLOY_HOST}:${DEPLOY_APP_PORT}"
    exit 0
  fi

  sync_source
  ship_env
  snapshot_build
  write_ecosystem
  install_deps
  build_app
  restart_app
  wait_healthy

  echo
  printf "${GREEN}✓ Deployment complete!${NC}\n"
  echo "  App:      http://${DEPLOY_HOST}:${DEPLOY_APP_PORT}"
  echo "  Setup:    http://${DEPLOY_HOST}:${DEPLOY_APP_PORT}/setup  (first-run wizard)"
  echo "  Remote:   ${DEPLOY_USER}@${DEPLOY_HOST}:${DEPLOY_REMOTE_DIR}"
  echo "  Rollback: ./deploy.sh -H ${DEPLOY_HOST} --rollback"
  echo
}

main "$@"
