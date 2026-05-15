"use client";

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
    console.warn(
      `[Scene] Unknown figure "${figure}". Available: ${Object.keys(FIGURE_REGISTRY).join(", ")}`
    );
  }
  const dialogRef = React.useRef<HTMLDialogElement>(null);
  const figureFirst = side === "left";

  return (
    <section className="scene-block my-24 grid gap-10 lg:grid-cols-12 lg:gap-12">
      <div
        className={`${figureFirst ? "lg:order-1" : "lg:order-2"} lg:col-span-5`}
      >
        <div className="lg:sticky lg:top-24">
          <div
            className="group cursor-pointer rounded-3xl border border-rule bg-paper-deep/40 p-6 transition-shadow hover:shadow-lg"
            onClick={() => dialogRef.current?.showModal()}
          >
            {FigureComponent ? <FigureComponent /> : null}
            {caption && (
              <p className="mt-4 border-t border-rule/60 pt-3 font-display text-xs uppercase tracking-[0.22em] text-ink-faint">
                {caption}
                <span className="ml-2 inline-block opacity-0 transition-opacity group-hover:opacity-60">
                  ↗
                </span>
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

      <dialog
        ref={dialogRef}
        className="figure-modal m-0 h-screen w-screen max-w-none max-h-none bg-transparent p-0 backdrop:bg-ink/60 backdrop:backdrop-blur-sm open:flex open:items-center open:justify-center"
        onClick={(e) => {
          if (e.target === e.currentTarget) dialogRef.current?.close();
        }}
      >
        <div className="relative mx-auto max-w-2xl rounded-3xl border border-rule bg-paper p-8 shadow-2xl">
          <button
            onClick={() => dialogRef.current?.close()}
            className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full text-ink-faint transition-colors hover:bg-rule/40 hover:text-ink"
            aria-label="Close"
          >
            ✕
          </button>
          <div className="mt-2">
            {FigureComponent ? <FigureComponent /> : null}
          </div>
          {caption && (
            <p className="mt-6 border-t border-rule/60 pt-3 font-display text-xs uppercase tracking-[0.22em] text-ink-faint">
              {caption}
            </p>
          )}
        </div>
      </dialog>
    </section>
  );
}
