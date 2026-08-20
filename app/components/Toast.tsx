// Minimal global toast: `toast()` pushes a message, `<Toasts/>` (mounted once in the app layout)
// renders it with an animated sprite. Survives client-side route changes because the listener
// lives at the layout level. Auto-dismisses after a few seconds; the close button clears it early.
import { useEffect, useRef, useState } from "react";

type ToastMsg = { id: number; text: string };

let push: ((t: string) => void) | null = null;

export function toast(text: string) {
  push?.(text);
}

export function Toasts() {
  const [list, setList] = useState<ToastMsg[]>([]);
  const idRef = useRef(0);

  useEffect(() => {
    push = (text) => {
      const id = ++idRef.current;
      setList((v) => [...v, { id, text }]);
      setTimeout(() => setList((v) => v.filter((t) => t.id !== id)), 6000);
    };
    return () => { push = null; };
  }, []);

  if (list.length === 0) return null;
  return (
    <div style={{
      position: "fixed", left: "50%", transform: "translateX(-50%)", bottom: "1.4rem", zIndex: 120,
      display: "flex", flexDirection: "column", gap: 8, alignItems: "center", width: "min(92vw, 480px)",
      pointerEvents: "none",
    }}>
      <style>{`
        @keyframes vnSprBounce { 0%,100%{transform:translateY(0) rotate(-4deg)} 50%{transform:translateY(-6px) rotate(4deg)} }
        @keyframes vnToastIn { from{opacity:0; transform:translateY(14px) scale(.96)} to{opacity:1; transform:none} }
      `}</style>
      {list.map((t) => (
        <div key={t.id} style={{
          pointerEvents: "auto", animation: "vnToastIn .22s ease-out", background: "#17324f", color: "#fff",
          borderRadius: 10, padding: "0.7rem 1rem", display: "flex", gap: 12, alignItems: "center",
          boxShadow: "0 10px 28px rgba(15,23,42,.35)", fontSize: ".88rem", maxWidth: "100%",
        }}>
          <span style={{ fontSize: "1.6rem", lineHeight: 1, animation: "vnSprBounce 1.1s ease-in-out infinite" }}
            role="img" aria-hidden="true">🎬</span>
          <span>{t.text}</span>
          <button onClick={() => setList((v) => v.filter((x) => x.id !== t.id))} aria-label="Dismiss"
            style={{ marginLeft: "auto", background: "transparent", border: "none", color: "#c7d6e8",
              cursor: "pointer", fontSize: "1rem", lineHeight: 1, padding: "2px 4px" }}>✕</button>
        </div>
      ))}
    </div>
  );
}