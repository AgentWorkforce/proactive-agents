"use client";

import { useState, type FormEvent } from "react";

type Status = "idle" | "loading" | "success" | "error";

export function NewsletterSignup({
  variant = "card",
  heading,
  description,
}: {
  variant?: "inline" | "card";
  heading?: string;
  description?: string;
}) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!email) return;
    setStatus("loading");

    const form = e.target as HTMLFormElement;
    const hp = (form.elements.namedItem("hp") as HTMLInputElement)?.value ?? "";

    try {
      const res = await fetch("/api/newsletter/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, hp }),
      });
      const data = (await res.json()) as {
        ok: boolean;
        error?: string;
        message?: string;
      };

      if (data.ok) {
        setStatus("success");
        setMessage(data.message ?? "Check your inbox to confirm.");
        setEmail("");
      } else {
        setStatus("error");
        setMessage(data.error ?? "Something went wrong.");
      }
    } catch {
      setStatus("error");
      setMessage("Something went wrong. Try again.");
    }
  }

  if (variant === "inline") return <InlineForm email={email} setEmail={setEmail} status={status} setStatus={setStatus} message={message} onSubmit={handleSubmit} />;
  return <CardForm email={email} setEmail={setEmail} status={status} setStatus={setStatus} message={message} heading={heading} description={description} onSubmit={handleSubmit} />;
}

function InlineForm({
  email,
  setEmail,
  status,
  setStatus,
  message,
  onSubmit,
}: {
  email: string;
  setEmail: (v: string) => void;
  status: Status;
  setStatus: (v: Status) => void;
  message: string;
  onSubmit: (e: FormEvent) => void;
}) {
  if (status === "success") {
    return (
      <p className="mt-4 font-serif text-[0.85rem] leading-relaxed text-moss">
        {message}
      </p>
    );
  }

  return (
    <form onSubmit={onSubmit} className="mt-4 flex gap-2">
      <label htmlFor="footer-email" className="sr-only">Email address</label>
      <input
        id="footer-email"
        type="email"
        required
        placeholder="you@example.com"
        value={email}
        onChange={(e) => {
          setEmail(e.target.value);
          if (status === "error") setStatus("idle");
        }}
        className="w-full max-w-56 rounded-full border border-rule bg-paper px-4 py-2 font-mono text-xs text-ink placeholder:text-ink-faint/50 transition-colors focus:border-terracotta/50 focus:outline-none"
      />
      <input type="text" name="hp" aria-hidden="true" tabIndex={-1} className="absolute -left-[9999px]" autoComplete="off" />
      <button
        type="submit"
        disabled={status === "loading"}
        className="shrink-0 rounded-full bg-ink px-4 py-2 text-xs font-medium tracking-wide text-paper transition-all hover:-translate-y-0.5 hover:bg-ink/85 disabled:opacity-50"
      >
        {status === "loading" ? "…" : "Subscribe"}
      </button>
      {status === "error" && (
        <p className="self-center font-serif text-xs text-terracotta">{message}</p>
      )}
    </form>
  );
}

function CardForm({
  email,
  setEmail,
  status,
  setStatus,
  message,
  heading,
  description,
  onSubmit,
}: {
  email: string;
  setEmail: (v: string) => void;
  status: Status;
  setStatus: (v: Status) => void;
  message: string;
  heading?: string;
  description?: string;
  onSubmit: (e: FormEvent) => void;
}) {
  return (
    <div className="relative overflow-hidden rounded-[1.5rem] border border-rule bg-paper-deep/50 px-6 py-10 sm:rounded-[2rem] sm:px-14 sm:py-14">
      <div className="absolute -left-20 -top-20 h-64 w-64 rounded-full bg-peach/50 blur-3xl" />
      <div className="absolute -bottom-24 -right-16 h-72 w-72 rounded-full bg-lavender/40 blur-3xl" />

      <div className="relative">
        <p className="font-display text-sm uppercase tracking-[0.28em] text-terracotta">
          ✦ Newsletter
        </p>
        <h3 className="mt-3 font-display text-[clamp(1.6rem,3.2vw,2.2rem)] leading-[1.1] tracking-tight text-ink">
          {heading ?? "New essays, straight to your inbox."}
        </h3>
        <p className="mt-4 max-w-lg font-serif text-[1.02rem] leading-relaxed text-ink-soft">
          {description ??
            "One email when we publish. No spam, no sales pitches, just the next piece on proactive agents."}
        </p>

        {status === "success" ? (
          <div className="mt-8 flex items-center gap-3 rounded-xl border border-sage/60 bg-sage/20 px-5 py-4">
            <span className="text-lg" aria-hidden>✦</span>
            <p className="font-serif text-[0.95rem] text-ink">{message}</p>
          </div>
        ) : (
          <form
            onSubmit={onSubmit}
            className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center"
          >
            <label htmlFor="card-email" className="sr-only">Email address</label>
            <input
              id="card-email"
              type="email"
              required
              placeholder="you@example.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (status === "error") setStatus("idle");
              }}
              className="w-full rounded-full border border-rule bg-paper px-5 py-3 font-mono text-sm text-ink placeholder:text-ink-faint/50 transition-colors focus:border-terracotta/50 focus:outline-none sm:max-w-72"
            />
            <input type="text" name="hp" aria-hidden="true" tabIndex={-1} className="absolute -left-[9999px]" autoComplete="off" />
            <button
              type="submit"
              disabled={status === "loading"}
              className="group inline-flex shrink-0 items-center justify-center gap-3 rounded-full bg-ink px-6 py-3 text-sm font-medium tracking-wide text-paper transition-all hover:-translate-y-0.5 hover:bg-ink/85 disabled:opacity-50"
            >
              {status === "loading" ? "Subscribing…" : "Subscribe"}
              <span
                aria-hidden
                className="transition-transform group-hover:translate-x-1"
              >
                →
              </span>
            </button>
          </form>
        )}
        {status === "error" && (
          <p className="mt-3 font-serif text-sm text-terracotta">{message}</p>
        )}
      </div>
    </div>
  );
}
