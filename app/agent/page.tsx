import Link from "next/link";
import { getAgentLog, AGENT_META, TRIGGER_META, type AgentEntry } from "@/lib/agent-log";
import { Squiggle } from "@/components/decorations";
import { jsonLd, breadcrumbSchema, SITE_URL } from "@/lib/seo";

export const metadata = {
  title: "Agent Activity Log — Proactive Agents in Action",
  description:
    "A live feed of what the proactive agents behind this site have done — triggered by time, data changes, and messages. See real proactive agent behavior with verifiable receipts.",
  alternates: { canonical: `${SITE_URL}/agent/` },
  openGraph: {
    title: "Agent Activity Log — Proactive Agents in Action",
    description:
      "Watch real proactive agents work: time-triggered digests, change-triggered publishing, message-triggered responses. Build in public.",
    url: `${SITE_URL}/agent/`,
  },
};

const ACCENT_BG: Record<string, string> = {
  peach: "bg-peach/60",
  butter: "bg-butter/60",
  sage: "bg-sage/60",
  lavender: "bg-lavender/60",
  rose: "bg-rose/60",
  sky: "bg-sky/60",
};

function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatDay(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function groupByDay(entries: AgentEntry[]): { day: string; items: AgentEntry[] }[] {
  const map = new Map<string, AgentEntry[]>();
  for (const e of entries) {
    const day = e.timestamp.slice(0, 10);
    map.set(day, [...(map.get(day) ?? []), e]);
  }
  return Array.from(map.entries()).map(([day, items]) => ({ day, items }));
}

export default async function AgentPage() {
  const log = await getAgentLog();
  const grouped = groupByDay(log);

  // Stats: this calendar week (Sunday → today)
  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - now.getDay());
  weekStart.setHours(0, 0, 0, 0);
  const thisWeek = log.filter((e) => new Date(e.timestamp) >= weekStart);

  const stats = [
    { label: "Actions this week", value: thisWeek.length },
    {
      label: "Time-triggered",
      value: thisWeek.filter((e) => e.trigger === "time").length,
    },
    {
      label: "Change-triggered",
      value: thisWeek.filter((e) => e.trigger === "change").length,
    },
    {
      label: "Message-triggered",
      value: thisWeek.filter((e) => e.trigger === "message").length,
    },
  ];

  const agentCrumbs = breadcrumbSchema([
    { name: "Home", url: `${SITE_URL}/` },
    { name: "Agent Log", url: `${SITE_URL}/agent/` },
  ]);

  return (
    <article className="relative mx-auto max-w-4xl px-6 py-20 sm:px-10 sm:py-28">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLd(agentCrumbs) }}
      />
      {/* Header */}
      <div className="max-w-2xl">
        <p className="flex items-center gap-3 text-xs uppercase tracking-[0.3em] text-ink-soft">
          <span className="h-px w-10 bg-ink-soft/60" />
          Build in public · the agent log
        </p>
        <h1 className="mt-6 font-display text-[clamp(2.8rem,7vw,5rem)] leading-[0.96] tracking-tight text-ink">
          What the <span className="italic text-terracotta">agent</span> did.
        </h1>
        <Squiggle className="mt-6 h-3 w-40 opacity-70" />
        <p className="mt-8 font-serif text-lg leading-relaxed text-ink-soft">
          Proactive agents run pieces of this site &mdash; for now, one of them
          does. The <em>weekly digest</em> agent wakes every Saturday, scans
          the web and Reddit for proactive-agent mentions, clusters what it
          finds, and files a single GitHub issue. The other agents in the
          roster are scaffolded but not yet wired to a runtime; they&rsquo;ll
          appear here as they come online.
        </p>
        <p className="mt-3 font-serif text-base leading-relaxed text-ink-faint">
          A reactive agent fires when called. A proactive agent has to{" "}
          <em>not</em> fire most of the time. Both outcomes are visible below
          &mdash; every entry, including the skips, with a link so you can
          verify the receipts.
        </p>
      </div>

      {/* Stats */}
      <ul className="mt-14 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {stats.map((s) => (
          <li
            key={s.label}
            className="rounded-2xl border border-rule bg-paper-deep/40 px-5 py-5"
          >
            <p className="font-display text-4xl text-ink">{s.value}</p>
            <p className="mt-1 text-xs uppercase tracking-[0.18em] text-ink-faint">
              {s.label}
            </p>
          </li>
        ))}
      </ul>

      {/* Roster */}
      <section className="mt-16">
        <h2 className="border-b border-rule pb-3 font-display text-sm uppercase tracking-[0.28em] text-ink-soft">
          ✦ The roster
        </h2>
        <ul className="mt-8 grid gap-4 sm:grid-cols-2">
          {Object.entries(AGENT_META).map(([key, m]) => {
            const isLive = m.status === "live";
            return (
              <li
                key={key}
                className={`rounded-2xl ${
                  isLive ? ACCENT_BG[m.accent] : "bg-paper-deep/40 border border-rule"
                } relative overflow-hidden p-5`}
              >
                {isLive && (
                  <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-transparent to-transparent" />
                )}
                <div className="relative">
                  <div className="flex items-baseline justify-between gap-3">
                    <p
                      className={`font-mono text-xs uppercase tracking-[0.22em] ${
                        isLive ? "text-ink/80" : "text-ink-faint"
                      }`}
                    >
                      {TRIGGER_META[m.trigger].symbol}{" "}
                      {TRIGGER_META[m.trigger].label}-triggered
                    </p>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] uppercase tracking-[0.2em] ${
                        isLive
                          ? "bg-ink/85 text-paper"
                          : "border border-rule bg-paper text-ink-faint"
                      }`}
                    >
                      {isLive ? "live" : "scaffolded"}
                    </span>
                  </div>
                  <h3
                    className={`mt-2 font-display text-xl ${
                      isLive ? "text-ink" : "text-ink-soft"
                    }`}
                  >
                    {m.title}
                  </h3>
                  <p
                    className={`mt-1.5 font-serif text-[0.95rem] leading-snug ${
                      isLive ? "text-ink/85" : "text-ink-faint"
                    }`}
                  >
                    {m.blurb}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      {/* Timeline */}
      <section className="mt-20">
        <h2 className="border-b border-rule pb-3 font-display text-sm uppercase tracking-[0.28em] text-ink-soft">
          ✦ Timeline
        </h2>

        {grouped.length === 0 ? (
          <p className="mt-10 font-serif text-lg text-ink-soft">
            The agents are quiet. No actions yet.
          </p>
        ) : (
          <ol className="mt-10 space-y-12">
            {grouped.map(({ day, items }) => (
              <li key={day}>
                <p className="font-display text-xs uppercase tracking-[0.22em] text-ink-faint">
                  {formatDay(day)}
                </p>
                <ul className="mt-4 space-y-4">
                  {items.map((e) => {
                    const meta = AGENT_META[e.agent];
                    const trig = TRIGGER_META[e.trigger];
                    const isSkipped = e.outcome === "skipped";
                    const isError = e.outcome === "error";
                    return (
                      <li
                        key={e.id}
                        className={`rounded-2xl border p-5 ${
                          isError
                            ? "border-terracotta/50 bg-rose/15"
                            : isSkipped
                              ? "border-rule bg-paper-deep/30"
                              : "border-rule bg-paper-deep/50"
                        }`}
                      >
                        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                          <div className="flex flex-wrap items-baseline gap-3">
                            <span
                              className={`font-mono text-[11px] uppercase tracking-[0.22em] ${trig.tone}`}
                            >
                              {trig.symbol} {trig.label}
                            </span>
                            <span className="font-display text-base text-ink">
                              {meta.title}
                            </span>
                            {isSkipped && (
                              <span className="rounded-full border border-rule bg-paper px-2 py-0.5 text-[10px] uppercase tracking-[0.2em] text-ink-faint">
                                skipped · {e.skippedReason}
                              </span>
                            )}
                            {isError && (
                              <span className="rounded-full border border-terracotta/40 bg-rose/20 px-2 py-0.5 text-[10px] uppercase tracking-[0.2em] text-terracotta">
                                error
                              </span>
                            )}
                          </div>
                          <span className="text-xs text-ink-faint">
                            {formatTime(e.timestamp)}
                          </span>
                        </div>

                        <p className="mt-3 font-display text-lg text-ink">
                          {e.action}
                        </p>
                        <p className="mt-1.5 font-serif text-[0.98rem] leading-relaxed text-ink-soft">
                          {e.summary}
                        </p>

                        {e.links && e.links.length > 0 && (
                          <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm">
                            {e.links.map((l) => (
                              <li key={l.url}>
                                {l.url.startsWith("/") ? (
                                  <Link
                                    href={l.url}
                                    className="text-terracotta hover:underline"
                                  >
                                    {l.label} →
                                  </Link>
                                ) : (
                                  <a
                                    href={l.url}
                                    className="text-terracotta hover:underline"
                                  >
                                    {l.label} ↗
                                  </a>
                                )}
                              </li>
                            ))}
                          </ul>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </li>
            ))}
          </ol>
        )}
      </section>

      <p className="mt-20 text-center font-serif text-sm italic text-ink-faint">
        The agent code lives in{" "}
        <a
          href="https://github.com/AgentWorkforce/proactive-agents/tree/main/agents"
          className="text-terracotta hover:underline"
        >
          /agents
        </a>{" "}
        in this repo. Read it, fork it, mock it &mdash; it&rsquo;s how we work.
      </p>
    </article>
  );
}
