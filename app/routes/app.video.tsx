import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router";
import { api, uploadFaceImage, uploadVideoVoice, type SubmitVideoInput, type VideoJobRow, type FaceRow, type UsageResponse, jobLogline } from "~/lib/api";
import { supabase } from "~/lib/supabase";
import { DisclosureBadge } from "~/components/DisclosureBadge";
import { Tip } from "~/components/Tooltip";
import { GuidedTour } from "~/components/GuidedTour";
import { currentUserId, hasOnboarded, markOnboarded } from "~/lib/onboarding";

const ACCENT = "#1a73e8";
const BUILTIN_STYLES = [
  "Lego world",
  "Ghibli-inspired",
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
// Video assets are auto-deleted 30 days after creation (retention-sweep); show the date so users
// download in time. Red within the last week / once lapsed.
function expiryShort(iso: string | null): { label: string; soon: boolean } | null {
  if (!iso) return null;
  const days = Math.ceil((new Date(iso).getTime() - Date.now()) / 86_400_000);
  if (days <= 0) return { label: "expired", soon: true };
  return { label: new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" }), soon: days <= 7 };
}

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
  const [voiceFile, setVoiceFile] = useState<File | null>(null);   // ad-hoc voice sample (one-off)
  const [voiceConsent, setVoiceConsent] = useState(false);
  const [faces, setFaces] = useState<File[]>([]);
  const [faceConsent, setFaceConsent] = useState(false);
  const [libFaces, setLibFaces] = useState<FaceRow[]>([]);        // saved cast library
  const [selectedFaceIds, setSelectedFaceIds] = useState<string[]>([]);
  const [faceThumbs, setFaceThumbs] = useState<Record<string, string>>({});
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
  const [videoModel, setVideoModel] = useState("minimax_h3_t2v");
  const [mode, setMode] = useState<"deterministic" | "agentic">("agentic");
  const [quality, setQuality] = useState(false);
  const [distill, setDistill] = useState(1.0);
  const [showAdvanced, setShowAdvanced] = useState(false);
  // submit + jobs
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [jobs, setJobs] = useState<VideoJobRow[]>([]);
  const [usage, setUsage] = useState<UsageResponse | null>(null);
  const [tourOpen, setTourOpen] = useState(false);

  useEffect(() => {
    // First-time visitors get the guided tour once per browser.
    currentUserId().then((uid) => {
      if (uid && !hasOnboarded(uid)) setTourOpen(true);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    setSaved(loadPresets());
    api.listVoices().then((r: any) => setVoices(r.voices ?? [])).catch(() => {});
    api.listFaces().then((r) => setLibFaces(r.faces)).catch(() => {});
    api.usage().then(setUsage).catch(() => {});
    api.listVideoJobs().then((r) => setJobs(r.jobs)).catch(() => {});
    // Live-update the list straight from each change payload (video_jobs is REPLICA IDENTITY FULL)
    // instead of re-fetching the whole list on every render tick.
    const ch = supabase.channel("video_jobs_list")
      .on("postgres_changes", { event: "*", schema: "public", table: "video_jobs" }, (p: any) => {
        if (p.eventType === "DELETE") { const oid = p.old?.id; if (oid) setJobs((v) => v.filter((j) => j.id !== oid)); return; }
        const r = p.new;
        const row: VideoJobRow = { id: r.id, status: r.status, stage: r.stage ?? null, progress: r.progress,
          style_brief: r.style_brief ?? null, created_at: r.created_at, expires_at: r.expires_at ?? null,
          plan: r.plan ?? null };
        setJobs((v) => v.some((j) => j.id === row.id) ? v.map((j) => (j.id === row.id ? { ...j, ...row } : j)) : [row, ...v]);
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  // Signed thumbnails for the saved-cast picker (storage RLS lets a user sign their own objects).
  useEffect(() => {
    (async () => {
      const add: Record<string, string> = {};
      for (const f of libFaces) {
        if (faceThumbs[f.id]) continue;
        const { data } = await supabase.storage.from("character-refs").createSignedUrl(f.image_ref, 3600);
        if (data?.signedUrl) add[f.id] = data.signedUrl;
      }
      if (Object.keys(add).length) setFaceThumbs((t) => ({ ...t, ...add }));
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [libFaces]);

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
    if (voiceFile && !voiceConsent) { setErr("Please confirm you have the right to use this voice sample."); return; }
    setBusy(true); setErr(null);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      // upload ad-hoc cast faces to Storage → keys
      const character_refs: string[] = [];
      for (const f of faces) { const { ref } = await uploadFaceImage(user!.id, f); character_refs.push(ref); }
      // upload a one-off narration voice sample if provided (takes precedence over the saved-voice pick)
      const voice_ref = voiceFile ? (await uploadVideoVoice(user!.id, voiceFile)).ref : null;
      const input: SubmitVideoInput = {
        manuscript: manuscript.trim(), style_brief: style.trim() || null, aspect, fps,
        language, voice_id: voiceFile ? null : (voiceId || null),
        voice_ref, voice_consent: voiceFile ? voiceConsent : undefined,
        character_ids: selectedFaceIds, character_refs, face_consent: faceConsent,
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
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", flexWrap: "wrap", gap: 8 }}>
        <h1 style={{ display: "flex", alignItems: "center", gap: 10, margin: 0 }}>New video <DisclosureBadge />
          <Tip title="What is this page?">Paste your story, pick a look and a voice, and we'll turn it into a narrated video. You get to review the plan before the video is made.</Tip>
        </h1>
        <button onClick={() => setTourOpen(true)} style={{ border: "1px solid #d1d5db", background: "#fff", borderRadius: 7, padding: "0.35rem 0.8rem", cursor: "pointer", fontSize: ".82rem", color: "#374151" }}>Replay tutorial</button>
      </div>

      <GuidedTour
        open={tourOpen}
        onClose={() => setTourOpen(false)}
        onFinish={() => { currentUserId().then((uid) => { if (uid) markOnboarded(uid); }).catch(() => {}); }}
        steps={[
          {
            title: "Create a narrated video",
            body: <>This form turns a story into a <b>narrated, subtitled video</b>. Fill it in, review the AI-generated plan, then render. Each field has a <b>?</b> icon for a quick reminder.</>,
          },
          {
            title: "1 · Paste your manuscript",
            body: <>This is the story itself. The agent splits it into shots and writes narration. Use <b># Chapter N</b> headings if you want chapter breaks. The <b>shorter the cleaner</b> — a few paragraphs works best for a first render.</>,
            target: "v-manuscript",
          },
          {
            title: "2 · Pick a visual style",
            body: <>Choose a built-in style like <i>Ghibli-inspired</i> or <i>film noir</i>, or type your own. This shapes every frame. Save your favorites for reuse later.</>,
            target: "v-style",
          },
          {
            title: "3 · Aspect, language & voice",
            body: <>Pick the video shape (<b>16:9</b> widescreen, <b>9:16</b> portrait, <b>1:1</b>), the narration <b>language</b>, and a saved <b>voice</b> — or upload a one-off voice sample (your own voice is fine).</>,
            target: "v-voice",
          },
          {
            title: "4 · Cast a face (optional)",
            body: <>Add people's faces from your saved cast or upload a photo and the same character appears in shots. You must confirm you have the right to use a likeness.</>,
            target: "v-cast",
          },
          {
            title: "5 · Finishing touches",
            body: <>Toggle a <b>music bed</b>, <b>keyframes</b>, or <b>continuity</b> between shots. Then choose whether to <b>review the plan</b> before rendering or <b>auto-accept</b> and let it run.</>,
            target: "v-toggles",
          },
          {
            title: "6 · Submit",
            body: <>Hit <b>Plan & render</b>. You'll land on the video page where you approve the shot plan (if you chose manual review) and watch it render live.</>,
            target: "v-submit",
          },
          {
            title: "That's it!",
            body: <>Replay this tutorial anytime from the button up top, or hover a <b>?</b> icon for a hint. Advanced options (model, orchestration, FPS…) live under <b>▸ Advanced</b>.</>,
          },
        ]}
      />

      <p style={{ color: "#666", marginTop: 8 }}>A story manuscript → a narrated, subtitled video. Renders on the home GPU; you can review the planned shots before it renders.</p>
      {usage && (() => {
        const atLimit = usage.videos_used >= usage.videos_limit;
        return (
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, marginTop: 2, padding: "0.35rem 0.7rem", borderRadius: 999, fontSize: ".82rem", fontWeight: 600, border: `1px solid ${atLimit ? "#e0b4b4" : "#d7e3f7"}`, background: atLimit ? "#fdecea" : "#eef4fe", color: atLimit ? "#c5221f" : ACCENT }}>
            {usage.videos_used} / {usage.videos_limit} videos this month
            {atLimit && <Link to="/pricing" style={{ color: "#c5221f", textDecoration: "underline" }}>upgrade</Link>}
          </div>
        );
      })()}

      <form onSubmit={submit} style={{ display: "grid", gap: 0 }}>
        <div id="v-manuscript">
          <label style={label} htmlFor="manuscript">Manuscript
            <Tip title="Manuscript">Paste the story you want turned into a video. It will be broken into scenes with spoken narration. Use '# Chapter N' headings to keep sections together.</Tip>
          </label>
          <textarea id="manuscript" value={manuscript} onChange={(e) => setManuscript(e.target.value)}
            rows={5} required placeholder="A lighthouse keeper watches the first storm of autumn roll in over black water…"
            style={{ ...field, resize: "vertical" }} />
        </div>

        {/* Style brief with presets */}
        <div id="v-style" style={{ marginTop: "1rem" }}>
          <label style={label}>Style brief <span style={{ fontWeight: 400, color: "#888" }}>— pick a preset or type your own</span>
            <Tip title="Style brief">Tell us how the video should look — for example 'Ghibli-inspired' or 'film noir'. You can pick a ready-made style or describe your own.</Tip>
          </label>
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

        <div id="v-voice" style={row}>
          <div style={cell}>
            <label style={label}>Aspect
              <Tip title="Aspect ratio">The shape of your video: 16:9 is widescreen for YouTube, 9:16 is tall for Shorts/Reels, 1:1 is a square for feed posts.</Tip>
            </label>
            <select value={aspect} onChange={(e) => setAspect(e.target.value)} style={field}>
              <option>16:9</option><option>9:16</option><option>1:1</option>
            </select>
          </div>
          <div style={cell}>
            <label style={label}>Narration language
              <Tip title="Narration language">The language the spoken narration will be in. English, Hindi and Bangla are supported.</Tip>
            </label>
            <select value={language} onChange={(e) => setLanguage(e.target.value)} style={field}>
              <option value="en">English</option><option value="hi">हिन्दी · Hindi</option><option value="bn">বাংলা · Bangla</option>
            </select>
          </div>
          <div style={{ ...cell, minWidth: 200 }}>
            <label style={label}>Narration voice
              <Tip title="Narration voice">Pick a voice you've already saved, or upload your own voice sample to use just for this video. Only use voices you have the right to use.</Tip>
            </label>
            <select value={voiceId} onChange={(e) => setVoiceId(e.target.value)} disabled={!!voiceFile} style={field}>
              <option value="">Default voice</option>
              {voices.map((v: any) => <option key={v.voice_id} value={v.voice_id}>{v.voice_id} ({v.language})</option>)}
            </select>
            <details style={{ marginTop: 6 }} open={!!voiceFile}>
              <summary style={{ fontSize: ".78rem", color: ACCENT, cursor: "pointer" }}>or upload a voice sample</summary>
              <input type="file" accept=".wav,.mp3,.m4a,.aac,.flac,.ogg,audio/*"
                onChange={(e) => setVoiceFile(e.target.files?.[0] ?? null)} style={{ marginTop: 6, fontSize: ".8rem" }} />
              {voiceFile && (
                <label style={{ display: "flex", gap: 6, alignItems: "flex-start", marginTop: 6, fontSize: ".78rem", color: "#333" }}>
                  <input type="checkbox" checked={voiceConsent} onChange={(e) => setVoiceConsent(e.target.checked)} />
                  <span>I have the right to use this voice. It's cloned for this video only.</span>
                </label>
              )}
            </details>
          </div>
        </div>

        {/* Cast faces */}
        <div id="v-cast" style={{ marginTop: "1rem", border: "1px solid #e5e5e5", borderRadius: 8, padding: "0.9rem" }}>
          <label style={label}>Cast a person's face <span style={{ fontWeight: 400, color: "#888" }}>— optional; a clear frontal photo appears in the shots</span>
            <Tip title="Cast a face">Want the same person to appear in the video? Add their face here and it will show up in the scenes. Use a clear photo, and only of people you have the right to feature.</Tip>
          </label>

          {/* Saved cast library (character_ids) — no per-job consent (captured when saved). */}
          {libFaces.length > 0 && (
            <div style={{ marginBottom: 10 }}>
              <div style={{ fontSize: ".8rem", color: "#555", marginBottom: 6 }}>Pick from your saved cast:</div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {libFaces.map((f) => {
                  const on = selectedFaceIds.includes(f.id);
                  return (
                    <button type="button" key={f.id}
                      onClick={() => setSelectedFaceIds((s) => on ? s.filter((x) => x !== f.id) : [...s, f.id])}
                      style={{ display: "flex", alignItems: "center", gap: 6, padding: "3px 10px 3px 3px", border: `1px solid ${on ? ACCENT : "#ddd"}`, borderRadius: 999, background: on ? "#eef4fe" : "#fff", cursor: "pointer", font: "inherit", fontSize: ".82rem", color: "#333" }}>
                      {faceThumbs[f.id]
                        ? <img src={faceThumbs[f.id]} alt="" style={{ width: 22, height: 22, borderRadius: "50%", objectFit: "cover" }} />
                        : <span style={{ width: 22, height: 22, borderRadius: "50%", background: "#eee", display: "inline-block" }} />}
                      {f.name}{on ? " ✓" : ""}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
          <div style={{ fontSize: ".8rem", color: "#888", marginBottom: 6 }}>
            {libFaces.length > 0 ? "…or upload a one-off photo" : "Upload a photo"} — <Link to="/app/faces" style={{ color: ACCENT }}>manage your saved cast</Link>
          </div>
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
        <div id="v-toggles" style={{ display: "flex", gap: "1.3rem", flexWrap: "wrap", marginTop: "1.1rem" }}>
          <label style={chk}><input type="checkbox" checked={music} onChange={(e) => setMusic(e.target.checked)} /> music bed
            <Tip title="Music bed">Adds a soft background tune under the narration to set the mood.</Tip>
          </label>
          <label style={chk}><input type="checkbox" checked={keyframes} onChange={(e) => setKeyframes(e.target.checked)} /> keyframes (image→video)
            <Tip title="Keyframes">Starts from a still image and animates it into motion. Turn this on for more of a slideshow-to-video feel.</Tip>
          </label>
          <label style={chk}><input type="checkbox" checked={continuity} onChange={(e) => setContinuity(e.target.checked)} /> continuity chaining
            <Tip title="Continuity">Keeps people, colors and settings the same across scenes, so the video feels like one continuous story instead of random clips.</Tip>
          </label>
        </div>

        {/* Review */}
        <div style={{ marginTop: "1.1rem", display: "grid", gap: 8 }}>
          <label style={radio}><input type="radio" name="review" checked={review === "manual"} onChange={() => setReview("manual")} />
            <span><b>Review plan before render</b><br /><small style={{ color: "#777" }}>pause to approve/edit the planned shots</small></span></label>
          <label style={radio}><input type="radio" name="review" checked={review === "auto"} onChange={() => setReview("auto")} />
            <span><b>Skip review — auto-accept</b><br /><small style={{ color: "#777" }}>render everything the planner generates</small></span></label>
          <span style={{ fontSize: ".8rem", color: "#888" }}>
            <Tip title="Plan review">We'll draft a plan showing each scene before making it. With manual review you can tweak it or try again; with auto it goes straight to making the video.</Tip>
          </span>
        </div>

        {/* Advanced */}
        <div style={{ marginTop: "1rem" }}>
          <button type="button" onClick={() => setShowAdvanced((v) => !v)} style={{ ...ghostBtn, border: "none", padding: 0, color: "#555" }}>
            {showAdvanced ? "▾" : "▸"} Advanced
            <Tip title="Advanced options">Extra settings for fine-tuning your video. The defaults already work well for most videos, so you can usually leave these alone.</Tip>
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
                    <option value="minimax_h3_t2v">MiniMax H3 — premium quality + native audio, slowest</option>
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
          <button id="v-submit" disabled={busy} style={{ background: ACCENT, color: "#fff", border: "none", borderRadius: 7, padding: "0.7rem 1.4rem", fontWeight: 600, cursor: "pointer", opacity: busy ? 0.6 : 1 }}>
            {busy ? "Submitting…" : "Plan & render"}
          </button>
          <Tip title="Plan & render">Start making your video. We'll plan the scenes first, then create them one by one — you can watch the progress as it goes.</Tip>
          {err && <span style={{ color: "#c5221f", fontSize: ".9rem" }}>{err}</span>}
        </div>
      </form>

      {/* Jobs list */}
      <h2 style={{ marginTop: "2.5rem" }}>Your videos</h2>
      {jobs.length === 0 ? <p style={{ color: "#666" }}>No videos yet.</p> : (
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: ".92rem" }}>
          <thead><tr style={{ textAlign: "left", borderBottom: "1px solid #ddd" }}>
            <th style={{ padding: "6px 4px" }}>Topic</th><th>Style</th><th>Status</th><th>Shots</th><th>Expires</th><th></th></tr></thead>
          <tbody>
            {jobs.map((j) => {
              const ex = expiryShort(j.expires_at);
              return (
              <tr key={j.id} style={{ borderBottom: "1px solid #f0f0f0" }}>
                <td style={{ padding: "6px 4px" }}>
                  <div title={j.id} style={{ fontWeight: 500, color: "#222" }}>
                    {jobLogline(j) ?? <em style={{ color: "#999" }}>…</em>}
                  </div>
                  <code style={{ fontSize: 11, color: "#999" }}>{j.id.slice(0, 14)}</code>
                </td>
                <td style={{ color: "#666" }}>{j.style_brief ?? "—"}</td>
                <td><span style={{ color: STATUS_COLOR[j.status] ?? "#666", fontWeight: 600 }}>{j.status}</span></td>
                <td>{j.progress?.shots_done ?? 0}/{j.progress?.shots_total ?? 0}</td>
                <td title={j.expires_at ?? ""} style={{ color: ex?.soon ? "#c5221f" : "#999", fontSize: ".85rem" }}>{ex?.label ?? "—"}</td>
                <td><Link to={`/app/video/${j.id}`} style={{ color: ACCENT }}>open →</Link></td>
              </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </main>
  );
}

const ghostBtn: React.CSSProperties = { padding: "0.5rem 0.8rem", border: "1px solid #ccc", borderRadius: 6, background: "#fff", cursor: "pointer", font: "inherit", fontWeight: 600, color: "#333" };
const chk: React.CSSProperties = { display: "flex", alignItems: "center", gap: 7, fontSize: ".9rem", color: "#333", cursor: "pointer" };
const radio: React.CSSProperties = { display: "flex", gap: 8, alignItems: "flex-start", fontSize: ".9rem", color: "#333", cursor: "pointer" };
