import { useEffect, useRef, useState } from "react";
import { useParams, Link, useNavigate } from "react-router";
import { api, type VideoJobDetail, type VideoJobRow } from "~/lib/api";
import { supabase } from "~/lib/supabase";
import { DisclosureBadge } from "~/components/DisclosureBadge";

const ACCENT = "#1a73e8";
const STAGES = ["Plan", "Review", "Render", "Assemble", "QA", "Done"];
const STAGE_INDEX: Record<string, number> = {
  queued: 0, claimed: 0, planning: 0, awaiting_plan: 1,
  rendering: 2, assembling: 3, qa: 4, completed: 5, editing: 5,
};
const TERMINAL = new Set(["completed", "failed", "cancelled"]);
const STATUS_COLOR: Record<string, string> = {
  completed: "#137333", failed: "#c5221f", cancelled: "#8a6d00", awaiting_plan: "#8a6d00",
  planning: ACCENT, rendering: ACCENT, assembling: ACCENT, qa: ACCENT, claimed: ACCENT, queued: "#8a6d00",
  editing: ACCENT,
};
// Injected once — inline styles can't declare @keyframes.
const SPINNER_CSS = `@keyframes va-spin{to{transform:rotate(360deg)}}` +
  `.va-spinner{display:inline-block;width:13px;height:13px;border:2px solid #cfe0fb;border-top-color:${ACCENT};` +
  `border-radius:50%;animation:va-spin .7s linear infinite;vertical-align:-2px}` +
  `@media (prefers-reduced-motion: reduce){.va-spinner{animation-duration:2s}}`;

