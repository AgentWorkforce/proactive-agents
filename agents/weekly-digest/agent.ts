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
import { completeJson } from "../shared/openrouter";
import { octokitFor, REPO, type CfEnv } from "../shared/runtime/cloudflare-context";

const ISSUE_LABEL = "weekly-digest";
const SOURCES = ["web", "reddit:LocalLLaMA", "reddit:AI_Agents", "reddit:MachineLearning"] as const;

// Env injected at the function entrypoint and referenced from helpers.
// We use a module-level holder rather than threading env through every call
// because the agent code is meant to mirror the spec's `agent({...})` shape,
// which doesn't expose env. When the runtime ships this becomes a Context
// extension; for now it's set in functions/api/cron/[agent].ts before
// the handler runs.
let runtimeEnv: CfEnv | null = null;
export function setEnv(env: CfEnv) {
  runtimeEnv = env;
}
function env(): CfEnv {
  if (!runtimeEnv) throw new Error("weekly-digest: env not set; call setEnv() before invoking onEvent");
  return runtimeEnv;
}

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
      await writeLogEntry(ctx, {
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

    await writeLogEntry(ctx, {
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
    await writeLogEntry(ctx, {
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
  // Two queries, OR'd and deduped. Brave's index is narrower than Google's
  // for emerging-topic dev content, and exact-phrase quotes drop a lot of
  // related phrasings. We trade ~2x the API quota for meaningfully better
  // recall — still ~24 queries/month, well under the free 2k.
  const queries = ["proactive agents", "proactive AI agent"];

  const results = await Promise.all(
    queries.map((q) => braveSearch(ctx, q, { freshness: "pm", count: 20 })),
  );

  const seen = new Set<string>();
  const merged: Mention[] = [];
  for (const batch of results) {
    for (const r of batch) {
      if (seen.has(r.url)) continue;
      seen.add(r.url);
      merged.push({
        source: "web",
        url: r.url,
        title: r.title,
        excerpt: r.description.slice(0, 280),
        publishedAt: r.age ?? new Date().toISOString(),
      });
    }
  }
  return merged;
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
  // Workers don't expose `process.env` — env comes through the binding
  // passed by the Pages Function and read via env() (same as OpenRouter).
  const apiKey = env().BRAVE_API_KEY;
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

async function clusterByTopic(ctx: Context, mentions: Mention[]): Promise<Cluster[]> {
  if (mentions.length === 0) return [];

  // Pass only the routing-decision fields. URL kept as the join key.
  const compact = mentions.map((m: Mention, i: number) => ({
    i,
    title: m.title,
    excerpt: m.excerpt.slice(0, 200),
    source: m.source,
  }));

  const prompt = `You are clustering web mentions for a weekly digest about *proactive agents* — software systems where an LLM agent acts on its own (schedules, triggers, watchers, durable wake/sleep), not generic AI/LLM news.

Drop anything off-topic. False positives are worse than misses in a digest.

Return JSON in this exact shape:
{
  "clusters": [
    { "topic": "<4-8 word topic name>", "indices": [<numeric indices from input>] }
  ]
}

Rules:
- 1 to 4 clusters total. Combine small clusters into "miscellaneous" if needed.
- Every kept index appears in exactly one cluster.
- Drop indices that aren't about proactive agents (don't include them anywhere).

Mentions:
${JSON.stringify(compact)}`;

  type LlmResp = { clusters: { topic: string; indices: number[] }[] };
  const out = await completeJson<LlmResp>({
    apiKey: env().OPENROUTER_API_KEY!,
    messages: [{ role: "user", content: prompt }],
    signal: ctx.signal,
  });

  return out.clusters
    .map((c) => ({
      topic: c.topic,
      mentions: c.indices
        .map((i) => mentions[i])
        .filter((m): m is Mention => Boolean(m)),
    }))
    .filter((c) => c.mentions.length > 0);
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
  const octokit = await octokitFor(env());

  // One issue per ISO week. We look for an open issue already filed for this
  // week (matched by title); if found, edit it; otherwise create.
  const existing = await octokit.rest.issues.listForRepo({
    owner: REPO.owner,
    repo: REPO.name,
    labels: ISSUE_LABEL,
    state: "open",
    per_page: 30,
  });
  const sameWeek = existing.data.find((i) => i.title === title);
  if (sameWeek) {
    await octokit.rest.issues.update({
      owner: REPO.owner,
      repo: REPO.name,
      issue_number: sameWeek.number,
      body,
    });
    return { issueUrl: sameWeek.html_url, issueNumber: sameWeek.number };
  }

  const created = await octokit.rest.issues.create({
    owner: REPO.owner,
    repo: REPO.name,
    title,
    body,
    labels: [ISSUE_LABEL],
  });
  return { issueUrl: created.data.html_url, issueNumber: created.data.number };
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
