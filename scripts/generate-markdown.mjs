import { createRequire } from "node:module";
import fs from "node:fs";
import path from "node:path";

const require = createRequire(import.meta.url);
const matter = require("gray-matter");

const POSTS_DIR = path.join(process.cwd(), "content", "posts");
const OUT_DIR = path.join(process.cwd(), "public", "posts");
const SITE_URL = "https://proactiveagents.dev";

function stripMdxComponents(content) {
  let md = content;

  // Pass 1: Remove self-closing JSX tags (PascalCase).
  // Use [^<>] to avoid matching through nested angle brackets.
  // Loop until stable — removing inner tags may reveal outer ones.
  let prev;
  do {
    prev = md;
    md = md.replace(/<[A-Z]\w*(?:\s+[^<>]*)?\s*\/>/g, "");
  } while (md !== prev);

  // Pass 2: Remove opening JSX tags (PascalCase components).
  // After self-closing removal, attributes no longer contain <>.
  md = md.replace(/<[A-Z]\w*(?:\s+[^<>]*)?\s*>/g, "");

  // Pass 3: Remove closing JSX tags.
  md = md.replace(/<\/[A-Z]\w*\s*>/g, "");

  // Remove import/export statements
  md = md.replace(/^import\s+.*$/gm, "");
  md = md.replace(/^export\s+.*$/gm, "");

  // Collapse 3+ blank lines into 2
  md = md.replace(/\n{3,}/g, "\n\n");

  return md.trim();
}

const files = fs.readdirSync(POSTS_DIR).filter((f) => f.endsWith(".mdx"));

fs.mkdirSync(OUT_DIR, { recursive: true });

for (const file of files) {
  const slug = file.replace(/\.mdx$/, "");
  const raw = fs.readFileSync(path.join(POSTS_DIR, file), "utf8");
  const { data, content } = matter(raw);

  const cleaned = stripMdxComponents(content);

  const md = [
    "---",
    `title: "${data.title}"`,
    `summary: "${data.summary}"`,
    `date: ${data.date}`,
    `author: Khaliq Gant`,
    `url: ${SITE_URL}/posts/${slug}/`,
    "---",
    "",
    `# ${data.title}`,
    "",
    cleaned,
    "",
  ].join("\n");

  fs.writeFileSync(path.join(OUT_DIR, `${slug}.md`), md);
}

console.log(`Generated ${files.length} markdown files in public/posts/`);
