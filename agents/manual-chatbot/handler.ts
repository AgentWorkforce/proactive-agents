import { writeLogEntry } from "../shared/log";

/**
 * Wired to relaycast: any message addressed to @manual in our Slack workspace,
 * or sent to manual@proactiveagents.dev.
 *
 * Answers questions about proactive agents grounded in the published essays
 * (RAG over content/posts/*.mdx). Always cites the post(s) it's drawing from.
 *
 * Refuses (politely, with a log entry) when:
 *   - The question isn't about proactive agents / the runtime
 *   - The corpus has no matching answer (rather than hallucinate)
 *
 * "Calibrated restraint" is the hard part — see the home page argument.
 * False answers cost trust faster than honest "don't know"s.
 */
type InboxMessage = {
  channel: "slack" | "email";
  from: string;
  text: string;
  threadId?: string;
};

export async function handler(event: InboxMessage) {
  // TODO: cheap intent check — is this a question about proactive agents?
  // const onTopic = await isOnTopic(event.text);
  // if (!onTopic) { ...refuse politely, log skipped, return }

  // TODO: retrieve relevant chunks from content/posts/*.mdx
  // const chunks = await retrieveCorpusChunks(event.text, { topK: 4 });

  // TODO: if no chunk above threshold, refuse rather than hallucinate
  // if (chunks.length === 0 || chunks[0].score < THRESHOLD) { ...refuse, log skipped }

  // TODO: draft an answer with inline citations to /posts/<slug>
  // const answer = await draftAnswer(event.text, chunks);

  // TODO: reply via the source channel
  // await cast.reply({ channel: event.channel, threadId: event.threadId, text: answer });

  const cited: { slug: string; title: string }[] = []; // chunks.map(...)

  await writeLogEntry({
    agent: "manual-chatbot",
    trigger: "message",
    action: `Answered ${event.channel} message`,
    summary: `Question from ${event.from}: "${event.text.slice(0, 80)}${event.text.length > 80 ? "…" : ""}". Answered with ${cited.length} citation(s).`,
    outcome: "success",
    links: cited.map((c) => ({ label: c.title, url: `/posts/${c.slug}` })),
  });
}
