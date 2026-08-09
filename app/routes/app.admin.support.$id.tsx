import { useEffect, useState, useRef } from "react";
import { useParams, Link } from "react-router";
import { api, type SupportTicket, type SupportReply } from "~/lib/api";
import { supabase } from "~/lib/supabase";

export default function AdminSupportDetail() {
  const { id } = useParams();
  const [ticket, setTicket] = useState<SupportTicket | null>(null);
  const [reply, setReply] = useState("");
  const [saving, setSaving] = useState(false);
  const [resolving, setResolving] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!id) return;
    api.adminSupport.get(id).then((r: any) => setTicket(r)).catch((e: any) => setErr(e.message));
  }, [id]);

  useEffect(() => {
    if (!id) return;
    const ch = supabase.channel(`admin-support-${id}`)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "support_tickets", filter: `id=eq.${id}` },
          () => api.adminSupport.get(id).then((r: any) => setTicket(r)).catch(() => {}))
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "support_replies", filter: `ticket_id=eq.${id}` },
          () => api.adminSupport.get(id).then((r: any) => setTicket(r)).catch(() => {}))
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [ticket?.replies?.length]);

  if (!ticket) {
    return (
      <main style={{ maxWidth: 800, margin: "0 auto", padding: "2rem 1.25rem" }}>
        {err ? <p style={{ color: "crimson" }}>{err}</p> : <p>Loading…</p>}
      </main>
    );
  }

  const replies: SupportReply[] = ticket.replies ?? [];

  async function sendReply() {
    if (!reply.trim() || !id) return;
    setErr(null); setSaving(true);
    try {
      await api.adminSupport.update(id, { message: reply.trim() });
      setReply("");
      const r: any = await api.adminSupport.get(id);
      setTicket(r);
    } catch (e: any) { setErr(e.message); } finally { setSaving(false); }
  }

  async function resolveTicket() {
    if (!id || ticket.status === "resolved") return;
    setErr(null); setResolving(true);
    try {
      await api.adminSupport.update(id, { status: "resolved" });
      const r: any = await api.adminSupport.get(id);
      setTicket(r);
    } catch (e: any) { setErr(e.message); } finally { setResolving(false); }
  }

  return (
    <main style={{ maxWidth: 800, margin: "0 auto", padding: "2rem 1.25rem" }}>
      <Link to="/app/admin/support" style={{ color: "#1858c7", textDecoration: "none" }}>← Back to tickets</Link>
      <h1 style={{ marginTop: 12 }}>{ticket.subject}</h1>

      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
        <span style={{ background: "#f9f9f9", border: "1px solid #e0e0e0", borderRadius: 8, padding: 12, fontSize: "0.88rem" }}>
          <span style={{ fontWeight: 600 }}>Status:</span>{" "}{ticket.status}
        </span>
        {ticket.status !== "resolved" && (
          <button
            onClick={resolveTicket}
            disabled={resolving}
            style={{ padding: "10px 20px", background: "#2e7d32", color: "#fff", border: "none", borderRadius: 6, cursor: resolving ? "wait" : "pointer", fontWeight: 500 }}
          >
            {resolving ? "Resolving…" : "Resolve Ticket"}
          </button>
        )}
      </div>

      <div style={{ background: "#f9f9f9", border: "1px solid #e0e0e0", borderRadius: 8, padding: 16, marginBottom: 20, fontSize: "0.88rem" }}>
        <div style={{ display: "grid", gridTemplateColumns: "140px 1fr", gap: "8px 16px" }}>
          <strong>Email:</strong><span>{ticket.email}</span>
          <strong>Plan:</strong><span>{ticket.plan_tier}</span>
          <strong>Created:</strong><span>{new Date(ticket.created_at).toLocaleString()}</span>
          <strong>Updated:</strong><span>{new Date(ticket.updated_at).toLocaleString()}</span>
          {ticket.admin_read_at && (<>
            <strong>Admin read:</strong><span>{new Date(ticket.admin_read_at).toLocaleString()}</span>
          </>)}
        </div>
      </div>

      <h3 style={{ margin: "1rem 0 0.6rem" }}>Conversation</h3>
      <div style={{ border: "1px solid #e0e0e0", borderRadius: 8, padding: "0 16px", marginBottom: 20 }}>
        <div style={{ padding: "16px 0", borderBottom: "1px solid #f0f0f0" }}>
          <div style={{ marginBottom: 6, fontSize: "0.8rem", color: "#666" }}>
            <strong style={{ color: "#333" }}>User</strong> · {new Date(ticket.created_at).toLocaleString()}
          </div>
          <p style={{ whiteSpace: "pre-wrap", margin: 0 }}>{ticket.message}</p>
        </div>
        {replies.map((r) => (
          <div key={r.id} style={{ padding: "16px 0", borderBottom: "1px solid #f0f0f0" }}>
            <div style={{ marginBottom: 6, fontSize: "0.8rem", color: "#666" }}>
              <strong style={{ color: r.sender === "admin" ? "#1858c7" : "#333" }}>
                {r.sender === "admin" ? "Support team" : "User"}
              </strong> · {new Date(r.created_at).toLocaleString()}
            </div>
            <p style={{ whiteSpace: "pre-wrap", margin: 0 }}>{r.message}</p>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", gap: 10, alignItems: "flex-end" }}>
        <div style={{ flex: 1 }}>
          <textarea
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            rows={4}
            style={{ width: "100%", padding: 8, border: "1px solid #ddd", borderRadius: 4, boxSizing: "border-box", fontFamily: "inherit" }}
            placeholder="Admin reply..."
          />
        </div>
        <button
          onClick={sendReply}
          disabled={saving || !reply.trim()}
          style={{ padding: "8px 20px", background: "#1858c7", color: "#fff", border: "none", borderRadius: 6, cursor: saving ? "wait" : "pointer", fontWeight: 500 }}
        >
          {saving ? "Sending…" : "Send Reply"}
        </button>
      </div>
      {err && <p style={{ color: "crimson" }}>{err}</p>}
      <div ref={messagesEndRef} />
    </main>
  );
}