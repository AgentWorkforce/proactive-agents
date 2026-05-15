import * as React from "react";
import * as Figures from "./figures";

const FIGURE_REGISTRY: Record<string, React.ComponentType> = {};
for (const [name, value] of Object.entries(Figures)) {
  if (typeof value === "function") {
    FIGURE_REGISTRY[name] = value as React.ComponentType;
  }
}

export function Scene({
  figure,
  side = "left",
  caption,
  children,
}: {
  figure: string;
  side?: "left" | "right";
  caption?: string;
  children: React.ReactNode;
}) {
  const FigureComponent = FIGURE_REGISTRY[figure];
  if (!FigureComponent && process.env.NODE_ENV !== "production") {
    console.warn(`[Scene] Unknown figure "${figure}". Available: ${Object.keys(FIGURE_REGISTRY).join(", ")}`);
  }
  const figureFirst = side === "left";
  return (
    <section className="scene-block my-24 grid gap-10 lg:grid-cols-12 lg:gap-12">
      <div className={`${figureFirst ? "lg:order-1" : "lg:order-2"} lg:col-span-5`}>
        <div className="lg:sticky lg:top-24">
          <div className="rounded-3xl border border-rule bg-paper-deep/40 p-6">
            {FigureComponent ? <FigureComponent /> : null}
            {caption && (
              <p className="mt-4 border-t border-rule/60 pt-3 font-display text-xs uppercase tracking-[0.22em] text-ink-faint">
                {caption}
              </p>
            )}
          </div>
        </div>
      </div>
      <div
        className={`${figureFirst ? "lg:order-2" : "lg:order-1"} lg:col-span-7 prose-essay-body`}
      >
        {children}
      </div>
    </section>
  );
}
