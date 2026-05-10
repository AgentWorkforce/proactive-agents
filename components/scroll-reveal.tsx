"use client";

import { useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

/**
 * Mounts a single scroll-trigger that adds `is-in` to any `.reveal` element.
 * Place once near the page root; CSS handles the actual transition.
 */
export function ScrollReveal() {
  useEffect(() => {
    const ctx = gsap.context(() => {
      const els = gsap.utils.toArray<HTMLElement>(".reveal");
      els.forEach((el) => {
        ScrollTrigger.create({
          trigger: el,
          start: "top 88%",
          once: true,
          onEnter: () => el.classList.add("is-in"),
        });
      });
    });
    // Refresh after fonts load — line wraps shift trigger positions
    document.fonts?.ready?.then(() => ScrollTrigger.refresh());
    return () => ctx.revert();
  }, []);

  return null;
}
