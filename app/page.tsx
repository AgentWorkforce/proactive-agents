import Link from "next/link";
import { getAllPosts, formatDate } from "@/lib/posts";
import { BackgroundOrbs } from "@/components/background-orbs";
import { ScrollReveal } from "@/components/scroll-reveal";
import { Squiggle, Sparkle } from "@/components/decorations";

const ACCENT_BG: Record<string, string> = {
  peach: "bg-peach/60",
  butter: "bg-butter/60",
  sage: "bg-sage/60",
  lavender: "bg-lavender/60",
  rose: "bg-rose/60",
  sky: "bg-sky/60",
};

const TILTS = ["-1.4deg", "0.8deg", "-0.6deg", "1.2deg"];

const TRIGGERS = [
  {
    role: "Time",
    accent: "butter",
    blurb:
      "The agent runs on a schedule it keeps for itself. Every fifteen minutes, every Monday at nine, every quiet hour past midnight.",
    snippet: 'time.every("15 min", agent)',
  },
  {
    role: "Change",
    accent: "sage",
    blurb:
      "The agent watches the world for a delta. A ticket moves, a record updates, a file appears — and it wakes the moment it happens.",
    snippet: 'world.on("change", agent)',
  },
  {
    role: "Message",
    accent: "lavender",
    blurb:
      "Someone — a human, another agent, a system — addresses the agent directly. It answers in its own time, not on a polling cycle.",
    snippet: 'inbox.on("message", agent)',
  },
];

const HARD_PARTS = [
  {
    label: "Wake-ups are infrastructure",
    body: "Polling is easy; push is hard. Stable URLs, signature schemes, normalised events, durable triggers — none of it ships in a model SDK. Someone has to build it.",
  },
  {
    label: "State is harder than it looks",
    body: "Between wake-ups the agent has to remember what it saw, what it acted on, what it&rsquo;s still in the middle of. Most agents wake up amnesiac and re-read the world from scratch.",
  },
  {
    label: "Restraint is a research problem",
    body: "An agent that fires too often loses trust faster than one that misses things. Calibrated restraint is a known-hard problem even at the frontier — GPT-4o tops out around 65% on it.",
  },
];

