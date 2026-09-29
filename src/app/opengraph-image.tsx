import { ImageResponse } from "next/og";

export const alt = "PULSE — The Verification Layer for Tokenized Markets";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** Social preview: cream paper, ink question, one green word. */
export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", background: "#f4efe2", color: "#1f2621", padding: 72, fontFamily: "serif" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16, fontSize: 30 }}>
          <div style={{ width: 40, height: 40, borderRadius: 20, background: "#1f2621", display: "flex", alignItems: "center", justifyContent: "flex-end", paddingRight: 6 }}>
            <div style={{ width: 10, height: 10, borderRadius: 5, background: "#3f8a61" }} />
          </div>
          Pulse
        </div>
        <div style={{ display: "flex", flexDirection: "column", fontSize: 104, lineHeight: 0.95, letterSpacing: -3 }}>
          <span>What exactly</span>
          <span style={{ display: "flex", gap: 24 }}>
            are you <span style={{ color: "#2e6b4b", fontStyle: "italic" }}>buying?</span>
          </span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 22, fontFamily: "monospace", letterSpacing: 2, color: "#5b6158" }}>
          <span>EVERY ASSET EXPLAINED · EVERY NUMBER COMES WITH A RECEIPT</span>
          <span style={{ color: "#2e6b4b", display: "flex", alignItems: "center", gap: 10 }}><span style={{ width: 12, height: 12, borderRadius: 6, background: "#2e6b4b" }} />CMC SOURCED</span>
        </div>
      </div>
    ),
    size
  );
}
