# deploy-v1 production E2E runbook

This runbook validates the AgentWorkforce `deploy-v1` create -> verify -> destroy path against production cloud. It runs for real, so the only acceptable end state is a destroyed test deployment.

## Educational objective

The objective is to prove that production can create a cloud deployment, register its cron schedule, reject invalid tick tokens while active, destroy the deployment, cancel its schedule, and reject later ticks as inactive or missing.

The target learner is an operator or release engineer who understands the CLI and GitHub Actions, but needs a safe, repeatable production smoke test. The user intent is operational validation, not feature exploration.

## Production-specific risks

Production differs from staging in five important ways.

1. Real schedule registration means real cron firings can happen if the test crosses an active scheduled tick.
2. The production `weekly-digest` persona can create real GitHub issues if its repo defaults are not overridden.
3. Real SST-backed resources are consumed, including the Durable Object deployment record and a cron queue entry.
4. Cleanup is mandatory because an active orphaned deployment can fire every Monday until manually torn down.
5. There is no staging safety net; if destroy is broken, the recovery path may require direct production cleanup.

## Safety strategy

Use a dedicated no-op persona with empty integrations and a Jan. 1-only cron schedule. Do not deploy the production `weekly-digest` persona. Do not synthesize a production tick. Capture the `agentId` immediately after deployment and persist it to `~/.wf-e2e-last-agent-id` before any verification step. Always attempt destroy when an `agentId` exists, even if earlier phases fail.

The checked-in helper script implements these guardrails:

```bash
scripts/prod-deploy-v1-e2e.sh
```

## Required environment

Set production credentials in the shell that runs the script. Do not paste tokens into command lines that will be saved in shell history.

```bash
export WORKFORCE_DEPLOY_CLOUD_URL=https://api.agentrelay.cloud
export WORKFORCE_WORKSPACE_ID=<prod-workspace-id>
export WORKFORCE_WORKSPACE_TOKEN=<prod-workspace-token>
```

The script refuses to run unless `WORKFORCE_DEPLOY_CLOUD_URL` is exactly `https://api.agentrelay.cloud`.

Optional pre-clean:

```bash
export PRIOR_AGENT_ID=<previous-test-agent-id>
```

If `PRIOR_AGENT_ID` is set, the script attempts to destroy it before creating a new deployment.

## Preconditions

Before touching production, the script verifies:

1. `agentworkforce --version` is `3.0.4` or newer.
2. `agentworkforce help` exposes the `destroy` command.
3. `gh`, `jq`, and `curl` are available.
4. `AgentWorkforce/cloud#578` is merged.
5. `AgentWorkforce/cloud#580` is merged.
6. `AgentWorkforce/workforce#107` is merged.
7. `AgentWorkforce/workforce#109` is merged.
8. The latest `AgentWorkforce/cloud` `Deploy` workflow on `main` succeeded for current `main`.

If any precondition fails, the script exits before creating a deployment.
In that preflight-only failure mode the cleanup invariant is `NO_AGENT_CREATED`, not `AGENT_LEAKED`.

## Test persona

The script writes this temporary persona to `/tmp/wf-e2e/test-persona.json`:

```json
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
```

## Phases

### Phase 0: pre-clean

If `PRIOR_AGENT_ID` is set, destroy that deployment using the configured production workspace. This phase is best-effort and idempotent.

### Phase 1: preflight

Verify the CLI, `destroy` support, dependencies, merged PRs, and successful production cloud deploy.

### Phase 2: deploy

Create the no-op deployment with the production workspace explicit and the managed plan credential path selected:

```bash
agentworkforce deploy /tmp/wf-e2e/test-persona.json \
  --mode cloud \
  --workspace "$WORKFORCE_WORKSPACE_ID" \
  --harness-source plan \
  --no-prompt \
  --on-exists cancel
```

Expected result: exit `0`, an `agentId`, and one schedule ID. The `agentId` is immediately written to `~/.wf-e2e-last-agent-id`.

If deploy fails but an `agentId` was printed, the script proceeds to cleanup and marks the overall result as failed. If deploy fails without an `agentId`, there is no deployment to destroy and the script stops.

### Phase 3: active deployment check

POST to the deployment ticks endpoint with a bogus deployment token:

```bash
curl -X POST "$WORKFORCE_DEPLOY_CLOUD_URL/api/v1/workspaces/$WORKFORCE_WORKSPACE_ID/deployments/$AGENT_ID/ticks" \
  -H "x-cloud-agent-deployment-token: bogus" \
  -H "content-type: application/json" \
  -d "{}"
```

Expected result: HTTP `401`. A `404` means the deployment did not persist correctly. Regardless of this phase result, the script proceeds to destroy.

### Phase 4: exercise

Skipped in production. The no-op persona uses a Jan. 1-only cron and the script does not synthetic-trigger production deployments.

### Phase 5: destroy

Destroy the deployment:

```bash
agentworkforce destroy "$AGENT_ID" --workspace "$WORKFORCE_WORKSPACE_ID"
```

Expected result: exit `0`, output containing `destroyed: <agentId>`, and a cancelled schedule list.

If the CLI destroy fails, the script attempts a single direct production DELETE using `WORKFORCE_WORKSPACE_TOKEN`. If that also fails, the verdict is `AGENT_LEAKED` and includes the leaked `agentId`.

### Phase 6: tombstone verification

Run destroy a second time. Expected result: exit `2`.

Then POST to the ticks endpoint again with any deployment token. Expected result: HTTP `404` or `409`. HTTP `401` after destroy means the deployment still appears active.

### Phase 7: verdict

The script prints and writes `/tmp/wf-e2e/verdict.txt`:

```text
=== E2E result (PROD) ===
agentId          : <uuid> (cleanup-safe captured in ~/.wf-e2e-last-agent-id)
Phase 0 (pre-clean): PASS|N/A|FAIL
Phase 1 (preflight): PASS|FAIL
Phase 2 (deploy):    PASS|FAIL
Phase 3 (alive):     PASS|FAIL
Phase 4 (exercise):  SKIPPED (expected - prod, no synthetic trigger)
Phase 5 (destroy):   PASS|FAIL
Phase 6 (tombstone): PASS|FAIL
Cleanup invariant: AGENT_DESTROYED|AGENT_LEAKED|NO_AGENT_CREATED
Overall: PASS|FAIL
```

## Hard constraints

- Never echo `WORKFORCE_WORKSPACE_TOKEN`; logs redact matching token values and `relay_ws_*` strings as `relay_ws_***`.
- Never use the real `weekly-digest` persona.
- Never use `--mode dev` or `--mode sandbox`.
- Always use `--harness-source plan`; this smoke test is validating production managed credentials, not a customer OAuth or BYOK setup.
- Never skip destroy when an `agentId` exists.
- If interrupted after an `agentId` is captured, attempt cleanup before exiting.
- Never retry destroy in a loop. Use one CLI destroy attempt and one direct DELETE salvage attempt.
- Keep total wall time under five minutes.
- Treat `NO_AGENT_CREATED` as valid only when preflight or deploy failed before any `agentId` was captured.
