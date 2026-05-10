import fs from "node:fs/promises";
import path from "node:path";
import matter from "gray-matter";

export type PostMeta = {
  slug: string;
  title: string;
  summary: string;
  date: string;
  readingTime: string;
  accent: "peach" | "butter" | "sage" | "lavender" | "rose" | "sky";
  dropcap?: boolean;
};

export type Post = PostMeta & { content: string };

const POSTS_DIR = path.join(process.cwd(), "content", "posts");

function estimateReadingTime(text: string): string {
  const words = text.trim().split(/\s+/).length;
  const minutes = Math.max(1, Math.round(words / 220));
  return `${minutes} min`;
}

export async function getAllPosts(): Promise<PostMeta[]> {
  const files = await fs.readdir(POSTS_DIR);
  const posts = await Promise.all(
    files
      .filter((f) => f.endsWith(".mdx"))
      .map(async (f) => {
        const slug = f.replace(/\.mdx$/, "");
        const raw = await fs.readFile(path.join(POSTS_DIR, f), "utf8");
        const { data, content } = matter(raw);
        return {
          slug,
          title: data.title as string,
          summary: data.summary as string,
          date: data.date as string,
          accent: (data.accent ?? "peach") as PostMeta["accent"],
          dropcap: Boolean(data.dropcap),
          readingTime: estimateReadingTime(content),
        } satisfies PostMeta;
      })
  );
  return posts.sort((a, b) => (a.date < b.date ? 1 : -1));
}

export async function getPost(slug: string): Promise<Post | null> {
  try {
    const raw = await fs.readFile(path.join(POSTS_DIR, `${slug}.mdx`), "utf8");
    const { data, content } = matter(raw);
    return {
      slug,
      title: data.title as string,
      summary: data.summary as string,
      date: data.date as string,
      accent: (data.accent ?? "peach") as PostMeta["accent"],
      dropcap: Boolean(data.dropcap),
      readingTime: estimateReadingTime(content),
      content,
    };
  } catch {
    return null;
  }
}

export function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}
