# Proactive Agents

A working manual on **proactive agents** — software that wakes up because time
passed, data changed, or someone spoke. Less brochure, more textbook with
opinions.

→ Read it: [proactiveagents.dev](https://proactiveagents.dev)

## What's in here

- **[`/app`, `/components`, `/content`](./content/posts)** — the published
  site (Next.js + MDX + Tailwind). Essays live in
  `content/posts/*.mdx`.
- **[`/agents`](./agents)** — the proactive agents that operate the site
  itself. Each is a single `agent({ ... })` definition. Live activity at
  [proactiveagents.dev/agent](https://proactiveagents.dev/agent).
- **[`/functions`](./functions)** — Cloudflare Pages Functions that act as
  the runtime entry points for each agent (until the umbrella SDK ships).

## Run locally

```bash
npm install
npm run dev          # http://localhost:3000
```

## Deploy

Static export to Cloudflare Pages on push to `main` via the
[deploy workflow](.github/workflows/deploy.yml). Production at
[proactiveagents.dev](https://proactiveagents.dev).

## The agents

| Name              | Trigger | Status       | What it does                                          |
|-------------------|---------|--------------|-------------------------------------------------------|
| `weekly-digest`   | time    | live         | Saturday 09:00 UTC. Web + Reddit → one rolling issue. |
| `notion-to-blog`  | change  | scaffolded   | Notion drafts → MDX PR.                               |
| `sunday-ping`     | time    | scaffolded   | Reads digest, drafts an outline, Slack DM.            |
| `pr-reviewer`     | change  | scaffolded   | Deploy preview, dead-link, copy-edit comments.        |
| `manual-chatbot`  | message | scaffolded   | Answers DMs grounded in the published essays.         |

See [`agents/README.md`](./agents/README.md) for how the runtime contract
maps onto each handler.

## Stack

Next.js (App Router, static export) · Tailwind v4 · GSAP for scroll
choreography · MDX for essays · Cloudflare Pages + Pages Functions ·
relaycron for schedules · GitHub App for repo writes · OpenRouter
(`google/gemini-2.5-flash`) for clustering · Brave Search API for web
discovery.

## License

MIT. Take what's useful.

—

Made by [AgentWorkforce](https://github.com/AgentWorkforce).
