---
name: content-system
description: Strategic content production system — writer context packet, bookmarkability rubric, avoid-slop patterns, and viral postmortem. Load when planning, drafting, scoring, or reviewing any post.
metadata:
  tags: content-strategy, editorial, quality-gates, slop-detection, rubric
---

# Content System Skill

A structured content production system adapted from Shann Holmberg's framework (5M impressions in 2 weeks). Use this skill when planning, drafting, scoring, or reviewing content for the site.

## Core Principle

The unit of work is not "another post." It is something a reader wants to keep. Content is only as good as the person and the system behind it. The agent count is not the lever; the knowledge layer feeding the writer is.

## Content Object Lifecycle

Every piece of content follows one path: **idea → brief → draft → verify → publish → feedback → archive.**

Each stage has a defined artifact and a clear handoff.

```
inbox → idea.md → brief.md → draft-package.md → [verify] → publish → feedback.md → archive
```

A content object lives in its own run folder until it ships. One piece of content = one folder. The folder carries its own state.

## Directory Structure

The system depends on six directories. Map these to your existing project structure rather than creating parallel infrastructure.

```
/strategy       — positioning, audience, pillars, source watchlist
/voice          — voice profile, avoid-slop patterns
/stores         — inbox, workboard, ideas, hooks, proof, feedback
/runs/active    — one folder per in-flight content object
/runs/archive   — shipped content objects
/modules        — skill files, references, templates
/workflows      — idea-to-publish steps, verifier, scheduler, feedback loop
```

### Mapping to this project

| System directory | This project equivalent |
|---|---|
| `/strategy` | CLAUDE.md (positioning, audience, editorial rules) |
| `/voice` | CLAUDE.md "Writing Voice & Editorial" section + essay-authoring skill voice guardrails |
| `/stores/proof` | `agents/` (running agent code), `agent-log.json` (production telemetry), blog posts with real data |
| `/stores/inbox` | Notion: Proactive Agents / The genesis (briefs, ideas, status) |
| `/runs/active` | Notion post pages with status tracking |
| `/modules` | `essay-authoring/`, `content-system/` (skill directories at repo root) |
| `/workflows` | essay-authoring skill (full authoring workflow) |

## Writer Context Packet

Before drafting any content, build a tight brief. A tight packet beats a giant context window. The brief should be 400-900 tokens.

```
thesis:        one sentence the post must prove
reader:        the specific person who should save it
proof:         numbers, screenshots, stories we are allowed to use
angle:         the unexpected framing
constraints:   format, length, tone, banned phrases
voice anchors: 2-3 lines that sound like us
risks:         what would make this read as slop
open loops:    what we do not yet know, that the writer should flag
```

### How to fill each field

- **Thesis**: Not a topic. A claim. "Webhook infrastructure costs 6-8 weeks per provider" not "about webhooks."
- **Reader**: One person, by role and situation. "A senior engineer who just got asked to make their team's Slack bot proactive and is googling what that means" not "developers."
- **Proof**: Only things we can back up. Our own production data, named tools, specific numbers, code we've shipped. Never invent.
- **Angle**: The framing that makes this post different from every other one on the topic. Usually comes from our own experience or a contrarian take we can defend.
- **Constraints**: Pull from CLAUDE.md voice rules, the essay-authoring checklist, and this skill's avoid-slop patterns.
- **Voice anchors**: Pull 2-3 sentences from our best existing posts that capture the tone we want.
- **Risks**: Name the specific ways this draft could go wrong. "Could read as a sales pitch for our runtime" or "the cost numbers might feel made up without showing the math."
- **Open loops**: Flag what's missing. Better to say "I need the actual Brave Search query count from agent-log.json" than to guess.

## Bookmarkability Rubric

Score every draft before publishing. 0, 1, or 2 points each. Our bar is 8 out of 12.

| Row | Question |
|---|---|
| 1 | Does it save the reader a future task? |
| 2 | Does it include proof (numbers, named example, screenshot)? |
| 3 | Does it give a reusable takeaway (template, checklist, framework)? |
| 4 | Does it have a specific audience and job-to-be-done? |
| 5 | Can it be applied without us being in the room? |
| 6 | Does it have a strong visual (figure, table, diagram)? |

