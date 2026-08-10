import { useEffect, useRef, useState } from "react";
import { Link } from "react-router";
import { DisclosureBadge } from "~/components/DisclosureBadge";
import { Turnstile } from "~/components/Turnstile";
import { api, type DemoVoice } from "~/lib/api";
import { T, SANS, ctaGhost, Icon, ICON, SectionEyebrow } from "~/lib/marketing";

const SPIN = `@keyframes va-spin{to{transform:rotate(360deg)}}` +
  `.va-spinner{display:inline-block;width:13px;height:13px;border:2px solid #c7d2fe;border-top-color:#4f46e5;border-radius:50%;animation:va-spin .7s linear infinite}` +
  `@media (prefers-reduced-motion: reduce){.va-spinner{animation-duration:2s}}`;

export function meta() {
  return [
    { title: "Hear it live — Voice Narration" },
    { name: "description", content: "Type a sentence, pick a voice, and hear it narrated in seconds. Choose from preset English, Hindi and Bangla voices." },
  ];
}

// A couple of friendly sample lines so visitors can try without typing.
const SAMPLES = [
  "Once upon a time, in a village by the sea, there lived a little girl who kept the lighthouse lamp burning.",
  "The morning sun rose over the mountains, painting the snow in shades of gold and rose.",
  "A merchant set sail to distant lands, promising to return before the winter moon grew full.",
];

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
    if (!text.trim() || !voiceId) { setErr("Type something first, then pick a voice."); return; }
    if (token === null) { setErr("Please complete the quick bot check below."); return; }
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

  const ready = status === "Ready" || status === "Failed";

  return (
    <main style={{ fontFamily: SANS, background: "#fff", color: T.jet }}>
      <style>{SPIN}</style>
      <section style={{
        padding: "4rem 1.25rem 3.5rem",
        background: "radial-gradient(800px 380px at 20% 0%, #fef3c7 0%, rgba(255,255,255,0) 60%), linear-gradient(180deg,#fff,#fafbff)",
      }}>
        <div style={{ maxWidth: 760, margin: "0 auto", textAlign: "center" }}>
          <SectionEyebrow>Try it right now</SectionEyebrow>
          <h1 style={{ fontWeight: 800, fontSize: "2.6rem", letterSpacing: "-.03em", lineHeight: 1.1, margin: 0 }}>
            Hear your story <span style={{ color: T.ivy }}>come to life</span>
          </h1>
          <p style={{ color: T.body, fontSize: "1.1rem", lineHeight: 1.6, maxWidth: 560, margin: ".9rem auto 0", fontFamily: SANS }}>
            Type a sentence, choose a voice, and press play. No account, no credit card — a real narrator,
            in seconds. <DisclosureBadge />
          </p>
        </div>
      </section>

      <section style={{ padding: "0 1.25rem 4rem" }}>
        <div style={{
          maxWidth: 680, margin: "0 auto", background: "#fff", borderRadius: 22, border: `1px solid ${T.line}`,
          padding: "1.6rem", boxShadow: "0 20px 50px rgba(17,24,39,.08)",
        }}>
          {/* sample chips */}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: ".9rem" }}>
            {SAMPLES.map((s) => (
              <button key={s.slice(0, 12)} onClick={() => setText(s)}
                style={{ fontSize: ".74rem", color: T.ivy, border: `1px solid ${T.ivy}`, background: "#fff", borderRadius: 999, padding: "4px 12px", cursor: "pointer", fontWeight: 600 }}>
                Try a sample
              </button>
            ))}
          </div>

          <label style={{ fontWeight: 700, fontSize: ".86rem", display: "block", marginBottom: 6 }}>Your words</label>
          <textarea rows={4} maxLength={300} value={text} onChange={(e) => setText(e.target.value)}
            placeholder="Paste up to 300 characters… (try: “The river carried the golden leaves downstream…”)"
            style={{ width: "100%", padding: ".7rem .8rem", borderRadius: 12, border: `1.5px solid ${T.line}`, font: "inherit", fontSize: ".95rem", resize: "vertical", boxSizing: "border-box" }} />
          <div style={{ fontSize: ".78rem", color: "#9ca3af", textAlign: "right", marginTop: 3 }}>{text.length}/300</div>

          <label style={{ fontWeight: 700, fontSize: ".86rem", display: "block", margin: "1rem 0 6px" }}>Pick a voice</label>
          {voices.length > 0 ? (
            <div style={{ display: "grid", gap: 8, gridTemplateColumns: "repeat(auto-fit,minmax(170px,1fr))" }}>
              {voices.map((v) => {
                const active = v.voice_id === voiceId;
                return (
                  <button key={v.voice_id} onClick={() => setVoiceId(v.voice_id)}
                    style={{
                      textAlign: "left", cursor: "pointer", borderRadius: 12, padding: ".7rem .8rem",
                      border: active ? `2px solid ${T.ivy}` : `1px solid ${T.line}`, background: active ? "#eef2ff" : "#fff",
                      fontFamily: SANS,
                    }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ width: 26, height: 26, borderRadius: "50%", background: active ? T.ivy : "#e0e7ff", color: active ? "#fff" : T.ivy, display: "inline-flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: ".72rem" }}>
                        {v.voice_id[0]?.toUpperCase() ?? "V"}
                      </span>
                      <span style={{ fontWeight: 700, fontSize: ".86rem", color: T.jet }}>{v.voice_id}</span>
                    </div>
                    <div style={{ fontSize: ".72rem", color: T.body, marginTop: 4, textTransform: "capitalize" }}>
                      {v.language}{v.accent ? ` · ${v.accent}` : ""}
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            <p style={{ color: "#888", fontSize: ".9rem" }}>Loading voices…</p>
          )}

          <div style={{ marginTop: "1.2rem" }}>
            <Turnstile onVerify={setToken} />
          </div>

          <div style={{ display: "flex", gap: "0.8rem", marginTop: "1rem", alignItems: "center", flexWrap: "wrap" }}>
            <button onClick={generate} disabled={!!status && !ready}
              style={{
                background: T.ivy, color: "#fff", padding: ".8rem 1.5rem", borderRadius: 12, fontWeight: 800,
                fontSize: "1rem", border: "none", cursor: !!status && !ready ? "default" : "pointer",
                opacity: !!status && !ready ? 0.65 : 1, display: "inline-flex", alignItems: "center", gap: 8,
                boxShadow: "0 10px 24px rgba(79,70,229,.3)",
              }}>
              <Icon d={ICON.play} size={16} /> {!status ? "Narrate it" : status === "Ready" ? "Narrate again" : typeButtonLabel(status)}
            </button>
            <Link to="/login" style={ctaGhost}>Make full videos →</Link>
          </div>

          {err && <p style={{ color: "#b91c1c", fontWeight: 700, fontSize: ".9rem", marginTop: ".9rem" }}>{err}</p>}

          {status && status !== "Ready" && status !== "Failed" && (
            <p style={{ color: T.ivy, fontSize: ".9rem", display: "flex", alignItems: "center", gap: 8, marginTop: ".9rem" }}>
              <span className="va-spinner" /> Working on it — {labelFor(status)}
            </p>
          )}

          {audioUrl && (
            <div style={{ marginTop: "1.2rem", borderTop: `1px dashed ${T.line}`, paddingTop: "1rem" }}>
              <audio controls src={audioUrl} style={{ width: "100%" }} />
              <p style={{ fontSize: ".78rem", color: "#888", marginTop: 8 }}>
                AI-generated & watermarked. Preview links expire shortly — sign in to save your voice and stories for good.
              </p>
            </div>
          )}

          <div style={{ fontSize: ".72rem", color: "#9ca3af", marginTop: "1.2rem", display: "flex", gap: 16, flexWrap: "wrap" }}>
            <span>✓ Up to 300 characters</span>
            <span>✓ Preset voices, no account</span>
            <span>✓ Watermarked preview</span>
          </div>
        </div>

        <p style={{ textAlign: "center", marginTop: "1.8rem", fontFamily: SANS, color: T.body, fontSize: ".95rem" }}>
          Hearing is believing — <b>for your own voice, faces and full movies,</b>{" "}
          <Link to="/login" style={{ color: T.ivy, fontWeight: 700 }}>start free</Link> or see{" "}
          <Link to="/pricing" style={{ color: T.ivy, fontWeight: 700 }}>what’s included</Link>.
        </p>
      </section>
    </main>
  );
}

function labelFor(status: string): string {
  const s = (status || "").toLowerCase();
  if (s.includes("queued")) return "lined up for the narrator";
  if (s.includes("render")) return "recording your narration";
  if (s.includes("done")) return "finalising";
  return status;
}

function typeButtonLabel(status: string): string {
  const s = (status || "").toLowerCase();
  return s.includes("queued") ? "Queued…" : "Narrating…";
}