import { useEffect, useState, useRef } from "react";
import { useParams } from "react-router";
import { api, type SupportTicket } from "~/lib/api";
import { supabase } from "~/lib/supabase";

const STATUS_COLOR: Record<string, string> = {
  open: "#1a73e8",
  resolved: "#137333",
  closed: "#8a6d00",
};

export default function SupportDetail() {
  const { id } = useParams();
  const [ticket, setTicket] = useState<SupportTicket | null>(null);
  const [reply, setReply] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!id) return;
    api.support.get(id).then((r: any) => setTicket(r)).catch(() => {});
  }, [id]);

  useEffect(() => {
    if (!id) return;
    const ch = supabase.channel(`support-${id}`)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "support_tickets", filter: `id=eq.${id}` },
          () => api.support.get(id).then((r: any) => setTicket(r)).catch(() => {}))
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [ticket?.updated_at]);

  if (!ticket) return <main style={{ maxWidth: 800, margin: "0 auto", padding: "2rem 1.25rem" }}><p>Loading…</p></main>;

  const messages: Array<{ role: "user" | "admin"; message: string; created_at: string }> = [];
  messages.push({ role: "user", message: ticket.message, created_at: ticket.created_at });

  if (ticket.updated_at !== ticket.created_at) {
    messages.push({ role: "admin", message: "Reply from support team", created_at: ticket.updated_at });
  }

  async function handleReply() {
    if (!reply.trim() || !id) return;
    setError(null);
    setSaving(true);
    try {
      await api.support.update(id, { message: reply.trim() });
      setReply("");
    } catch (e: any) {
      setError(e.message || "Failed to send reply");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main style={{ maxWidth: 800, margin: "0 auto", padding: "2rem 1.25rem" }}>
      <a href="/app/support" style={{ color: "#1858c7", textDecoration: "none" }}>← Back to tickets</a>
      <h1 style={{ marginTop: 12 }}>{ticket.subject}</h1>
      <div style={{ display: "flex", gap: 16, marginBottom: 20, fontSize: 13, color: "#666" }}>
        <span>Status: <strong style={{ color: STATUS_COLOR[ticket.status] ?? "#666" }}>{ticket.status}</strong></span>
        <span>Created: {new Date(ticket.created_at).toLocaleString()}</span>
        {ticket.admin_read_at && <span>Read: {new Date(ticket.admin_read_at).toLocaleString()}</span>}
      </div>

      <div style={{ background: "#f9f9f9", border: "1px solid #e0e0e0", borderRadius: 8, padding: 20, marginBottom: 20 }}>
        <p style={{ whiteSpace: "pre-wrap", margin: 0 }}>{ticket.message}</p>
      </div>

      <div style={{ display: "flex", gap: 10, alignItems: "flex-end" }}>
        <div style={{ flex: 1 }}>
          <textarea
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            rows={4}
            style={{ width: "100%", padding: 8, border: "1px solid #ddd", borderRadius: 4, boxSizing: "border-box", fontFamily: "inherit" }}
            placeholder="Type a reply..."
          />
        </div>
        <button onClick={handleReply} disabled={saving || !reply.trim()}
          style={{ padding: "8px 20px", background: "#1858c7", color: "#fff", border: "none", borderRadius: 6, cursor: saving ? "wait" : "pointer", fontWeight: 500 }}>
          {saving ? "Sending…" : "Send"}
        </button>
      </div>
      {error && <p style={{ color: "#c5221f" }}>{error}</p>}
      <div ref={messagesEndRef} />
    </main>
  );
}
