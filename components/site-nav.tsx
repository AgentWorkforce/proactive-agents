import Link from "next/link";

export function SiteNav() {
  return (
    <header className="relative z-20">
      <div className="mx-auto flex max-w-6xl items-baseline justify-between px-6 pt-8 pb-2 sm:px-10 sm:pt-10">
        <Link href="/" className="group flex items-baseline gap-2">
          <span className="font-display text-2xl tracking-tight text-ink">
            Proactive Agents
          </span>
          <span className="hidden text-xs uppercase tracking-[0.18em] text-ink-faint sm:inline">
            est. 2026
          </span>
        </Link>
        <nav className="flex items-center gap-7 text-[13px] uppercase tracking-[0.18em] text-ink-soft">
          <Link href="/" className="hover:text-terracotta transition-colors">
            Manifesto
          </Link>
          <Link href="/#three-primitives" className="hover:text-terracotta transition-colors hidden sm:inline">
            Primitives
          </Link>
          <Link href="/about" className="hover:text-terracotta transition-colors">
            About
          </Link>
          <a
            href="https://github.com/AgentWorkforce"
            className="hover:text-terracotta transition-colors"
          >
            GitHub
          </a>
        </nav>
      </div>
    </header>
  );
}
