import { useEffect, useState, useRef } from "react";
import { useParams, Link } from "react-router";
import { api, type SupportTicket } from "~/lib/api";
import { supabase } from "~/lib/supabase";

export default function AdminSupportDetail() {
  const { id } = useParams();
  const [ticket, setTicket] = useState<SupportTicket | null>(null);
  const [reply, setReply] = useState("");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!id) return;
    api.adminSupport.get(id).then((r: any) => setTicket(r)).catch(() => {});
  }, [id]);

  useEffect(() => {
    if (!id) return;
    const ch = supabase.channel(`admin-support-${id}`)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "support_tickets", filter: `id=eq.${id}` },
          () => api.adminSupport.get(id).then((r: any) => setTicket(r)).catch(() => {}))
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [ticket?.updated_at]);

  if (!ticket) return <main style={{ maxWidth: 800, margin: "0 auto", padding: "2rem 1.25rem" }}><p>Loading…</p></main>;

  return (
    <main style={{ maxWidth: 800, margin: "0 auto", padding: "2rem 1.25rem" }}>
      <a href="/app/admin/support" style={{ color: "#1858c7", textDecoration: "none" }}>← Back to tickets</a>
      <h1 style={{ marginTop: 12 }}>{ticket.subject}</h1>

      <div style={{ background: "#f9f9f9", border: "1px solid #e0e0e0", borderRadius: 8, padding: 16, marginBottom: 20, fontSize: "0.88rem" }}>
        <div style={{ display: "grid", gridTemplateColumns: "140px 1fr", gap: "8px 16px" }}>
          <strong>Status:</strong><span>{ticket.status}</span>
          <strong>Email:</strong><span>{ticket.email}</span>
          <strong>Plan:</strong><span>{ticket.plan_tier}</span>
          <strong>Created:</strong><span>{new Date(ticket.created_at).toLocaleString()}</span>
          <strong>Updated:</strong><span>{new Date(ticket.updated_at).toLocaleString()}</span>
          {ticket.admin_read_at && (<>
            <strong>Admin read:</strong><span>{new Date(ticket.admin_read_at).toLocaleString()}</span>
          </>)}
        </div>
      </div>

      <div style={{ background: "#e8f0fe", border: "1px solid #d2e3fc", borderRadius: 8, padding: 20, marginBottom: 20 }}>
        <p style={{ whiteSpace: "pre-wrap", margin: 0 }}>{ticket.message}</p>
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
          onClick={async () => {
            if (!reply.trim() || !id) return;
            setErr(null); setSaving(true);
            try { await api.adminSupport.update(id, { message: reply.trim() }); setReply(""); }
            catch (e: any) { setErr(e.message); } finally { setSaving(false); }
          }}
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
