import type { MetadataRoute } from "next";
import { getAllPosts } from "@/lib/posts";
import { getAllMarketPosts, getAllStartups } from "@/lib/market";
import { SITE_URL } from "@/lib/seo";

// Required for `output: "export"` — sitemap is regenerated each build,
// not at request time.
export const dynamic = "force-static";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const posts = await getAllPosts();
  const marketPosts = await getAllMarketPosts();
  const startups = await getAllStartups();

  const postEntries: MetadataRoute.Sitemap = posts.map((p) => ({
    url: `${SITE_URL}/posts/${p.slug}/`,
    lastModified: new Date(p.date),
    changeFrequency: "monthly",
    priority: 0.8,
  }));

  const marketEntries: MetadataRoute.Sitemap = marketPosts.map((p) => ({
    url: `${SITE_URL}/market/${p.slug}/`,
    lastModified: new Date(p.date),
    changeFrequency: "monthly",
    priority: 0.7,
  }));

  const startupEntries: MetadataRoute.Sitemap = startups.map((s) => ({
    url: `${SITE_URL}/market/startups/${s.slug}/`,
    lastModified: new Date(s.firstSeen),
    changeFrequency: "monthly",
    priority: 0.6,
  }));

  return [
    {
      url: `${SITE_URL}/`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1.0,
    },
    {
      url: `${SITE_URL}/guide/`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/posts/`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    ...postEntries,
    {
      url: `${SITE_URL}/market/`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    ...marketEntries,
    ...startupEntries,
    {
      url: `${SITE_URL}/agent/`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.6,
    },
    {
      url: `${SITE_URL}/about/`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
  ];
}
