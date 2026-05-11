import * as React from "react";

const C = {
  ink: "#2a2521",
  faint: "#8a7f74",
  paper: "#fbf6ec",
  terracotta: "#d98a6b",
  butter: "#fbe7a6",
  sage: "#c8dcbf",
  lavender: "#dccaee",
};

const SLUGS: Record<string, React.ComponentType> = {
  "three-primitives": PrimitivesArt,
  "reactive-vs-proactive": ReactivePushArt,
  "the-webhook-tax": WebhookKnotArt,
  "why-we-stopped-saying-multi-agent": ElephantArt,
};

export function CardArt({ slug }: { slug: string }) {
  const Art = SLUGS[slug];
  return Art ? <Art /> : null;
}

function PrimitivesArt() {
  return (
    <svg
      viewBox="0 0 500 300"
      className="pointer-events-none absolute inset-0 h-full w-full"
      aria-hidden
    >
      <g
        opacity="0.14"
        stroke={C.ink}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {/* Clock */}
        <g transform="translate(120, 115)">
          <circle r="36" strokeWidth="1.5" />
          <circle r="2" fill={C.ink} stroke="none" />
          {Array.from({ length: 12 }).map((_, i) => {
            const a = (i / 12) * Math.PI * 2 - Math.PI / 2;
            const r1 = i % 3 === 0 ? 26 : 30;
            return (
              <line
                key={i}
                x1={Math.cos(a) * r1}
                y1={Math.sin(a) * r1}
                x2={Math.cos(a) * 33}
                y2={Math.sin(a) * 33}
                strokeWidth={i % 3 === 0 ? "1.8" : "0.9"}
              />
            );
          })}
          <line x1="0" y1="0" x2="-5" y2="-18" strokeWidth="2" />
          <line x1="0" y1="0" x2="13" y2="-7" strokeWidth="1.4" />
        </g>

        {/* Eye */}
        <g transform="translate(250, 115)">
          <path d="M-34 0 Q0 -26 34 0 Q0 26 -34 0" strokeWidth="1.5" />
          <circle r="12" strokeWidth="1.3" />
          <circle r="5" fill={C.ink} stroke="none" />
        </g>

        {/* Envelope */}
        <g transform="translate(380, 115)">
          <rect
            x="-32"
            y="-22"
            width="64"
            height="44"
            rx="2.5"
            strokeWidth="1.5"
          />
          <path d="M-32 -22 L0 4 L32 -22" strokeWidth="1.5" />
        </g>
      </g>
    </svg>
  );
}

function ReactivePushArt() {
  return (
    <svg
      viewBox="0 0 500 300"
      className="pointer-events-none absolute inset-0 h-full w-full"
      aria-hidden
    >
      <g
        opacity="0.14"
        stroke={C.ink}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {/* Polling loop */}
        <g transform="translate(170, 115)">
          <path
            d="M20 -28 A 32 32 0 1 0 28 -16"
            strokeWidth="1.6"
          />
          <path d="M22 -22 L28 -16 L22 -10" strokeWidth="1.6" />
        </g>

        <line
          x1="250"
          y1="75"
          x2="250"
          y2="158"
          strokeWidth="0.8"
          strokeDasharray="3 4"
        />

        {/* Push arrow */}
        <g transform="translate(330, 115)">
          <line x1="-30" y1="0" x2="28" y2="0" strokeWidth="1.8" />
          <path d="M20 -8 L30 0 L20 8" strokeWidth="1.8" />
          <line x1="-18" y1="-10" x2="-10" y2="-5" strokeWidth="0.9" />
          <line x1="-22" y1="-15" x2="-14" y2="-10" strokeWidth="0.9" />
          <line x1="-18" y1="10" x2="-10" y2="5" strokeWidth="0.9" />
          <line x1="-22" y1="15" x2="-14" y2="10" strokeWidth="0.9" />
        </g>
      </g>
    </svg>
  );
}

function WebhookKnotArt() {
  return (
    <svg
      viewBox="0 0 500 300"
      className="pointer-events-none absolute inset-0 h-full w-full"
      aria-hidden
    >
      <g opacity="0.14" stroke={C.ink} fill="none" strokeLinecap="round">
        <g transform="translate(250, 112)">
          <path
            d="M-55 -25 C-30 -40 -10 10 15 -15 S55 -30 60 5"
            strokeWidth="1.6"
          />
          <path
            d="M-60 10 C-35 30 -5 -20 20 10 S50 35 55 15"
            strokeWidth="1.6"
          />
          <path
            d="M-50 -10 C-20 -30 10 25 30 0 S60 -15 55 -30"
            strokeWidth="1.4"
          />
          <path
            d="M-45 25 C-15 10 15 -15 25 20 S45 30 50 25"
            strokeWidth="1.2"
          />
          <circle cx="-55" cy="-25" r="3" fill={C.ink} stroke="none" />
          <circle cx="-60" cy="10" r="3" fill={C.ink} stroke="none" />
          <circle cx="60" cy="5" r="3" fill={C.ink} stroke="none" />
          <circle cx="55" cy="15" r="3" fill={C.ink} stroke="none" />
        </g>
      </g>
    </svg>
  );
}

