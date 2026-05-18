/// <reference types="@cloudflare/workers-types" />

import type { CfEnv } from "../../../agents/shared/runtime/cloudflare-context";

type NewsletterEnv = CfEnv & { BUTTONDOWN_API_KEY: string };

const BUTTONDOWN_API = "https://api.buttondown.com/v1";

export const onRequestPost: PagesFunction<NewsletterEnv> = async (ctx) => {
  const { request, env } = ctx;

  if (!env.BUTTONDOWN_API_KEY) {
    return json({ ok: false, error: "Newsletter not configured" }, 500);
  }

  let body: { email?: string; hp?: string };
  try {
    body = (await request.json()) as { email?: string; hp?: string };
  } catch {
    return json({ ok: false, error: "Invalid request" }, 400);
  }

  if (body.hp) return json({ ok: false, error: "Invalid request" }, 400);

  const email = body.email?.trim().toLowerCase();
  if (!email || !isValidEmail(email)) {
    return json({ ok: false, error: "A valid email is required." }, 400);
  }

  const res = await fetch(`${BUTTONDOWN_API}/subscribers`, {
    method: "POST",
    headers: {
      Authorization: `Token ${env.BUTTONDOWN_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, type: "regular" }),
  });

  if (res.ok) {
    return json({ ok: true, message: "Check your inbox to confirm your subscription." });
  }

  const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  const errorMessages = extractErrors(data);

  if (res.status === 400 && errorMessages.some((m) => m.includes("already"))) {
    return json({ ok: true, message: "You're already subscribed!" });
  }

  console.error("[newsletter/subscribe] Buttondown error", res.status, data);
  return json({ ok: false, error: "Could not subscribe. Please try again." }, 502);
};

export const onRequestOptions: PagesFunction = async () => {
  return new Response(null, {
    status: 204,
    headers: corsHeaders(),
  });
};

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function extractErrors(data: Record<string, unknown>): string[] {
  const messages: string[] = [];
  for (const val of Object.values(data)) {
    if (typeof val === "string") messages.push(val.toLowerCase());
    if (Array.isArray(val)) {
      for (const item of val) {
        if (typeof item === "string") messages.push(item.toLowerCase());
      }
    }
  }
  return messages;
}

function corsHeaders(): Record<string, string> {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders() },
  });
}
