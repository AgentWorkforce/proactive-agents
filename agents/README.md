# /agents

The proactive agents that run this site. Each subdirectory is one agent. Each
agent has a single entry point — `handler.ts` — that takes a typed event and
returns nothing (side effects only).

## Why these live in this repo

This site argues that a proactive agent is small code wrapped around the right
runtime. Co-locating the agents with the site they operate keeps the demo
honest and the deploy simple.

## The roster

| Directory          | Trigger | What it does                                                                 |
|--------------------|---------|------------------------------------------------------------------------------|
| `notion-to-blog`   | change  | Watches a Notion database. When a page flips to `ready`, converts to MDX and opens a PR. |
| `weekly-digest`    | time    | Weekly. Searches the web + Reddit for "proactive agents" mentions. Files one rolling GitHub issue, deduped, grouped by topic. |
| `sunday-ping`      | time    | Sundays at 09:00 local. Reads the latest weekly digest and pings me on Slack with a draft outline for the next post. |
| `pr-reviewer`      | change  | Comments on PRs to this repo with deploy preview, dead-link check, copy-edit notes. |
| `manual-chatbot`   | message | Answers Slack DMs / emails grounded in the published essays.                  |

## Shape

```
agents/
  shared/
    log.ts          # writeLogEntry({ agent, action, summary, ... }) → appends to content/agent-log.json
    types.ts        # AgentEntry, Trigger, Outcome (re-exports from lib/agent-log.ts)
  notion-to-blog/
    handler.ts      # export async function handler(event: NotionPageEvent)
  weekly-digest/
    handler.ts      # export async function handler() — invoked by relaycron
  sunday-ping/
    handler.ts      # export async function handler()
  pr-reviewer/
    handler.ts      # export async function handler(event: PullRequestEvent)
  manual-chatbot/
    handler.ts      # export async function handler(event: InboxMessage)
```

## Wiring

Each handler is invoked by the proactive runtime (`relaycron` for time,
`relayfile` for change, `relaycast` for message). The wiring lives in the
runtime config, not in the handler — so you can read each handler in isolation
and see the full behaviour.

Every handler ends by calling `writeLogEntry(...)` so the public `/agent` page
on the site stays current. That page is the receipts.

## Status

Skeletons. Each handler currently logs to the activity feed and returns;
external integrations (Notion, GitHub, Slack, Reddit, web search) are stubbed.
Wire them in PRs &mdash; the PR reviewer agent will check your work.
