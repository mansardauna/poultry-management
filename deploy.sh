#!/usr/bin/env bash
#
# deploy.sh — build, deploy, and launch the PFMS project on a remote
# server using Docker Compose.
#
# Requirements on the deploy machine:
#   - bash, rsync (optional, tar fallback), scp, ssh
# Requirements on the target server:
#   - Docker Engine + Docker Compose v2, rsync (optional)
#
# Configuration:
#   All options can be passed as flags (see --help) or via environment
#   variables: DEPLOY_HOST, DEPLOY_USER, DEPLOY_PORT, DEPLOY_REMOTE_DIR,
#   DEPLOY_APP_PORT, DEPLOY_SSH_KEY, ENV_SOURCE_FILE.
#   A local .deploy.conf (key=value lines) is sourced if present.
#
# Examples:
#   ./deploy.sh -H 203.0.113.10 -u deploy -e .env
#   ./deploy.sh -H 203.0.113.10 -e .env -p 2222 -P 8000 -k ~/.ssh/id_ed25519
#   ./deploy.sh -H 203.0.113.10 --rollback          # go back to previous image
#   ./deploy.sh -H 203.0.113.10 --skip-sync         # rebuild from current remote source
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

DEPLOY_HOST="${DEPLOY_HOST:-}"
DEPLOY_USER="${DEPLOY_USER:-root}"
DEPLOY_PORT="${DEPLOY_PORT:-22}"
DEPLOY_REMOTE_DIR="${DEPLOY_REMOTE_DIR:-/var/www/pms.ngeggs.com}"
DEPLOY_APP_PORT="${DEPLOY_APP_PORT:-3000}"
DEPLOY_SSH_KEY="${DEPLOY_SSH_KEY:-}"
ENV_SOURCE_FILE="${ENV_SOURCE_FILE:-}"
IMAGE_TAG="latest"
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

Deploy and launch the PFMS app on a remote server with Docker Compose.

Options:
  -H HOST    Remote server hostname/IP (required, or set DEPLOY_HOST)
  -u USER    SSH user                              [default: root]
  -p PORT    SSH port                              [default: 22]
  -d DIR     Remote deploy directory               [default: /var/www/pms.ngeggs.com]
  -P PORT    Host port the app is published on     [default: 3000]
  -k KEY     Path to SSH private key
  -e FILE    Local env file to ship to the server  [default: .env]
  -c         Prune (delete) files on the server no longer present in the
             source. OFF by default so nothing is ever removed from the
             remote directory — recommended for production servers.
  -r         Roll back to the previous image
  -s         Skip source sync (rebuild from current remote source)
  -n         Dry run: print commands without executing
  -y         Assume yes (skip confirmation prompt)
  -h         Show this help and exit

Environment overrides:
  DEPLOY_HOST, DEPLOY_USER, DEPLOY_PORT, DEPLOY_REMOTE_DIR,
  DEPLOY_APP_PORT, DEPLOY_SSH_KEY, ENV_SOURCE_FILE

A local .deploy.conf (KEY=VALUE lines) is sourced if present.

Examples:
  ./deploy.sh -H 203.0.113.10 -e .env
  ./deploy.sh -H 203.0.113.10 -e .env -p 2222 -P 8000 -k ~/.ssh/id_ed25519
  ./deploy.sh -H 203.0.113.10 --rollback
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
COMPOSE_CMD=""
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
  local checks
  if $DRY_RUN; then
    COMPOSE_CMD="docker compose"
    log "Prerequisites OK ($COMPOSE_CMD). [dry-run]"
    return
  fi
  checks="$(cmd_run '
    set -e
    command -v docker >/dev/null 2>&1 || { echo "MISSING_DOCKER"; exit 1; }
    if docker compose version >/dev/null 2>&1; then echo "compose-v2";
    elif command -v docker-compose >/dev/null 2>&1; then echo "compose-v1";
    else echo "MISSING_COMPOSE"; exit 1; fi
    mkdir -p "'"$DEPLOY_REMOTE_DIR"'"
  ')"
  if echo "$checks" | grep -q MISSING_DOCKER; then
    fail "Docker is not installed on the server. Install Docker Engine first."
  fi
  if echo "$checks" | grep -q MISSING_COMPOSE; then
    fail "Docker Compose is not installed on the server. Install Compose v2."
  fi
  if echo "$checks" | grep -q "compose-v1"; then
    COMPOSE_CMD="docker-compose"
    warn "Server uses docker-compose v1 (legacy). Consider upgrading to Compose v2."
  else
    COMPOSE_CMD="docker compose"
  fi
  log "Prerequisites OK ($COMPOSE_CMD)."
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
    --exclude='docker-compose*.yml'
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
    log "rsync available on server — using incremental sync."
    rsync -az ${PRUNE:+--delete} "${EXCLUDES[@]}" -e "$RSYNC_RSH" \
      "$SCRIPT_DIR/" "$SSH_TARGET:$DEPLOY_REMOTE_DIR/"
  else
    warn "rsync not found on the server — falling back to tar pipe."
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
    fail "Env file '$ENV_SOURCE_FILE' not found. Create it from .env.example and fill in your values."
  fi
  log "Shipping environment file to ${DEPLOY_HOST}:${DEPLOY_REMOTE_DIR}/.env"
  if $DRY_RUN; then
    printf 'scp %s %s:%s/.env\n' "$ENV_SOURCE_FILE" "$SSH_TARGET" "$DEPLOY_REMOTE_DIR"
    printf 'chmod 600 %s/.env\n' "$DEPLOY_REMOTE_DIR"
  else
    "${SCP_BASE[@]}" "$ENV_SOURCE_FILE" "$SSH_TARGET:$DEPLOY_REMOTE_DIR/.env"
    cmd_run "chmod 600 '$DEPLOY_REMOTE_DIR/.env'"
  fi

  if ! $DRY_RUN; then
    for required_var in NEXT_PUBLIC_SUPABASE_URL SUPABASE_SERVICE_ROLE_KEY NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY; do
      if ! grep -Eq "^[[:space:]]*${required_var}[[:space:]]*=" "$ENV_SOURCE_FILE"; then
        warn "Env file is missing '$required_var'. The app may fail at runtime."
      fi
    done
  fi
}

