import { getPost } from "@/lib/posts";
import { createOgImage, OG_SIZE, OG_CONTENT_TYPE } from "@/lib/og";

export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default async function Image({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) {
    return createOgImage("Proactive Agents", "Essay not found.", "peach");
  }
  return createOgImage(post.title, post.summary, post.accent);
}
