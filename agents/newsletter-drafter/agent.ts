/**
 * Newsletter drafter agent — TIME trigger.
 *
 * Sunday 10:00 UTC. Collects the week's content (essays, market, news)
 * and drafts a Buttondown newsletter. Does NOT send — creates a draft
 * and opens a GitHub issue assigned to @khaliqgant for review.
 *
 * Content sources:
 *   1. Essays — new/updated posts committed this week (via GitHub API)
 *   2. Market — new market entries committed this week
 *   3. News  — latest weekly-digest issue body (filed Saturday by weekly-digest agent)
 */
import { agent, type Context } from "../shared/sdk";
import { writeLogEntry } from "../shared/log";
import { octokitFor, REPO, type CfEnv } from "../shared/runtime/cloudflare-context";

const BUTTONDOWN_API = "https://api.buttondown.com/v1";
const ISSUE_LABEL = "newsletter-draft";
const SITE_URL = "https://proactiveagents.com";

let runtimeEnv: CfEnv | null = null;
export function setEnv(env: CfEnv) {
  runtimeEnv = env;
}
function env(): CfEnv {
  if (!runtimeEnv) throw new Error("newsletter-drafter: env not set; call setEnv() before invoking onEvent");
  return runtimeEnv;
}

type EssayEntry = { slug: string; title: string; summary: string; date: string; isNew: boolean };
type MarketEntry = { slug: string; title: string; summary: string };
type NewsCluster = { topic: string; items: string[] };

