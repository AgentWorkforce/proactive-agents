import Link from "next/link";
import { getAllMarketPosts, getAllNews } from "@/lib/market";
import { formatDate } from "@/lib/posts";
import { Asterism, Squiggle, Sparkle } from "@/components/decorations";
import { CardArt } from "@/components/card-illustrations";
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

  const crumbs = breadcrumbSchema([
    { name: "Home", url: `${SITE_URL}/` },
    { name: "Market", url: `${SITE_URL}/market/` },
  ]);

  return (
    <section className="relative mx-auto max-w-6xl px-6 pt-16 pb-32 sm:px-10 sm:pt-24">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLd(crumbs) }}
      />
      <div className="max-w-3xl">
        <p className="flex items-center gap-3 text-xs uppercase tracking-[0.3em] text-ink-soft">
          <span className="h-px w-10 bg-ink-soft/60" />
          Market intelligence
        </p>
        <h1 className="mt-6 font-display text-[clamp(3rem,7vw,5.5rem)] leading-[0.96] tracking-tight text-ink">
          The proactive agent{" "}
          <span className="italic text-terracotta">landscape.</span>
        </h1>
        <Squiggle className="mt-6 h-3 w-40 opacity-70" />
        <p className="mt-8 max-w-2xl font-serif text-xl leading-relaxed text-ink-soft">
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
          <h2 className="mt-20 font-display text-2xl tracking-tight text-ink">
            Analysis
          </h2>
          <ul className="mt-10 grid gap-12 sm:gap-16">
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
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </>
      )}

      <div className="mt-24 flex justify-center">
        <Asterism className="h-4 opacity-70" />
      </div>
    </section>
  );
}
