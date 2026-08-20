// One-time browser-notification permission prompt. Shown on first login in a new browser (the
// permission is "default" until the user decides) so that new in-app notifications also pop as
// system/OS notifications. A localStorage flag stops the banner from nagging after the user
// responds (the browser itself remembers the granted/denied choice per origin).
//
// When the user enables notifications we also register the service worker and subscribe to Web Push
// (VAPID via /v1-push) so OS notifications arrive even when the tab/app is closed.
import { useEffect, useState } from "react";
import { api } from "~/lib/api";

const SEEN_KEY = "vn_notif_prompt_seen";

export function notificationGranted(): boolean {
  return typeof Notification !== "undefined" && Notification.permission === "granted";
}

// Register sw.js and subscribe to web push for this browser, then sync the subscription with the
// server. Called after the user grants permission. Best-effort: failures here never block the app.
export async function enableWebPush(): Promise<boolean> {
  try {
    if (typeof navigator === "undefined" || !("serviceWorker" in navigator) || !("PushManager" in window)) {
      return false;
    }
    const reg = await navigator.serviceWorker.register("/sw.js");
    const { publicKey } = await api.pushPublicKey();
    const sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: b64urlToUint8Array(publicKey),
    });
    await api.pushSubscribe({
      endpoint: sub.endpoint,
      keys: { p256dh: b64urlSafe(sub.getKey("p256dh")), auth: b64urlSafe(sub.getKey("auth")) },
    });
    return true;
  } catch {
    return false; // e.g. iOS PWA-only, push server unreachable, permission quirk
  }
}

function b64urlToUint8Array(b64: string): Uint8Array {
  const s = b64.replace(/-/g, "+").replace(/_/g, "/");
  const pad = s.length % 4 ? "=".repeat(4 - (s.length % 4)) : "";
  const bin = atob(s + pad);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}
function b64urlSafe(buf: ArrayBuffer | null): string {
  if (!buf) return "";
  const bytes = new Uint8Array(buf);
  let bin = "";
  for (const x of bytes) bin += String.fromCharCode(x);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
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
    if (Notification.permission === "granted") await enableWebPush();
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