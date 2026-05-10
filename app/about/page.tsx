import { Squiggle, Asterism } from "@/components/decorations";

export const metadata = {
  title: "About — Proactive Agents",
};

export default function AboutPage() {
  return (
    <article className="relative mx-auto max-w-2xl px-6 py-24 sm:px-8 sm:py-32">
      <p className="text-xs uppercase tracking-[0.3em] text-ink-soft">About</p>
      <h1 className="mt-4 font-display text-5xl leading-[1.05] tracking-tight text-ink sm:text-6xl">
        We build the runtime for <span className="italic text-terracotta">proactive agents.</span>
      </h1>
      <Squiggle className="mt-6 h-3 w-40 opacity-70" />

      <div className="prose-essay mt-10">
        <p>
          Proactive Agents is the developer-facing home of{" "}
          <a href="https://github.com/AgentWorkforce">AgentWorkforce</a>. We
          ship the infrastructure that lets cloud agents act on their own
          &mdash; on schedules, on data changes, on inbound messages.
        </p>

        <p>
          A small set of repos: <code>relaycron</code> (the clock),{" "}
          <code>relayfile</code> (the watcher), <code>relaycast</code> (the
          inbox), <code>cloud</code> (the runtime), with{" "}
          <code>ricky</code>, <code>burn</code>, and <code>relayauth</code>{" "}
          for the durability ring. Use them together or pick one.
          Framework-agnostic.
        </p>

        <h2>Who it&rsquo;s for</h2>
        <p>
          Teams shipping cloud agents as a product &mdash; the kind that run
          in your infrastructure and act on someone else&rsquo;s data. Not
          local dev tools. Not no-code visual builders.
        </p>

        <h2>How we write</h2>
        <p>
          The essays are adapted from positioning docs, postmortems, and
          design notes that usually live in PRs. We publish them because the
          developers we want to build with tend to think the same way.
        </p>
      </div>

      <div className="mt-16 flex justify-center">
        <Asterism className="h-4 opacity-70" />
      </div>
    </article>
  );
}
