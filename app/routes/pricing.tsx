import { useEffect, useState } from "react";
import { Link } from "react-router";
import { api } from "~/lib/api";
import { currentSession } from "~/lib/supabase";

export function meta() {
  return [
    { title: "Pricing — Voice Narration" },
    { name: "description", content: "Flat, volume-friendly plans for long-form AI narration. Free tier, Creator, Pro, and Volume/API." },
  ];
}

interface Tier {
  tier: string; name: string; price: string; blurb: string; purchasable: boolean;
}
const TIERS: Tier[] = [
  { tier: "free",    name: "Free",         price: "$0",      blurb: "~15 min/mo, watermarked, non-commercial.", purchasable: false },
  { tier: "creator", name: "Creator",      price: "$22/mo",  blurb: "~3 hrs + commercial rights + 1 custom voice.", purchasable: true },
  { tier: "pro",     name: "Pro",          price: "$50/mo",  blurb: "~15 hrs + up to 5 voices + API access.", purchasable: true },
  { tier: "volume",  name: "Volume / API", price: "$100/mo", blurb: "~100 hrs + up to 20 voices + API + deadline lane.", purchasable: true },
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
    if (!t.purchasable) return <span style={{ color: "#888" }}>Included free</span>;
    if (authed === false) return <Link to="/login">Sign in to subscribe</Link>;
    if (currentTier === t.tier) return <span style={{ color: "#2e7d32", fontWeight: 600 }}>Current plan</span>;
    return (
      <button onClick={() => subscribe(t.tier)} disabled={busy === t.tier}
              style={{ padding: "0.5rem 1rem", cursor: "pointer", width: "100%" }}>
        {busy === t.tier ? "Redirecting…" : "Subscribe"}
      </button>
    );
  }

  return (
    <main style={{ maxWidth: 860, margin: "0 auto", padding: "3rem 1.25rem" }}>
      <h1>Pricing</h1>
      {err && <p style={{ color: "crimson" }}>{err}</p>}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: "1rem" }}>
        {TIERS.map((t) => (
          <div key={t.tier} style={{ border: "1px solid #ddd", borderRadius: 10, padding: "1.2rem",
                                      display: "flex", flexDirection: "column", gap: "0.6rem" }}>
            <h3 style={{ margin: 0 }}>{t.name}</h3>
            <p style={{ fontSize: "1.4rem", fontWeight: 700, margin: 0 }}>{t.price}</p>
            <p style={{ color: "#555", flex: 1 }}>{t.blurb}</p>
            <div>{cta(t)}</div>
          </div>
        ))}
      </div>
      {authed && (
        <p style={{ marginTop: "1.5rem" }}>
          <Link to="/app/billing">Manage your subscription →</Link>
        </p>
      )}
    </main>
  );
}
