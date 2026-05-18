/// <reference types="@cloudflare/workers-types" />

/**
 * Agent-managed newsletter email endpoint.
 *
 * GET  /api/newsletter/emails              — list emails
 * GET  /api/newsletter/emails?id=<id>      — get single email
 * POST /api/newsletter/emails              — create or send email
 *   { action: "create", subject, body, status?, email_type? }
 *   { action: "send", id }
 *
 * Auth: x-cron-secret header must match CRON_WEBHOOK_SECRET.
 */

import type { CfEnv } from "../../../agents/shared/runtime/cloudflare-context";

type NewsletterEnv = CfEnv & { BUTTONDOWN_API_KEY: string };

const BUTTONDOWN_API = "https://api.buttondown.com/v1";

export const onRequestGet: PagesFunction<NewsletterEnv> = async (ctx) => {
  const { request, env } = ctx;
  if (!authorize(request, env)) return json({ ok: false, error: "unauthorized" }, 401);
  if (!env.BUTTONDOWN_API_KEY) return json({ ok: false, error: "BUTTONDOWN_API_KEY not set" }, 500);

  const url = new URL(request.url);
  const id = url.searchParams.get("id");
  const endpoint = id ? `${BUTTONDOWN_API}/emails/${id}` : `${BUTTONDOWN_API}/emails`;

  const res = await fetch(endpoint, {
    headers: { Authorization: `Token ${env.BUTTONDOWN_API_KEY}` },
  });

  const data = await res.json();
  return json({ ok: res.ok, data }, res.ok ? 200 : res.status);
};

export const onRequestPost: PagesFunction<NewsletterEnv> = async (ctx) => {
  const { request, env } = ctx;
  if (!authorize(request, env)) return json({ ok: false, error: "unauthorized" }, 401);
  if (!env.BUTTONDOWN_API_KEY) return json({ ok: false, error: "BUTTONDOWN_API_KEY not set" }, 500);

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return json({ ok: false, error: "Invalid JSON" }, 400);
  }

  const action = body.action as string;

  if (action === "create") {
    const subject = body.subject as string;
    const emailBody = body.body as string;
    if (!subject || !emailBody) {
      return json({ ok: false, error: "subject and body are required" }, 400);
    }

    const res = await fetch(`${BUTTONDOWN_API}/emails`, {
      method: "POST",
      headers: {
        Authorization: `Token ${env.BUTTONDOWN_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        subject,
        body: emailBody,
        status: (body.status as string) ?? "draft",
        email_type: (body.email_type as string) ?? "public",
      }),
    });

    const data = await res.json();
    return json({ ok: res.ok, data }, res.ok ? 201 : res.status);
  }

  if (action === "send") {
    const id = body.id as string;
    if (!id) return json({ ok: false, error: "id is required to send" }, 400);

    const res = await fetch(`${BUTTONDOWN_API}/emails/${id}`, {
      method: "PATCH",
      headers: {
        Authorization: `Token ${env.BUTTONDOWN_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ status: "about_to_send" }),
    });

    const data = await res.json();
    return json({ ok: res.ok, data }, res.ok ? 200 : res.status);
  }

  return json({ ok: false, error: 'action must be "create" or "send"' }, 400);
};

function authorize(request: Request, env: NewsletterEnv): boolean {
  const secret = request.headers.get("x-cron-secret");
  if (!secret || !env.CRON_WEBHOOK_SECRET) return false;
  return timingSafeEqual(secret, env.CRON_WEBHOOK_SECRET);
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
