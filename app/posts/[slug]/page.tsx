import { notFound } from "next/navigation";
import Link from "next/link";
import { compileMDX } from "next-mdx-remote/rsc";
import { getAllPosts, getPost, formatDate } from "@/lib/posts";
import { PostHero } from "@/components/post-hero";
import { PostParagraphReveal } from "@/components/post-paragraph-reveal";
import { ReadingProgress } from "@/components/reading-progress";
import { PostNav } from "@/components/post-nav";
import { ScrollToTop } from "@/components/scroll-to-top";
import { mdxComponents } from "@/components/mdx/mdx-components";
import { Asterism } from "@/components/decorations";
import { AgentActions } from "@/components/agent-actions";
import {
  jsonLd,
  articleSchema,
  breadcrumbSchema,
  SITE_URL,
  SITE_NAME,
} from "@/lib/seo";

export async function generateStaticParams() {
  const posts = await getAllPosts();
  return posts.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) return {};
  return {
    title: post.title,
    description: post.summary,
    authors: [{ name: "Khaliq Gant", url: "https://github.com/khaliqgant" }],
    alternates: { canonical: `${SITE_URL}/posts/${slug}/` },
    openGraph: {
      title: `${post.title} — ${SITE_NAME}`,
      description: post.summary,
      url: `${SITE_URL}/posts/${slug}/`,
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

export default async function PostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) notFound();

  const { content } = await compileMDX({
    source: post.content,
    components: mdxComponents,
    options: { parseFrontmatter: false },
  });

  const all = await getAllPosts();
  const idx = all.findIndex((p) => p.slug === slug);
  const next = all[idx + 1];
  const prev = all[idx - 1];

  const postBreadcrumbs = breadcrumbSchema([
    { name: "Home", url: `${SITE_URL}/` },
    { name: "Essays", url: `${SITE_URL}/posts/` },
    { name: post.title, url: `${SITE_URL}/posts/${slug}/` },
  ]);

  return (
    <>
      <ScrollToTop />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLd(articleSchema(post)) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLd(postBreadcrumbs) }}
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
            <Link href="/" className="hover:text-terracotta transition-colors">Home</Link>
          </li>
          <li aria-hidden>/</li>
          <li>
            <Link href="/posts" className="hover:text-terracotta transition-colors">Essays</Link>
          </li>
          <li aria-hidden>/</li>
          <li className="text-ink-soft truncate max-w-[60vw] sm:max-w-[200px]" aria-current="page">{post.title}</li>
        </ol>
      </nav>

      <AgentActions slug={slug} title={post.title} />

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
            Posted {formatDate(post.date)} &middot; AgentWorkforce
          </p>
          <p className="mt-4 font-serif text-[1.05rem] leading-relaxed text-ink-soft">
            Issues, PRs, and arguments welcome on{" "}
            <a
              href="https://github.com/AgentWorkforce/proactive-agents"
              className="text-terracotta underline decoration-terracotta/40 underline-offset-4 hover:decoration-terracotta"
            >
              GitHub
            </a>
            . Or email <span className="font-mono text-[0.95em]">hello@agentrelay.com</span>.
          </p>
        </div>
      </article>

      <PostNav prev={prev} next={next} />
    </>
  );
}

