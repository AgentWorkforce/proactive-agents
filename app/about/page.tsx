import { Squiggle, Asterism } from "@/components/decorations";

export const metadata = {
  title: "About — Proactive Agents",
};

export default function AboutPage() {
  return (
    <article className="relative mx-auto max-w-2xl px-6 py-24 sm:px-8 sm:py-32">
      <p className="text-xs uppercase tracking-[0.3em] text-ink-soft">About</p>
      <h1 className="mt-4 font-display text-5xl leading-[1.05] tracking-tight text-ink sm:text-6xl">
        We build the runtime for <span className="italic text-terracotta">proactive agents.</span>
      </h1>
      <Squiggle className="mt-6 h-3 w-40 opacity-70" />

      <div className="prose-essay mt-10">
        <p>
          Proactive Agents is the developer-facing home of{" "}
          <a href="https://github.com/AgentWorkforce">AgentWorkforce</a>. We
          build the infrastructure that lets cloud agents act on their own
          &mdash; on schedules, on data changes, on inbound messages &mdash;
          without the team shipping the agent having to build the webhook
          plumbing, the queue, the state layer, or the durability ring.
        </p>

        <h2>What we make</h2>
        <p>
          A small constellation of repos that, together, form a proactive
          runtime. The clock is{" "}
          <code>relaycron</code>. The watcher is <code>relayfile</code>. The
          inbox is <code>relaycast</code>. The hosted control plane is{" "}
          <code>cloud</code>. The reference SDK we dogfood is{" "}
          <code>agent-assistant</code>. Around them sit{" "}
          <code>ricky</code> for durability, <code>burn</code> for spend
          guardrails, and <code>relayauth</code> for scoped tokens.
        </p>
        <p>
          You can use them together, or pick one. They&rsquo;re
          framework-agnostic &mdash; OpenAI, Anthropic, LangGraph, Mastra, your
          own &mdash; and language-agnostic where it matters. The wedge is
          push, persistence, and durability, not a particular SDK.
        </p>

        <h2>Who it&rsquo;s for</h2>
        <p>
          Teams shipping cloud agents <em>as a product.</em> If your agent runs
          on a customer&rsquo;s laptop, you don&rsquo;t need us &mdash; the
          local filesystem already does most of what we offer. If your agent
          runs in your cloud and acts on someone else&rsquo;s data, we are
          probably the cheapest version of the thing you would otherwise build
          for two months and then maintain forever.
        </p>

        <h2>Who it&rsquo;s not for</h2>
        <p>
          Visual workflow builders. No-code agent platforms. Internal G&amp;A
          ops automation for procurement, legal, or finance. Those are real
          markets, well-served by other vendors. We are deliberately
          developer-first.
        </p>

        <h2>How we work in public</h2>
        <p>
          The essays in this folio are how we think out loud. They&rsquo;re
          adapted from internal positioning docs, postmortems, and design
          discussions we&rsquo;d normally keep in PRs. We publish them because
          the developers we want to build with tend to think the same way and
          appreciate seeing the seams.
        </p>
        <p>
          New essays appear on the first Sunday of the month. Sometimes we miss
          a Sunday. We have stopped apologising for this.
        </p>
      </div>

      <div className="mt-16 flex justify-center">
        <Asterism className="h-4 opacity-70" />
      </div>
    </article>
  );
}
