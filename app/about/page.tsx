import { Squiggle, Asterism } from "@/components/decorations";
import {
  jsonLd,
  personSchema,
  organizationSchema,
  breadcrumbSchema,
  SITE_URL,
} from "@/lib/seo";

export const metadata = {
  title: "About",
  description:
    "Proactive Agents is a working manual on AI agents that act without being prompted — written by Khaliq Gant, co-founder of AgentWorkforce and former first hire at Nango.",
  alternates: { canonical: `${SITE_URL}/about/` },
  openGraph: {
    title: "About — Proactive Agents",
    description:
      "Written by Khaliq Gant, co-founder of AgentWorkforce. A working manual on proactive AI agents.",
    url: `${SITE_URL}/about/`,
  },
};

export default function AboutPage() {
  const aboutCrumbs = breadcrumbSchema([
    { name: "Home", url: `${SITE_URL}/` },
    { name: "About", url: `${SITE_URL}/about/` },
  ]);

  const aboutSchema = {
    "@context": "https://schema.org",
    "@type": "AboutPage",
    name: "About — Proactive Agents",
    url: `${SITE_URL}/about/`,
    mainEntity: personSchema(),
  };

  return (
    <article className="relative mx-auto max-w-2xl px-5 py-16 sm:px-8 sm:py-32">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLd(aboutSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLd(aboutCrumbs) }}
      />
      <p className="text-xs uppercase tracking-[0.3em] text-ink-soft">About</p>
      <h1 className="mt-4 font-display text-[clamp(2.4rem,8vw,3.75rem)] leading-[1.05] tracking-tight text-ink sm:text-6xl">
        A working manual on <span className="italic text-terracotta">proactive agents.</span>
      </h1>
      <Squiggle className="mt-6 h-3 w-40 opacity-70" />

      <div className="prose-essay mt-10">
        <p>
          This site is a slow-built reference on proactive agents &mdash; what
          they are, why they&rsquo;re different from the reactive agents most
          teams ship, and how to think about building them. Less brochure,
          more textbook with opinions.
        </p>

        <h2>What we mean by &ldquo;proactive&rdquo;</h2>
        <p>
          A proactive agent doesn&rsquo;t wait for a prompt. It acts because
          time passed, data changed, or someone spoke. That shift &mdash; from
          reactive tool to teammate &mdash; is the most important architectural
          choice you make when shipping an agent. Most of the writing here is
          variations on that one idea.
        </p>

        <h2>Who&rsquo;s behind it</h2>
        <p>
          Written by{" "}
          <a href="https://github.com/khaliqgant">Khaliq Gant</a>, co-founder
          of <a href="https://github.com/AgentWorkforce">AgentWorkforce</a>.
          Before this, three years as the first hire at{" "}
          <a href="https://nango.dev">Nango</a> &mdash; the market leader in
          third-party integrations &mdash; where most of the day-job was
          getting the right context to AI: webhooks, normalized payloads, the
          long tail of provider quirks. The hard parts of proactive agents
          are, mostly, the same hard parts dressed up in a different jacket.
        </p>
        <p>
          The essays are adapted from positioning docs, postmortems, and
          design notes that would otherwise live in PRs.
        </p>

        <h2>How we publish</h2>
        <p>
          Educational over promotional. Specific over abstract. Honest about
          what&rsquo;s hard. New essays appear when they&rsquo;re ready,
          usually weekly.
        </p>
      </div>

      <div className="mt-16 flex justify-center">
        <Asterism className="h-4 opacity-70" />
      </div>
    </article>
  );
}
