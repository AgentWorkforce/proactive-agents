import fs from "node:fs/promises";
import path from "node:path";
import matter from "gray-matter";

export type MarketMeta = {
  slug: string;
  title: string;
  summary: string;
  date: string;
  readingTime: string;
  accent: "peach" | "butter" | "sage" | "lavender" | "rose" | "sky";
  dropcap?: boolean;
};

export type MarketPost = MarketMeta & { content: string };

export type NewsItem = {
  slug: string;
  title: string;
  date: string;
  source: string;
  sourceLabel: string;
  summary: string;
  content: string;
};

const MARKET_DIR = path.join(process.cwd(), "content", "market");
const NEWS_DIR = path.join(process.cwd(), "content", "market", "news");

function estimateReadingTime(text: string): string {
  const words = text.trim().split(/\s+/).length;
  const minutes = Math.max(1, Math.round(words / 220));
  return `${minutes} min`;
}

export async function getAllMarketPosts(): Promise<MarketMeta[]> {
  const files = await fs.readdir(MARKET_DIR);
  const posts = await Promise.all(
    files
      .filter((f) => f.endsWith(".mdx"))
      .map(async (f) => {
        const slug = f.replace(/\.mdx$/, "");
        const raw = await fs.readFile(path.join(MARKET_DIR, f), "utf8");
        const { data, content } = matter(raw);
        return {
          slug,
          title: data.title as string,
          summary: data.summary as string,
          date: data.date as string,
          accent: (data.accent ?? "sage") as MarketMeta["accent"],
          dropcap: Boolean(data.dropcap),
          readingTime: estimateReadingTime(content),
        } satisfies MarketMeta;
      })
  );
  return posts.sort((a, b) => (a.date < b.date ? 1 : -1));
}

export async function getMarketPost(slug: string): Promise<MarketPost | null> {
  try {
    const raw = await fs.readFile(
      path.join(MARKET_DIR, `${slug}.mdx`),
      "utf8"
    );
    const { data, content } = matter(raw);
    return {
      slug,
      title: data.title as string,
      summary: data.summary as string,
      date: data.date as string,
      accent: (data.accent ?? "sage") as MarketMeta["accent"],
      dropcap: Boolean(data.dropcap),
      readingTime: estimateReadingTime(content),
      content,
    };
  } catch {
    return null;
  }
}

export async function getAllNews(): Promise<NewsItem[]> {
  let files: string[];
  try {
    files = await fs.readdir(NEWS_DIR);
  } catch {
    return [];
  }
  const items = await Promise.all(
    files
      .filter((f) => f.endsWith(".mdx"))
      .map(async (f) => {
        const slug = f.replace(/\.mdx$/, "");
        const raw = await fs.readFile(path.join(NEWS_DIR, f), "utf8");
        const { data, content } = matter(raw);
        return {
          slug,
          title: data.title as string,
          date: data.date as string,
          source: data.source as string,
          sourceLabel: data.sourceLabel as string,
          summary: data.summary as string,
          content,
        } satisfies NewsItem;
      })
  );
  return items.sort((a, b) => (a.date < b.date ? 1 : -1));
}
