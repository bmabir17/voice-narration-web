// Inline question-mark tooltip for "learn more" hints. Works on hover and click (touch).
// Usage: <Tip title="Short aria-label">Hidden explanation shown on hover</Tip>
// Renders ONLY a "?" badge; the children are the tooltip text, never visible inline.
import { useEffect, useRef, useState } from "react";

const WRAP: React.CSSProperties = {
  display: "inline-flex", alignItems: "center", justifyContent: "center",
  width: 15, height: 15, borderRadius: "50%", border: "1px solid #b9c7dc",
  color: "#5b6f8c", fontSize: 10, fontWeight: 700, cursor: "help", lineHeight: 1,
  flexShrink: 0, userSelect: "none", background: "#fff",
};

const TOOLTIP: React.CSSProperties = {
  position: "absolute", zIndex: 90, width: 600, maxWidth: "calc(100vw - 32px)",
  background: "#1f2937", color: "#f3f4f6",
  fontSize: ".8rem", lineHeight: 1.45, padding: "0.5rem 0.7rem", borderRadius: 7,
  boxShadow: "0 6px 20px rgba(0,0,0,.25)", pointerEvents: "auto",
  top: "50%", left: "calc(100% + 8px)", transform: "translateY(-50%)",
};

export function Tip({ children, title }: {
  children: React.ReactNode; title?: string;
}) {
  const [open, setOpen] = useState(false);
  const closeRef = useRef<number | null>(null);

  useEffect(() => () => { if (closeRef.current) window.clearTimeout(closeRef.current); }, []);

  const closeSoon = () => { closeRef.current = window.setTimeout(() => setOpen(false), 250); };
  const keep = () => { if (closeRef.current) window.clearTimeout(closeRef.current); };

  return (
    <span style={{ position: "relative", display: "inline-flex", alignItems: "center", flexShrink: 0 }}>
      <span
        role="button" tabIndex={0} aria-label={typeof title === "string" ? title : "Help"}
        aria-expanded={open}
        style={WRAP}
        onMouseEnter={() => { keep(); setOpen(true); }}
        onMouseLeave={closeSoon}
        onClick={(e) => { e.stopPropagation(); setOpen((v) => !v); }}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setOpen((v) => !v); } }}
      >?</span>
      {open && (
        <span
          role="tooltip"
          onMouseEnter={keep}
          onMouseLeave={closeSoon}
          style={TOOLTIP}
        >
          <span style={{ position: "absolute", width: 6, height: 6, background: "#1f2937", transform: "rotate(45deg)", left: -3, top: "50%", marginTop: -3 }} />
          {children}
        </span>
      )}
    </span>
  );
}