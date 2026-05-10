"use client";

import { useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

/**
 * Adds a subtle scroll-linked reveal to every direct paragraph child of the
 * given selector. Lighter than per-element ScrollTriggers — uses a batched
 * IntersectionObserver under the hood via ScrollTrigger.batch.
 */
export function PostParagraphReveal({ selector = ".prose-essay" }: { selector?: string }) {
  useEffect(() => {
    const root = document.querySelector(selector);
    if (!root) return;
    const els = Array.from(
      root.querySelectorAll<HTMLElement>(
        ":scope > p, :scope > h2, :scope > h3, :scope > blockquote, :scope > ul, :scope > ol, :scope > aside, :scope > div, :scope > section, :scope > figure"
      )
    );
    els.forEach((el) => {
      el.style.opacity = "0";
      el.style.transform = "translateY(22px)";
      el.style.transition =
        "opacity 0.9s cubic-bezier(.2,.7,.2,1), transform 0.9s cubic-bezier(.2,.7,.2,1)";
    });
    const ctx = gsap.context(() => {
      ScrollTrigger.batch(els, {
        start: "top 88%",
        once: true,
        onEnter: (batch) => {
          batch.forEach((el, i) => {
            setTimeout(() => {
              (el as HTMLElement).style.opacity = "1";
              (el as HTMLElement).style.transform = "translateY(0)";
            }, i * 60);
          });
        },
      });
    });
    document.fonts?.ready?.then(() => ScrollTrigger.refresh());
    return () => {
      ctx.revert();
      els.forEach((el) => {
        el.style.opacity = "";
        el.style.transform = "";
        el.style.transition = "";
      });
    };
  }, [selector]);

  return null;
}