write_compose() {
  log "Writing docker-compose.yml on the server."
  local compose
  compose="services:
  pms:
    image: pms:${IMAGE_TAG}
    build: .
    pull_policy: build
    container_name: pms
    ports:
      - \"${DEPLOY_APP_PORT}:3000\"
    env_file:
      - .env
    restart: unless-stopped
    stop_grace_period: 20s
"
  if $DRY_RUN; then
    printf '%s\n' "$compose"
  else
    printf '%s' "$compose" | cmd_run "cat > '$DEPLOY_REMOTE_DIR/docker-compose.yml'"
  fi
}

launch_container() {
  log "Building image and launching on the server ..."
  if $DRY_RUN; then
    log "Would run on server:"
    printf '  cd %s && %s up -d --build\n' "$DEPLOY_REMOTE_DIR" "$COMPOSE_CMD"
    return
  fi
  cmd_run "cd '$DEPLOY_REMOTE_DIR' && docker tag pms:${IMAGE_TAG} pms:previous 2>/dev/null || true"
  cmd_run "cd '$DEPLOY_REMOTE_DIR' && $COMPOSE_CMD up -d --build"
}

rollback_container() {
  log "Rolling back to the previous image (pms:previous) ..."
  if $DRY_RUN; then
    printf 'docker tag pms:previous pms:%s && %s -f %s/docker-compose.yml up -d --force-recreate\n' \
      "$IMAGE_TAG" "$COMPOSE_CMD" "$DEPLOY_REMOTE_DIR"
    return
  fi
  cmd_run "docker tag pms:previous pms:${IMAGE_TAG}"
  cmd_run "cd '$DEPLOY_REMOTE_DIR' && $COMPOSE_CMD up -d --force-recreate"
}

wait_healthy() {
  log "Waiting for the app to respond on http://${DEPLOY_HOST}:${DEPLOY_APP_PORT} ..."
  local i
  for i in $(seq 1 60); do
    if $DRY_RUN; then
      log "App is healthy. [dry-run]"
      return 0
    fi
    if cmd_run "docker compose -f '$DEPLOY_REMOTE_DIR/docker-compose.yml' exec -T pms node -e \"fetch('http://127.0.0.1:3000').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))\"" >/dev/null 2>&1; then
      log "App is healthy (took ${i} checks)."
      return 0
    fi
    sleep 2
  done
  warn "App did not become healthy within the timeout. Recent container logs:"
  cmd_run "docker compose -f '$DEPLOY_REMOTE_DIR/docker-compose.yml' logs --tail=100 pms" || true
  fail "Deployment failed health check."
}

confirm_or_abort() {
  if $ASSUME_YES; then
    return
  fi
  printf "Deploy PFMS to %s (%s:%s) remote dir %s? [y/N] " "$DEPLOY_HOST" "$DEPLOY_USER" "$DEPLOY_PORT" "$DEPLOY_REMOTE_DIR"
  read -r answer
  case "$answer" in
    y|Y|yes|YES) ;;
    *) fail "Aborted by user." ;;
  esac
}

main() {
  log "PFMS deployment to ${DEPLOY_HOST}"
  echo "  user:       ${DEPLOY_USER}@${DEPLOY_HOST}:${DEPLOY_PORT}"
  echo "  remote dir: ${DEPLOY_REMOTE_DIR}"
  echo "  app port:   ${DEPLOY_APP_PORT}"
  echo "  mode:       $([ "$ROLLBACK" = true ] && echo 'rollback' || echo 'deploy')"

  confirm_or_abort

  prepare_remote

  if $ROLLBACK; then
    rollback_container
    wait_healthy
    log "Rollback complete. http://${DEPLOY_HOST}:${DEPLOY_APP_PORT}"
    exit 0
  fi

  sync_source
  ship_env
  write_compose
  launch_container
  wait_healthy

  echo
  printf "${GREEN}✓ Deployment complete!${NC}\n"
  echo "  App:      http://${DEPLOY_HOST}:${DEPLOY_APP_PORT}"
  echo "  Setup:    http://${DEPLOY_HOST}:${DEPLOY_APP_PORT}/setup  (first-run wizard)"
  echo "  Remote:   ${DEPLOY_USER}@${DEPLOY_HOST}:${DEPLOY_REMOTE_DIR}"
  echo "  Rollback: ./deploy.sh -H ${DEPLOY_HOST} --rollback"
  echo
  warn "Set NEXT_PUBLIC_SITE_URL to http://${DEPLOY_HOST}:${DEPLOY_APP_PORT} in your env file so Stripe/Paystack redirects work."
}

main "$@"