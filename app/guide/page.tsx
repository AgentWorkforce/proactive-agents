import Link from "next/link";
import { Squiggle, Asterism } from "@/components/decorations";
import {
  jsonLd,
  breadcrumbSchema,
  faqSchema,
  howToSchema,
  definedTermSchema,
  personSchema,
  SITE_URL,
  SITE_NAME,
} from "@/lib/seo";

export const metadata = {
  title: "What Are Proactive Agents? The Definitive Guide",
  description:
    "A proactive agent is an AI agent that acts without being prompted. Learn the three triggers (time, change, message), the architecture that makes agents proactive, and how to build one — with code examples and comparisons to reactive agents.",
  alternates: { canonical: `${SITE_URL}/guide/` },
  openGraph: {
    title: "What Are Proactive Agents? The Definitive Guide",
    description:
      "Complete guide to proactive AI agents: definition, architecture, three triggers, reactive vs proactive comparison, and how to build them.",
    url: `${SITE_URL}/guide/`,
    type: "article",
  },
  twitter: {
    card: "summary_large_image",
    title: "What Are Proactive Agents? The Definitive Guide",
    description:
      "Complete guide to proactive AI agents — definition, architecture, and how to build them.",
  },
};

const GUIDE_FAQ = [
  {
    question: "Is a cron job the same as a proactive agent?",
    answer:
      "No. A cron job only uses one trigger (time). A proactive agent combines time-based schedules with change-based triggers (webhooks) and message-based triggers (inbox), plus persistent state and durability. A cron job is one primitive; a proactive agent wires all three together.",
  },
  {
    question: "Do I need a specific framework to build proactive agents?",
    answer:
      "No. Proactive agents are defined by their architecture (how they wake up and maintain state), not by a specific framework. You can build them with any language or agent SDK. The key requirements are push-based triggers, persistent state between runs, and durability guarantees like checkpointing and idempotency.",
  },
  {
    question: "Can a single agent be proactive, or does it require multiple agents?",
    answer:
      "A single agent can be fully proactive. Multi-agent systems are a second-order benefit that emerges naturally when agents share state, but the core concept applies to a single agent that listens for time, change, and message triggers.",
  },
  {
    question: "What is the biggest challenge in building proactive agents?",
    answer:
      "State management between wake-ups. Most agents wake up amnesiac — they don't remember what they saw or did last time. Building persistent, conflict-aware state that survives across triggers is the hardest engineering problem, followed by calibrated restraint (knowing when NOT to act).",
  },
];

const HOW_TO_STEPS = [
  {
    name: "Define your triggers",
    text: "Identify which of the three triggers your agent needs: time (schedules/intervals), change (data mutations from external systems via webhooks), and message (human or system communication). Most useful agents need at least two.",
  },
  {
    name: "Set up push-based wake-ups",
    text: "Replace polling loops with event-driven triggers. For time, use a durable scheduler (cron, cloud scheduler, or a task queue with delayed delivery). For change, register webhooks with providers and handle signature verification, ack-and-enqueue, and deduplication. For messages, set up an async inbox.",
  },
  {
    name: "Implement persistent state",
    text: "Give the agent a durable store for what it saw and did between runs. Options range from a simple key-value store to a real-time database with change feeds. The key requirement is that state survives restarts and concurrent writes are handled safely.",
  },
  {
    name: "Add durability guarantees",
    text: "Add checkpointing so the agent resumes after failure instead of restarting from scratch. Make external calls idempotent to prevent repeated actions. Add spend tracking to catch runaway loops. Scope authentication so a misbehaving agent cannot access resources beyond its role.",
  },
  {
    name: "Write the agent logic",
    text: "Once the infrastructure handles triggers, state, and recovery, the agent's core logic is small: receive a trigger event, check state, decide whether to act, perform the action, update state. The decision logic — including when NOT to act — is where the real complexity lives.",
  },
];

