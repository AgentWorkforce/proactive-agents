import { notFound } from "next/navigation";
import Link from "next/link";
import { compileMDX } from "next-mdx-remote/rsc";
import { getAllMarketPosts, getMarketPost } from "@/lib/market";
import { formatDate } from "@/lib/posts";
import { PostHero } from "@/components/post-hero";
import { PostParagraphReveal } from "@/components/post-paragraph-reveal";
import { ReadingProgress } from "@/components/reading-progress";
import { mdxComponents } from "@/components/mdx/mdx-components";
import { Asterism } from "@/components/decorations";
import {
  jsonLd,
  breadcrumbSchema,
  SITE_URL,
  SITE_NAME,
  personSchema,
  organizationSchema,
} from "@/lib/seo";

export async function generateStaticParams() {
  const posts = await getAllMarketPosts();
  return posts.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await getMarketPost(slug);
  if (!post) return {};
  return {
    title: post.title,
    description: post.summary,
    authors: [{ name: "Khaliq Gant", url: "https://github.com/khaliqgant" }],
    alternates: { canonical: `${SITE_URL}/market/${slug}/` },
    openGraph: {
      title: `${post.title} — ${SITE_NAME}`,
      description: post.summary,
      url: `${SITE_URL}/market/${slug}/`,
      type: "article",
      publishedTime: post.date,
      authors: ["Khaliq Gant"],
    },
    twitter: {
      card: "summary_large_image",
      title: `${post.title} — ${SITE_NAME}`,
      description: post.summary,
    },
  };
}

export default async function MarketPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await getMarketPost(slug);
  if (!post) notFound();

  const { content } = await compileMDX({
    source: post.content,
    components: mdxComponents,
    options: { parseFrontmatter: false },
  });

  const marketBreadcrumbs = breadcrumbSchema([
    { name: "Home", url: `${SITE_URL}/` },
    { name: "Market", url: `${SITE_URL}/market/` },
    { name: post.title, url: `${SITE_URL}/market/${slug}/` },
  ]);

  const articleData = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.summary,
    datePublished: post.date,
    author: personSchema(),
    publisher: organizationSchema(),
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `${SITE_URL}/market/${slug}/`,
    },
    url: `${SITE_URL}/market/${slug}/`,
    inLanguage: "en-US",
    isAccessibleForFree: true,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLd(articleData) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLd(marketBreadcrumbs) }}
      />
      <ReadingProgress target="article" />
      <PostHero
        title={post.title}
        summary={post.summary}
        date={formatDate(post.date)}
        readingTime={post.readingTime}
        accent={post.accent}
      />

      <nav
        aria-label="Breadcrumb"
        className="mx-auto max-w-5xl px-5 pt-6 sm:px-8 sm:pt-8"
      >
        <ol className="flex flex-wrap items-center gap-1.5 text-xs text-ink-faint">
          <li>
            <Link
              href="/"
              className="hover:text-terracotta transition-colors"
            >
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
          <li
            className="text-ink-soft truncate max-w-[60vw] sm:max-w-[200px]"
            aria-current="page"
          >
            {post.title}
          </li>
        </ol>
      </nav>

      <article className="relative mx-auto max-w-5xl px-5 py-14 sm:px-8 sm:py-28">
        <PostParagraphReveal />
        <div className={`prose-essay ${post.dropcap ? "dropcap" : ""}`}>
          {content}
        </div>

        <div className="mt-20 flex justify-center">
          <Asterism className="h-4 opacity-70" />
        </div>

        <div className="mt-12 border-t border-rule pt-8">
          <p className="text-xs uppercase tracking-[0.22em] text-ink-faint">
            Updated {formatDate(post.date)} · AgentWorkforce
          </p>
          <p className="mt-4 font-serif text-[1.05rem] leading-relaxed text-ink-soft">
            Have a correction or something we should add?{" "}
            <a
              href="https://github.com/AgentWorkforce/proactive-agents"
              className="text-terracotta underline decoration-terracotta/40 underline-offset-4 hover:decoration-terracotta"
            >
              Open an issue on GitHub
            </a>
            .
          </p>
        </div>
      </article>
    </>
  );
}
