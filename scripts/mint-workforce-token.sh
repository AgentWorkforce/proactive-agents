#!/usr/bin/env bash
# Mint a workforce workspace token by exchanging a browser session cookie.
#
# Bypass for the agentworkforce CLI's broken login flow when
# GET /api/v1/workspaces 403s (see workforce#112 for the CLI-side fix).
#
# Usage:
#   ./scripts/mint-workforce-token.sh          # uses hardcoded session + workspace below
#   eval "$(./scripts/mint-workforce-token.sh --export)"   # exports the env vars into your shell
#
# After eval-export, you can immediately run:
#   agentworkforce deployments list
#   agentworkforce deploy ./.agentworkforce/notion-essay-pr/persona.json --mode cloud --on-exists cancel --no-prompt

set -euo pipefail

# --- config ---------------------------------------------------------------
SESSION="${AGENT_RELAY_SESSION:-eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIwNDAzZDNiYS01NWJhLTRlZTYtYWVlZS0xMzQwM2Q5YWVhYzIiLCJjdXJyZW50T3JnYW5pemF0aW9uSWQiOiJmN2E5NzAxNi0zNTg2LTQ0MWUtOWIyYi0yNGI2NjA3M2M5MTUiLCJjdXJyZW50V29ya3NwYWNlSWQiOiI1MDU4NzMyOC00NDFkLTRhY2ItYjhmMy1kYmUxYjNjNWRlOTkiLCJpYXQiOjE3Nzg2Nzk0NTEsImV4cCI6MTc4MTI3MTQ1MX0.LSoXy_9FaUVMgyQEAcFp8-R0AcuqW7JUpDx4jdCv0P0}"
WORKSPACE_ID="${WORKFORCE_WORKSPACE_ID:-50587328-441d-4acb-b8f3-dbe1b3c5de99}"
CLOUD_URL="${WORKFORCE_DEPLOY_CLOUD_URL:-https://agentrelay.com/cloud}"
# Canonical prod URL per relay/packages/cloud/src/types.ts:defaultApiUrl().
# `cloud` is a path, not a subdomain. Staging lives at https://staging.agentrelay.cloud.
# Cookie `agent_relay_session` is scoped to *.agentrelay.com which matches.

EXPORT_MODE=0
for arg in "$@"; do
  case "$arg" in
    --export) EXPORT_MODE=1 ;;
    -h|--help)
      sed -n '2,15p' "$0"
      exit 0
      ;;
    *)
      echo "unknown flag: $arg (try --help)" >&2
      exit 2
      ;;
  esac
done

log() { [ "$EXPORT_MODE" = "0" ] && echo "$@" >&2 || true; }

require() {
  command -v "$1" >/dev/null 2>&1 || { echo "missing dependency: $1" >&2; exit 1; }
}
require curl
require jq

# --- mint ----------------------------------------------------------------
log "session: ${SESSION:0:24}... (exp $(echo "$SESSION" | cut -d. -f2 | base64 -d 2>/dev/null | jq -r .exp 2>/dev/null || echo '?'))"
log "workspace: $WORKSPACE_ID"
log "cloud:     $CLOUD_URL"
log

TOKEN=""
for path in "tokens/workspace" "workspace-token" "token"; do
  log "=== POST $path ==="
  TMP=$(mktemp)
  set +e
  HTTP=$(curl -sS -o "$TMP" -w '%{http_code}' -X POST \
    -b "agent_relay_session=$SESSION" \
    -H 'content-type: application/json' \
    -d '{"name":"agentworkforce-cli"}' \
    "$CLOUD_URL/api/v1/workspaces/$WORKSPACE_ID/$path" 2>"$TMP.err")
  CURL_EXIT=$?
  set -e
  if [ "$CURL_EXIT" != "0" ]; then
    log "curl error ($CURL_EXIT): $(cat "$TMP.err" 2>/dev/null)"
    HTTP="000"
  fi
  rm -f "$TMP.err"
  BODY=$(cat "$TMP")
  rm -f "$TMP"

  log "HTTP $HTTP"
  # In non-export mode, mask anything that looks like a token in the response body
  if [ "$EXPORT_MODE" = "0" ]; then
    masked=$(echo "$BODY" | sed -E 's/("(token|accessToken|workspaceToken|refreshToken)"[[:space:]]*:[[:space:]]*")[^"]{8,}"/\1***REDACTED***"/g')
    echo "$masked" >&2
    echo >&2
  fi

  if [ "$HTTP" = "200" ] || [ "$HTTP" = "201" ]; then
    CANDIDATE=$(echo "$BODY" | jq -r '.token // .accessToken // .workspaceToken // empty' 2>/dev/null || true)
    if [ -n "$CANDIDATE" ] && [ "$CANDIDATE" != "null" ]; then
      TOKEN="$CANDIDATE"
      log "✓ token captured from /$path"
      break
    fi
  fi
done

if [ -z "$TOKEN" ]; then
  log
  log "✗ no endpoint returned a token. Fallback options:"
  log "  1. Mint a workspace token from the agentrelay.cloud web UI (Settings → API tokens),"
  log "     then: export WORKFORCE_WORKSPACE_TOKEN=<paste>"
  log "  2. Refresh AGENT_RELAY_SESSION if your cookie expired"
  log "  3. Check that the cloud routes accept session-cookie auth on POST token endpoints"
  exit 1
fi

# --- output --------------------------------------------------------------
if [ "$EXPORT_MODE" = "1" ]; then
  # Quoted exports for eval "$(./mint-workforce-token.sh --export)"
  printf 'export WORKFORCE_DEPLOY_CLOUD_URL=%q\n' "$CLOUD_URL"
  printf 'export WORKFORCE_WORKSPACE_ID=%q\n' "$WORKSPACE_ID"
  printf 'export WORKFORCE_WORKSPACE_TOKEN=%q\n' "$TOKEN"
else
  echo
  echo "==============================================="
  echo "Workforce workspace token minted."
  echo "==============================================="
  echo
  echo "To use it in this shell, re-run with --export:"
  echo
  echo "  eval \"\$($0 --export)\""
  echo
  echo "Or copy these by hand:"
  echo
  echo "  export WORKFORCE_DEPLOY_CLOUD_URL='$CLOUD_URL'"
  echo "  export WORKFORCE_WORKSPACE_ID='$WORKSPACE_ID'"
  echo "  export WORKFORCE_WORKSPACE_TOKEN='$TOKEN'"
  echo
  echo "Then verify:"
  echo "  agentworkforce deployments list"
fi
