#!/usr/bin/env bash
set -uo pipefail

export LC_ALL=C
export LC_CTYPE=C
export LANG=C

MIN_CLI_VERSION="3.0.4"
PROD_URL="https://api.agentrelay.cloud"
LOG_DIR="${LOG_DIR:-/tmp/wf-e2e}"
PERSONA_FILE="$LOG_DIR/test-persona.json"
LAST_AGENT_FILE="${LAST_AGENT_FILE:-$HOME/.wf-e2e-last-agent-id}"
START_SECONDS="$(date +%s)"
TIME_BUDGET_SECONDS=300

AGENT_ID=""
PHASE0="N/A"
PHASE1="FAIL"
PHASE2="FAIL"
PHASE3="FAIL"
PHASE4="SKIPPED"
PHASE5="FAIL"
PHASE6="FAIL"
CLEANUP="NO_AGENT_CREATED"
OVERALL="FAIL"
ALIVE_HTTP="not-run"
TICKS_AFTER_HTTP="not-run"
SECOND_DESTROY_EXIT="not-run"
CANCELLED_SCHEDULES="unknown"
SCHEDULE_IDS_PRESENT="no"

capture_agent_id_from_deploy_log() {
  if [ -n "$AGENT_ID" ] || [ ! -f "$LOG_DIR/deploy.log" ]; then
    return 0
  fi

  AGENT_ID="$(grep -Eo 'agentId: [a-f0-9-]{36}' "$LOG_DIR/deploy.log" | awk '{print $2}' | tail -1)"
  if [ -n "$AGENT_ID" ]; then
    printf '%s\n' "$AGENT_ID" > "$LAST_AGENT_FILE"
    log "captured agentId from deploy log: $AGENT_ID"
    log "persisted agentId: $LAST_AGENT_FILE"
  fi
}

redact() {
  LC_ALL=C LANG=C perl -pe 'BEGIN { $t = $ENV{"WORKFORCE_WORKSPACE_TOKEN"} // "" } if (length $t) { s/\Q$t\E/relay_ws_***/g } s/relay_ws_[A-Za-z0-9._~+\/=-]+/relay_ws_***/g'
}

log() {
  printf '%s\n' "$*" | redact
}

fail() {
  log "FAIL: $*"
}

elapsed_seconds() {
  local now
  now="$(date +%s)"
  printf '%s' "$((now - START_SECONDS))"
}

check_time_budget() {
  local elapsed
  elapsed="$(elapsed_seconds)"
  if [ "$elapsed" -gt "$TIME_BUDGET_SECONDS" ]; then
    fail "time budget exceeded (${elapsed}s > ${TIME_BUDGET_SECONDS}s)"
    verdict
    exit 1
  fi
}

version_ge() {
  local actual="$1"
  local required="$2"
  local a_major a_minor a_patch r_major r_minor r_patch
  IFS=. read -r a_major a_minor a_patch <<EOF_VERSION_ACTUAL
$actual
EOF_VERSION_ACTUAL
  IFS=. read -r r_major r_minor r_patch <<EOF_VERSION_REQUIRED
$required
EOF_VERSION_REQUIRED
  a_major="${a_major:-0}"
  a_minor="${a_minor:-0}"
  a_patch="${a_patch:-0}"
  r_major="${r_major:-0}"
  r_minor="${r_minor:-0}"
  r_patch="${r_patch:-0}"

  [ "$a_major" -gt "$r_major" ] && return 0
  [ "$a_major" -lt "$r_major" ] && return 1
  [ "$a_minor" -gt "$r_minor" ] && return 0
  [ "$a_minor" -lt "$r_minor" ] && return 1
  [ "$a_patch" -ge "$r_patch" ]
}

run_logged() {
  local log_file="$1"
  local timeout_seconds="$2"
  shift 2

  mkdir -p "$LOG_DIR"
  /usr/bin/env LC_ALL=C LANG=C /usr/bin/perl -e 'alarm shift; exec @ARGV' "$timeout_seconds" "$@" 2>&1 | redact | tee "$log_file"
  local status="${PIPESTATUS[0]}"
  return "$status"
}

