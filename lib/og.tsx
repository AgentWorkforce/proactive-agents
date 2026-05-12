import { ImageResponse } from "next/og";

const C = {
  paper: "#fbf6ec",
  ink: "#2a2521",
  inkSoft: "#4d4640",
  faint: "#8a7f74",
  rule: "#e8ddc8",
  terracotta: "#d98a6b",
};

const ACCENT: Record<string, string> = {
  peach: "#ffd6bf",
  butter: "#fbe7a6",
  sage: "#c8dcbf",
  lavender: "#dccaee",
  rose: "#f2c4cd",
  sky: "#bedcef",
};

export const OG_SIZE = { width: 1200, height: 630 };
export const OG_CONTENT_TYPE = "image/png";

export function createOgImage(
  title: string,
  summary: string,
  accent: string = "peach",
) {
  const accentColor = ACCENT[accent] || ACCENT.peach;
  const truncatedSummary =
    summary.length > 160 ? summary.slice(0, 157) + "…" : summary;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          backgroundColor: C.paper,
          position: "relative",
        }}
      >
        {/* Left accent bar */}
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            bottom: 0,
            width: 8,
            backgroundColor: accentColor,
          }}
        />
        {/* Decorative accent circle */}
        <div
          style={{
            position: "absolute",
            right: 60,
            top: 60,
            width: 220,
            height: 220,
            borderRadius: 110,
            backgroundColor: accentColor,
            opacity: 0.25,
          }}
        />
        <div
          style={{
            position: "absolute",
            right: 120,
            top: 180,
            width: 100,
            height: 100,
            borderRadius: 50,
            backgroundColor: accentColor,
            opacity: 0.15,
          }}
        />
        {/* Content */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            padding: "64px 80px 48px 56px",
            width: "100%",
            height: "100%",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div
              style={{
                fontSize: 52,
                fontWeight: 700,
                color: C.ink,
                lineHeight: 1.15,
                maxWidth: 880,
                letterSpacing: "-0.02em",
              }}
            >
              {title}
            </div>
            <div
              style={{
                fontSize: 22,
                color: C.inkSoft,
                marginTop: 28,
                lineHeight: 1.5,
                maxWidth: 760,
              }}
            >
              {truncatedSummary}
            </div>
          </div>
          {/* Bottom branding */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              borderTop: `1.5px solid ${C.rule}`,
              paddingTop: 20,
            }}
          >
            <div style={{ display: "flex", alignItems: "center" }}>
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 14,
                  backgroundColor: C.terracotta,
                  marginRight: 14,
                }}
              />
              <div
                style={{
                  fontSize: 17,
                  fontWeight: 600,
                  color: C.ink,
                  letterSpacing: "0.08em",
                }}
              >
                PROACTIVE AGENTS
              </div>
            </div>
            <div style={{ fontSize: 16, color: C.faint }}>
              proactiveagents.dev
            </div>
          </div>
        </div>
      </div>
    ),
    OG_SIZE,
  );
}
