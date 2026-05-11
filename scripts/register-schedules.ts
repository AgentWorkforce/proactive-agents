/**
 * One-shot: register every time-triggered agent's cron with relaycron.
 * Idempotent — looks up by stable schedule name; updates if it exists,
 * creates otherwise.
 *
 * Run from your laptop after the Pages secrets are set:
 *
 *   RELAYCRON_API_KEY=ac_... CRON_WEBHOOK_SECRET=... \
 *     npx tsx scripts/register-schedules.ts
 *
 * The CRON_WEBHOOK_SECRET passed here MUST match the value set as the
 * Cloudflare Pages secret of the same name. Otherwise the function rejects
 * the delivery 401.
 *
 * We use plain fetch instead of @relaycron/sdk to dodge ESM/CJS resolution
 * drama; the API surface is small enough to inline.
 */
import weeklyDigest from "../agents/weekly-digest/agent";

const RELAYCRON_BASE = process.env.RELAYCRON_BASE_URL ?? "https://api.relaycron.dev";
const SITE_BASE = process.env.SITE_BASE_URL ?? "https://proactiveagents.dev";

type Schedule = {
  id: string;
  name: string;
  cron_expression?: string;
  timezone?: string;
};

type RegisterableSchedule = {
  agentName: string;
  cron: string;
  tz: string;
};

const REGISTRY: RegisterableSchedule[] = [
  {
    agentName: "weekly-digest",
    cron: extractCron(weeklyDigest.definition.schedule)!,
    tz: extractTz(weeklyDigest.definition.schedule) ?? "UTC",
  },
];

function extractCron(s: unknown): string | null {
  if (typeof s === "string") return s;
  if (s && typeof s === "object" && "cron" in s) return (s as { cron: string }).cron;
  return null;
}

function extractTz(s: unknown): string | null {
  if (s && typeof s === "object" && "tz" in s) return (s as { tz?: string }).tz ?? null;
  return null;
}

async function api<T>(method: string, path: string, body?: unknown): Promise<T> {
  const apiKey = required("RELAYCRON_API_KEY");
  const res = await fetch(`${RELAYCRON_BASE}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = (await res.json()) as
    | { ok: true; data: T }
    | { ok: false; error: { code: string; message: string } };
  if (!json.ok) {
    throw new Error(`relaycron ${res.status} ${json.error.code}: ${json.error.message}`);
  }
  return json.data;
}

async function listAllSchedules(): Promise<Schedule[]> {
  const out: Schedule[] = [];
  let cursor: string | undefined;
  do {
    const qs = cursor ? `?cursor=${encodeURIComponent(cursor)}&limit=100` : "?limit=100";
    const page = (await api<Schedule[]>("GET", `/v1/schedules${qs}`)) as Schedule[] & {
      cursor?: string | null;
    };
    out.push(...page);
    cursor = (page as unknown as { cursor?: string | null }).cursor ?? undefined;
  } while (cursor);
  return out;
}

async function main() {
  required("RELAYCRON_API_KEY");
  const webhookSecret = required("CRON_WEBHOOK_SECRET");

  const existing = await listAllSchedules();
  const byName = new Map(existing.map((s) => [s.name, s]));

  for (const reg of REGISTRY) {
    const name = `proactive-agents/${reg.agentName}`;
    const url = `${SITE_BASE}/api/cron/${reg.agentName}`;

    const transport = {
      type: "webhook" as const,
      url,
      headers: { "X-Cron-Secret": webhookSecret },
      timeout_ms: 30000,
    };

    const prior = byName.get(name);
    if (prior) {
      await api("PATCH", `/v1/schedules/${prior.id}`, {
        cron_expression: reg.cron,
        timezone: reg.tz,
        transport,
        status: "active",
      });
      console.log(`updated  ${name}  ${reg.cron} ${reg.tz}  → ${url}`);
    } else {
      const created = await api<Schedule>("POST", "/v1/schedules", {
        name,
        description: `Auto-registered from agents/${reg.agentName}/agent.ts`,
        schedule_type: "cron",
        cron_expression: reg.cron,
        timezone: reg.tz,
        payload: { agent: reg.agentName },
        transport,
      });
      console.log(`created  ${name}  ${reg.cron} ${reg.tz}  → ${url}  (id ${created.id})`);
    }
  }

  console.log("\ndone.");
}

function required(name: string): string {
  const v = process.env[name];
  if (!v) {
    console.error(`missing required env var: ${name}`);
    process.exit(1);
  }
  return v;
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
