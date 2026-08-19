// GuidedTour — step-by-step coach-mark walkthrough for first-time users.
// Each step can target an element by id (scrolled into view + highlighted with a ring) or fall
// back to a centered card when no target exists / isn't found. Dismissing with Esc or "Skip"
// abandons the tour; the caller decides whether that counts as onboarded.
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";

export interface TourStep {
  title: string;
  body: React.ReactNode;
  target?: string;
  placement?: "above" | "below" | "auto";
}

interface Rect { top: number; left: number; width: number; height: number; bottom: number; }
const CARD_W = 320;

function cardPos(rect: Rect | null, placement: TourStep["placement"], cardH: number) {
  if (!rect) return null;
  const pad = 14;
  const vw = window.innerWidth, vh = window.innerHeight;
  const cx = Math.min(Math.max(rect.left, pad), vw - CARD_W - pad);
  let top: number;
  if (placement === "above" || (placement !== "below" && rect.top - cardH - 12 < pad && rect.bottom + cardH + 12 > vh - pad)) {
    top = rect.top - cardH - 12;
  } else {
    top = rect.bottom + 12;
  }
  if (top < pad) top = pad;
  if (top + cardH > vh - pad) top = Math.max(pad, vh - cardH - pad);
  return { top, left: cx };
}

export function GuidedTour({ steps, open, onClose, onFinish }: {
  steps: TourStep[]; open: boolean; onClose: () => void; onFinish?: () => void;
}) {
  const [idx, setIdx] = useState(0);
  const [rect, setRect] = useState<Rect | null>(null);
  const [cardH, setCardH] = useState(120);
  const [hideRing, setHideRing] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) { setIdx(0); setRect(null); }
  }, [open]);

  const step = steps[Math.min(idx, Math.max(0, steps.length - 1))];
  const last = idx === steps.length - 1;

  // Highlight the target element (scroll into view + read its box).
  useLayoutEffect(() => {
    if (!open || !step?.target) { setRect(null); return; }
    setHideRing(false);
    const el = document.getElementById(step.target);
    if (!el) { setRect(null); return; }
    el.scrollIntoView({ block: "center", behavior: "smooth" });
    const measure = () => {
      const r = el.getBoundingClientRect();
      setRect({ top: r.top, left: r.left, width: r.width, height: r.height, bottom: r.bottom });
    };
    measure();
    const t = window.setTimeout(measure, 350); // after the smooth scroll settles
    return () => window.clearTimeout(t);
  }, [open, idx, step?.target]);

  // Measure the card so we can position it against the target without overlap.
  useLayoutEffect(() => {
    if (open) {
      const n = cardRef.current;
      if (n) setCardH(n.offsetHeight || 120);
      setHideRing(false);
    }
  }, [open, idx]);

  // Close the tour without "finishing" — callers decide onboarding semantics.
  const close = useCallback(() => { setHideRing(true); onClose(); }, [onClose]);
  const finish = useCallback(() => { setHideRing(true); onFinish?.(); onClose(); }, [onClose, onFinish]);
  const next = useCallback(() => { if (last) finish(); else setIdx((i) => i + 1); }, [last, finish]);
  const prev = useCallback(() => setIdx((i) => Math.max(0, i - 1)), []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      else if (e.key === "ArrowRight") next();
      else if (e.key === "ArrowLeft") prev();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, next, prev, close]);

  if (!open || steps.length === 0) return null;

  const pos = cardPos(rect, step.placement, cardH);
  const centered = !pos;
  const cardStyle: React.CSSProperties = centered
    ? { position: "fixed", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: CARD_W, zIndex: 100 }
    : { position: "fixed", top: pos.top, left: pos.left, width: CARD_W, zIndex: 100 };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 95, background: "rgba(15,23,42,.45)", animation: "tourFade .18s ease-out" }}>
      <style>{`@keyframes tourFade{from{opacity:0}to{opacity:1}}`}</style>
      {/* Highlight ring around the target */}
      {rect && !hideRing && (
        <div style={{
          position: "fixed", zIndex: 96, top: rect.top - 4, left: rect.left - 4,
          width: rect.width + 8, height: rect.height + 8, borderRadius: 8,
          boxShadow: "0 0 0 3px #1a73e8, 0 0 0 6px rgba(26,115,232,.25)",
          transition: "all .2s ease", pointerEvents: "none",
        }} />
      )}
      {/* Card */}
      <div ref={cardRef}
        role="dialog" aria-modal="true" aria-label={step.title}
        style={{ ...cardStyle, background: "#fff", borderRadius: 12, padding: "1.1rem 1.2rem", boxShadow: "0 16px 48px rgba(0,0,0,.35)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
          <span style={{ fontSize: ".72rem", fontWeight: 700, letterSpacing: ".04em", textTransform: "uppercase", color: "#1a73e8" }}>
            Step {idx + 1} of {steps.length}
          </span>
          <button onClick={close} aria-label="Close tutorial"
            style={{ border: "none", background: "none", fontSize: "1.25rem", lineHeight: 1, cursor: "pointer", color: "#9aa4b2", padding: "0 2px" }}>×</button>
        </div>
        <h3 style={{ margin: "0 0 .35rem", fontSize: "1.02rem", color: "#111827" }}>{step.title}</h3>
        <div style={{ fontSize: ".88rem", lineHeight: 1.5, color: "#374151" }}>{step.body}</div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "1rem" }}>
          <button onClick={close} style={{ border: "none", background: "none", color: "#6b7280", cursor: "pointer", fontSize: ".82rem", padding: 0 }}>Skip</button>
          <div style={{ display: "flex", gap: 8 }}>
            {idx > 0 && (
              <button onClick={prev} style={{ background: "#fff", color: "#374151", border: "1px solid #d1d5db", borderRadius: 7, padding: "0.45rem 0.9rem", cursor: "pointer", fontWeight: 600, fontSize: ".85rem" }}>Back</button>
            )}
            <button onClick={next} style={{ background: "#1a73e8", color: "#fff", border: "none", borderRadius: 7, padding: "0.45rem 1rem", cursor: "pointer", fontWeight: 600, fontSize: ".85rem" }}>
              {last ? "Done" : "Next"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}