import * as React from "react";

const tones: Record<string, string> = {
  thought: "bg-butter/40 border-butter",
  warm: "bg-peach/40 border-peach",
  cool: "bg-sky/40 border-sky",
  sage: "bg-sage/40 border-sage",
  lavender: "bg-lavender/40 border-lavender",
};

export function Callout({
  tone = "thought",
  label,
  children,
}: {
  tone?: keyof typeof tones;
  label?: string;
  children: React.ReactNode;
}) {
  return (
    <aside
      className={`my-8 rounded-2xl border-l-4 px-6 py-5 font-sans text-[0.98rem] leading-relaxed text-ink-soft ${tones[tone]}`}
    >
      {label && (
        <p className="mb-1 font-display text-sm uppercase tracking-[0.18em] text-ink">
          {label}
        </p>
      )}
      <div>{children}</div>
    </aside>
  );
}

export function PullQuote({ children }: { children: React.ReactNode }) {
  return (
    <div className="my-12 -mx-4 sm:-mx-12 px-4 sm:px-12 text-center">
      <p className="font-display text-3xl sm:text-4xl italic leading-tight text-ink">
        “{children}”
      </p>
    </div>
  );
}

export function Marginalia({ children }: { children: React.ReactNode }) {
  return (
    <div className="float-right -mr-44 ml-6 mb-3 hidden w-40 font-sans text-[0.78rem] leading-snug text-ink-faint xl:block">
      <span className="block border-t border-rule pt-2">{children}</span>
    </div>
  );
}
