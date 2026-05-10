import * as React from "react";

const C = {
  paper: "#fbf6ec",
  ink: "#2a2521",
  inkSoft: "#4d4640",
  faint: "#8a7f74",
  rule: "#e8ddc8",
  peach: "#ffd6bf",
  butter: "#fbe7a6",
  sage: "#c8dcbf",
  lavender: "#dccaee",
  rose: "#f2c4cd",
  sky: "#bedcef",
  terracotta: "#d98a6b",
  moss: "#6c8a5e",
  plum: "#7a5d8c",
};

/** Reactive agent — polling loop, hand-drawn diagram. */
export function PollingFigure() {
  return (
    <svg viewBox="0 0 320 320" className="w-full">
      <defs>
        <radialGradient id="pgrad" cx="50%" cy="40%" r="55%">
          <stop offset="0%" stopColor={C.peach} stopOpacity="0.9" />
          <stop offset="100%" stopColor={C.rose} stopOpacity="0.5" />
        </radialGradient>
      </defs>
      <circle cx="160" cy="140" r="105" fill="url(#pgrad)" />
      {/* clock face */}
      <circle cx="160" cy="140" r="60" fill={C.paper} stroke={C.ink} strokeWidth="2" />
      {Array.from({ length: 12 }).map((_, i) => {
        const a = (i / 12) * Math.PI * 2 - Math.PI / 2;
        const x1 = 160 + Math.cos(a) * 52;
        const y1 = 140 + Math.sin(a) * 52;
        const x2 = 160 + Math.cos(a) * 58;
        const y2 = 140 + Math.sin(a) * 58;
        return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={C.ink} strokeWidth="1.5" />;
      })}
      <line x1="160" y1="140" x2="160" y2="100" stroke={C.terracotta} strokeWidth="2.4" strokeLinecap="round" />
      <line x1="160" y1="140" x2="190" y2="140" stroke={C.ink} strokeWidth="2" strokeLinecap="round" />
      {/* poll arrows */}
      <g stroke={C.inkSoft} strokeWidth="1.6" fill="none" strokeLinecap="round">
        <path d="M70 200 Q 160 250 250 200" />
        <path d="M242 195 L 250 200 L 246 209" />
      </g>
      <text x="160" y="290" textAnchor="middle" fontFamily="var(--font-mono)" fontSize="11" fill={C.faint}>
        check → wait → check → wait
      </text>
    </svg>
  );
}

/** Proactive — push wakeup. */
export function ProactiveFigure() {
  return (
    <svg viewBox="0 0 320 320" className="w-full">
      <defs>
        <radialGradient id="prgrad" cx="50%" cy="40%" r="55%">
          <stop offset="0%" stopColor={C.sage} stopOpacity="0.9" />
          <stop offset="100%" stopColor={C.sky} stopOpacity="0.5" />
        </radialGradient>
      </defs>
      <circle cx="160" cy="140" r="105" fill="url(#prgrad)" />
      {/* world (left) */}
      <g>
        <rect x="38" y="92" width="86" height="96" rx="10" fill={C.paper} stroke={C.ink} strokeWidth="2" />
        <text x="81" y="118" textAnchor="middle" fontFamily="var(--font-display)" fontSize="13" fill={C.ink}>world</text>
        <line x1="50" y1="132" x2="112" y2="132" stroke={C.faint} strokeWidth="1" />
        <line x1="50" y1="148" x2="112" y2="148" stroke={C.faint} strokeWidth="1" />
        <line x1="50" y1="164" x2="98" y2="164" stroke={C.faint} strokeWidth="1" />
      </g>
      {/* arrow */}
      <g stroke={C.terracotta} strokeWidth="2.4" fill="none" strokeLinecap="round" strokeLinejoin="round">
        <path d="M132 140 Q 158 120 188 140" />
        <path d="M180 132 L 188 140 L 180 148" />
      </g>
      {/* agent (right) */}
      <g>
        <rect x="196" y="92" width="86" height="96" rx="10" fill={C.paper} stroke={C.ink} strokeWidth="2" />
        <text x="239" y="118" textAnchor="middle" fontFamily="var(--font-display)" fontSize="13" fill={C.ink}>agent</text>
        <circle cx="220" cy="148" r="6" fill={C.terracotta} />
        <circle cx="240" cy="148" r="6" fill={C.terracotta} />
        <circle cx="260" cy="148" r="6" fill={C.terracotta} />
        <path d="M212 168 Q 240 178 268 168" stroke={C.ink} strokeWidth="1.5" fill="none" />
      </g>
      <text x="160" y="290" textAnchor="middle" fontFamily="var(--font-mono)" fontSize="11" fill={C.faint}>
        change → push → wake
      </text>
    </svg>
  );
}

