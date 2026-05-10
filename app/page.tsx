import Link from "next/link";
import { getAllPosts, formatDate } from "@/lib/posts";
import { BackgroundOrbs } from "@/components/background-orbs";
import { ScrollReveal } from "@/components/scroll-reveal";
import { Squiggle, Asterism, Sparkle, Arrow, CornerBrackets } from "@/components/decorations";
import { CodeCard } from "@/components/code-card";

const ACCENT_BG: Record<string, string> = {
  peach: "bg-peach/60",
  butter: "bg-butter/60",
  sage: "bg-sage/60",
  lavender: "bg-lavender/60",
  rose: "bg-rose/60",
  sky: "bg-sky/60",
};

const TILTS = ["-1.4deg", "0.8deg", "-0.6deg", "1.2deg", "-0.9deg", "0.4deg"];

const PRIMITIVES = [
  {
    name: "relaycron",
    role: "the clock",
    accent: "butter",
    blurb: "Heartbeats and wakeups. Your agent runs every fifteen minutes — or at 09:00 in the customer's timezone, whichever you prefer.",
    snippet: 'cron.schedule("0 9 * * *", agent)',
  },
  {
    name: "relayfile",
    role: "the watcher",
    accent: "sage",
    blurb: "Normalised webhooks from Linear, GitHub, Jira, Slack, Notion. Your agent sees a file diff. Not a payload, not a signature.",
    snippet: 'file.on("change", agent)',
  },
  {
    name: "relaycast",
    role: "the inbox",
    accent: "lavender",
    blurb: "Push channel between agents and humans. Messages, replies, handoffs — without standing up your own Slack-shaped thing.",
    snippet: 'cast.on("message", agent)',
  },
];

const REPO_MAP: { old: string; now: string; repo: string }[] = [
  { old: "Scheduling service", now: "The clock", repo: "relaycron" },
  { old: "Integration filesystem", now: "The watcher", repo: "relayfile" },
  { old: "Agent comms / headless Slack", now: "The inbox", repo: "relaycast" },
  { old: "Hosted control plane", now: "The runtime + dashboard", repo: "cloud" },
  { old: "Proactive package", now: "First-class proactive primitives", repo: "agent-assistant" },
  { old: "Workflow reliability", now: "Durable repair / observation", repo: "ricky" },
  { old: "Token spend analytics", now: "Cost guardrails for always-on agents", repo: "burn" },
  { old: "Scoped tokens", now: "Auth model for long-running agents", repo: "relayauth" },
];

const USE_CASES = [
  {
    accent: "peach",
    title: "Support",
    body: "The customer replies. The ticket closes itself, before the next polling cycle would have noticed.",
  },
  {
    accent: "sage",
    title: "Coding",
    body: "The ticket scope changes mid-task. The agent pauses instead of finishing work that is now invalid.",
  },
  {
    accent: "lavender",
    title: "Sales",
    body: "A new deal lands in Salesforce. The contact is enriched while the rep is still on the intake call.",
  },
  {
    accent: "butter",
    title: "Incidents",
    body: "PagerDuty fires. The runbook starts the same second — not 60 seconds later when the poller wakes up.",
  },
];

