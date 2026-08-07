import { useEffect, useState } from "react";
import { api, type SupportTicket } from "~/lib/api";
import { supabase } from "~/lib/supabase";

const STATUS_COLOR: Record<string, string> = {
  open: "#1a73e8",
  resolved: "#137333",
  closed: "#8a6d00",
};

export default function SupportList() {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [total, setTotal] = useState(0);
  const [filter, setFilter] = useState<string>("");
  const [showNew, setShowNew] = useState(false);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const q = filter ? `?status=${filter}` : "";
    api.support.list(q).then((r: any) => {
      setTickets(r.tickets ?? []);
      setTotal(r.total ?? 0);
    }).catch(() => {});
  }, [filter]);

  async function handleSubmit() {
    setError(null);
    if (!subject.trim() || !message.trim()) return;
    setSaving(true);
    try {
      await api.support.create({ subject: subject.trim(), message: message.trim() });
      setShowNew(false);
      setSubject("");
      setMessage("");
      // Refresh list
      const q = filter ? `?status=${filter}` : "";
      const r: any = await api.support.list(q);
      setTickets(r.tickets ?? []);
      setTotal(r.total ?? 0);
    } catch (e: any) {
      setError(e.message || "Failed to create ticket");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main style={{ maxWidth: 800, margin: "0 auto", padding: "2rem 1.25rem" }}>
      <h1>Support</h1>

      <p style={{ color: "#555", marginBottom: "1.5rem" }}>
        Need help? Create a support ticket and our team will get back to you.
      </p>

      {showNew && (
        <div style={{ background: "#f9f9f9", border: "1px solid #e0e0e0", borderRadius: 8, padding: 20, marginBottom: 24 }}>
          <h2 style={{ marginTop: 0 }}>New Ticket</h2>
          {error && <p style={{ color: "#c5221f" }}>{error}</p>}
          <div style={{ marginBottom: 12 }}>
            <label style={{ display: "block", marginBottom: 4, fontWeight: 500 }}>Subject</label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              style={{ width: "100%", padding: 8, border: "1px solid #ddd", borderRadius: 4, boxSizing: "border-box" }}
              placeholder="Brief description of your issue"
            />
          </div>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: "block", marginBottom: 4, fontWeight: 500 }}>Message</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={6}
              style={{ width: "100%", padding: 8, border: "1px solid #ddd", borderRadius: 4, boxSizing: "border-box", fontFamily: "inherit" }}
              placeholder="Describe your issue in detail..."
            />
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={handleSubmit} disabled={saving || !subject.trim() || !message.trim()}
              style={{ padding: "8px 20px", background: "#1858c7", color: "#fff", border: "none", borderRadius: 6, cursor: saving ? "wait" : "pointer", fontWeight: 500 }}>
              {saving ? "Creating…" : "Create Ticket"}
            </button>
            <button onClick={() => setShowNew(false)} style={{ padding: "8px 20px", background: "transparent", border: "1px solid #ddd", borderRadius: 6, cursor: "pointer" }}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {!showNew && (
        <button onClick={() => setShowNew(true)}
          style={{ padding: "8px 20px", background: "#1858c7", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer", fontWeight: 500, marginBottom: 20 }}>
          + New Ticket
        </button>
      )}

      <div style={{ marginBottom: 16, display: "flex", gap: 8 }}>
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
      </div>

      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ textAlign: "left", borderBottom: "1px solid #ddd", fontSize: 13 }}>
            <th style={{ padding: "8px 10px" }}>Subject</th>
            <th style={{ padding: "8px 10px" }}>Status</th>
            <th style={{ padding: "8px 10px" }}>Created</th>
          </tr>
        </thead>
        <tbody>
          {tickets.map((t) => (
            <tr key={t.id} style={{ borderBottom: "1px solid #f0f0f0" }}>
              <td style={{ padding: "10px" }}>
                <a href={`/app/support/${t.id}`} style={{ color: "#1858c7", textDecoration: "none" }}>{t.subject}</a>
              </td>
              <td style={{ padding: "10px" }}>
                <span style={{ color: STATUS_COLOR[t.status] ?? "#666", fontWeight: 500 }}>{t.status}</span>
              </td>
              <td style={{ padding: "10px", color: "#666", fontSize: 13 }}>
                {new Date(t.created_at).toLocaleDateString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {tickets.length === 0 && <p style={{ color: "#666" }}>No tickets found.</p>}
    </main>
  );
}
