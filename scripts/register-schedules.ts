/**
 * One-shot: register every time-triggered agent's cron with relaycron.
 * Idempotent — uses a stable schedule name; updates if it exists, creates
 * otherwise.
 *
 * Run from your laptop after wrangler-pages secrets are set:
 *
 *   RELAYCRON_API_KEY=ac_... CRON_WEBHOOK_SECRET=... \
 *     npx tsx scripts/register-schedules.ts
 *
 * The CRON_WEBHOOK_SECRET passed here MUST match the value set as the
 * Cloudflare Pages secret of the same name. Otherwise the function rejects
 * the delivery 401.
 */
import { AgentCron } from "@relaycron/sdk";

import weeklyDigest from "../agents/weekly-digest/agent";

const RELAYCRON_BASE = process.env.RELAYCRON_BASE_URL ?? "https://api.relaycron.dev";
const SITE_BASE = process.env.SITE_BASE_URL ?? "https://proactiveagents.dev";

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

async function main() {
  const apiKey = required("RELAYCRON_API_KEY");
  const webhookSecret = required("CRON_WEBHOOK_SECRET");

  const ac = new AgentCron({ apiKey, baseUrl: RELAYCRON_BASE });

  // List existing schedules so we can update by name rather than create dupes.
  const list = await ac.listSchedules({ limit: 100 });
  const byName = new Map(list.data.map((s) => [s.name, s]));

  for (const reg of REGISTRY) {
    const name = `proactive-agents/${reg.agentName}`;
    const url = `${SITE_BASE}/api/cron/${reg.agentName}`;

    const existing = byName.get(name);
    if (existing) {
      await ac.updateSchedule(existing.id, {
        cron_expression: reg.cron,
        timezone: reg.tz,
        transport: {
          type: "webhook",
          url,
          headers: { "X-Cron-Secret": webhookSecret },
          timeout_ms: 30000,
        },
        status: "active",
      });
      console.log(`updated  ${name}  ${reg.cron} ${reg.tz}  → ${url}`);
    } else {
      const created = await ac.createSchedule({
        name,
        description: `Auto-registered from agents/${reg.agentName}/agent.ts`,
        schedule_type: "cron",
        cron_expression: reg.cron,
        timezone: reg.tz,
        payload: { agent: reg.agentName },
        transport: {
          type: "webhook",
          url,
          headers: { "X-Cron-Secret": webhookSecret },
          timeout_ms: 30000,
        },
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
