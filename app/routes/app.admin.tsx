import { useEffect, useState } from "react";
import { api, type AdminOverview } from "~/lib/api";

const STATUS_COLOR: Record<string, string> = {
  NORMAL: "#2e7d32", RECOVERING: "#ef6c00", FAILOVER: "#c62828",
};

export default function Admin() {
  const [data, setData] = useState<AdminOverview | null>(null);
  const [err, setErr] = useState<string | null>(null);

  function load() {
    setErr(null);
    api.admin().then(setData).catch((e) => setErr(e.message));
  }
  useEffect(load, []);

  if (err) {
    const forbidden = err === "forbidden";
    return (
      <main style={{ maxWidth: 640, margin: "0 auto", padding: "2rem 1.25rem" }}>
        <h1>Admin</h1>
        <p style={{ color: "crimson" }}>
          {forbidden ? "You're not authorized to view this page." : err}
        </p>
      </main>
    );
  }
  if (!data) return <main style={{ padding: "2rem" }}><p>Loading…</p></main>;

  const { worker_and_queue: wq, jobs, billing, redis_estimate: rx } = data;
  const stale = wq.snapshot_age_sec == null || wq.snapshot_age_sec > 15 * 60;

  return (
    <main style={{ maxWidth: 860, margin: "0 auto", padding: "2rem 1.25rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <h1>Control plane</h1>
        <button onClick={load} style={{ padding: "0.4rem 0.9rem", cursor: "pointer" }}>Refresh</button>
      </div>
      <p style={{ color: "#888", fontSize: "0.8rem" }}>
        Snapshot {wq.snapshot_age_sec == null ? "never written" : `${wq.snapshot_age_sec}s old`}
        {stale && " ⚠️ (failover-tick may be down)"} · reads Postgres only (no Redis cost)
      </p>

      <Section title="Worker & queue">
        <Grid>
          <Stat label="Home worker" value={wq.home_alive == null ? "?" : wq.home_alive ? "alive" : "down"}
                color={wq.home_alive ? "#2e7d32" : "#c62828"} />
          <Stat label="Failover" value={wq.failover_state ?? "?"} color={STATUS_COLOR[wq.failover_state ?? ""] ?? "#666"} />
          <Stat label="Queue depth" value={String(wq.total_depth)} />
        </Grid>
        {Object.keys(wq.depth_by_lane).length > 0 && (
          <p style={{ fontSize: "0.8rem", color: "#666", marginTop: "0.5rem" }}>
            {Object.entries(wq.depth_by_lane).map(([k, v]) => `${k}=${v}`).join("  ·  ")}
          </p>
        )}
      </Section>

      <Section title="Jobs">
        <Grid>
          <Stat label="Queued" value={String(jobs.counts.queued)} />
          <Stat label="Processing" value={String(jobs.counts.processing)} color="#1565c0" />
          <Stat label="Completed" value={String(jobs.counts.completed)} color="#2e7d32" />
          <Stat label="Failed" value={String(jobs.counts.failed)} color={jobs.counts.failed ? "#c62828" : "#666"} />
        </Grid>
        <table style={{ width: "100%", borderCollapse: "collapse", marginTop: "0.8rem", fontSize: "0.85rem" }}>
          <thead><tr style={{ textAlign: "left", borderBottom: "1px solid #ddd" }}>
            <th>Job</th><th>Status</th><th>Voice</th><th>Created</th></tr></thead>
          <tbody>
            {jobs.recent.map((j) => (
              <tr key={j.id} style={{ borderBottom: "1px solid #f2f2f2" }}>
                <td><code>{j.id}</code></td><td>{j.status}</td><td>{j.voice_id}</td>
                <td>{new Date(j.created_at).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Section>

      <Section title="Billing">
        <Grid>
          <Stat label="Users" value={String(billing.total_users)} />
          <Stat label="Active subs" value={String(billing.by_subscription_status.active ?? 0)} color="#2e7d32" />
          <Stat label={`Minutes (${billing.period})`} value={String(Math.round(billing.minutes_this_period))} />
        </Grid>
        <p style={{ fontSize: "0.8rem", color: "#666", marginTop: "0.5rem" }}>
          Plans: {Object.entries(billing.by_plan).map(([k, v]) => `${k}=${v}`).join("  ·  ") || "—"}
        </p>
      </Section>

      <Section title="Upstash Redis (idle estimate)">
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.9rem", color: "#555" }}>
          <span>~{rx.per_month.toLocaleString()} cmds/mo</span>
          <span>{rx.pct_of_free_tier}% of {rx.free_tier_month.toLocaleString()} free</span>
        </div>
        <div style={{ background: "#eee", borderRadius: 6, height: 10, marginTop: 4, overflow: "hidden" }}>
          <div style={{ width: `${Math.min(100, rx.pct_of_free_tier)}%`, height: "100%",
                        background: rx.pct_of_free_tier > 90 ? "#c62828" : rx.pct_of_free_tier > 70 ? "#ef6c00" : "#2e7d32" }} />
        </div>
        <details style={{ marginTop: "0.6rem", fontSize: "0.8rem", color: "#666" }}>
          <summary>breakdown ({rx.per_day_total.toLocaleString()}/day)</summary>
          <ul>{Object.entries(rx.per_day).map(([k, v]) => <li key={k}>{k}: {v.toLocaleString()}/day</li>)}</ul>
          <p style={{ fontStyle: "italic" }}>{rx.note}</p>
        </details>
      </Section>
    </main>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ border: "1px solid #e2e2e2", borderRadius: 10, padding: "1.1rem", margin: "1.2rem 0" }}>
      <h2 style={{ margin: "0 0 0.7rem", fontSize: "1.1rem" }}>{title}</h2>
      {children}
    </section>
  );
}
function Grid({ children }: { children: React.ReactNode }) {
  return <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(120px,1fr))", gap: "0.8rem" }}>{children}</div>;
}
function Stat({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div>
      <div style={{ fontSize: "0.75rem", color: "#888", textTransform: "uppercase" }}>{label}</div>
      <div style={{ fontSize: "1.3rem", fontWeight: 700, color: color ?? "#222" }}>{value}</div>
    </div>
  );
}
