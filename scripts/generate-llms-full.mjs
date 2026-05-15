import { createRequire } from "node:module";
import fs from "node:fs";
import path from "node:path";

const require = createRequire(import.meta.url);
const matter = require("gray-matter");

const ROOT = process.cwd();
const POSTS_DIR = path.join(ROOT, "content", "posts");
const HEADER = path.join(ROOT, "content-system", "llms-full-header.md");
const FOOTER = path.join(ROOT, "content-system", "llms-full-footer.md");
const OUT = path.join(ROOT, "public", "llms-full.txt");
const SITE_URL = "https://proactiveagents.dev";

function stripMdxComponents(content) {
  let md = content;
  let prev;
  do {
    prev = md;
    md = md.replace(/<[A-Z]\w*(?:\s+[^<>]*)?\s*\/>/g, "");
  } while (md !== prev);
  md = md.replace(/<[A-Z]\w*(?:\s+[^<>]*)?\s*>/g, "");
  md = md.replace(/<\/[A-Z]\w*\s*>/g, "");
  md = md.replace(/^import\s+.*$/gm, "");
  md = md.replace(/^export\s+.*$/gm, "");
  md = md.replace(/\n{3,}/g, "\n\n");
  return md.trim();
}

const files = fs.readdirSync(POSTS_DIR).filter((f) => f.endsWith(".mdx"));
const posts = files
  .map((file) => {
    const slug = file.replace(/\.mdx$/, "");
    const raw = fs.readFileSync(path.join(POSTS_DIR, file), "utf8");
    const { data, content } = matter(raw);
    return { slug, title: data.title, date: data.date, content };
  })
  .sort((a, b) => (a.date < b.date ? 1 : -1));

const header = fs.readFileSync(HEADER, "utf8").trim();
const footer = fs.readFileSync(FOOTER, "utf8").trim();
const today = new Date().toISOString().slice(0, 10);

const essaySections = posts.map((p) => {
  const cleaned = stripMdxComponents(p.content);
  return [
    `## Essay: ${p.title}`,
    "",
    `Published: ${p.date}`,
    `Author: Khaliq Gant`,
    `URL: ${SITE_URL}/posts/${p.slug}/`,
    "",
    cleaned,
  ].join("\n");
});

const output = [
  header,
  "",
  `Last updated: ${today}`,
  "",
  "---",
  "",
  essaySections.join("\n\n---\n\n"),
  "",
  "---",
  "",
  footer,
  "",
].join("\n");

fs.writeFileSync(OUT, output);
console.log(
  `Generated llms-full.txt (${posts.length} essays, ${output.length} chars)`
);
