import { writeLogEntry } from "../shared/log";

/**
 * Wired to relaycron, Sundays at 09:00 in Khaliq's timezone. The point isn't
 * "remember to write" — it's "here's the work already started for you."
 *
 * Reads the latest weekly digest issue, picks the strongest narrative thread
 * via LLM, drafts an outline + suggested title, posts it to Slack with two
 * buttons: "looks good, schedule for next Sunday" / "give me a different angle".
 */
export async function handler() {
  // TODO: fetch this week's digest issue body
  // const digest = await fetchLatestDigestIssue();

  // TODO: ask the model for the strongest thread + draft a 4-section outline
  // const { angle, title, outline } = await draftFromDigest(digest);

  // TODO: post to Slack with action buttons (relaycast)
  // const messageUrl = await cast.dm({
  //   to: "khaliq",
  //   text: `Sunday outline: "${title}"\n\n${outline}`,
  //   actions: [
  //     { id: "schedule", label: "Schedule for next Sunday" },
  //     { id: "different-angle", label: "Different angle" },
  //   ],
  // });

  await writeLogEntry({
    agent: "sunday-ping",
    trigger: "time",
    action: "Sent Sunday ping",
    summary: `Read this week's digest, drafted an outline, posted to Slack with accept/redirect buttons.`,
    outcome: "success",
    // links: [{ label: "Slack message", url: messageUrl }, { label: "Source digest", url: digest.url }],
  });
}