/** The triple — clock + watcher + inbox. */
export function TripleFigure() {
  const items = [
    { x: 80, y: 70, label: "clock", sub: "relaycron", fill: C.butter },
    { x: 240, y: 70, label: "watcher", sub: "relayfile", fill: C.sage },
    { x: 160, y: 220, label: "inbox", sub: "relaycast", fill: C.lavender },
  ];
  return (
    <svg viewBox="0 0 320 320" className="w-full">
      {/* connecting lines */}
      <g stroke={C.faint} strokeWidth="1.4" strokeDasharray="4 4">
        <line x1="80" y1="70" x2="240" y2="70" />
        <line x1="80" y1="70" x2="160" y2="220" />
        <line x1="240" y1="70" x2="160" y2="220" />
      </g>
      {items.map((it) => (
        <g key={it.label}>
          <circle cx={it.x} cy={it.y} r="46" fill={it.fill} stroke={C.ink} strokeWidth="2" />
          <text x={it.x} y={it.y - 4} textAnchor="middle" fontFamily="var(--font-display)" fontSize="16" fill={C.ink}>
            {it.label}
          </text>
          <text x={it.x} y={it.y + 14} textAnchor="middle" fontFamily="var(--font-mono)" fontSize="10" fill={C.inkSoft}>
            {it.sub}
          </text>
        </g>
      ))}
      <text x="160" y="305" textAnchor="middle" fontFamily="var(--font-display)" fontStyle="italic" fontSize="14" fill={C.terracotta}>
        the triple
      </text>
    </svg>
  );
}

/** Webhook tax — pile of plumbing. */
export function WebhookTaxFigure() {
  return (
    <svg viewBox="0 0 320 320" className="w-full">
      <rect x="20" y="40" width="280" height="240" rx="14" fill={C.paper} stroke={C.ink} strokeWidth="2" />
      {[
        "POST /webhooks/linear",
        "verify x-linear-signature",
        "respond 200 in <2s",
        "enqueue → bull/redis",
        "dedupe (webhookId)",
        "filter event type",
        "fetch full payload",
        "load agent context",
        "trigger agent",
      ].map((t, i) => (
        <g key={t}>
          <circle cx="40" cy={70 + i * 24} r="3.5" fill={C.terracotta} />
          <text
            x="54"
            y={74 + i * 24}
            fontFamily="var(--font-mono)"
            fontSize="11"
            fill={C.ink}
          >
            {t}
          </text>
        </g>
      ))}
      <text
        x="160"
        y="300"
        textAnchor="middle"
        fontFamily="var(--font-display)"
        fontStyle="italic"
        fontSize="13"
        fill={C.faint}
      >
        × every provider
      </text>
    </svg>
  );
}

/** Runtime — full architecture (heart in the middle). */
export function RuntimeFigure() {
  const blocks = [
    { x: 30, y: 60, w: 100, h: 38, label: "relaycron" },
    { x: 190, y: 60, w: 100, h: 38, label: "relayfile" },
    { x: 110, y: 230, w: 100, h: 38, label: "relaycast" },
    { x: 30, y: 200, w: 70, h: 30, label: "ricky" },
    { x: 220, y: 200, w: 70, h: 30, label: "burn" },
  ];
  return (
    <svg viewBox="0 0 320 320" className="w-full">
      <circle cx="160" cy="160" r="44" fill={C.peach} stroke={C.ink} strokeWidth="2" />
      <text x="160" y="156" textAnchor="middle" fontFamily="var(--font-display)" fontSize="14" fill={C.ink}>
        runtime
      </text>
      <text x="160" y="172" textAnchor="middle" fontFamily="var(--font-mono)" fontSize="9" fill={C.inkSoft}>
        cloud
      </text>
      {blocks.map((b) => (
        <g key={b.label}>
          <rect
            x={b.x}
            y={b.y}
            width={b.w}
            height={b.h}
            rx="8"
            fill={C.paper}
            stroke={C.ink}
            strokeWidth="1.6"
          />
          <text
            x={b.x + b.w / 2}
            y={b.y + b.h / 2 + 4}
            textAnchor="middle"
            fontFamily="var(--font-mono)"
            fontSize="11"
            fill={C.ink}
          >
            {b.label}
          </text>
        </g>
      ))}
      {/* connectors */}
      <g stroke={C.faint} strokeWidth="1.4" fill="none">
        <line x1="80" y1="98" x2="138" y2="142" />
        <line x1="240" y1="98" x2="182" y2="142" />
        <line x1="160" y1="204" x2="160" y2="230" />
        <line x1="100" y1="200" x2="135" y2="178" />
        <line x1="220" y1="200" x2="185" y2="178" />
      </g>
    </svg>
  );
}
