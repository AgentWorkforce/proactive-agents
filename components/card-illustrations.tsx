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
  "the-genesis": ElephantArt,
  "the-prompt-cant-save-you": PromptCrackArt,
  "magical-agents": MagicalWandArt,
  "the-wish-list": WishListArt,
  "chatgpt-pulse": PulseCardArt,
  "proactive-agent-landscape": LandscapeCardArt,
  "building-weekly-digest": DigestCardArt,
  "push-breaks-too": PushBreaksArt,
  "why-proactive-is-hard": WhyHardArt,
  "review-agent-three-acts": ThreeActsArt,
  "what-proactive-agents-cost": TokenCostArt,
  "four-repos-one-filesystem": FiveReposArt,
  "forty-two-percent": FortyTwoPercentArt,
  "agent-moves-first": AgentMovesFirstArt,
  "posthog-code": PostHogCodeArt,
  "notion-ships-the-primitives": NotionPrimitivesArt,
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

        {/* Radio */}
        <g transform="translate(250, 115)">
          <rect x="-24" y="-15" width="48" height="32" rx="4" strokeWidth="1.5" />
          <circle cy="-3" r="8" strokeWidth="1.3" />
          <circle cy="-3" r="3.5" fill={C.ink} stroke="none" />
          <circle cx="-10" cy="10" r="2" fill={C.ink} stroke="none" />
          <circle cx="0" cy="10" r="2" fill={C.ink} stroke="none" />
          <circle cx="10" cy="10" r="2" fill={C.ink} stroke="none" />
          <line x1="16" y1="-15" x2="24" y2="-28" strokeWidth="1.2" />
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

function PromptCrackArt() {
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
        {/* Document / scroll */}
        <g transform="translate(250, 112)">
          <rect
            x="-42"
            y="-50"
            width="84"
            height="100"
            rx="4"
            strokeWidth="1.6"
          />
          {/* Text lines */}
          <line x1="-28" y1="-34" x2="28" y2="-34" strokeWidth="1" />
          <line x1="-28" y1="-22" x2="22" y2="-22" strokeWidth="1" />
          <line x1="-28" y1="-10" x2="26" y2="-10" strokeWidth="1" />
          <line x1="-28" y1="14" x2="24" y2="14" strokeWidth="1" />
          <line x1="-28" y1="26" x2="28" y2="26" strokeWidth="1" />
          <line x1="-28" y1="38" x2="18" y2="38" strokeWidth="1" />
          {/* Crack / fracture through the middle */}
          <path
            d="M-42 0 L-18 -4 L-8 6 L4 -3 L16 5 L28 -2 L42 2"
            strokeWidth="2.2"
            stroke={C.ink}
          />
        </g>
      </g>
    </svg>
  );
}

function PulseCardArt() {
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
        <g transform="translate(250, 112)">
          {/* Pulse / heartbeat line */}
          <path
            d="M-55 0 L-30 0 L-20 -25 L-10 20 L0 -15 L10 10 L20 0 L55 0"
            strokeWidth="2"
          />
          {/* Small cards below */}
          <rect x="-35" y="20" width="22" height="30" rx="2" strokeWidth="1.2" />
          <rect x="-8" y="20" width="22" height="30" rx="2" strokeWidth="1.2" />
          <rect x="19" y="20" width="22" height="30" rx="2" strokeWidth="1.2" />
        </g>
      </g>
    </svg>
  );
}

