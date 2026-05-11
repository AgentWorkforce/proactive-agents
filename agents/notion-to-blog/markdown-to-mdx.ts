/**
 * Post-process @relayfile/adapter-notion markdown into site-specific MDX.
 *
 * The adapter's renderBlocksToMarkdown produces standard markdown. This
 * module handles the site-specific transformations:
 *   - Pipe tables → HTML <table> (remark-gfm is not enabled)
 *   - <callout> tags → <Callout> component
 *   - Notion page mentions → /posts/<slug> internal links
 *   - Frontmatter wrapper
 */

export type Frontmatter = {
  title: string;
  summary: string;
  date: string;
  accent: string;
  dropcap: boolean;
};

export function notionMarkdownToMdx(
  markdown: string,
  frontmatter: Frontmatter,
  pageIdToSlug?: Map<string, string>,
): string {
  let mdx = markdown;

  mdx = convertPipeTablesToHtml(mdx);
  mdx = convertCallouts(mdx);

  if (pageIdToSlug?.size) {
    mdx = resolvePageMentions(mdx, pageIdToSlug);
  }

  const fm = buildFrontmatter(frontmatter);
  return `${fm}\n\n${mdx.trim()}\n`;
}

export function buildFrontmatter(fm: Frontmatter): string {
  return [
    "---",
    `title: ${JSON.stringify(fm.title)}`,
    `summary: ${JSON.stringify(fm.summary)}`,
    `date: ${JSON.stringify(fm.date)}`,
    `accent: ${JSON.stringify(fm.accent)}`,
    `dropcap: ${fm.dropcap}`,
    "---",
  ].join("\n");
}

/**
 * Convert markdown pipe tables to HTML <table> elements.
 * The site doesn't have remark-gfm, so pipe tables render as raw text.
 */
function convertPipeTablesToHtml(md: string): string {
  const lines = md.split("\n");
  const result: string[] = [];
  let i = 0;

  while (i < lines.length) {
    if (!isPipeTableRow(lines[i])) {
      result.push(lines[i]);
      i++;
      continue;
    }

    const tableLines: string[] = [];
    while (i < lines.length && isPipeTableRow(lines[i])) {
      tableLines.push(lines[i]);
      i++;
    }

    if (tableLines.length < 2) {
      result.push(...tableLines);
      continue;
    }

    const hasSeparator = isSeparatorRow(tableLines[1]);
    const headerRow = hasSeparator ? tableLines[0] : null;
    const dataRows = hasSeparator ? tableLines.slice(2) : tableLines;

    const html: string[] = ["<table>"];
    if (headerRow) {
      html.push("  <tr>");
      for (const cell of parsePipeRow(headerRow)) {
        html.push(`    <th>${cell}</th>`);
      }
      html.push("  </tr>");
    }
    for (const row of dataRows) {
      html.push("  <tr>");
      for (const cell of parsePipeRow(row)) {
        html.push(`    <td>${cell}</td>`);
      }
      html.push("  </tr>");
    }
    html.push("</table>");
    result.push(html.join("\n"));
  }

  return result.join("\n");
}

function isPipeTableRow(line: string): boolean {
  const trimmed = line.trim();
  return trimmed.startsWith("|") && trimmed.endsWith("|") && trimmed.length > 2;
}

function isSeparatorRow(line: string): boolean {
  return isPipeTableRow(line) && /^\|[\s:|-]+\|$/.test(line.trim());
}

function parsePipeRow(line: string): string[] {
  return line
    .trim()
    .replace(/^\||\|$/g, "")
    .split("|")
    .map((c) => c.trim());
}

/**
 * Convert adapter's <callout> tags to the site's <Callout> component.
 * The adapter renders: <callout icon="💡">content</callout>
 */
function convertCallouts(md: string): string {
  return md.replace(
    /<callout(?:\s+icon="([^"]*)")?>([\s\S]*?)<\/callout>/gi,
    (_match, icon, content) => {
      const iconAttr = icon ? ` icon="${icon}"` : ' icon="💡"';
      return `<Callout${iconAttr}>\n${(content as string).trim()}\n</Callout>`;
    },
  );
}

/**
 * Resolve Notion page mention UUIDs to /posts/<slug> links.
 * The adapter renders page mentions as <page id="uuid">title</page>.
 */
function resolvePageMentions(md: string, slugMap: Map<string, string>): string {
  return md.replace(
    /<page\s+id="([^"]*)">([\s\S]*?)<\/page>/gi,
    (_match, id, text) => {
      const normalized = (id as string).replace(/-/g, "");
      for (const [pageId, slug] of slugMap) {
        if (pageId.replace(/-/g, "") === normalized) {
          return `[${text}](/posts/${slug})`;
        }
      }
      return text as string;
    },
  );
}