function fmtDur(s: number): string {
  s = Math.round(s);
  const m = Math.floor(s / 60), sec = s % 60;
  return m > 0 ? `${m}m ${sec}s` : `${sec}s`;
}
function relOffset(ms: number): string {
  const s = Math.max(0, Math.round(ms / 1000));
  return `+${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}
// Assets are auto-deleted 30 days after creation (retention-sweep). Surface the date + a soon/expired
// warning so users download before it lapses.
function expiryNote(iso: string | null | undefined) {
  if (!iso) return null;
  const days = Math.ceil((new Date(iso).getTime() - Date.now()) / 86_400_000);
  const date = new Date(iso).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
  const short = new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
  if (days <= 0) return { date, short, days: 0, soon: true, expired: true };
  return { date, short, days, soon: days <= 7, expired: false };
}

interface Ev { seq: number; stage: string; payload: any; created_at: string; }

export default function VideoRun() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const [job, setJob] = useState<VideoJobDetail | null>(null);
  const [jobs, setJobs] = useState<VideoJobRow[]>([]);
  const [events, setEvents] = useState<Ev[]>([]);
  const [editShots, setEditShots] = useState<any[] | null>(null);
  const [acting, setActing] = useState(false);
  const [regenCount, setRegenCount] = useState(0);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [shotUrls, setShotUrls] = useState<Record<string, string>>({}); // shot_key → signed preview URL
  // Candidate review modal (post-run: view all candidates, re-pick, regenerate, reassemble).
  const [showCandidates, setShowCandidates] = useState(false);
  const [selections, setSelections] = useState<Record<number, number>>({}); // shot_index → chosen seed
  const [candUrls, setCandUrls] = useState<Record<string, string>>({});      // candidate shot_key → URL
  const [editBusy, setEditBusy] = useState(false);
  // ETA model: avg render seconds-per-shot from past completed jobs, keyed by video model.
  const [perShot, setPerShot] = useState<{ byModel: Record<string, number>; global: number | null } | null>(null);
  const [currentModel, setCurrentModel] = useState("");
  const [, setTick] = useState(0); // forces a re-render so the countdown + relative times stay live
  const seen = useRef<Set<number>>(new Set());

  async function refetch() {
    try { setJob(await api.getVideoJob(id)); } catch (e: any) { setErr(e.message); }
  }
  const refetchJobs = () => api.listVideoJobs().then((r) => setJobs(r.jobs)).catch(() => {});
  async function loadEvents() {
    const { data } = await supabase.from("video_job_events").select("seq,stage,payload,created_at")
      .eq("job_id", id).order("seq");
    if (data) { seen.current = new Set(data.map((e: any) => e.seq)); setEvents(data as Ev[]); }
  }
  // Historical render pace (RLS-scoped to the user). render_s ≈ updated_at − created_at over a
  // completed job; per-shot = render_s / shots_total, averaged per model → estimate = perShot × shots.
  async function loadPace() {
    const { data } = await supabase.from("video_jobs").select("id,status,created_at,updated_at,progress,opts,render_seconds");
    if (!data) return;
    const all: number[] = []; const byModel: Record<string, number[]> = {};
    for (const j of data as any[]) {
      if (j.id === id) setCurrentModel(j.opts?.video_model || "");
      if (j.status !== "completed" || !j.updated_at) continue;
      const shots = j.progress?.shots_total || 0;
      if (shots <= 0) continue;
      // Prefer the recorded render wall-time (excludes queue wait + HITL pause); fall back to the
      // created→updated span for jobs rendered before render_seconds existed.
      const secs = (typeof j.render_seconds === "number" && j.render_seconds > 0)
        ? j.render_seconds
        : (new Date(j.updated_at).getTime() - new Date(j.created_at).getTime()) / 1000;
      if (secs <= 0 || secs > 6 * 3600) continue; // ignore absurd gaps (paused-for-review, clock skew)
      const per = secs / shots; all.push(per);
      (byModel[j.opts?.video_model || ""] ||= []).push(per);
    }
    const mean = (a: number[]) => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : null);
    const bm: Record<string, number> = {};
    for (const m in byModel) { const v = mean(byModel[m]); if (v != null) bm[m] = v; }
    setPerShot({ byModel: bm, global: mean(all) });
  }

  useEffect(() => {
    setJob(null); setEvents([]); setEditShots(null); seen.current = new Set();
    refetch(); loadEvents(); refetchJobs(); loadPace();
    // video_jobs is published REPLICA IDENTITY FULL, so each change payload carries the whole row —
    // apply it directly instead of re-fetching over HTTP on every one of a render's ~55 ticks. The only
    // field not in the row is the signed video_url (minted server-side), so we hit the Edge Function
    // exactly once, when the job completes.
    const ch = supabase.channel(`video_job_${id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "video_jobs", filter: `id=eq.${id}` },
        (p: any) => {
          const r = p.new;
          // Completion needs the server-minted signed video_url → fetch the canonical detail once,
          // exactly as before. Every other tick applies the payload directly (no HTTP).
          if (r.status === "completed") { refetch(); return; }
          setJob((prev) => ({
            job_id: id, status: r.status, stage: r.stage ?? null, progress: r.progress,
            plan: r.plan ?? null, qa: r.qa ?? null, error: r.error ?? null, duration_s: r.duration_s ?? null,
            ai_disclosure: r.ai_disclosure, video_url: prev?.video_url ?? null,
            created_at: r.created_at, updated_at: r.updated_at ?? null, expires_at: r.expires_at ?? null,
          }));
        })
      // Sidebar list stays live for every job, also straight from the payload (no full-list re-fetch).
      .on("postgres_changes", { event: "*", schema: "public", table: "video_jobs" },
        (p: any) => {
          if (p.eventType === "DELETE") { const oid = p.old?.id; if (oid) setJobs((v) => v.filter((j) => j.id !== oid)); return; }
          const r = p.new;
          const row: VideoJobRow = { id: r.id, status: r.status, stage: r.stage ?? null, progress: r.progress,
            style_brief: r.style_brief ?? null, created_at: r.created_at, expires_at: r.expires_at ?? null };
          setJobs((v) => v.some((j) => j.id === row.id) ? v.map((j) => (j.id === row.id ? { ...j, ...row } : j)) : [row, ...v]);
        })
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "video_job_events", filter: `job_id=eq.${id}` },
        (p: any) => { const e = p.new as Ev; if (!seen.current.has(e.seq)) { seen.current.add(e.seq); setEvents((v) => [...v, e]); } })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // Tick every 5s while the job is live so "time left" and relative offsets update between events.
  useEffect(() => {
    if (!job || TERMINAL.has(job.status)) return;
    const t = setInterval(() => setTick((n) => n + 1), 5000);
    return () => clearInterval(t);
  }, [job?.status]);

  // Mint a signed preview URL for each finished shot's clip (RLS lets a user sign their own objects).
  useEffect(() => {
    const missing = Array.from(new Set(
      events.filter((e) => e.stage === "shot_done" && e.payload?.shot_key).map((e) => e.payload.shot_key as string)
    )).filter((k) => !(k in shotUrls));
    if (!missing.length) return;
    (async () => {
      const add: Record<string, string> = {};
      for (const k of missing) {
        const { data } = await supabase.storage.from("video-output").createSignedUrl(k, 3600);
        if (data?.signedUrl) add[k] = data.signedUrl;
      }
      if (Object.keys(add).length) setShotUrls((u) => ({ ...u, ...add }));
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [events]);

  // Seed the per-shot selection from the current chosen candidate (only for shots not yet touched).
  useEffect(() => {
    const rs = job?.render_state;
    if (!rs) return;
    setSelections((prev) => {
      const next = { ...prev };
      for (const s of rs.shots) if (!(s.index in next) && s.chosen_seed != null) next[s.index] = s.chosen_seed;
      return next;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [job?.render_state]);

  // Mint signed URLs for every candidate clip so the modal can play them.
  useEffect(() => {
    const rs = job?.render_state;
    if (!rs) return;
    const missing = Array.from(new Set(rs.shots.flatMap((s) => s.candidates.map((c) => c.shot_key)))).filter((k) => !(k in candUrls));
    if (!missing.length) return;
    (async () => {
      const add: Record<string, string> = {};
      for (const k of missing) {
        const { data } = await supabase.storage.from("video-output").createSignedUrl(k, 3600);
        if (data?.signedUrl) add[k] = data.signedUrl;
      }
      if (Object.keys(add).length) setCandUrls((u) => ({ ...u, ...add }));
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [job?.render_state]);

  async function regenerate(shotIndex: number) {
    setEditBusy(true); setErr(null);
    try { await api.regenerateShot(id, shotIndex, 2); } catch (e: any) { setErr(e.message); } finally { setEditBusy(false); }
  }
  async function reassemble() {
    setEditBusy(true); setErr(null);
    try { await api.reassembleVideo(id, selections); } catch (e: any) { setErr(e.message); } finally { setEditBusy(false); }
  }

  useEffect(() => {
    if (job?.status === "awaiting_plan" && job.plan && editShots === null) {
      setEditShots(job.plan.shots.map((s) => ({ ...s })));
    }
    if (job && job.status !== "awaiting_plan" && editShots !== null) setEditShots(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [job?.status]);

  async function decide(action: "approve" | "reject" | "regenerate") {
    if (!job) return;
    setActing(true); setErr(null);
    try {
      const body: any = { action };
      if (action === "approve" && job.plan && editShots) body.plan = { brief: job.plan.brief, shots: editShots };
      await api.videoPlanDecision(id, body);
      if (action === "regenerate") setRegenCount((n) => n + 1); // worker re-plans at a higher temperature
    } catch (e: any) { setErr(e.message); } finally { setActing(false); }
  }

  async function del(jobId: string) {
    if (!confirm("Delete this video and its output? This cannot be undone.")) return;
    setDeleting(jobId);
    try {
      await api.deleteVideoJob(jobId);
      if (jobId === id) { navigate("/app/video"); return; }
      await refetchJobs();
    } catch (e: any) { setErr(e.message); } finally { setDeleting(null); }
  }

  const activeIdx = job ? (STAGE_INDEX[job.status] ?? 0) : 0;
  const failed = job?.status === "failed" || job?.status === "cancelled";
  const running = !!job && !TERMINAL.has(job.status);
  const processing = running && job!.status !== "awaiting_plan";
  const startMs = events[0]?.created_at ? new Date(events[0].created_at).getTime()
    : job ? new Date(job.created_at).getTime() : 0;

  // Estimated time remaining.
  let eta: string | null = null;
  if (processing && perShot && job) {
    const shots = job.progress?.shots_total || job.plan?.shots?.length || 0;
    const per = perShot.byModel[currentModel] ?? perShot.global;
    if (shots > 0 && per) {
      const remaining = Math.max(0, per * shots - (Date.now() - startMs) / 1000);
      eta = `~${fmtDur(remaining)} left`;
    } else if (shots === 0) {
      eta = "estimating…";
    }
  }

  // Per-shot result cards, from the shot_done events. Merge across re-emits (e.g. a resumed run
  // re-reports a shot) so a shot_key produced by any emit is preserved.
  const shotCards = (() => {
    const byIdx = new Map<number, any>();
    for (const e of events) if (e.stage === "shot_done" && e.payload) {
      const idx = e.payload.index ?? 0;
      const prev = byIdx.get(idx);
      byIdx.set(idx, { ...prev, ...e.payload, shot_key: e.payload.shot_key || prev?.shot_key });
    }
    return [...byIdx.values()].sort((a, b) => (a.index ?? 0) - (b.index ?? 0));
  })();

  return (
    <div style={{ display: "flex", gap: 22, maxWidth: 1140, margin: "0 auto", padding: "1.5rem 1.25rem", alignItems: "flex-start" }}>
      <style>{SPINNER_CSS}</style>

      {/* Left column — past videos */}
      <aside style={{ width: 250, flexShrink: 0, position: "sticky", top: 70 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <b style={{ fontSize: ".9rem" }}>Your videos</b>
          <Link to="/app/video" style={{ color: ACCENT, fontSize: ".85rem" }}>+ New</Link>
        </div>
        <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: 8 }}>
          {jobs.map((j) => {
            const current = j.id === id;
            const active = !TERMINAL.has(j.status);
            return (
              <li key={j.id} style={{
                border: `1px solid ${current ? ACCENT : "#e5e5e5"}`, borderRadius: 8, padding: "0.5rem 0.6rem",
                background: current ? "#eef4fe" : "#fff",
              }}>
                <div style={{ fontFamily: "ui-monospace, monospace", fontSize: ".72rem", color: "#666" }}>{j.id.slice(0, 16)}</div>
                <div style={{ fontSize: ".8rem", color: "#444", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{j.style_brief ?? "—"}</div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 6 }}>
                  <span style={{ color: STATUS_COLOR[j.status] ?? "#666", fontWeight: 600, fontSize: ".72rem", display: "inline-flex", alignItems: "center", gap: 4 }}>
                    {active && <span className="va-spinner" style={{ width: 9, height: 9, borderWidth: 2 }} />}{j.status}
                  </span>
                  <span style={{ display: "flex", gap: 6 }}>
                    <button onClick={() => navigate(`/app/video/${j.id}`)} disabled={current} style={miniBtn(current)}>view</button>
                    <button onClick={() => del(j.id)} disabled={deleting === j.id}
                      style={{ ...miniBtn(false), color: "#c5221f", borderColor: "#e6c0c0" }}>
                      {deleting === j.id ? "…" : "delete"}
                    </button>
                  </span>
                </div>
                {(() => {
                  const ex = expiryNote(j.expires_at);
                  return ex ? (
                    <div title={`Assets ${ex.expired ? "expired" : "expire"} ${ex.date}`}
                      style={{ fontSize: ".66rem", color: ex.soon ? "#c5221f" : "#aaa", marginTop: 4 }}>
                      {ex.expired ? "expired" : `expires ${ex.short}`}
                    </div>
                  ) : null;
                })()}
              </li>
            );
          })}
          {jobs.length === 0 && <li style={{ color: "#888", fontSize: ".85rem" }}>No videos yet.</li>}
        </ul>
      </aside>

      {/* Right column — the run detail */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <h1 style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 0 }}>
          Render <code style={{ fontSize: ".7em", color: "#888" }}>{id.slice(0, 16)}</code> <DisclosureBadge />
        </h1>

        {!job ? <p style={{ color: "#666" }}>{err ?? "Loading…"}</p> : (
          <>
            {/* Stage rail + status */}
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", margin: "1rem 0", alignItems: "center" }}>
              {STAGES.map((s, i) => {
                const done = i < activeIdx || job.status === "completed";
                const active = i === activeIdx && !TERMINAL.has(job.status);
                return (
                  <span key={s} style={{
                    padding: "0.3rem 0.7rem", borderRadius: 999, fontSize: ".8rem", fontWeight: 600,
                    background: done ? "#e6f4ea" : active ? ACCENT : "#f1f1f1",
                    color: done ? "#137333" : active ? "#fff" : "#999",
                  }}>{s}</span>
                );
              })}
              <span style={{ display: "inline-flex", alignItems: "center", gap: 6, color: failed ? "#c5221f" : "#666", fontSize: ".85rem", marginLeft: 6 }}>
                {processing && <span className="va-spinner" />}
                <span>
                  {job.status}{job.stage && !TERMINAL.has(job.status) ? ` · ${job.stage}` : ""}
                  {job.progress?.shots_total ? ` · shot ${job.progress.shots_done}/${job.progress.shots_total}` : ""}
                  {eta ? ` · ${eta}` : ""}
                </span>
              </span>
            </div>

            {(() => {
              const ex = expiryNote(job.expires_at);
              if (!ex) return null;
              return (
                <p style={{ fontSize: ".8rem", margin: "-.4rem 0 1rem", color: ex.soon ? "#c5221f" : "#888" }}>
                  {ex.soon ? "⚠ " : ""}
                  {ex.expired ? `Assets expired ${ex.date} and are being removed.`
                    : `Assets expire on ${ex.date} (${ex.days} day${ex.days === 1 ? "" : "s"} left).`}
                  {job.status === "completed" && !ex.expired ? " Download the video before then — outputs are auto-deleted to free storage." : ""}
                </p>
              );
            })()}

            {err && <p style={{ color: "#c5221f" }}>{err}</p>}
            {failed && <p style={{ color: "#c5221f" }}>{job.status === "cancelled" ? "Cancelled." : `Failed: ${job.error ?? "unknown error"}`}</p>}

            {/* HITL plan review */}
            {job.status === "awaiting_plan" && job.plan && (
              <section style={{ border: `1px solid ${ACCENT}`, borderRadius: 10, padding: "1rem", margin: "1rem 0" }}>
                <h2 style={{ marginTop: 0 }}>Review the plan</h2>
                {job.plan.brief?.logline && <p style={{ color: "#444" }}><b>Logline:</b> {job.plan.brief.logline}</p>}
                <div style={{ display: "grid", gap: "0.8rem" }}>
                  {(editShots ?? []).map((s, i) => (
                    <div key={i} style={{ border: "1px solid #e5e5e5", borderRadius: 8, padding: "0.7rem" }}>
                      <div style={{ fontWeight: 600, fontSize: ".85rem", color: "#555" }}>Shot {i + 1}{s.scene ? ` · ${s.scene}` : ""}</div>
                      <label style={miniLabel}>Visual prompt</label>
                      <textarea value={s.visual_prompt ?? ""} onChange={(e) => { const n = [...editShots!]; n[i] = { ...n[i], visual_prompt: e.target.value }; setEditShots(n); }}
                        rows={2} style={miniField} />
                      <label style={miniLabel}>Narration</label>
                      <textarea value={s.narration ?? ""} onChange={(e) => { const n = [...editShots!]; n[i] = { ...n[i], narration: e.target.value }; setEditShots(n); }}
                        rows={2} style={miniField} />
                    </div>
                  ))}
                </div>
                <div style={{ display: "flex", gap: 12, marginTop: "1rem", flexWrap: "wrap", alignItems: "center" }}>
                  <button disabled={acting} onClick={() => decide("approve")} style={{ background: ACCENT, color: "#fff", border: "none", borderRadius: 7, padding: "0.6rem 1.2rem", fontWeight: 600, cursor: "pointer" }}>
                    {acting ? "…" : "Approve & render"}
                  </button>
                  <button disabled={acting} onClick={() => decide("regenerate")} title="Re-plan at a higher temperature for a different set of shots"
                    style={{ background: "#fff", color: ACCENT, border: `1px solid ${ACCENT}`, borderRadius: 7, padding: "0.6rem 1.2rem", fontWeight: 600, cursor: "pointer" }}>
                    ↻ Regenerate plan
                  </button>
                  <button disabled={acting} onClick={() => decide("reject")} style={{ background: "#fff", color: "#c5221f", border: "1px solid #e0b4b4", borderRadius: 7, padding: "0.6rem 1.2rem", fontWeight: 600, cursor: "pointer" }}>
                    Reject
                  </button>
                  {regenCount > 0 && <span style={{ fontSize: ".8rem", color: "#888" }}>regenerated {regenCount}× · temp {(regenCount * 0.1).toFixed(1)}</span>}
                </div>
              </section>
            )}

            {/* Result */}
            {job.status === "completed" && (
              <section style={{ margin: "1rem 0" }}>
                {job.video_url
                  ? <video controls src={job.video_url} style={{ width: "100%", borderRadius: 10, background: "#000" }} />
                  : <p style={{ color: "#666" }}>Finished — preparing the video…</p>}
                {job.qa && (
                  <p style={{ fontSize: ".85rem", color: job.qa.ok ? "#137333" : "#8a6d00", marginTop: 8 }}>
                    QA {job.qa.ok ? "passed" : "flagged"}{job.duration_s ? ` · ${job.duration_s}s` : ""}
                    {job.qa.notes?.length ? ` · ${job.qa.notes.join("; ")}` : ""}
                  </p>
                )}
                {job.render_seconds ? <p style={{ fontSize: ".8rem", color: "#999", marginTop: 4 }}>Rendered in {fmtDur(job.render_seconds)}.</p> : null}
              </section>
            )}

            {/* Per-shot result cards — stream in as each shot finishes */}
            {shotCards.length > 0 && (
              <section style={{ margin: "1.2rem 0" }}>
                <h3 style={{ margin: "0 0 .6rem", display: "flex", alignItems: "center", gap: 12 }}>
                  Shots{job.progress?.shots_total ? ` (${shotCards.length}/${job.progress.shots_total})` : ""}
                  {job.render_state && job.render_state.shots.length > 0 && (
                    <button onClick={() => setShowCandidates(true)}
                      style={{ fontSize: ".8rem", fontWeight: 600, color: ACCENT, border: `1px solid ${ACCENT}`, borderRadius: 6, background: "#fff", padding: "3px 10px", cursor: "pointer" }}>
                      ◇ Review candidates
                    </button>
                  )}
                </h3>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 12 }}>
                  {shotCards.map((s) => (
                    <div key={s.index} style={{ border: "1px solid #e5e5e5", borderRadius: 8, padding: ".6rem", background: "#fafafa" }}>
                      <div style={{ fontSize: ".8rem", fontWeight: 600, color: "#555" }}>Shot {(s.index ?? 0) + 1}{s.scene ? ` · ${s.scene}` : ""}</div>
                      {s.shot_key && shotUrls[s.shot_key]
                        ? <video src={shotUrls[s.shot_key]} controls preload="metadata" style={{ width: "100%", borderRadius: 6, background: "#000", marginTop: 6 }} />
                        : <div style={{ marginTop: 6, height: 120, borderRadius: 6, background: "#eee", display: "flex", alignItems: "center", justifyContent: "center", color: "#999", fontSize: ".8rem" }}>preparing…</div>}
                      <div style={{ fontSize: ".72rem", marginTop: 5 }}>
                        <span style={{ color: VERDICT_COLOR[s.verdict] ?? "#777", fontWeight: 600 }}>{s.verdict}</span>
                        {typeof s.prompt_adherence === "number" ? <span style={{ color: "#888" }}> · adherence {s.prompt_adherence}</span> : null}
                        {typeof s.artifacts === "number" ? <span style={{ color: "#888" }}> · artifacts {s.artifacts}</span> : null}
                        {s.candidates > 1 ? <span style={{ color: "#888" }}> · best of {s.candidates}</span> : null}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Live event log with timestamps (relative to the first event; absolute on hover) */}
            <details style={{ marginTop: "1.2rem" }} open={!TERMINAL.has(job.status)}>
              <summary style={{ cursor: "pointer", color: "#666", fontSize: ".85rem" }}>Activity ({events.length})</summary>
              <ul style={{ listStyle: "none", padding: 0, margin: "0.6rem 0", fontSize: ".82rem", fontFamily: "ui-monospace, monospace" }}>
                {events.map((e) => (
                  <li key={e.seq} style={{ padding: "2px 0", color: "#555", display: "flex", gap: 10 }}>
                    <span title={new Date(e.created_at).toLocaleString()} style={{ color: "#999", minWidth: 54 }}>
                      {relOffset(new Date(e.created_at).getTime() - startMs)}
                    </span>
                    <span>
                      <span style={{ color: ACCENT }}>{e.stage}</span>
                      {e.stage === "shot_written" && e.payload?.scene ? ` — ${e.payload.scene}` : ""}
                      {e.stage === "shot_done" && e.payload?.verdict ? ` — ${e.payload.verdict}` : ""}
                      {e.stage === "storyboard_ready" && e.payload?.beats ? ` — ${e.payload.beats} beats` : ""}
                    </span>
                  </li>
                ))}
              </ul>
            </details>
          </>
        )}
      </div>

      {/* Candidate review modal — view every take per shot, re-pick, regenerate, reassemble */}
      {showCandidates && job?.render_state && (
        <div onClick={() => setShowCandidates(false)}
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.5)", zIndex: 50, display: "flex", alignItems: "flex-start", justifyContent: "center", padding: "3vh 1rem", overflowY: "auto" }}>
          <div onClick={(e) => e.stopPropagation()}
            style={{ background: "#fff", borderRadius: 12, maxWidth: 920, width: "100%", padding: "1.25rem 1.4rem", boxShadow: "0 12px 48px rgba(0,0,0,.32)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h2 style={{ margin: 0 }}>Shots &amp; candidates</h2>
              <button onClick={() => setShowCandidates(false)} style={{ border: "none", background: "none", fontSize: "1.5rem", lineHeight: 1, cursor: "pointer", color: "#888" }}>×</button>
            </div>
            <p style={{ color: "#666", fontSize: ".85rem", margin: ".3rem 0 0" }}>Pick the best take per shot, regenerate more, then re-assemble the final video.</p>
            {job.status === "editing" && (
              <p style={{ color: ACCENT, fontSize: ".85rem", display: "flex", alignItems: "center", gap: 6 }}>
                <span className="va-spinner" /> Working on the home GPU — candidates update live{job.stage ? ` · ${job.stage}` : ""}.
              </p>
            )}
            {err && <p style={{ color: "#c5221f", fontSize: ".85rem" }}>{err}</p>}

            <div style={{ display: "grid", gap: 18, marginTop: 8 }}>
              {job.render_state.shots.map((s) => {
                const chosen = selections[s.index] ?? s.chosen_seed;
                return (
                  <div key={s.index} style={{ borderTop: "1px solid #eee", paddingTop: 12 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                      <b style={{ fontSize: ".9rem" }}>Shot {s.index + 1}{s.scene ? ` · ${s.scene}` : ""}</b>
                      <button disabled={editBusy || job.status === "editing"} onClick={() => regenerate(s.index)}
                        style={{ fontSize: ".78rem", color: ACCENT, border: `1px solid ${ACCENT}`, borderRadius: 6, background: "#fff", padding: "3px 10px", cursor: editBusy || job.status === "editing" ? "default" : "pointer", opacity: editBusy || job.status === "editing" ? 0.5 : 1 }}>
                        ↻ Regenerate 2 more
                      </button>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(190px, 1fr))", gap: 10 }}>
                      {s.candidates.map((c) => {
                        const on = chosen === c.seed;
                        return (
                          <label key={c.seed} style={{ border: `2px solid ${on ? ACCENT : "#e5e5e5"}`, borderRadius: 8, padding: 6, cursor: "pointer", display: "block", background: on ? "#eef4fe" : "#fff" }}>
                            {candUrls[c.shot_key]
                              ? <video src={candUrls[c.shot_key]} controls preload="metadata" style={{ width: "100%", borderRadius: 5, background: "#000" }} />
                              : <div style={{ height: 110, background: "#eee", borderRadius: 5, display: "flex", alignItems: "center", justifyContent: "center", color: "#999", fontSize: ".8rem" }}>…</div>}
                            <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 5, fontSize: ".75rem" }}>
                              <input type="radio" name={`sel-${s.index}`} checked={on} onChange={() => setSelections((v) => ({ ...v, [s.index]: c.seed }))} />
                              <span style={{ color: VERDICT_COLOR[c.verdict] ?? "#777", fontWeight: 600 }}>{c.verdict}</span>
                              <span style={{ color: "#999" }}>· {c.score.toFixed(2)}</span>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            <div style={{ display: "flex", gap: 12, marginTop: 18, justifyContent: "flex-end", alignItems: "center" }}>
              <span style={{ fontSize: ".78rem", color: "#888", marginRight: "auto" }}>Regenerate + reassemble run on the home GPU (a few minutes each).</span>
              <button onClick={() => setShowCandidates(false)} style={{ background: "#fff", border: "1px solid #ccc", borderRadius: 7, padding: "0.6rem 1.1rem", cursor: "pointer", fontWeight: 600, color: "#333" }}>Close</button>
              <button disabled={editBusy || job.status === "editing"} onClick={reassemble}
                style={{ background: ACCENT, color: "#fff", border: "none", borderRadius: 7, padding: "0.6rem 1.2rem", fontWeight: 600, cursor: editBusy || job.status === "editing" ? "default" : "pointer", opacity: editBusy || job.status === "editing" ? 0.6 : 1 }}>
                {editBusy ? "…" : "Use selections & re-assemble"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const VERDICT_COLOR: Record<string, string> = { pass: "#137333", passed: "#137333", revise: "#8a6d00", reject: "#c5221f" };
const miniBtn = (disabled: boolean): React.CSSProperties => ({
  padding: "2px 8px", fontSize: ".72rem", fontWeight: 600, borderRadius: 5, border: "1px solid #ccc",
  background: "#fff", color: disabled ? "#aaa" : "#333", cursor: disabled ? "default" : "pointer",
});
const miniLabel: React.CSSProperties = { fontSize: ".75rem", fontWeight: 600, color: "#666", display: "block", margin: "6px 0 2px" };
const miniField: React.CSSProperties = { width: "100%", padding: "0.4rem", border: "1px solid #ddd", borderRadius: 5, font: "inherit", fontSize: ".85rem", resize: "vertical" };
