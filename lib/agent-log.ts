import fs from "node:fs/promises";
import path from "node:path";

export type Trigger = "time" | "change" | "message";
export type Outcome = "success" | "skipped" | "error";

export type AgentName =
  | "notion-to-blog"
  | "weekly-digest"
  | "sunday-ping"
  | "pr-reviewer"
  | "manual-chatbot";

export type AgentLink = {
  label: string;
  url: string;
};

export type AgentEntry = {
  id: string;
  timestamp: string; // ISO 8601
  agent: AgentName;
  trigger: Trigger;
  /** Short verb phrase. e.g. "Published essay", "Filed weekly digest". */
  action: string;
  /** One-sentence prose, what actually happened. */
  summary: string;
  outcome: Outcome;
  links?: AgentLink[];
  /** Why we DIDN'T fire — only set when outcome === "skipped". */
  skippedReason?: string;
};

const LOG_PATH = path.join(process.cwd(), "content", "agent-log.json");

export async function getAgentLog(): Promise<AgentEntry[]> {
  try {
    const raw = await fs.readFile(LOG_PATH, "utf8");
    const entries = JSON.parse(raw) as AgentEntry[];
    // Newest first.
    return entries.sort((a, b) => (a.timestamp < b.timestamp ? 1 : -1));
  } catch {
    return [];
  }
}

export type AgentStatus = "live" | "scaffolded";

export const AGENT_META: Record<
  AgentName,
  { title: string; trigger: Trigger; blurb: string; accent: string; status: AgentStatus }
> = {
  "weekly-digest": {
    title: "Weekly digest",
    trigger: "time",
    blurb: "Searches the web + Reddit for proactive-agent mentions; files one rolling issue.",
    accent: "butter",
    status: "live",
  },
  "notion-to-blog": {
    title: "Notion → blog",
    trigger: "change",
    blurb: "Watches the Drafts database; publishes finished pages as MDX.",
    accent: "sage",
    status: "scaffolded",
  },
  "sunday-ping": {
    title: "Sunday ping",
    trigger: "time",
    blurb: "Reads this week's digest; drafts a post outline and pings me on Slack.",
    accent: "peach",
    status: "scaffolded",
  },
  "pr-reviewer": {
    title: "PR reviewer",
    trigger: "change",
    blurb: "Comments on PRs with deploy preview, dead-link check, copy-edit notes.",
    accent: "lavender",
    status: "scaffolded",
  },
  "manual-chatbot": {
    title: "@manual",
    trigger: "message",
    blurb: "Answers questions in Slack/email grounded in the published essays.",
    accent: "rose",
    status: "scaffolded",
  },
};

export const TRIGGER_META: Record<Trigger, { label: string; symbol: string; tone: string }> = {
  time: { label: "Time", symbol: "◷", tone: "text-butter" },
  change: { label: "Change", symbol: "◇", tone: "text-sage" },
  message: { label: "Message", symbol: "✦", tone: "text-rose" },
};
