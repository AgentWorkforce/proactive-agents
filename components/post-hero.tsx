"use client";

import { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { Squiggle, Sparkle, CornerBrackets } from "@/components/decorations";

gsap.registerPlugin(ScrollTrigger, useGSAP);

const ACCENT_BG: Record<string, string> = {
  peach: "from-peach/70 via-rose/40 to-butter/40",
  butter: "from-butter/70 via-peach/40 to-sage/30",
  sage: "from-sage/70 via-sky/30 to-butter/30",
  lavender: "from-lavender/70 via-rose/30 to-sky/30",
  rose: "from-rose/70 via-peach/30 to-lavender/30",
  sky: "from-sky/70 via-lavender/30 to-sage/30",
};

export function PostHero({
  title,
  summary,
  date,
  readingTime,
  accent,
}: {
  title: string;
  summary: string;
  date: string;
  readingTime: string;
  accent: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      // Title rises and fades as you scroll past the hero
      gsap.to(".post-hero-title", {
        yPercent: -30,
        opacity: 0.15,
        ease: "none",
        scrollTrigger: {
          trigger: ref.current,
          start: "top top",
          end: "bottom 30%",
          scrub: 1,
        },
      });
      // Decorations parallax
      gsap.to(".hero-deco-a", {
        y: -120,
        rotate: -18,
        ease: "none",
        scrollTrigger: {
          trigger: ref.current,
          start: "top top",
          end: "bottom top",
          scrub: 1,
        },
      });
      gsap.to(".hero-deco-b", {
        y: 80,
        rotate: 12,
        ease: "none",
        scrollTrigger: {
          trigger: ref.current,
          start: "top top",
          end: "bottom top",
          scrub: 1,
        },
      });
      // Initial entrance — split-style stagger over a single span line break
      gsap.fromTo(
        ".post-hero-title",
        { y: 40, opacity: 0 },
        { y: 0, opacity: 1, duration: 1.4, ease: "expo.out" }
      );
      gsap.fromTo(
        ".post-hero-meta > *",
        { y: 14, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.9, ease: "expo.out", stagger: 0.1, delay: 0.25 }
      );
    },
    { scope: ref }
  );

  return (
    <section
      ref={ref}
      className={`relative overflow-hidden bg-gradient-to-br ${ACCENT_BG[accent] ?? ACCENT_BG.peach}`}
    >
      <div className="paper-grain pointer-events-none" aria-hidden />
      <Squiggle className="hero-deco-a absolute right-[8%] top-[18%] h-3 w-40 opacity-70" />
      <Sparkle className="hero-deco-b absolute left-[10%] bottom-[18%] h-6 w-6 opacity-80" />
      <CornerBrackets className="absolute right-[6%] bottom-[8%] h-12 w-12 opacity-50" />

      <div className="relative mx-auto max-w-4xl px-5 pt-16 pb-20 text-center sm:px-10 sm:pt-32 sm:pb-40">
        <p className="post-hero-meta flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-[11px] uppercase tracking-[0.3em] text-ink-soft sm:text-xs">
          <span className="post-hero-meta-item">{date}</span>
          <span className="post-hero-meta-item h-px w-6 bg-ink-soft/60" />
          <span className="post-hero-meta-item">{readingTime}</span>
        </p>
        <h1 className="post-hero-title mt-6 font-display text-[clamp(2.1rem,8vw,5.6rem)] leading-[1] tracking-tight text-ink sm:mt-8">
          {title}
        </h1>
        <p className="mx-auto mt-6 max-w-2xl font-serif text-lg leading-relaxed text-ink-soft sm:mt-8 sm:text-xl">
          {summary}
        </p>
      </div>
    </section>
  );
}
