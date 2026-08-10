import type { ReactNode, CSSProperties } from "react";

// Shared design tokens for the marketing/sales pages (home, pricing, demo, solutions).
// Kept in one place so every public page shares the same look regardless of which page is A/B'd.

export const T = {
  ivy: "#4f46e5",
  ivyDark: "#3730a3",
  sun: "#f59e0b",
  jet: "#111827",
  body: "#4b5563",
  mist: "#f4f6fb",
  line: "#e5e7eb",
  ok: "#059669",
  okBg: "#d1fae5",
  warn: "#d97706",
  warnBg: "#fef3c7",
  danger: "#be185d",
  dangerBg: "#fce7f3",
};

export const SANS = `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;

export const floatKey = `
@keyframes va-float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
@keyframes va-progress { 0%{width:0} 80%{width:82%} 100%{width:100%} }
@media (prefers-reduced-motion: reduce){ .va-anim{animation:none !important} }
`;
export const floatAnim: CSSProperties = { animation: "va-float 5s ease-in-out infinite" };

export const h2Style: CSSProperties = {
  fontFamily: SANS, fontWeight: 800, fontSize: "2rem", letterSpacing: "-.02em",
  color: T.jet, lineHeight: 1.2, margin: 0, textAlign: "center",
};
export const subStyle: CSSProperties = {
  fontFamily: SANS, color: T.body, fontSize: "1.05rem", lineHeight: 1.6,
  maxWidth: 640, margin: "0.8rem auto 0", textAlign: "center",
};
export const eyebrowStyle: CSSProperties = {
  fontFamily: SANS, textAlign: "center", color: T.ivy, fontWeight: 700,
  fontSize: ".8rem", textTransform: "uppercase", letterSpacing: ".14em", marginBottom: ".6rem",
};

// Small stroke-style SVG icon set, `currentColor`-aware.
export const Icon = ({ d, size = 20, style }: { d: string; size?: number; style?: CSSProperties }) => (
  <span style={{ display: "inline-flex", ...style }}>
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d={d} />
    </svg>
  </span>
);

export const ICON = {
  script: "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6M8 13h8M8 17h5",
  board: "M2 3h7v7H2zM15 3h7v7h-7zM2 14h7v7H2zM15 14h7v7h-7z",
  film: "M3 5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2zM6 8l4 2-4 2zM14 8l4 2-4 2zM6 15l4 2-4 2zM14 15l4 2-4 2z",
  mic: "M12 3a3 3 0 0 0-3 3v5a3 3 0 0 0 6 0V6a3 3 0 0 0-3-3zM19 11a7 7 0 0 1-14 0M12 18v3M8 21h8",
  star: "M12 2l2.9 6.3 6.9.7-5.2 4.6 1.5 6.8L12 17.3 5.9 20.4l1.5-6.8L2.2 9l6.9-.7z",
  face: "M14 2H6a2 2 0 0 0-2 2v16c0 1.1.9 2 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6M9 15c.8.7 1.9.9 3 .9s2.2-.2 3-.9M9 12.2h.01M15 12.2h.01",
  music: "M9 18V5l12-2v13M9 18a3 3 0 1 1-6 0 3 3 0 0 1 6 0zM21 16a3 3 0 1 1-6 0 3 3 0 0 1 6 0z",
  check: "M20 6L9 17l-5-5",
  arrow: "M5 12h14M13 6l6 6-6 6",
  lock: "M5 11h14a1 1 0 0 1 1 1v7a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-7a1 1 0 0 1 1-1zM8 11V7a4 4 0 1 1 8 0v4",
  book: "M4 5a2 2 0 0 1 2-2h11a3 3 0 0 1 3 3 3 3 0 0 0-3 3H6a2 2 0 0 0 0 4h11a3 3 0 0 1 3 3v1a3 3 0 0 1-3 3H6a2 2 0 0 1-2-2z",
  grad: "M22 9l-10-5L2 9l10 5 10-5zM6 11v5c0 1.7 2.7 3 6 3s6-1.3 6-3v-5",
  rocket: "M8 20l-4 2 2-4M17.8 6.2a4 4 0 0 1 0 5.6M14 14l3-3M3 21c3-1 5-3 6-6 1.6-4.8 0-10-6-7 0 5 2 9 6 11z",
  megaphone: "M3 11v2h4l10 5V6L7 11H3zM16 8v8a2 2 0 0 1-3 2M19 7v10",
  heart: "M12 21C6 16 3 12.5 3 9a5 5 0 0 1 9-3 5 5 0 0 1 9 3c0 3.5-3 7-9 12z",
  play: "M7 4l13 8-13 8z",
  zap: "M13 2L3 14h7l-1 8 10-12h-7z",
};

// Primary CTA + secondary CTA links, shared style.
export const ctaPrimary: CSSProperties = {
  background: T.ivy, color: "#fff", padding: ".85rem 1.6rem", borderRadius: 12, textDecoration: "none",
  fontWeight: 800, fontSize: "1rem", boxShadow: "0 10px 24px rgba(79,70,229,.35)", display: "inline-flex", alignItems: "center", gap: 9,
};
export const ctaGhost: CSSProperties = {
  background: "#fff", color: T.jet, padding: ".85rem 1.6rem", borderRadius: 12, textDecoration: "none",
  fontWeight: 700, fontSize: "1rem", border: "1.5px solid #d1d5db",
};
export const chip: CSSProperties = {
  display: "inline-block", fontSize: ".78rem", fontWeight: 700, color: T.ivy,
  border: `1px solid ${T.ivy}`, borderRadius: 999, padding: "2px 11px", marginRight: 6, marginBottom: 6,
};

export function SectionEyebrow({ children }: { children: ReactNode }) {
  return <p style={eyebrowStyle}>{children}</p>;
}

export function SectionTitle({ children }: { children: ReactNode }) {
  return <h2 style={h2Style}>{children}</h2>;
}