import { useEffect, useState } from "react";
import { Link } from "react-router";
import { api } from "~/lib/api";
import { currentSession } from "~/lib/supabase";
import { T, SANS, eyebrowStyle, h2Style, subStyle, ctaPrimary, ctaGhost, Icon, ICON, SectionEyebrow, SectionTitle } from "~/lib/marketing";

export function meta() {
  return [
    { title: "Pricing — Voice Narration" },
    { name: "description", content: "One flat plan covers narrated videos AND audiobooks — no per-minute metering, no surprise fees. Start free, upgrade when your stories take off." },
  ];
}

interface Tier {
  tier: string; name: string; price: string; period: string; blurb: string;
  oneLiner: string; narration: string; videos: string; voices: string;
  features: string[]; purchasable: boolean; highlight?: boolean;
}

// Limits mirror public.plans (monthly_minutes / monthly_videos / max_custom_voices).
const TIERS: Tier[] = [
  {
    tier: "free", name: "Free", price: "$0", period: "",
    blurb: "Try it out — watermarked, personal use.",
    oneLiner: "Perfect for testing your first story.",
    narration: "~15 min / mo", videos: "1 video / mo", voices: "Preset voices",
    features: ["Watermarked output", "Non-commercial"],
    purchasable: false,
  },
  {
    tier: "creator", name: "Creator", price: "$22", period: "/mo",
    blurb: "For solo creators shipping regularly.",
    oneLiner: "The sweet spot for youtubers, authors & teachers.",
    narration: "~3 hrs / mo", videos: "15 videos / mo", voices: "1 custom voice",
    features: ["Commercial rights", "No watermark", "Plan + candidate review"],
    purchasable: true,
  },
  {
    tier: "pro", name: "Pro", price: "$50", period: "/mo",
    blurb: "For teams and programmatic use.",
    oneLiner: "Everything creators need at higher volume.",
    narration: "~15 hrs / mo", videos: "60 videos / mo", voices: "Up to 5 voices",
    features: ["Everything in Creator", "API access", "Cast saved faces"],
    purchasable: true, highlight: true,
  },
  {
    tier: "volume", name: "Volume / API", price: "$100", period: "/mo",
    blurb: "High volume with priority rendering.",
    oneLiner: "For studios, brands & platforms.",
    narration: "~100 hrs / mo", videos: "300 videos / mo", voices: "Up to 20 voices",
    features: ["Everything in Pro", "Priority deadline lane"],
    purchasable: true,
  },
];

