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

/** The triple — clock + listener + inbox. */
export function TripleFigure() {
  const items = [
    { x: 80, y: 70, label: "clock", sub: "relaycron", fill: C.butter },
    { x: 240, y: 70, label: "listener", sub: "relayfile", fill: C.sage },
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

/** Prompt vs Runtime — two layers, different guarantees. */
export function PromptLayerFigure() {
  return (
    <svg viewBox="0 0 320 320" className="w-full">
      <defs>
        <radialGradient id="plgrad" cx="50%" cy="40%" r="55%">
          <stop offset="0%" stopColor={C.rose} stopOpacity="0.7" />
          <stop offset="100%" stopColor={C.lavender} stopOpacity="0.4" />
        </radialGradient>
      </defs>
      <circle cx="160" cy="160" r="105" fill="url(#plgrad)" />
      {/* Dividing line */}
      <line x1="60" y1="160" x2="260" y2="160" stroke={C.ink} strokeWidth="2" strokeDasharray="6 3" />
      {/* Top: prompt layer — dotted, advisory */}
      <text x="160" y="92" textAnchor="middle" fontFamily="var(--font-display)" fontSize="13" fill={C.ink}>
        prompt
      </text>
      <text x="160" y="112" textAnchor="middle" fontFamily="var(--font-mono)" fontSize="9" fill={C.inkSoft}>
        advises
      </text>
      {["judgement", "restraint", "communication"].map((t, i) => (
        <g key={t}>
          <rect x={75 + i * 65} y={120} width={56} height={20} rx="10" fill="none" stroke={C.faint} strokeWidth="1.2" strokeDasharray="3 2" />
          <text x={103 + i * 65} y={134} textAnchor="middle" fontFamily="var(--font-mono)" fontSize="8" fill={C.faint}>{t}</text>
        </g>
      ))}
      {/* Bottom: runtime layer — solid, enforced */}
      <text x="160" y="188" textAnchor="middle" fontFamily="var(--font-display)" fontSize="13" fill={C.ink}>
        runtime
      </text>
      <text x="160" y="206" textAnchor="middle" fontFamily="var(--font-mono)" fontSize="9" fill={C.inkSoft}>
        enforces
      </text>
      {["clock", "listener", "inbox", "state", "auth"].map((t, i) => (
        <g key={t}>
          <rect x={62 + i * 44} y={214} width={38} height={20} rx="10" fill={C.paper} stroke={C.ink} strokeWidth="1.4" />
          <text x={81 + i * 44} y={228} textAnchor="middle" fontFamily="var(--font-mono)" fontSize="8" fill={C.ink}>{t}</text>
        </g>
      ))}
      <text x="160" y="270" textAnchor="middle" fontFamily="var(--font-mono)" fontSize="10" fill={C.faint}>
        advise ≠ enforce
      </text>
    </svg>
  );
}

/** Gap map — primitives coverage across ecosystems. */
export function GapMapFigure() {
  const rows = [
    { label: "clock", has: [true, true] },
    { label: "listener", has: [false, false] },
    { label: "inbox", has: [false, false] },
    { label: "state", has: [false, false] },
    { label: "durability", has: [false, false] },
  ];
  return (
    <svg viewBox="0 0 320 320" className="w-full">
      <defs>
        <radialGradient id="gmgrad" cx="50%" cy="40%" r="55%">
          <stop offset="0%" stopColor={C.rose} stopOpacity="0.6" />
          <stop offset="100%" stopColor={C.peach} stopOpacity="0.35" />
        </radialGradient>
      </defs>
      <circle cx="160" cy="155" r="105" fill="url(#gmgrad)" />
      {/* Header */}
      <text x="90" y="68" textAnchor="middle" fontFamily="var(--font-display)" fontSize="11" fill={C.ink}>primitive</text>
      <text x="195" y="68" textAnchor="middle" fontFamily="var(--font-mono)" fontSize="9" fill={C.inkSoft}>xCloud</text>
      <text x="255" y="68" textAnchor="middle" fontFamily="var(--font-mono)" fontSize="9" fill={C.inkSoft}>Hal</text>
      <line x1="55" y1="75" x2="275" y2="75" stroke={C.faint} strokeWidth="1" />
      {rows.map((r, i) => {
        const y = 98 + i * 38;
        return (
          <g key={r.label}>
            <text x="90" y={y} textAnchor="middle" fontFamily="var(--font-mono)" fontSize="12" fill={C.ink}>{r.label}</text>
            {r.has.map((v, j) => (
              <g key={j} transform={`translate(${195 + j * 60}, ${y - 5})`}>
                {v ? (
                  <text textAnchor="middle" fontFamily="var(--font-mono)" fontSize="14" fill={C.moss}>✓</text>
                ) : (
                  <text textAnchor="middle" fontFamily="var(--font-mono)" fontSize="14" fill={C.terracotta}>✗</text>
                )}
              </g>
            ))}
            {i < rows.length - 1 && <line x1="55" y1={y + 14} x2="275" y2={y + 14} stroke={C.faint} strokeWidth="0.5" />}
          </g>
        );
      })}
      <text x="160" y="298" textAnchor="middle" fontFamily="var(--font-display)" fontStyle="italic" fontSize="12" fill={C.terracotta}>
        one out of five
      </text>
    </svg>
  );
}

/** Terminal windows with arrows — the genesis of agent-to-agent communication. */
export function TerminalsFigure() {
  return (
    <svg viewBox="0 0 320 320" className="w-full">
      <defs>
        <radialGradient id="tgrad" cx="50%" cy="40%" r="55%">
          <stop offset="0%" stopColor={C.butter} stopOpacity="0.8" />
          <stop offset="100%" stopColor={C.peach} stopOpacity="0.4" />
        </radialGradient>
      </defs>
      <circle cx="160" cy="150" r="105" fill="url(#tgrad)" />
      {[{ x: 48, y: 80, label: "claude" }, { x: 192, y: 80, label: "codex" }].map((t) => (
        <g key={t.label}>
          <rect x={t.x} y={t.y} width="80" height="60" rx="6" fill={C.ink} stroke={C.ink} strokeWidth="1.5" />
          <rect x={t.x} y={t.y} width="80" height="14" rx="6" fill={C.inkSoft} />
          <circle cx={t.x + 8} cy={t.y + 7} r="2" fill={C.terracotta} />
          <circle cx={t.x + 15} cy={t.y + 7} r="2" fill={C.butter} />
          <circle cx={t.x + 22} cy={t.y + 7} r="2" fill={C.moss} />
          <text x={t.x + 8} y={t.y + 30} fontFamily="var(--font-mono)" fontSize="7" fill={C.sage}>{`> ${t.label}`}</text>
          <line x1={t.x + 8} y1={t.y + 40} x2={t.x + 55} y2={t.y + 40} stroke={C.faint} strokeWidth="0.6" />
          <line x1={t.x + 8} y1={t.y + 46} x2={t.x + 40} y2={t.y + 46} stroke={C.faint} strokeWidth="0.6" />
        </g>
      ))}
      {/* Arrows between terminals */}
      <g stroke={C.terracotta} strokeWidth="1.8" fill="none" strokeLinecap="round">
        <path d="M132 100 Q 160 88 188 100" />
        <path d="M181 95 L 188 100 L 181 105" />
        <path d="M188 120 Q 160 132 132 120" />
        <path d="M139 115 L 132 120 L 139 125" />
      </g>
      {/* Human figure below */}
      <g transform="translate(160, 200)">
        <circle r="10" fill="none" stroke={C.ink} strokeWidth="1.5" />
        <line x1="0" y1="10" x2="0" y2="35" stroke={C.ink} strokeWidth="1.5" />
        <line x1="-15" y1="22" x2="15" y2="22" stroke={C.ink} strokeWidth="1.5" />
        <text x="0" y="55" textAnchor="middle" fontFamily="var(--font-mono)" fontSize="9" fill={C.faint}>the bottleneck</text>
      </g>
      <g stroke={C.faint} strokeWidth="1" strokeDasharray="3 3">
        <line x1="88" y1="140" x2="145" y2="190" />
        <line x1="232" y1="140" x2="175" y2="190" />
      </g>
    </svg>
  );
}

/** Naming evolution — old labels converging to a single name. */
export function NamingFigure() {
  const oldNames = ["coordination layer", "headless slack", "integration fs"];
  return (
    <svg viewBox="0 0 320 320" className="w-full">
      <defs>
        <radialGradient id="ngrad" cx="50%" cy="50%" r="55%">
          <stop offset="0%" stopColor={C.butter} stopOpacity="0.7" />
          <stop offset="100%" stopColor={C.sage} stopOpacity="0.3" />
        </radialGradient>
      </defs>
      <circle cx="160" cy="155" r="105" fill="url(#ngrad)" />
      {oldNames.map((name, i) => {
        const y = 80 + i * 40;
        return (
          <g key={name}>
            <rect x="30" y={y - 14} width="120" height="24" rx="12" fill="none" stroke={C.faint} strokeWidth="1.2" strokeDasharray="3 2" />
            <text x="90" y={y + 1} textAnchor="middle" fontFamily="var(--font-mono)" fontSize="9" fill={C.faint}>{name}</text>
            <path d={`M155 ${y - 2} Q 175 ${y - 2} 195 155`} stroke={C.terracotta} strokeWidth="1.4" fill="none" strokeLinecap="round" />
          </g>
        );
      })}
      <rect x="190" y="135" width="100" height="40" rx="10" fill={C.paper} stroke={C.ink} strokeWidth="2" />
      <text x="240" y="152" textAnchor="middle" fontFamily="var(--font-display)" fontSize="12" fill={C.ink}>proactive</text>
      <text x="240" y="166" textAnchor="middle" fontFamily="var(--font-display)" fontSize="12" fill={C.ink}>runtime</text>
      <text x="160" y="298" textAnchor="middle" fontFamily="var(--font-display)" fontStyle="italic" fontSize="12" fill={C.terracotta}>
        three names, one thing
      </text>
    </svg>
  );
}

/** Sync fallback — polling loop with cursor and rate limit. */
export function SyncFallbackFigure() {
  return (
    <svg viewBox="0 0 320 320" className="w-full">
      <defs>
        <radialGradient id="sfgrad" cx="50%" cy="40%" r="55%">
          <stop offset="0%" stopColor={C.lavender} stopOpacity="0.7" />
          <stop offset="100%" stopColor={C.rose} stopOpacity="0.4" />
        </radialGradient>
      </defs>
      <circle cx="160" cy="150" r="105" fill="url(#sfgrad)" />
      {/* API cloud */}
      <g transform="translate(160, 72)">
        <ellipse rx="45" ry="22" fill={C.paper} stroke={C.ink} strokeWidth="1.5" />
        <text y="5" textAnchor="middle" fontFamily="var(--font-display)" fontSize="11" fill={C.ink}>provider API</text>
      </g>
      {/* Poll arrows */}
      <g stroke={C.terracotta} strokeWidth="1.6" fill="none" strokeLinecap="round">
        <path d="M130 98 L 130 140" />
        <path d="M125 132 L 130 140 L 135 132" />
        <path d="M190 140 L 190 98" />
        <path d="M185 106 L 190 98 L 195 106" />
      </g>
      {/* Sync engine */}
      <rect x="100" y="145" width="120" height="35" rx="8" fill={C.paper} stroke={C.ink} strokeWidth="1.5" />
      <text x="160" y="167" textAnchor="middle" fontFamily="var(--font-mono)" fontSize="10" fill={C.ink}>sync engine</text>
      {/* Infrastructure below */}
      {[
        { x: 50, label: "cursor db" },
        { x: 160, label: "diff layer" },
        { x: 270, label: "queue" },
      ].map((item) => (
        <g key={item.label}>
          <rect x={item.x - 40} y="210" width="80" height="28" rx="6" fill="none" stroke={C.faint} strokeWidth="1.2" />
          <text x={item.x} y="228" textAnchor="middle" fontFamily="var(--font-mono)" fontSize="8" fill={C.faint}>{item.label}</text>
        </g>
      ))}
      <g stroke={C.faint} strokeWidth="1" strokeDasharray="3 3">
        <line x1="130" y1="180" x2="70" y2="210" />
        <line x1="160" y1="180" x2="160" y2="210" />
        <line x1="190" y1="180" x2="250" y2="210" />
      </g>
      <text x="160" y="268" textAnchor="middle" fontFamily="var(--font-mono)" fontSize="9" fill={C.terracotta}>
        every 5 min × rate limits
      </text>
    </svg>
  );
}

/** Reactive vs proactive comparison — side-by-side agent postures. */
export function PostureFigure() {
  return (
    <svg viewBox="0 0 320 320" className="w-full">
      <defs>
        <radialGradient id="pograd" cx="50%" cy="40%" r="55%">
          <stop offset="0%" stopColor={C.sage} stopOpacity="0.7" />
          <stop offset="100%" stopColor={C.butter} stopOpacity="0.4" />
        </radialGradient>
      </defs>
      <circle cx="160" cy="150" r="105" fill="url(#pograd)" />
      {/* Reactive side */}
      <g transform="translate(85, 90)">
        <rect x="-40" y="-10" width="80" height="50" rx="8" fill={C.paper} stroke={C.ink} strokeWidth="1.5" />
        <text y="8" textAnchor="middle" fontFamily="var(--font-display)" fontSize="11" fill={C.ink}>reactive</text>
        <text y="24" textAnchor="middle" fontFamily="var(--font-mono)" fontSize="8" fill={C.faint}>waits for you</text>
      </g>
      {/* Proactive side */}
      <g transform="translate(235, 90)">
        <rect x="-40" y="-10" width="80" height="50" rx="8" fill={C.paper} stroke={C.terracotta} strokeWidth="2" />
        <text y="8" textAnchor="middle" fontFamily="var(--font-display)" fontSize="11" fill={C.ink}>proactive</text>
        <text y="24" textAnchor="middle" fontFamily="var(--font-mono)" fontSize="8" fill={C.terracotta}>acts on its own</text>
      </g>
      {/* Reactive: user→agent arrow */}
      <g stroke={C.faint} strokeWidth="1.4" fill="none" strokeLinecap="round">
        <text x="85" y="170" textAnchor="middle" fontFamily="var(--font-mono)" fontSize="8" fill={C.faint}>user → agent</text>
        <text x="85" y="190" textAnchor="middle" fontFamily="var(--font-mono)" fontSize="8" fill={C.faint}>query → answer</text>
        <text x="85" y="210" textAnchor="middle" fontFamily="var(--font-mono)" fontSize="8" fill={C.faint}>prompt → done</text>
      </g>
      {/* Proactive: world→agent→action */}
      <g>
        <text x="235" y="170" textAnchor="middle" fontFamily="var(--font-mono)" fontSize="8" fill={C.terracotta}>world → agent</text>
        <text x="235" y="190" textAnchor="middle" fontFamily="var(--font-mono)" fontSize="8" fill={C.terracotta}>change → act</text>
        <text x="235" y="210" textAnchor="middle" fontFamily="var(--font-mono)" fontSize="8" fill={C.terracotta}>event → ongoing</text>
      </g>
      <line x1="160" y1="80" x2="160" y2="230" stroke={C.faint} strokeWidth="0.8" strokeDasharray="4 4" />
    </svg>
  );
}

/** Magical intern — figure surrounded by service notifications. */
export function MagicalInternFigure() {
  const services = [
    { x: 85, y: 68, label: "gmail", fill: C.rose },
    { x: 235, y: 68, label: "slack", fill: C.lavender },
    { x: 60, y: 180, label: "github", fill: C.sage },
    { x: 260, y: 180, label: "linear", fill: C.butter },
  ];
  return (
    <svg viewBox="0 0 320 320" className="w-full">
      <defs>
        <radialGradient id="migrad" cx="50%" cy="40%" r="55%">
          <stop offset="0%" stopColor={C.sky} stopOpacity="0.8" />
          <stop offset="100%" stopColor={C.sage} stopOpacity="0.4" />
        </radialGradient>
      </defs>
      <circle cx="160" cy="140" r="105" fill="url(#migrad)" />
      {/* Intern figure */}
      <g transform="translate(160, 130)">
        <circle r="16" fill={C.paper} stroke={C.ink} strokeWidth="1.8" />
        <circle cx="-5" cy="-3" r="1.8" fill={C.ink} />
        <circle cx="5" cy="-3" r="1.8" fill={C.ink} />
        <path d="M-6 4 Q0 10 6 4" stroke={C.ink} strokeWidth="1.2" fill="none" />
        <line x1="0" y1="16" x2="0" y2="42" stroke={C.ink} strokeWidth="1.8" />
        <line x1="-18" y1="28" x2="18" y2="28" stroke={C.ink} strokeWidth="1.8" />
        <circle cx="14" cy="-12" r="5" fill={C.terracotta} />
        <text x="14" y="-9" textAnchor="middle" fontFamily="var(--font-mono)" fontSize="7" fill={C.paper}>!</text>
      </g>
      {/* Service bubbles */}
      {services.map((s) => (
        <g key={s.label}>
          <circle cx={s.x} cy={s.y} r="24" fill={s.fill} stroke={C.ink} strokeWidth="1.2" />
          <text x={s.x} y={s.y + 4} textAnchor="middle" fontFamily="var(--font-mono)" fontSize="8" fill={C.ink}>{s.label}</text>
          <line x1={s.x + (160 - s.x) * 0.55} y1={s.y + (130 - s.y) * 0.55} x2={s.x + (160 - s.x) * 0.25} y2={s.y + (130 - s.y) * 0.25} stroke={C.faint} strokeWidth="1" strokeDasharray="3 3" />
        </g>
      ))}
      <text x="160" y="290" textAnchor="middle" fontFamily="var(--font-display)" fontStyle="italic" fontSize="12" fill={C.terracotta}>
        sees before you ask
      </text>
    </svg>
  );
}

/** Infrastructure map — apps flow through primitives to agent. */
export function InfraMapFigure() {
  const apps = [
    { x: 50, label: "gmail" },
    { x: 120, label: "slack" },
    { x: 200, label: "github" },
    { x: 270, label: "linear" },
  ];
  const primitives = [
    { x: 80, label: "clock", fill: C.butter },
    { x: 160, label: "listener", fill: C.sage },
    { x: 240, label: "inbox", fill: C.lavender },
  ];
  return (
    <svg viewBox="0 0 320 320" className="w-full">
      <defs>
        <radialGradient id="imgrad" cx="50%" cy="50%" r="55%">
          <stop offset="0%" stopColor={C.sky} stopOpacity="0.7" />
          <stop offset="100%" stopColor={C.lavender} stopOpacity="0.3" />
        </radialGradient>
      </defs>
      <circle cx="160" cy="155" r="105" fill="url(#imgrad)" />
      {/* App row */}
      {apps.map((a) => (
        <g key={a.label}>
          <rect x={a.x - 22} y={60} width="44" height="24" rx="6" fill={C.paper} stroke={C.faint} strokeWidth="1.2" />
          <text x={a.x} y={76} textAnchor="middle" fontFamily="var(--font-mono)" fontSize="8" fill={C.faint}>{a.label}</text>
        </g>
      ))}
      {/* Arrows down to primitives */}
      <g stroke={C.faint} strokeWidth="0.8" strokeDasharray="3 3">
        {apps.map((a) => (
          <line key={a.label} x1={a.x} y1="84" x2={160} y2="135" />
        ))}
      </g>
      {/* Primitives row */}
      {primitives.map((p) => (
        <g key={p.label}>
          <circle cx={p.x} cy={155} r="28" fill={p.fill} stroke={C.ink} strokeWidth="1.5" />
          <text x={p.x} y={153} textAnchor="middle" fontFamily="var(--font-display)" fontSize="11" fill={C.ink}>{p.label}</text>
          <text x={p.x} y={165} textAnchor="middle" fontFamily="var(--font-mono)" fontSize="7" fill={C.inkSoft}>primitive</text>
        </g>
      ))}
      {/* Arrow down to agent */}
      <g stroke={C.terracotta} strokeWidth="1.6" fill="none" strokeLinecap="round">
        <path d="M160 183 L160 220" />
        <path d="M155 212 L160 220 L165 212" />
      </g>
      {/* Agent box */}
      <rect x="120" y="225" width="80" height="32" rx="8" fill={C.paper} stroke={C.ink} strokeWidth="2" />
      <text x="160" y="246" textAnchor="middle" fontFamily="var(--font-display)" fontSize="14" fill={C.ink}>agent</text>
      <text x="160" y="290" textAnchor="middle" fontFamily="var(--font-display)" fontStyle="italic" fontSize="12" fill={C.terracotta}>
        apps → primitives → agent
      </text>
    </svg>
  );
}

/** Wish list categories — five domain icons. */
export function WishlistCategoriesFigure() {
  const cats = [
    { x: 160, y: 62, label: "media", icon: "♪" },
    { x: 250, y: 105, label: "info", icon: "◉" },
    { x: 225, y: 200, label: "finance", icon: "$" },
    { x: 95, y: 200, label: "work", icon: "⚙" },
    { x: 70, y: 105, label: "productivity", icon: "▦" },
  ];
  return (
    <svg viewBox="0 0 320 320" className="w-full">
      <defs>
        <radialGradient id="wcgrad" cx="50%" cy="40%" r="55%">
          <stop offset="0%" stopColor={C.butter} stopOpacity="0.8" />
          <stop offset="100%" stopColor={C.peach} stopOpacity="0.4" />
        </radialGradient>
      </defs>
      <circle cx="160" cy="145" r="105" fill="url(#wcgrad)" />
      {/* Central dot */}
      <circle cx="160" cy="145" r="6" fill={C.terracotta} />
      {/* Category nodes */}
      {cats.map((c) => (
        <g key={c.label}>
          <line x1="160" y1="145" x2={c.x} y2={c.y} stroke={C.faint} strokeWidth="1" strokeDasharray="4 3" />
          <circle cx={c.x} cy={c.y} r="26" fill={C.paper} stroke={C.ink} strokeWidth="1.4" />
          <text x={c.x} y={c.y - 2} textAnchor="middle" fontSize="16" fill={C.terracotta}>{c.icon}</text>
          <text x={c.x} y={c.y + 14} textAnchor="middle" fontFamily="var(--font-mono)" fontSize="7" fill={C.inkSoft}>{c.label}</text>
        </g>
      ))}
      <text x="160" y="290" textAnchor="middle" fontFamily="var(--font-display)" fontStyle="italic" fontSize="12" fill={C.terracotta}>
        five domains, one shape
      </text>
    </svg>
  );
}

/** Pattern convergence — many arrows converging on the triple. */
export function PatternConvergeFigure() {
  const sources = [
    { x: 30, y: 60 }, { x: 20, y: 110 }, { x: 30, y: 160 },
    { x: 20, y: 210 }, { x: 35, y: 250 },
  ];
  const triple = [
    { x: 210, y: 100, label: "clock", fill: C.butter },
    { x: 280, y: 150, label: "listener", fill: C.sage },
    { x: 210, y: 200, label: "inbox", fill: C.lavender },
  ];
  return (
    <svg viewBox="0 0 320 320" className="w-full">
      <defs>
        <radialGradient id="pcgrad" cx="60%" cy="50%" r="55%">
          <stop offset="0%" stopColor={C.butter} stopOpacity="0.7" />
          <stop offset="100%" stopColor={C.sage} stopOpacity="0.3" />
        </radialGradient>
      </defs>
      <circle cx="180" cy="155" r="105" fill="url(#pcgrad)" />
      {/* Source arrows */}
      {sources.map((s, i) => (
        <g key={i} stroke={C.faint} strokeWidth="1.2" fill="none" strokeLinecap="round">
          <line x1={s.x} y1={s.y} x2={s.x + 50} y2={s.y} />
          <rect x={s.x + 52} y={s.y - 8} width="55" height="16" rx="4" fill="none" stroke={C.faint} strokeWidth="0.8" />
          <text x={s.x + 80} y={s.y + 3} textAnchor="middle" fontFamily="var(--font-mono)" fontSize="7" fill={C.faint}>
            {["spotify", "github", "slack", "sentry", "gmail"][i]}
          </text>
          <path d={`M${s.x + 110} ${s.y} Q ${160} ${s.y} ${190} ${150}`} stroke={C.terracotta} strokeWidth="1" />
        </g>
      ))}
      {/* Triple */}
      {triple.map((t) => (
        <g key={t.label}>
          <circle cx={t.x} cy={t.y} r="24" fill={t.fill} stroke={C.ink} strokeWidth="1.5" />
          <text x={t.x} y={t.y + 4} textAnchor="middle" fontFamily="var(--font-display)" fontSize="10" fill={C.ink}>{t.label}</text>
        </g>
      ))}
      <g stroke={C.faint} strokeWidth="1" strokeDasharray="3 3">
        <line x1="210" y1="100" x2="280" y2="150" />
        <line x1="210" y1="200" x2="280" y2="150" />
        <line x1="210" y1="100" x2="210" y2="200" />
      </g>
      <text x="160" y="298" textAnchor="middle" fontFamily="var(--font-display)" fontStyle="italic" fontSize="12" fill={C.terracotta}>
        many wishes, one architecture
      </text>
    </svg>
  );
}

/** ChatGPT Pulse — nightly clock with morning cards. */
export function PulseClockFigure() {
  return (
    <svg viewBox="0 0 320 320" className="w-full">
      <defs>
        <radialGradient id="pcfgrad" cx="50%" cy="40%" r="55%">
          <stop offset="0%" stopColor={C.sky} stopOpacity="0.7" />
          <stop offset="100%" stopColor={C.rose} stopOpacity="0.4" />
        </radialGradient>
      </defs>
      <circle cx="160" cy="145" r="105" fill="url(#pcfgrad)" />
      {/* Moon — overnight processing */}
      <g transform="translate(160, 80)">
        <circle r="22" fill={C.butter} stroke={C.ink} strokeWidth="1.2" />
        <circle cx="8" cy="-8" r="18" fill="url(#pcfgrad)" />
        <text y="38" textAnchor="middle" fontFamily="var(--font-mono)" fontSize="8" fill={C.faint}>overnight</text>
      </g>
      {/* Arrow down */}
      <g stroke={C.terracotta} strokeWidth="1.6" fill="none" strokeLinecap="round">
        <path d="M160 125 L160 150" />
        <path d="M155 144 L160 152 L165 144" />
      </g>
      {/* Morning cards */}
      {[0, 1, 2].map((i) => (
        <g key={i} transform={`translate(${95 + i * 50}, 175)`}>
          <rect x="-18" y="-22" width="36" height="44" rx="5" fill={C.paper} stroke={C.ink} strokeWidth={i === 1 ? "2" : "1.2"} />
          <line x1="-10" y1="-10" x2="10" y2="-10" stroke={C.faint} strokeWidth="0.8" />
          <line x1="-10" y1="-2" x2="8" y2="-2" stroke={C.faint} strokeWidth="0.8" />
          <line x1="-10" y1="6" x2="6" y2="6" stroke={C.faint} strokeWidth="0.8" />
        </g>
      ))}
      <text x="160" y="240" textAnchor="middle" fontFamily="var(--font-mono)" fontSize="8" fill={C.faint}>morning cards</text>
      {/* Missing primitives — greyed out */}
      <g transform="translate(75, 275)">
        <circle r="14" fill={C.butter} stroke={C.ink} strokeWidth="1.2" />
        <text y="4" textAnchor="middle" fontFamily="var(--font-mono)" fontSize="7" fill={C.ink}>clock</text>
      </g>
      <g transform="translate(160, 275)">
        <circle r="14" fill="none" stroke={C.faint} strokeWidth="1.2" strokeDasharray="3 2" />
        <text y="4" textAnchor="middle" fontFamily="var(--font-mono)" fontSize="7" fill={C.faint}>listener</text>
      </g>
      <g transform="translate(245, 275)">
        <circle r="14" fill="none" stroke={C.faint} strokeWidth="1.2" strokeDasharray="3 2" />
        <text y="4" textAnchor="middle" fontFamily="var(--font-mono)" fontSize="7" fill={C.faint}>inbox</text>
      </g>
    </svg>
  );
}

/** What Pulse could be — all three primitives active. */
export function PulseCompleteFigure() {
  const items = [
    { x: 80, y: 90, label: "clock", sub: "nightly + real-time", fill: C.butter },
    { x: 240, y: 90, label: "listener", sub: "change events", fill: C.sage },
    { x: 160, y: 220, label: "inbox", sub: "deliver anywhere", fill: C.lavender },
  ];
  return (
    <svg viewBox="0 0 320 320" className="w-full">
      <defs>
        <radialGradient id="pcomplete" cx="50%" cy="50%" r="55%">
          <stop offset="0%" stopColor={C.sage} stopOpacity="0.6" />
          <stop offset="100%" stopColor={C.sky} stopOpacity="0.3" />
        </radialGradient>
      </defs>
      <circle cx="160" cy="155" r="105" fill="url(#pcomplete)" />
      {/* Connecting lines */}
      <g stroke={C.terracotta} strokeWidth="1.6" strokeDasharray="4 4">
        <line x1="80" y1="90" x2="240" y2="90" />
        <line x1="80" y1="90" x2="160" y2="220" />
        <line x1="240" y1="90" x2="160" y2="220" />
      </g>
      {/* Center label */}
      <text x="160" y="152" textAnchor="middle" fontFamily="var(--font-display)" fontSize="11" fill={C.terracotta}>proactive</text>
      {items.map((it) => (
        <g key={it.label}>
          <circle cx={it.x} cy={it.y} r="38" fill={it.fill} stroke={C.ink} strokeWidth="1.8" />
          <text x={it.x} y={it.y - 4} textAnchor="middle" fontFamily="var(--font-display)" fontSize="13" fill={C.ink}>{it.label}</text>
          <text x={it.x} y={it.y + 12} textAnchor="middle" fontFamily="var(--font-mono)" fontSize="7" fill={C.inkSoft}>{it.sub}</text>
        </g>
      ))}
      <text x="160" y="300" textAnchor="middle" fontFamily="var(--font-display)" fontStyle="italic" fontSize="12" fill={C.terracotta}>
        useful → indispensable
      </text>
    </svg>
  );
}

/** Landscape grid — players scored against three primitives. */
export function LandscapeGridFigure() {
  const cols = [
    { x: 140, label: "clock", fill: C.butter },
    { x: 200, label: "listener", fill: C.sage },
    { x: 260, label: "inbox", fill: C.lavender },
  ];
  const rows = [
    { y: 100, name: "Pulse", scores: [true, false, false] },
    { y: 130, name: "Orbit", scores: [true, true, false] },
    { y: 160, name: "Remy", scores: [true, true, true] },
    { y: 190, name: "Perplexity", scores: [true, true, true] },
    { y: 220, name: "Managerbot", scores: [true, true, true] },
    { y: 250, name: "CodeWords", scores: [true, false, false] },
    { y: 280, name: "Relay", scores: [true, true, true] },
  ];
  return (
    <svg viewBox="0 0 320 320" className="w-full">
      <defs>
        <radialGradient id="lggrad" cx="50%" cy="40%" r="60%">
          <stop offset="0%" stopColor={C.sage} stopOpacity="0.5" />
          <stop offset="100%" stopColor={C.paper} stopOpacity="0.2" />
        </radialGradient>
      </defs>
      <rect x="10" y="55" width="300" height="255" rx="12" fill="url(#lggrad)" />
      {cols.map((c) => (
        <g key={c.label}>
          <circle cx={c.x} cy="72" r="10" fill={c.fill} stroke={C.ink} strokeWidth="1" />
          <text x={c.x} y="76" textAnchor="middle" fontFamily="var(--font-mono)" fontSize="6" fill={C.ink}>{c.label}</text>
        </g>
      ))}
      {rows.map((r) => (
        <g key={r.name}>
          <text x="75" y={r.y + 4} textAnchor="end" fontFamily="var(--font-display)" fontSize="10" fill={C.ink}>{r.name}</text>
          {r.scores.map((s, i) => (
            <g key={i}>
              {s ? (
                <circle cx={cols[i].x} cy={r.y} r="6" fill={cols[i].fill} stroke={C.ink} strokeWidth="1" />
              ) : (
                <circle cx={cols[i].x} cy={r.y} r="6" fill="none" stroke={C.faint} strokeWidth="1" strokeDasharray="2 2" />
              )}
            </g>
          ))}
        </g>
      ))}
      <text x="160" y="30" textAnchor="middle" fontFamily="var(--font-display)" fontSize="13" fill={C.ink}>landscape scorecard</text>
      <text x="160" y="45" textAnchor="middle" fontFamily="var(--font-mono)" fontSize="8" fill={C.faint}>May 2026</text>
    </svg>
  );
}

/** Push failure modes — webhook pipeline with break points. */
export function PushFailureFigure() {
  const stages = [
    { x: 45, label: "provider" },
    { x: 115, label: "deliver" },
    { x: 185, label: "parse" },
    { x: 255, label: "process" },
  ];
  return (
    <svg viewBox="0 0 320 320" className="w-full">
      <defs>
        <radialGradient id="pfgrad" cx="50%" cy="40%" r="55%">
          <stop offset="0%" stopColor={C.rose} stopOpacity="0.8" />
          <stop offset="100%" stopColor={C.peach} stopOpacity="0.4" />
        </radialGradient>
      </defs>
      <circle cx="160" cy="145" r="105" fill="url(#pfgrad)" />
      {/* Pipeline stages */}
      {stages.map((s, i) => (
        <g key={s.label}>
          <rect
            x={s.x - 28}
            y={100}
            width="56"
            height="32"
            rx="6"
            fill={C.paper}
            stroke={C.ink}
            strokeWidth="1.4"
          />
          <text
            x={s.x}
            y={120}
            textAnchor="middle"
            fontFamily="var(--font-mono)"
            fontSize="9"
            fill={C.ink}
          >
            {s.label}
          </text>
          {i < stages.length - 1 && (
            <g stroke={C.faint} strokeWidth="1.2" fill="none" strokeLinecap="round">
              <line x1={s.x + 28} y1={116} x2={stages[i + 1].x - 28} y2={116} />
            </g>
          )}
        </g>
      ))}
      {/* Break indicators — X marks at failure points */}
      {[80, 150, 220].map((x, i) => (
        <g key={i} stroke={C.terracotta} strokeWidth="2.2" strokeLinecap="round">
          <line x1={x - 5} y1={108} x2={x + 5} y2={118} />
          <line x1={x + 5} y1={108} x2={x - 5} y2={118} />
        </g>
      ))}
      {/* Failure labels below */}
      {[
        { x: 80, label: "outage" },
        { x: 150, label: "timeout" },
        { x: 220, label: "schema" },
      ].map((f) => (
        <text
          key={f.label}
          x={f.x}
          y={155}
          textAnchor="middle"
          fontFamily="var(--font-mono)"
          fontSize="8"
          fill={C.terracotta}
        >
          {f.label}
        </text>
      ))}
      {/* Missed events below pipeline */}
      <g transform="translate(160, 200)">
        <rect x="-70" y="-15" width="140" height="30" rx="6" fill="none" stroke={C.faint} strokeWidth="1" strokeDasharray="3 2" />
        <text y="4" textAnchor="middle" fontFamily="var(--font-mono)" fontSize="9" fill={C.faint}>events silently lost</text>
      </g>
      {/* Recovery poll at bottom */}
      <g transform="translate(160, 250)">
        <rect x="-55" y="-12" width="110" height="24" rx="6" fill={C.paper} stroke={C.ink} strokeWidth="1.2" />
        <text y="4" textAnchor="middle" fontFamily="var(--font-mono)" fontSize="8" fill={C.ink}>reconciliation poll</text>
      </g>
      <g stroke={C.moss} strokeWidth="1.2" fill="none" strokeLinecap="round">
        <path d="M160 215 L160 238" />
        <path d="M155 232 L160 238 L165 232" />
      </g>
      <text x="160" y="295" textAnchor="middle" fontFamily="var(--font-display)" fontStyle="italic" fontSize="12" fill={C.terracotta}>
        three places to break, silently
      </text>
    </svg>
  );
}

/** Event ordering — out-of-order webhook delivery. */
export function OrderingFigure() {
  return (
    <svg viewBox="0 0 320 320" className="w-full">
      <defs>
        <radialGradient id="ofgrad" cx="50%" cy="40%" r="55%">
          <stop offset="0%" stopColor={C.lavender} stopOpacity="0.7" />
          <stop offset="100%" stopColor={C.rose} stopOpacity="0.4" />
        </radialGradient>
      </defs>
      <circle cx="160" cy="145" r="105" fill="url(#ofgrad)" />
      {/* Provider side — events sent in order */}
      <g transform="translate(60, 70)">
        <text x="0" y="-6" textAnchor="middle" fontFamily="var(--font-mono)" fontSize="8" fill={C.faint}>sent</text>
        {["1 created", "2 updated", "3 closed"].map((label, i) => (
          <g key={label}>
            <rect x="-38" y={i * 28} width="76" height="22" rx="4" fill={C.paper} stroke={C.ink} strokeWidth="1.2" />
            <text x="0" y={i * 28 + 15} textAnchor="middle" fontFamily="var(--font-mono)" fontSize="8" fill={C.ink}>{label}</text>
          </g>
        ))}
      </g>
      {/* Crossing arrows — events arrive out of order */}
      <g stroke={C.terracotta} strokeWidth="1.4" fill="none" strokeLinecap="round">
        <path d="M100 81 Q 160 105 220 109" />
        <path d="M100 109 Q 160 100 220 81" />
        <path d="M100 137 Q 160 130 220 137" />
        {/* arrowheads */}
        <path d="M213 105 L220 109 L213 113" />
        <path d="M213 77 L220 81 L213 85" />
        <path d="M213 133 L220 137 L213 141" />
      </g>
      {/* Agent side — events received scrambled */}
      <g transform="translate(260, 70)">
        <text x="0" y="-6" textAnchor="middle" fontFamily="var(--font-mono)" fontSize="8" fill={C.faint}>received</text>
        {["3 closed", "1 created", "2 updated"].map((label, i) => (
          <g key={label}>
            <rect
              x="-38"
              y={i * 28}
              width="76"
              height="22"
              rx="4"
              fill={i === 0 ? C.rose : C.paper}
              stroke={i === 0 ? C.terracotta : C.ink}
              strokeWidth={i === 0 ? "1.8" : "1.2"}
            />
            <text x="0" y={i * 28 + 15} textAnchor="middle" fontFamily="var(--font-mono)" fontSize="8" fill={C.ink}>{label}</text>
          </g>
        ))}
      </g>
      {/* Question mark for the confused agent */}
      <g transform="translate(160, 210)">
        <circle r="22" fill={C.paper} stroke={C.ink} strokeWidth="1.4" />
        <text y="2" textAnchor="middle" fontFamily="var(--font-display)" fontSize="11" fill={C.ink}>agent</text>
        <text x="26" y="-14" fontFamily="var(--font-display)" fontSize="16" fill={C.terracotta}>?</text>
      </g>
      {/* Burst indicator */}
      <g transform="translate(160, 265)">
        {[0, 1, 2, 3, 4, 5, 6].map((i) => (
          <rect
            key={i}
            x={-52 + i * 16}
            y={-8}
            width="12"
            height={8 + (i === 3 ? 18 : i === 2 || i === 4 ? 12 : i === 1 || i === 5 ? 6 : 2)}
            rx="2"
            fill={i === 3 ? C.terracotta : C.faint}
            opacity={i === 3 ? 1 : 0.5}
          />
        ))}
        <text y="30" textAnchor="middle" fontFamily="var(--font-mono)" fontSize="8" fill={C.faint}>queue depth spike</text>
      </g>
    </svg>
  );
}

/** Landscape layers — horizontal / vertical / infrastructure. */
export function LandscapeLayersFigure() {
  return (
    <svg viewBox="0 0 320 320" className="w-full">
      <defs>
        <radialGradient id="llgrad" cx="50%" cy="40%" r="55%">
          <stop offset="0%" stopColor={C.lavender} stopOpacity="0.5" />
          <stop offset="100%" stopColor={C.sky} stopOpacity="0.3" />
        </radialGradient>
      </defs>
      <circle cx="160" cy="160" r="110" fill="url(#llgrad)" />
      {/* Infrastructure layer */}
      <rect x="40" y="220" width="240" height="50" rx="8" fill={C.peach} stroke={C.ink} strokeWidth="1.8" />
      <text x="160" y="242" textAnchor="middle" fontFamily="var(--font-display)" fontSize="12" fill={C.ink}>infrastructure</text>
      <text x="160" y="258" textAnchor="middle" fontFamily="var(--font-mono)" fontSize="8" fill={C.inkSoft}>clock + listener + inbox</text>
      {/* Vertical agents */}
      <rect x="45" y="130" width="100" height="70" rx="8" fill={C.sage} stroke={C.ink} strokeWidth="1.4" />
      <text x="95" y="160" textAnchor="middle" fontFamily="var(--font-display)" fontSize="10" fill={C.ink}>vertical</text>
      <text x="95" y="175" textAnchor="middle" fontFamily="var(--font-mono)" fontSize="7" fill={C.inkSoft}>Managerbot</text>
      <text x="95" y="186" textAnchor="middle" fontFamily="var(--font-mono)" fontSize="7" fill={C.inkSoft}>Writer</text>
      {/* Horizontal assistants */}
      <rect x="175" y="130" width="100" height="70" rx="8" fill={C.sky} stroke={C.ink} strokeWidth="1.4" />
      <text x="225" y="160" textAnchor="middle" fontFamily="var(--font-display)" fontSize="10" fill={C.ink}>horizontal</text>
      <text x="225" y="175" textAnchor="middle" fontFamily="var(--font-mono)" fontSize="7" fill={C.inkSoft}>Pulse, Orbit</text>
      <text x="225" y="186" textAnchor="middle" fontFamily="var(--font-mono)" fontSize="7" fill={C.inkSoft}>Remy, Hatch</text>
      {/* Connectors */}
      <g stroke={C.faint} strokeWidth="1.2" strokeDasharray="3 3">
        <line x1="95" y1="200" x2="95" y2="220" />
        <line x1="225" y1="200" x2="225" y2="220" />
      </g>
      {/* Top label */}
      <text x="160" y="80" textAnchor="middle" fontFamily="var(--font-display)" fontSize="11" fill={C.ink}>end users</text>
      <g stroke={C.faint} strokeWidth="1" strokeDasharray="3 3">
        <line x1="95" y1="90" x2="95" y2="130" />
        <line x1="225" y1="90" x2="225" y2="130" />
      </g>
      {/* Title */}
      <text x="160" y="310" textAnchor="middle" fontFamily="var(--font-display)" fontStyle="italic" fontSize="11" fill={C.terracotta}>three layers of the stack</text>
    </svg>
  );
}

/** Digest pipeline — sources fan out, dedup, cluster, publish. */
export function DigestPipelineFigure() {
  const sources = [
    { x: 40, y: 60, label: "brave" },
    { x: 40, y: 100, label: "brave" },
    { x: 40, y: 140, label: "reddit" },
    { x: 40, y: 180, label: "reddit" },
  ];
  return (
    <svg viewBox="0 0 320 320" className="w-full">
      <defs>
        <radialGradient id="dpgrad" cx="50%" cy="40%" r="55%">
          <stop offset="0%" stopColor={C.sage} stopOpacity="0.8" />
          <stop offset="100%" stopColor={C.sky} stopOpacity="0.4" />
        </radialGradient>
      </defs>
      <circle cx="160" cy="155" r="105" fill="url(#dpgrad)" />
      {/* Source boxes */}
      {sources.map((s, i) => (
        <g key={i}>
          <rect x={s.x - 28} y={s.y - 12} width="56" height="24" rx="5" fill={C.paper} stroke={C.ink} strokeWidth="1.2" />
          <text x={s.x} y={s.y + 4} textAnchor="middle" fontFamily="var(--font-mono)" fontSize="8" fill={C.ink}>
            {s.label}{i < 2 ? ` q${i + 1}` : ""}
          </text>
        </g>
      ))}
      {/* Fan-in arrows to dedup */}
      <g stroke={C.faint} strokeWidth="1" fill="none" strokeLinecap="round">
        {sources.map((s, i) => (
          <line key={i} x1={s.x + 28} y1={s.y} x2={130} y2={120} />
        ))}
      </g>
      {/* Dedup box */}
      <rect x="130" y="105" width="60" height="30" rx="6" fill={C.paper} stroke={C.ink} strokeWidth="1.5" />
      <text x="160" y="118" textAnchor="middle" fontFamily="var(--font-mono)" fontSize="8" fill={C.ink}>dedup</text>
      <text x="160" y="128" textAnchor="middle" fontFamily="var(--font-mono)" fontSize="6" fill={C.faint}>seen.json</text>
      {/* Arrow to cluster */}
      <g stroke={C.terracotta} strokeWidth="1.4" fill="none" strokeLinecap="round">
        <path d="M190 120 L220 120" />
        <path d="M214 115 L220 120 L214 125" />
      </g>
      {/* Cluster box */}
      <rect x="220" y="105" width="70" height="30" rx="6" fill={C.butter} stroke={C.ink} strokeWidth="1.5" />
      <text x="255" y="118" textAnchor="middle" fontFamily="var(--font-mono)" fontSize="8" fill={C.ink}>cluster</text>
      <text x="255" y="128" textAnchor="middle" fontFamily="var(--font-mono)" fontSize="6" fill={C.faint}>gemini flash</text>
      {/* Arrow down to output */}
      <g stroke={C.terracotta} strokeWidth="1.4" fill="none" strokeLinecap="round">
        <path d="M255 135 L255 175" />
        <path d="M250 169 L255 177 L260 169" />
      </g>
      {/* GitHub issue box */}
      <rect x="215" y="180" width="80" height="34" rx="8" fill={C.paper} stroke={C.ink} strokeWidth="2" />
      <text x="255" y="196" textAnchor="middle" fontFamily="var(--font-mono)" fontSize="8" fill={C.ink}>github issue</text>
      <text x="255" y="207" textAnchor="middle" fontFamily="var(--font-mono)" fontSize="6" fill={C.faint}>weekly-digest</text>
      {/* Cron trigger label */}
      <text x="40" y="40" fontFamily="var(--font-mono)" fontSize="8" fill={C.terracotta}>cron: sat 09:00</text>
      <g stroke={C.terracotta} strokeWidth="1" fill="none" strokeLinecap="round" strokeDasharray="3 3">
        <line x1="40" y1="44" x2="40" y2="48" />
      </g>
      <text x="160" y="295" textAnchor="middle" fontFamily="var(--font-display)" fontStyle="italic" fontSize="12" fill={C.terracotta}>
        sources → dedup → cluster → issue
      </text>
    </svg>
  );
}

/** Digest timeline — bugs discovered over first weeks. */
export function DigestTimelineFigure() {
  const events = [
    { week: "W1", label: "env() bug", y: 70, fill: C.rose },
    { week: "W2", label: "reddit 429s", y: 120, fill: C.peach },
    { week: "W2", label: "narrow queries", y: 170, fill: C.peach },
    { week: "W3", label: "hallucinated cluster", y: 220, fill: C.butter },
  ];
  return (
    <svg viewBox="0 0 320 320" className="w-full">
      <defs>
        <radialGradient id="dtgrad" cx="50%" cy="40%" r="55%">
          <stop offset="0%" stopColor={C.rose} stopOpacity="0.6" />
          <stop offset="100%" stopColor={C.butter} stopOpacity="0.35" />
        </radialGradient>
      </defs>
      <circle cx="160" cy="155" r="105" fill="url(#dtgrad)" />
      {/* Timeline spine */}
      <line x1="80" y1="55" x2="80" y2="245" stroke={C.ink} strokeWidth="1.5" />
      {/* Events */}
      {events.map((e, i) => (
        <g key={i}>
          <circle cx="80" cy={e.y} r="6" fill={e.fill} stroke={C.ink} strokeWidth="1.2" />
          <text x="72" y={e.y + 4} textAnchor="end" fontFamily="var(--font-mono)" fontSize="8" fill={C.faint}>{e.week}</text>
          <line x1="86" y1={e.y} x2="105" y2={e.y} stroke={C.faint} strokeWidth="0.8" />
          <rect x="105" y={e.y - 11} width="120" height="22" rx="5" fill={C.paper} stroke={C.ink} strokeWidth="1" />
          <text x="165" y={e.y + 3} textAnchor="middle" fontFamily="var(--font-mono)" fontSize="9" fill={C.ink}>{e.label}</text>
        </g>
      ))}
      {/* Status labels */}
      <text x="80" y="270" textAnchor="middle" fontFamily="var(--font-mono)" fontSize="8" fill={C.moss}>W4: stable</text>
      <circle cx="80" cy="258" r="4" fill={C.sage} stroke={C.ink} strokeWidth="1" />
      <text x="160" y="305" textAnchor="middle" fontFamily="var(--font-display)" fontStyle="italic" fontSize="12" fill={C.terracotta}>
        four bugs in three weeks
      </text>
    </svg>
  );
}

/** Demo vs production — what an afternoon demo hides. */
export function DemoVsProdFigure() {
  return (
    <svg viewBox="0 0 320 320" className="w-full">
      <defs>
        <radialGradient id="dvpgrad" cx="50%" cy="40%" r="55%">
          <stop offset="0%" stopColor={C.lavender} stopOpacity="0.7" />
          <stop offset="100%" stopColor={C.butter} stopOpacity="0.4" />
        </radialGradient>
      </defs>
      <circle cx="160" cy="155" r="105" fill="url(#dvpgrad)" />
      {/* Demo label */}
      <text x="160" y="56" textAnchor="middle" fontFamily="var(--font-display)" fontSize="10" fill={C.faint}>demo</text>
      {/* Demo: 3 simple boxes */}
      {[
        { x: 65, label: "cron" },
        { x: 160, label: "LLM" },
        { x: 255, label: "slack" },
      ].map((b) => (
        <g key={b.label}>
          <rect x={b.x - 28} y={62} width="56" height="24" rx="6" fill={C.paper} stroke={C.faint} strokeWidth="1.2" />
          <text x={b.x} y={78} textAnchor="middle" fontFamily="var(--font-mono)" fontSize="9" fill={C.faint}>{b.label}</text>
        </g>
      ))}
      <g stroke={C.faint} strokeWidth="1" fill="none" strokeLinecap="round">
        <line x1="93" y1="74" x2="132" y2="74" />
        <path d="M127 70 L132 74 L127 78" />
        <line x1="188" y1="74" x2="227" y2="74" />
        <path d="M222 70 L227 74 L222 78" />
      </g>
      {/* Divider */}
      <line x1="45" y1="100" x2="275" y2="100" stroke={C.faint} strokeWidth="0.6" strokeDasharray="4 3" />
      {/* Production label */}
      <text x="160" y="118" textAnchor="middle" fontFamily="var(--font-display)" fontSize="10" fill={C.terracotta}>production</text>
      {/* Production: same 3 core boxes */}
      {[
        { x: 65, label: "cron" },
        { x: 160, label: "LLM" },
        { x: 255, label: "slack" },
      ].map((b) => (
        <g key={`p-${b.label}`}>
          <rect x={b.x - 28} y={126} width="56" height="24" rx="6" fill={C.paper} stroke={C.ink} strokeWidth="1.5" />
          <text x={b.x} y={142} textAnchor="middle" fontFamily="var(--font-mono)" fontSize="9" fill={C.ink}>{b.label}</text>
        </g>
      ))}
      <g stroke={C.ink} strokeWidth="1.2" fill="none" strokeLinecap="round">
        <line x1="93" y1="138" x2="132" y2="138" />
        <path d="M127 134 L132 138 L127 142" />
        <line x1="188" y1="138" x2="227" y2="138" />
        <path d="M222 134 L227 138 L222 142" />
      </g>
      {/* Infrastructure ring */}
      {[
        { x: 55, y: 168, label: "idempotency" },
        { x: 160, y: 168, label: "rate limits" },
        { x: 265, y: 168, label: "dedup" },
        { x: 55, y: 198, label: "state store" },
        { x: 160, y: 198, label: "auth scope" },
        { x: 265, y: 198, label: "retry" },
        { x: 108, y: 228, label: "observability" },
        { x: 212, y: 228, label: "spend guard" },
      ].map((b) => (
        <g key={b.label}>
          <rect x={b.x - 42} y={b.y} width="84" height="20" rx="4" fill="none" stroke={C.terracotta} strokeWidth="0.9" />
          <text x={b.x} y={b.y + 14} textAnchor="middle" fontFamily="var(--font-mono)" fontSize="7" fill={C.terracotta}>{b.label}</text>
        </g>
      ))}
      <g stroke={C.faint} strokeWidth="0.6" strokeDasharray="2 2">
        <line x1="65" y1="150" x2="55" y2="168" />
        <line x1="160" y1="150" x2="160" y2="168" />
        <line x1="255" y1="150" x2="265" y2="168" />
      </g>
      <text x="160" y="272" textAnchor="middle" fontFamily="var(--font-display)" fontStyle="italic" fontSize="11" fill={C.terracotta}>
        same three boxes, eight more underneath
      </text>
    </svg>
  );
}

/** Memory drift — agent runs with no carry-over. */
export function MemoryDriftFigure() {
  const runs = [
    { x: 70, label: "run 1", items: ["A", "B", "C"], hasMem: false },
    { x: 160, label: "run 2", items: ["B", "C", "D"], hasMem: false },
    { x: 250, label: "run 3", items: ["C", "D", "E"], hasMem: false },
  ];
  return (
    <svg viewBox="0 0 320 320" className="w-full">
      <defs>
        <radialGradient id="mdgrad" cx="50%" cy="40%" r="55%">
          <stop offset="0%" stopColor={C.rose} stopOpacity="0.6" />
          <stop offset="100%" stopColor={C.lavender} stopOpacity="0.4" />
        </radialGradient>
      </defs>
      <circle cx="160" cy="145" r="105" fill="url(#mdgrad)" />
      {runs.map((r, ri) => (
        <g key={r.label}>
          {/* Agent circle */}
          <circle cx={r.x} cy={72} r="18" fill={C.paper} stroke={C.ink} strokeWidth="1.4" />
          <text x={r.x} y={76} textAnchor="middle" fontFamily="var(--font-mono)" fontSize="8" fill={C.ink}>{r.label}</text>
          {/* Items processed */}
          {r.items.map((item, i) => {
            const y = 110 + i * 28;
            const isRepeat = ri > 0 && runs[ri - 1].items.includes(item);
            return (
              <g key={item}>
                <rect
                  x={r.x - 20}
                  y={y}
                  width="40"
                  height="20"
                  rx="4"
                  fill={isRepeat ? C.rose : C.paper}
                  stroke={isRepeat ? C.terracotta : C.ink}
                  strokeWidth={isRepeat ? "1.6" : "1"}
                />
                <text
                  x={r.x}
                  y={y + 14}
                  textAnchor="middle"
                  fontFamily="var(--font-mono)"
                  fontSize="10"
                  fill={isRepeat ? C.terracotta : C.ink}
                >{item}</text>
              </g>
            );
          })}
          {/* Broken connection to next run */}
          {ri < runs.length - 1 && (
            <g>
              <line
                x1={r.x + 22}
                y1={72}
                x2={runs[ri + 1].x - 22}
                y2={72}
                stroke={C.faint}
                strokeWidth="1"
                strokeDasharray="3 4"
              />
              <text
                x={(r.x + runs[ri + 1].x) / 2}
                y={62}
                textAnchor="middle"
                fontFamily="var(--font-display)"
                fontSize="14"
                fill={C.terracotta}
              >?</text>
            </g>
          )}
        </g>
      ))}
      <text x="160" y="210" textAnchor="middle" fontFamily="var(--font-mono)" fontSize="8" fill={C.terracotta}>
        reprocessed
      </text>
      <text x="160" y="268" textAnchor="middle" fontFamily="var(--font-display)" fontStyle="italic" fontSize="11" fill={C.terracotta}>
        every run starts cold
      </text>
    </svg>
  );
}

/** Judgment gate — act / notify / ignore decision. */
export function JudgmentGateFigure() {
  return (
    <svg viewBox="0 0 320 320" className="w-full">
      <defs>
        <radialGradient id="jggrad" cx="50%" cy="40%" r="55%">
          <stop offset="0%" stopColor={C.sage} stopOpacity="0.7" />
          <stop offset="100%" stopColor={C.butter} stopOpacity="0.4" />
        </radialGradient>
      </defs>
      <circle cx="160" cy="150" r="105" fill="url(#jggrad)" />
      {/* Incoming events */}
      {[100, 130, 160, 190, 220].map((x, i) => (
        <circle key={i} cx={x} cy={58} r="6" fill={C.peach} stroke={C.ink} strokeWidth="1" />
      ))}
      <text x="160" y="50" textAnchor="middle" fontFamily="var(--font-mono)" fontSize="7" fill={C.faint}>changes detected</text>
      {/* Arrows into gate */}
      <g stroke={C.faint} strokeWidth="0.8" fill="none">
        {[100, 130, 160, 190, 220].map((x) => (
          <line key={x} x1={x} y1={64} x2={160} y2={100} />
        ))}
      </g>
      {/* Judgment gate — diamond */}
      <g transform="translate(160, 130)">
        <path d="M0 -30 L35 0 L0 30 L-35 0 Z" fill={C.paper} stroke={C.ink} strokeWidth="2" />
        <text y={-4} textAnchor="middle" fontFamily="var(--font-display)" fontSize="10" fill={C.ink}>judgment</text>
        <text y={10} textAnchor="middle" fontFamily="var(--font-mono)" fontSize="7" fill={C.faint}>gate</text>
      </g>
      {/* Three output paths */}
      {/* Act */}
      <g>
        <line x1="125" y1="130" x2="60" y2="210" stroke={C.moss} strokeWidth="2" strokeLinecap="round" />
        <path d="M56 202 L58 212 L66 206" stroke={C.moss} strokeWidth="2" fill="none" strokeLinecap="round" />
        <rect x="28" y="215" width="64" height="26" rx="6" fill={C.sage} stroke={C.ink} strokeWidth="1.4" />
        <text x="60" y="232" textAnchor="middle" fontFamily="var(--font-display)" fontSize="10" fill={C.ink}>act now</text>
      </g>
      {/* Notify */}
      <g>
        <line x1="160" y1="160" x2="160" y2="210" stroke={C.terracotta} strokeWidth="1.6" strokeLinecap="round" />
        <path d="M155 204 L160 212 L165 204" stroke={C.terracotta} strokeWidth="1.6" fill="none" strokeLinecap="round" />
        <rect x="128" y="215" width="64" height="26" rx="6" fill={C.butter} stroke={C.ink} strokeWidth="1.4" />
        <text x="160" y="232" textAnchor="middle" fontFamily="var(--font-display)" fontSize="10" fill={C.ink}>notify</text>
      </g>
      {/* Ignore */}
      <g>
        <line x1="195" y1="130" x2="260" y2="210" stroke={C.faint} strokeWidth="1.2" strokeLinecap="round" strokeDasharray="4 3" />
        <rect x="228" y="215" width="64" height="26" rx="6" fill="none" stroke={C.faint} strokeWidth="1.2" strokeDasharray="3 2" />
        <text x="260" y="232" textAnchor="middle" fontFamily="var(--font-display)" fontSize="10" fill={C.faint}>record</text>
      </g>
      <text x="160" y="275" textAnchor="middle" fontFamily="var(--font-display)" fontStyle="italic" fontSize="11" fill={C.terracotta}>
        three paths, one decision
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

/** Review agent Act 1 — reactive webhook-triggered review loop. */
export function ReviewReactiveFigure() {
  return (
    <svg viewBox="0 0 320 320" className="w-full">
      <defs>
        <radialGradient id="rrgrad" cx="50%" cy="40%" r="55%">
          <stop offset="0%" stopColor={C.peach} stopOpacity="0.9" />
          <stop offset="100%" stopColor={C.butter} stopOpacity="0.4" />
        </radialGradient>
      </defs>
      <circle cx="160" cy="155" r="110" fill="url(#rrgrad)" />

      {/* GitHub box (top-left) */}
      <g transform="translate(68, 90)">
        <rect x="-30" y="-22" width="60" height="44" rx="6" fill={C.paper} stroke={C.ink} strokeWidth="1.5" />
        <text textAnchor="middle" y="-4" fontFamily="var(--font-mono)" fontSize="9" fill={C.ink}>PR</text>
        <text textAnchor="middle" y="10" fontFamily="var(--font-mono)" fontSize="8" fill={C.faint}>opened</text>
      </g>

      {/* Webhook arrow: GitHub → Agent */}
      <g stroke={C.inkSoft} strokeWidth="1.6" fill="none" strokeLinecap="round">
        <path d="M100 100 Q 140 80 170 110" />
        <path d="M164 104 L170 110 L162 114" />
      </g>
      <text x="148" y="82" textAnchor="middle" fontFamily="var(--font-mono)" fontSize="7" fill={C.faint}>webhook</text>

      {/* Agent circle (center) */}
      <g transform="translate(210, 130)">
        <circle r="32" fill={C.paper} stroke={C.ink} strokeWidth="1.5" />
        <text textAnchor="middle" y="-6" fontFamily="var(--font-display)" fontSize="10" fill={C.ink}>MSD</text>
        <text textAnchor="middle" y="8" fontFamily="var(--font-mono)" fontSize="7" fill={C.faint}>analyze</text>
        {/* Three small dots for the three personas */}
        <circle cx="-8" cy="18" r="2.5" fill={C.terracotta} />
        <circle cx="0" cy="18" r="2.5" fill={C.moss} />
        <circle cx="8" cy="18" r="2.5" fill={C.plum} />
      </g>

      {/* Comment arrow: Agent → GitHub */}
      <g stroke={C.inkSoft} strokeWidth="1.6" fill="none" strokeLinecap="round">
        <path d="M190 155 Q 140 195 95 170" />
        <path d="M102 174 L95 170 L100 162" />
      </g>
      <text x="148" y="200" textAnchor="middle" fontFamily="var(--font-mono)" fontSize="7" fill={C.faint}>comment</text>

      {/* Comment box (bottom-left) */}
      <g transform="translate(68, 195)">
        <rect x="-30" y="-16" width="60" height="32" rx="6" fill={C.paper} stroke={C.ink} strokeWidth="1.5" />
        <line x1="-18" y1="-6" x2="18" y2="-6" stroke={C.faint} strokeWidth="0.8" />
        <line x1="-18" y1="0" x2="14" y2="0" stroke={C.faint} strokeWidth="0.8" />
        <line x1="-18" y1="6" x2="10" y2="6" stroke={C.faint} strokeWidth="0.8" />
      </g>

      {/* Caption */}
      <text x="160" y="290" textAnchor="middle" fontFamily="var(--font-mono)" fontSize="10" fill={C.faint}>
        webhook → analyze → comment → done
      </text>
    </svg>
  );
}

/** Review agent Act 2 — multi-surface hub with spokes to different channels. */
export function ReviewSurfacesFigure() {
  const surfaces = [
    { label: "Slack", angle: -90, color: C.lavender },
    { label: "Telegram", angle: -30, color: C.sky },
    { label: "Desktop", angle: 30, color: C.sage },
    { label: "Terminal", angle: 90, color: C.butter },
    { label: "GitHub", angle: 150, color: C.peach },
    { label: "WhatsApp", angle: 210, color: C.rose },
  ];
  const cx = 160, cy = 150, hubR = 28, spokeR = 95, nodeR = 22;

  return (
    <svg viewBox="0 0 320 320" className="w-full">
      <defs>
        <radialGradient id="rsgrad" cx="50%" cy="42%" r="55%">
          <stop offset="0%" stopColor={C.lavender} stopOpacity="0.7" />
          <stop offset="100%" stopColor={C.sky} stopOpacity="0.3" />
        </radialGradient>
      </defs>
      <circle cx={cx} cy={cy} r="120" fill="url(#rsgrad)" />

      {/* Spokes and surface nodes */}
      {surfaces.map(({ label, angle, color }) => {
        const rad = (angle * Math.PI) / 180;
        const nx = cx + Math.cos(rad) * spokeR;
        const ny = cy + Math.sin(rad) * spokeR;
        const lx = cx + Math.cos(rad) * (hubR + 6);
        const ly = cy + Math.sin(rad) * (hubR + 6);
        return (
          <g key={label}>
            <line x1={lx} y1={ly} x2={nx - Math.cos(rad) * nodeR} y2={ny - Math.sin(rad) * nodeR}
              stroke={C.faint} strokeWidth="1.2" strokeDasharray="3 4" />
            <circle cx={nx} cy={ny} r={nodeR} fill={color} opacity="0.5" stroke={C.ink} strokeWidth="1" />
            <text x={nx} y={ny + 3} textAnchor="middle" fontFamily="var(--font-mono)" fontSize="7.5" fill={C.ink}>
              {label}
            </text>
          </g>
        );
      })}

      {/* Center hub */}
      <circle cx={cx} cy={cy} r={hubR} fill={C.paper} stroke={C.ink} strokeWidth="1.8" />
      <text x={cx} y={cy - 4} textAnchor="middle" fontFamily="var(--font-display)" fontSize="10" fill={C.ink}>MSD</text>
      <text x={cx} y={cy + 8} textAnchor="middle" fontFamily="var(--font-mono)" fontSize="6.5" fill={C.faint}>dispatch</text>

      {/* Caption */}
      <text x="160" y="295" textAnchor="middle" fontFamily="var(--font-mono)" fontSize="10" fill={C.faint}>
        same trigger, six surfaces
      </text>
    </svg>
  );
}

/** Review agent Act 3 — proactive detection with the three primitives wired in. */
export function ReviewProactiveFigure() {
  return (
    <svg viewBox="0 0 320 320" className="w-full">
      <defs>
        <radialGradient id="rpgrad" cx="50%" cy="40%" r="55%">
          <stop offset="0%" stopColor={C.sage} stopOpacity="0.8" />
          <stop offset="100%" stopColor={C.peach} stopOpacity="0.35" />
        </radialGradient>
      </defs>
      <circle cx="160" cy="155" r="115" fill="url(#rpgrad)" />

      {/* Clock (top-left) */}
      <g transform="translate(68, 82)">
        <circle r="24" fill={C.butter} opacity="0.6" />
        <circle r="24" fill="none" stroke={C.ink} strokeWidth="1.2" />
        <circle r="16" fill={C.paper} stroke={C.ink} strokeWidth="0.8" />
        <circle r="1.5" fill={C.terracotta} />
        <line x1="0" y1="0" x2="0" y2="-10" stroke={C.ink} strokeWidth="1.5" strokeLinecap="round" />
        <line x1="0" y1="0" x2="7" y2="-3" stroke={C.terracotta} strokeWidth="1.2" strokeLinecap="round" />
        <text y="38" textAnchor="middle" fontFamily="var(--font-mono)" fontSize="8" fill={C.faint}>clock</text>
      </g>

      {/* Listener — radio (top-right) */}
      <g transform="translate(252, 82)">
        <circle r="24" fill={C.sage} opacity="0.6" />
        <circle r="24" fill="none" stroke={C.ink} strokeWidth="1.2" />
        {/* Radio body */}
        <rect x="-12" y="-8" width="24" height="18" rx="2.5" fill={C.paper} stroke={C.ink} strokeWidth="0.8" />
        {/* Speaker grille */}
        <circle cy="-1" r="5" fill="none" stroke={C.ink} strokeWidth="0.6" />
        <circle cy="-1" r="2" fill={C.terracotta} />
        {/* Dial dots */}
        <circle cx="-6" cy="6" r="1.2" fill={C.ink} />
        <circle cx="0" cy="6" r="1.2" fill={C.ink} />
        <circle cx="6" cy="6" r="1.2" fill={C.ink} />
        {/* Antenna */}
        <line x1="8" y1="-8" x2="14" y2="-18" stroke={C.ink} strokeWidth="0.9" strokeLinecap="round" />
        <text y="38" textAnchor="middle" fontFamily="var(--font-mono)" fontSize="8" fill={C.faint}>listener</text>
      </g>

      {/* Agent (center) */}
      <g transform="translate(160, 165)">
        <rect x="-36" y="-24" width="72" height="48" rx="8" fill={C.paper} stroke={C.ink} strokeWidth="1.8" />
        <text textAnchor="middle" y="-4" fontFamily="var(--font-display)" fontSize="11" fill={C.ink}>MSD</text>
        <text textAnchor="middle" y="10" fontFamily="var(--font-mono)" fontSize="7" fill={C.faint}>detect + act</text>
      </g>

      {/* Arrows: clock → agent, listener → agent */}
      <g stroke={C.inkSoft} strokeWidth="1.4" fill="none" strokeLinecap="round">
        <path d="M85 108 Q 110 130 132 148" />
        <path d="M126 142 L132 148 L124 150" />
        <path d="M235 108 Q 210 130 188 148" />
        <path d="M194 150 L188 148 L192 140" />
      </g>

      {/* Inbox (bottom) */}
      <g transform="translate(160, 240)">
        <circle r="24" fill={C.lavender} opacity="0.6" />
        <circle r="24" fill="none" stroke={C.ink} strokeWidth="1.2" />
        <rect x="-14" y="-10" width="28" height="20" rx="2" fill={C.paper} stroke={C.ink} strokeWidth="0.8" />
        <path d="M-14 -10 L0 2 L14 -10" fill="none" stroke={C.ink} strokeWidth="0.8" />
        <text y="38" textAnchor="middle" fontFamily="var(--font-mono)" fontSize="8" fill={C.faint}>inbox</text>
      </g>

      {/* Arrow: agent → inbox */}
      <g stroke={C.inkSoft} strokeWidth="1.4" fill="none" strokeLinecap="round">
        <path d="M160 192 L160 212" />
        <path d="M155 206 L160 214 L165 206" />
      </g>

      {/* Signal labels */}
      <text x="55" y="148" fontFamily="var(--font-mono)" fontSize="6.5" fill={C.faint}>stale PRs</text>
      <text x="232" y="148" fontFamily="var(--font-mono)" fontSize="6.5" fill={C.faint}>CI failures</text>
      <text x="196" y="232" fontFamily="var(--font-mono)" fontSize="6.5" fill={C.faint}>Slack / TG</text>

      {/* Caption */}
      <text x="160" y="300" textAnchor="middle" fontFamily="var(--font-mono)" fontSize="10" fill={C.faint}>
        listen → detect → deliver
      </text>
    </svg>
  );
}
