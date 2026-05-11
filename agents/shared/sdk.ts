/**
 * Local mirror of the proactive-runtime SDK contract.
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
 * Local shim. When @agent-relay/agent ships, replace this whole module with:
 *   export { agent, type AgentDefinition, ... } from "@agent-relay/agent";
 *
 * Until then `agent()` returns a handle whose `trigger()` invokes the
 * registered `onEvent` synchronously with whatever event you pass it. This
 * is exactly the spec's "imperative trigger — useful in tests" semantic, and
 * it's how the Pages Function (functions/api/cron/[agent].ts) dispatches
 * cron.tick events until the real runtime takes over.
 */
export type AgentHandleWithDef = AgentHandle & {
  /** The original definition. Lets the Pages Function reach `onEvent`. */
  definition: AgentDefinition;
};

export function agent(definition: AgentDefinition): AgentHandleWithDef {
  // No real-time dispatch in the shim — schedules / watches / inbox are not
  // wired to anything. The runtime takes that over. Until then, callers
  // (e.g. functions/api/cron/[agent].ts) reach into `handle.definition` and
  // invoke `onEvent(realCtx, event)` directly.
  return {
    definition,
    ready: Promise.resolve(),
    stop: async () => {},
    ctx: {} as Context,
    trigger: async () => {
      throw new Error(
        "shim: handle.trigger() not implemented — invoke handle.definition.onEvent(ctx, event) directly",
      );
    },
  };
}
