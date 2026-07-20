import { useEffect, useState } from "react";
import { Link } from "react-router";
import { api, type AdminUser } from "~/lib/api";

const TIERS = ["free", "creator", "pro", "volume"];
const STATUSES = ["active", "cancelled", "past_due", "inactive"];

export default function AdminUsers() {
  const [users, setUsers] = useState<AdminUser[] | null>(null);
  const [total, setTotal] = useState(0);
  const [q, setQ] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [newEmail, setNewEmail] = useState("");
  const [newPlan, setNewPlan] = useState("free");

  function load(query = q) {
    setErr(null);
    api.adminUsers.list(query || undefined)
      .then((r) => { setUsers(r.users); setTotal(r.total); })
      .catch((e) => { setErr(e.message === "forbidden" ? "Not authorized." : e.message); setUsers([]); });
  }
  useEffect(() => { load(""); /* eslint-disable-next-line */ }, []);

  // Local edits: mutate the row in state; Save patches it.
  function setField(id: string, field: keyof AdminUser, value: string) {
    setUsers((us) => (us ?? []).map((u) => (u.id === id ? { ...u, [field]: value } : u)));
  }

  async function save(u: AdminUser) {
    setBusyId(u.id); setErr(null);
    try {
      await api.adminUsers.update(u.id, { plan_tier: u.plan_tier, subscription_status: u.subscription_status });
    } catch (e: any) { setErr(e.message); } finally { setBusyId(null); }
  }

  async function resetUsage(u: AdminUser) {
    if (!confirm(`Reset ${u.email}'s usage for this billing period to zero?`)) return;
    setBusyId(u.id); setErr(null);
    try { await api.adminUsers.update(u.id, { reset_usage: true }); }
    catch (e: any) { setErr(e.message); } finally { setBusyId(null); }
  }

  async function remove(u: AdminUser) {
    if (!confirm(
      `DELETE ${u.email}?\n\nThis permanently removes their account, jobs, cloned voices, API keys — ` +
      `AND their biometric consent records (legal evidence). This cannot be undone.`,
    )) return;
    setBusyId(u.id); setErr(null);
    try {
      await api.adminUsers.remove(u.id);
      setUsers((us) => (us ?? []).filter((x) => x.id !== u.id));
      setTotal((t) => t - 1);
    } catch (e: any) { setErr(e.message); } finally { setBusyId(null); }
  }

  async function create(e: React.FormEvent) {
    e.preventDefault();
    if (!newEmail.trim()) return;
    setBusyId("new"); setErr(null);
    try {
      await api.adminUsers.create({ email: newEmail.trim(), plan_tier: newPlan });
      setNewEmail(""); setNewPlan("free"); load();
    } catch (e: any) { setErr(e.message); } finally { setBusyId(null); }
  }

  return (
    <main style={{ maxWidth: 960, margin: "0 auto", padding: "2rem 1.25rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <h1>Users</h1>
        <Link to="/app/admin">← Control plane</Link>
      </div>
      {err && <p style={{ color: "crimson" }}>{err}</p>}

      <form onSubmit={create} style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", margin: "1rem 0",
                                       padding: "0.9rem", border: "1px solid #e2e2e2", borderRadius: 10 }}>
        <strong style={{ alignSelf: "center" }}>New user</strong>
        <input type="email" required placeholder="email@example.com" value={newEmail}
               onChange={(e) => setNewEmail(e.target.value)} style={{ padding: "0.45rem", flex: 1, minWidth: 200 }} />
        <select value={newPlan} onChange={(e) => setNewPlan(e.target.value)} style={{ padding: "0.45rem" }}>
          {TIERS.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
        <button disabled={busyId === "new"} style={{ padding: "0.45rem 1rem", cursor: "pointer" }}>
          {busyId === "new" ? "Creating…" : "Create"}
        </button>
      </form>
      <p style={{ fontSize: "0.8rem", color: "#888" }}>
        Plan/status here are manual overrides (comps, corrections, stuck webhooks) — they don't change the
        user's Paddle subscription. Admin access itself is controlled by the ADMIN_USER_IDS secret, not here.
      </p>

      <div style={{ display: "flex", gap: "0.5rem", margin: "1rem 0" }}>
        <input placeholder="Search email…" value={q} onChange={(e) => setQ(e.target.value)}
               onKeyDown={(e) => e.key === "Enter" && load()} style={{ padding: "0.45rem", flex: 1 }} />
        <button onClick={() => load()} style={{ padding: "0.45rem 1rem", cursor: "pointer" }}>Search</button>
      </div>

      {users === null ? <p style={{ color: "#666" }}>Loading…</p> : (
        <>
          <p style={{ fontSize: "0.8rem", color: "#888" }}>{total} user{total === 1 ? "" : "s"}</p>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.88rem" }}>
            <thead><tr style={{ textAlign: "left", borderBottom: "1px solid #ddd" }}>
              <th>Email</th><th>Plan</th><th>Status</th><th>Renews/until</th><th></th></tr></thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} style={{ borderBottom: "1px solid #f2f2f2" }}>
                  <td style={{ padding: "0.35rem 0" }}>
                    {u.email ?? <em>no email</em>}
                    {u.mor_subscription_id && <span title="has an active Paddle subscription"> 💳</span>}
                  </td>
                  <td>
                    <select value={u.plan_tier} onChange={(e) => setField(u.id, "plan_tier", e.target.value)}
                            style={{ padding: "0.3rem" }}>
                      {TIERS.map((t) => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </td>
                  <td>
                    <select value={u.subscription_status} onChange={(e) => setField(u.id, "subscription_status", e.target.value)}
                            style={{ padding: "0.3rem" }}>
                      {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </td>
                  <td style={{ color: "#666" }}>
                    {u.current_period_end ? new Date(u.current_period_end).toLocaleDateString() : "—"}
                  </td>
                  <td style={{ textAlign: "right", whiteSpace: "nowrap" }}>
                    <button onClick={() => save(u)} disabled={busyId === u.id}
                            style={{ padding: "0.3rem 0.7rem", cursor: "pointer" }}>Save</button>{" "}
                    <button onClick={() => resetUsage(u)} disabled={busyId === u.id}
                            style={{ padding: "0.3rem 0.7rem", cursor: "pointer" }} title="Zero this period's quota usage">
                      Reset usage
                    </button>{" "}
                    <button onClick={() => remove(u)} disabled={busyId === u.id}
                            style={{ padding: "0.3rem 0.7rem", cursor: "pointer", color: "crimson" }}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </main>
  );
}
