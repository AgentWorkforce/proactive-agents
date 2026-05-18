/**
 * List all relaycron schedules for this project.
 *
 *   RELAYCRON_API_KEY=ac_... npx tsx scripts/list-schedules.ts
 */

const RELAYCRON_BASE = process.env.RELAYCRON_BASE_URL ?? "https://api.relaycron.dev";

type Schedule = {
  id: string;
  name: string;
  cron_expression: string;
  timezone: string;
  status: string;
  transport?: { url?: string };
  created_at?: string;
  updated_at?: string;
};

async function main() {
  const apiKey = process.env.RELAYCRON_API_KEY;
  if (!apiKey) {
    console.error("missing RELAYCRON_API_KEY");
    process.exit(1);
  }

  const schedules: Schedule[] = [];
  let cursor: string | undefined;

  do {
    const qs = cursor ? `?cursor=${encodeURIComponent(cursor)}&limit=100` : "?limit=100";
    const res = await fetch(`${RELAYCRON_BASE}/v1/schedules${qs}`, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    const json = (await res.json()) as { ok: boolean; data: Schedule[]; cursor?: string | null };
    if (!json.ok) {
      console.error("API error:", json);
      process.exit(1);
    }
    schedules.push(...json.data);
    cursor = json.cursor ?? undefined;
  } while (cursor);

  if (schedules.length === 0) {
    console.log("No schedules found.");
    return;
  }

  console.log(`\n${schedules.length} schedule(s):\n`);
  for (const s of schedules) {
    const url = s.transport?.url ?? "—";
    console.log(`  ${s.name}`);
    console.log(`    id:     ${s.id}`);
    console.log(`    cron:   ${s.cron_expression} (${s.timezone})`);
    console.log(`    status: ${s.status}`);
    console.log(`    url:    ${url}`);
    if (s.updated_at) console.log(`    updated: ${s.updated_at}`);
    console.log();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
