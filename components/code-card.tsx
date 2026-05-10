import * as React from "react";

export function CodeCard({
  label,
  filename,
  tone = "ink",
  children,
}: {
  label?: string;
  filename?: string;
  tone?: "ink" | "paper";
  children: React.ReactNode;
}) {
  const isInk = tone === "ink";
  return (
    <figure
      className={`my-6 overflow-hidden rounded-2xl border ${
        isInk ? "border-ink/80 bg-[#1f1b18] text-[#efe3cf]" : "border-rule bg-paper-deep/60 text-ink"
      }`}
    >
      {(label || filename) && (
        <figcaption
          className={`flex items-center justify-between px-5 py-2.5 text-[11px] uppercase tracking-[0.22em] ${
            isInk ? "border-b border-white/10 text-[#efe3cf]/70" : "border-b border-rule/70 text-ink-soft"
          }`}
        >
          <span>{label}</span>
          {filename && <span className="font-mono normal-case tracking-normal">{filename}</span>}
        </figcaption>
      )}
      <pre
        className={`overflow-x-auto px-5 py-4 text-[13.5px] leading-[1.65] ${
          isInk ? "" : "text-ink"
        }`}
      >
        <code className="font-mono">{children}</code>
      </pre>
    </figure>
  );
}
