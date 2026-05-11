import { Squiggle, Asterism } from "@/components/decorations";

export const metadata = {
  title: "About — Proactive Agents",
};

export default function AboutPage() {
  return (
    <article className="relative mx-auto max-w-2xl px-6 py-24 sm:px-8 sm:py-32">
      <p className="text-xs uppercase tracking-[0.3em] text-ink-soft">About</p>
      <h1 className="mt-4 font-display text-5xl leading-[1.05] tracking-tight text-ink sm:text-6xl">
        A working manual on <span className="italic text-terracotta">proactive agents.</span>
      </h1>
      <Squiggle className="mt-6 h-3 w-40 opacity-70" />

      <div className="prose-essay mt-10">
        <p>
          This site is a slow-built reference on proactive agents &mdash; what
          they are, why they&rsquo;re different from the reactive agents most
          teams ship, and how to think about building them. Less brochure,
          more textbook with opinions.
        </p>

        <h2>What we mean by &ldquo;proactive&rdquo;</h2>
        <p>
          A proactive agent doesn&rsquo;t wait for a prompt. It acts because
          time passed, data changed, or someone spoke. That shift &mdash; from
          reactive tool to teammate &mdash; is the most important architectural
          choice you make when shipping an agent. Most of the writing here is
          variations on that one idea.
        </p>

        <h2>Who&rsquo;s behind it</h2>
        <p>
          Run by <a href="https://github.com/AgentWorkforce">AgentWorkforce</a>.
          We build infrastructure for proactive agents and run into the hard
          parts of this work every week. The essays are adapted from
          positioning docs, postmortems, and design notes that would otherwise
          live in PRs.
        </p>

        <h2>How we publish</h2>
        <p>
          Educational over promotional. Specific over abstract. Honest about
          what&rsquo;s hard. New essays appear when they&rsquo;re ready,
          usually monthly.
        </p>
      </div>

      <div className="mt-16 flex justify-center">
        <Asterism className="h-4 opacity-70" />
      </div>
    </article>
  );
}
