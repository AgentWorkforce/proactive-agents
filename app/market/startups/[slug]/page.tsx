import { notFound } from "next/navigation";
import Link from "next/link";
import { getAllStartups, getStartup } from "@/lib/market";
import { formatDate } from "@/lib/posts";
import { Asterism } from "@/components/decorations";
import {
  jsonLd,
  breadcrumbSchema,
  SITE_URL,
  SITE_NAME,
} from "@/lib/seo";

const GITHUB_REPO = "https://github.com/AgentWorkforce/proactive-agents";

function issueUrl(name: string, slug: string) {
  const title = encodeURIComponent(`Update startup profile: ${name}`);
  const body = encodeURIComponent(
    `## Startup: ${name}\n\nProfile page: ${SITE_URL}/market/startups/${slug}/\n\n---\n\nPlease update or add any of the following:\n\n- [ ] One-paragraph description of what you're building\n- [ ] Website URL\n- [ ] Founding team\n- [ ] Stage / funding\n- [ ] How your product relates to proactive agents\n\nWe'll merge the update into your profile page.`
  );
  return `${GITHUB_REPO}/issues/new?title=${title}&body=${body}&labels=startup-profile`;
}

export async function generateStaticParams() {
  const startups = await getAllStartups();
  return startups.map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const startup = await getStartup(slug);
  if (!startup) return {};
  const desc = startup.market
    ? `${startup.name} is a ${startup.market.toLowerCase()} startup building proactive AI agents. ${startup.summary}`
    : startup.summary;
  return {
    title: `${startup.name} — Proactive Agent Startup`,
    description: desc,
    alternates: { canonical: `${SITE_URL}/market/startups/${slug}/` },
    openGraph: {
      title: `${startup.name} — Proactive Agent Startup — ${SITE_NAME}`,
      description: desc,
      url: `${SITE_URL}/market/startups/${slug}/`,
    },
  };
}

export default async function StartupPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const startup = await getStartup(slug);
  if (!startup) notFound();

  const crumbs = breadcrumbSchema([
    { name: "Home", url: `${SITE_URL}/` },
    { name: "Market", url: `${SITE_URL}/market/` },
    { name: startup.name, url: `${SITE_URL}/market/startups/${slug}/` },
  ]);

  const sameAs = [startup.website, startup.twitter].filter(Boolean);
  const orgData = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: startup.name,
    ...(startup.website && { url: startup.website }),
    description: startup.summary,
    foundingDate: startup.firstSeen,
    ...(sameAs.length > 0 && { sameAs }),
    ...(startup.market && { industry: startup.market }),
    knowsAbout: [
      "proactive AI agents",
      "autonomous AI agents",
      "AI agent infrastructure",
    ],
  };

  return (
    <section className="relative mx-auto max-w-3xl px-5 pt-12 pb-24 sm:px-10 sm:pt-24 sm:pb-32">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLd(crumbs) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLd(orgData) }}
      />

      <nav aria-label="Breadcrumb">
        <ol className="flex flex-wrap items-center gap-1.5 text-xs text-ink-faint">
          <li>
            <Link href="/" className="hover:text-terracotta transition-colors">
              Home
            </Link>
          </li>
          <li aria-hidden>/</li>
          <li>
            <Link
              href="/market"
              className="hover:text-terracotta transition-colors"
            >
              Market
            </Link>
          </li>
          <li aria-hidden>/</li>
          <li className="text-ink-soft" aria-current="page">
            {startup.name}
          </li>
        </ol>
      </nav>

      <div className="mt-10">
        <p className="text-xs uppercase tracking-[0.22em] text-ink-faint">
          Startup profile
        </p>
        <h1 className="mt-3 font-display text-[clamp(2rem,6vw,3.5rem)] leading-[1.02] tracking-tight text-ink">
          {startup.name}
        </h1>
        {startup.market && (
          <p className="mt-3">
            <span className="rounded-full bg-sage/30 px-3 py-1 text-xs font-medium uppercase tracking-wider text-ink-faint">
              {startup.market}
            </span>
          </p>
        )}

        <div className="mt-6 flex flex-wrap items-center gap-4 text-sm">
          {startup.website && (
            <a
              href={startup.website}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-full border border-rule px-3 py-1 text-ink-soft hover:border-terracotta hover:text-terracotta transition-colors"
            >
              <span>↗</span> Website
            </a>
          )}
          {startup.twitter && (
            <a
              href={startup.twitter}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-full border border-rule px-3 py-1 text-ink-soft hover:border-terracotta hover:text-terracotta transition-colors"
            >
              𝕏 {startup.founder}
            </a>
          )}
        </div>
      </div>

      <div className="mt-10 rounded-xl border border-rule bg-cream/40 p-6 sm:p-8">
        <p className="font-serif text-[1.05rem] leading-relaxed text-ink-soft">
          {startup.summary}
        </p>
        <p className="mt-4 text-xs text-ink-faint">
          First tracked {formatDate(startup.firstSeen)}
        </p>
      </div>

      <div className="mt-12 rounded-xl border border-dashed border-terracotta/40 bg-terracotta/5 p-6 sm:p-8">
        <h2 className="font-display text-lg text-ink">
          Is this your company?
        </h2>
        <p className="mt-2 font-serif text-[0.95rem] leading-relaxed text-ink-soft">
          We're tracking startups building proactive agents. If this profile is
          yours, help us get it right — add a description, team info, funding
          stage, or anything else you'd like potential users and investors to
          see.
        </p>
        <a
          href={issueUrl(startup.name, startup.slug)}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 inline-flex items-center gap-2 rounded-lg bg-terracotta px-4 py-2 font-display text-sm text-cream transition-opacity hover:opacity-90"
        >
          Update this profile on GitHub →
        </a>
      </div>

      <div className="mt-16 flex justify-center">
        <Asterism className="h-4 opacity-70" />
      </div>

      <div className="mt-8 text-center">
        <Link
          href="/market"
          className="font-serif text-sm text-ink-soft hover:text-terracotta transition-colors"
        >
          ← Back to market landscape
        </Link>
      </div>
    </section>
  );
}
