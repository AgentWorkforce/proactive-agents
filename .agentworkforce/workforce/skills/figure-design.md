# Figure Design Skill

When creating SVG figure components for essays, follow these rules to produce clean, readable diagrams that teach a concept at a glance.

## Where figures live

- Figure components: `components/mdx/figures.tsx`
- Component registry: `components/mdx/mdx-components.tsx` (import + add to the `mdxComponents` object)
- Scene lookup: `components/mdx/scene.tsx` uses `import * as Figures` and builds a registry automatically. New exports from `figures.tsx` are available immediately.

## Color palette

Always use the shared `C` constant object defined at the top of `figures.tsx`:

```typescript
const C = {
  paper: "#fbf6ec",  ink: "#2a2521",    inkSoft: "#4d4640",
  faint: "#8a7f74",  rule: "#e8ddc8",   peach: "#ffd6bf",
  butter: "#fbe7a6", sage: "#c8dcbf",   lavender: "#dccaee",
  rose: "#f2c4cd",   sky: "#bedcef",    terracotta: "#d98a6b",
  moss: "#6c8a5e",   plum: "#7a5d8c",
};
```

- Use `C.terracotta` as the accent/highlight color
- Use `C.ink` for primary text and strokes
- Use `C.faint` for secondary text and subtle elements
- Use `C.paper` for shape fills that need a clean background
- Use the pastel colors (`butter`, `sage`, `lavender`, `peach`, `rose`, `sky`) with `fillOpacity="0.3"` to `"0.5"` for soft background fills

## Design principles

1. **Teach one thing.** Each figure should communicate a single concept. If you need to show two ideas, make two figures.

2. **Readable at small sizes.** Figures render in a 5-column sidebar (roughly 300px on desktop). Text must be legible:
   - Labels: `fontSize="12"` to `"14"` with `var(--font-display)`
   - Sub-labels: `fontSize="9"` to `"10"` with `var(--font-mono)`
   - Never go below `fontSize="8"`

3. **Give text room.** The most common mistake is cramming text into tight shapes. Rules:
   - Circle radius should be at least 36px if it contains a label + sub-label
   - Rectangles: minimum 60px wide and 36px tall for a single label
   - Leave 8-12px padding inside shapes
   - Arrows between shapes need at least 20px gap

4. **Prefer simple layouts.** In order of preference:
   - **Stacked rows** separated by a rule line (best for comparisons)
   - **Horizontal flow** with arrows (best for sequences/pipelines)
   - **Stacked layers** (best for architecture/hierarchy)
   - **Converging arrows** (best for multiple inputs to one output)
   - Avoid radial gradients and large background circles unless necessary

5. **Keep stroke weights consistent.** Use `strokeWidth="1.2"` to `"1.5"` for shapes, `"1"` to `"1.2"` for arrows and connectors.

6. **Use dashed lines sparingly.** `strokeDasharray="4 3"` for optional/weak connections or placeholder shapes.

## SVG template

```typescript
export function MyFigure() {
  return (
    <svg viewBox="0 0 320 240" className="w-full">
      {/* viewBox height: 180-320 depending on content */}
      {/* Keep width at 320 for consistency */}
      <defs>
        {/* Arrow markers, gradients if needed */}
        <marker id="myArrow" viewBox="0 0 10 10" refX="9" refY="5"
          markerWidth="5" markerHeight="5" orient="auto-start-reverse">
          <path d="M0 0 L10 5 L0 10 z" fill={C.ink} />
        </marker>
      </defs>

      {/* Content */}
    </svg>
  );
}
```

## viewBox sizing

- Width: always `320` (matches the Scene column)
- Height: scale to content
  - Simple comparison (2 rows): `180`-`220`
  - Three-element flow: `200`-`240`
  - Architecture stack: `260`-`300`
  - Complex diagram: up to `320` (square)

If a figure has wide horizontal content (like a 5-step flow), use wider viewBox (`400`-`520`) instead of squeezing.

## Marker IDs

Each figure's arrow markers need unique IDs to avoid conflicts. Use a short prefix based on the figure name:

```typescript
// In CostCompareFigure, not just "arrow"
<marker id="ccArrow" ...>
```

## Using figures in MDX

Scene accepts the figure name as a **string**:

```mdx
<Scene figure="MyFigure" caption="What this diagram shows.">
```

Do NOT use JSX expressions: `figure={<MyFigure />}` will silently render nothing because MDX `compileMDX` cannot resolve component references inside prop expressions.

## Anti-patterns

- **Gradient circles as backgrounds.** They add visual noise without teaching anything. Use only when the gradient itself conveys meaning (e.g., a transition).
- **Tiny text in shapes.** If you need `fontSize="6"` or `"7"`, the shape is too small. Make it bigger.
- **Abbreviated labels.** Write "change" not "chg", "message" not "msg". The extra characters are worth the clarity.
- **Dense grids or tables.** These belong in the essay body as HTML tables, not in figures.
- **Decorative elements.** No smiley faces, stick figures, or clip art. Diagrams should be clean and geometric.
- **Too many elements.** If a figure has more than 8-10 distinct shapes, it's too complex. Split into two figures or simplify.

## Checklist

Before finishing a figure:

- [ ] Uses `C` color constants (no hardcoded hex values)
- [ ] All text readable at 300px render width
- [ ] No text overlapping or clipping shape boundaries
- [ ] Arrow markers have unique IDs
- [ ] Exported from `figures.tsx` and registered in `mdx-components.tsx`
- [ ] `className="w-full"` on the SVG element
- [ ] Teaches a concept, not just decorates