// Capabilities every paid plan gets (free too, within its limits) — written for humans.
const EVERY_PLAN: { icon: string; title: string; body: string }[] = [
  { icon: ICON.board, title: "A director plans it", body: "Your story is broken into a shot-by-shot plan you read and approve before anything renders." },
  { icon: ICON.film, title: "Best take, kept", body: "Each scene is rendered a few ways and the strongest take is kept — you can re-pick later." },
  { icon: ICON.mic, title: "Your voice, your language", body: "Narrate in a cloned voice or a library voice, in English, Hindi or Bangla — timed exactly." },
  { icon: ICON.face, title: "Real faces in the story", body: "Upload one photo and that face stays consistent through every scene." },
  { icon: ICON.music, title: "Music + subtitles", body: "An original score sized to your video, plus burned-in subtitles, on every render." },
  { icon: ICON.check, title: "Quality-checked", body: "Every movie is auto-verified — picture, audio, and narration-vs-script — before delivery." },
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
    if (authed === false) return <Link to="/login" style={{ color: T.ivy, fontWeight: 700 }}>Sign in to subscribe</Link>;
    if (currentTier === t.tier) return <span style={{ color: T.ok, fontWeight: 700 }}>Current plan</span>;
    return (
      <button onClick={() => subscribe(t.tier)} disabled={busy === t.tier}
        style={{ padding: ".7rem 1rem", cursor: "pointer", width: "100%", fontWeight: 800, borderRadius: 10, fontSize: ".95rem",
          border: t.highlight ? "none" : `1.5px solid ${T.ivy}`,
          background: t.highlight ? T.ivy : "#fff", color: t.highlight ? "#fff" : T.ivy,
          boxShadow: t.highlight ? "0 10px 24px rgba(79,70,229,.3)" : "none" }}>
        {busy === t.tier ? "Redirecting…" : "Subscribe"}
      </button>
    );
  }

  return (
    <main style={{ fontFamily: SANS, background: "#fff", color: T.jet }}>
      {/* header */}
      <section style={{ padding: "3.5rem 1.25rem 1rem" }}>
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          <SectionEyebrow>Simple, flat pricing</SectionEyebrow>
          <SectionTitle>One plan. Narrated videos and audiobooks.</SectionTitle>
          <p style={subStyle}>
            No per-minute metering, no tier maze. Pick the bucket that fits your output — every
            production trick (your voice, real faces, music, subtitles) is included in each one.
          </p>
          {err && <p style={{ color: "#b91c1c", textAlign: "center", fontWeight: 700, marginTop: "1rem" }}>{err}</p>}
        </div>
      </section>

      {/* tier cards */}
      <section style={{ padding: "2rem 1.25rem 2.5rem" }}>
        <div style={{ maxWidth: 1040, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(230px,1fr))", gap: "1.1rem" }}>
          {TIERS.map((t) => (
            <div key={t.tier} style={{
              border: `${t.highlight ? 2 : 1}px solid ${t.highlight ? T.ivy : T.line}`, borderRadius: 18,
              padding: "1.5rem 1.3rem", display: "flex", flexDirection: "column", gap: ".8rem",
              position: "relative", background: "#fff",
              boxShadow: t.highlight ? "0 18px 44px rgba(79,70,229,.14)" : "0 8px 24px rgba(17,24,39,.05)",
            }}>
              {t.highlight && (
                <span style={{ position: "absolute", top: -12, right: 16, background: T.ivy, color: "#fff",
                  fontSize: ".68rem", fontWeight: 800, letterSpacing: ".05em", padding: "3px 12px", borderRadius: 999 }}>
                  MOST POPULAR
                </span>
              )}
              <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 800 }}>{t.name}</h3>
              <p style={{ margin: 0 }}>
                <span style={{ fontSize: "1.9rem", fontWeight: 800 }}>{t.price}</span>
                <span style={{ color: "#888", fontSize: ".92rem" }}>{t.period}</span>
              </p>
              <p style={{ color: T.body, fontSize: ".88rem", margin: 0 }}>{t.oneLiner}</p>

              <div style={{ display: "grid", gap: 6, borderTop: "1px solid #f0f0f0", borderBottom: "1px solid #f0f0f0", padding: ".8rem 0", fontSize: ".87rem" }}>
                <Spec icon={ICON.mic} label="Narration" value={t.narration} />
                <Spec icon={ICON.film} label="Videos" value={t.videos} strong />
                <Spec icon={ICON.face} label="Voices" value={t.voices} />
              </div>

              <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: 7, fontSize: ".87rem", flex: 1 }}>
                {t.features.map((f) => (
                  <li key={f} style={{ display: "flex", gap: 8, color: T.jet, alignItems: "flex-start" }}>
                    <span style={{ color: T.ok, marginTop: 1, display: "inline-flex" }}><Icon d={ICON.check} size={15} /></span>
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <div>{cta(t)}</div>
            </div>
          ))}
        </div>
        <p style={{ textAlign: "center", color: "#888", fontSize: ".8rem", marginTop: 14, fontFamily: SANS }}>
          Videos meter per calendar month on our shared GPU; narration hours are approximate at typical speech rates.
        </p>
      </section>

      {/* what every plan includes */}
      <section style={{ padding: "2.5rem 1.25rem 3.5rem", background: T.mist }}>
        <div style={{ maxWidth: 1040, margin: "0 auto" }}>
          <SectionEyebrow>Every plan, every trick in the book</SectionEyebrow>
          <SectionTitle>Included in every video</SectionTitle>
          <p style={subStyle}>Upgrade a plan and you don’t buy “features” — you buy more room to create. All the magic ships with any plan.</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: "1rem", marginTop: "2rem" }}>
            {EVERY_PLAN.map((f) => (
              <div key={f.title} style={{ border: "1px solid " + T.line, borderRadius: 16, padding: "1.2rem 1.3rem", background: "#fff", boxShadow: "0 6px 18px rgba(17,24,39,.04)" }}>
                <span style={{ color: T.ivy, display: "inline-flex" }}><Icon d={f.icon} size={24} /></span>
                <b style={{ fontSize: "1rem", display: "block", marginTop: ".6rem", fontFamily: SANS }}>{f.title}</b>
                <p style={{ color: T.body, fontSize: ".9rem", margin: ".35rem 0 0", lineHeight: 1.55, fontFamily: SANS }}>{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* reassurance */}
      <section style={{ padding: "3rem 1.25rem" }}>
        <div style={{ maxWidth: 860, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))", gap: "1.4rem" }}>
          {[
            { icon: ICON.book, title: "Audiobooks included", body: "Narration hours also power ACX-ready audiobook chapters in Bangla & South-Asian English." },
            { icon: ICON.lock, title: "Your work is yours", body: "Commercial rights, no watermarks on paid plans, and your voices/faces are used only with consent." },
            { icon: ICON.heart, title: "No lock-in", body: "Start free, upgrade or cancel whenever. Flat pricing means no surprise invoices at the end of the month." },
          ].map((c) => (
            <div key={c.title} style={{ textAlign: "center", padding: "1rem 0.6rem" }}>
              <span style={{ color: T.ivy, display: "inline-flex" }}><Icon d={c.icon} size={30} /></span>
              <div style={{ fontWeight: 800, marginTop: ".6rem", fontFamily: SANS, fontSize: "1.02rem" }}>{c.title}</div>
              <p style={{ color: T.body, fontSize: ".9rem", lineHeight: 1.6, margin: ".4rem 0 0", fontFamily: SANS }}>{c.body}</p>
            </div>
          ))}
        </div>

        <div style={{ textAlign: "center", margin: "2.4rem 0 0" }}>
          <Link to="/login" style={ctaPrimary}>Start creating free <Icon d={ICON.arrow} size={18} /></Link>
          {authed && (
            <p style={{ marginTop: "1rem", fontFamily: SANS }}>
              <Link to="/app/billing" style={{ color: T.ivy, fontWeight: 600 }}>Manage your subscription →</Link>
            </p>
          )}
        </div>
      </section>
    </main>
  );
}

function Spec({ icon, label, value, strong }: { icon: string; label: string; value: string; strong?: boolean }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "center", fontFamily: SANS }}>
      <span style={{ color: "#888", display: "inline-flex", alignItems: "center", gap: 6 }}>
        <span style={{ color: "#c4b5fd" }}><Icon d={icon} size={14} /></span>{label}
      </span>
      <span style={{ fontWeight: strong ? 800 : 500, color: strong ? T.ivy : T.jet, textAlign: "right" }}>{value}</span>
    </div>
  );
}