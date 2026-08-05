import { useEffect, useState } from "react";
import { Link } from "react-router";
import { api } from "~/lib/api";
import { currentSession } from "~/lib/supabase";

const ACCENT = "#1a73e8";

export function meta() {
  return [
    { title: "Pricing — Voice Narration" },
    { name: "description", content: "Flat, volume-friendly plans for long-form AI narration AND manuscript-to-video. Free tier, Creator, Pro, and Volume/API." },
  ];
}

interface Tier {
  tier: string; name: string; price: string; period: string; blurb: string;
  narration: string; videos: string; voices: string;
  features: string[]; purchasable: boolean; highlight?: boolean;
}

// Limits mirror public.plans (monthly_minutes / monthly_videos / max_custom_voices).
const TIERS: Tier[] = [
  {
    tier: "free", name: "Free", price: "$0", period: "",
    blurb: "Try it out — watermarked, personal use.",
    narration: "~15 min / mo", videos: "1 video / mo", voices: "Preset voices",
    features: ["Watermarked output", "Non-commercial"],
    purchasable: false,
  },
  {
    tier: "creator", name: "Creator", price: "$22", period: "/mo",
    blurb: "For solo creators shipping regularly.",
    narration: "~3 hrs / mo", videos: "15 videos / mo", voices: "1 custom voice",
    features: ["Commercial rights", "No watermark", "Plan + candidate review"],
    purchasable: true,
  },
  {
    tier: "pro", name: "Pro", price: "$50", period: "/mo",
    blurb: "For teams and programmatic use.",
    narration: "~15 hrs / mo", videos: "60 videos / mo", voices: "Up to 5 voices",
    features: ["Everything in Creator", "API access", "Cast saved faces"],
    purchasable: true, highlight: true,
  },
  {
    tier: "volume", name: "Volume / API", price: "$100", period: "/mo",
    blurb: "High volume with priority rendering.",
    narration: "~100 hrs / mo", videos: "300 videos / mo", voices: "Up to 20 voices",
    features: ["Everything in Pro", "Priority deadline lane"],
    purchasable: true,
  },
];

// Capabilities every paid plan gets (free too, within its limits) — the video_agent surface.
const EVERY_PLAN: { title: string; body: string }[] = [
  { title: "Manuscript → video", body: "A script becomes a narrated, multi-shot video — each shot rendered best-of-N and the strongest take kept automatically." },
  { title: "Review the plan first", body: "Approve or edit the shot plan before any GPU time is spent — or hit Regenerate for a fresh take at a higher creativity." },
  { title: "Candidate review", body: "See every take per shot, re-pick the winner, regenerate more, and re-assemble the final cut — no re-narration." },
  { title: "Cast real faces", body: "Save a person's face once and cast them into shots; a face-swap places them in frame." },
  { title: "Narrate in your voice", body: "Clone a narration voice from a short sample, in English, Hindi, or Bangla." },
  { title: "Music + subtitles", body: "An automatic music bed sized to the video and burned-in subtitles, on every render." },
];

