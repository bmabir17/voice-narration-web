import { useEffect, useState } from "react";
import { api, uploadSupportAttachment, type SupportTicket } from "~/lib/api";
import { supabase } from "~/lib/supabase";

const STATUS_COLOR: Record<string, string> = {
  open: "#1a73e8",
  resolved: "#137333",
  closed: "#8a6d00",
};

interface PickedFile {
  file: File;
  preview: string;
  uploadedRef?: string;
  error?: string;
}

const MAX_ATTACHMENTS = 10;

function objectPreview(f: File): string {
  return URL.createObjectURL(f);
}

export default function SupportList() {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [total, setTotal] = useState(0);
  const [filter, setFilter] = useState<string>("");
  const [showNew, setShowNew] = useState(false);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [picked, setPicked] = useState<PickedFile[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const q = filter ? `?status=${filter}` : "";
    api.support.list(q).then((r: any) => {
      setTickets(r.tickets ?? []);
      setTotal(r.total ?? 0);
    }).catch(() => {});
  }, [filter]);

  function pickFiles(list: FileList | null) {
    const files = Array.from(list ?? []);
    setError(null);
    const room = MAX_ATTACHMENTS - picked.length;
    const take = files.slice(0, Math.max(0, room));
    if (files.length > room) setError(`You can attach up to ${MAX_ATTACHMENTS} files (${files.length - room} skipped).`);
    const next = take.map((f) => ({ file: f, preview: objectPreview(f) }));
    setPicked((p) => [...p, ...next]);
  }

  function removePick(idx: number) {
    const item = picked[idx];
    URL.revokeObjectURL(item.preview);
    if (item.uploadedRef) supabase.storage.from("support-attachments").remove([item.uploadedRef]).catch(() => {});
    setPicked((p) => p.filter((_, i) => i !== idx));
  }

  async function handleSubmit() {
    setError(null);
    if (!subject.trim() || !message.trim()) return;
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not signed in");
      // Upload files first (under our own prefix), then create the ticket referencing them.
      const attachments = [];
      for (const p of picked) {
        const { ref } = await uploadSupportAttachment(user.id, p.file);
        p.uploadedRef = ref;
        attachments.push({
          file_ref: ref,
          file_name: p.file.name,
          content_type: p.file.type || "application/octet-stream",
          size_bytes: p.file.size,
        });
      }
      await api.support.create({ subject: subject.trim(), message: message.trim(), attachments });
      setShowNew(false);
      setSubject("");
      setMessage("");
      picked.forEach((p) => URL.revokeObjectURL(p.preview));
      setPicked([]);
      // Refresh list
      const q = filter ? `?status=${filter}` : "";
      const r: any = await api.support.list(q);
      setTickets(r.tickets ?? []);
      setTotal(r.total ?? 0);
    } catch (e: any) {
      setError(e.message || "Failed to create ticket");
      // Best-effort cleanup of anything uploaded before the ticket insert failed.
      picked.forEach((p) => {
        if (p.uploadedRef) supabase.storage.from("support-attachments").remove([p.uploadedRef]).catch(() => {});
      });
    } finally {
      setSaving(false);
    }
  }

  function resetForm() {
    setShowNew(false);
    setError(null);
    picked.forEach((p) => URL.revokeObjectURL(p.preview));
    setPicked([]);
    setSubject("");
    setMessage("");
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
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: "block", marginBottom: 4, fontWeight: 500 }}>
              Attachments <span style={{ fontWeight: 400, color: "#777" }}>(images/videos, optional)</span>
            </label>
            <input
              type="file"
              accept="image/*,video/*"
              multiple
              disabled={picked.length >= MAX_ATTACHMENTS}
              onChange={(e) => { pickFiles(e.target.files); e.target.value = ""; }}
              style={{ fontSize: 13 }}
            />
            <p style={{ margin: "6px 0 0", fontSize: 12, color: "#777" }}>
              Files are stored on our server while the ticket is open and deleted automatically 1 month after it's resolved or closed.
            </p>
            {picked.length > 0 && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 12 }}>
                {picked.map((p, i) => (
                  <div key={i} style={{ position: "relative", width: 110, height: 110, border: "1px solid #ddd", borderRadius: 8, overflow: "hidden", background: "#fff" }}>
                    {p.file.type.startsWith("image/")
                      ? <img src={p.preview} alt={p.file.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      : p.file.type.startsWith("video/")
                        ? <video src={p.preview} muted style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        : <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", fontSize: 11, textAlign: "center", padding: 4 }}>{p.file.name}</div>}
                    <button
                      type="button"
                      onClick={() => removePick(i)}
                      title={`Remove ${p.file.name}`}
                      style={{ position: "absolute", top: 4, right: 4, width: 22, height: 22, borderRadius: "50%", border: "none", background: "rgba(0,0,0,.6)", color: "#fff", cursor: "pointer", fontSize: 13, lineHeight: 1 }}
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={handleSubmit} disabled={saving || !subject.trim() || !message.trim()}
              style={{ padding: "8px 20px", background: "#1858c7", color: "#fff", border: "none", borderRadius: 6, cursor: saving ? "wait" : "pointer", fontWeight: 500 }}>
              {saving ? "Creating…" : "Create Ticket"}
            </button>
            <button onClick={resetForm} style={{ padding: "8px 20px", background: "transparent", border: "1px solid #ddd", borderRadius: 6, cursor: "pointer" }}>
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
