/// <reference types="@cloudflare/workers-types" />
/**
 * Cloudflare Pages Function — webhook receiver for relaycron.
 *
 * Route: POST /api/cron/:agent
 *
 * relaycron POSTs here when a schedule fires. We verify the shared secret,
 * look up the named agent, build a real Context, and invoke its `onEvent`
 * with a synthesised cron.tick event.
 *
 * When @agent-relay/agent ships, the runtime dispatches events directly
 * without going through HTTP and this whole file disappears.
 */
import weeklyDigest, { setEnv as setWeeklyDigestEnv } from "../../../agents/weekly-digest/agent";
import { makeCloudflareContext, type CfEnv } from "../../../agents/shared/runtime/cloudflare-context";
import type { AgentEvent, AgentHandleWithDef } from "../../../agents/shared/sdk";

type Params = { agent: string };

const REGISTRY: Record<
  string,
  { handle: AgentHandleWithDef; setEnv: (env: CfEnv) => void; workspace: string }
> = {
  "weekly-digest": {
    handle: weeklyDigest,
    setEnv: setWeeklyDigestEnv,
    workspace: "proactive-agents",
  },
};

export const onRequestPost: PagesFunction<CfEnv, "agent"> = async (ctx) => {
  const { request, env, params } = ctx;
  const agentName = (params as Params).agent;

  // Shared-secret check. relaycron sends X-Cron-Secret on every delivery.
  const presented = request.headers.get("x-cron-secret");
  if (!presented || !timingSafeEqual(presented, env.CRON_WEBHOOK_SECRET)) {
    return json({ ok: false, error: "unauthorized" }, 401);
  }

  const entry = REGISTRY[agentName];
  if (!entry) {
    return json({ ok: false, error: `unknown agent "${agentName}"` }, 404);
  }

  // Inject env so the agent's helpers (Brave, OpenRouter, Octokit) can read it.
  entry.setEnv(env);

  const controller = new AbortController();
  const agentCtx = await makeCloudflareContext({
    env,
    agentId: agentName,
    workspace: entry.workspace,
    signal: controller.signal,
  });

  const occurredAt = new Date().toISOString();
  const event: AgentEvent<"cron.tick"> = {
    id: `cron-${occurredAt}-${agentName}`,
    workspace: entry.workspace,
    type: "cron.tick",
    occurredAt,
    attempt: 1,
    resource: {
      path: `/_internal/cron/${agentName}`,
      kind: "cron.tick",
      id: agentName,
      provider: "internal",
    },
    summary: { title: `${agentName} cron tick` },
    expand: async () => ({}),
  };

  try {
    await entry.handle.definition.onEvent(agentCtx, event);
    return json({ ok: true, agent: agentName, occurredAt });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[${agentName}] handler failed`, err);
    // Still attempt onError if the agent supplied one.
    if (entry.handle.definition.onError) {
      try {
        await entry.handle.definition.onError(agentCtx, err as Error, event);
      } catch (e) {
        console.error(`[${agentName}] onError also failed`, e);
      }
    }
    return json({ ok: false, error: message }, 500);
  }
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

/** Constant-time string compare to avoid timing leaks on the secret. */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}
