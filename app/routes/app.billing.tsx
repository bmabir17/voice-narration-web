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
  const [confirming, setConfirming] = useState(false);

  // On mount, load usage. If we just returned from a successful checkout (?status=success), the
  // Paddle webhook that provisions the plan lands a moment later — so poll until the subscription
  // goes active instead of making the user reload.
  useEffect(() => {
    const justPaid = new URLSearchParams(window.location.search).get("status") === "success";
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let tries = 0;

    async function load() {
      try {
        const u = await api.usage();
        if (cancelled) return;
        setUsage(u);
        if (justPaid && u.subscription_status !== "active" && tries < 15) {
          setConfirming(true);
          tries++;
          timer = setTimeout(load, 2000); // webhook usually lands within a few seconds
        } else {
          setConfirming(false);
          // Drop ?status=success so a later reload doesn't re-enter the polling state.
          if (justPaid) window.history.replaceState({}, "", window.location.pathname);
        }
      } catch (e: any) { if (!cancelled) setErr(e.message); }
    }
    load();
    return () => { cancelled = true; if (timer) clearTimeout(timer); };
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
  const cancelAt = usage.cancel_at ? new Date(usage.cancel_at).toLocaleDateString() : null;

  return (
    <main style={{ maxWidth: 640, margin: "0 auto", padding: "2rem 1.25rem" }}>
      <h1>Billing</h1>
      {err && <p style={{ color: "crimson" }}>{err}</p>}
      {confirming && (
        <p style={{ background: "#eef4ff", border: "1px solid #cfe0ff", color: "#1858c7",
                    borderRadius: 8, padding: "0.7rem 0.9rem", fontSize: ".92rem" }}>
          ✓ Payment received — confirming your subscription… this updates automatically in a few seconds.
        </p>
      )}

      <section style={{ border: "1px solid #ddd", borderRadius: 10, padding: "1.2rem", marginBottom: "1.5rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
          <h2 style={{ margin: 0 }}>{TIER_LABEL[usage.tier] ?? usage.tier}</h2>
          <span style={{ color: STATUS_COLOR[usage.subscription_status] ?? "#666", fontWeight: 600 }}>
            {usage.subscription_status}
          </span>
        </div>
        {cancelAt ? (
          <p style={{ color: "#ef6c00", margin: "0.4rem 0 0", fontWeight: 500 }}>
            Cancels on {cancelAt} — you keep {TIER_LABEL[usage.tier] ?? usage.tier} access until then.
          </p>
        ) : renew ? (
          <p style={{ color: "#666", margin: "0.4rem 0 0" }}>
            {usage.subscription_status === "cancelled" ? "Access until" : "Renews"} {renew}
          </p>
        ) : null}

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
