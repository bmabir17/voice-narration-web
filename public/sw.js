// Service worker for Web Push (narration.me). Registered after the user grants notification
// permission. `push` events (delivered by the browser's push service even when the app is closed)
// decrypt nothing — the payload is already decrypted by the browser from our aes128gcm body — and we
// just surface it as an OS notification. Clicking it opens the linked video.
self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("push", (event) => {
  let data = { title: "Narration", body: "", url: "/app/video" };
  try {
    const parsed = event.data ? event.data.json() : {};
    data = { title: parsed.title || "Narration", body: parsed.body || "", url: parsed.url || "/app/video" };
  } catch { /* fall back to defaults */ }

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      tag: data.url, // replaces an earlier notification for the same video
      data: { url: data.url },
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || "/app/video";
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if ("focus" in client) return client.focus(), client.navigate(url);
      }
      return self.clients.openWindow(url);
    }),
  );
});