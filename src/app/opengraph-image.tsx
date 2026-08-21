import { ImageResponse } from "next/og";

// Default social share image for every page (Next auto-wires it for OG + Twitter).
export const runtime = "edge";
export const alt = "LogLead — The AI Growth Engine for B2B LinkedIn";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "80px",
          background: "linear-gradient(135deg, #1D4ED8 0%, #2475F5 55%, #3B82F6 100%)",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "56px",
              height: "56px",
              borderRadius: "14px",
              background: "#FFFFFF",
              color: "#1D4ED8",
              fontSize: "34px",
              fontWeight: 800,
            }}
          >
            L
          </div>
          <div style={{ fontSize: "34px", fontWeight: 700, color: "#FFFFFF" }}>LogLead</div>
        </div>

        <div
          style={{
            fontSize: "74px",
            fontWeight: 800,
            color: "#FFFFFF",
            lineHeight: 1.05,
            letterSpacing: "-2px",
            marginTop: "36px",
            maxWidth: "980px",
          }}
        >
          The AI Growth Engine for B2B LinkedIn
        </div>

        <div style={{ fontSize: "30px", color: "#DCE8FF", marginTop: "28px" }}>
          Find prospects · Generate content · Track AI visibility
        </div>
      </div>
    ),
    { ...size },
  );
}
