import Link from "next/link";
import { SiteLogo } from "@/components/site-logo";

export function SiteFooter() {
  return (
    <footer className="relative z-20 mt-32 border-t border-rule/70">
      <div className="mx-auto max-w-6xl px-6 py-14 sm:px-10">
        <div className="grid gap-10 sm:grid-cols-12 sm:gap-8">
          {/* Brand */}
          <div className="sm:col-span-7">
            <div className="flex items-center gap-3">
              <SiteLogo className="h-7 w-auto" />
              <p className="font-display text-2xl text-ink">Proactive Agents</p>
            </div>
            <p className="mt-3 max-w-md font-serif text-[0.95rem] leading-relaxed text-ink-soft">
              A working manual on the agents that don&rsquo;t wait to be asked.
            </p>
          </div>

          {/* Links */}
          <nav className="sm:col-span-5 flex flex-col items-start gap-2 text-sm text-ink-soft sm:items-end">
            <Link href="/posts" className="hover:text-terracotta transition-colors">
              Essays
            </Link>
            <Link href="/#triggers" className="hover:text-terracotta transition-colors">
              Triggers
            </Link>
            <Link href="/about" className="hover:text-terracotta transition-colors">
              About
            </Link>
          </nav>
        </div>

        <div className="mt-10 flex flex-col items-start justify-between gap-2 border-t border-rule/60 pt-6 text-xs text-ink-faint sm:flex-row sm:items-center">
          <p>© {new Date().getFullYear()} Proactive Agents.</p>
          <p>
            Crafted by{" "}
            <a
              href="https://github.com/AgentWorkforce"
              className="text-terracotta hover:underline"
            >
              AgentWorkforce
            </a>
            .
          </p>
        </div>
      </div>
    </footer>
  );
}