function ElephantArt() {
  return (
    <svg
      viewBox="0 0 500 300"
      className="pointer-events-none absolute inset-0 h-full w-full"
      aria-hidden
    >
      <g
        opacity="0.12"
        stroke={C.ink}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.6"
      >
        <g transform="translate(250, 118)">
          <path d="M-50 25 Q-55 -15 -30 -30 Q0 -45 30 -30 Q55 -15 50 25" />
          <path d="M-50 -5 Q-65 0 -62 20 Q-60 35 -52 30" />
          <line x1="-35" y1="25" x2="-35" y2="50" />
          <line x1="-15" y1="25" x2="-15" y2="50" />
          <line x1="15" y1="25" x2="15" y2="50" />
          <line x1="35" y1="25" x2="35" y2="50" />
          <path d="M-38 -18 Q-52 -8 -48 5" strokeWidth="1.3" />
          <circle cx="-35" cy="-15" r="2" fill={C.ink} stroke="none" />
          <path d="M50 0 Q60 -10 58 -20" strokeWidth="1.2" />
        </g>
      </g>
    </svg>
  );
}

export function ClockWatcherInbox() {
  return (
    <svg
      viewBox="0 0 840 290"
      className="mx-auto w-full"
      role="img"
      aria-label="A clock, a watcher, an inbox — the three primitives of a proactive agent"
    >
      {/* Connecting lines */}
      <line
        x1="205"
        y1="130"
        x2="345"
        y2="130"
        stroke={C.faint}
        strokeWidth="1.2"
        strokeDasharray="4 5"
      />
      <line
        x1="495"
        y1="130"
        x2="635"
        y2="130"
        stroke={C.faint}
        strokeWidth="1.2"
        strokeDasharray="4 5"
      />

      {/* Clock */}
      <g transform="translate(140, 130)">
        <circle r="62" fill={C.butter} opacity="0.45" />
        <circle r="62" fill="none" stroke={C.ink} strokeWidth="0.8" />
        <circle r="46" fill={C.paper} stroke={C.ink} strokeWidth="1.2" />
        <circle r="2" fill={C.terracotta} />
        {Array.from({ length: 12 }).map((_, i) => {
          const a = (i / 12) * Math.PI * 2 - Math.PI / 2;
          const len = i % 3 === 0 ? 8 : 4;
          const r2 = 42;
          const r1 = r2 - len;
          return (
            <line
              key={i}
              x1={Math.cos(a) * r1}
              y1={Math.sin(a) * r1}
              x2={Math.cos(a) * r2}
              y2={Math.sin(a) * r2}
              stroke={C.ink}
              strokeWidth={i % 3 === 0 ? "1.8" : "0.8"}
              strokeLinecap="round"
            />
          );
        })}
        <line
          x1="0"
          y1="0"
          x2="-4"
          y2="-26"
          stroke={C.ink}
          strokeWidth="2"
          strokeLinecap="round"
        />
        <line
          x1="0"
          y1="0"
          x2="18"
          y2="-10"
          stroke={C.terracotta}
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </g>
      <text
        x="140"
        y="222"
        textAnchor="middle"
        fontFamily="var(--font-display)"
        fontSize="16"
        letterSpacing="0.08em"
        fill={C.ink}
      >
        clock
      </text>

      {/* Watcher */}
      <g transform="translate(420, 130)">
        <circle r="62" fill={C.sage} opacity="0.45" />
        <circle r="62" fill="none" stroke={C.ink} strokeWidth="0.8" />
        <path
          d="M-40 0 Q0 -32 40 0 Q0 32 -40 0"
          fill={C.paper}
          stroke={C.ink}
          strokeWidth="1.2"
        />
        <circle r="16" fill="none" stroke={C.ink} strokeWidth="1.2" />
        <circle r="7" fill={C.terracotta} />
        <circle r="2.5" fill={C.paper} cx="-2" cy="-2" />
        {Array.from({ length: 12 }).map((_, i) => {
          const a = (i / 12) * Math.PI * 2;
          return (
            <line
              key={i}
              x1={Math.cos(a) * 20}
              y1={Math.sin(a) * 20}
              x2={Math.cos(a) * 26}
              y2={Math.sin(a) * 26}
              stroke={C.ink}
              strokeWidth="0.7"
              strokeLinecap="round"
            />
          );
        })}
      </g>
      <text
        x="420"
        y="222"
        textAnchor="middle"
        fontFamily="var(--font-display)"
        fontSize="16"
        letterSpacing="0.08em"
        fill={C.ink}
      >
        watcher
      </text>

      {/* Inbox */}
      <g transform="translate(700, 130)">
        <circle r="62" fill={C.lavender} opacity="0.45" />
        <circle r="62" fill="none" stroke={C.ink} strokeWidth="0.8" />
        <rect
          x="-32"
          y="-22"
          width="64"
          height="44"
          rx="3"
          fill={C.paper}
          stroke={C.ink}
          strokeWidth="1.2"
        />
        <path
          d="M-32 -22 L0 6 L32 -22"
          fill="none"
          stroke={C.ink}
          strokeWidth="1.2"
        />
        <line
          x1="-32"
          y1="22"
          x2="-8"
          y2="0"
          stroke={C.ink}
          strokeWidth="0.6"
          opacity="0.5"
        />
        <line
          x1="32"
          y1="22"
          x2="8"
          y2="0"
          stroke={C.ink}
          strokeWidth="0.6"
          opacity="0.5"
        />
        <circle cy="6" r="7" fill={C.terracotta} />
        <circle cy="6" r="3.5" fill="none" stroke={C.paper} strokeWidth="0.7" />
      </g>
      <text
        x="700"
        y="222"
        textAnchor="middle"
        fontFamily="var(--font-display)"
        fontSize="16"
        letterSpacing="0.08em"
        fill={C.ink}
      >
        inbox
      </text>

      {/* Tagline */}
      <text
        x="420"
        y="268"
        textAnchor="middle"
        fontFamily="var(--font-display)"
        fontStyle="italic"
        fontSize="17"
        fill={C.terracotta}
      >
        A clock, a watcher, an inbox.
      </text>
    </svg>
  );
}
