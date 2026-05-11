"use client";

import Link from "next/link";

export function PostNav({
  prev,
  next,
}: {
  prev?: { slug: string; title: string } | null;
  next?: { slug: string; title: string } | null;
}) {
  const scrollTop = () => window.scrollTo({ top: 0, behavior: "instant" });

  return (
    <nav className="mx-auto max-w-4xl px-6 pb-24 sm:px-10">
      <div className="grid gap-6 sm:grid-cols-2">
        {prev ? (
          <Link
            href={`/posts/${prev.slug}`}
            onClick={scrollTop}
            className="group block rounded-2xl border border-rule bg-paper-deep/40 p-6 transition-transform hover:-translate-y-1"
          >
            <p className="text-xs uppercase tracking-[0.22em] text-ink-faint">
              ← The next one
            </p>
            <p className="mt-2 font-display text-xl text-ink group-hover:text-terracotta">
              {prev.title}
            </p>
          </Link>
        ) : (
          <span />
        )}
        {next ? (
          <Link
            href={`/posts/${next.slug}`}
            onClick={scrollTop}
            className="group block rounded-2xl border border-rule bg-paper-deep/40 p-6 text-right transition-transform hover:-translate-y-1"
          >
            <p className="text-xs uppercase tracking-[0.22em] text-ink-faint">
              An earlier one →
            </p>
            <p className="mt-2 font-display text-xl text-ink group-hover:text-terracotta">
              {next.title}
            </p>
          </Link>
        ) : (
          <span />
        )}
      </div>
    </nav>
  );
}
