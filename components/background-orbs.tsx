"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(ScrollTrigger, useGSAP);

type Orb = {
  className: string;
  style: React.CSSProperties;
  parallax: number;
};

const ORBS: Orb[] = [
  {
    className: "bg-peach",
    style: { width: 520, height: 520, top: "-8%", left: "-12%" },
    parallax: 120,
  },
  {
    className: "bg-lavender",
    style: { width: 460, height: 460, top: "12%", right: "-10%" },
    parallax: -160,
  },
  {
    className: "bg-butter",
    style: { width: 380, height: 380, top: "55%", left: "-6%" },
    parallax: 200,
  },
  {
    className: "bg-sage",
    style: { width: 420, height: 420, top: "78%", right: "-8%" },
    parallax: -100,
  },
  {
    className: "bg-rose",
    style: { width: 300, height: 300, top: "38%", left: "42%" },
    parallax: 80,
  },
];

export function BackgroundOrbs() {
  const ref = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const orbs = gsap.utils.toArray<HTMLElement>(".orb");
      orbs.forEach((orb, i) => {
        const distance = ORBS[i]?.parallax ?? 100;
        gsap.to(orb, {
          yPercent: distance > 0 ? 30 : -30,
          x: distance,
          ease: "none",
          scrollTrigger: {
            trigger: document.body,
            start: "top top",
            end: "bottom top",
            scrub: 1.2,
          },
        });
      });
    },
    { scope: ref }
  );

  return (
    <div
      ref={ref}
      aria-hidden
      className="pointer-events-none absolute inset-0 overflow-hidden"
    >
      {ORBS.map((orb, i) => (
        <div key={i} className={`orb ${orb.className}`} style={orb.style} />
      ))}
    </div>
  );
}
