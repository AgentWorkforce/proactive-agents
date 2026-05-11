# Essay Authoring Skill

When writing or editing an MDX essay for this site, follow these patterns to produce rich, scrollytelling-style content with sticky figures, callouts, and embedded media.

## Article Structure

Every essay should use the **Scene** component to pair figures with text. Scenes create a two-column layout where the figure sticks to the viewport while the reader scrolls through the accompanying text. This is the core reading experience — articles without Scenes feel flat.

### Scene component

```mdx
<Scene figure={<MyFigure />} caption="Short description of the figure.">

## Section heading

Body text that scrolls alongside the sticky figure. Can include
multiple paragraphs, lists, callouts, etc.

</Scene>
```

Props:
- `figure` (required): A React SVG figure component. These live in `components/mdx/figures.tsx`.
- `caption` (optional): Short uppercase label below the figure.
- `side` (optional): `"left"` (default) or `"right"`. Alternate sides for visual rhythm.

Rules:
- Alternate `side="left"` and `side="right"` across consecutive Scenes for visual variety.
- Each Scene should contain 1-3 sections of text — enough to scroll past the figure, but not so much the figure feels abandoned.
- The first Scene in an article should appear early (within the first 2-3 paragraphs) to establish the scrollytelling pattern.
- On mobile, Scenes stack vertically (figure above text), so content must make sense in both layouts.

### Figure components

Figures are custom SVG React components in `components/mdx/figures.tsx`. They use a shared color constant object `C`:

```typescript
const C = {
  paper: "#fbf6ec",
  ink: "#2a2521",
  inkSoft: "#4d4640",
  faint: "#8a7f74",
  rule: "#e8ddc8",
  peach: "#ffd6bf",
  butter: "#fbe7a6",
  sage: "#c8dcbf",
  lavender: "#dccaee",
  rose: "#f2c4cd",
  sky: "#bedcef",
  terracotta: "#d98a6b",
  moss: "#6c8a5e",
  plum: "#7a5d8c",
};
```

When creating a new figure:
1. Add it to `components/mdx/figures.tsx` using the `C` color constants.
2. Register it in `components/mdx/mdx-components.tsx`.
3. Use `viewBox="0 0 320 320"` as the default canvas size (square, fits the Scene column).
4. Use `className="w-full"` on the SVG.
5. Keep figures illustrative and diagrammatic — not decorative. They should teach something.

Existing figures for reference:
- `PollingFigure` — clock face with polling arrows (reactive loop)
- `ProactiveFigure` — world-to-agent push arrow
- `TripleFigure` — three circles (clock/watcher/inbox) connected by dashed lines
- `WebhookTaxFigure` — list of webhook plumbing steps
- `RuntimeFigure` — architecture diagram with runtime at center
- `PromptLayerFigure` — two-layer diagram (prompt advises, runtime enforces)
- `GapMapFigure` — table-style comparison grid

## Callout components

Use Callouts to surface key insights, asides, or further reading that break out of the main text flow.

```mdx
<Callout tone="thought" label="Short label here">
Content goes here. Can include *markdown* and **formatting**.
</Callout>
```

Tones:
- `"thought"` — for key insights or "aha" moments
- `"warm"` — for human observations, ironies, or gentle critiques
- `"cool"` — for further reading, technical references, or next steps

Rules:
- Use 2-4 Callouts per essay. Too many dilutes their impact.
- Labels should be short (3-6 words) and intriguing.
- Don't use Callouts for content that should be in the main text. They're for insights that stand on their own.

## PullQuote component

For a single memorable line that deserves emphasis:

```mdx
<PullQuote>
The first time you add a webhook, it takes an afternoon. The third time — correctly — it takes longer than a sprint.
</PullQuote>
```

Use sparingly — one per essay at most.

## Sidenote component

```mdx
Some main text.<Sidenote>Aside that appears in the margin on desktop.</Sidenote>
```

**Caution:** Sidenotes use absolute positioning and can overlap body text below them. Only use when there is enough vertical space. If overlap is a risk, use a Callout instead.

## Embedded media

### iframes (LinkedIn, Twitter, etc.)

```mdx
<iframe src="https://..." height="264" width="504" frameborder="0" allowfullscreen="" title="Embedded post"></iframe>
```

Place contextually near the content the embed illustrates.

## Checklist for every article

Before considering an article complete:

- [ ] At least 2 Scene blocks with figures (alternating sides)
- [ ] Figures are illustrative SVGs that teach, not decorate
- [ ] 2-4 Callouts with varied tones
- [ ] All external references are linked
- [ ] Internal essay references use relative paths (`/posts/slug`)
- [ ] No HTML entities — use real Unicode characters (—, ', ", etc.)
- [ ] No markdown tables — use HTML `<table>` elements
- [ ] Frontmatter summary uses plain text (no HTML entities)
- [ ] Card illustration added in `components/card-illustrations.tsx` for the post slug
- [ ] New figure components registered in `components/mdx/mdx-components.tsx`
