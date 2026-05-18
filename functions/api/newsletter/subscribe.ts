/// <reference types="@cloudflare/workers-types" />

import type { CfEnv } from "../../../agents/shared/runtime/cloudflare-context";

type NewsletterEnv = CfEnv & { BUTTONDOWN_API_KEY: string };

const BUTTONDOWN_API = "https://api.buttondown.com/v1";

export const onRequestPost: PagesFunction<NewsletterEnv> = async (ctx) => {
  const { request, env } = ctx;

  if (!env.BUTTONDOWN_API_KEY) {
    return json({ ok: false, error: "Newsletter not configured" }, 500);
  }

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return json({ ok: false, error: "Invalid request" }, 400);
  }

  if (typeof raw !== "object" || raw === null) {
    return json({ ok: false, error: "Invalid request" }, 400);
  }

  const body = raw as Record<string, unknown>;
  if (body.hp) return json({ ok: false, error: "Invalid request" }, 400);

  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  if (!email || !isValidEmail(email)) {
    return json({ ok: false, error: "A valid email is required." }, 400);
  }

  let res: Response;
  try {
    res = await fetch(`${BUTTONDOWN_API}/subscribers`, {
      method: "POST",
      headers: {
        Authorization: `Token ${env.BUTTONDOWN_API_KEY}`,
        "Content-Type": "application/json",
      },
      // Omit `type` so Buttondown uses its default double opt-in flow:
      // the subscriber is created `unactivated` and sent a confirmation
      // email, becoming active only after they click the confirm link.
      body: JSON.stringify({ email_address: email }),
      signal: AbortSignal.timeout(10_000),
    });
  } catch (err) {
    console.error("[newsletter/subscribe] Buttondown request failed", err);
    return json({ ok: false, error: "Could not subscribe. Please try again." }, 503);
  }

  if (res.ok) {
    return json({ ok: true, message: "Check your inbox to confirm your subscription." });
  }

  const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  const errorMessages = extractErrors(data);

  if (errorMessages.some((m) => m.includes("already") || m.includes("exists"))) {
    return json({ ok: true, message: "You're already subscribed!" });
  }

  // A blocked or invalid address is a client-side condition, not an upstream
  // outage. Return 400 so Cloudflare doesn't replace it with its 502 page.
  if (
    res.status === 400 &&
    errorMessages.some((m) => m.includes("blocked") || m.includes("invalid"))
  ) {
    return json({ ok: false, error: "That email address can't be subscribed." }, 400);
  }

  console.error("[newsletter/subscribe] Buttondown error", res.status, JSON.stringify(data));
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

// Buttondown's API returns errors in several shapes: a flat
// { field: ["msg"] }, a top-level { detail: "msg", code: "..." }, or a
// nested { detail: [{ code, detail, metadata }] }. Walk all of them.
function extractErrors(value: unknown): string[] {
  const messages: string[] = [];
  const visit = (v: unknown) => {
    if (typeof v === "string") {
      messages.push(v.toLowerCase());
    } else if (Array.isArray(v)) {
      for (const item of v) visit(item);
    } else if (v && typeof v === "object") {
      for (const item of Object.values(v as Record<string, unknown>)) visit(item);
    }
  };
  visit(value);
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