function MagicalWandArt() {
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
        <g transform="translate(250, 112)">
          {/* Wand */}
          <line x1="-35" y1="35" x2="25" y2="-25" strokeWidth="2" />
          <rect x="22" y="-30" width="10" height="10" rx="1" strokeWidth="1.5" transform="rotate(45, 27, -25)" />
          {/* Sparkles */}
          <g strokeWidth="1.2">
            <line x1="-10" y1="-30" x2="-10" y2="-45" />
            <line x1="-17" y1="-37" x2="-3" y2="-37" />
            <line x1="40" y1="-10" x2="40" y2="-22" />
            <line x1="34" y1="-16" x2="46" y2="-16" />
            <line x1="15" y1="-45" x2="15" y2="-53" />
            <line x1="11" y1="-49" x2="19" y2="-49" />
          </g>
          {/* Stars */}
          <circle cx="-25" cy="-20" r="2.5" fill={C.ink} stroke="none" />
          <circle cx="35" cy="-35" r="1.8" fill={C.ink} stroke="none" />
          <circle cx="50" cy="5" r="2" fill={C.ink} stroke="none" />
        </g>
      </g>
    </svg>
  );
}

function WishListArt() {
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
        <g transform="translate(250, 112)">
          {/* Clipboard body */}
          <rect x="-38" y="-50" width="76" height="100" rx="4" strokeWidth="1.6" />
          {/* Clipboard clip */}
          <rect x="-12" y="-56" width="24" height="12" rx="3" strokeWidth="1.4" />
          {/* Checklist items */}
          {[-28, -8, 12, 32].map((y, i) => (
            <g key={i}>
              <rect x="-26" y={y - 5} width="10" height="10" rx="1.5" strokeWidth="1.2" />
              {i < 2 && (
                <path d={`M${-24} ${y} L${-22} ${y + 3} L${-18} ${y - 3}`} strokeWidth="1.5" />
              )}
              <line x1="-10" y1={y} x2={20 + (i % 2 === 0 ? 6 : 0)} y2={y} strokeWidth="1" />
            </g>
          ))}
        </g>
      </g>
    </svg>
  );
}

function LandscapeCardArt() {
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
        <g transform="translate(250, 112)">
          {/* Grid lines */}
          <line x1="-50" y1="-30" x2="50" y2="-30" strokeWidth="0.8" />
          <line x1="-50" y1="-10" x2="50" y2="-10" strokeWidth="0.8" />
          <line x1="-50" y1="10" x2="50" y2="10" strokeWidth="0.8" />
          <line x1="-50" y1="30" x2="50" y2="30" strokeWidth="0.8" />
          <line x1="-15" y1="-45" x2="-15" y2="40" strokeWidth="0.8" />
          <line x1="15" y1="-45" x2="15" y2="40" strokeWidth="0.8" />
          <line x1="40" y1="-45" x2="40" y2="40" strokeWidth="0.8" />
          {/* Dots for scores */}
          <circle cx="-15" cy="-30" r="3" fill={C.ink} stroke="none" />
          <circle cx="15" cy="-30" r="3" fill={C.ink} stroke="none" />
          <circle cx="40" cy="-30" r="3" fill={C.ink} stroke="none" />
          <circle cx="-15" cy="-10" r="3" fill={C.ink} stroke="none" />
          <circle cx="-15" cy="10" r="3" fill={C.ink} stroke="none" />
          <circle cx="15" cy="10" r="3" fill={C.ink} stroke="none" />
          <circle cx="40" cy="10" r="3" fill={C.ink} stroke="none" />
          <circle cx="-15" cy="30" r="3" fill={C.ink} stroke="none" />
          <circle cx="15" cy="30" r="3" fill={C.ink} stroke="none" />
          <circle cx="40" cy="30" r="3" fill={C.ink} stroke="none" />
        </g>
      </g>
    </svg>
  );
}

