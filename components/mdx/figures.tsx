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
      {["clock", "watcher", "inbox", "state", "auth"].map((t, i) => (
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
    { label: "watcher", has: [false, false] },
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
    { x: 160, label: "watcher", fill: C.sage },
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
    { x: 280, y: 150, label: "watcher", fill: C.sage },
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
