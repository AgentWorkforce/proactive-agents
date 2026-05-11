/**
 * @manual chatbot — MESSAGE trigger.
 *
 * Listens to DMs and the #manual channel. Answers questions about proactive
 * agents grounded in the published essays (RAG over content/posts/*.mdx).
 *
 * Restraint matters here more than anywhere else. False answers cost trust
 * faster than honest "don't knows". The agent refuses (politely, logged) when:
 *   - the question isn't on-topic
 *   - the corpus has no chunk above the relevance threshold
 */
import { agent, type Context, type AgentEvent } from "../shared/sdk";
import { writeLogEntry } from "../shared/log";

const RELEVANCE_THRESHOLD = 0.7;

type MessageExpansion = {
  data: {
    text: string;
    threadId?: string;
    channel: string;
    user: { id: string; displayName?: string };
  };
};

export default agent({
  workspace: "proactive-agents",
  name: "manual-chatbot",
  inbox: ["@self", "#manual"],

  async onEvent(ctx: Context, event: AgentEvent) {
    if (event.type !== "relaycast.message") return;

    const msg = (await event.expand("full")) as MessageExpansion;
    const question = msg.data.text;

    // 1. Cheap intent classification: is this about proactive agents?
    //    Use a small Claude Haiku call with a tight rubric.
    //    TODO: implement isOnTopic(question)
    const onTopic = true;

    if (!onTopic) {
      await polite("Sorry — I only answer questions about proactive agents. Try reframing?");
      await writeLogEntry(ctx, {
        agent: "manual-chatbot",
        trigger: "message",
        action: "Refused — off topic",
        summary: `${msg.data.user.displayName ?? msg.data.user.id} asked "${preview(question)}". Off topic; refused.`,
        outcome: "skipped",
        skippedReason: "off-topic",
      });
      return;
    }

    // 2. Retrieve top-K chunks from the published corpus.
    //    The corpus is content/posts/*.mdx, indexed at deploy time into a
    //    small embeddings file at /_internal/manual-chatbot/index.json.
    //    TODO: implement retrieveCorpus(question, topK)
    const chunks: { slug: string; title: string; text: string; score: number }[] = [];

    if (chunks.length === 0 || chunks[0].score < RELEVANCE_THRESHOLD) {
      await polite(
        `I couldn't find a confident answer in the published essays. Either the topic isn't covered yet, or the question phrasing doesn't match what's there. Try the [essays index](https://proactiveagents.dev/posts) directly?`,
      );
      await writeLogEntry(ctx, {
        agent: "manual-chatbot",
        trigger: "message",
        action: "Refused — low confidence",
        summary: `${msg.data.user.displayName ?? msg.data.user.id} asked "${preview(question)}". Top chunk score ${chunks[0]?.score ?? 0} < threshold ${RELEVANCE_THRESHOLD}. Refused.`,
        outcome: "skipped",
        skippedReason: "low confidence",
      });
      return;
    }

    // 3. Draft an answer with inline citations.
    //    TODO: implement draftAnswer(question, chunks) — Claude Sonnet,
    //    instructed to cite as [link text](/posts/<slug>) inline.
    const answer = "TODO";

    await ctx.messages.reply(msg.data.threadId ?? msg.data.channel, answer);

    await writeLogEntry(ctx, {
      agent: "manual-chatbot",
      trigger: "message",
      action: `Answered ${msg.data.channel}`,
      summary: `${msg.data.user.displayName ?? msg.data.user.id} asked "${preview(question)}". Answered with ${chunks.length} citation(s).`,
      outcome: "success",
      links: chunks.slice(0, 3).map((c) => ({ label: c.title, url: `/posts/${c.slug}` })),
    });

    async function polite(text: string) {
      await ctx.messages.reply(msg.data.threadId ?? msg.data.channel, text);
    }
  },
});

function preview(s: string): string {
  return s.length > 80 ? s.slice(0, 80) + "…" : s;
}
