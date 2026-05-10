"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export function ReadingProgress({ target = "article" }: { target?: string }) {
  const bar = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = document.querySelector(target);
    if (!el || !bar.current) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        bar.current!,
        { scaleX: 0 },
        {
          scaleX: 1,
          ease: "none",
          scrollTrigger: {
            trigger: el,
            start: "top 10%",
            end: "bottom 80%",
            scrub: true,
          },
        }
      );
    });
    return () => ctx.revert();
  }, [target]);

  return (
    <div className="fixed inset-x-0 top-0 z-40 h-[3px] bg-rule/40">
      <div
        ref={bar}
        className="h-full origin-left bg-gradient-to-r from-terracotta via-rose to-lavender"
      />
    </div>
  );
}
