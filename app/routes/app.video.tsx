import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router";
import { api, uploadFaceImage, type SubmitVideoInput, type VideoJobRow } from "~/lib/api";
import { supabase } from "~/lib/supabase";
import { DisclosureBadge } from "~/components/DisclosureBadge";

const ACCENT = "#1a73e8";
const BUILTIN_STYLES = [
  "moody cinematic, cold blue palette, 35mm film grain",
  "warm pixar-style 3d render, soft morning light",
  "epic fantasy concept art, dramatic lighting, painterly",
  "anime cel-shaded, vibrant colors, Ghibli-inspired",
  "gritty film noir, high-contrast black and white, deep shadows",
  "dreamy watercolor storybook, soft pastel palette",
  "photorealistic, natural daylight, shallow depth of field",
  "retro 80s synthwave, neon glow, VHS grain",
  "claymation stop-motion, tactile handcrafted textures",
  "cyberpunk city, rain-soaked neon, Blade Runner aesthetic",
  "vintage 1950s technicolor, saturated, soft bloom",
  "minimal flat vector illustration, bold shapes, clean",
];
const PRESET_KEY = "va_video_style_presets";
const label: React.CSSProperties = { fontSize: ".82rem", fontWeight: 600, color: "#333", display: "block", marginBottom: 4 };
const field: React.CSSProperties = { padding: "0.5rem", border: "1px solid #ccc", borderRadius: 6, width: "100%", font: "inherit" };
const row: React.CSSProperties = { display: "flex", gap: "0.9rem", flexWrap: "wrap", marginTop: "1rem" };
const cell: React.CSSProperties = { flex: 1, minWidth: 150 };

const STATUS_COLOR: Record<string, string> = {
  completed: "#137333", failed: "#c5221f", cancelled: "#8a6d00", awaiting_plan: "#8a6d00",
  planning: ACCENT, rendering: ACCENT, assembling: ACCENT, qa: ACCENT, claimed: ACCENT, queued: "#8a6d00",
};

function loadPresets(): string[] { try { return JSON.parse(localStorage.getItem(PRESET_KEY) || "[]"); } catch { return []; } }

