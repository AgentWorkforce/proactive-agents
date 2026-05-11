/**
 * Local mirror of the proactive-runtime SDK contract.
 *
 * Source of truth: https://github.com/AgentWorkforce/cloud/blob/spec/proactive-runtime/docs/proactive-runtime/spec.md
 *
 * Once `@agent-relay/agent` is published, replace this whole file with:
 *   export { agent, type AgentDefinition, type AgentEvent, type Context } from "@agent-relay/agent";
 *
 * Until then we keep the types here so the handlers type-check, and `agent()`
 * runs as a no-op shim in local dev (registers the definition, doesn't dispatch).
 */

export type Trigger = "time" | "change" | "message";

export type ScheduleSpec =
  | string
  | { cron: string; tz?: string }
  | { at: string | Date };

export type EventType =
  | "startup"
  | "cron.tick"
  | "relayfile.changed"
  | "relaycast.message"
  | (string & {}); // provider events: "github.pull_request.opened", "notion.page.updated", etc.

export type AgentEvent<T extends EventType = EventType> = {
  id: string;
  workspace: string;
  type: T;
  occurredAt: string;
  attempt: number;
  resource: {
    path: string;
    kind: string;
    id: string;
    provider: string;
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
  expand: <L extends "summary" | "full" | "diff" | "thread">(level?: L) => Promise<unknown>;
  digest?: string;
};

export type Logger = {
  info(msg: string, meta?: Record<string, unknown>): void;
  warn(msg: string, meta?: Record<string, unknown>): void;
  error(msg: string, meta?: Record<string, unknown>): void;
};

export type Context = {
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

export type AgentDefinition = {
  workspace: string;
  name?: string;
  schedule?: ScheduleSpec | ScheduleSpec[];
  watch?: string | string[];
  inbox?: string | string[];
  onEvent: (ctx: Context, event: AgentEvent) => Promise<void> | void;
  onStart?: (ctx: Context) => Promise<void> | void;
  onError?: (ctx: Context, error: Error, event: AgentEvent) => Promise<void> | void;
  options?: {
    concurrency?: number;
    handlerTimeoutMs?: number;
    replayOnStart?: "none" | string;
  };
};

export type AgentHandle = {
  ready: Promise<void>;
  stop: () => Promise<void>;
  trigger: (event: Partial<AgentEvent>) => Promise<void>;
  ctx: Context;
};

/**
 * Local shim. When @agent-relay/agent ships, this whole function gets
 * replaced by the real SDK import. Right now it just logs that the agent
 * was registered and returns a Promise that never resolves (so importing
 * a handler module from a script would block the process — mirroring the
 * real "long-lived agent" semantics without doing any real work).
 *
 * To actually exercise a handler locally before the runtime ships, call
 * `definition.onEvent(mockCtx, mockEvent)` directly from a test.
 */
export function agent(definition: AgentDefinition): AgentHandle {
  const id = `${definition.workspace}/${definition.name ?? "default"}`;
  // eslint-disable-next-line no-console
  console.log(
    `[agent shim] registered ${id} — schedule=${JSON.stringify(definition.schedule)}, watch=${JSON.stringify(definition.watch)}, inbox=${JSON.stringify(definition.inbox)}`
  );
  const ctx = {} as Context;
  return {
    ready: new Promise(() => {}),
    stop: async () => {},
    trigger: async () => {},
    ctx,
  };
}
