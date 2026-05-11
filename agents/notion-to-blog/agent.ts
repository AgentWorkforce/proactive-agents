/**
 * Notion → blog agent — CHANGE trigger.
 *
 * Watches the Notion "Posts" database via relayfile-notion. When a page
 * flips to status "Ready", converts Notion blocks to MDX, opens a PR,
 * and updates the Notion page to "Published" with the PR URL.
 *
 * Uses @relayfile/adapter-notion with Nango proxy for Notion auth, and
 * the operator persona from .agentworkforce for editorial polish.
 */
import { agent, type Context, type AgentEvent } from "../shared/sdk";
import { writeLogEntry } from "../shared/log";
import { octokitFor, REPO, type CfEnv } from "../shared/runtime/cloudflare-context";
import { readRepoJson } from "../shared/github-app";
import { complete } from "../shared/openrouter";
import {
  NotionApiClient,
  fetchBlockChildrenRecursively,
  renderBlocksToMarkdown,
  serializePropertyMap,
  type NotionBlock,
  type NotionPage,
  type SerializedPropertyValue,
} from "@relayfile/adapter-notion";
import { Nango, type ProxyConfiguration } from "@nangohq/node";
import type { ConnectionProvider, ProxyRequest, ProxyResponse } from "@relayfile/sdk";
import { notionMarkdownToMdx, buildFrontmatter, type Frontmatter } from "./markdown-to-mdx";

const DRAFTS_DB_PATH = "/notion/databases/drafts/pages/**";
const PROVIDER_CONFIG_KEY = "notion-relay";

let runtimeEnv: CfEnv | null = null;
export function setEnv(e: CfEnv) {
  runtimeEnv = e;
}
function env(): CfEnv {
  if (!runtimeEnv)
    throw new Error("notion-to-blog: env not set; call setEnv() before invoking onEvent");
  return runtimeEnv;
}

function notionClient(): { client: NotionApiClient; connectionId: string } {
  const e = env();
  if (!e.NANGO_SECRET_KEY) throw new Error("NANGO_SECRET_KEY not set");
  if (!e.NANGO_NOTION_CONNECTION_ID) throw new Error("NANGO_NOTION_CONNECTION_ID not set");

  const connectionId = e.NANGO_NOTION_CONNECTION_ID;
  const nango = new Nango({
    secretKey: e.NANGO_SECRET_KEY,
    host: e.NANGO_HOST ?? "https://api.nango.dev",
  });

  const provider: ConnectionProvider = {
    name: "notion",
    async proxy<T = unknown>(request: ProxyRequest): Promise<ProxyResponse<T>> {
      const config: ProxyConfiguration = {
        method: request.method,
        endpoint: request.endpoint,
        connectionId: request.connectionId,
        providerConfigKey: PROVIDER_CONFIG_KEY,
        ...(request.headers ? { headers: request.headers } : {}),
        ...(request.body === undefined ? {} : { data: request.body }),
        ...(request.query ? { params: request.query } : {}),
        ...(request.baseUrl ? { baseUrlOverride: request.baseUrl } : {}),
      };
      try {
        const response = await nango.proxy<T>(config);
        return {
          status: response.status,
          headers: normalizeHeaders(response.headers),
          data: response.data,
        };
      } catch (error) {
        const axiosErr = error as { response?: { status: number; headers: unknown; data: unknown } };
        if (axiosErr.response) {
          return {
            status: axiosErr.response.status,
            headers: normalizeHeaders(axiosErr.response.headers),
            data: axiosErr.response.data as T,
          };
        }
        throw error;
      }
    },
    async healthCheck(connId: string): Promise<boolean> {
      const response = await this.proxy({
        method: "GET",
        baseUrl: "https://api.notion.com",
        endpoint: "/v1/users/me",
        connectionId: connId,
        headers: { "Notion-Version": "2022-06-28" },
      });
      return response.status < 400;
    },
  };

  const client = new NotionApiClient(provider, { connectionId });
  return { client, connectionId };
}

