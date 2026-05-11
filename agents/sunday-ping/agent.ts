/**
 * Sunday ping agent — TIME trigger.
 *
 * Sundays at 09:00 in Khaliq's timezone. The point isn't "remember to write" —
 * it's "the work is already started for you." Reads the latest weekly digest,
 * picks the strongest narrative thread via the model, drafts an outline,
 * pings on Slack with two action buttons.
 */
import { agent, type Context } from "../shared/sdk";
import { writeLogEntry } from "../shared/log";

export default agent({
  workspace: "proactive-agents",
  name: "sunday-ping",
  schedule: { cron: "0 9 * * 0", tz: "America/New_York" },

  async onEvent(ctx: Context, event) {
    if (event.type !== "cron.tick") return;

    // 1. Find this week's digest issue (filed by weekly-digest the day before).
    //    TODO: octokit search by label `weekly-digest` + state `open`, take newest.
    //    const digest = await fetchLatestDigestIssue();
    const digest = { url: "", body: "" };

    if (!digest.body) {
      await writeLogEntry(ctx, {
        agent: "sunday-ping",
        trigger: "time",
        action: "Skipped — no digest",
        summary: "Could not find this week's weekly-digest issue. Was the digest agent quiet?",
        outcome: "skipped",
        skippedReason: "no digest",
      });
      return;
    }

    // 2. Ask the model for the strongest narrative thread + draft outline.
    //    Single Claude Sonnet call; output JSON: { angle, title, outline[] }.
    //    TODO: implement `draftFromDigest(digest.body)`
    const draft = { angle: "", title: "", outline: [] as string[] };

    // 3. DM Khaliq via relaycast.
    const text = renderSlackPing(draft, digest.url);
    const sent = await ctx.messages.dm("khaliq", text);

    await writeLogEntry(ctx, {
      agent: "sunday-ping",
      trigger: "time",
      action: "Sent Sunday ping",
      summary: `Drafted "${draft.title}" from this week's digest, posted to Slack with accept/redirect buttons.`,
      outcome: "success",
      links: [
        { label: "Slack message", url: `slack://message/${sent.id}` },
        { label: "Source digest", url: digest.url },
      ],
    });
  },
});

function renderSlackPing(
  draft: { angle: string; title: string; outline: string[] },
  digestUrl: string,
): string {
  return [
    `*Sunday outline draft*`,
    ``,
    `*Angle:* ${draft.angle}`,
    `*Working title:* ${draft.title}`,
    ``,
    ...draft.outline.map((s, i) => `${i + 1}. ${s}`),
    ``,
    `Source: ${digestUrl}`,
  ].join("\n");
}
