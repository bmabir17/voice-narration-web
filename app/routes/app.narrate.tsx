import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { api } from "~/lib/api";

interface Voice { voice_id: string; language: string; accent: string | null; model: string; source: string; }

export default function Narrate() {
  const navigate = useNavigate();
  const [voices, setVoices] = useState<Voice[]>([]);
  const [voiceId, setVoiceId] = useState("");
  const [language, setLanguage] = useState("bn");
  const [text, setText] = useState("");
  const [format, setFormat] = useState<"mp3" | "wav">("mp3");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    api.listVoices().then((r: any) => {
      setVoices(r.voices);
      if (r.voices[0]) { setVoiceId(r.voices[0].voice_id); setLanguage(r.voices[0].language); }
    }).catch(() => {});
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setErr(null);
    try {
      await api.submitJob({
        language, voice_id: voiceId, text,
        output: { format, chaptering: "acx" },
        idempotency_key: crypto.randomUUID(),
      });
      navigate("/app/dashboard");
    } catch (e: any) { setErr(e.message); } finally { setBusy(false); }
  }

  return (
    <main style={{ maxWidth: 720, margin: "0 auto", padding: "2rem 1.25rem" }}>
      <h1>New narration</h1>
      <form onSubmit={submit} style={{ display: "grid", gap: "0.9rem" }}>
        <label>Voice
          <select value={voiceId} onChange={(e) => {
            setVoiceId(e.target.value);
            const v = voices.find((x) => x.voice_id === e.target.value);
            if (v) setLanguage(v.language);
          }} style={{ width: "100%", padding: "0.5rem" }}>
            {voices.map((v) => (
              <option key={v.voice_id} value={v.voice_id}>
                {v.voice_id} — {v.language}{v.accent ? ` (${v.accent})` : ""} {v.source === "cloned" ? "· yours" : ""}
              </option>
            ))}
          </select>
        </label>
        <label>Manuscript text
          <textarea rows={12} required value={text} onChange={(e) => setText(e.target.value)}
                    placeholder="Paste your manuscript. Use '# Chapter N' headings to chapter it."
                    style={{ width: "100%", padding: "0.6rem" }} />
        </label>
        <label>Format
          <select value={format} onChange={(e) => setFormat(e.target.value as "mp3" | "wav")}
                  style={{ padding: "0.5rem" }}>
            <option value="mp3">MP3 192 kbps (ACX)</option>
            <option value="wav">WAV 44.1 kHz</option>
          </select>
        </label>
        <button disabled={busy || !voiceId} style={{ padding: "0.7rem 1.3rem" }}>
          {busy ? "Submitting…" : "Generate narration"}
        </button>
        {err && <p style={{ color: "crimson" }}>{err}</p>}
      </form>
    </main>
  );
}