export default agent({
  workspace: "proactive-agents",
  name: "notion-to-blog",
  watch: DRAFTS_DB_PATH,

  async onEvent(ctx: Context, event: AgentEvent) {
    if (event.type !== "relayfile.changed") return;

    const status = event.summary.status;
    const title = event.summary.title ?? "(untitled)";

    if (status !== "ready") {
      await writeLogEntry(ctx, {
        agent: "notion-to-blog",
        trigger: "change",
        action: `Skipped — page still ${status ?? "unset"}`,
        summary: `Page "${title}" changed but status is "${status ?? "unset"}", not "ready". Nothing published.`,
        outcome: "skipped",
        skippedReason: "status != ready",
        links: [{ label: "Notion page", url: event.resource.path }],
      });
      return;
    }

    const e = env();
    const dbId = e.NOTION_DATABASE_ID;
    if (!dbId) throw new Error("NOTION_DATABASE_ID not set");

    const { client } = notionClient();
    const pageId = event.resource.id;

    // ── 1. Pull full page + blocks from Notion ──────────────────────────
    const page = await client.request<NotionPage>("GET", `/pages/${pageId}`);
    const blocks = await fetchBlockChildrenRecursively(client, pageId);

    // ── 2. Serialize properties and validate ────────────────────────────
    const props = serializePropertyMap(page.properties ?? {});
    const missing = validateRequired(props);
    if (missing) {
      await writeLogEntry(ctx, {
        agent: "notion-to-blog",
        trigger: "change",
        action: `Skipped — missing required field: ${missing}`,
        summary: `Page "${title}" is marked ready but is missing "${missing}".`,
        outcome: "skipped",
        skippedReason: `missing-required-field: ${missing}`,
        links: [{ label: "Notion page", url: page.url ?? "" }],
      });
      return;
    }

    // ── 3. Build slug mapping for internal links ────────────────────────
    const dbPages = await client.paginate<NotionPage>(
      "POST",
      `/databases/${dbId}/query`,
      { body: { page_size: 100 } },
    );
    const pageIdToSlug = new Map<string, string>();
    for (const p of dbPages) {
      const serialized = serializePropertyMap(p.properties ?? {});
      const s = propValue(serialized.Slug);
      if (s) pageIdToSlug.set(p.id ?? "", s);
    }

    // ── 4. Extract frontmatter from properties ──────────────────────────
    const slug = propValue(props.Slug) || slugify(title);
    const frontmatter: Frontmatter = {
      title: propValue(props.Title),
      summary: propValue(props.Summary),
      date: propValue(props.Date) || new Date().toISOString().slice(0, 10),
      accent: propValue(props.Accent) || "peach",
      dropcap: propValue(props.Dropcap) === "true",
    };

    // ── 5. Convert blocks → markdown → MDX ──────────────────────────────
    const markdown = renderBlocksToMarkdown(blocks as NotionBlock[]);
    let mdx = notionMarkdownToMdx(markdown, frontmatter, pageIdToSlug);

    // ── 6. Optional: LLM polish using the operator persona ──────────────
    if (e.OPENROUTER_API_KEY) {
      mdx = await polishWithPersona(ctx, mdx, frontmatter.title);
    }

    // ── 7. Open PR (idempotent — skips if one already exists) ───────────
    const octokit = await octokitFor(e);
    const prUrl = await ctx.once(
      `notion-pr:${pageId}:${page.last_edited_time}`,
      () => openPr(octokit, slug, frontmatter.title, mdx, page.url ?? ""),
    );

    // ── 8. Update Notion: Status → Published, Published URL → PR URL ────
    await client.request("PATCH", `/pages/${pageId}`, {
      body: {
        properties: {
          Status: { select: { name: "Published" } },
          "Published URL": { url: prUrl },
        },
      },
    });

    // ── 9. Log ──────────────────────────────────────────────────────────
    await writeLogEntry(ctx, {
      agent: "notion-to-blog",
      trigger: "change",
      action: "Published essay",
      summary: `"${title}" → MDX → PR opened. Notion status set to Published.`,
      outcome: "success",
      links: [
        { label: "Notion source", url: page.url ?? "" },
        { label: "Pull request", url: prUrl },
        { label: "Will live at", url: `/posts/${slug}` },
      ],
    });
  },

  async onError(ctx, error, event) {
    ctx.logger.error("notion-to-blog failed", { error: error.message, eventId: event.id });
    await writeLogEntry(ctx, {
      agent: "notion-to-blog",
      trigger: "change",
      action: "Failed to publish",
      summary: error.message,
      outcome: "error",
    });
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// Helpers

function normalizeHeaders(headers: unknown): Record<string, string> {
  if (!headers || typeof headers !== "object") return {};
  const out: Record<string, string> = {};
  const h = headers as Record<string, unknown>;
  for (const [k, v] of Object.entries(h)) {
    if (typeof v === "string") out[k] = v;
  }
  return out;
}

function propValue(prop: SerializedPropertyValue | undefined): string {
  if (!prop) return "";
  return prop.displayValue ?? String(prop.value ?? "");
}

function validateRequired(props: Record<string, SerializedPropertyValue>): string | null {
  for (const name of ["Title", "Summary", "Date"]) {
    if (!propValue(props[name])) return name;
  }
  return null;
}

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

// ─────────────────────────────────────────────────────────────────────────────
// Persona-driven LLM polish

type PersonaConfig = {
  claudeMdContent?: string;
  tiers?: Record<string, { model?: string }>;
};

async function polishWithPersona(ctx: Context, mdx: string, title: string): Promise<string> {
  const e = env();
  const octokit = await octokitFor(e);

  const result = await readRepoJson<PersonaConfig>(octokit, {
    owner: REPO.owner,
    repo: REPO.name,
    path: ".agentworkforce/workforce/personas/operator.json",
    ref: REPO.branch,
  });
  if (!result?.data?.claudeMdContent) return mdx;

  const persona = result.data;
  const personaModel = persona.tiers?.["best-value"]?.model ?? "claude-sonnet-4-6";
  const openRouterModel = `anthropic/${personaModel}`;

  try {
    const refined = await complete({
      apiKey: e.OPENROUTER_API_KEY!,
      model: openRouterModel,
      temperature: 0.15,
      messages: [
        {
          role: "system",
          content: [
            persona.claudeMdContent,
            "",
            "You are reviewing an MDX blog post that was auto-converted from Notion.",
            "Your job is a light editorial pass — NOT a rewrite. Preserve the author's voice and structure.",
            "Fix only: HTML entities (use Unicode), markdown formatting errors, broken links, and missing frontmatter fields.",
            "Do NOT add Scene components, figures, or new content.",
            "Return ONLY the corrected MDX. No explanation, no markdown code fences.",
          ].join("\n"),
        },
        {
          role: "user",
          content: `Light editorial pass on "${title}":\n\n${mdx}`,
        },
      ],
      signal: ctx.signal,
    });
    return refined;
  } catch (err) {
    ctx.logger.warn("persona polish failed, using raw conversion", {
      error: err instanceof Error ? err.message : String(err),
    });
    return mdx;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// PR creation

async function openPr(
  octokit: Awaited<ReturnType<typeof octokitFor>>,
  slug: string,
  title: string,
  mdx: string,
  notionUrl: string,
): Promise<string> {
  const branchName = `notion-to-blog/${slug}`;
  const filePath = `content/posts/${slug}.mdx`;

  const { data: existing } = await octokit.rest.pulls.list({
    owner: REPO.owner,
    repo: REPO.name,
    state: "open",
    head: `${REPO.owner}:${branchName}`,
  });
  if (existing.length > 0) return existing[0].html_url;

  const { data: ref } = await octokit.rest.git.getRef({
    owner: REPO.owner,
    repo: REPO.name,
    ref: `heads/${REPO.branch}`,
  });

  try {
    await octokit.rest.git.createRef({
      owner: REPO.owner,
      repo: REPO.name,
      ref: `refs/heads/${branchName}`,
      sha: ref.object.sha,
    });
  } catch (err) {
    const status = (err as { status?: number }).status;
    if (status === 422) {
      await octokit.rest.git.updateRef({
        owner: REPO.owner,
        repo: REPO.name,
        ref: `heads/${branchName}`,
        sha: ref.object.sha,
        force: true,
      });
    } else {
      throw err;
    }
  }

  const bytes = new TextEncoder().encode(mdx);
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  const content = btoa(binary);

  await octokit.rest.repos.createOrUpdateFileContents({
    owner: REPO.owner,
    repo: REPO.name,
    path: filePath,
    branch: branchName,
    message: `[notion-to-blog] Publish: ${title}`,
    content,
  });

  const { data: pr } = await octokit.rest.pulls.create({
    owner: REPO.owner,
    repo: REPO.name,
    title: `Publish: ${title}`,
    head: branchName,
    base: REPO.branch,
    body: [
      `_Filed by the notion-to-blog agent — see [/agent](https://proactiveagents.dev/agent) for the live log._`,
      ``,
      `## Source`,
      `- [Notion page](${notionUrl})`,
      `- Post will live at \`/posts/${slug}\``,
      ``,
      `## Before merging`,
      `- [ ] Add card illustration in \`components/card-illustrations.tsx\``,
      `- [ ] Register any new figure components in \`components/mdx/mdx-components.tsx\``,
      `- [ ] Add at least 2 Scene blocks with sticky figures (mandatory)`,
      `- [ ] Alternate Scene sides (left, right, left, right)`,
      `- [ ] Run \`npx tsc --noEmit\` and \`npm run build\``,
    ].join("\n"),
  });

  return pr.html_url;
}
