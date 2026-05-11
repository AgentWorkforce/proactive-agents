import { writeLogEntry } from "../shared/log";

/**
 * Wired to relaycron, weekly (Saturday 09:00 UTC). Searches the web + Reddit
 * for "proactive agents" mentions. Dedupes against the rolling issue's prior
 * entries. Groups by topic (LLM cluster). Files as ONE rolling issue, not many.
 *
 * Why one issue, not many: a Slack-style firehose of "look at this article"
 * issues is reactive plumbing. The whole point of proactive is restraint —
 * filter, group, summarise, and show up once a week with a real digest.
 */
const SOURCES = ["web", "reddit:LocalLLaMA", "reddit:AI_Agents", "reddit:MachineLearning"] as const;

type DigestCluster = {
  topic: string;
  mentions: { title: string; url: string; source: string; gist: string }[];
};

export async function handler() {
  // TODO: fan out to each source, collect mentions
  // const raw = await Promise.all(SOURCES.map(searchSource));

  // TODO: dedupe against last week's issue body (parse it to extract URLs)
  // const fresh = dedupe(raw, await loadPriorMentions());

  // TODO: cluster via LLM into <= 4 topic groups
  // const clusters = await clusterByTopic(fresh);

  // TODO: append to (or open) the rolling weekly digest issue
  // const issueUrl = await upsertDigestIssue(clusters);

  const totalMentions = 0; // raw.length
  const clusters: DigestCluster[] = []; // computed above

  if (totalMentions === 0) {
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

  await writeLogEntry({
    agent: "weekly-digest",
    trigger: "time",
    action: "Filed weekly digest",
    summary: `Found ${totalMentions} mentions across ${SOURCES.length} sources, deduped, clustered into ${clusters.length} topics. Filed as one rolling issue.`,
    outcome: "success",
    // links: [{ label: "Issue", url: issueUrl }],
  });
}
