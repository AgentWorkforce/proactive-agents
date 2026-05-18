/// <reference types="@cloudflare/workers-types" />

/**
 * Agent-managed subscriber endpoint.
 *
 * GET    /api/newsletter/subscribers                — list subscribers
 * GET    /api/newsletter/subscribers?id=<id>        — get single subscriber
 * DELETE /api/newsletter/subscribers?id=<id>        — remove subscriber
 * PATCH  /api/newsletter/subscribers?id=<id>        — update subscriber (tags, notes, metadata)
 *
 * Auth: x-cron-secret header must match CRON_WEBHOOK_SECRET.
 */

import type { CfEnv } from "../../../agents/shared/runtime/cloudflare-context";
import { verifyCronSecret } from "../../shared/auth";

type NewsletterEnv = CfEnv & { BUTTONDOWN_API_KEY: string };

const BUTTONDOWN_API = "https://api.buttondown.com/v1";

export const onRequestGet: PagesFunction<NewsletterEnv> = async (ctx) => {
  const { request, env } = ctx;
  if (!(await verifyCronSecret(request, env.CRON_WEBHOOK_SECRET))) {
    return json({ ok: false, error: "unauthorized" }, 401);
  }
  if (!env.BUTTONDOWN_API_KEY) return json({ ok: false, error: "BUTTONDOWN_API_KEY not set" }, 500);

  const url = new URL(request.url);
  const id = url.searchParams.get("id");

  const endpoint = id
    ? `${BUTTONDOWN_API}/subscribers/${id}`
    : `${BUTTONDOWN_API}/subscribers${url.search}`;

  const res = await fetch(endpoint, {
    headers: { Authorization: `Token ${env.BUTTONDOWN_API_KEY}` },
  });

  const data = await res.json();
  return json({ ok: res.ok, data }, res.ok ? 200 : res.status);
};

export const onRequestDelete: PagesFunction<NewsletterEnv> = async (ctx) => {
  const { request, env } = ctx;
  if (!(await verifyCronSecret(request, env.CRON_WEBHOOK_SECRET))) {
    return json({ ok: false, error: "unauthorized" }, 401);
  }
  if (!env.BUTTONDOWN_API_KEY) return json({ ok: false, error: "BUTTONDOWN_API_KEY not set" }, 500);

  const url = new URL(request.url);
  const id = url.searchParams.get("id");
  if (!id) return json({ ok: false, error: "id query param required" }, 400);

  const res = await fetch(`${BUTTONDOWN_API}/subscribers/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Token ${env.BUTTONDOWN_API_KEY}` },
  });

  if (res.status === 204) return json({ ok: true });
  const data = await res.json().catch(() => ({}));
  return json({ ok: false, data }, res.status);
};

export const onRequestPatch: PagesFunction<NewsletterEnv> = async (ctx) => {
  const { request, env } = ctx;
  if (!(await verifyCronSecret(request, env.CRON_WEBHOOK_SECRET))) {
    return json({ ok: false, error: "unauthorized" }, 401);
  }
  if (!env.BUTTONDOWN_API_KEY) return json({ ok: false, error: "BUTTONDOWN_API_KEY not set" }, 500);

  const url = new URL(request.url);
  const id = url.searchParams.get("id");
  if (!id) return json({ ok: false, error: "id query param required" }, 400);

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return json({ ok: false, error: "Invalid JSON" }, 400);
  }

  const res = await fetch(`${BUTTONDOWN_API}/subscribers/${id}`, {
    method: "PATCH",
    headers: {
      Authorization: `Token ${env.BUTTONDOWN_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const data = await res.json();
  return json({ ok: res.ok, data }, res.ok ? 200 : res.status);
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