function DigestCardArt() {
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
        <g transform="translate(250, 112)">
          {/* Funnel shape — sources narrowing to output */}
          <path d="M-55 -40 L-20 0 L-55 40" strokeWidth="1.6" />
          <path d="M55 -40 L20 0 L55 40" strokeWidth="1.6" />
          {/* Source dots on the left */}
          <circle cx="-55" cy="-30" r="3" fill={C.ink} stroke="none" />
          <circle cx="-55" cy="-10" r="3" fill={C.ink} stroke="none" />
          <circle cx="-55" cy="10" r="3" fill={C.ink} stroke="none" />
          <circle cx="-55" cy="30" r="3" fill={C.ink} stroke="none" />
          {/* Arrow out the right */}
          <line x1="20" y1="0" x2="55" y2="0" strokeWidth="2" />
          <path d="M48 -6 L56 0 L48 6" strokeWidth="1.8" />
          {/* Small issue rectangle */}
          <rect x="60" y="-12" width="24" height="24" rx="3" strokeWidth="1.4" />
          <line x1="65" y1="-4" x2="79" y2="-4" strokeWidth="0.8" />
          <line x1="65" y1="2" x2="76" y2="2" strokeWidth="0.8" />
          <line x1="65" y1="8" x2="73" y2="8" strokeWidth="0.8" />
        </g>
      </g>
    </svg>
  );
}

function PushBreaksArt() {
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
        <g transform="translate(250, 112)">
          {/* Arrow shaft — push direction */}
          <line x1="-50" y1="0" x2="30" y2="0" strokeWidth="2" />
          <path d="M22 -8 L32 0 L22 8" strokeWidth="2" />
          {/* Crack / break in the arrow */}
          <path
            d="M-8 -18 L-2 -6 L-10 0 L0 6 L-6 18"
            strokeWidth="2.2"
          />
          {/* Lightning / break marks */}
          <line x1="-18" y1="-14" x2="-12" y2="-8" strokeWidth="1.2" />
          <line x1="6" y1="-12" x2="10" y2="-6" strokeWidth="1.2" />
          <line x1="-14" y1="10" x2="-8" y2="14" strokeWidth="1.2" />
          {/* Small x marks for failures */}
          <g strokeWidth="1.8">
            <line x1="42" y1="-18" x2="50" y2="-10" />
            <line x1="50" y1="-18" x2="42" y2="-10" />
          </g>
          <g strokeWidth="1.8">
            <line x1="42" y1="10" x2="50" y2="18" />
            <line x1="50" y1="10" x2="42" y2="18" />
          </g>
        </g>
      </g>
    </svg>
  );
}

function WhyHardArt() {
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
        <g transform="translate(250, 112)">
          {/* Three stacked blocks — progressively harder */}
          <rect x="-20" y="15" width="40" height="22" rx="2" strokeWidth="1.6" />
          <rect x="-30" y="-10" width="60" height="22" rx="2" strokeWidth="1.6" />
          <rect x="-40" y="-35" width="80" height="22" rx="2" strokeWidth="1.6" />
          {/* Top block slightly askew */}
          <g transform="rotate(-4, -40, -35)">
            <rect x="-42" y="-55" width="84" height="18" rx="2" strokeWidth="1.8" />
          </g>
          {/* Crack line through the stack */}
          <path d="M-15 38 L-8 20 L-18 0 L-6 -12 L-14 -30 L-4 -42" strokeWidth="1.6" />
          {/* Small stress marks */}
          <line x1="25" y1="-28" x2="32" y2="-22" strokeWidth="1.2" />
          <line x1="28" y1="-5" x2="35" y2="0" strokeWidth="1.2" />
          <line x1="22" y1="20" x2="28" y2="26" strokeWidth="1.2" />
        </g>
      </g>
    </svg>
  );
}

