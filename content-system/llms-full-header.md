# Proactive Agents — Full Content

> The definitive guide to proactive AI agents — what they are, how they differ from reactive agents, and how to build them.

Site: https://proactiveagents.dev
Author: Khaliq Gant, co-founder of AgentWorkforce

---

## What Is a Proactive Agent?

A proactive agent is an AI agent that acts without being prompted. Instead of waiting for a human to type a message or click a button, it wakes itself up when something in its environment changes — time passes, data mutates, or a message arrives — and decides whether and how to act.

This is the architectural opposite of a reactive agent, which sits idle until explicitly invoked. Most AI agents today are reactive: they receive a prompt, execute tool calls, return a response, and go back to sleep. A proactive agent is always running in the background, watching the world, and acting when the moment is right.

### The Three Triggers

A proactive agent is defined by how it wakes up. There are exactly three triggers:

1. **Time**: The agent runs on a schedule or interval. Every 15 minutes, every Monday at 9am, every quiet hour past midnight. This is the simplest trigger but the least differentiated — a schedule alone is just a cron job.

2. **Change**: The agent watches for data mutations. A ticket moves in Linear, a record updates in Salesforce, a file appears in a shared drive. The agent receives a push event (via webhook) the moment the change happens, rather than polling for it.

3. **Message**: Someone addresses the agent directly — a human, another agent, or a system. The agent responds in its own time, not on a polling cycle.

A truly proactive agent listens for all three. Pick one and you've built a smarter cron job. Pick two and you've built a chatbot that polls. The composition of all three is what makes an agent proactive.

### Proactive vs Reactive: The Core Difference

| Dimension | Reactive Agent | Proactive Agent |
|-----------|---------------|-----------------|
| Activation | Waits to be called | Wakes itself up |
| Data freshness | Polls on interval (N seconds stale) | Push events (real-time) |
| State | Stateless between runs | Persistent memory |
| Failure mode | Forgets what it did | Checkpoints and resumes |
| Architecture | Function called by a user | Participant in a system |

The reactive agent asks: "What changed in the last five minutes?" The proactive agent asks: "What just changed?" The first is a query you have to invent. The second is a fact the world hands you.

### Why Most Agents Are Still Reactive

Three engineering problems keep agents reactive:

1. **Wake-ups are infrastructure.** Polling is easy; push is hard. Stable URLs, signature schemes, normalized events, durable triggers — none of it ships in a model SDK. Someone has to build it.

2. **State is harder than it looks.** Between wake-ups the agent has to remember what it saw, what it acted on, what it's still in the middle of. Most agents wake up amnesiac and re-read the world from scratch.

3. **Restraint is a research problem.** An agent that fires too often loses trust faster than one that misses things. Calibrated restraint — knowing when NOT to act — is a known-hard problem even at the frontier.

### The Three Primitives

A proactive agent requires three primitives wired together:

1. **A wake-up mechanism** — a clock (schedules), a watcher (change events from providers), and an inbox (messages from humans and systems).

2. **Persistent state** — a place for the agent to remember what it saw, what it did, and what it's in the middle of. This is closer to a filesystem than a database: real-time read/write, conflict detection, change events when anything moves.

3. **Durability** — checkpointing (resume after failure), idempotency (don't repeat actions), spend control (prevent runaway loops), and scoped auth (limit blast radius).

Together these form the "proactive runtime" — the infrastructure that sits underneath the agent and handles everything that isn't the agent's actual logic.
