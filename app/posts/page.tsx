import Link from "next/link";
import { getAllPosts, formatDate } from "@/lib/posts";
import { Asterism, Squiggle, Sparkle } from "@/components/decorations";
import { jsonLd, breadcrumbSchema, SITE_URL } from "@/lib/seo";

export const metadata = {
  title: "Essays on Proactive Agents",
  description:
    "In-depth essays on building proactive AI agents — reactive vs proactive architecture, the webhook tax, event-driven triggers, agent state management, and practical patterns for developers.",
  alternates: { canonical: `${SITE_URL}/posts/` },
  openGraph: {
    title: "Essays on Proactive Agents",
    description:
      "In-depth essays on building proactive AI agents — architecture patterns, working code, and lessons from production.",
    url: `${SITE_URL}/posts/`,
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

export default async function PostsIndex() {
  const posts = await getAllPosts();

  const crumbs = breadcrumbSchema([
    { name: "Home", url: `${SITE_URL}/` },
    { name: "Essays", url: `${SITE_URL}/posts/` },
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
          The field manual · {posts.length} essays
        </p>
        <h1 className="mt-6 font-display text-[clamp(3rem,7vw,5.5rem)] leading-[0.96] tracking-tight text-ink">
          Essays on <span className="italic text-terracotta">proactive agents.</span>
        </h1>
        <Squiggle className="mt-6 h-3 w-40 opacity-70" />
        <p className="mt-8 max-w-2xl font-serif text-xl leading-relaxed text-ink-soft">
          Adapted from internal positioning docs, postmortems, and the kind of
          design notes that usually live and die in PR descriptions. New ones
          appear roughly monthly &mdash; weather permitting.
        </p>
      </div>

      <ul className="mt-20 grid gap-12 sm:gap-16">
        {posts.map((p, i) => (
          <li key={p.slug}>
            <Link
              href={`/posts/${p.slug}`}
              className="group grid gap-8 sm:grid-cols-12 sm:gap-10"
            >
              <div className="sm:col-span-4">
                <div
                  className={`tilt aspect-[5/3] w-full rounded-2xl ${ACCENT_BG[p.accent]} relative overflow-hidden transition-transform duration-500 group-hover:-translate-y-1`}
                  style={{ "--tilt": TILTS[i % TILTS.length] } as React.CSSProperties}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-transparent to-transparent" />
                  <div className="absolute inset-0 flex items-end justify-between p-5">
                    <span className="font-display text-xs uppercase tracking-[0.22em] text-ink/80">
                      N°{String(posts.length - i).padStart(2, "0")}
                    </span>
                    <Sparkle className="h-3 w-3 opacity-70" />
                  </div>
                </div>
              </div>
              <div className="sm:col-span-8">
                <p className="text-xs uppercase tracking-[0.22em] text-ink-faint">
                  {formatDate(p.date)} · {p.readingTime}
                </p>
                <h2 className="mt-3 font-display text-[clamp(1.8rem,3.4vw,2.6rem)] leading-[1.06] tracking-tight text-ink transition-colors group-hover:text-terracotta">
                  {p.title}
                </h2>
                <p className="mt-4 max-w-2xl font-serif text-[1.05rem] leading-relaxed text-ink-soft">
                  {p.summary}
                </p>
                <p className="mt-5 inline-flex items-center gap-2 font-display italic text-ink">
                  Read the essay
                  <span aria-hidden className="transition-transform group-hover:translate-x-1">
                    →
                  </span>
                </p>
              </div>
            </Link>
          </li>
        ))}
      </ul>

      <div className="mt-24 flex justify-center">
        <Asterism className="h-4 opacity-70" />
      </div>
    </section>
  );
}
