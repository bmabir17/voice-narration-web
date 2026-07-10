// Lemon Squeezy hosted overlay. Client role only: open the overlay with the user's id as custom
// data; the SERVER webhook provisions the key + quota and writes the entitlement row we then read.
declare global {
  interface Window {
    createLemonSqueezy?: () => void;
    LemonSqueezy?: { Url: { Open: (url: string) => void } };
  }
}

export function loadLemon(): Promise<void> {
  return new Promise((resolve) => {
    if (window.LemonSqueezy) return resolve();
    const s = document.createElement("script");
    s.src = "https://app.lemonsqueezy.com/js/lemon.js";
    s.defer = true;
    s.onload = () => { window.createLemonSqueezy?.(); resolve(); };
    document.head.appendChild(s);
  });
}

export async function openCheckout(checkoutUrl: string, userId: string, email: string) {
  await loadLemon();
  const url = new URL(checkoutUrl);
  url.searchParams.set("checkout[custom][user_id]", userId);
  url.searchParams.set("checkout[email]", email);
  window.LemonSqueezy?.Url.Open(url.toString());
}
