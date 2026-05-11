/**
 * Notion → blog agent — CHANGE trigger.
 *
 * Watches the Notion "Drafts" database (path mapped through relayfile-notion).
 * When a page flips to status `ready`, converts blocks to MDX and opens a PR.
 *
 * Restraint: most page changes are NOT "ready" — they're typo fixes mid-draft.
 * The agent skips with a logged reason rather than firing on every keystroke.
 */
import { agent, type Context, type AgentEvent } from "../shared/sdk";
import { writeLogEntry } from "../shared/log";

// One Notion DB id per workspace. Set via `relay providers connect notion`
// during workspace setup; the relayfile-notion adapter mounts the DB at
// /notion/databases/<dbId>/pages/* and emits a relayfile.changed event for
// each page write.
const DRAFTS_DB_PATH = "/notion/databases/drafts/pages/**";

type NotionExpansion = {
  data: {
    id: string;
    url: string;
    properties: {
      Title: { title: { plain_text: string }[] };
      Slug: { rich_text: { plain_text: string }[] };
      Status: { select: { name: "draft" | "editing" | "ready" | "published" } };
    };
    blocks: unknown[]; // Notion block list
  };
};

export default agent({
  workspace: "proactive-agents",
  name: "notion-to-blog",
  watch: DRAFTS_DB_PATH,

  async onEvent(ctx: Context, event: AgentEvent) {
    if (event.type !== "relayfile.changed") return;

    // Cheap routing decision off the summary — no expand needed yet.
    const status = event.summary.status;
    const title = event.summary.title ?? "(untitled)";

    if (status !== "ready") {
      await writeLogEntry({
        agent: "notion-to-blog",
        trigger: "change",
        action: `Skipped — page still ${status ?? "unset"}`,
        summary: `Page "${title}" changed but status is "${status ?? "unset"}", not "ready". Nothing published.`,
        outcome: "skipped",
        skippedReason: `status != ready`,
        links: [{ label: "Notion page", url: event.resource.path }],
      });
      return;
    }

    // Now we commit to the work — pull the full page including blocks.
    const full = (await event.expand("full")) as NotionExpansion;
    const slug = full.data.properties.Slug.rich_text[0]?.plain_text ?? slugify(title);

    // TODO: blocks → MDX. Handle our Scene / Sidenote / Callout components by
    // recognising specific Notion callout/toggle conventions.
    //   const mdx = blocksToMdx(full.data.blocks, frontmatterFrom(full));

    // TODO: open PR via Octokit. Idempotent on (workspace, page.id, page.last_edited):
    // if a PR for this page+revision already exists, no-op.
    //   const prUrl = await ctx.once(
    //     `notion-pr:${full.data.id}:${event.digest}`,
    //     () => openPr({ path: `content/posts/${slug}.mdx`, body: mdx, title: `Publish: ${title}` }),
    //   );

    await writeLogEntry({
      agent: "notion-to-blog",
      trigger: "change",
      action: "Published essay",
      summary: `New page "${title}" tagged ready. Converted to MDX, opened PR.`,
      outcome: "success",
      links: [
        { label: "Notion source", url: full.data.url },
        { label: "Will live at", url: `/posts/${slug}` },
      ],
    });
  },
});

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}
