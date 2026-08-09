import { useEffect, useState, useRef } from "react";
import { useParams, Link } from "react-router";
import { api, type SupportTicket, type SupportReply, type SupportAttachment } from "~/lib/api";
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
    api.support.get(id).then((r: any) => setTicket(r)).catch((e: any) => setError(e.message));
  }, [id]);

  useEffect(() => {
    if (!id) return;
    const ch = supabase.channel(`support-${id}`)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "support_tickets", filter: `id=eq.${id}` },
          () => api.support.get(id).then((r: any) => setTicket(r)).catch(() => {}))
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "support_replies", filter: `ticket_id=eq.${id}` },
          () => api.support.get(id).then((r: any) => setTicket(r)).catch(() => {}))
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [ticket?.replies?.length]);

  if (!ticket) {
    return (
      <main style={{ maxWidth: 800, margin: "0 auto", padding: "2rem 1.25rem" }}>
        {error ? <p style={{ color: "#c5221f" }}>{error}</p> : <p>Loading…</p>}
      </main>
    );
  }

  const replies: SupportReply[] = ticket.replies ?? [];
  const attachments: SupportAttachment[] = ticket.attachments ?? [];

  async function handleReply() {
    if (!reply.trim() || !id) return;
    setError(null);
    setSaving(true);
    try {
      const r: any = await api.support.update(id, { message: reply.trim() });
      setTicket(r);
      setReply("");
    } catch (e: any) {
      setError(e.message || "Failed to send reply");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main style={{ maxWidth: 800, margin: "0 auto", padding: "2rem 1.25rem" }}>
      <Link to="/app/support" style={{ color: "#1858c7", textDecoration: "none" }}>← Back to tickets</Link>
      <h1 style={{ marginTop: 12 }}>{ticket.subject}</h1>
      <div style={{ display: "flex", gap: 16, marginBottom: 20, fontSize: 13, color: "#666" }}>
        <span>Status: <strong style={{ color: STATUS_COLOR[ticket.status] ?? "#666" }}>{ticket.status}</strong></span>
        <span>Created: {new Date(ticket.created_at).toLocaleString()}</span>
        {ticket.admin_read_at && <span>Read: {new Date(ticket.admin_read_at).toLocaleString()}</span>}
      </div>

      <h3 style={{ margin: "1rem 0 0.6rem" }}>Conversation</h3>
      <div style={{ border: "1px solid #e0e0e0", borderRadius: 8, padding: "0 16px", marginBottom: 20 }}>
        <div style={{ padding: "16px 0", borderBottom: "1px solid #f0f0f0" }}>
          <div style={{ marginBottom: 6, fontSize: "0.8rem", color: "#666" }}>
            <strong style={{ color: "#1a73e8" }}>You</strong> · {new Date(ticket.created_at).toLocaleString()}
          </div>
          <p style={{ whiteSpace: "pre-wrap", margin: 0 }}>{ticket.message}</p>
          {attachments.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 12 }}>
              {attachments.map((a) => {
                if (!a.url) return null;
                return a.content_type.startsWith("image/")
                  ? <a key={a.id} href={a.url} target="_blank" rel="noreferrer" title={a.file_name}>
                      <img src={a.url} alt={a.file_name} style={{ maxWidth: 260, maxHeight: 200, borderRadius: 8, border: "1px solid #e0e0e0" }} />
                    </a>
                  : a.content_type.startsWith("video/")
                    ? <video key={a.id} src={a.url} controls style={{ maxWidth: 260, maxHeight: 200, borderRadius: 8 }} title={a.file_name} />
                    : <a key={a.id} href={a.url} target="_blank" rel="noreferrer" style={{ color: "#1858c7" }}>{a.file_name}</a>;
              })}
            </div>
          )}
        </div>
        {replies.map((r) => (
          <div key={r.id} style={{ padding: "16px 0", borderBottom: "1px solid #f0f0f0" }}>
            <div style={{ marginBottom: 6, fontSize: "0.8rem", color: "#666" }}>
              <strong style={{ color: r.sender === "admin" ? "#1a73e8" : "#333" }}>
                {r.sender === "admin" ? "Support team" : "You"}
              </strong> · {new Date(r.created_at).toLocaleString()}
            </div>
            <p style={{ whiteSpace: "pre-wrap", margin: 0 }}>{r.message}</p>
          </div>
        ))}
      </div>

      {ticket.status === "open" ? (
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
      ) : (
        <p style={{ color: "#666", fontSize: "0.9rem" }}>This ticket is {ticket.status}; you can no longer reply.</p>
      )}
      {error && <p style={{ color: "#c5221f" }}>{error}</p>}
      <div ref={messagesEndRef} />
    </main>
  );
}