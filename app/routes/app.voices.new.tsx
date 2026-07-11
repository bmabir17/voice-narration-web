import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router";
import { api, uploadReferenceAudio } from "~/lib/api";
import { supabase } from "~/lib/supabase";
import { ConsentGate, CONSENT_STATEMENT_VERSION } from "~/components/ConsentGate";
import { RetentionNotice } from "~/components/DisclosureBadge";

export default function NewVoice() {
  const navigate = useNavigate();
  const [file, setFile] = useState<File | null>(null);
  const [name, setName] = useState("");
  const [language, setLanguage] = useState("bn");
  const [agreed, setAgreed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [canClone, setCanClone] = useState<boolean | null>(null); // null = still checking plan
  const [tier, setTier] = useState<string>("");

  useEffect(() => {
    // Cloning is a paid feature; check the plan up-front so free users get a clear upgrade prompt
    // instead of filling the form and uploading only to be rejected. Default to allowing if the
    // limit field is absent (older v1-usage) — the server stays authoritative on submit.
    api.usage()
      .then((u: any) => { setTier(u.tier ?? ""); setCanClone((u.max_custom_voices ?? 1) > 0); })
      .catch(() => setCanClone(true));
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!file || !agreed) return;
    setBusy(true); setErr(null);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const voiceId = `vox_${name.toLowerCase().replace(/[^a-z0-9]+/g, "_").slice(0, 24)}_${Date.now().toString(36)}`;
      // 1) upload reference audio straight to the private bucket (RLS-scoped)
      const { ref, sha256 } = await uploadReferenceAudio(user!.id, voiceId, file);
      // 2) register + attest consent (server records the authoritative log: IP/UA/timestamp)
      await api.cloneVoice({
        voice_id: voiceId, language, reference_audio_ref: ref, reference_audio_sha256: sha256,
        consent_checkbox: true, consent_statement_version: CONSENT_STATEMENT_VERSION,
      });
      navigate("/app/narrate");
    } catch (e: any) { setErr(e.message); } finally { setBusy(false); }
  }

  if (canClone === false) {
    return (
      <main style={{ maxWidth: 640, margin: "0 auto", padding: "2rem 1.25rem" }}>
        <h1>Add your voice</h1>
        <p>Voice cloning is available on the <strong>Creator</strong> plan and above. Your current plan
          {tier ? ` (${tier})` : ""} doesn't include custom voices.</p>
        <Link to="/pricing" style={{ display: "inline-block", padding: "0.7rem 1.3rem",
          background: "#1a73e8", color: "#fff", borderRadius: 6, textDecoration: "none" }}>
          See plans
        </Link>
      </main>
    );
  }

  return (
    <main style={{ maxWidth: 640, margin: "0 auto", padding: "2rem 1.25rem" }}>
      <h1>Add your voice</h1>
      <p>Upload a clean 5–10 second sample of the voice you want to clone.</p>
      <form onSubmit={submit} style={{ display: "grid", gap: "1rem" }}>
        <input placeholder="Voice name (e.g. My Narrator)" value={name} required
               onChange={(e) => setName(e.target.value)} style={{ padding: "0.5rem" }} />
        <label>Language
          <select value={language} onChange={(e) => setLanguage(e.target.value)} style={{ padding: "0.5rem" }}>
            <option value="bn">Bangla</option>
            <option value="en-IN">South-Asian English</option>
            <option value="hi">Hindi</option>
          </select>
        </label>
        <label style={{ display: "grid", gap: "0.35rem" }}>
          <span>Reference audio</span>
          <input type="file" required
                 accept=".wav,.mp3,.m4a,.aac,.flac,.ogg,audio/*"
                 onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
          <small style={{ color: "#666" }}>
            WAV, MP3, M4A/AAC, FLAC or OGG · 5–10 s of clean, single-speaker speech (no music or background noise).
          </small>
        </label>
        <ConsentGate onChange={setAgreed} />
        <button disabled={busy || !agreed || !file} style={{ padding: "0.7rem 1.3rem" }}>
          {busy ? "Uploading…" : "Create voice"}
        </button>
        {err && <p style={{ color: "crimson" }}>{err}</p>}
      </form>
      <RetentionNotice />
    </main>
  );
}
