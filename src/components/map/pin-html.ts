export type PinKind = "lost" | "found" | "bounty";

const COLORS: Record<PinKind, { fill: string; stroke: string }> = {
  lost: { fill: "#e11d48", stroke: "#9f1239" },
  found: { fill: "#2b4fdb", stroke: "#1f3791" },
  bounty: { fill: "#f59e0b", stroke: "#b45309" },
};

/** Glyphs make pins distinguishable without relying on colour alone. */
const GLYPH: Record<PinKind, string> = {
  lost: `<text x="20" y="25.5" text-anchor="middle" font-family="Plus Jakarta Sans, system-ui, sans-serif" font-size="17" font-weight="800" fill="#e11d48">?</text>`,
  found: `<path d="M13.5 19.5l4.6 4.6 8.6-9.2" fill="none" stroke="#2b4fdb" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/>`,
  bounty: `<text x="20" y="25.5" text-anchor="middle" font-family="Plus Jakarta Sans, system-ui, sans-serif" font-size="16" font-weight="800" fill="#b45309">$</text>`,
};

export function pinHtml(kind: PinKind, selected = false): string {
  const c = COLORS[kind];
  return `
  <div style="position:relative;width:40px;height:52px;transform:${selected ? "scale(1.28)" : "scale(1)"};transform-origin:50% 100%;transition:transform .2s ease;filter:drop-shadow(0 6px 8px rgba(14,26,58,.35))">
    ${selected ? `<span style="position:absolute;left:50%;bottom:-3px;width:26px;height:9px;margin-left:-13px;border-radius:50%;background:${c.fill};opacity:.35;"></span>` : ""}
    <svg viewBox="0 0 40 52" width="40" height="52" style="position:relative">
      <path d="M20 51C8 36 2 28 2 19a18 18 0 1 1 36 0c0 9-6 17-18 32Z" fill="${c.fill}" stroke="${selected ? "#fff" : c.stroke}" stroke-width="${selected ? 2.5 : 1}"/>
      <circle cx="20" cy="19" r="10.5" fill="#fff"/>
      ${GLYPH[kind]}
    </svg>
  </div>`;
}

export function youAreHereHtml(): string {
  return `<div style="position:relative;width:22px;height:22px">
    <span style="position:absolute;inset:0;border-radius:50%;background:#3d63f2;opacity:.25;animation:ping-soft 2s cubic-bezier(0,0,.2,1) infinite"></span>
    <span style="position:absolute;inset:4px;border-radius:50%;background:#2b4fdb;border:3px solid #fff;box-shadow:0 2px 6px rgba(14,26,58,.4)"></span>
  </div>`;
}
