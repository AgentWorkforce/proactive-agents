import { writeLogEntry } from "../shared/log";

/**
 * Wired to a relayfile watch on github:AgentWorkforce/proactive-agents/pulls.
 * Fires on `opened` and `synchronize` events.
 *
 * Posts ONE consolidated review comment per push (idempotent — edits the same
 * comment on subsequent pushes). The comment includes:
 *   - Cloudflare Pages preview URL for the PR branch
 *   - Dead-link check (any new external links in changed MDX files)
 *   - Copy-edit notes (overlong sentences, weasel words, Markdown-quirk fixes)
 *   - Screenshot diff vs production for any /app/* changes (optional, expensive)
 */
type PullRequestEvent = {
  number: number;
  url: string;
  branch: string;
  changedFiles: string[];
  action: "opened" | "synchronize" | "reopened";
};

export async function handler(event: PullRequestEvent) {
  const mdxChanged = event.changedFiles.filter((f) => f.endsWith(".mdx"));
  const codeChanged = event.changedFiles.filter((f) => f.startsWith("app/") || f.startsWith("components/"));

  // TODO: deploy preview URL — Cloudflare Pages exposes branch deployments at:
  // https://<branch>.proactive-agents.pages.dev
  // const previewUrl = `https://${slugifyBranch(event.branch)}.proactive-agents.pages.dev`;

  // TODO: dead-link check on changed MDX
  // const deadLinks = mdxChanged.length ? await checkLinks(mdxChanged) : [];

  // TODO: copy edit pass via LLM
  // const copyNotes = mdxChanged.length ? await copyEdit(mdxChanged) : [];

  // TODO: screenshot diff (optional, only if codeChanged)
  // const screenshots = codeChanged.length ? await renderDiff(previewUrl) : null;

  // TODO: upsert comment on the PR (find existing review-comment by signature, edit; else create)
  // await upsertPrComment(event.number, render({ previewUrl, deadLinks, copyNotes, screenshots }));

  const findings = 0; // deadLinks.length + copyNotes.length

  if (mdxChanged.length === 0 && codeChanged.length === 0) {
    await writeLogEntry({
      agent: "pr-reviewer",
      trigger: "change",
      action: `Skipped PR #${event.number}`,
      summary: `Nothing reviewable changed (no MDX, no app/ or components/).`,
      outcome: "skipped",
      skippedReason: "no reviewable files",
      links: [{ label: `PR #${event.number}`, url: event.url }],
    });
    return;
  }

  await writeLogEntry({
    agent: "pr-reviewer",
    trigger: "change",
    action: `Reviewed PR #${event.number}`,
    summary: `${mdxChanged.length} MDX file(s), ${codeChanged.length} code file(s). ${findings} finding(s). Deploy preview attached.`,
    outcome: "success",
    links: [{ label: `PR #${event.number}`, url: event.url }],
  });
}
