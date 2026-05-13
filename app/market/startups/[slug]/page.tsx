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

  const sameAs = [startup.website, startup.twitter, startup.github].filter(Boolean);
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
          {startup.github && (
            <a
              href={startup.github}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-full border border-rule px-3 py-1 text-ink-soft hover:border-terracotta hover:text-terracotta transition-colors"
            >
              <svg viewBox="0 0 16 16" className="h-3.5 w-3.5 fill-current" aria-hidden><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0016 8c0-4.42-3.58-8-8-8z"/></svg>
              GitHub
            </a>
          )}
        </div>
      </div>

      <div className="mt-10 rounded-xl border border-rule bg-cream/40 p-6 sm:p-8">
        <div className="space-y-4 font-serif text-[1.05rem] leading-relaxed text-ink-soft">
          {startup.summary
            .split(/(?<=\.)\s+(?=[A-Z$])/)
            .reduce<string[][]>(
              (groups, sentence, i) => {
                const gi = Math.floor(i / 2);
                if (!groups[gi]) groups[gi] = [];
                groups[gi].push(sentence);
                return groups;
              },
              []
            )
            .map((group, i) => (
              <p key={i}>{group.join(" ")}</p>
            ))}
        </div>
        <p className="mt-5 text-xs text-ink-faint">
          First tracked {formatDate(startup.firstSeen)}
        </p>
      </div>

      {startup.github && (
        <a
          href={startup.github}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 flex items-center gap-4 rounded-xl border border-rule bg-cream/40 p-5 transition-colors hover:border-terracotta/40 sm:p-6"
        >
          <svg viewBox="0 0 16 16" className="h-8 w-8 shrink-0 fill-ink/70" aria-hidden><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0016 8c0-4.42-3.58-8-8-8z"/></svg>
          <div>
            <p className="font-display text-sm text-ink">
              {startup.github.replace("https://github.com/", "")}
            </p>
            <p className="mt-0.5 text-xs text-ink-faint">
              Open source — view on GitHub
            </p>
          </div>
          <span className="ml-auto text-ink-faint">↗</span>
        </a>
      )}


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
