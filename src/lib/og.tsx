import { MARK_PATH } from "@/components/brand/logo";

export const OG_SIZE = { width: 1200, height: 630 };

/** Shared 1200×630 social card. Satori only understands flexbox, so every box is `display: flex`. */
export function OgCard({
  eyebrow,
  title,
  subtitle,
  chip,
  chipTone = "coral",
}: {
  eyebrow: string;
  title: string;
  subtitle?: string;
  chip?: string;
  chipTone?: "coral" | "gold" | "blue" | "green";
}) {
  const chipBg = { coral: "#e11d48", gold: "#fcd34d", blue: "#2b4fdb", green: "#0f7a4b" }[chipTone];
  const chipFg = chipTone === "gold" ? "#0e1a3a" : "#ffffff";
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: 64,
        background: "linear-gradient(135deg, #fff1f3 0%, #ffe3e8 55%, #f1e6ff 100%)",
        color: "#0e1a3a",
        fontFamily: "sans-serif",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <svg width="46" height="60" viewBox="150 120 540 700">
            <path d={MARK_PATH} fill="#e5184a" />
          </svg>
          <div style={{ display: "flex", fontSize: 38, fontWeight: 800, letterSpacing: -1 }}>
            wewillfind<span style={{ color: "#ff3b5c" }}>.it</span>
          </div>
        </div>
        {chip && (
          <div style={{ display: "flex", background: chipBg, color: chipFg, fontSize: 28, fontWeight: 800, padding: "10px 22px", borderRadius: 16 }}>{chip}</div>
        )}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 20, maxWidth: 940 }}>
        <div style={{ display: "flex", fontSize: 26, fontWeight: 800, letterSpacing: 4, textTransform: "uppercase", color: "#be123c" }}>{eyebrow}</div>
        <div style={{ display: "flex", fontSize: title.length > 48 ? 64 : 80, fontWeight: 800, lineHeight: 1.04, letterSpacing: -2 }}>{title}</div>
        {subtitle && <div style={{ display: "flex", fontSize: 34, fontWeight: 600, color: "#4b5877" }}>{subtitle}</div>}
      </div>

      <div style={{ display: "flex", fontSize: 26, fontWeight: 600, color: "#667391" }}>Singapore&apos;s Lost &amp; Found Community</div>
    </div>
  );
}
