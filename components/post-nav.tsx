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
    <nav className="mx-auto max-w-4xl px-5 pb-20 sm:px-10 sm:pb-24">
      <div className="grid gap-4 sm:grid-cols-2 sm:gap-6">
        {prev ? (
          <Link
            href={`/posts/${prev.slug}`}
            onClick={scrollTop}
            className="group block rounded-2xl border border-rule bg-paper-deep/40 p-5 transition-transform hover:-translate-y-1 sm:p-6"
          >
            <p className="text-xs uppercase tracking-[0.22em] text-ink-faint">
              ← The next one
            </p>
            <p className="mt-2 font-display text-lg leading-snug text-ink group-hover:text-terracotta sm:text-xl">
              {prev.title}
            </p>
          </Link>
        ) : (
          <span className="hidden sm:block" />
        )}
        {next ? (
          <Link
            href={`/posts/${next.slug}`}
            onClick={scrollTop}
            className="group block rounded-2xl border border-rule bg-paper-deep/40 p-5 transition-transform hover:-translate-y-1 sm:p-6 sm:text-right"
          >
            <p className="text-xs uppercase tracking-[0.22em] text-ink-faint">
              An earlier one →
            </p>
            <p className="mt-2 font-display text-lg leading-snug text-ink group-hover:text-terracotta sm:text-xl">
              {next.title}
            </p>
          </Link>
        ) : (
          <span className="hidden sm:block" />
        )}
      </div>
    </nav>
  );
}
