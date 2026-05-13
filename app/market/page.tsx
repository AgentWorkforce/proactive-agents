import Link from "next/link";
import { getAllMarketPosts, getAllNews, getAllStartups } from "@/lib/market";
import { formatDate } from "@/lib/posts";
import { Asterism, Squiggle, Sparkle } from "@/components/decorations";
import { CardArt } from "@/components/card-illustrations";
import { TweetEmbed } from "@/components/tweet-embed";
import { jsonLd, breadcrumbSchema, SITE_URL } from "@/lib/seo";

export const metadata = {
  title: "Market — Proactive Agent Landscape",
  description:
    "Who's building proactive agents? Landscape analysis, competitive scorecards, and news tracking across OpenAI, Google, Anthropic, Meta, Perplexity, and startups.",
  alternates: { canonical: `${SITE_URL}/market/` },
  openGraph: {
    title: "Market — Proactive Agent Landscape",
    description:
      "Landscape analysis and news tracking for the proactive AI agent market.",
    url: `${SITE_URL}/market/`,
  },
  twitter: {
    card: "summary_large_image",
    title: "Market — Proactive Agent Landscape",
    description:
      "Who's building proactive agents? Landscape analysis, competitive scorecards, news tracking, and a startup directory.",
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

const TILTS = ["-1.4deg", "0.8deg", "-0.6deg", "1.2deg", "-0.9deg", "0.4deg"];

export default async function MarketIndex() {
  const posts = await getAllMarketPosts();
  const news = await getAllNews();
  const startups = await getAllStartups();

  const crumbs = breadcrumbSchema([
    { name: "Home", url: `${SITE_URL}/` },
    { name: "Market", url: `${SITE_URL}/market/` },
  ]);

  const newsList = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Proactive AI Agent News",
    description:
      "Notable developments in the proactive AI agent market — enterprise launches, VC signals, and product announcements.",
    numberOfItems: news.length,
    itemListElement: news.map((n, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: n.title,
      url: n.source,
    })),
  };

  const startupList = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Startups Building Proactive AI Agents",
    description:
      "A tracker of early-stage companies building proactive AI agents — agents that observe, predict, and act without being prompted.",
    numberOfItems: startups.length,
    itemListElement: startups.map((s, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: s.name,
      url: `${SITE_URL}/market/startups/${s.slug}/`,
      item: {
        "@type": "Organization",
        name: s.name,
        description: s.summary,
        ...(s.website && { url: s.website }),
      },
    })),
  };

  return (
    <section className="relative mx-auto max-w-6xl px-5 pt-12 pb-24 sm:px-10 sm:pt-24 sm:pb-32">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLd(crumbs) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLd(newsList) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLd(startupList) }}
      />
      <div className="max-w-3xl">
        <p className="flex items-center gap-3 text-xs uppercase tracking-[0.3em] text-ink-soft">
          <span className="h-px w-10 bg-ink-soft/60" />
          Market intelligence
        </p>
        <h1 className="mt-5 font-display text-[clamp(2.4rem,8vw,5.5rem)] leading-[0.98] tracking-tight text-ink sm:mt-6">
          The proactive agent{" "}
          <span className="italic text-terracotta">landscape.</span>
        </h1>
        <Squiggle className="mt-6 h-3 w-40 opacity-70" />
        <p className="mt-6 max-w-2xl font-serif text-lg leading-relaxed text-ink-soft sm:mt-8 sm:text-xl">
          Tracking who's building proactive agents, how their architectures
          compare, and what ships next. Analysis scored against the{" "}
          <Link
            href="/posts/three-primitives"
            className="text-terracotta underline decoration-terracotta/40 underline-offset-4 hover:decoration-terracotta"
          >
            three-primitives framework
          </Link>
          .
        </p>
      </div>

      {/* Analysis section */}
      {posts.length > 0 && (
        <>
          <h2 className="mt-16 font-display text-2xl tracking-tight text-ink sm:mt-20">
            Analysis
          </h2>
          <ul className="mt-8 grid gap-10 sm:mt-10 sm:gap-16">
            {posts.map((p, i) => (
              <li key={p.slug}>
                <Link
                  href={`/market/${p.slug}`}
                  className="group grid gap-8 sm:grid-cols-12 sm:gap-10"
                >
                  <div className="sm:col-span-4">
                    <div
                      className={`tilt aspect-[5/3] w-full rounded-2xl ${ACCENT_BG[p.accent]} relative overflow-hidden transition-transform duration-500 group-hover:-translate-y-1`}
                      style={
                        {
                          "--tilt": TILTS[i % TILTS.length],
                        } as React.CSSProperties
                      }
                    >
                      <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-transparent to-transparent" />
                      <CardArt slug={p.slug} />
                      <div className="absolute inset-0 flex items-end justify-end p-5">
                        <Sparkle className="h-3 w-3 opacity-70" />
                      </div>
                    </div>
                  </div>
                  <div className="sm:col-span-8">
                    <p className="text-xs uppercase tracking-[0.22em] text-ink-faint">
                      {formatDate(p.date)} · {p.readingTime}
                    </p>
                    <h3 className="mt-3 font-display text-[clamp(1.8rem,3.4vw,2.6rem)] leading-[1.06] tracking-tight text-ink transition-colors group-hover:text-terracotta">
                      {p.title}
                    </h3>
                    <p className="mt-4 max-w-2xl font-serif text-[1.05rem] leading-relaxed text-ink-soft">
                      {p.summary}
                    </p>
                    <p className="mt-5 inline-flex items-center gap-2 font-display italic text-ink">
                      Read the analysis
                      <span
                        aria-hidden
                        className="transition-transform group-hover:translate-x-1"
                      >
                        →
                      </span>
                    </p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </>
      )}

      {/* News section */}
      {news.length > 0 && (
        <>
          <h2 className="mt-24 font-display text-2xl tracking-tight text-ink">
            News
          </h2>
          <p className="mt-3 font-serif text-ink-soft">
            Notable developments in proactive AI, briefly noted.
          </p>
          <ul className="mt-8 divide-y divide-rule">
            {news.map((n) => (
              <li key={n.slug} className="py-6">
                <div className="flex items-start justify-between gap-6">
                  <div className="min-w-0">
                    <p className="text-xs uppercase tracking-[0.22em] text-ink-faint">
                      {formatDate(n.date)} ·{" "}
                      <a
                        href={n.source}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-terracotta hover:underline"
                      >
                        {n.sourceLabel}
                      </a>
                    </p>
                    <h3 className="mt-2 font-display text-lg leading-snug text-ink">
                      {n.title}
                    </h3>
                    <p className="mt-2 font-serif text-[0.95rem] leading-relaxed text-ink-soft">
                      {n.summary}
                    </p>
                    {n.tweetEmbed && <TweetEmbed tweetUrl={n.tweetEmbed} />}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </>
      )}

      {/* Startups section */}
      {startups.length > 0 && (
        <>
          <h2 className="mt-24 font-display text-2xl tracking-tight text-ink">
            Startups
          </h2>
          <p className="mt-3 font-serif text-ink-soft">
            Early-stage companies building proactive agents, tracked as they surface.
          </p>
          <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {startups.map((s) => (
              <li key={s.slug}>
                <Link
                  href={`/market/startups/${s.slug}`}
                  className="group block rounded-xl border border-rule bg-cream/40 p-5 transition-colors hover:border-terracotta/40"
                >
                  <div className="flex items-center gap-3">
                    <h3 className="font-display text-base text-ink group-hover:text-terracotta transition-colors">
                      {s.name}
                    </h3>
                    {s.market && (
                      <span className="rounded-full bg-sage/30 px-2 py-0.5 text-[0.65rem] font-medium uppercase tracking-wider text-ink-faint">
                        {s.market}
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-xs text-ink-faint">
                    {s.founder}
                    {" · "}
                    first seen {formatDate(s.firstSeen)}
                  </p>
                  <p className="mt-2 font-serif text-sm leading-relaxed text-ink-soft">
                    {s.summary}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
          <p className="mt-6 font-serif text-sm text-ink-soft">
            Working on proactive agents?{" "}
            <a
              href="https://github.com/AgentWorkforce/proactive-agents/issues/new?title=Add+startup%3A+%5Byour+company+name%5D&body=**Company+name%3A**%0A**Website%3A**%0A**Twitter%2FX%3A**%0A**One-line+description%3A**%0A%0ATell+us+what+you%27re+building+and+how+it+relates+to+proactive+agents.&labels=startup-profile"
              target="_blank"
              rel="noopener noreferrer"
              className="text-terracotta underline decoration-terracotta/40 underline-offset-4 hover:decoration-terracotta"
            >
              Add your startup here
            </a>
            .
          </p>
        </>
      )}

      <div className="mt-24 flex justify-center">
        <Asterism className="h-4 opacity-70" />
      </div>
    </section>
  );
}
