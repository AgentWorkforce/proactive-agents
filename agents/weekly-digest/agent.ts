/**
 * Weekly digest agent — TIME trigger.
 *
 * Saturday 09:00 UTC. Searches the web + Reddit for "proactive agents"
 * mentions, dedupes against the rolling issue, clusters by topic via the
 * model, and upserts ONE GitHub issue (not many).
 *
 * Why one issue: a Slack-style firehose of "look at this" issues IS reactive
 * plumbing. The whole point of proactive is restraint. Filter, group,
 * summarise, show up once a week with a real digest.
 */
import { agent, type Context } from "../shared/sdk";
import { writeLogEntry } from "../shared/log";

const REPO = "AgentWorkforce/proactive-agents";
const ISSUE_LABEL = "weekly-digest";
const SOURCES = ["web", "reddit:LocalLLaMA", "reddit:AI_Agents", "reddit:MachineLearning"] as const;

type Mention = {
  source: (typeof SOURCES)[number];
  url: string;
  title: string;
  excerpt: string;
  publishedAt: string;
};

type Cluster = {
  topic: string;
  mentions: Mention[];
};

export default agent({
  workspace: "proactive-agents",
  name: "weekly-digest",
  schedule: { cron: "0 9 * * 6", tz: "UTC" }, // Saturdays 09:00 UTC

  async onEvent(ctx: Context, event) {
    if (event.type !== "cron.tick") return;

    ctx.logger.info("digest tick", { scheduledFor: event.occurredAt });

    // 1. Fan out to sources.
    const raw = await fetchAllSources(ctx);

    // 2. Dedupe against the prior issue (and against the digest-cache file in VFS).
    const seen = await loadSeenUrls(ctx);
    const fresh = raw.filter((m) => !seen.has(m.url));

    if (fresh.length === 0) {
      await writeLogEntry({
        agent: "weekly-digest",
        trigger: "time",
        action: "Skipped — quiet week",
        summary: `No new mentions across ${SOURCES.length} sources. Nothing filed.`,
        outcome: "skipped",
        skippedReason: "no signal",
      });
      return;
    }

    // 3. Cluster into <= 4 topics via the model.
    const clusters = await clusterByTopic(ctx, fresh);

    // 4. Upsert the rolling issue.
    const { issueUrl, issueNumber } = await ctx.once(
      `digest:${weekKey(event.occurredAt)}`,
      () => upsertDigestIssue(ctx, clusters, event.occurredAt),
    );

    // 5. Persist seen URLs so next week dedupes against them.
    await ctx.files.write(
      "/_internal/weekly-digest/seen.json",
      Array.from(new Set([...seen, ...fresh.map((m) => m.url)])),
    );

    await writeLogEntry({
      agent: "weekly-digest",
      trigger: "time",
      action: "Filed weekly digest",
      summary: `Found ${fresh.length} new mention(s) across ${SOURCES.length} sources, deduped, clustered into ${clusters.length} topic(s).`,
      outcome: "success",
      links: [{ label: `Issue #${issueNumber}`, url: issueUrl }],
    });
  },

  async onError(ctx, error, event) {
    ctx.logger.error("digest failed", { error: error.message, eventId: event.id });
    await writeLogEntry({
      agent: "weekly-digest",
      trigger: "time",
      action: "Failed to file digest",
      summary: error.message,
      outcome: "error",
    });
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// Sources

async function fetchAllSources(ctx: Context): Promise<Mention[]> {
  const tasks = SOURCES.map((s) =>
    s === "web" ? searchWeb(ctx) : searchReddit(ctx, s.split(":")[1]!),
  );
  const results = await Promise.allSettled(tasks);
  return results.flatMap((r) =>
    r.status === "fulfilled" ? r.value : (ctx.logger.warn("source failed", { reason: String(r.reason) }), []),
  );
}

async function searchWeb(ctx: Context): Promise<Mention[]> {
  const results = await braveSearch(ctx, '"proactive agents"', { freshness: "pw", count: 20 });
  return results.map((r) => ({
    source: "web",
    url: r.url,
    title: r.title,
    excerpt: r.description.slice(0, 280),
    publishedAt: r.age ?? new Date().toISOString(),
  }));
}

async function searchReddit(ctx: Context, subreddit: string): Promise<Mention[]> {
  // Try Reddit's JSON endpoint first. Distinctive UA matters more than rate
  // here — generic UAs get blocked first; weekly cadence is well under any
  // limit. If we get 4xx/5xx or empty, fall back to Brave site:reddit.com.
  try {
    const res = await fetch(
      `https://www.reddit.com/r/${subreddit}/search.json?q=${encodeURIComponent('"proactive agents"')}&sort=new&t=week&restrict_sr=1`,
      {
        headers: { "user-agent": "proactive-agents-digest/0.1 (by /u/khaliqgant)" },
        signal: ctx.signal,
      },
    );
    if (!res.ok) throw new Error(`reddit ${res.status}`);
    const data = (await res.json()) as {
      data: {
        children: {
          data: { url: string; title: string; selftext: string; created_utc: number };
        }[];
      };
    };
    if (data.data.children.length === 0) throw new Error("reddit empty");
    return data.data.children.map((c) => ({
      source: `reddit:${subreddit}` as Mention["source"],
      url: c.data.url,
      title: c.data.title,
      excerpt: c.data.selftext.slice(0, 280),
      publishedAt: new Date(c.data.created_utc * 1000).toISOString(),
    }));
  } catch (err) {
    ctx.logger.warn("reddit failed, falling back to brave", {
      subreddit,
      reason: String(err),
    });
    const results = await braveSearch(
      ctx,
      `site:reddit.com/r/${subreddit} "proactive agents"`,
      { freshness: "pw", count: 10 },
    );
    return results.map((r) => ({
      source: `reddit:${subreddit}` as Mention["source"],
      url: r.url,
      title: r.title,
      excerpt: r.description.slice(0, 280),
      publishedAt: r.age ?? new Date().toISOString(),
    }));
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Brave Search

type BraveResult = {
  url: string;
  title: string;
  description: string;
  age?: string; // ISO 8601 when present
};

/**
 * Brave Search Web API. Free tier: 2,000 queries/month, 1 q/sec. We use
 * one query per source per week — well under the limit.
 *
 * Auth: read `BRAVE_API_KEY` from env. When the proactive runtime supports
 * provider connections, swap to `relay providers connect brave` and the SDK
 * will inject the key at boot.
 */
async function braveSearch(
  ctx: Context,
  query: string,
  opts: { freshness?: "pd" | "pw" | "pm" | "py"; count?: number } = {},
): Promise<BraveResult[]> {
  const apiKey = process.env.BRAVE_API_KEY;
  if (!apiKey) {
    ctx.logger.warn("BRAVE_API_KEY missing — skipping web search");
    return [];
  }
  const params = new URLSearchParams({
    q: query,
    count: String(opts.count ?? 20),
    text_decorations: "false",
  });
  if (opts.freshness) params.set("freshness", opts.freshness);

  const res = await fetch(`https://api.search.brave.com/res/v1/web/search?${params}`, {
    headers: {
      "X-Subscription-Token": apiKey,
      Accept: "application/json",
      "Accept-Encoding": "gzip",
    },
    signal: ctx.signal,
  });
  if (!res.ok) {
    ctx.logger.error("brave search failed", { status: res.status, query });
    return [];
  }
  const data = (await res.json()) as { web?: { results?: BraveResult[] } };
  return data.web?.results ?? [];
}

// ─────────────────────────────────────────────────────────────────────────────
// Clustering

async function clusterByTopic(_ctx: Context, mentions: Mention[]): Promise<Cluster[]> {
  // TODO: single Anthropic call. Prompt: "Cluster these N mentions into 1–4
  // topic groups. Each group needs a 4–8 word topic. Drop anything off-topic
  // for proactive agents (i.e. agentic AI tooling) — false positives are
  // worse than missed mentions in a digest."
  //
  // Uses Claude Haiku (cheap, fast) by default. Swap to Sonnet if quality
  // suffers on weeks with >30 mentions.
  return [{ topic: "uncategorised", mentions }];
}

// ─────────────────────────────────────────────────────────────────────────────
// Persistence

async function loadSeenUrls(ctx: Context): Promise<Set<string>> {
  const file = await ctx.files.read("/_internal/weekly-digest/seen.json");
  if (!file) return new Set();
  return new Set((file.body as string[]) ?? []);
}

async function upsertDigestIssue(
  _ctx: Context,
  clusters: Cluster[],
  occurredAt: string,
): Promise<{ issueUrl: string; issueNumber: number }> {
  const body = renderDigestBody(clusters, occurredAt);
  const title = `Weekly digest — week of ${occurredAt.slice(0, 10)}`;

  // TODO: wire to GitHub via Octokit OR the relay-github primitive when it ships.
  //
  //   const existing = await octokit.rest.issues.listForRepo({
  //     owner: "AgentWorkforce", repo: "proactive-agents",
  //     labels: ISSUE_LABEL, state: "open", per_page: 1,
  //   });
  //   if (existing.data[0]) {
  //     await octokit.rest.issues.update({ owner, repo, issue_number: existing.data[0].number, body });
  //     return { issueUrl: existing.data[0].html_url, issueNumber: existing.data[0].number };
  //   }
  //   const created = await octokit.rest.issues.create({ owner, repo, title, body, labels: [ISSUE_LABEL] });
  //   return { issueUrl: created.data.html_url, issueNumber: created.data.number };

  return { issueUrl: `https://github.com/${REPO}/issues/0`, issueNumber: 0 };
}

function renderDigestBody(clusters: Cluster[], occurredAt: string): string {
  const lines = [
    `_Filed by the weekly-digest agent — see [/agent](https://proactiveagents.dev/agent) for the live log._`,
    ``,
    `## Week of ${occurredAt.slice(0, 10)}`,
    ``,
  ];
  for (const c of clusters) {
    lines.push(`### ${c.topic} (${c.mentions.length})`);
    for (const m of c.mentions) {
      lines.push(`- [${m.title}](${m.url}) — \`${m.source}\``);
      if (m.excerpt) lines.push(`  > ${m.excerpt.replace(/\n/g, " ")}`);
    }
    lines.push("");
  }
  return lines.join("\n");
}

function weekKey(iso: string): string {
  const d = new Date(iso);
  const onejan = new Date(d.getFullYear(), 0, 1);
  const week = Math.ceil(((d.getTime() - onejan.getTime()) / 86400000 + onejan.getDay() + 1) / 7);
  return `${d.getFullYear()}-W${String(week).padStart(2, "0")}`;
}
