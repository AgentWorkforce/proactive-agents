import { notFound } from "next/navigation";
import Link from "next/link";
import { compileMDX } from "next-mdx-remote/rsc";
import { getAllPosts, getPost, formatDate } from "@/lib/posts";
import { PostHero } from "@/components/post-hero";
import { PostParagraphReveal } from "@/components/post-paragraph-reveal";
import { ReadingProgress } from "@/components/reading-progress";
import { mdxComponents } from "@/components/mdx/mdx-components";
import { Asterism } from "@/components/decorations";

export async function generateStaticParams() {
  const posts = await getAllPosts();
  return posts.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) return {};
  return { title: `${post.title} — Proactive Agents`, description: post.summary };
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

  return (
    <>
      <ReadingProgress target="article" />
      <PostHero
        title={post.title}
        summary={post.summary}
        date={formatDate(post.date)}
        readingTime={post.readingTime}
        accent={post.accent}
      />

      <article className="relative mx-auto max-w-5xl px-6 py-20 sm:px-8 sm:py-28">
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
              href="https://github.com/AgentWorkforce"
              className="text-terracotta underline decoration-terracotta/40 underline-offset-4 hover:decoration-terracotta"
            >
              GitHub
            </a>
            . Or email <span className="font-mono text-[0.95em]">hello@agent-relay.com</span>.
          </p>
        </div>
      </article>

      <nav className="mx-auto max-w-4xl px-6 pb-24 sm:px-10">
        <div className="grid gap-6 sm:grid-cols-2">
          {prev ? (
            <Link
              href={`/posts/${prev.slug}`}
              className="group block rounded-2xl border border-rule bg-paper-deep/40 p-6 transition-transform hover:-translate-y-1"
            >
              <p className="text-xs uppercase tracking-[0.22em] text-ink-faint">← The next one</p>
              <p className="mt-2 font-display text-xl text-ink group-hover:text-terracotta">{prev.title}</p>
            </Link>
          ) : <span />}
          {next ? (
            <Link
              href={`/posts/${next.slug}`}
              className="group block rounded-2xl border border-rule bg-paper-deep/40 p-6 text-right transition-transform hover:-translate-y-1"
            >
              <p className="text-xs uppercase tracking-[0.22em] text-ink-faint">An earlier one →</p>
              <p className="mt-2 font-display text-xl text-ink group-hover:text-terracotta">{next.title}</p>
            </Link>
          ) : <span />}
        </div>
      </nav>
    </>
  );
}