export default async function Home() {
  const posts = await getAllPosts();
  const recent = posts.slice(0, 3);

  return (
    <>
      <ScrollReveal />

      {/* HERO */}
      <section className="relative overflow-hidden">
        <BackgroundOrbs />
        <div className="relative mx-auto max-w-4xl px-6 pt-20 pb-32 sm:px-10 sm:pt-32 sm:pb-44">
          <p className="flex items-center gap-3 text-xs uppercase tracking-[0.3em] text-ink-soft">
            <span className="h-px w-10 bg-ink-soft/60" />
            By AgentWorkforce
          </p>
          <h1 className="mt-6 font-display text-[clamp(3.25rem,9vw,7rem)] leading-[0.94] tracking-tight text-ink">
            Agents that
            <br />
            <span className="italic text-terracotta">don&rsquo;t wait</span>
            <br />
            to be asked.
          </h1>
          <p className="mt-10 max-w-2xl font-serif text-xl leading-relaxed text-ink-soft">
            A proactive agent doesn&rsquo;t wait for a prompt. It watches the
            world, notices what changed, and acts on its own &mdash; the
            shift from <span className="italic">reactive tool</span> to{" "}
            <span className="scribble-highlight">teammate that feels alive.</span>
          </p>
          <p className="mt-5 max-w-2xl font-serif text-lg leading-relaxed text-ink-faint">
            This site is a working manual on what proactive agents are, why
            they matter, and how to think about building them.
          </p>

          <div className="mt-12 flex flex-wrap items-center gap-6">
            <Link
              href="#triggers"
              className="group inline-flex items-center gap-3 rounded-full bg-ink px-6 py-3 text-sm font-medium tracking-wide text-paper transition-transform hover:-translate-y-0.5"
            >
              What makes them proactive
              <span aria-hidden className="transition-transform group-hover:translate-x-1">
                →
              </span>
            </Link>
            <Link
              href="/posts"
              className="group inline-flex items-center gap-2 text-sm font-medium tracking-wide text-ink hover:text-terracotta"
            >
              Read the essays
              <span aria-hidden className="transition-transform group-hover:translate-x-1">
                →
              </span>
            </Link>
          </div>
        </div>
      </section>

      {/* REACTIVE vs PROACTIVE */}
      <section className="relative">
        <div className="mx-auto max-w-5xl px-6 sm:px-10">
          <div className="reveal mx-auto max-w-3xl text-center">
            <p className="font-display text-sm uppercase tracking-[0.28em] text-ink-soft">
              ✦ The shift
            </p>
            <h2 className="mt-3 font-display text-[clamp(2.2rem,5vw,3.4rem)] leading-[1.05] tracking-tight text-ink">
              Most agents wait to be prompted.
              <br />
              <span className="italic text-terracotta">A proactive one already handled it.</span>
            </h2>
          </div>

          <div className="mt-14 grid gap-6 md:grid-cols-2">
            <div className="reveal rounded-3xl border border-rule bg-paper-deep/40 p-7">
              <p className="font-display text-xs uppercase tracking-[0.22em] text-ink-faint">Reactive</p>
              <h3 className="mt-2 font-display text-2xl text-ink">Wakes up when called.</h3>
              <p className="mt-3 font-serif text-[1rem] leading-relaxed text-ink-soft">
                Polls every N seconds. Forgets between runs. Finishes work
                that&rsquo;s no longer relevant.
              </p>
            </div>
            <div className="reveal relative overflow-hidden rounded-3xl border border-terracotta/40 bg-gradient-to-br from-peach/60 via-butter/40 to-rose/40 p-7">
              <p className="font-display text-xs uppercase tracking-[0.22em] text-terracotta">Proactive</p>
              <h3 className="mt-2 font-display text-2xl text-ink">Wakes up because something moved.</h3>
              <p className="mt-3 font-serif text-[1rem] leading-relaxed text-ink">
                Push, not poll. Persistent state. Stops mid-task when the
                premise stops being true.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* THE THREE TRIGGERS */}
      <section id="triggers" className="relative mt-32 sm:mt-40">
        <div className="mx-auto max-w-5xl px-6 sm:px-10">
          <div className="reveal mx-auto max-w-2xl text-center">
            <p className="font-display text-sm uppercase tracking-[0.28em] text-ink-soft">
              ✦ The three triggers
            </p>
            <h2 className="mt-3 font-display text-[clamp(2rem,4.6vw,3rem)] leading-[1.06] tracking-tight text-ink">
              What makes an agent proactive.
            </h2>
            <p className="mt-6 font-serif text-lg leading-relaxed text-ink-soft">
              A proactive agent isn&rsquo;t defined by what model it runs or
              what framework it&rsquo;s built on. It&rsquo;s defined by{" "}
              <span className="italic">how it wakes up</span>. There are only
              three ways.
            </p>
          </div>

          <ul className="mt-14 grid gap-6 md:grid-cols-3">
            {TRIGGERS.map((t, i) => (
              <li key={t.role} className="reveal">
                <div
                  className={`tilt rounded-2xl ${ACCENT_BG[t.accent]} relative overflow-hidden p-7`}
                  style={{ "--tilt": TILTS[i] } as React.CSSProperties}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-transparent to-transparent" />
                  <div className="relative">
                    <p className="font-mono text-xs uppercase tracking-[0.22em] text-ink/80">
                      Trigger {i + 1}
                    </p>
                    <h3 className="mt-2 font-display text-3xl text-ink">{t.role}</h3>
                    <p className="mt-3 font-serif text-[0.98rem] leading-relaxed text-ink/85">
                      {t.blurb}
                    </p>
                    <pre className="mt-5 overflow-x-auto rounded-lg bg-ink/85 px-3 py-2.5 font-mono text-[12px] leading-relaxed text-paper">
                      <code>{t.snippet}</code>
                    </pre>
                  </div>
                </div>
              </li>
            ))}
          </ul>

          <p className="reveal mx-auto mt-10 max-w-2xl text-center font-serif text-[1.02rem] leading-relaxed text-ink-soft">
            A truly proactive agent listens for all three. Pick one and
            you&rsquo;ve made a smarter cron job; pick two and you&rsquo;ve
            made a chatbot that polls. The composition is what counts.
          </p>
        </div>
      </section>

      {/* WHY MOST AGENTS ARE STILL REACTIVE */}
      <section className="relative mt-32 sm:mt-40">
        <div className="mx-auto max-w-5xl px-6 sm:px-10">
          <div className="reveal mx-auto max-w-2xl text-center">
            <p className="font-display text-sm uppercase tracking-[0.28em] text-ink-soft">
              ✦ The hard parts
            </p>
            <h2 className="mt-3 font-display text-[clamp(2rem,4.6vw,3rem)] leading-[1.06] tracking-tight text-ink">
              Why most agents are still reactive.
            </h2>
            <p className="mt-6 font-serif text-lg leading-relaxed text-ink-soft">
              Anyone shipping an agent today wants it to be proactive. Most
              aren&rsquo;t. The reasons are not philosophical &mdash;
              they&rsquo;re engineering.
            </p>
          </div>

          <ol className="mt-14 grid gap-8 md:grid-cols-3">
            {HARD_PARTS.map((h, i) => (
              <li key={h.label} className="reveal">
                <div className="flex items-baseline gap-3">
                  <span className="font-display text-4xl italic text-terracotta">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <h3 className="font-display text-xl leading-tight text-ink">
                    {h.label}
                  </h3>
                </div>
                <p
                  className="mt-3 font-serif text-[1rem] leading-relaxed text-ink-soft"
                  dangerouslySetInnerHTML={{ __html: h.body }}
                />
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ESSAYS */}
      <section className="relative mt-32 sm:mt-40">
        <div className="mx-auto max-w-5xl px-6 sm:px-10">
          <div className="reveal flex items-baseline justify-between border-b border-rule pb-3">
            <h2 className="font-display text-sm uppercase tracking-[0.28em] text-ink-soft">
              ✦ Recent essays
            </h2>
            <Link
              href="/posts"
              className="text-xs uppercase tracking-[0.22em] text-ink-faint hover:text-terracotta"
            >
              All essays →
            </Link>
          </div>

          <ul className="mt-10 grid gap-8 md:grid-cols-3">
            {recent.map((p, i) => (
              <li key={p.slug} className="reveal">
                <Link href={`/posts/${p.slug}`} className="group block">
                  <div
                    className={`tilt aspect-[5/3] w-full rounded-2xl ${ACCENT_BG[p.accent]} relative overflow-hidden transition-transform duration-500 group-hover:-translate-y-1`}
                    style={{ "--tilt": TILTS[i % TILTS.length] } as React.CSSProperties}
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-transparent to-transparent" />
                    <div className="absolute inset-0 flex items-end justify-between p-4">
                      <span className="font-display text-xs uppercase tracking-[0.22em] text-ink/80">
                        N°{String(posts.length - i).padStart(2, "0")}
                      </span>
                      <Sparkle className="h-3 w-3 opacity-70" />
                    </div>
                  </div>
                  <p className="mt-4 text-xs uppercase tracking-[0.22em] text-ink-faint">
                    {formatDate(p.date)} · {p.readingTime}
                  </p>
                  <h3 className="mt-1.5 font-display text-xl leading-tight text-ink transition-colors group-hover:text-terracotta">
                    {p.title}
                  </h3>
                </Link>
              </li>
            ))}
          </ul>

          <div className="reveal mt-16 flex items-center justify-center gap-3 text-ink-faint">
            <Squiggle className="h-3 w-24 opacity-60" />
            <span className="font-display italic text-sm">that&rsquo;s the site</span>
            <Squiggle className="h-3 w-24 opacity-60" />
          </div>
        </div>
      </section>
    </>
  );
}
