/// <reference types="@cloudflare/workers-types" />
/**
 * Cloudflare Pages Function — Notion webhook receiver (bootstrap).
 *
 * Route: POST /api/notion-webhook
 *
 * Until M2 data triggers ship, this endpoint receives requests and
 * synthesizes relayfile.changed events for the notion-to-blog agent.
 * When the runtime handles this natively, this file gets deleted.
 *
 * Also accepts GET for manual trigger: GET /api/notion-webhook?page_id=<id>&secret=<s>
 */
import notionToBlog, { setEnv as setNotionToBlogEnv } from "../../agents/notion-to-blog/agent";
import { makeCloudflareContext, type CfEnv } from "../../agents/shared/runtime/cloudflare-context";
import type { AgentEvent } from "../../agents/shared/sdk";
import {
  NotionApiClient,
  serializePropertyMap,
  type NotionPage,
  type SerializedPropertyValue,
} from "@relayfile/adapter-notion";
import { Nango, type ProxyConfiguration } from "@nangohq/node";
import type { ConnectionProvider, ProxyRequest, ProxyResponse } from "@relayfile/sdk";

const PROVIDER_CONFIG_KEY = "notion-relay";

export const onRequestPost: PagesFunction<CfEnv> = async (ctx) => {
  const { request, env } = ctx;

  const presented = request.headers.get("x-cron-secret");
  if (!presented || !timingSafeEqual(presented, env.CRON_WEBHOOK_SECRET)) {
    return json({ ok: false, error: "unauthorized" }, 401);
  }

  const body = (await request.json()) as { page_id?: string };
  const pageId = body.page_id;
  if (!pageId) return json({ ok: false, error: "page_id required" }, 400);

  return dispatchForPage(env, pageId);
};

export const onRequestGet: PagesFunction<CfEnv> = async (ctx) => {
  const { request, env } = ctx;

  const url = new URL(request.url);
  const presented = url.searchParams.get("secret");
  if (!presented || !timingSafeEqual(presented, env.CRON_WEBHOOK_SECRET)) {
    return json({ ok: false, error: "unauthorized" }, 401);
  }

  const pageId = url.searchParams.get("page_id");
  if (!pageId) return json({ ok: false, error: "page_id query param required" }, 400);

  return dispatchForPage(env, pageId);
};

async function dispatchForPage(env: CfEnv, pageId: string): Promise<Response> {
  if (!env.NANGO_SECRET_KEY) return json({ ok: false, error: "NANGO_SECRET_KEY not set" }, 500);
  if (!env.NANGO_NOTION_CONNECTION_ID) return json({ ok: false, error: "NANGO_NOTION_CONNECTION_ID not set" }, 500);

  const client = buildNangoNotionClient(env);
  const page = await client.request<NotionPage>("GET", `/pages/${pageId}`);
  const props = serializePropertyMap(page.properties ?? {});

  setNotionToBlogEnv(env);

  const controller = new AbortController();
  const agentCtx = await makeCloudflareContext({
    env,
    agentId: "notion-to-blog",
    workspace: "proactive-agents",
    signal: controller.signal,
  });

  const occurredAt = new Date().toISOString();
  const event: AgentEvent<"relayfile.changed"> = {
    id: `notion-${pageId}-${occurredAt}`,
    workspace: "proactive-agents",
    type: "relayfile.changed",
    occurredAt,
    attempt: 1,
    resource: {
      path: `/notion/databases/drafts/pages/${pageId}`,
      kind: "page",
      id: pageId,
      provider: "notion",
    },
    summary: {
      title: propValue(props.Title),
      status: propValue(props.Status)?.toLowerCase(),
    },
    expand: async () => page,
  };

  try {
    await notionToBlog.definition.onEvent(agentCtx, event);
    return json({ ok: true, pageId, occurredAt });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[notion-to-blog] handler failed", err);
    if (notionToBlog.definition.onError) {
      try {
        await notionToBlog.definition.onError(agentCtx, err as Error, event);
      } catch (e) {
        console.error("[notion-to-blog] onError also failed", e);
      }
    }
    return json({ ok: false, error: message }, 500);
  }
}

function buildNangoNotionClient(env: CfEnv): NotionApiClient {
  const connectionId = env.NANGO_NOTION_CONNECTION_ID!;
  const nango = new Nango({
    secretKey: env.NANGO_SECRET_KEY!,
    host: env.NANGO_HOST ?? "https://api.nango.dev",
  });

  const provider: ConnectionProvider = {
    name: "notion",
    async proxy<T = unknown>(request: ProxyRequest): Promise<ProxyResponse<T>> {
      const config: ProxyConfiguration = {
        method: request.method,
        endpoint: request.endpoint,
        connectionId: request.connectionId,
        providerConfigKey: PROVIDER_CONFIG_KEY,
        ...(request.headers ? { headers: request.headers } : {}),
        ...(request.body === undefined ? {} : { data: request.body }),
        ...(request.query ? { params: request.query } : {}),
        ...(request.baseUrl ? { baseUrlOverride: request.baseUrl } : {}),
      };
      try {
        const response = await nango.proxy<T>(config);
        return {
          status: response.status,
          headers: normalizeHeaders(response.headers),
          data: response.data,
        };
      } catch (error) {
        const axiosErr = error as { response?: { status: number; headers: unknown; data: unknown } };
        if (axiosErr.response) {
          return {
            status: axiosErr.response.status,
            headers: normalizeHeaders(axiosErr.response.headers),
            data: axiosErr.response.data as T,
          };
        }
        throw error;
      }
    },
    async healthCheck(connId: string): Promise<boolean> {
      const response = await this.proxy({
        method: "GET",
        baseUrl: "https://api.notion.com",
        endpoint: "/v1/users/me",
        connectionId: connId,
        headers: { "Notion-Version": "2022-06-28" },
      });
      return response.status < 400;
    },
  };

  return new NotionApiClient(provider, { connectionId });
}

function propValue(prop: SerializedPropertyValue | undefined): string {
  if (!prop) return "";
  return prop.displayValue ?? String(prop.value ?? "");
}

function normalizeHeaders(headers: unknown): Record<string, string> {
  if (!headers || typeof headers !== "object") return {};
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(headers as Record<string, unknown>)) {
    if (typeof v === "string") out[k] = v;
  }
  return out;
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}