write_persona() {
  mkdir -p "$LOG_DIR"
  cat > "$PERSONA_FILE" <<'JSON'
{
  "id": "e2e-smoke-noop",
  "intent": "smoke-test",
  "tags": ["e2e-test"],
  "description": "No-op persona for end-to-end smoke; safe to deploy + destroy on prod. Has no integrations and a far-future cron so it never naturally fires during the test window.",
  "harness": "opencode",
  "model": "opencode/gpt-5-nano",
  "systemPrompt": "You are an e2e test no-op. Output the literal string 'E2E_SMOKE_OK' and exit.",
  "harnessSettings": { "reasoning": "low", "timeoutSeconds": 60 },
  "cloud": true,
  "integrations": {},
  "schedules": [
    {
      "name": "far-future-no-op",
      "cron": "0 0 1 1 *",
      "timezone": "UTC"
    }
  ]
}
JSON
}

require_command() {
  if ! command -v "$1" >/dev/null 2>&1; then
    fail "missing required command: $1"
    return 1
  fi
}

require_env() {
  if [ -z "${!1:-}" ]; then
    fail "missing required env var: $1"
    return 1
  fi
}

preflight() {
  require_command agentworkforce || return 1
  require_command gh || return 1
  require_command jq || return 1
  require_command curl || return 1

  require_env WORKFORCE_DEPLOY_CLOUD_URL || return 1
  require_env WORKFORCE_WORKSPACE_ID || return 1
  require_env WORKFORCE_WORKSPACE_TOKEN || return 1

  if [ "$WORKFORCE_DEPLOY_CLOUD_URL" != "$PROD_URL" ]; then
    fail "WORKFORCE_DEPLOY_CLOUD_URL must be $PROD_URL for this production E2E"
    return 1
  fi

  local raw_version cli_version
  raw_version="$(agentworkforce --version 2>&1 | redact)"
  cli_version="$(printf '%s\n' "$raw_version" | grep -Eo '[0-9]+\.[0-9]+\.[0-9]+' | head -1)"
  if [ -z "$cli_version" ] || ! version_ge "$cli_version" "$MIN_CLI_VERSION"; then
    fail "agentworkforce version must be >= $MIN_CLI_VERSION; got ${raw_version:-unknown}"
    return 1
  fi
  log "agentworkforce version: $cli_version"

  if ! agentworkforce help 2>&1 | grep -E '^[[:space:]]+destroy' >/dev/null; then
    fail "destroy missing from CLI help"
    return 1
  fi

  require_merged_pr AgentWorkforce/cloud 578 || return 1
  require_merged_pr AgentWorkforce/cloud 580 || return 1
  require_merged_pr AgentWorkforce/workforce 107 || return 1
  require_merged_pr AgentWorkforce/workforce 109 || return 1

  gh run list --repo AgentWorkforce/cloud --branch main --workflow Deploy --limit 1 --json status,conclusion,headSha,createdAt > "$LOG_DIR/cloud-deploy-latest.json" || return 1
  local latest_conclusion latest_sha main_sha
  latest_conclusion="$(jq -r '.[0].conclusion // ""' "$LOG_DIR/cloud-deploy-latest.json")"
  latest_sha="$(jq -r '.[0].headSha // ""' "$LOG_DIR/cloud-deploy-latest.json")"
  main_sha="$(gh api repos/AgentWorkforce/cloud/commits/main -q .sha)"
  if [ "$latest_conclusion" != "success" ]; then
    fail "latest AgentWorkforce/cloud Deploy on main did not succeed; conclusion=$latest_conclusion"
    return 1
  fi
  if [ "$latest_sha" != "$main_sha" ]; then
    fail "latest Deploy headSha does not match current main"
    log "deploy headSha: $latest_sha"
    log "main sha      : $main_sha"
    return 1
  fi

  PHASE1="PASS"
  return 0
}

require_merged_pr() {
  local repo="$1"
  local pr="$2"
  local out_file="$LOG_DIR/${repo//\//-}-${pr}.json"
  gh pr view "$pr" --repo "$repo" --json state,mergedAt > "$out_file" || return 1
  jq -e '.state == "MERGED" and (.mergedAt | length > 0)' "$out_file" >/dev/null || {
    fail "$repo#$pr is not merged"
    return 1
  }
}

preclean() {
  if [ -z "${PRIOR_AGENT_ID:-}" ]; then
    PHASE0="N/A"
    return 0
  fi

  log "Phase 0: pre-cleaning PRIOR_AGENT_ID=$PRIOR_AGENT_ID"
  if run_logged "$LOG_DIR/preclean.log" 45 agentworkforce destroy "$PRIOR_AGENT_ID" --workspace "$WORKFORCE_WORKSPACE_ID"; then
    PHASE0="PASS"
  else
    PHASE0="FAIL"
    log "Phase 0 pre-clean failed; continuing because destroy is idempotent and the new test has not started."
  fi
}