export default async function Home() {
  const posts = await getAllPosts();
  const [featured, ...rest] = posts;

  return (
    <>
      <ScrollReveal />

      {/* HERO */}
      <section className="relative overflow-hidden">
        <BackgroundOrbs />
        <div className="relative mx-auto max-w-6xl px-6 pt-16 pb-32 sm:px-10 sm:pt-24 sm:pb-44">
          <div className="grid gap-10 lg:grid-cols-12">
            <div className="lg:col-span-8">
              <p className="flex items-center gap-3 text-xs uppercase tracking-[0.3em] text-ink-soft">
                <span className="h-px w-10 bg-ink-soft/60" />
                A field manual · Vol I
              </p>
              <h1 className="mt-6 font-display text-[clamp(3.25rem,8.4vw,7rem)] leading-[0.94] tracking-tight text-ink">
                Agents that
                <br />
                <span className="italic text-terracotta">don&rsquo;t wait</span>
                <br />
                to be asked.
              </h1>
              <p className="mt-10 max-w-xl font-serif text-xl leading-relaxed text-ink-soft">
                <span className="scribble-highlight">Proactive Agents</span> is
                the runtime for agents that act on their own &mdash; schedules,
                triggers, watchers, durable wake/sleep. Framework-agnostic.
                Built for developers shipping cloud agents, not visual builders
                for non-coders.
              </p>

              <div className="mt-12 flex flex-wrap items-center gap-6">
                <Link
                  href="#three-primitives"
                  className="group inline-flex items-center gap-3 rounded-full bg-ink px-6 py-3 text-sm font-medium tracking-wide text-paper transition-transform hover:-translate-y-0.5"
                >
                  See the three primitives
                  <span aria-hidden className="transition-transform group-hover:translate-x-1">
                    →
                  </span>
                </Link>
                <Link
                  href={`/posts/${featured?.slug ?? ""}`}
                  className="group inline-flex items-center gap-2 text-sm font-medium tracking-wide text-ink hover:text-terracotta"
                >
                  Read the manifesto
                  <span aria-hidden className="transition-transform group-hover:translate-x-1">
                    →
                  </span>
                </Link>
              </div>

              <div className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-3 text-sm text-ink-soft">
                <span className="flex items-center gap-2">
                  <Sparkle className="h-3 w-3" /> Works with OpenAI, Anthropic, LangGraph, Mastra
                </span>
              </div>
            </div>

            {/* From the team card */}
            <aside className="lg:col-span-4 lg:pl-6">
              <div className="tilt relative" style={{ "--tilt": "1.6deg" } as React.CSSProperties}>
                <div className="rounded-2xl border border-rule bg-paper-deep/60 p-6 shadow-[0_24px_60px_-30px_rgba(42,37,33,0.35)] backdrop-blur-sm">
                  <p className="font-display text-sm uppercase tracking-[0.22em] text-terracotta">
                    From the team
                  </p>
                  <p className="mt-3 font-serif text-[1.05rem] leading-relaxed text-ink">
                    &ldquo;We spent six months building the same webhook
                    pipeline at three companies. Then we built it once,
                    properly, and put it under every agent we could find.&rdquo;
                  </p>
                  <div className="mt-5 flex items-center gap-3">
                    <div className="h-9 w-9 rounded-full bg-gradient-to-br from-peach via-rose to-lavender" />
                    <div>
                      <p className="font-display text-sm text-ink">AgentWorkforce</p>
                      <p className="text-xs text-ink-faint">The team behind the runtime</p>
                    </div>
                  </div>
                </div>
                <Asterism className="absolute -bottom-8 left-6 h-4 opacity-70" />
              </div>
            </aside>
          </div>

          {/* Scroll cue */}
          <div className="mt-24 flex items-end gap-3 text-ink-faint">
            <Arrow className="h-10 w-16 -rotate-12 opacity-60" color="#8a7f74" />
            <span className="font-display italic text-lg">keep going &mdash; the good part is below</span>
          </div>
        </div>
      </section>

      {/* REACTIVE vs PROACTIVE */}
      <section className="relative">
        <div className="mx-auto max-w-6xl px-6 sm:px-10">
          <div className="reveal">
            <p className="font-display text-sm uppercase tracking-[0.28em] text-ink-soft">
              ✦ The shift
            </p>
            <h2 className="mt-3 max-w-3xl font-display text-[clamp(2.2rem,5vw,3.6rem)] leading-[1.05] tracking-tight text-ink">
              Most agents wait to be prompted. <span className="italic text-terracotta">A proactive one already handled it.</span>
            </h2>
          </div>

          <div className="mt-14 grid gap-8 md:grid-cols-2">
            <div className="reveal">
              <div className="rounded-3xl border border-rule bg-paper-deep/40 p-8 sm:p-10">
                <p className="font-display text-xs uppercase tracking-[0.22em] text-ink-faint">
                  Reactive
                </p>
                <h3 className="mt-3 font-display text-3xl text-ink">Wakes up when you call.</h3>
                <ul className="mt-6 space-y-3 font-serif text-[1.02rem] leading-relaxed text-ink-soft">
                  <li>— Polls every N seconds. Always acting on stale state.</li>
                  <li>— Forgets between runs. Re-reads the world from scratch.</li>
                  <li>— Finishes work that is no longer relevant.</li>
                  <li>— You build the webhook plumbing under it.</li>
                </ul>
              </div>
            </div>
            <div className="reveal">
              <div className="relative overflow-hidden rounded-3xl border border-terracotta/40 bg-gradient-to-br from-peach/60 via-butter/40 to-rose/40 p-8 sm:p-10">
                <CornerBrackets className="absolute right-5 top-5 h-9 w-9 opacity-60" />
                <p className="font-display text-xs uppercase tracking-[0.22em] text-terracotta">
                  Proactive
                </p>
                <h3 className="mt-3 font-display text-3xl text-ink">Wakes up because the world changed.</h3>
                <ul className="mt-6 space-y-3 font-serif text-[1.02rem] leading-relaxed text-ink">
                  <li>— Push, not poll. Acts the moment a record changes.</li>
                  <li>— Persistent state per session. Knows what it saw last time.</li>
                  <li>— Stops mid-task when the premise stops being true.</li>
                  <li>— You write the agent. The runtime brings the triggers.</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* THREE PRIMITIVES */}
      <section id="three-primitives" className="relative mt-32 sm:mt-44">
        <div className="mx-auto max-w-6xl px-6 sm:px-10">
          <div className="reveal flex items-baseline justify-between border-b border-rule pb-3">
            <h2 className="font-display text-sm uppercase tracking-[0.28em] text-ink-soft">
              ✦ The triple
            </h2>
            <span className="text-xs uppercase tracking-[0.22em] text-ink-faint">
              clock · watcher · inbox
            </span>
          </div>

          <p className="reveal mt-10 max-w-2xl font-serif text-xl leading-relaxed text-ink-soft">
            A proactive agent is one with three primitives wired together.
            Anyone selling one without the other two is selling cron with an
            LLM.
          </p>

          <ul className="mt-14 grid gap-8 md:grid-cols-3">
            {PRIMITIVES.map((p, i) => (
              <li key={p.name} className="reveal">
                <div
                  className={`tilt rounded-3xl ${ACCENT_BG[p.accent]} relative overflow-hidden p-7`}
                  style={{ "--tilt": TILTS[i] } as React.CSSProperties}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-transparent to-transparent" />
                  <div className="relative">
                    <p className="font-mono text-xs uppercase tracking-[0.22em] text-ink/80">
                      {p.role}
                    </p>
                    <h3 className="mt-3 font-display text-3xl text-ink">{p.name}</h3>
                    <p className="mt-4 font-serif text-[1rem] leading-relaxed text-ink/85">
                      {p.blurb}
                    </p>
                    <pre className="mt-6 overflow-x-auto rounded-xl bg-ink/85 px-4 py-3 font-mono text-[12.5px] leading-relaxed text-paper">
                      <code>{p.snippet}</code>
                    </pre>
                  </div>
                </div>
              </li>
            ))}
          </ul>

          <p className="reveal mt-10 max-w-2xl font-serif text-base leading-relaxed text-ink-soft">
            Add{" "}
            <span className="font-display italic">durability</span> &mdash;{" "}
            <span className="font-mono text-[0.92em] text-plum">cloud</span>,{" "}
            <span className="font-mono text-[0.92em] text-plum">ricky</span>,{" "}
            <span className="font-mono text-[0.92em] text-plum">burn</span>,{" "}
            <span className="font-mono text-[0.92em] text-plum">relayauth</span>{" "}
            &mdash; and you have the runtime. Wake, work, sleep, repair,
            observe spend.
          </p>
        </div>
      </section>

      {/* CODE: BEFORE / AFTER */}
      <section className="relative mt-32 sm:mt-44">
        <div className="mx-auto max-w-6xl px-6 sm:px-10">
          <div className="reveal">
            <p className="font-display text-sm uppercase tracking-[0.28em] text-ink-soft">
              ✦ Eight weeks, or one afternoon
            </p>
            <h2 className="mt-3 max-w-3xl font-display text-[clamp(2rem,4.6vw,3.2rem)] leading-[1.05] tracking-tight text-ink">
              The webhook tax, paid once.
            </h2>
            <p className="mt-6 max-w-2xl font-serif text-lg leading-relaxed text-ink-soft">
              Adding a single proactive trigger from a single provider, the
              honest way:
            </p>
          </div>

          <div className="mt-10 grid gap-8 lg:grid-cols-2">
            <div className="reveal">
              <CodeCard label="Without the runtime" filename="server.ts" tone="paper">
{`app.post("/webhooks/linear",
  express.raw({ type: "*/*" }),
  async (req, res) => {
    // 1. verify HMAC-SHA256
    const sig = req.headers["x-linear-signature"];
    const expected = crypto
      .createHmac("sha256", SECRET)
      .update(req.body)
      .digest("hex");
    if (!safeEqual(sig, expected)) return res.sendStatus(401);

    // 2. respond < 2s or Linear retries for 2 hours
    res.sendStatus(200);

    // 3. enqueue — never process inline
    await queue.add("linear", { body: req.body });
  });

// elsewhere:
queue.process(async (job) => {
  // 4. dedupe
  // 5. filter event types
  // 6. fetch current state (payload is partial)
  // 7. load agent context
  // 8. trigger agent
});`}
              </CodeCard>
              <p className="mt-2 text-sm text-ink-faint">
                Now do it again for GitHub, Jira, Slack, Notion. Each with a
                different signature scheme, retry window, and partial-payload
                quirk.
              </p>
            </div>
            <div className="reveal">
              <CodeCard label="With the runtime" filename="agent.ts" tone="ink">
{`import { RelayFileSync } from "@relayfile/sdk";

const sync = new RelayFileSync({
  workspace: "acme/ops",
  token: process.env.RELAYFILE_TOKEN!,
});

sync.on("change", async (file) => {
  // file.path           "/linear/issues/ENG-412.json"
  // file.previous       { status: "in_review" }
  // file.current        { status: "blocked", … }
  // file.source         "linear.issue.updated"
  await agent.handle(file);
});`}
              </CodeCard>
              <p className="mt-2 text-sm text-ink-faint">
                Endpoints, signatures, dedupe, ordering, registration,
                normalisation &mdash; handled. Add a provider with a config
                line.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* REPO MAP */}
      <section className="relative mt-32 sm:mt-44">
        <div className="mx-auto max-w-6xl px-6 sm:px-10">
          <div className="reveal flex items-baseline justify-between border-b border-rule pb-3">
            <h2 className="font-display text-sm uppercase tracking-[0.28em] text-ink-soft">
              ✦ The map
            </h2>
            <span className="text-xs uppercase tracking-[0.22em] text-ink-faint">
              we relabelled, not rebuilt
            </span>
          </div>

          <p className="reveal mt-10 max-w-2xl font-serif text-lg leading-relaxed text-ink-soft">
            Every repo we already had has a job in the proactive runtime.
            Nothing about the underlying code changed. The names finally tell
            the truth.
          </p>

          <div className="reveal mt-10 overflow-hidden rounded-2xl border border-rule">
            <table className="w-full text-left">
              <thead className="bg-paper-deep/60 font-display text-xs uppercase tracking-[0.18em] text-ink-soft">
                <tr>
                  <th className="px-5 py-3">Old framing</th>
                  <th className="px-5 py-3">In the runtime</th>
                  <th className="px-5 py-3">Repo</th>
                </tr>
              </thead>
              <tbody className="font-serif text-[1.02rem] text-ink">
                {REPO_MAP.map((row, i) => (
                  <tr key={row.repo} className={i % 2 === 0 ? "bg-paper" : "bg-paper-deep/30"}>
                    <td className="px-5 py-3 text-ink-soft">{row.old}</td>
                    <td className="px-5 py-3">{row.now}</td>
                    <td className="px-5 py-3 font-mono text-[0.92em] text-plum">{row.repo}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* USE CASES */}
      <section className="relative mt-32 sm:mt-44">
        <div className="mx-auto max-w-6xl px-6 sm:px-10">
          <div className="reveal">
            <p className="font-display text-sm uppercase tracking-[0.28em] text-ink-soft">
              ✦ What proactive actually buys you
            </p>
            <h2 className="mt-3 max-w-3xl font-display text-[clamp(2rem,4.6vw,3.2rem)] leading-[1.05] tracking-tight text-ink">
              The seconds that <span className="italic text-terracotta">used to be wasted</span> doing nothing.
            </h2>
          </div>

          <ul className="mt-12 grid gap-8 sm:grid-cols-2">
            {USE_CASES.map((u, i) => (
              <li key={u.title} className="reveal">
                <div
                  className={`tilt rounded-2xl ${ACCENT_BG[u.accent]} relative overflow-hidden p-7`}
                  style={{ "--tilt": TILTS[(i + 2) % TILTS.length] } as React.CSSProperties}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-transparent to-transparent" />
                  <div className="relative flex items-start justify-between gap-4">
                    <div>
                      <p className="font-display text-xs uppercase tracking-[0.22em] text-ink/80">
                        Agent
                      </p>
                      <h3 className="mt-1 font-display text-2xl text-ink">{u.title}</h3>
                      <p className="mt-3 font-serif text-[1.02rem] leading-relaxed text-ink/85">
                        {u.body}
                      </p>
                    </div>
                    <Sparkle className="mt-1 h-4 w-4 opacity-70" />
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ACADEMIC CALLOUT */}
      <section className="relative mt-32 sm:mt-44">
        <div className="mx-auto max-w-4xl px-6 sm:px-10">
          <div className="reveal relative overflow-hidden rounded-[2.5rem] border border-rule bg-paper-deep/60 px-8 py-14 sm:px-14 sm:py-20">
            <div className="absolute -left-20 -top-20 h-64 w-64 rounded-full bg-sage/60 blur-3xl" />
            <div className="absolute -bottom-24 -right-16 h-72 w-72 rounded-full bg-sky/50 blur-3xl" />
            <div className="relative">
              <p className="font-display text-sm uppercase tracking-[0.28em] text-terracotta">
                The third-party reading
              </p>
              <h2 className="mt-4 font-display text-4xl leading-tight text-ink sm:text-5xl">
                A 2024 paper from <span className="italic">Tsinghua &amp; Huawei</span> describes our architecture, almost line for line.
              </h2>
              <p className="mt-6 max-w-2xl font-serif text-lg leading-relaxed text-ink-soft">
                <em>&ldquo;Proactive Agent: Shifting LLM Agents from Reactive
                Responses to Active Assistance&rdquo;</em> (arXiv:2410.12361)
                formalises five claims: push beats poll, persistent state is
                non-negotiable, shared environmental state is the coordination
                primitive, calibrated restraint is the hardest problem, and
                multi-candidate fan-out beats single proposals.
              </p>
              <p className="mt-4 max-w-2xl font-serif text-lg leading-relaxed text-ink-soft">
                Map those five onto{" "}
                <span className="font-mono text-[0.92em] text-plum">relaycron</span>,{" "}
                <span className="font-mono text-[0.92em] text-plum">relayfile</span>,{" "}
                <span className="font-mono text-[0.92em] text-plum">relaycast</span>,
                and the runtime around them, and the picture clicks.
              </p>
              <Squiggle className="mt-8 h-3 w-40 opacity-70" />
            </div>
          </div>
        </div>
      </section>

      {/* FEATURED ESSAY */}
      {featured && (
        <section className="relative mt-32 sm:mt-44">
          <div className="mx-auto max-w-6xl px-6 sm:px-10">
            <div className="reveal flex items-baseline justify-between border-b border-rule pb-3">
              <h2 className="font-display text-sm uppercase tracking-[0.28em] text-ink-soft">
                ✦ Read first
              </h2>
              <span className="text-xs uppercase tracking-[0.22em] text-ink-faint">
                {formatDate(featured.date)}
              </span>
            </div>

            <Link href={`/posts/${featured.slug}`} className="group mt-10 grid gap-10 lg:grid-cols-12 lg:gap-12">
              <div className="lg:col-span-7">
                <h3 className="font-display text-[clamp(2.2rem,4.8vw,3.6rem)] leading-[1.04] tracking-tight text-ink transition-colors group-hover:text-terracotta">
                  {featured.title}
                </h3>
                <p className="mt-6 max-w-xl font-serif text-lg leading-relaxed text-ink-soft">
                  {featured.summary}
                </p>
                <p className="mt-8 inline-flex items-center gap-2 font-display italic text-ink">
                  Read the essay
                  <span aria-hidden className="transition-transform group-hover:translate-x-1">
                    →
                  </span>
                  <span className="ml-3 text-xs uppercase not-italic tracking-[0.22em] text-ink-faint">
                    {featured.readingTime}
                  </span>
                </p>
              </div>
              <div className="lg:col-span-5">
                <div
                  className={`tilt aspect-[4/5] w-full rounded-[2rem] ${ACCENT_BG[featured.accent]} relative overflow-hidden`}
                  style={{ "--tilt": "-1.5deg" } as React.CSSProperties}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-white/30 via-transparent to-transparent" />
                  <div className="absolute inset-0 flex flex-col justify-between p-8">
                    <span className="font-display text-sm uppercase tracking-[0.22em] text-ink/80">
                      N°{String(posts.length).padStart(2, "0")}
                    </span>
                    <span className="font-display text-7xl italic text-ink/85">
                      {featured.title.split(" ")[0]}
                    </span>
                  </div>
                  <Squiggle className="absolute bottom-6 right-6 h-3 w-32 opacity-70" />
                </div>
              </div>
            </Link>
          </div>
        </section>
      )}

      {/* ARCHIVE */}
      {rest.length > 0 && (
        <section className="relative mt-32 sm:mt-44">
          <div className="mx-auto max-w-6xl px-6 sm:px-10">
            <div className="reveal flex items-baseline justify-between border-b border-rule pb-3">
              <h2 className="font-display text-sm uppercase tracking-[0.28em] text-ink-soft">
                ✦ More from the field
              </h2>
              <span className="text-xs uppercase tracking-[0.22em] text-ink-faint">
                {rest.length} more
              </span>
            </div>

            <ul className="mt-10 grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
              {rest.map((p, i) => (
                <li key={p.slug} className="reveal">
                  <Link href={`/posts/${p.slug}`} className="group block">
                    <div
                      className={`tilt aspect-[5/3] w-full rounded-2xl ${ACCENT_BG[p.accent]} relative overflow-hidden transition-transform duration-500 group-hover:-translate-y-1`}
                      style={{ "--tilt": TILTS[i % TILTS.length] } as React.CSSProperties}
                    >
                      <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-transparent to-transparent" />
                      <div className="absolute inset-0 flex items-end justify-between p-5">
                        <span className="font-display text-xs uppercase tracking-[0.22em] text-ink/80">
                          N°{String(rest.length - i).padStart(2, "0")}
                        </span>
                        <Sparkle className="h-3 w-3 opacity-70" />
                      </div>
                    </div>
                    <div className="mt-5">
                      <p className="text-xs uppercase tracking-[0.22em] text-ink-faint">
                        {formatDate(p.date)} · {p.readingTime}
                      </p>
                      <h3 className="mt-2 font-display text-2xl leading-tight text-ink transition-colors group-hover:text-terracotta">
                        {p.title}
                      </h3>
                      <p className="mt-2 font-serif text-[15px] leading-relaxed text-ink-soft">
                        {p.summary}
                      </p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {/* NEWSLETTER / CTA */}
      <section className="relative mt-32 sm:mt-44">
        <div className="mx-auto max-w-4xl px-6 sm:px-10">
          <div className="reveal relative overflow-hidden rounded-[2.5rem] border border-rule bg-paper-deep/50 px-8 py-16 text-center sm:px-16 sm:py-20">
            <div className="absolute -left-20 -top-20 h-64 w-64 rounded-full bg-lavender/60 blur-3xl" />
            <div className="absolute -bottom-24 -right-16 h-72 w-72 rounded-full bg-peach/50 blur-3xl" />
            <div className="relative">
              <p className="font-display text-sm uppercase tracking-[0.28em] text-terracotta">
                A letter, monthly
              </p>
              <h2 className="mt-4 font-display text-4xl leading-tight text-ink sm:text-5xl">
                One essay, a few release notes,
                <br />
                <span className="italic">no marketing tracking pixels.</span>
              </h2>
              <p className="mx-auto mt-6 max-w-lg font-serif text-lg leading-relaxed text-ink-soft">
                Drops the first Sunday of the month. New primitives, honest
                postmortems, the occasional opinion you didn&rsquo;t ask for.
                Unsubscribe with a single click; we don&rsquo;t take it
                personally.
              </p>
              <form className="mx-auto mt-8 flex max-w-md flex-col items-stretch gap-3 sm:flex-row">
                <input
                  type="email"
                  required
                  placeholder="you@somewhere.dev"
                  className="flex-1 rounded-full border border-rule bg-paper px-5 py-3 font-serif text-base text-ink placeholder:text-ink-faint focus:border-terracotta focus:outline-none"
                />
                <button
                  type="submit"
                  className="rounded-full bg-ink px-6 py-3 text-sm font-medium tracking-wide text-paper transition-transform hover:-translate-y-0.5"
                >
                  Subscribe
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
