// One-time browser-notification permission prompt. Shown on first login in a new browser (the
// permission is "default" until the user decides) so that new in-app notifications also pop as
// system/OS notifications. A localStorage flag stops the banner from nagging after the user
// responds (the browser itself remembers the granted/denied choice per origin).
import { useEffect, useState } from "react";

const SEEN_KEY = "vn_notif_prompt_seen";

export function notificationGranted(): boolean {
  return typeof Notification !== "undefined" && Notification.permission === "granted";
}

export function NotificationPrompt() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (typeof Notification === "undefined") return; // not supported (e.g. older Safari)
    if (Notification.permission !== "default") return; // already answered in this browser
    if (localStorage.getItem(SEEN_KEY)) return; // already asked on this device
    setVisible(true);
  }, []);

  if (!visible) return null;

  async function enable() {
    try {
      await Notification.requestPermission();
    } catch { /* requestPermission can reject on some engines */ }
    localStorage.setItem(SEEN_KEY, "1");
    setVisible(false);
  }

  function dismiss() {
    localStorage.setItem(SEEN_KEY, "1");
    setVisible(false);
  }

  return (
    <div style={{
      background: "#eef4fe", borderBottom: "1px solid #d4e2fb", padding: "0.6rem 1.25rem",
      display: "flex", gap: 12, alignItems: "center", justifyContent: "center", flexWrap: "wrap",
      fontSize: ".85rem", color: "#1f3b66",
    }}>
      <span>
        🔔 Allow notifications? You'll get a system alert when your video plan is ready, a video finishes,
        or something goes wrong.
      </span>
      <span style={{ display: "flex", gap: 8 }}>
        <button onClick={enable} style={{
          background: "#1858c7", color: "#fff", border: "none", borderRadius: 6, padding: "0.3rem 0.9rem",
          fontSize: ".82rem", fontWeight: 600, cursor: "pointer",
        }}>Enable notifications</button>
        <button onClick={dismiss} style={{
          background: "#fff", color: "#555", border: "1px solid #c6d4ec", borderRadius: 6,
          padding: "0.3rem 0.9rem", fontSize: ".82rem", cursor: "pointer",
        }}>Not now</button>
      </span>
    </div>
  );
}