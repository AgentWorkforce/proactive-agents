import * as React from "react";

export function Squiggle({ className, color = "#d98a6b" }: { className?: string; color?: string }) {
  return (
    <svg viewBox="0 0 200 24" className={className} fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <path
        d="M2 12 Q 18 2 34 12 T 66 12 T 98 12 T 130 12 T 162 12 T 198 12"
        stroke={color}
        strokeWidth="2.4"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function Asterism({ className, color = "#d98a6b" }: { className?: string; color?: string }) {
  return (
    <svg viewBox="0 0 60 24" className={className} fill={color} xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <circle cx="10" cy="12" r="2" />
      <circle cx="30" cy="12" r="2" />
      <circle cx="50" cy="12" r="2" />
    </svg>
  );
}

export function Sparkle({ className, color = "#d98a6b" }: { className?: string; color?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill={color} xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <path d="M12 1.5c.4 4.7 2.3 6.6 7 7-4.7.4-6.6 2.3-7 7-.4-4.7-2.3-6.6-7-7 4.7-.4 6.6-2.3 7-7z" />
    </svg>
  );
}

export function Arrow({ className, color = "#2a2521" }: { className?: string; color?: string }) {
  return (
    <svg viewBox="0 0 80 40" className={className} fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <path
        d="M2 32 C 18 6 38 6 60 18"
        stroke={color}
        strokeWidth="1.6"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M52 12 L 62 18 L 56 27"
        stroke={color}
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}

export function CornerBrackets({ className, color = "#d98a6b" }: { className?: string; color?: string }) {
  return (
    <svg viewBox="0 0 80 80" className={className} fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <path d="M2 20 L 2 2 L 20 2" stroke={color} strokeWidth="1.6" strokeLinecap="round" />
      <path d="M60 2 L 78 2 L 78 20" stroke={color} strokeWidth="1.6" strokeLinecap="round" />
      <path d="M78 60 L 78 78 L 60 78" stroke={color} strokeWidth="1.6" strokeLinecap="round" />
      <path d="M20 78 L 2 78 L 2 60" stroke={color} strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}
