"use client";

import * as React from "react";

export function FigureExpand({
  children,
  caption,
}: {
  children: React.ReactNode;
  caption?: string;
}) {
  const dialogRef = React.useRef<HTMLDialogElement>(null);

  return (
    <>
      <div
        className="group cursor-pointer transition-shadow hover:shadow-lg rounded-2xl"
        onClick={() => dialogRef.current?.showModal()}
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
        <div className="relative mx-4 w-full max-w-4xl rounded-3xl border border-rule bg-paper p-10 shadow-2xl sm:mx-auto sm:p-14">
          <button
            onClick={() => dialogRef.current?.close()}
            className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full text-ink-faint transition-colors hover:bg-rule/40 hover:text-ink"
            aria-label="Close"
          >
            ✕
          </button>
          <div className="mx-auto max-w-3xl">
            {children}
          </div>
          {caption && (
            <p className="mt-8 border-t border-rule/60 pt-3 font-display text-xs uppercase tracking-[0.22em] text-ink-faint">
              {caption}
            </p>
          )}
        </div>
      </dialog>
    </>
  );
}
