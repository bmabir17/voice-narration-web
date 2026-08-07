import { useEffect, useState } from "react";
import { Link } from "react-router";
import { api, type SupportTicket } from "~/lib/api";

const STATUS_COLORS: Record<string, string> = {
  open: "#1a73e8",
  resolved: "#137333",
  closed: "#8a6d00",
};

export default function AdminSupport() {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [total, setTotal] = useState(0);
  const [filter, setFilter] = useState("");
  const [q, setQ] = useState("");
  const [err, setErr] = useState<string | null>(null);

  function load() {
    setErr(null);
    api.adminSupport.list({ status: filter || undefined, q: q || undefined, limit: 50 })
      .then((r: any) => { setTickets(r.tickets); setTotal(r.total); })
      .catch((e: any) => { setErr(e.message); setTickets([]); });
  }

  useEffect(() => { load(); /* eslint-disable-next-line */ }, []);

  async function updateStatus(id: string, status: "resolved" | "closed") {
    setErr(null);
    try {
      await api.adminSupport.update(id, { status });
      load();
    } catch (e: any) { setErr(e.message); }
  }

  return (
    <main style={{ maxWidth: 960, margin: "0 auto", padding: "2rem 1.25rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <h1>Support Tickets</h1>
        <Link to="/app/admin">← Control plane</Link>
      </div>
      {err && <p style={{ color: "crimson" }}>{err}</p>}

      <div style={{ display: "flex", gap: "0.5rem", margin: "1rem 0", flexWrap: "wrap" }}>
        <button onClick={() => setFilter("")}
          style={{ padding: "6px 14px", border: "1px solid #ddd", borderRadius: 4, cursor: "pointer", background: !filter ? "#1858c7" : "transparent", color: !filter ? "#fff" : "#333" }}>
          All
        </button>
        <button onClick={() => setFilter("open")}
          style={{ padding: "6px 14px", border: "1px solid #ddd", borderRadius: 4, cursor: "pointer", background: filter === "open" ? "#1858c7" : "transparent", color: filter === "open" ? "#fff" : "#333" }}>
          Open
        </button>
        <button onClick={() => setFilter("resolved")}
          style={{ padding: "6px 14px", border: "1px solid #ddd", borderRadius: 4, cursor: "pointer", background: filter === "resolved" ? "#1858c7" : "transparent", color: filter === "resolved" ? "#fff" : "#333" }}>
          Resolved
        </button>
        <button onClick={() => setFilter("closed")}
          style={{ padding: "6px 14px", border: "1px solid #ddd", borderRadius: 4, cursor: "pointer", background: filter === "closed" ? "#1858c7" : "transparent", color: filter === "closed" ? "#fff" : "#333" }}>
          Closed
        </button>
        <input placeholder="Search…" value={q} onChange={(e) => setQ(e.target.value)}
               onKeyDown={(e) => e.key === "Enter" && load()} style={{ padding: "0.45rem", flex: 1, minWidth: 150 }} />
        <button onClick={load} style={{ padding: "0.45rem 1rem", cursor: "pointer" }}>Search</button>
      </div>

      <p style={{ fontSize: "0.8rem", color: "#888" }}>{total} ticket{total === 1 ? "" : "s"}</p>

      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.88rem" }}>
        <thead><tr style={{ textAlign: "left", borderBottom: "1px solid #ddd" }}>
          <th>Subject</th><th>Status</th><th>Email</th><th>Created</th><th></th></tr></thead>
        <tbody>
          {tickets.map((t) => (
            <tr key={t.id} style={{ borderBottom: "1px solid #f2f2f2" }}>
              <td style={{ padding: "0.35rem 0" }}>
                <Link to={`/app/admin/support/${t.id}`} style={{ color: "#1858c7" }}>{t.subject}</Link>
              </td>
              <td style={{ padding: "0.35rem 0" }}>
                <span style={{ color: STATUS_COLORS[t.status] ?? "#666", fontWeight: 500 }}>{t.status}</span>
              </td>
              <td style={{ padding: "0.35rem 0", color: "#666" }}>{t.email}</td>
              <td style={{ padding: "0.35rem 0", color: "#666" }}>{new Date(t.created_at).toLocaleDateString()}</td>
              <td style={{ padding: "0.35rem 0", textAlign: "right" }}>
                {t.status === "open" && (
                  <>
                    <button onClick={() => updateStatus(t.id, "resolved")}
                      style={{ padding: "0.3rem 0.7rem", cursor: "pointer", color: "#137333" }}>Resolve</button>{" "}
                    <button onClick={() => updateStatus(t.id, "closed")}
                      style={{ padding: "0.3rem 0.7rem", cursor: "pointer", color: "#8a6d00" }}>Close</button>
                  </>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {tickets.length === 0 && <p style={{ color: "#666" }}>No tickets found.</p>}
    </main>
  );
}
