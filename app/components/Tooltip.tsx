// Inline question-mark tooltip for "learn more" hints. Works on hover and click (touch).
// Place one next to a label or heading to explain a control without permanent text.
import { useEffect, useRef, useState } from "react";

const WRAP: React.CSSProperties = {
  display: "inline-flex", alignItems: "center", justifyContent: "center",
  width: 15, height: 15, borderRadius: "50%", border: "1px solid #b9c7dc",
  color: "#5b6f8c", fontSize: 10, fontWeight: 700, cursor: "help", lineHeight: 1,
  flexShrink: 0, userSelect: "none", background: "#fff",
};

export function Tip({ text, children, title }: {
  text?: React.ReactNode; children?: React.ReactNode; title?: string;
}) {
  const content = text ?? title ?? "Help";
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);
  const closeRef = useRef<number | null>(null);

  useEffect(() => () => { if (closeRef.current) window.clearTimeout(closeRef.current); }, []);

  const closeSoon = () => { closeRef.current = window.setTimeout(() => setOpen(false), 250); };
  const keep = () => { if (closeRef.current) window.clearTimeout(closeRef.current); };

  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 6, verticalAlign: "middle", position: "relative" }} ref={ref}>
      {children}
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
          style={{
            position: "absolute", zIndex: 90, maxWidth: 300, background: "#1f2937", color: "#f3f4f6",
            fontSize: ".8rem", lineHeight: 1.45, padding: "0.5rem 0.7rem", borderRadius: 7,
            boxShadow: "0 6px 20px rgba(0,0,0,.25)", pointerEvents: "auto", transform: "translateY(-50%)",
          }}
        >
          <span style={{ position: "absolute", width: 6, height: 6, background: "#1f2937", transform: "rotate(45deg)", left: -3, top: "50%", marginTop: -3 }} />
          {content}
        </span>
      )}
    </span>
  );
}