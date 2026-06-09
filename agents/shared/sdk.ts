/**
 * The proactive-runtime SDK contract for these agents.
 *
 * The TYPES below are the published `@agent-relay/agent` contract — the package
 * shipped, so the local mirror that used to live here is gone and handlers now
 * type-check against the real SDK (`AgentDefinition`, `AgentEvent`, `Context`,
 * `ScheduleSpec`).
 *
 * `agent()`, however, stays a LOCAL registrar rather than the SDK's hosted
 * runtime. These agents dispatch from Cloudflare Pages Functions
 * (`functions/api/...`) — request-scoped Workers that cannot hold the SDK's
 * long-lived broker connection. The Pages Function reaches into
 * `handle.definition.onEvent(ctx, event)` directly, so we expose `.definition`,
 * which the hosted `agent()` (a connection-backed handle) does not. Move to the
 * hosted runtime only if these ever run on a long-lived host instead of Pages
 * Functions.
 */
export type {
  AgentDefinition,
  AgentEvent,
  AgentHandle,
  Context,
  EventType,
  Logger,
  ScheduleSpec
} from "@agent-relay/agent";

import type { AgentDefinition, AgentHandle, Context } from "@agent-relay/agent";

/** Local trigger taxonomy used by the activity log; not part of the SDK. */
export type Trigger = "time" | "change" | "message";

/**
 * Local handle shape. Extends the SDK {@link AgentHandle} with the original
 * `definition` so the Pages Function dispatch can invoke `onEvent` directly
 * (see the module comment).
 */
export type AgentHandleWithDef = AgentHandle & {
  /** The original definition. Lets the Pages Function reach `onEvent`. */
  definition: AgentDefinition;
};

/**
 * Register a proactive agent. In the Pages-Functions deployment this records
 * the definition and returns a handle whose `definition` the entry-point
 * dispatches against; it does not open a broker connection. `trigger()` throws
 * — callers invoke `handle.definition.onEvent(ctx, event)` directly.
 */
export function agent(definition: AgentDefinition): AgentHandleWithDef {
  return {
    definition,
    ready: Promise.resolve(),
    stop: async () => {},
    ctx: {} as Context,
    trigger: async () => {
      throw new Error(
        "local registrar: invoke handle.definition.onEvent(ctx, event) directly",
      );
    },
  };
}
