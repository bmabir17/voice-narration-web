import { useEffect, useState } from "react";

// Paddle "default payment link" target. v1-billing creates a transaction server-side and returns a
// checkout.url of the form `<this page>?_ptxn=txn_…`; the browser lands here, Paddle.js initializes,
// and (because _ptxn is in the URL) auto-opens the overlay checkout for that transaction. On success
// Paddle redirects to /app/billing?status=success. This page is public — the _ptxn is the credential.
const CLIENT_TOKEN = import.meta.env.VITE_PADDLE_CLIENT_TOKEN as string | undefined;
const PADDLE_JS = "https://cdn.paddle.com/paddle/v2/paddle.js";

declare global {
  interface Window {
    // deno-lint-ignore no-explicit-any
    Paddle?: any;
  }
}

export function meta() {
  return [
    { title: "Checkout — Voice Narration" },
    { name: "robots", content: "noindex" }, // not a landing page; don't index the bridge
  ];
}

export default function Pay() {
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!CLIENT_TOKEN) { setErr("Checkout isn't configured yet — please try again shortly."); return; }
    const ptxn = new URLSearchParams(window.location.search).get("_ptxn");
    if (!ptxn) { setErr("No checkout in progress. Start from the Pricing page."); return; }

    let cancelled = false;
    loadPaddle().then(() => {
      if (cancelled || !window.Paddle) return;
      // Sandbox client tokens are prefixed `test_`; production `live_`.
      if (CLIENT_TOKEN.startsWith("test_")) window.Paddle.Environment.set("sandbox");
      const successUrl = `${window.location.origin}${import.meta.env.BASE_URL}app/billing?status=success`;
      // Paddle.js auto-opens the checkout for the _ptxn transaction after Initialize.
      window.Paddle.Initialize({ token: CLIENT_TOKEN, checkout: { settings: { successUrl } } });
    }).catch(() => setErr("Couldn't load the payment form. Please try again."));
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <main style={{ maxWidth: 520, margin: "0 auto", padding: "4rem 1.25rem", textAlign: "center" }}>
      <h1>Opening secure checkout…</h1>
      <p style={{ color: "#666" }}>Your payment form is loading in an overlay, handled by Paddle.</p>
      {err && <p style={{ color: "crimson" }}>{err} <a href={`${import.meta.env.BASE_URL}pricing`}>Back to pricing</a></p>}
      <noscript>JavaScript is required to complete checkout.</noscript>
    </main>
  );
}

function loadPaddle(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.Paddle) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = PADDLE_JS;
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("paddle.js failed to load"));
    document.head.appendChild(s);
  });
}