export default function Pricing() {
  const [authed, setAuthed] = useState<boolean | null>(null); // null = unknown (SSR/first paint)
  const [currentTier, setCurrentTier] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    currentSession().then((s) => {
      setAuthed(!!s);
      if (s) api.usage().then((u) => setCurrentTier(u.tier)).catch(() => {});
    });
  }, []);

  async function subscribe(tier: string) {
    setErr(null); setBusy(tier);
    try {
      const { url } = await api.checkout(tier);
      window.location.href = url; // → Paddle hosted checkout
    } catch (e: any) {
      setErr(e.message === "billing not configured"
        ? "Checkout isn't wired up yet — please try again shortly."
        : e.message);
      setBusy(null);
    }
  }

  function cta(t: Tier) {
    if (!t.purchasable) return <span style={{ color: "#888", fontSize: ".9rem" }}>Included free</span>;
    if (authed === false) return <Link to="/login" style={{ color: ACCENT }}>Sign in to subscribe</Link>;
    if (currentTier === t.tier) return <span style={{ color: "#137333", fontWeight: 600 }}>Current plan</span>;
    return (
      <button onClick={() => subscribe(t.tier)} disabled={busy === t.tier}
        style={{ padding: "0.55rem 1rem", cursor: "pointer", width: "100%", fontWeight: 600, borderRadius: 7,
          border: t.highlight ? "none" : `1px solid ${ACCENT}`,
          background: t.highlight ? ACCENT : "#fff", color: t.highlight ? "#fff" : ACCENT }}>
        {busy === t.tier ? "Redirecting…" : "Subscribe"}
      </button>
    );
  }

  return (
    <main style={{ maxWidth: 980, margin: "0 auto", padding: "3rem 1.25rem" }}>
      <h1 style={{ marginBottom: 4 }}>Pricing</h1>
      <p style={{ color: "#555", marginTop: 0, fontSize: "1.05rem" }}>
        Long-form AI narration <b>and</b> manuscript-to-video. One flat plan covers both — no per-minute metering.
      </p>
      {err && <p style={{ color: "#c5221f" }}>{err}</p>}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(210px,1fr))", gap: "1rem", marginTop: "1.5rem" }}>
        {TIERS.map((t) => (
          <div key={t.tier} style={{
            border: `${t.highlight ? 2 : 1}px solid ${t.highlight ? ACCENT : "#e2e2e2"}`, borderRadius: 12,
            padding: "1.3rem 1.2rem", display: "flex", flexDirection: "column", gap: "0.7rem",
            position: "relative", background: "#fff",
          }}>
            {t.highlight && (
              <span style={{ position: "absolute", top: -11, right: 14, background: ACCENT, color: "#fff",
                fontSize: ".68rem", fontWeight: 700, letterSpacing: ".04em", padding: "2px 8px", borderRadius: 999 }}>
                POPULAR
              </span>
            )}
            <h3 style={{ margin: 0 }}>{t.name}</h3>
            <p style={{ margin: 0 }}>
              <span style={{ fontSize: "1.7rem", fontWeight: 700 }}>{t.price}</span>
              <span style={{ color: "#888", fontSize: ".9rem" }}>{t.period}</span>
            </p>
            <p style={{ color: "#666", fontSize: ".88rem", margin: 0, minHeight: 38 }}>{t.blurb}</p>

            {/* Hard limits */}
            <div style={{ display: "grid", gap: 5, borderTop: "1px solid #f0f0f0", borderBottom: "1px solid #f0f0f0", padding: "0.7rem 0", fontSize: ".86rem" }}>
              <Spec label="Narration" value={t.narration} />
              <Spec label="Videos" value={t.videos} strong />
              <Spec label="Voices" value={t.voices} />
            </div>

            {/* Tier differentiators */}
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: 5, fontSize: ".85rem", flex: 1 }}>
              {t.features.map((f) => (
                <li key={f} style={{ display: "flex", gap: 7, color: "#333" }}>
                  <span style={{ color: "#137333", fontWeight: 700 }}>✓</span>{f}
                </li>
              ))}
            </ul>
            <div>{cta(t)}</div>
          </div>
        ))}
      </div>

      <p style={{ color: "#888", fontSize: ".82rem", marginTop: 12 }}>
        Videos are metered per calendar month and renders on our home GPU; narration hours are approximate at typical speech rates.
      </p>

      {/* What every plan includes — the video surface */}
      <section style={{ marginTop: "2.6rem" }}>
        <h2 style={{ marginBottom: 4 }}>In every video</h2>
        <p style={{ color: "#666", marginTop: 0 }}>The full manuscript-to-video pipeline is available on all plans, within each plan's monthly video count.</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))", gap: "1rem", marginTop: "1rem" }}>
          {EVERY_PLAN.map((f) => (
            <div key={f.title} style={{ border: "1px solid #ececec", borderRadius: 10, padding: "1rem 1.1rem" }}>
              <b style={{ fontSize: ".95rem" }}>{f.title}</b>
              <p style={{ color: "#666", fontSize: ".88rem", margin: ".35rem 0 0", lineHeight: 1.5 }}>{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      {authed && (
        <p style={{ marginTop: "1.8rem" }}>
          <Link to="/app/billing" style={{ color: ACCENT }}>Manage your subscription →</Link>
        </p>
      )}
    </main>
  );
}

function Spec({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
      <span style={{ color: "#888" }}>{label}</span>
      <span style={{ fontWeight: strong ? 700 : 500, color: strong ? ACCENT : "#333", textAlign: "right" }}>{value}</span>
    </div>
  );
}