export default agent({
  workspace: "proactive-agents",
  name: "newsletter-drafter",
  schedule: { cron: "0 10 * * 0", tz: "UTC" },

  async onEvent(ctx: Context, event) {
    if (event.type !== "cron.tick") return;

    ctx.logger.info("newsletter-drafter tick", { scheduledFor: event.occurredAt });

    const apiKey = env().BUTTONDOWN_API_KEY;
    if (!apiKey) {
      ctx.logger.warn("BUTTONDOWN_API_KEY not set — skipping newsletter draft");
      await writeLogEntry(ctx, {
        agent: "newsletter-drafter",
        trigger: "time",
        action: "Skipped — no API key",
        summary: "BUTTONDOWN_API_KEY not configured.",
        outcome: "skipped",
        skippedReason: "missing config",
      });
      return;
    }

    const octokit = await octokitFor(env());
    const since = sevenDaysAgo(event.occurredAt);

    const [essays, market, news] = await Promise.all([
      fetchWeeklyEssays(octokit, since),
      fetchWeeklyMarket(octokit, since),
      fetchLatestDigest(octokit),
    ]);

    if (essays.length === 0 && market.length === 0 && news.length === 0) {
      await writeLogEntry(ctx, {
        agent: "newsletter-drafter",
        trigger: "time",
        action: "Skipped — quiet week",
        summary: "No new essays, market entries, or digest items. No draft created.",
        outcome: "skipped",
        skippedReason: "no content",
      });
      return;
    }

    const weekLabel = event.occurredAt.slice(0, 10);
    const subject = `Proactive Agents — Week of ${weekLabel}`;
    const body = renderEmailBody(essays, market, news, weekLabel);

    const draft = await createButtondownDraft(apiKey, subject, body);

    const issueUrl = await createReviewIssue(
      octokit,
      weekLabel,
      subject,
      essays,
      market,
      news,
      draft.id,
    );

    await writeLogEntry(ctx, {
      agent: "newsletter-drafter",
      trigger: "time",
      action: "Drafted weekly newsletter",
      summary: `${essays.length} essay(s), ${market.length} market update(s), ${news.length} news cluster(s). Draft created in Buttondown, review issue filed.`,
      outcome: "success",
      links: [
        { label: "Review issue", url: issueUrl },
        { label: "Buttondown draft", url: `https://buttondown.com/khaliq/emails/${draft.id}` },
      ],
    });
  },

  async onError(ctx, error, event) {
    ctx.logger.error("newsletter-drafter failed", { error: error.message, eventId: event.id });
    await writeLogEntry(ctx, {
      agent: "newsletter-drafter",
      trigger: "time",
      action: "Failed to draft newsletter",
      summary: error.message,
      outcome: "error",
    });
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// Content sources

async function fetchWeeklyEssays(
  octokit: Awaited<ReturnType<typeof octokitFor>>,
  since: string,
): Promise<EssayEntry[]> {
  try {
    const commits = await octokit.rest.repos.listCommits({
      owner: REPO.owner,
      repo: REPO.name,
      path: "content/posts",
      since,
      per_page: 50,
    });

    const slugsSeen = new Set<string>();
    const essays: EssayEntry[] = [];

    for (const commit of commits.data) {
      const detail = await octokit.rest.repos.getCommit({
        owner: REPO.owner,
        repo: REPO.name,
        ref: commit.sha,
      });

      for (const file of detail.data.files ?? []) {
        const match = file.filename.match(/^content\/posts\/(.+)\.mdx$/);
        if (!match || slugsSeen.has(match[1])) continue;
        slugsSeen.add(match[1]);

        const frontmatter = await fetchFrontmatter(octokit, file.filename);
        if (frontmatter) {
          essays.push({
            slug: match[1],
            title: frontmatter.title,
            summary: frontmatter.summary,
            date: frontmatter.date,
            isNew: file.status === "added",
          });
        }
      }
    }

    return essays;
  } catch (err) {
    console.error("[newsletter-drafter] fetchWeeklyEssays failed", err);
    return [];
  }
}

async function fetchWeeklyMarket(
  octokit: Awaited<ReturnType<typeof octokitFor>>,
  since: string,
): Promise<MarketEntry[]> {
  try {
    const commits = await octokit.rest.repos.listCommits({
      owner: REPO.owner,
      repo: REPO.name,
      path: "content/market",
      since,
      per_page: 30,
    });

    const slugsSeen = new Set<string>();
    const entries: MarketEntry[] = [];

    for (const commit of commits.data) {
      const detail = await octokit.rest.repos.getCommit({
        owner: REPO.owner,
        repo: REPO.name,
        ref: commit.sha,
      });

      for (const file of detail.data.files ?? []) {
        const newsMatch = file.filename.match(/^content\/market\/news\/(.+)\.mdx$/);
        const startupMatch = file.filename.match(/^content\/market\/startups\/(.+)\.json$/);
        const slug = newsMatch?.[1] ?? startupMatch?.[1];
        if (!slug || slugsSeen.has(slug)) continue;
        slugsSeen.add(slug);

        if (newsMatch) {
          const fm = await fetchFrontmatter(octokit, file.filename);
          if (fm) entries.push({ slug, title: fm.title, summary: fm.summary ?? "" });
        } else if (startupMatch) {
          const content = await fetchFileContent(octokit, file.filename);
          if (content) {
            try {
              const data = JSON.parse(content) as { name: string; summary: string };
              entries.push({ slug, title: data.name, summary: data.summary });
            } catch { /* skip malformed */ }
          }
        }
      }
    }

    return entries;
  } catch (err) {
    console.error("[newsletter-drafter] fetchWeeklyMarket failed", err);
    return [];
  }
}

async function fetchLatestDigest(
  octokit: Awaited<ReturnType<typeof octokitFor>>,
): Promise<NewsCluster[]> {
  try {
    const issues = await octokit.rest.issues.listForRepo({
      owner: REPO.owner,
      repo: REPO.name,
      labels: "weekly-digest",
      state: "open",
      sort: "created",
      direction: "desc",
      per_page: 1,
    });

    if (issues.data.length === 0) return [];

    const body = issues.data[0].body ?? "";
    return parseDigestBody(body);
  } catch (err) {
    console.error("[newsletter-drafter] fetchLatestDigest failed", err);
    return [];
  }
}

function parseDigestBody(body: string): NewsCluster[] {
  const clusters: NewsCluster[] = [];
  let current: NewsCluster | null = null;

  for (const line of body.split("\n")) {
    const topicMatch = line.match(/^###\s+(.+?)(?:\s+\(\d+\))?$/);
    if (topicMatch) {
      current = { topic: topicMatch[1], items: [] };
      clusters.push(current);
      continue;
    }
    if (current && line.startsWith("- [")) {
      current.items.push(line);
    }
  }

  return clusters.filter((c) => c.items.length > 0);
}

// ─────────────────────────────────────────────────────────────────────────────
// GitHub file helpers

async function fetchFrontmatter(
  octokit: Awaited<ReturnType<typeof octokitFor>>,
  filePath: string,
): Promise<{ title: string; summary: string; date: string } | null> {
  const content = await fetchFileContent(octokit, filePath);
  if (!content) return null;

  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return null;

  const fm = match[1];
  const title = fm.match(/title:\s*["']?(.+?)["']?\s*$/m)?.[1] ?? "";
  const summary = fm.match(/summary:\s*["']?(.+?)["']?\s*$/m)?.[1] ?? "";
  const date = fm.match(/date:\s*["']?(.+?)["']?\s*$/m)?.[1] ?? "";

  return title ? { title, summary, date } : null;
}

async function fetchFileContent(
  octokit: Awaited<ReturnType<typeof octokitFor>>,
  filePath: string,
): Promise<string | null> {
  try {
    const res = await octokit.rest.repos.getContent({
      owner: REPO.owner,
      repo: REPO.name,
      path: filePath,
    });
    if (Array.isArray(res.data) || res.data.type !== "file") return null;
    const bytes = Uint8Array.from(atob(res.data.content.replace(/\n/g, "")), (c) =>
      c.charCodeAt(0),
    );
    return new TextDecoder("utf-8").decode(bytes);
  } catch {
    return null;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Email rendering

function renderEmailBody(
  essays: EssayEntry[],
  market: MarketEntry[],
  news: NewsCluster[],
  weekLabel: string,
): string {
  const sections: string[] = [];

  sections.push(`Week of ${weekLabel}.\n`);

  if (essays.length > 0) {
    sections.push("## Essays\n");
    for (const e of essays) {
      const tag = e.isNew ? "New" : "Updated";
      sections.push(`**[${e.title}](${SITE_URL}/posts/${e.slug}/)**  `);
      sections.push(`${tag} · ${e.summary}\n`);
    }
  }

  if (market.length > 0) {
    sections.push("## Market\n");
    for (const m of market) {
      sections.push(`**${m.title}**  `);
      sections.push(`${m.summary}\n`);
    }
  }

  if (news.length > 0) {
    sections.push("## Around the web\n");
    for (const cluster of news) {
      sections.push(`**${cluster.topic}**\n`);
      for (const item of cluster.items) {
        sections.push(item);
      }
      sections.push("");
    }
  }

  sections.push("---\n");
  sections.push(`Read more at [proactiveagents.com](${SITE_URL})`);

  return sections.join("\n");
}

// ─────────────────────────────────────────────────────────────────────────────
// Buttondown

async function createButtondownDraft(
  apiKey: string,
  subject: string,
  body: string,
): Promise<{ id: string }> {
  const res = await fetch(`${BUTTONDOWN_API}/emails`, {
    method: "POST",
    headers: {
      Authorization: `Token ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      subject,
      body,
      status: "draft",
      email_type: "public",
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Buttondown draft creation failed (${res.status}): ${err}`);
  }

  const data = (await res.json()) as { id: string };
  return data;
}

// ─────────────────────────────────────────────────────────────────────────────
// GitHub issue for review

async function createReviewIssue(
  octokit: Awaited<ReturnType<typeof octokitFor>>,
  weekLabel: string,
  subject: string,
  essays: EssayEntry[],
  market: MarketEntry[],
  news: NewsCluster[],
  draftId: string,
): Promise<string> {
  const body = [
    `The newsletter-drafter agent created a Buttondown draft for **${weekLabel}**.`,
    "",
    `**Subject:** ${subject}`,
    `**Buttondown draft:** https://buttondown.com/khaliq/emails/${draftId}`,
    "",
    "## Content summary",
    "",
    `- **Essays:** ${essays.length} (${essays.map((e) => e.title).join(", ") || "none"})`,
    `- **Market:** ${market.length} (${market.map((m) => m.title).join(", ") || "none"})`,
    `- **News clusters:** ${news.length} (${news.map((n) => n.topic).join(", ") || "none"})`,
    "",
    "## Review checklist",
    "",
    "- [ ] Read the draft in Buttondown",
    "- [ ] Edit copy if needed",
    "- [ ] Hit send (or discard if it's a quiet week)",
    "- [ ] Close this issue",
    "",
    "_Filed by the newsletter-drafter agent — see [/agent](https://proactiveagents.com/agent) for the live log._",
  ].join("\n");

  const created = await octokit.rest.issues.create({
    owner: REPO.owner,
    repo: REPO.name,
    title: `Newsletter draft — ${weekLabel}`,
    body,
    labels: [ISSUE_LABEL],
    assignees: ["khaliqgant"],
  });

  return created.data.html_url;
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers

function sevenDaysAgo(iso: string): string {
  const d = new Date(iso);
  d.setDate(d.getDate() - 7);
  return d.toISOString();
}