function ThreeActsArt() {
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
        <g transform="translate(250, 112)">
          {/* Three connected stages — webhook → surfaces → proactive */}
          {/* Act 1: webhook arrow (left) */}
          <g transform="translate(-60, -10)">
            <rect x="-22" y="-16" width="44" height="32" rx="4" strokeWidth="1.4" />
            <path d="M-14 -6 L0 4 L14 -6" strokeWidth="1" />
            <line x1="-14" y1="10" x2="14" y2="10" strokeWidth="0.7" />
          </g>
          {/* Connector 1→2 */}
          <line x1="-14" y1="-10" x2="14" y2="-10" strokeWidth="1.2" strokeDasharray="3 4" />
          <path d="M8 -16 L16 -10 L8 -4" strokeWidth="1.4" />
          {/* Act 2: hub with spokes (center) */}
          <circle cx="40" cy="-10" r="14" strokeWidth="1.6" />
          <circle cx="40" cy="-10" r="2" fill={C.ink} stroke="none" />
          <line x1="40" y1="-26" x2="40" y2="-32" strokeWidth="1" />
          <line x1="54" y1="-10" x2="60" y2="-10" strokeWidth="1" />
          <line x1="40" y1="4" x2="40" y2="10" strokeWidth="1" />
          <line x1="26" y1="-10" x2="20" y2="-10" strokeWidth="1" />
          {/* Connector 2→3 */}
          <line x1="58" y1="-10" x2="80" y2="-10" strokeWidth="1.2" strokeDasharray="3 4" />
          <path d="M74 -16 L82 -10 L74 -4" strokeWidth="1.4" />
          {/* Act 3: radio (listener) */}
          <g transform="translate(108, -10)">
            <rect x="-14" y="-10" width="28" height="20" rx="3" strokeWidth="1.4" />
            <circle cy="-2" r="5" strokeWidth="1" />
            <circle cy="-2" r="2" fill={C.ink} stroke="none" />
            <circle cx="-6" cy="6" r="1.2" fill={C.ink} stroke="none" />
            <circle cx="0" cy="6" r="1.2" fill={C.ink} stroke="none" />
            <circle cx="6" cy="6" r="1.2" fill={C.ink} stroke="none" />
            <line x1="10" y1="-10" x2="16" y2="-20" strokeWidth="1" />
          </g>
          {/* Act labels */}
          <text x="-60" y="38" textAnchor="middle" fontFamily="inherit" fontSize="10" fill={C.ink} strokeWidth="0">I</text>
          <text x="40" y="38" textAnchor="middle" fontFamily="inherit" fontSize="10" fill={C.ink} strokeWidth="0">II</text>
          <text x="108" y="38" textAnchor="middle" fontFamily="inherit" fontSize="10" fill={C.ink} strokeWidth="0">III</text>
        </g>
      </g>
    </svg>
  );
}

function TokenCostArt() {
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
        <g transform="translate(250, 112)">
          {/* Stacked bars — token cost breakdown */}
          <rect x="-35" y="-45" width="70" height="18" rx="2" strokeWidth="1.4" />
          <rect x="-35" y="-23" width="70" height="28" rx="2" strokeWidth="1.6" />
          <rect x="-35" y="9" width="70" height="14" rx="2" strokeWidth="1.2" />
          <rect x="-35" y="27" width="70" height="10" rx="2" strokeWidth="1" />
          {/* Dollar sign */}
          <g transform="translate(-55, 0)" strokeWidth="1.6">
            <path d="M-4 -12 C-12 -8 -10 0 0 0 S12 8 4 12" />
            <line x1="0" y1="-16" x2="0" y2="16" />
          </g>
          {/* Upward arrow — cost rising */}
          <line x1="48" y1="35" x2="48" y2="-40" strokeWidth="1.4" />
          <path d="M42 -34 L48 -42 L54 -34" strokeWidth="1.4" />
        </g>
      </g>
    </svg>
  );
}

