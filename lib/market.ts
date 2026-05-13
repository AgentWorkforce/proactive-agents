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
  tweetEmbed?: string;
  content: string;
};

export type Startup = {
  slug: string;
  name: string;
  website: string | null;
  twitter: string | null;
  github: string | null;
  founder: string;
  firstSeen: string;
  source: string;
  summary: string;
  market: string | null;
};

const MARKET_DIR = path.join(process.cwd(), "content", "market");
const NEWS_DIR = path.join(process.cwd(), "content", "market", "news");
const STARTUPS_DIR = path.join(process.cwd(), "content", "market", "startups");

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
          tweetEmbed: (data.tweetEmbed as string) || undefined,
          content,
        } satisfies NewsItem;
      })
  );
  return items.sort((a, b) => (a.date < b.date ? 1 : -1));
}

export async function getStartup(slug: string): Promise<Startup | null> {
  try {
    const raw = await fs.readFile(
      path.join(STARTUPS_DIR, `${slug}.mdx`),
      "utf8"
    );
    const { data } = matter(raw);
    return {
      slug,
      name: data.name as string,
      website: (data.website as string) || null,
      twitter: (data.twitter as string) || null,
      github: (data.github as string) || null,
      founder: data.founder as string,
      firstSeen: data.firstSeen as string,
      source: data.source as string,
      summary: data.summary as string,
      market: (data.market as string) || null,
    };
  } catch {
    return null;
  }
}

export async function getAllStartups(): Promise<Startup[]> {
  let files: string[];
  try {
    files = await fs.readdir(STARTUPS_DIR);
  } catch {
    return [];
  }
  const items = await Promise.all(
    files
      .filter((f) => f.endsWith(".mdx"))
      .map(async (f) => {
        const slug = f.replace(/\.mdx$/, "");
        const raw = await fs.readFile(path.join(STARTUPS_DIR, f), "utf8");
        const { data } = matter(raw);
        return {
          slug,
          name: data.name as string,
          website: (data.website as string) || null,
          twitter: (data.twitter as string) || null,
          github: (data.github as string) || null,
          founder: data.founder as string,
          firstSeen: data.firstSeen as string,
          source: data.source as string,
          summary: data.summary as string,
          market: (data.market as string) || null,
        } satisfies Startup;
      })
  );
  return items.sort((a, b) => a.name.localeCompare(b.name));
}