export default function GuidePage() {
  const guideCrumbs = breadcrumbSchema([
    { name: "Home", url: `${SITE_URL}/` },
    { name: "Guide", url: `${SITE_URL}/guide/` },
  ]);

  const guideArticle = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: "What Are Proactive Agents? The Definitive Guide",
    description:
      "A proactive agent is an AI agent that acts without being prompted. This guide covers the definition, architecture, three triggers, and how to build proactive agents.",
    author: personSchema(),
    datePublished: "2026-05-11",
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `${SITE_URL}/guide/`,
    },
    url: `${SITE_URL}/guide/`,
    inLanguage: "en-US",
    isAccessibleForFree: true,
  };

  return (
    <article className="relative mx-auto max-w-3xl px-5 py-14 sm:px-8 sm:py-28">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLd(guideArticle) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLd(guideCrumbs) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLd(faqSchema(GUIDE_FAQ)) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLd(
            howToSchema(
              "How to Build a Proactive Agent",
              "Step-by-step guide to building an AI agent that acts without being prompted, using time, change, and message triggers with persistent state and durability.",
              HOW_TO_STEPS
            )
          ),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLd(
            definedTermSchema(
              "Proactive Agent",
              "An AI agent that acts without being prompted — it wakes itself up when time passes, data changes, or a message arrives, rather than waiting for a human to invoke it. Defined by three triggers (time, change, message) combined with persistent state and durability."
            )
          ),
        }}
      />

      {/* Breadcrumb nav */}
      <nav aria-label="Breadcrumb" className="mb-8">
        <ol className="flex items-center gap-1.5 text-xs text-ink-faint">
          <li>
            <Link href="/" className="hover:text-terracotta transition-colors">Home</Link>
          </li>
          <li aria-hidden>/</li>
          <li className="text-ink-soft" aria-current="page">Guide</li>
        </ol>
      </nav>

      {/* Header */}
      <header>
        <p className="text-xs uppercase tracking-[0.3em] text-ink-soft">
          The definitive guide
        </p>
        <h1 className="mt-4 font-display text-[clamp(2.2rem,7vw,4.5rem)] leading-[1.04] tracking-tight text-ink">
          What are{" "}
          <span className="italic text-terracotta">proactive agents?</span>
        </h1>
        <Squiggle className="mt-6 h-3 w-40 opacity-70" />
        <p className="mt-6 max-w-2xl font-serif text-lg leading-relaxed text-ink-soft sm:mt-8 sm:text-xl">
          A proactive agent is an AI agent that acts without being prompted.
          Instead of waiting for a human to type a command, it wakes itself up
          when time passes, data changes, or a message arrives &mdash; and
          decides whether and how to act.
        </p>
        <p className="mt-4 max-w-2xl font-serif text-lg leading-relaxed text-ink-faint">
          This guide covers the definition, architecture, how proactive agents
          differ from reactive agents, and how to build one. It draws from
          production experience and{" "}
          <a
            href="https://arxiv.org/abs/2410.12361"
            className="text-terracotta underline decoration-terracotta/40 underline-offset-4 hover:decoration-terracotta"
            rel="noopener noreferrer"
          >
            published research
          </a>
          .
        </p>
      </header>

      {/* Table of Contents */}
      <nav className="mt-12 rounded-2xl border border-rule bg-paper-deep/40 p-6" aria-label="Table of contents">
        <p className="font-display text-xs uppercase tracking-[0.22em] text-ink-faint">
          In this guide
        </p>
        <ol className="mt-4 space-y-2 font-serif text-[1rem] text-ink-soft">
          <li>
            <a href="#definition" className="hover:text-terracotta transition-colors">1. Definition: What makes an agent proactive</a>
          </li>
          <li>
            <a href="#three-triggers" className="hover:text-terracotta transition-colors">2. The three triggers</a>
          </li>
          <li>
            <a href="#reactive-vs-proactive" className="hover:text-terracotta transition-colors">3. Reactive vs proactive: a side-by-side comparison</a>
          </li>
          <li>
            <a href="#three-primitives" className="hover:text-terracotta transition-colors">4. The three primitives every proactive agent needs</a>
          </li>
          <li>
            <a href="#how-to-build" className="hover:text-terracotta transition-colors">5. How to build a proactive agent</a>
          </li>
          <li>
            <a href="#when-reactive" className="hover:text-terracotta transition-colors">6. When reactive is still the right choice</a>
          </li>
          <li>
            <a href="#guide-faq" className="hover:text-terracotta transition-colors">7. FAQ</a>
          </li>
        </ol>
      </nav>

      {/* Content */}
      <div className="prose-essay mt-16">
        <section id="definition">
          <h2>1. Definition: What makes an agent proactive</h2>
          <p>
            <strong>A proactive agent is an AI agent that acts without being prompted.</strong>{" "}
            It watches its environment, notices when something changes, and decides
            whether and how to respond. The defining characteristic is{" "}
            <em>how it wakes up</em>, not what model it runs or what framework it
            uses.
          </p>
          <p>
            Most AI agents today are reactive: they receive a prompt, execute a
            chain of tool calls, return a response, and go back to sleep. The whole
            cycle starts when a human pushes a button. A proactive agent inverts
            this relationship. It is always running in the background &mdash;
            watching the world and acting when the moment is right.
          </p>
          <p>
            The term appears in a{" "}
            <a href="https://arxiv.org/abs/2410.12361" rel="noopener noreferrer">
              2024 paper from Tsinghua and Huawei
            </a>{" "}
            (&ldquo;Proactive Agent: Shifting LLM Agents from Reactive Responses to
            Active Assistance&rdquo;), which formalizes the same five claims we
            ended up with independently: push beats poll, persistent state is
            non-negotiable, shared environmental state is the coordination
            primitive, calibrated restraint is the hard problem, and
            multi-candidate fan-out beats single proposals.
          </p>
        </section>

        <section id="three-triggers">
          <h2>2. The three triggers</h2>
          <p>
            A proactive agent is defined by how it wakes up. There are exactly three
            triggers:
          </p>
          <ol>
            <li>
              <strong>Time.</strong> The agent runs on a schedule or interval &mdash;
              every 15 minutes, every Monday at 9am, every quiet hour past midnight.
              This is the simplest trigger but the least differentiated. A schedule
              alone is just a cron job.
            </li>
            <li>
              <strong>Change.</strong> The agent watches for data mutations. A ticket
              moves in Linear, a record updates in Salesforce, a file appears in a
              shared drive. The agent receives a push event (via webhook) the moment
              the change happens, rather than polling for it on an interval.
            </li>
            <li>
              <strong>Message.</strong> Someone addresses the agent directly &mdash;
              a human, another agent, or a system. The agent responds in its own
              time, not on a polling cycle.
            </li>
          </ol>
          <p>
            A truly proactive agent listens for all three. Pick one and you have
            made a smarter cron job. Pick two and you have made a chatbot that polls.
            The composition of all three is what makes an agent genuinely proactive.
          </p>
        </section>

        <section id="reactive-vs-proactive">
          <h2>3. Reactive vs proactive: a side-by-side comparison</h2>

          <div className="full-bleed my-10 overflow-x-auto">
            <table className="w-full text-left font-serif text-[0.95rem]">
              <thead>
                <tr className="border-b border-rule">
                  <th className="py-3 pr-4 font-display text-sm uppercase tracking-[0.2em] text-ink-faint">Dimension</th>
                  <th className="py-3 pr-4 font-display text-sm uppercase tracking-[0.2em] text-ink-faint">Reactive agent</th>
                  <th className="py-3 font-display text-sm uppercase tracking-[0.2em] text-terracotta">Proactive agent</th>
                </tr>
              </thead>
              <tbody className="text-ink-soft">
                <tr className="border-b border-rule/50">
                  <td className="py-3 pr-4 font-medium text-ink">Activation</td>
                  <td className="py-3 pr-4">Waits to be called</td>
                  <td className="py-3">Wakes itself up</td>
                </tr>
                <tr className="border-b border-rule/50">
                  <td className="py-3 pr-4 font-medium text-ink">Data freshness</td>
                  <td className="py-3 pr-4">Polls on interval (N seconds stale)</td>
                  <td className="py-3">Push events (real-time)</td>
                </tr>
                <tr className="border-b border-rule/50">
                  <td className="py-3 pr-4 font-medium text-ink">State</td>
                  <td className="py-3 pr-4">Stateless between runs</td>
                  <td className="py-3">Persistent memory across wake-ups</td>
                </tr>
                <tr className="border-b border-rule/50">
                  <td className="py-3 pr-4 font-medium text-ink">Failure mode</td>
                  <td className="py-3 pr-4">Forgets what it did</td>
                  <td className="py-3">Checkpoints and resumes</td>
                </tr>
                <tr>
                  <td className="py-3 pr-4 font-medium text-ink">Architecture</td>
                  <td className="py-3 pr-4">Function called by a user</td>
                  <td className="py-3">Participant in a system</td>
                </tr>
              </tbody>
            </table>
          </div>

          <p>
            The reactive agent asks: <em>&ldquo;What changed in the last five
            minutes?&rdquo;</em> The proactive agent asks: <em>&ldquo;What just
            changed?&rdquo;</em> The first is a query you have to invent. The second
            is a fact the world hands you.
          </p>
          <p>
            For a detailed code comparison of the same agent built both ways, see{" "}
            <Link
              href="/posts/reactive-vs-proactive/"
              className="text-terracotta underline decoration-terracotta/40 underline-offset-4 hover:decoration-terracotta"
            >
              Reactive vs proactive, with examples
            </Link>
            .
          </p>
        </section>

        <section id="three-primitives">
          <h2>4. The three primitives every proactive agent needs</h2>
          <p>
            A proactive agent requires three primitives wired together:
          </p>
          <h3>Primitive 1: A wake-up mechanism</h3>
          <p>
            The agent needs a <strong>clock</strong> (schedules and intervals), a{" "}
            <strong>listener</strong> (normalized change events from providers), and
            an <strong>inbox</strong> (messages from humans and systems). Reactive
            agents only honor the third, and they don&rsquo;t even honor it well
            &mdash; they wait to be invoked, not to be spoken to.
          </p>

          <h3>Primitive 2: Persistent state</h3>
          <p>
            The agent needs a place to remember what it saw and did between runs.
            Without persistent state, every wake-up is a cold start and the agent
            repeats the same work. Whatever store you choose &mdash; key-value,
            document database, real-time sync layer &mdash; it needs to support
            fast reads and writes, handle concurrent access safely, and ideally
            emit change events when state mutates.
          </p>

          <h3>Primitive 3: Durability</h3>
          <p>
            A proactive agent is long-lived. It runs while you sleep, while deploys
            ship, while providers rate-limit. The runtime must assume failure is the
            steady state. This means:
          </p>
          <ul>
            <li>Checkpointing &mdash; resume after failure, not restart</li>
            <li>Idempotency &mdash; prevent repeated external calls</li>
            <li>Spend observability &mdash; catch runaway loops</li>
            <li>Scoped authentication &mdash; limit blast radius per agent</li>
          </ul>
          <p>
            Together these three primitives form the infrastructure layer that
            sits underneath a proactive agent. You can build it yourself, adopt
            an existing runtime, or piece it together from cloud services &mdash;
            the important thing is that all three are present. For a deeper
            treatment, see{" "}
            <Link
              href="/posts/three-primitives/"
              className="text-terracotta underline decoration-terracotta/40 underline-offset-4 hover:decoration-terracotta"
            >
              Proactive agents need three primitives
            </Link>
            .
          </p>
        </section>

        <section id="how-to-build">
          <h2>5. How to build a proactive agent</h2>
          <p>
            Building a proactive agent is primarily an infrastructure problem, not a
            model problem. Here are the five steps:
          </p>
          <ol>
            {HOW_TO_STEPS.map((step) => (
              <li key={step.name}>
                <strong>{step.name}.</strong> {step.text}
              </li>
            ))}
          </ol>
          <p>
            The pattern that emerges: once the infrastructure handles triggers,
            state, and recovery, the agent&rsquo;s own code shrinks to a handler
            and decision logic. The hard part shifts from plumbing to behavior
            &mdash; teaching the agent <em>when not to act</em> is harder than
            wiring up the events.
          </p>

          <h3>Example: Reactive vs proactive ticket closer</h3>
          <p>
            Consider an agent that closes a support ticket when the customer&rsquo;s
            last reply contains approval. Here is the reactive version most teams
            ship:
          </p>
          <pre className="rounded-lg bg-ink/85 px-4 py-3 font-mono text-[13px] leading-relaxed text-paper overflow-x-auto">
            <code>{`// Reactive — runs every 5 min via cron
async function tick() {
  const tickets = await zendesk.search({
    status: "open",
    updated_since: lastRun,
  });
  for (const t of tickets) {
    if (containsApproval(t.lastCustomerReply)) {
      await zendesk.close(t.id);
    }
  }
  lastRun = Date.now();
}`}</code>
          </pre>
          <p>
            This works, but it polls on a made-up interval, the{" "}
            <code>lastRun</code> global resets on deploy, bursts overwhelm the
            next tick, and two instances racing cause double-closes.
          </p>
          <p>A proactive version inverts the flow:</p>
          <pre className="rounded-lg bg-ink/85 px-4 py-3 font-mono text-[13px] leading-relaxed text-paper overflow-x-auto">
            <code>{`// Proactive — fires on each webhook event
async function onTicketUpdated(event) {
  const { previous, current } = event;
  if (previous.status !== "open") return;

  if (containsApproval(current.lastCustomerReply)) {
    await zendesk.close(current.id);
  }
}`}</code>
          </pre>
          <p>
            The agent no longer polls &mdash; it receives each change as it
            happens. No batch, no interval, no <code>lastRun</code>. The event
            carries both previous and current state, so the agent sees the{" "}
            <em>transition</em>, not just a snapshot. Deduplication,
            ordering, and delivery become infrastructure concerns handled
            outside the agent&rsquo;s code. For a deeper walkthrough, see{" "}
            <Link
              href="/posts/reactive-vs-proactive/"
              className="text-terracotta underline decoration-terracotta/40 underline-offset-4 hover:decoration-terracotta"
            >
              Reactive vs proactive, with examples
            </Link>
            .
          </p>
        </section>

        <section id="when-reactive">
          <h2>6. When reactive is still the right choice</h2>
          <p>
            Reactive agents are not bad &mdash; they are appropriate for certain
            shapes of work:
          </p>
          <ul>
            <li>
              <strong>Batch-shaped jobs</strong> &mdash; &ldquo;every Monday
              morning, generate a digest&rdquo; &mdash; are reactive by design.
            </li>
            <li>
              <strong>Long compute</strong> that does not care about freshness
              &mdash; nightly backfills, weekly retraining runs.
            </li>
            <li>
              <strong>One-shot prompts</strong> &mdash; the user asks, the agent
              answers, done. Reactive is the only answer.
            </li>
          </ul>
          <p>
            What reactive is <em>not</em> appropriate for is anything where the
            value of the agent is its responsiveness to the world. If the
            agent&rsquo;s job is to notice things and act on them, polling will lose
            to push every time, on every metric you care about.
          </p>
        </section>

        <section id="guide-faq">
          <h2>7. Frequently asked questions</h2>
          <dl className="space-y-8">
            {GUIDE_FAQ.map((faq) => (
              <div key={faq.question}>
                <dt className="font-display text-lg leading-tight text-ink">
                  {faq.question}
                </dt>
                <dd className="mt-2 text-ink-soft">
                  {faq.answer}
                </dd>
              </div>
            ))}
          </dl>
        </section>
      </div>

      {/* Further reading */}
      <div className="mt-20 border-t border-rule pt-10">
        <p className="font-display text-xs uppercase tracking-[0.22em] text-ink-faint">
          Further reading
        </p>
        <ul className="mt-6 space-y-4">
          <li>
            <Link
              href="/posts/three-primitives/"
              className="group block"
            >
              <p className="font-display text-lg text-ink transition-colors group-hover:text-terracotta">
                Proactive agents need three primitives
              </p>
              <p className="mt-1 font-serif text-sm text-ink-soft">
                Deep dive into the clock, listener, and inbox that make up the proactive runtime.
              </p>
            </Link>
          </li>
          <li>
            <Link
              href="/posts/reactive-vs-proactive/"
              className="group block"
            >
              <p className="font-display text-lg text-ink transition-colors group-hover:text-terracotta">
                Reactive vs proactive, with examples
              </p>
              <p className="mt-1 font-serif text-sm text-ink-soft">
                The same agent built both ways — side-by-side code comparison.
              </p>
            </Link>
          </li>
          <li>
            <Link
              href="/posts/the-webhook-tax/"
              className="group block"
            >
              <p className="font-display text-lg text-ink transition-colors group-hover:text-terracotta">
                The eight-week webhook tax
              </p>
              <p className="mt-1 font-serif text-sm text-ink-soft">
                The real engineering cost of making an agent proactive against production providers.
              </p>
            </Link>
          </li>
          <li>
            <Link
              href="/agent/"
              className="group block"
            >
              <p className="font-display text-lg text-ink transition-colors group-hover:text-terracotta">
                Agent activity log
              </p>
              <p className="mt-1 font-serif text-sm text-ink-soft">
                See real proactive agents running this site — with verifiable receipts.
              </p>
            </Link>
          </li>
        </ul>
      </div>

      <div className="mt-16 flex justify-center">
        <Asterism className="h-4 opacity-70" />
      </div>
    </article>
  );
}
