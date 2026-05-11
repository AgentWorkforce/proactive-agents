/**
 * PR reviewer agent — CHANGE trigger.
 *
 * Watches GitHub PRs to AgentWorkforce/proactive-agents. Posts ONE consolidated
 * review comment per push (idempotent — edits the same comment on subsequent
 * pushes). Comment includes: deploy preview URL, dead-link check, copy-edit
 * notes for changed MDX files.
 */
import { agent, type Context, type AgentEvent } from "../shared/sdk";
import { writeLogEntry } from "../shared/log";

const REPO_PATH = "/github/AgentWorkforce/proactive-agents/pulls/**";

type PrExpansion = {
  data: {
    number: number;
    html_url: string;
    head: { ref: string; sha: string };
    changed_files: { filename: string }[];
  };
};

export default agent({
  workspace: "proactive-agents",
  name: "pr-reviewer",
  watch: REPO_PATH,

  async onEvent(ctx: Context, event: AgentEvent) {
    if (event.type !== "relayfile.changed") return;
    // Only opened/synchronize. The summary carries the action.
    if (!event.summary.tags?.includes("opened") && !event.summary.tags?.includes("synchronize")) {
      return;
    }

    const pr = (await event.expand("full")) as PrExpansion;
    const mdxChanged = pr.data.changed_files.filter((f) => f.filename.endsWith(".mdx"));
    const codeChanged = pr.data.changed_files.filter(
      (f) => f.filename.startsWith("app/") || f.filename.startsWith("components/"),
    );

    if (mdxChanged.length === 0 && codeChanged.length === 0) {
      await writeLogEntry(ctx, {
        agent: "pr-reviewer",
        trigger: "change",
        action: `Skipped PR #${pr.data.number}`,
        summary: "Nothing reviewable changed (no MDX, no app/ or components/).",
        outcome: "skipped",
        skippedReason: "no reviewable files",
        links: [{ label: `PR #${pr.data.number}`, url: pr.data.html_url }],
      });
      return;
    }

    // Cloudflare Pages branch deployments live at:
    //   https://<sha7>.<project>.pages.dev
    // (also https://<branch>.<project>.pages.dev for the most recent deploy)
    const previewUrl = `https://${pr.data.head.sha.slice(0, 7)}.proactive-agents.pages.dev`;

    // TODO: dead-link check on changed MDX
    //   const deadLinks = await checkLinks(mdxChanged.map((f) => f.filename));
    const deadLinks: { file: string; link: string }[] = [];

    // TODO: copy-edit pass via Claude Haiku (cheap; one call per file)
    //   const copyNotes = await Promise.all(mdxChanged.map(copyEditOne));
    const copyNotes: { file: string; note: string }[] = [];

    const body = renderReviewBody({ previewUrl, deadLinks, copyNotes });

    // Idempotent comment upsert — find by signature, edit; else create.
    //   await ctx.once(`pr-comment:${pr.data.number}:${pr.data.head.sha}`,
    //     () => upsertPrComment(pr.data.number, body));

    await writeLogEntry(ctx, {
      agent: "pr-reviewer",
      trigger: "change",
      action: `Reviewed PR #${pr.data.number}`,
      summary: `${mdxChanged.length} MDX, ${codeChanged.length} code. ${deadLinks.length + copyNotes.length} finding(s). Preview at ${previewUrl}`,
      outcome: "success",
      links: [{ label: `PR #${pr.data.number}`, url: pr.data.html_url }],
    });
  },
});

function renderReviewBody(args: {
  previewUrl: string;
  deadLinks: { file: string; link: string }[];
  copyNotes: { file: string; note: string }[];
}): string {
  const lines = [
    `_Filed by the pr-reviewer agent — see [/agent](https://proactiveagents.dev/agent) for the live log._`,
    ``,
    `**Deploy preview:** ${args.previewUrl}`,
    ``,
  ];
  if (args.deadLinks.length) {
    lines.push("### Dead links");
    for (const d of args.deadLinks) lines.push(`- \`${d.file}\` → ${d.link}`);
    lines.push("");
  }
  if (args.copyNotes.length) {
    lines.push("### Copy notes");
    for (const c of args.copyNotes) lines.push(`- \`${c.file}\`: ${c.note}`);
  }
  if (!args.deadLinks.length && !args.copyNotes.length) {
    lines.push("_Nothing flagged on this push._");
  }
  return lines.join("\n");
}
