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
 * This HTTP entry point stays even though `@agent-relay/agent` has shipped:
 * these agents run on Cloudflare Pages Functions (request-scoped Workers),
 * which can't hold the SDK's long-lived broker connection, so we dispatch by
 * calling `handle.definition.onEvent` directly. The event itself is built with
 * the real SDK constructor (`createCronTickEvent`).
 */
import { createCronTickEvent } from "@agent-relay/events";
import weeklyDigest, { setEnv as setWeeklyDigestEnv } from "../../../agents/weekly-digest/agent";
import notionToBlog, { setEnv as setNotionToBlogEnv } from "../../../agents/notion-to-blog/agent";
import newsletterDrafter, { setEnv as setNewsletterDrafterEnv } from "../../../agents/newsletter-drafter/agent";
import { makeCloudflareContext, type CfEnv } from "../../../agents/shared/runtime/cloudflare-context";
import type { AgentHandleWithDef } from "../../../agents/shared/sdk";

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
  "notion-to-blog": {
    handle: notionToBlog,
    setEnv: setNotionToBlogEnv,
    workspace: "proactive-agents",
  },
  "newsletter-drafter": {
    handle: newsletterDrafter,
    setEnv: setNewsletterDrafterEnv,
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
  const event = createCronTickEvent({
    workspace: entry.workspace,
    schedule: agentName,
    id: `cron-${occurredAt}-${agentName}`,
    occurredAt,
    summary: { title: `${agentName} cron tick` },
  });

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
