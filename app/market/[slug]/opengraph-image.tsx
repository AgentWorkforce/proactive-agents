import { getMarketPost, getAllMarketPosts } from "@/lib/market";
import { createOgImage, OG_SIZE, OG_CONTENT_TYPE } from "@/lib/og";

export const dynamic = "force-static";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export async function generateStaticParams() {
  const posts = await getAllMarketPosts();
  return posts.map((p) => ({ slug: p.slug }));
}

export default async function Image({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await getMarketPost(slug);
  if (!post) {
    return createOgImage("Proactive Agents", "Article not found.", "sage");
  }
  return createOgImage(post.title, post.summary, post.accent);
}
