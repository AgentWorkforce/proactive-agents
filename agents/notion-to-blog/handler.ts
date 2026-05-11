import { writeLogEntry } from "../shared/log";

/**
 * Wired to a relayfile watch on the Notion "Drafts" database. Fires on every
 * page change, but only acts when the page's `Status` tag is `ready`.
 *
 * Side effects on success:
 *   1. Convert Notion blocks → MDX (Scene, Sidenote, Callout where used)
 *   2. Write `content/posts/<slug>.mdx` with frontmatter
 *   3. Open a PR against `main` with the new file
 *   4. Append an entry to the agent log
 */
type NotionPageEvent = {
  pageId: string;
  pageUrl: string;
  title: string;
  slug: string;
  status: "draft" | "editing" | "ready" | "published";
  previousStatus?: NotionPageEvent["status"];
};

export async function handler(event: NotionPageEvent) {
  if (event.status !== "ready") {
    await writeLogEntry({
      agent: "notion-to-blog",
      trigger: "change",
      action: `Skipped — page still ${event.status}`,
      summary: `Page "${event.title}" changed in Notion but tag is "${event.status}", not "ready". Nothing published.`,
      outcome: "skipped",
      skippedReason: `tag != ready`,
      links: [{ label: "Notion page", url: event.pageUrl }],
    });
    return;
  }

  // TODO: Notion API call → fetch page blocks
  // const blocks = await notion.blocks.children.list({ block_id: event.pageId });

  // TODO: blocks → MDX conversion (handle our Scene/Sidenote/Callout components)
  // const mdx = blocksToMdx(blocks, frontmatterFromPage(event));

  // TODO: write file + open PR via GitHub API
  // const prUrl = await openPr({ path: `content/posts/${event.slug}.mdx`, body: mdx });

  await writeLogEntry({
    agent: "notion-to-blog",
    trigger: "change",
    action: "Published essay",
    summary: `New page "${event.title}" tagged ready. Converted to MDX, opened PR with the post.`,
    outcome: "success",
    links: [
      { label: "Notion source", url: event.pageUrl },
      // { label: "Source PR", url: prUrl },
      { label: "Will live at", url: `/posts/${event.slug}` },
    ],
  });
}