function FiveReposArt() {
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
        <g transform="translate(250, 108)">
          {/* Five stacked layers */}
          {[
            { y: -48, w: 50 },
            { y: -26, w: 60 },
            { y: -4, w: 70 },
            { y: 18, w: 60 },
            { y: 40, w: 50 },
          ].map((l, i) => (
            <rect
              key={i}
              x={-l.w / 2}
              y={l.y}
              width={l.w}
              height={18}
              rx="3"
              strokeWidth={i === 2 ? "2" : "1.4"}
            />
          ))}
          {/* Connecting dashed lines */}
          {[-30, -8, 14, 36].map((y, i) => (
            <line
              key={i}
              x1="0"
              y1={y}
              x2="0"
              y2={y + 4}
              strokeWidth="1"
              strokeDasharray="1.5 2"
            />
          ))}
          {/* Git branch decoration */}
          <circle cx="-40" cy="-38" r="2.5" fill={C.ink} stroke="none" />
          <circle cx="-40" cy="-16" r="2.5" fill={C.ink} stroke="none" />
          <line x1="-40" y1="-35" x2="-40" y2="-19" strokeWidth="1.2" />
          <line x1="-40" y1="-16" x2="-30" y2="-4" strokeWidth="1" strokeDasharray="2 3" />
        </g>
      </g>
    </svg>
  );
}

function FortyTwoPercentArt() {
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
        <g transform="translate(250, 112)">
          {/* Target / bullseye */}
          <circle r="48" strokeWidth="1.6" />
          <circle r="32" strokeWidth="1.2" />
          <circle r="16" strokeWidth="1" />
          <circle r="3" fill={C.ink} stroke="none" />
          {/* Scattered dots — some hit, some miss */}
          <circle cx="6" cy="-4" r="2.5" fill={C.ink} stroke="none" />
          <circle cx="-10" cy="8" r="2.5" fill={C.ink} stroke="none" />
          <circle cx="18" cy="-20" r="2" fill={C.ink} stroke="none" />
          <circle cx="-25" cy="15" r="2" fill={C.ink} stroke="none" />
          <circle cx="35" cy="28" r="2" fill={C.ink} stroke="none" />
          <circle cx="-40" cy="-30" r="2" fill={C.ink} stroke="none" />
          <circle cx="12" cy="38" r="1.8" fill={C.ink} stroke="none" />
          {/* Dashed line at ~42% of radius */}
          <circle r="20" strokeWidth="1.2" strokeDasharray="4 3" />
        </g>
      </g>
    </svg>
  );
}

function NotionPrimitivesArt() {
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
        <g transform="translate(250, 108)">
          {/* Three stacked platform layers */}
          <rect x="-55" y="-40" width="110" height="24" rx="4" strokeWidth="1.6" />
          <rect x="-42" y="-8" width="84" height="24" rx="4" strokeWidth="1.4" />
          <rect x="-30" y="24" width="60" height="24" rx="4" strokeWidth="1.2" />
          {/* Connecting dashes */}
          <line x1="0" y1="-16" x2="0" y2="-8" strokeWidth="1" strokeDasharray="1.5 2" />
          <line x1="0" y1="16" x2="0" y2="24" strokeWidth="1" strokeDasharray="1.5 2" />
          {/* External arrows flowing in */}
          <g strokeWidth="1.2">
            <line x1="-70" y1="-20" x2="-55" y2="-28" />
            <line x1="70" y1="-20" x2="55" y2="-28" />
            <line x1="-65" y1="36" x2="-30" y2="36" />
            <line x1="65" y1="36" x2="30" y2="36" />
          </g>
          {/* Small dots for external agents */}
          <circle cx="-70" cy="-20" r="2.5" fill={C.ink} stroke="none" />
          <circle cx="70" cy="-20" r="2.5" fill={C.ink} stroke="none" />
          <circle cx="-65" cy="36" r="2" fill={C.ink} stroke="none" />
          <circle cx="65" cy="36" r="2" fill={C.ink} stroke="none" />
        </g>
      </g>
    </svg>
  );
}

