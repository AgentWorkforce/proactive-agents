/**
 * Static schedule metadata for every time-triggered agent.
 *
 * Keeping this in a leaf module (no other imports) means the
 * register-schedules script can load it without dragging in the agent
 * code (which transitively imports Octokit/etc. and fights with tsx's
 * ESM resolver).
 *
 * When you add a new time-triggered agent, append its row here and
 * re-run `npx tsx scripts/register-schedules.ts`.
 */

export type AgentSchedule = {
  agentName: string;
  cron: string;
  tz: string;
};

export const SCHEDULES: AgentSchedule[] = [
  {
    agentName: "weekly-digest",
    cron: "0 9 * * 6",
    tz: "UTC",
  },
];
