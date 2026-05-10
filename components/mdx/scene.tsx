import * as React from "react";

/**
 * Scrollytelling row used in essays. Renders a sticky figure on the left and
 * scrolling text on the right (≥lg). On smaller screens the figure stacks
 * above the text and is no longer sticky.
 *
 * Sit inside `.prose-essay` — the parent grid lets us span full bleed.
 */
export function Scene({
  figure,
  side = "left",
  caption,
  children,
}: {
  figure: React.ReactNode;
  side?: "left" | "right";
  caption?: string;
  children: React.ReactNode;
}) {
  const figureFirst = side === "left";
  return (
    <section className="scene-block my-24 grid gap-10 lg:grid-cols-12 lg:gap-12">
      <div className={`${figureFirst ? "lg:order-1" : "lg:order-2"} lg:col-span-5`}>
        <div className="lg:sticky lg:top-24">
          <div className="rounded-3xl border border-rule bg-paper-deep/40 p-6">
            {figure}
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
