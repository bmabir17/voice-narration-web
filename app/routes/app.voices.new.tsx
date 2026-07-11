import { useEffect, useRef, useState } from "react";
import { useNavigate, Link } from "react-router";
import { api, uploadReferenceAudio } from "~/lib/api";
import { supabase } from "~/lib/supabase";
import { ConsentGate, CONSENT_STATEMENT_VERSION } from "~/components/ConsentGate";
import { RetentionNotice } from "~/components/DisclosureBadge";

const MAX_RECORD_SECONDS = 30;

export default function NewVoice() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"upload" | "record">("upload");
  const [file, setFile] = useState<Blob | null>(null);
  const [name, setName] = useState("");
  const [language, setLanguage] = useState("bn");
  const [agreed, setAgreed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [canClone, setCanClone] = useState<boolean | null>(null); // null = still checking plan
  const [tier, setTier] = useState<string>("");

  // Recording state
  const [canRecord, setCanRecord] = useState(false);
  const [recording, setRecording] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    // Cloning is a paid feature; check the plan up-front so free users get a clear upgrade prompt
    // instead of filling the form and uploading only to be rejected. Default to allowing if the
    // limit field is absent (older v1-usage) — the server stays authoritative on submit.
    api.usage()
      .then((u: any) => { setTier(u.tier ?? ""); setCanClone((u.max_custom_voices ?? 1) > 0); })
      .catch(() => setCanClone(true));
    // Feature-detect mic capture (guards SSR / unsupported browsers).
    setCanRecord(typeof navigator !== "undefined" && !!navigator.mediaDevices?.getUserMedia
                 && typeof MediaRecorder !== "undefined");
    return () => { stopTick(); recorderRef.current?.state === "recording" && recorderRef.current.stop(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function stopTick() { if (tickRef.current) { clearInterval(tickRef.current); tickRef.current = null; } }

  function clearRecording() {
    setFile(null);
    if (previewUrl) { URL.revokeObjectURL(previewUrl); setPreviewUrl(null); }
  }

  async function startRecording() {
    setErr(null); clearRecording();
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      chunksRef.current = [];
      mr.ondataavailable = (e) => { if (e.data.size) chunksRef.current.push(e.data); };
      mr.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunksRef.current, { type: mr.mimeType || "audio/webm" });
        setFile(blob);
        setPreviewUrl(URL.createObjectURL(blob));
      };
      mr.start();
      recorderRef.current = mr;
      setRecording(true); setElapsed(0);
      tickRef.current = setInterval(() => {
        setElapsed((s) => {
          const n = s + 1;
          if (n >= MAX_RECORD_SECONDS) stopRecording();
          return n;
        });
      }, 1000);
    } catch {
      setErr("Microphone access was denied or is unavailable.");
    }
  }

  function stopRecording() {
    stopTick();
    if (recorderRef.current?.state === "recording") recorderRef.current.stop();
    setRecording(false);
  }

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

  const tabStyle = (active: boolean) => ({
    padding: "0.4rem 0.9rem", cursor: "pointer", border: "1px solid #ccc",
    background: active ? "#1a73e8" : "#fff", color: active ? "#fff" : "#333",
  });

  return (
    <main style={{ maxWidth: 640, margin: "0 auto", padding: "2rem 1.25rem" }}>
      <h1>Add your voice</h1>
      <p>Provide a clean 5–10 second sample of the voice you want to clone.</p>
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

        {/* Source: upload a file OR record from the mic */}
        <div style={{ display: "grid", gap: "0.6rem" }}>
          <div style={{ display: "flex", borderRadius: 6, overflow: "hidden", width: "fit-content" }}>
            <button type="button" onClick={() => { setMode("upload"); clearRecording(); }} style={tabStyle(mode === "upload")}>
              Upload file
            </button>
            {canRecord && (
              <button type="button" onClick={() => { setMode("record"); setFile(null); }} style={tabStyle(mode === "record")}>
                Record
              </button>
            )}
          </div>

          {mode === "upload" ? (
            <label style={{ display: "grid", gap: "0.35rem" }}>
              <input type="file" required={mode === "upload"}
                     accept=".wav,.mp3,.m4a,.aac,.flac,.ogg,audio/*"
                     onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
              <small style={{ color: "#666" }}>
                WAV, MP3, M4A/AAC, FLAC or OGG · 5–10 s of clean, single-speaker speech (no music or background noise).
              </small>
            </label>
          ) : (
            <div style={{ display: "grid", gap: "0.5rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                {!recording ? (
                  <button type="button" onClick={startRecording} style={{ padding: "0.5rem 1rem" }}>
                    {previewUrl ? "● Re-record" : "● Start recording"}
                  </button>
                ) : (
                  <button type="button" onClick={stopRecording} style={{ padding: "0.5rem 1rem", color: "crimson" }}>
                    ■ Stop
                  </button>
                )}
                {recording && (
                  <span style={{ color: "crimson" }}>
                    ● Recording… {elapsed}s / {MAX_RECORD_SECONDS}s
                  </span>
                )}
              </div>
              {previewUrl && !recording && <audio controls src={previewUrl} style={{ width: "100%" }} />}
              <small style={{ color: "#666" }}>
                Record 5–10 s of clean, single-speaker speech in a quiet room. Grant microphone access when prompted.
              </small>
            </div>
          )}
        </div>

        <ConsentGate onChange={setAgreed} />
        <button disabled={busy || !agreed || !file || recording} style={{ padding: "0.7rem 1.3rem" }}>
          {busy ? "Uploading…" : "Create voice"}
        </button>
        {err && <p style={{ color: "crimson" }}>{err}</p>}
      </form>
      <RetentionNotice />
    </main>
  );
}
