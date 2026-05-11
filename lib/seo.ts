import type { PostMeta } from "./posts";

export const SITE_URL = "https://proactiveagents.dev";
export const SITE_NAME = "Proactive Agents";
export const SITE_DESCRIPTION =
  "The definitive guide to proactive AI agents — what they are, how they differ from reactive agents, and how to build them. Educational essays, architecture patterns, and working code.";
export const SITE_AUTHOR = "Khaliq Gant";
export const SITE_AUTHOR_URL = "https://github.com/khaliqgant";
export const SITE_ORG = "AgentWorkforce";
export const SITE_ORG_URL = "https://github.com/AgentWorkforce";

export function jsonLd(data: Record<string, unknown>): string {
  return JSON.stringify(data);
}

export function websiteSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url: SITE_URL,
    description: SITE_DESCRIPTION,
    author: organizationSchema(),
    inLanguage: "en-US",
  };
}

export function organizationSchema() {
  return {
    "@type": "Organization",
    name: SITE_ORG,
    url: SITE_ORG_URL,
    founder: personSchema(),
  };
}

export function personSchema() {
  return {
    "@type": "Person",
    name: SITE_AUTHOR,
    url: SITE_AUTHOR_URL,
    jobTitle: "Co-founder",
    worksFor: {
      "@type": "Organization",
      name: SITE_ORG,
      url: SITE_ORG_URL,
    },
  };
}

export function articleSchema(post: PostMeta) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.summary,
    datePublished: post.date,
    author: personSchema(),
    publisher: organizationSchema(),
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `${SITE_URL}/posts/${post.slug}/`,
    },
    url: `${SITE_URL}/posts/${post.slug}/`,
    inLanguage: "en-US",
    isAccessibleForFree: true,
  };
}

export function breadcrumbSchema(
  items: { name: string; url: string }[]
) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

export function faqSchema(
  questions: { question: string; answer: string }[]
) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: questions.map((q) => ({
      "@type": "Question",
      name: q.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: q.answer,
      },
    })),
  };
}

export function howToSchema(
  name: string,
  description: string,
  steps: { name: string; text: string }[]
) {
  return {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name,
    description,
    step: steps.map((s, i) => ({
      "@type": "HowToStep",
      position: i + 1,
      name: s.name,
      text: s.text,
    })),
  };
}

export function definedTermSchema(name: string, description: string) {
  return {
    "@context": "https://schema.org",
    "@type": "DefinedTerm",
    name,
    description,
    inDefinedTermSet: {
      "@type": "DefinedTermSet",
      name: "AI Agent Architecture Glossary",
    },
  };
}
