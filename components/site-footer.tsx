import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="relative z-20 mt-32 border-t border-rule/70">
      <div className="mx-auto max-w-6xl px-6 py-12 sm:px-10">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-md">
            <p className="font-display text-2xl text-ink">Proactive Agents</p>
            <p className="mt-2 text-sm leading-relaxed text-ink-soft">
              The runtime for agents that act on their own. Schedules,
              triggers, watchers, durable wake/sleep. Made by{" "}
              <a
                href="https://github.com/AgentWorkforce"
                className="text-terracotta hover:underline"
              >
                AgentWorkforce
              </a>
              .
            </p>
          </div>
          <div className="flex flex-col items-start gap-2 text-sm text-ink-soft sm:items-end">
            <a
              href="https://github.com/AgentWorkforce"
              className="hover:text-terracotta transition-colors"
            >
              GitHub →
            </a>
            <Link href="/about" className="hover:text-terracotta transition-colors">
              About
            </Link>
            <p className="mt-3 text-xs text-ink-faint">
              Crafted by AgentWorkforce.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
