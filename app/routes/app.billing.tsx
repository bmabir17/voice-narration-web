import { useEffect, useState } from "react";
import { Link } from "react-router";
import { api, type UsageResponse } from "~/lib/api";

const TIER_LABEL: Record<string, string> = {
  free: "Free", creator: "Creator", pro: "Pro", volume: "Volume / API",
};
const STATUS_COLOR: Record<string, string> = {
  active: "#2e7d32", past_due: "#c62828", cancelled: "#ef6c00", inactive: "#666",
};

export default function Billing() {
  const [usage, setUsage] = useState<UsageResponse | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    api.usage().then(setUsage).catch((e) => setErr(e.message));
  }, []);

  async function openPortal() {
    setErr(null); setBusy("portal");
    try {
      const { url } = await api.billingPortal();
      window.location.href = url;
    } catch (e: any) {
      setErr(e.message === "no active subscription"
        ? "You don't have an active paid subscription yet."
        : e.message);
      setBusy(null);
    }
  }

  async function upgrade(tier: string) {
    setErr(null); setBusy(tier);
    try {
      const { url } = await api.checkout(tier);
      window.location.href = url;
    } catch (e: any) { setErr(e.message); setBusy(null); }
  }

  if (err && !usage) return <main style={{ padding: "2rem" }}><p style={{ color: "crimson" }}>{err}</p></main>;
  if (!usage) return <main style={{ padding: "2rem" }}><p>Loading…</p></main>;

  const pct = usage.minutes_limit > 0
    ? Math.min(100, Math.round((usage.minutes_used / usage.minutes_limit) * 100)) : 0;
  const isPaid = usage.tier !== "free";
  const renew = usage.current_period_end
    ? new Date(usage.current_period_end).toLocaleDateString() : null;

  return (
    <main style={{ maxWidth: 640, margin: "0 auto", padding: "2rem 1.25rem" }}>
      <h1>Billing</h1>
      {err && <p style={{ color: "crimson" }}>{err}</p>}

      <section style={{ border: "1px solid #ddd", borderRadius: 10, padding: "1.2rem", marginBottom: "1.5rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
          <h2 style={{ margin: 0 }}>{TIER_LABEL[usage.tier] ?? usage.tier}</h2>
          <span style={{ color: STATUS_COLOR[usage.subscription_status] ?? "#666", fontWeight: 600 }}>
            {usage.subscription_status}
          </span>
        </div>
        {renew && (
          <p style={{ color: "#666", margin: "0.4rem 0 0" }}>
            {usage.subscription_status === "cancelled" ? "Access until" : "Renews"} {renew}
          </p>
        )}

        <div style={{ marginTop: "1rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.9rem", color: "#555" }}>
            <span>Minutes this period</span>
            <span>{usage.minutes_used} / {usage.minutes_limit}</span>
          </div>
          <div style={{ background: "#eee", borderRadius: 6, height: 10, marginTop: 4, overflow: "hidden" }}>
            <div style={{ width: `${pct}%`, height: "100%", background: pct > 90 ? "#c62828" : "#2e7d32" }} />
          </div>
        </div>
        <p style={{ fontSize: "0.85rem", color: "#777", marginTop: "0.8rem" }}>
          {usage.max_custom_voices} custom voice{usage.max_custom_voices === 1 ? "" : "s"} ·
          {usage.api_access ? " API access" : " no API access"}
        </p>

        {isPaid && (
          <button onClick={openPortal} disabled={busy === "portal"}
                  style={{ marginTop: "0.6rem", padding: "0.5rem 1rem", cursor: "pointer" }}>
            {busy === "portal" ? "Opening…" : "Manage subscription"}
          </button>
        )}
      </section>

      <section>
        <h3>{isPaid ? "Change plan" : "Upgrade"}</h3>
        {isPaid ? (
          // Switching/cancelling an existing subscription goes through the portal — creating a fresh
          // checkout here would spin up a SECOND subscription and double-charge.
          <p style={{ color: "#555" }}>
            Use <strong>Manage subscription</strong> above to switch tiers or cancel.
          </p>
        ) : (
          <div style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap" }}>
            {["creator", "pro", "volume"].map((t) => (
              <button key={t} onClick={() => upgrade(t)} disabled={busy === t}
                      style={{ padding: "0.5rem 1rem", cursor: "pointer" }}>
                {busy === t ? "Redirecting…" : `Upgrade to ${TIER_LABEL[t]}`}
              </button>
            ))}
          </div>
        )}
        <p style={{ marginTop: "1rem" }}><Link to="/pricing">See full plan details →</Link></p>
      </section>
    </main>
  );
}