export default function VideoNew() {
  const navigate = useNavigate();
  // core fields
  const [manuscript, setManuscript] = useState("");
  const [style, setStyle] = useState("");
  const [saved, setSaved] = useState<string[]>([]);
  const [aspect, setAspect] = useState("16:9");
  const [language, setLanguage] = useState("en");
  const [voiceId, setVoiceId] = useState("");
  const [voices, setVoices] = useState<any[]>([]);
  const [faces, setFaces] = useState<File[]>([]);
  const [faceConsent, setFaceConsent] = useState(false);
  // toggles + review
  const [music, setMusic] = useState(true);
  const [keyframes, setKeyframes] = useState(false);
  const [continuity, setContinuity] = useState(false);
  const [review, setReview] = useState<"manual" | "auto">("manual");
  // advanced
  const [candidates, setCandidates] = useState(2);
  const [crossfade, setCrossfade] = useState(0.4);
  const [shots, setShots] = useState<string>("");
  const [fps, setFps] = useState(16);
  const [plannerModel, setPlannerModel] = useState("");
  const [remoteLlm, setRemoteLlm] = useState(false);
  const [videoModel, setVideoModel] = useState("");
  const [mode, setMode] = useState<"deterministic" | "agentic">("deterministic");
  const [quality, setQuality] = useState(false);
  const [distill, setDistill] = useState(1.0);
  const [showAdvanced, setShowAdvanced] = useState(false);
  // submit + jobs
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [jobs, setJobs] = useState<VideoJobRow[]>([]);

  useEffect(() => {
    setSaved(loadPresets());
    api.listVoices().then((r: any) => setVoices(r.voices ?? [])).catch(() => {});
    const refresh = () => api.listVideoJobs().then((r) => setJobs(r.jobs)).catch(() => {});
    refresh();
    const ch = supabase.channel("video_jobs_list")
      .on("postgres_changes", { event: "*", schema: "public", table: "video_jobs" }, refresh)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  function savePreset() {
    const v = style.trim();
    if (!v || BUILTIN_STYLES.includes(v) || saved.includes(v)) return;
    const next = [...saved, v];
    localStorage.setItem(PRESET_KEY, JSON.stringify(next));
    setSaved(next);
  }
  function removePreset(v: string) {
    const next = saved.filter((x) => x !== v);
    localStorage.setItem(PRESET_KEY, JSON.stringify(next));
    setSaved(next);
    if (style === v) setStyle("");
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!manuscript.trim()) { setErr("Manuscript is required."); return; }
    if (faces.length && !faceConsent) { setErr("Please confirm you have the right to use these faces."); return; }
    setBusy(true); setErr(null);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      // upload ad-hoc cast faces to Storage → keys
      const character_refs: string[] = [];
      for (const f of faces) { const { ref } = await uploadFaceImage(user!.id, f); character_refs.push(ref); }
      const input: SubmitVideoInput = {
        manuscript: manuscript.trim(), style_brief: style.trim() || null, aspect, fps,
        language, voice_id: voiceId || null,
        character_refs, face_consent: faceConsent,
        opts: {
          candidates, crossfade, shots: shots ? Number(shots) : null, music, keyframes, continuity,
          mode, planner_model: plannerModel.trim() || null, remote_llm: remoteLlm,
          video_model: videoModel || null, quality, causvid_strength: distill,
          auto_approve: review === "auto",
        },
        idempotency_key: crypto.randomUUID(),
      };
      const { job_id } = await api.submitVideoJob(input);
      navigate(`/app/video/${job_id}`);
    } catch (e: any) { setErr(e.message); } finally { setBusy(false); }
  }

  return (
    <main style={{ maxWidth: 820, margin: "0 auto", padding: "2rem 1.25rem" }}>
      <h1 style={{ display: "flex", alignItems: "center", gap: 10 }}>New video <DisclosureBadge /></h1>
      <p style={{ color: "#666", marginTop: 0 }}>A story manuscript → a narrated, subtitled video. Renders on the home GPU; you can review the planned shots before it renders.</p>

      <form onSubmit={submit} style={{ display: "grid", gap: 0 }}>
        <div>
          <label style={label} htmlFor="manuscript">Manuscript</label>
          <textarea id="manuscript" value={manuscript} onChange={(e) => setManuscript(e.target.value)}
            rows={5} required placeholder="A lighthouse keeper watches the first storm of autumn roll in over black water…"
            style={{ ...field, resize: "vertical" }} />
        </div>

        {/* Style brief with presets */}
        <div style={{ marginTop: "1rem" }}>
          <label style={label}>Style brief <span style={{ fontWeight: 400, color: "#888" }}>— pick a preset or type your own</span></label>
          <div style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap" }}>
            <select value={BUILTIN_STYLES.includes(style) || saved.includes(style) ? style : ""}
              onChange={(e) => e.target.value && setStyle(e.target.value)} style={{ ...field, flex: 1, minWidth: 200 }}>
              <option value="">— preset (optional) —</option>
              <optgroup label="Presets">
                {BUILTIN_STYLES.map((s) => (<option key={s} value={s}>{s}</option>))}
              </optgroup>
              {saved.length > 0 ? (
                <optgroup label="Saved">
                  {saved.map((s) => (<option key={s} value={s}>{s}</option>))}
                </optgroup>
              ) : null}
            </select>
            <input value={style} onChange={(e) => setStyle(e.target.value)} placeholder="or type your own style…"
              style={{ ...field, flex: 2, minWidth: 200 }} />
            <button type="button" onClick={savePreset} style={ghostBtn}>+ Save</button>
            {saved.includes(style) && <button type="button" onClick={() => removePreset(style)} style={{ ...ghostBtn, color: "#c5221f", borderColor: "#e0b4b4" }}>✕</button>}
          </div>
        </div>

        <div style={row}>
          <div style={cell}>
            <label style={label}>Aspect</label>
            <select value={aspect} onChange={(e) => setAspect(e.target.value)} style={field}>
              <option>16:9</option><option>9:16</option><option>1:1</option>
            </select>
          </div>
          <div style={cell}>
            <label style={label}>Narration language</label>
            <select value={language} onChange={(e) => setLanguage(e.target.value)} style={field}>
              <option value="en">English</option><option value="hi">हिन्दी · Hindi</option><option value="bn">বাংলা · Bangla</option>
            </select>
          </div>
          <div style={{ ...cell, minWidth: 200 }}>
            <label style={label}>Narration voice</label>
            <select value={voiceId} onChange={(e) => setVoiceId(e.target.value)} style={field}>
              <option value="">Default voice</option>
              {voices.map((v: any) => <option key={v.voice_id} value={v.voice_id}>{v.voice_id} ({v.language})</option>)}
            </select>
          </div>
        </div>

        {/* Cast faces */}
        <div style={{ marginTop: "1rem", border: "1px solid #e5e5e5", borderRadius: 8, padding: "0.9rem" }}>
          <label style={label}>Cast a person's face <span style={{ fontWeight: 400, color: "#888" }}>— optional; a clear frontal photo appears in the shots</span></label>
          <input type="file" accept="image/*" multiple onChange={(e) => setFaces(Array.from(e.target.files ?? []))} />
          {faces.length > 0 && (
            <>
              <div style={{ fontSize: ".8rem", color: "#555", marginTop: 6 }}>{faces.length} face(s) selected: {faces.map((f) => f.name).join(", ")}</div>
              <label style={{ display: "flex", gap: 8, alignItems: "flex-start", marginTop: 8, fontSize: ".85rem" }}>
                <input type="checkbox" checked={faceConsent} onChange={(e) => setFaceConsent(e.target.checked)} />
                <span>I have the right to use {faces.length > 1 ? "these people's" : "this person's"} likeness. Generated video is AI-synthesized and labeled.</span>
              </label>
            </>
          )}
        </div>

        {/* Toggles */}
        <div style={{ display: "flex", gap: "1.3rem", flexWrap: "wrap", marginTop: "1.1rem" }}>
          <label style={chk}><input type="checkbox" checked={music} onChange={(e) => setMusic(e.target.checked)} /> music bed</label>
          <label style={chk}><input type="checkbox" checked={keyframes} onChange={(e) => setKeyframes(e.target.checked)} /> keyframes (image→video)</label>
          <label style={chk}><input type="checkbox" checked={continuity} onChange={(e) => setContinuity(e.target.checked)} /> continuity chaining</label>
        </div>

        {/* Review */}
        <div style={{ marginTop: "1.1rem", display: "grid", gap: 8 }}>
          <label style={radio}><input type="radio" name="review" checked={review === "manual"} onChange={() => setReview("manual")} />
            <span><b>Review plan before render</b><br /><small style={{ color: "#777" }}>pause to approve/edit the planned shots</small></span></label>
          <label style={radio}><input type="radio" name="review" checked={review === "auto"} onChange={() => setReview("auto")} />
            <span><b>Skip review — auto-accept</b><br /><small style={{ color: "#777" }}>render everything the planner generates</small></span></label>
        </div>

        {/* Advanced */}
        <div style={{ marginTop: "1rem" }}>
          <button type="button" onClick={() => setShowAdvanced((v) => !v)} style={{ ...ghostBtn, border: "none", padding: 0, color: "#555" }}>
            {showAdvanced ? "▾" : "▸"} Advanced
          </button>
          {showAdvanced && (
            <div style={{ marginTop: "0.6rem" }}>
              <div style={row}>
                <div style={cell}><label style={label}>Candidates (best-of-N)</label><input type="number" min={1} max={4} value={candidates} onChange={(e) => setCandidates(+e.target.value)} style={field} /></div>
                <div style={cell}><label style={label}>Crossfade (s)</label><input type="number" min={0} max={2} step={0.1} value={crossfade} onChange={(e) => setCrossfade(+e.target.value)} style={field} /></div>
                <div style={cell}><label style={label}>Shots cap</label><input type="number" min={1} max={12} value={shots} placeholder="all" onChange={(e) => setShots(e.target.value)} style={field} /></div>
                <div style={cell}><label style={label}>FPS</label><input type="number" min={8} max={30} value={fps} onChange={(e) => setFps(+e.target.value)} style={field} /></div>
              </div>
              <div style={row}>
                <div style={{ ...cell, minWidth: 220 }}><label style={label}>Video model (all shots)</label>
                  <select value={videoModel} onChange={(e) => setVideoModel(e.target.value)} style={field}>
                    <option value="">WAN — default (1.3B fast, 5B hero)</option>
                    <option value="ltx2_t2v">LTX-2.3 22B — high quality, slow</option>
                  </select></div>
                <div style={cell}><label style={label}>Orchestration</label>
                  <select value={mode} onChange={(e) => setMode(e.target.value as any)} style={field}>
                    <option value="deterministic">deterministic</option><option value="agentic">agentic</option>
                  </select></div>
              </div>
              <div style={row}>
                <div style={{ ...cell, minWidth: 220 }}><label style={label}>Planner model (blank = default)</label><input value={plannerModel} onChange={(e) => setPlannerModel(e.target.value)} placeholder="google/gemma-4-12b" style={field} /></div>
                <div style={{ ...cell, display: "flex", gap: 16, alignItems: "center", marginTop: 22 }}>
                  <label style={chk}><input type="checkbox" checked={remoteLlm} onChange={(e) => setRemoteLlm(e.target.checked)} /> remote LM Studio</label>
                  <label style={chk}><input type="checkbox" checked={quality} onChange={(e) => setQuality(e.target.checked)} /> higher quality</label>
                </div>
              </div>
              <div style={row}>
                <div style={cell}><label style={label}>Distill strength</label><input type="number" min={0} max={1} step={0.1} value={distill} onChange={(e) => setDistill(+e.target.value)} style={{ ...field, maxWidth: 100 }} /></div>
              </div>
              <p style={{ fontSize: ".78rem", color: "#888" }}>Keyframes / continuity / a cast force the deterministic driver (image→video runs there only).</p>
            </div>
          )}
        </div>

        <div style={{ marginTop: "1.4rem", display: "flex", alignItems: "center", gap: 14 }}>
          <button disabled={busy} style={{ background: ACCENT, color: "#fff", border: "none", borderRadius: 7, padding: "0.7rem 1.4rem", fontWeight: 600, cursor: "pointer", opacity: busy ? 0.6 : 1 }}>
            {busy ? "Submitting…" : "Plan & render"}
          </button>
          {err && <span style={{ color: "#c5221f", fontSize: ".9rem" }}>{err}</span>}
        </div>
      </form>

      {/* Jobs list */}
      <h2 style={{ marginTop: "2.5rem" }}>Your videos</h2>
      {jobs.length === 0 ? <p style={{ color: "#666" }}>No videos yet.</p> : (
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: ".92rem" }}>
          <thead><tr style={{ textAlign: "left", borderBottom: "1px solid #ddd" }}>
            <th style={{ padding: "6px 4px" }}>Job</th><th>Style</th><th>Status</th><th>Shots</th><th></th></tr></thead>
          <tbody>
            {jobs.map((j) => (
              <tr key={j.id} style={{ borderBottom: "1px solid #f0f0f0" }}>
                <td style={{ padding: "6px 4px" }}><code>{j.id.slice(0, 14)}</code></td>
                <td style={{ color: "#666" }}>{j.style_brief ?? "—"}</td>
                <td><span style={{ color: STATUS_COLOR[j.status] ?? "#666", fontWeight: 600 }}>{j.status}</span></td>
                <td>{j.progress?.shots_done ?? 0}/{j.progress?.shots_total ?? 0}</td>
                <td><Link to={`/app/video/${j.id}`} style={{ color: ACCENT }}>open →</Link></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </main>
  );
}

const ghostBtn: React.CSSProperties = { padding: "0.5rem 0.8rem", border: "1px solid #ccc", borderRadius: 6, background: "#fff", cursor: "pointer", font: "inherit", fontWeight: 600, color: "#333" };
const chk: React.CSSProperties = { display: "flex", alignItems: "center", gap: 7, fontSize: ".9rem", color: "#333", cursor: "pointer" };
const radio: React.CSSProperties = { display: "flex", gap: 8, alignItems: "flex-start", fontSize: ".9rem", color: "#333", cursor: "pointer" };
