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

  // Preserve fenced code blocks by replacing them with placeholders
  const codeBlocks = [];
  md = md.replace(/^```[\s\S]*?^```/gm, (match) => {
    codeBlocks.push(match);
    return `__CODE_BLOCK_${codeBlocks.length - 1}__`;
  });

  // Strip self-closing JSX components
  let prev;
  do {
    prev = md;
    md = md.replace(/<[A-Z]\w*(?:\s+[^<>]*)?\s*\/>/g, "");
  } while (md !== prev);
  // Strip opening and closing JSX tags
  md = md.replace(/<[A-Z]\w*(?:\s+[^<>]*)?\s*>/g, "");
  md = md.replace(/<\/[A-Z]\w*\s*>/g, "");
  // Strip MDX-level import/export statements
  md = md.replace(/^import\s+.*$/gm, "");
  md = md.replace(/^export\s+.*$/gm, "");

  // Restore code blocks
  md = md.replace(/__CODE_BLOCK_(\d+)__/g, (_, i) => codeBlocks[Number(i)]);

  md = md.replace(/\n{3,}/g, "\n\n");
  return md.trim();
}

const files = fs.readdirSync(POSTS_DIR).filter((f) => f.endsWith(".mdx"));
if (files.length === 0) {
  console.error("Error: No .mdx files found in content/posts");
  process.exit(1);
}

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

try {
  fs.writeFileSync(OUT, output);
  console.log(
    `Generated llms-full.txt (${posts.length} essays, ${output.length} chars)`
  );
} catch (err) {
  console.error(`Failed to write llms-full.txt: ${err.message}`);
  process.exit(1);
}