deploy_agent() {
  log "Phase 2: deploying no-op test persona"
  run_logged "$LOG_DIR/deploy.log" 90 agentworkforce deploy "$PERSONA_FILE" \
    --mode cloud \
    --workspace "$WORKFORCE_WORKSPACE_ID" \
    --harness-source plan \
    --no-prompt \
    --on-exists cancel
  local deploy_exit="$?"

  capture_agent_id_from_deploy_log

  if grep -E 'scheduleIds:|scheduleId:' "$LOG_DIR/deploy.log" >/dev/null 2>&1; then
    SCHEDULE_IDS_PRESENT="yes"
  fi

  if [ "$deploy_exit" -eq 0 ] && [ -n "$AGENT_ID" ]; then
    PHASE2="PASS"
    return 0
  fi

  fail "deploy failed or did not print an agentId; exit=$deploy_exit agentId=${AGENT_ID:-missing}"
  PHASE2="FAIL"
  return 1
}

interrupt_cleanup() {
  local signal="$1"
  trap - INT TERM
  fail "received $signal; attempting cleanup before exit"
  capture_agent_id_from_deploy_log
  if [ -n "$AGENT_ID" ] && [ "$CLEANUP" != "AGENT_DESTROYED" ]; then
    destroy_agent || true
    verify_tombstone || true
  fi
  verdict
  exit 130
}

check_alive() {
  log "Phase 3: checking active ticks endpoint with bogus token"
  ALIVE_HTTP="$(curl -sS -o "$LOG_DIR/ticks-401.json" -w "%{http_code}" \
    "$WORKFORCE_DEPLOY_CLOUD_URL/api/v1/workspaces/$WORKFORCE_WORKSPACE_ID/deployments/$AGENT_ID/ticks" \
    -X POST \
    -H "x-cloud-agent-deployment-token: bogus" \
    -H "content-type: application/json" \
    -d '{}')"
  log "ticks active HTTP: $ALIVE_HTTP"
  if [ "$ALIVE_HTTP" = "401" ]; then
    PHASE3="PASS"
  else
    PHASE3="FAIL"
  fi
}

salvage_delete() {
  log "CLI destroy failed; attempting one direct DELETE salvage."
  local delete_http
  delete_http="$(curl -sS -o "$LOG_DIR/direct-delete.json" -w "%{http_code}" \
    -X DELETE \
    "$WORKFORCE_DEPLOY_CLOUD_URL/api/v1/workspaces/$WORKFORCE_WORKSPACE_ID/deployments/$AGENT_ID" \
    -H "Authorization: Bearer $WORKFORCE_WORKSPACE_TOKEN")"
  log "direct DELETE HTTP: $delete_http"
  case "$delete_http" in
    200|202|204|404|409)
      PHASE5="PASS"
      CLEANUP="AGENT_DESTROYED"
      ;;
    *)
      PHASE5="FAIL"
      CLEANUP="AGENT_LEAKED"
      ;;
  esac
}

destroy_agent() {
  if [ -z "$AGENT_ID" ]; then
    log "Phase 5: no agentId captured; no destroy attempt possible."
    CLEANUP="NO_AGENT_CREATED"
    return 1
  fi

  log "Phase 5: destroying $AGENT_ID"
  if run_logged "$LOG_DIR/destroy.log" 60 agentworkforce destroy "$AGENT_ID" --workspace "$WORKFORCE_WORKSPACE_ID"; then
    PHASE5="PASS"
    CLEANUP="AGENT_DESTROYED"
  else
    salvage_delete
  fi

  CANCELLED_SCHEDULES="$(grep -Eo 'cancelledScheduleIds: \[[^]]*\]' "$LOG_DIR/destroy.log" 2>/dev/null | tail -1 | sed -E 's/.*\[([^]]*)\].*/\1/' | awk -F, '{ if ($0 == "") print 0; else print NF }')"
  CANCELLED_SCHEDULES="${CANCELLED_SCHEDULES:-unknown}"

  if [ "$CLEANUP" != "AGENT_DESTROYED" ]; then
    return 1
  fi
}