Below 8: the draft goes back to the brief, not to the trash. Most weak drafts are good drafts that skipped one row in the rubric. Fix the row, re-score, ship.

## Avoid-Slop Patterns

These patterns mark content as AI-generated. Run every draft against this list. Organized by severity.

### Tier 1: Immediate rewrites

- Promotional language: "groundbreaking", "game-changing", "revolutionary", "cutting-edge"
- Significance inflation: "pivotal moment", "testament to", "paradigm shift"
- Vague attribution: "experts believe", "studies show", "research indicates" (without naming the source)
- False agency: "the system compounds", "the data tells us", "the framework reveals"
- Rhetorical setups: "the question is whether you X", "the real question is"
- Staccato fragmentation: "No X. No Y. No Z." (tricolon declarations)
- Em dash overuse: more than 1-2 per section
- Filler adverbs: "actually", "literally", "quietly", "fundamentally", "essentially"

### Tier 2: Rewrite if possible

- Declarative closers: "That is the [noun]." or "That's the [noun]."
- Dramatic closers: grand tagline-worthy final lines
- Enumeration-then-verdict: listing items then declaring what they are as if revealing something
- False-modesty pivots: "It sounds simple. In some ways it's harder."
- "This is not X. It is Y." inversions
- Short parallel declarations that repeat the subject: "The cost is real. It is recurring."
- Neat rhetorical pivots that feel rehearsed
- Branded phrase repetition: using the same branded terminology ("clock, listener, inbox") more than 2-3 times per essay

### Tier 3: Watch for accumulation

- Sentences that could appear in any AI-generated essay on any topic
- Overuse of "in practice", "in other words", "put differently"
- "Let's be honest" / "the honest answer is" (ironically dishonest framing)
- Starting consecutive sentences with the same word

## Viral Postmortem (Final Pass)

Before publishing, run this analysis on the draft. The model must point at exact lines, not offer generic praise.

For each category, identify a specific line:
- **Hook move**: the line that stops the scroll. Why does it work mechanically?
- **Credibility**: the line that makes a reader believe us. What proof does it carry?
- **Screenshottable line**: the line someone would capture and share
- **Save-worthy line**: the line that makes someone bookmark the post
- **Reply trigger**: the line that makes someone reply or forward
- **Weakest part**: the line or section to fix before shipping

If you cannot point at a specific line for any category, that category needs work before publishing.

## Two-Model Split

Writing and orchestration are different jobs. They reward different approaches.

**Writer concerns**: taste, rhythm, compression, voice, the actual draft. Use the strongest available model. Prioritize voice fidelity over speed.

**Orchestrator concerns**: routing between layers, packaging context for the writer, deciding what gets passed in, running the verifier, handoff to publish. Prioritize reliability and tool access over prose quality.

In practice for this project: the essay-authoring skill handles the writer role, this content-system skill handles the orchestration and quality control role.

## Feedback Loop

After every published piece:
1. Record what worked and what didn't in the Notion post page
2. Note any slop patterns that slipped through (add to avoid-slop list if new)
3. Check engagement signals (if available) against the bookmarkability score
4. Update the voice profile if the piece revealed something new about our tone
5. Archive the run: move from active tracking to reference

The feedback loop is the moat. A system without feedback produces the same quality forever. A system with feedback compounds.

## When to Use This Skill

- **Planning a new post**: Build the writer context packet first
- **Scoring a draft**: Run the bookmarkability rubric
- **Final review**: Run the viral postmortem + avoid-slop check
- **Post-publish**: Record feedback, update patterns
- **Content strategy**: Review pillars, proof inventory, audience definition

## Integration with Other Skills

- **essay-authoring**: Handles the mechanical writing patterns (Scene components, figure creation, MDX structure). This skill handles the strategic layer (what to write, why, for whom, and quality gates).
- **CLAUDE.md**: The voice rules there are the floor. This skill's avoid-slop patterns and rubric are the ceiling.
