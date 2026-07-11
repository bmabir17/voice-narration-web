import { useEffect, useRef, useState } from "react";
import { DisclosureBadge } from "~/components/DisclosureBadge";
import { Turnstile } from "~/components/Turnstile";
import { api, type DemoVoice } from "~/lib/api";

export function meta() {
  return [
    { title: "Live demo — Voice Narration" },
    { name: "description", content: "Hear Bangla and South-Asian-English AI narration. Preset voices, capped length." },
  ];
}

// Unauthenticated playground: preset voices only, ≤300 chars, Cloudflare Turnstile + per-IP rate
// limits enforced by the v1-demo endpoint. Output carries the disclosure badge.
export default function Demo() {
  const [voices, setVoices] = useState<DemoVoice[]>([]);
  const [voiceId, setVoiceId] = useState("");
  const [text, setText] = useState("");
  const [token, setToken] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const poller = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    api.demoPresets()
      .then((r) => { setVoices(r.voices); if (r.voices[0]) setVoiceId(r.voices[0].voice_id); })
      .catch((e) => setErr(e.message));
    return () => { if (poller.current) clearInterval(poller.current); };
  }, []);

  async function generate() {
    setErr(null); setAudioUrl(null);
    if (!text.trim() || !voiceId) { setErr("Enter some text and pick a voice."); return; }
    if (token === null) { setErr("Please complete the bot check first."); return; }
    setStatus("Queued…");
    try {
      const { job_id } = await api.demoSubmit({ text, voice_id: voiceId, turnstile_token: token ?? "" });
      poller.current = setInterval(async () => {
        try {
          const r = await api.demoResult(job_id);
          setStatus(r.status);
          if (r.status === "completed") {
            if (poller.current) clearInterval(poller.current);
            setAudioUrl(r.url ?? null);
            setStatus(r.url ? "Ready" : "Completed (no audio)");
          } else if (r.status === "failed") {
            if (poller.current) clearInterval(poller.current);
            setStatus("Failed");
          }
        } catch { /* keep polling */ }
      }, 2500);
    } catch (e: any) {
      setStatus(null);
      setErr(e.message);
    }
  }

  return (
    <main style={{ maxWidth: 720, margin: "0 auto", padding: "3rem 1.25rem" }}>
      <h1>Live demo</h1>
      <p>Type a short passage and hear a preset voice. <DisclosureBadge /></p>

      {voices.length > 0 && (
        <select value={voiceId} onChange={(e) => setVoiceId(e.target.value)}
                style={{ padding: "0.5rem", marginBottom: "0.6rem" }}>
          {voices.map((v) => (
            <option key={v.voice_id} value={v.voice_id}>
              {v.voice_id} — {v.language}{v.accent ? ` (${v.accent})` : ""}
            </option>
          ))}
        </select>
      )}

      <textarea rows={4} maxLength={300} value={text} onChange={(e) => setText(e.target.value)}
                placeholder="Paste up to 300 characters…" style={{ width: "100%", padding: "0.6rem" }} />
      <div style={{ fontSize: "0.8rem", color: "#888" }}>{text.length}/300</div>

      <Turnstile onVerify={setToken} />

      <button onClick={generate} disabled={!!status && status !== "Ready" && status !== "Failed"}
              style={{ marginTop: "0.8rem", padding: "0.6rem 1.2rem" }}>
        Generate preview
      </button>

      {status && <p style={{ color: "#555" }}>Status: {status}</p>}
      {err && <p style={{ color: "crimson" }}>{err}</p>}
      {audioUrl && (
        <div style={{ marginTop: "1rem" }}>
          <audio controls src={audioUrl} style={{ width: "100%" }} />
          <p style={{ fontSize: "0.8rem", color: "#888" }}>AI-generated & watermarked. Preview links expire shortly.</p>
        </div>
      )}
    </main>
  );
}