verify_tombstone() {
  if [ -z "$AGENT_ID" ]; then
    PHASE6="FAIL"
    return 1
  fi

  log "Phase 6a: verifying second destroy exit"
  run_logged "$LOG_DIR/second-destroy.log" 45 agentworkforce destroy "$AGENT_ID" --workspace "$WORKFORCE_WORKSPACE_ID"
  SECOND_DESTROY_EXIT="$?"
  log "second destroy exit: $SECOND_DESTROY_EXIT"

  log "Phase 6b: verifying ticks endpoint after destroy"
  TICKS_AFTER_HTTP="$(curl -sS -o "$LOG_DIR/ticks-after.json" -w "%{http_code}" \
    "$WORKFORCE_DEPLOY_CLOUD_URL/api/v1/workspaces/$WORKFORCE_WORKSPACE_ID/deployments/$AGENT_ID/ticks" \
    -X POST \
    -H "x-cloud-agent-deployment-token: any-value" \
    -H "content-type: application/json" \
    -d '{}')"
  log "ticks after HTTP: $TICKS_AFTER_HTTP"

  if [ "$SECOND_DESTROY_EXIT" = "2" ] && { [ "$TICKS_AFTER_HTTP" = "404" ] || [ "$TICKS_AFTER_HTTP" = "409" ]; }; then
    PHASE6="PASS"
  else
    PHASE6="FAIL"
  fi
}

verdict() {
  if [ "$PHASE1" = "PASS" ] &&
    [ "$PHASE2" = "PASS" ] &&
    [ "$PHASE3" = "PASS" ] &&
    [ "$PHASE5" = "PASS" ] &&
    [ "$PHASE6" = "PASS" ] &&
    [ "$CLEANUP" = "AGENT_DESTROYED" ]; then
    OVERALL="PASS"
  else
    OVERALL="FAIL"
  fi

  mkdir -p "$LOG_DIR"
  {
    printf '=== E2E result (PROD) ===\n'
    printf 'agentId          : %s (cleanup-safe captured in %s)\n' "${AGENT_ID:-missing}" "$LAST_AGENT_FILE"
    printf 'Phase 0 (pre-clean): %s\n' "$PHASE0"
    printf 'Phase 1 (preflight): %s\n' "$PHASE1"
    printf 'Phase 2 (deploy):    %s (scheduleIds present: %s)\n' "$PHASE2" "$SCHEDULE_IDS_PRESENT"
    printf 'Phase 3 (alive):     %s (401 received: %s; http=%s)\n' "$PHASE3" "$([ "$ALIVE_HTTP" = "401" ] && printf yes || printf no)" "$ALIVE_HTTP"
    printf 'Phase 4 (exercise):  %s (expected - prod, no synthetic trigger)\n' "$PHASE4"
    printf 'Phase 5 (destroy):   %s (cancelledSchedules=%s)\n' "$PHASE5" "$CANCELLED_SCHEDULES"
    printf 'Phase 6 (tombstone): %s (2nd-destroy-exit=2: %s, ticks-after=%s)\n' "$PHASE6" "$([ "$SECOND_DESTROY_EXIT" = "2" ] && printf yes || printf no)" "$TICKS_AFTER_HTTP"
    printf 'Cleanup invariant: %s\n' "$CLEANUP"
    printf 'Overall: %s\n' "$OVERALL"
  } | tee "$LOG_DIR/verdict.txt" | redact
}

main() {
  mkdir -p "$LOG_DIR"
  write_persona

  log "Phase 1: preflight"
  if ! preflight; then
    verdict
    exit 1
  fi
  check_time_budget

  preclean
  check_time_budget

  if ! deploy_agent; then
    if [ -n "$AGENT_ID" ]; then
      destroy_agent || true
      verify_tombstone || true
    fi
    verdict
    [ "$CLEANUP" = "AGENT_DESTROYED" ] || exit 1
    exit 1
  fi
  check_time_budget

  check_alive || true
  check_time_budget

  log "Phase 4: skipped in production"

  destroy_agent || true
  check_time_budget

  verify_tombstone || true
  verdict

  if [ "$OVERALL" = "PASS" ]; then
    exit 0
  fi

  if [ "$CLEANUP" = "AGENT_LEAKED" ]; then
    log "AGENT_LEAKED: manual production cleanup required for agentId=${AGENT_ID:-missing}"
  fi
  exit 1
}

trap 'interrupt_cleanup INT' INT
trap 'interrupt_cleanup TERM' TERM

main "$@"