export function ClockListenerInbox() {
  return (
    <svg
      viewBox="0 0 840 290"
      className="mx-auto w-full"
      role="img"
      aria-label="A clock, a listener, an inbox — the three primitives of a proactive agent"
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

      {/* Listener */}
      <g transform="translate(420, 130)">
        <circle r="62" fill={C.sage} opacity="0.45" />
        <circle r="62" fill="none" stroke={C.ink} strokeWidth="0.8" />
        {/* Radio body */}
        <rect
          x="-28"
          y="-18"
          width="56"
          height="38"
          rx="5"
          fill={C.paper}
          stroke={C.ink}
          strokeWidth="1.2"
        />
        {/* Speaker grille */}
        <circle cy="-4" r="10" fill="none" stroke={C.ink} strokeWidth="1.2" />
        <circle cy="-4" r="4" fill={C.terracotta} />
        {/* Dial dots */}
        <circle cx="-12" cy="12" r="2.5" fill={C.ink} />
        <circle cx="0" cy="12" r="2.5" fill={C.ink} />
        <circle cx="12" cy="12" r="2.5" fill={C.ink} />
        {/* Antenna */}
        <line
          x1="20"
          y1="-18"
          x2="30"
          y2="-34"
          stroke={C.ink}
          strokeWidth="1.2"
          strokeLinecap="round"
        />
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
        listener
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
        A clock, a listener, an inbox.
      </text>
    </svg>
  );
}

function AgentMovesFirstArt() {
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
        {/* Chat bubble */}
        <g transform="translate(190, 105)">
          <path
            d="M-45 -32 Q-45 -50 -28 -50 L28 -50 Q45 -50 45 -32 L45 8 Q45 26 28 26 L-8 26 L-22 44 L-18 26 L-28 26 Q-45 26 -45 8 Z"
            strokeWidth="1.6"
          />
          <circle cx="-14" cy="-12" r="3.5" fill={C.ink} stroke="none" />
          <circle cx="6" cy="-12" r="3.5" fill={C.ink} stroke="none" />
          <circle cx="26" cy="-12" r="3.5" fill={C.ink} stroke="none" />
        </g>
        {/* Small clock */}
        <g transform="translate(310, 118)">
          <circle r="22" strokeWidth="1.5" />
          <circle r="1.5" fill={C.ink} stroke="none" />
          {[0, 3, 6, 9].map((i) => {
            const a = (i / 12) * Math.PI * 2 - Math.PI / 2;
            return (
              <line
                key={i}
                x1={Math.cos(a) * 16}
                y1={Math.sin(a) * 16}
                x2={Math.cos(a) * 20}
                y2={Math.sin(a) * 20}
                strokeWidth="1.4"
              />
            );
          })}
          <line x1="0" y1="0" x2="0" y2="-13" strokeWidth="1.8" />
          <line x1="0" y1="0" x2="9" y2="4" strokeWidth="1.3" />
        </g>
        {/* Dashed connection */}
        <line
          x1="238"
          y1="100"
          x2="286"
          y2="110"
          strokeWidth="1"
          strokeDasharray="3 4"
        />
      </g>
    </svg>
  );
}

function PostHogCodeArt() {
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
        {/* Bar chart (analytics) */}
        <g transform="translate(200, 130)">
          <line x1="-50" y1="30" x2="50" y2="30" strokeWidth="1.2" />
          <rect x="-42" y="5" width="14" height="25" rx="2" strokeWidth="1.4" />
          <rect x="-22" y="-15" width="14" height="45" rx="2" strokeWidth="1.4" />
          <rect x="-2" y="-5" width="14" height="35" rx="2" strokeWidth="1.4" />
          <rect x="18" y="-25" width="14" height="55" rx="2" strokeWidth="1.4" />
        </g>
        {/* Code brackets */}
        <g transform="translate(320, 110)">
          <path d="M-8 -28 L-20 0 L-8 28" strokeWidth="1.8" />
          <path d="M8 -28 L20 0 L8 28" strokeWidth="1.8" />
          <line x1="-6" y1="4" x2="6" y2="-4" strokeWidth="1.3" />
        </g>
        {/* Arrow connecting them */}
        <line
          x1="252"
          y1="118"
          x2="298"
          y2="112"
          strokeWidth="1"
          strokeDasharray="3 4"
        />
      </g>
    </svg>
  );
}
