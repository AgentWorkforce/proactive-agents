import fs from "node:fs/promises";
import path from "node:path";
import type { AgentEntry } from "@/lib/agent-log";

const LOG_PATH = path.join(process.cwd(), "content", "agent-log.json");

/**
 * Appends an entry to the public agent log. Idempotent on `id` — if an entry
 * with the same id is already present, it's replaced rather than duplicated.
 *
 * Designed to run from a Node-side handler (Cloudflare Worker, scheduled job,
 * webhook receiver). At deploy time, the static export bakes the log into the
 * /agent page; for live updates we'd swap this for an edge KV write.
 */
export async function writeLogEntry(
  entry: Omit<AgentEntry, "id" | "timestamp"> & {
    id?: string;
    timestamp?: string;
  }
): Promise<AgentEntry> {
  const full: AgentEntry = {
    id: entry.id ?? `${Date.now()}-${entry.agent}-${Math.random().toString(36).slice(2, 8)}`,
    timestamp: entry.timestamp ?? new Date().toISOString(),
    agent: entry.agent,
    trigger: entry.trigger,
    action: entry.action,
    summary: entry.summary,
    outcome: entry.outcome,
    links: entry.links,
    skippedReason: entry.skippedReason,
  };

  const existing = await readLog();
  const without = existing.filter((e) => e.id !== full.id);
  const next = [full, ...without];
  await fs.writeFile(LOG_PATH, JSON.stringify(next, null, 2) + "\n", "utf8");
  return full;
}

async function readLog(): Promise<AgentEntry[]> {
  try {
    const raw = await fs.readFile(LOG_PATH, "utf8");
    return JSON.parse(raw) as AgentEntry[];
  } catch {
    return [];
  }
}
