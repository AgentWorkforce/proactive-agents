import Link from "next/link";
import { SiteLogo } from "@/components/site-logo";

export function SiteNav() {
  return (
    <header className="relative z-20">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 pt-8 pb-2 sm:px-10 sm:pt-10">
        <Link href="/" className="group flex items-center gap-3">
          <SiteLogo className="h-8 w-auto transition-transform group-hover:rotate-[-4deg]" />
          <span className="font-display text-2xl tracking-tight text-ink">
            Proactive Agents
          </span>
        </Link>
        <nav className="flex items-center gap-6 text-[13px] uppercase tracking-[0.18em] text-ink-soft sm:gap-7">
          <Link href="/posts" className="hover:text-terracotta transition-colors">
            Essays
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
