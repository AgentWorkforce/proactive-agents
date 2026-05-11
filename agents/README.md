# /agents

The proactive agents that run this site. Each agent is a single
`agent({ ... })` call against the proactive-runtime SDK contract.

## The contract

Source: [`AgentWorkforce/cloud · spec/proactive-runtime · docs/proactive-runtime/spec.md`](https://github.com/AgentWorkforce/cloud/blob/spec/proactive-runtime/docs/proactive-runtime/spec.md).

The shape is:

```ts
import { agent } from "@agent-relay/agent";

agent({
  workspace: "support",
  schedule: "*/5 * * * *",
  watch: ["/zendesk/tickets/**"],
  inbox: ["@self"],
  onEvent: async (ctx, event) => {
    // event.type is "cron.tick" | "relayfile.changed" | "relaycast.message"
  },
});
```

One handler. Three triggers. One workspace. The whole API for the 90% case.

## Status: spec-ahead

`@agent-relay/agent` is not yet published. Until it is, the agents import
from `agents/shared/sdk.ts` — a local mirror of the spec types plus a no-op
`agent()` shim. When the package ships, the shim file gets one diff:

```diff
- export { agent, type AgentDefinition } from "./local-shim";
+ export { agent, type AgentDefinition } from "@agent-relay/agent";
```

Every agent file then runs unchanged.

## The roster

| File                              | Trigger | What it does                                                  |
|-----------------------------------|---------|---------------------------------------------------------------|
| `notion-to-blog/agent.ts`         | change  | Watch Notion drafts DB; on `status=ready`, MDX → PR.          |
| `weekly-digest/agent.ts`          | time    | Saturday 09:00 UTC. Web + Reddit → one rolling GitHub issue. |
| `sunday-ping/agent.ts`            | time    | Sunday 09:00 ET. Reads digest, drafts outline, Slack DM.      |
| `pr-reviewer/agent.ts`            | change  | Watch repo PRs; deploy preview, dead-link, copy-edit notes.   |
| `manual-chatbot/agent.ts`         | message | DMs + `#manual`. RAG over published essays. Refuses by default. |

## Side effects

Every agent calls `writeLogEntry(...)` from `shared/log.ts` so the public
[/agent page](../app/agent/page.tsx) stays current. That page is the receipts.

## Local dev

```bash
# Type-check the agents alongside the rest of the site
npx tsc --noEmit
```

To exercise an agent's behaviour without the runtime, call its `onEvent`
directly from a test with a mock `Context` and `AgentEvent`. The shim's
`agent()` registers the definition and returns; it does not dispatch events.

## Wiring (when the runtime ships)

1. `relay login`
2. `relay workspaces create proactive-agents`
3. `relay providers connect github notion slack reddit tavily`
4. `relay deploy agents/weekly-digest/agent.ts` (and similar for the others)

The runtime reads the `agent({...})` definition, registers schedules with
relaycron, watch globs with relayfile, channel subscriptions with relaycast,
and starts dispatching events to `onEvent`.
