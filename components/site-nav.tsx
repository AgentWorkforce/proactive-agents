"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { SiteLogo } from "@/components/site-logo";

const LINKS = [
  { href: "/guide", label: "Guide" },
  { href: "/posts", label: "Essays" },
  { href: "/market", label: "Market" },
  { href: "/agent", label: "Agent" },
  { href: "/about", label: "About" },
];

export function SiteNav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // Close the panel on route change.
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Lock body scroll while the mobile panel is open.
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  // Close on Escape.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <header className="relative z-30">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 pt-6 pb-2 sm:px-10 sm:pt-10">
        <Link href="/" className="group flex items-center gap-2.5 sm:gap-3">
          <SiteLogo className="h-7 w-auto transition-transform group-hover:rotate-[-4deg] sm:h-8" />
          <span className="font-display text-xl tracking-tight text-ink sm:text-2xl">
            Proactive Agents
          </span>
        </Link>

        <nav className="hidden items-center gap-6 text-[13px] uppercase tracking-[0.18em] text-ink-soft md:flex md:gap-7">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="hover:text-terracotta transition-colors"
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <button
          type="button"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          aria-controls="mobile-nav"
          onClick={() => setOpen((v) => !v)}
          className="relative -mr-1 inline-flex h-10 w-10 items-center justify-center rounded-full text-ink hover:text-terracotta md:hidden"
        >
          <span className="sr-only">Toggle navigation</span>
          <span aria-hidden className="relative block h-3.5 w-5">
            <span
              className={`absolute left-0 top-0 h-[1.75px] w-5 rounded bg-current transition-transform duration-200 ${
                open ? "translate-y-[6px] rotate-45" : ""
              }`}
            />
            <span
              className={`absolute left-0 top-[6px] h-[1.75px] w-5 rounded bg-current transition-opacity duration-200 ${
                open ? "opacity-0" : "opacity-100"
              }`}
            />
            <span
              className={`absolute left-0 top-[12px] h-[1.75px] w-5 rounded bg-current transition-transform duration-200 ${
                open ? "-translate-y-[6px] -rotate-45" : ""
              }`}
            />
          </span>
        </button>
      </div>

      {/* Mobile panel */}
      <div
        id="mobile-nav"
        className={`fixed inset-x-0 top-0 z-20 md:hidden ${
          open ? "pointer-events-auto" : "pointer-events-none"
        }`}
        aria-hidden={!open}
      >
        <div
          className={`absolute inset-0 bg-ink/30 backdrop-blur-[2px] transition-opacity duration-200 ${
            open ? "opacity-100" : "opacity-0"
          }`}
          onClick={() => setOpen(false)}
        />
        <div
          className={`relative ml-auto h-screen w-full max-w-sm bg-paper shadow-2xl transition-transform duration-300 ease-out ${
            open ? "translate-x-0" : "translate-x-full"
          }`}
        >
          <div className="flex items-center justify-between px-5 pt-6 pb-2">
            <span className="font-display text-xl tracking-tight text-ink">
              Menu
            </span>
            <button
              type="button"
              aria-label="Close menu"
              onClick={() => setOpen(false)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full text-ink hover:text-terracotta"
            >
              <span aria-hidden className="text-2xl leading-none">×</span>
            </button>
          </div>
          <nav className="mt-6 flex flex-col gap-1 px-5">
            {LINKS.map((l) => {
              const active = pathname === l.href || pathname.startsWith(`${l.href}/`);
              return (
                <Link
                  key={l.href}
                  href={l.href}
                  className={`flex items-center justify-between border-b border-rule/60 py-4 font-display text-2xl tracking-tight transition-colors ${
                    active ? "text-terracotta" : "text-ink hover:text-terracotta"
                  }`}
                >
                  {l.label}
                  <span aria-hidden className="text-ink-faint">→</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </div>
    </header>
  );
}
