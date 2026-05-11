# Proactive Runtime Spec Reference

Source: `cloud` repo, `spec/proactive-runtime` branch (PR #515).
This doc captures the interfaces agents are written against so that
every agent in this repo aligns with the runtime before it ships.

## Core DX

```ts
import { agent } from "@agent-relay/agent";

agent({
  workspace: "proactive-agents",
  name: "notion-to-blog",
  schedule: "0 9 * * 6",          // relaycron
  watch: "/notion/databases/drafts/pages/**",  // relayfile
  inbox: ["@self", "#ops"],       // relaycast

  async onEvent(ctx, event) { /* one handler, three triggers */ },
  async onStart(ctx) { /* cold-start hook */ },
  async onError(ctx, error, event) { /* structured error reporting */ },

  options: {
    concurrency: 1,
    handlerTimeoutMs: 30_000,
    replayOnStart: "none",
  },
});
```

## AgentEvent

Events are notifications (<1 KB), not raw payloads. Use `expand()` for detail.

```ts
type EventType =
  | "startup"
  | "cron.tick"
  | "relayfile.changed"
  | "relaycast.message"
  | (string & {});  // provider events: "github.pull_request.opened", etc.

type AgentEvent<T extends EventType = EventType> = {
  id: string;                      // unique, used for dedup
  workspace: string;
  type: T;
  occurredAt: string;              // ISO 8601
  attempt: number;                 // starts at 1, increments on retry

  resource: {
    path: string;                  // relayfile VFS path
    kind: string;                  // "page", "ticket", "pull_request", etc.
    id: string;                    // provider-specific ID
    provider: string;              // "notion", "github", "slack", etc.
  };

  summary: {
    title?: string;
    status?: string;
    priority?: string;
    labels?: string[];
    actor?: { id: string; displayName?: string };
    fieldsChanged?: string[];
    tags?: string[];
  };

  expand: <L extends "summary" | "full" | "diff" | "thread">(
    level?: L
  ) => Promise<unknown>;

  digest?: string;                 // optional short text digest
};
```

### Progressive disclosure via expand()

| Level       | What it returns                                      |
|-------------|------------------------------------------------------|
| `"summary"` | Structured summary (title, status, labels, actor)    |
| `"full"`    | Full relayfile VFS content for `event.resource.path` |
| `"diff"`    | Before/after delta of what changed                   |
| `"thread"`  | Comments / conversation thread on the resource       |

Summary builders per provider extract the summary fields from raw webhooks.
Full expansion reads from relayfile VFS at `event.resource.path`.

## Context

```ts
type Context = {
  workspace: string;
  agentId: string;
  logger: Logger;
  signal: AbortSignal;

  files: {
    read(path: string): Promise<{ body: unknown; meta?: unknown } | null>;
    write(path: string, body: unknown, meta?: Record<string, unknown>): Promise<void>;
    delete(path: string): Promise<void>;
    list(glob: string): Promise<{ path: string }[]>;
  };

  messages: {
    post(channel: string, text: string, opts?: Record<string, unknown>): Promise<{ id: string }>;
    reply(threadId: string, text: string, opts?: Record<string, unknown>): Promise<{ id: string }>;
    dm(agentOrUser: string, text: string): Promise<{ id: string }>;
  };

  schedule: {
    at(when: string | Date, payload?: unknown): Promise<{ id: string }>;
    every(cron: string, payload?: unknown, opts?: { tz?: string }): Promise<{ id: string }>;
    cancel(id: string): Promise<void>;
  };

  once<T>(key: string, fn: () => Promise<T>): Promise<T>;
};
```

### Key methods

- **`ctx.once(key, fn)`** — Idempotency guard. Runs `fn` only if `key` hasn't
  been seen before. Returns the cached result on subsequent calls.
- **`ctx.files`** — VFS backed by relayfile. Paths like `/_meta/agent-log.json`
  map to visible content; `/_internal/<agent>/<x>` maps to hidden state.
- **`ctx.messages`** — relaycast. Post to channels, reply to threads, DM agents or users.
- **`ctx.schedule`** — relaycron. Schedule one-off or recurring events.

## Lifecycle

1. Runtime receives webhook / cron tick / message
2. Gateway (CF Worker + Durable Object) does fan-in, dedup, ordering
3. `onStart(ctx)` called on cold start (before first event)
4. `onEvent(ctx, event)` called per event, at-least-once delivery
5. On unhandled throw → `onError(ctx, error, event)` if defined, then DLQ

Retry policy: 3 attempts with exponential backoff (1s, 5s, 25s).
After exhaustion → dead-letter queue.

## Milestones

| Milestone | Trigger        | Status    | Notes                                              |
|-----------|----------------|-----------|----------------------------------------------------|
| M1        | time (cron)    | Shipped   | weekly-digest, sunday-ping use this today           |
| M2        | data (change)  | Building  | relayfile + adapters. notion-to-blog needs this     |
| M3        | message        | Planned   | relaycast. manual-chatbot needs this                |

## Bootstrap pattern (pre-runtime)

For agents whose trigger type isn't shipped yet, use a Cloudflare Pages
Function that synthesizes events. This is how weekly-digest ran before
relaycron shipped, and how notion-to-blog runs before M2 data triggers ship.

The bootstrap handler:
1. Authenticates the request (webhook secret or Notion webhook signature)
2. Calls `setEnv(env)` on the agent module
3. Builds a `Context` via `makeCloudflareContext()`
4. Synthesizes an `AgentEvent` matching the spec shape
5. Calls `handle.definition.onEvent(ctx, event)` directly

When the runtime ships, the bootstrap handler gets deleted and the agent
deploys via `relay deploy` unchanged.

## relayfile-adapters: Notion package

Package: `@relayfile/adapter-notion` (npm, v0.2.2 — source in `relayfile-adapters/packages/notion`)

Key exports agents should use instead of building custom Notion clients:

```ts
// Client — handles auth, pagination, versioning
class NotionApiClient {
  constructor(provider?: NotionConnectionProvider, config?: NotionAdapterConfig);
  request<T>(method, endpoint, options?): Promise<T>;
  paginate<T>(method, endpoint, options?): Promise<T[]>;
  healthCheck(): Promise<boolean>;
}

// Block fetching — recursive with children
function fetchBlockChildrenRecursively(
  client: NotionApiClient,
  blockId: string,
): Promise<NotionBlock[]>;

// Rendering — blocks to markdown
function renderBlocksToMarkdown(blocks: NotionBlock[]): string;
function renderRichTextToMarkdown(richText: NotionRichText[]): string;

// Markdown API — fetch/update page content as markdown
function retrievePageMarkdown(client, pageId): Promise<string>;
function resolvePageMarkdown(client, pageId, blocks?): Promise<string>;

// Writeback — resolve VFS writes into Notion API calls
function resolveWritebackRequest(path, content): Promise<NotionWriteOp>;
```

**Note for this site:** `renderBlocksToMarkdown` produces markdown pipe tables.
This site does NOT have `remark-gfm`, so tables won't render. A thin
post-processing step must convert pipe tables to HTML `<table>` elements.
Similarly, Notion callouts render as `<callout>` tags and need mapping to
the site's `<Callout>` component.
