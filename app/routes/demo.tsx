import { DisclosureBadge } from "~/components/DisclosureBadge";

export function meta() {
  return [
    { title: "Live demo — Voice Narration" },
    { name: "description", content: "Hear Bangla and South-Asian-English AI narration. Preset voices, capped length." },
  ];
}

// Unauthenticated playground: preset voices only, short cap, Cloudflare Turnstile + a dedicated
// rate-limited public endpoint (wired at integration time). Output carries the disclosure badge.
export default function Demo() {
  return (
    <main style={{ maxWidth: 720, margin: "0 auto", padding: "3rem 1.25rem" }}>
      <h1>Live demo</h1>
      <p>Type a short passage and hear a preset voice. <DisclosureBadge /></p>
      <textarea rows={4} maxLength={300} placeholder="Paste up to 300 characters…"
                style={{ width: "100%", padding: "0.6rem" }} />
      {/* Turnstile widget + POST to the public demo endpoint go here. */}
      <button style={{ marginTop: "0.8rem", padding: "0.6rem 1.2rem" }}>Generate preview</button>
    </main>
  );
}
