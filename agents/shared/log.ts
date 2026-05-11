/**
 * Append an entry to the public agent log via the spec Context.
 *
 * The log file is a JSON array at /_meta/agent-log.json in workspace VFS.
 * Each runtime impl decides what that path means:
 *   - Cloudflare runtime → committed to content/agent-log.json on GitHub
 *   - Node/local dev     → written to ./content/agent-log.json on disk
 *
 * Agent code calls this via `await writeLogEntry(ctx, {...})` and stays
 * runtime-agnostic.
 */
import type { Context } from "./sdk";
import type { AgentEntry } from "@/lib/agent-log";

const LOG_VFS_PATH = "/_meta/agent-log.json";

export type LogInput = Omit<AgentEntry, "id" | "timestamp"> & {
  id?: string;
  timestamp?: string;
};

export async function writeLogEntry(ctx: Context, input: LogInput): Promise<AgentEntry> {
  const entry: AgentEntry = {
    id: input.id ?? `${Date.now()}-${input.agent}-${Math.random().toString(36).slice(2, 8)}`,
    timestamp: input.timestamp ?? new Date().toISOString(),
    agent: input.agent,
    trigger: input.trigger,
    action: input.action,
    summary: input.summary,
    outcome: input.outcome,
    links: input.links,
    skippedReason: input.skippedReason,
  };

  const file = await ctx.files.read(LOG_VFS_PATH);
  const existing = (file?.body as AgentEntry[] | undefined) ?? [];
  const without = existing.filter((e) => e.id !== entry.id);
  const next = [entry, ...without];

  await ctx.files.write(LOG_VFS_PATH, next, {
    message: `[${entry.agent}] ${entry.action}`,
  });

  return entry;
}
