import * as React from "react";

let counter = 0;

export function Sidenote({ children }: { children: React.ReactNode }) {
  const id = React.useId();
  return (
    <span className="sidenote-wrap">
      <sup className="font-display text-terracotta text-[0.7em] mx-[0.1em] cursor-help">
        ✦
      </sup>
      <span className="sidenote hidden lg:block absolute left-full top-0 ml-8 w-56 text-[0.78rem] leading-snug text-ink-soft font-sans">
        <span className="block border-l-2 border-terracotta/60 pl-3">{children}</span>
      </span>
      <span className="sidenote-inline lg:hidden block my-3 ml-4 border-l-2 border-terracotta/60 pl-3 text-[0.85rem] text-ink-soft font-sans not-italic">
        {children}
      </span>
    </span>
  );
}
