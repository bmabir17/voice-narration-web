// Bell icon in the app nav: shows the unread count and a hover/click dropdown of recent
// notifications (plan ready for review, video done, video failed). Reads public.notifications via the
// supabase client (RLS owner-scoped) and subscribes to Realtime on that table so new rows appear the
// instant the worker inserts them. Clicking a notification opens the linked video and marks it read.
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { supabase } from "~/lib/supabase";
import { notifications, type NotificationRow } from "~/lib/api";

// On mobile the nav wraps so the bell can sit near the left edge; an absolutely-positioned dropdown
// anchored `right: 0` then overflows off-screen. Under 767px we switch the panel to fixed + viewport
// fitted (centered with side margins) so nothing gets cut off.
const BELL_CSS = `
  @media (max-width:767px){
    .va-notif-panel{position:fixed;top:calc(1rem + 8px);left:8px;right:8px;width:auto;max-width:none}
  }`;

// Raise an OS-level system notification (Web Notifications API) for a newly-created in-app
// notification, so the user gets an alert on their PC/phone even if the tab is in the background.
// Clicking the OS notification opens the linked video. No-op when permission isn't granted.
function osNotify(n: NotificationRow) {
  if (typeof Notification === "undefined" || Notification.permission !== "granted") return;
  try {
    const os = new Notification(n.title, {
      body: n.body ?? undefined,
      tag: n.id, // replaces an earlier OS notification with the same id
    });
    os.onclick = () => {
      os.close();
      window.focus();
      window.location.href = n.job_id ? `/app/video/${n.job_id}` : "/app/video";
    };
  } catch { /* some engines throw on constructor failure — in-app list still covers it */ }
}

const TYPE_META: Record<NotificationRow["type"], { color: string; icon: string; label: string }> = {
  plan_ready: { color: "#8a6d00", icon: "🗂", label: "Plan review" },
  video_ready: { color: "#137333", icon: "✅", label: "Ready" },
  video_failed: { color: "#c5221f", icon: "⚠️", label: "Failed" },
};

function timeAgo(iso: string): string {
  const s = Math.max(1, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
  if (s < 60) return `${s}s`;
  if (s < 3600) return `${Math.floor(s / 60)}m`;
  if (s < 86_400) return `${Math.floor(s / 3600)}h`;
  return `${Math.floor(s / 86_400)}d`;
}

export function NotificationsBell() {
  const navigate = useNavigate();
  const [items, setItems] = useState<NotificationRow[]>([]);
  const [open, setOpen] = useState(false);
  const openRef = useRef<number | null>(null);
  const boxRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => () => { if (openRef.current) window.clearTimeout(openRef.current); }, []);

  // Initial load + Realtime: new/changed notifications for this user land immediately.
  useEffect(() => {
    let alive = true;
    notifications.list().then(({ data, error }) => { if (alive && !error) setItems(data ?? []); });
    const ch = supabase.channel("notifications")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "notifications" },
        (p: any) => { const n = p.new as NotificationRow; setItems((v) => [n, ...v].slice(0, 50)); osNotify(n); })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "notifications" },
        (p: any) => { const n = p.new as NotificationRow; setItems((v) => v.map((x) => x.id === n.id ? n : x)); })
      .subscribe();
    return () => { alive = false; supabase.removeChannel(ch); };
  }, []);

  const unread = items.filter((n) => !n.is_read).length;

  const openSoon = () => { if (openRef.current) window.clearTimeout(openRef.current); setOpen(true); };
  const closeSoon = () => { openRef.current = window.setTimeout(() => setOpen(false), 200); };

  function openItem(n: NotificationRow) {
    setOpen(false);
    if (!n.is_read) {
      notifications.markRead(n.id).then(() =>
        setItems((v) => v.map((x) => x.id === n.id ? { ...x, is_read: true } : x)));
    }
    navigate(n.job_id ? `/app/video/${n.job_id}` : "/app/video");
  }

  function markAll() {
    notifications.markAllRead().then(() =>
      setItems((v) => v.map((x) => ({ ...x, is_read: true }))));
  }

  return (
    <div ref={boxRef} style={{ position: "relative", display: "inline-flex", alignItems: "center" }}>
      <style>{BELL_CSS}</style>
      <button
        aria-label={`Notifications${unread ? ` (${unread} unread)` : ""}`}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        onMouseEnter={openSoon}
        onMouseLeave={closeSoon}
        style={{
          position: "relative", background: "none", border: "none", cursor: "pointer",
          padding: "0.15rem", display: "inline-flex", alignItems: "center", color: "#333",
        }}
      >
        <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor"
             strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        {unread > 0 && (
          <span style={{
            position: "absolute", top: -3, right: -5, minWidth: 16, height: 16, padding: "0 4px",
            borderRadius: 9, background: "#c5221f", color: "#fff", fontSize: 10, fontWeight: 700,
            lineHeight: "16px", textAlign: "center",
          }}>{unread > 99 ? "99+" : unread}</span>
        )}
      </button>
      {open && (
        <div
          role="menu"
          onMouseEnter={openSoon}
          onMouseLeave={closeSoon}
          className="va-notif-panel"
          style={{
            position: "absolute", top: "calc(100% + 8px)", right: 0, zIndex: 80,
            width: 330, maxWidth: "calc(100vw - 32px)", background: "#fff",
            border: "1px solid #e3e3e3", borderRadius: 10, boxShadow: "0 10px 30px rgba(0,0,0,.14)",
            overflow: "hidden",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center",
                        padding: "0.6rem 0.8rem", borderBottom: "1px solid #f0f0f0" }}>
            <span style={{ fontSize: ".85rem", fontWeight: 600, color: "#222" }}>Notifications</span>
            {unread > 0 && (
              <button onClick={markAll} style={{
                background: "none", border: "none", cursor: "pointer", fontSize: ".75rem",
                color: "#1858c7", padding: 0, fontWeight: 500,
              }}>Mark all read</button>
            )}
          </div>
          <div style={{ maxHeight: 380, overflowY: "auto" }}>
            {items.length === 0 && (
              <p style={{ margin: 0, padding: "1.2rem 0.8rem", fontSize: ".82rem", color: "#777", textAlign: "center" }}>
                No notifications yet.
              </p>
            )}
            {items.map((n) => {
              const m = TYPE_META[n.type];
              return (
                <button key={n.id} role="menuitem" onClick={() => openItem(n)}
                        style={{
                          display: "flex", gap: 10, alignItems: "flex-start", textAlign: "left",
                          width: "100%", background: n.is_read ? "#fff" : "#f3f6fc",
                          border: "none", borderBottom: "1px solid #f5f5f5", padding: "0.6rem 0.8rem",
                          cursor: "pointer", font: "inherit",
                        }}>
                  <span style={{ fontSize: "1.1rem", lineHeight: 1 }} aria-hidden="true">{m.icon}</span>
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ display: "block", fontSize: ".84rem", fontWeight: 600, color: "#222" }}>
                      {n.title}
                    </span>
                    {n.body && (
                      <span style={{ display: "block", fontSize: ".78rem", color: "#555", marginTop: 2,
                                     overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {n.body}
                      </span>
                    )}
                    <span style={{ display: "block", fontSize: ".72rem", color: "#999", marginTop: 3 }}>
                      {m.label} · {timeAgo(n.created_at)}
                    </span>
                  </span>
                  {!n.is_read && (
                    <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#1858c7",
                                   marginTop: 4, flexShrink: 0 }} aria-hidden="true" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}