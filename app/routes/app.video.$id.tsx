import { useEffect, useRef, useState } from "react";
import { useParams, Link, useNavigate } from "react-router";
import { api, type VideoJobDetail, type VideoJobRow } from "~/lib/api";
import { supabase } from "~/lib/supabase";
import { DisclosureBadge } from "~/components/DisclosureBadge";

const ACCENT = "#1a73e8";
const STAGES = ["Plan", "Review", "Render", "Assemble", "QA", "Done"];
const STAGE_INDEX: Record<string, number> = {
  queued: 0, claimed: 0, planning: 0, awaiting_plan: 1,
  rendering: 2, assembling: 3, qa: 4, completed: 5,
};
const TERMINAL = new Set(["completed", "failed", "cancelled"]);
const STATUS_COLOR: Record<string, string> = {
  completed: "#137333", failed: "#c5221f", cancelled: "#8a6d00", awaiting_plan: "#8a6d00",
  planning: ACCENT, rendering: ACCENT, assembling: ACCENT, qa: ACCENT, claimed: ACCENT, queued: "#8a6d00",
};

interface Ev { seq: number; stage: string; payload: any; }

export default function VideoRun() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const [job, setJob] = useState<VideoJobDetail | null>(null);
  const [jobs, setJobs] = useState<VideoJobRow[]>([]);
  const [events, setEvents] = useState<Ev[]>([]);
  const [editShots, setEditShots] = useState<any[] | null>(null);
  const [acting, setActing] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const seen = useRef<Set<number>>(new Set());

  async function refetch() {
    try { setJob(await api.getVideoJob(id)); } catch (e: any) { setErr(e.message); }
  }
  const refetchJobs = () => api.listVideoJobs().then((r) => setJobs(r.jobs)).catch(() => {});
  async function loadEvents() {
    const { data } = await supabase.from("video_job_events").select("seq,stage,payload")
      .eq("job_id", id).order("seq");
    if (data) { seen.current = new Set(data.map((e: any) => e.seq)); setEvents(data as Ev[]); }
  }

  useEffect(() => {
    setJob(null); setEvents([]); setEditShots(null); seen.current = new Set();
    refetch(); loadEvents(); refetchJobs();
    const ch = supabase.channel(`video_job_${id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "video_jobs", filter: `id=eq.${id}` }, refetch)
      .on("postgres_changes", { event: "*", schema: "public", table: "video_jobs" }, refetchJobs)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "video_job_events", filter: `job_id=eq.${id}` },
        (p: any) => { const e = p.new as Ev; if (!seen.current.has(e.seq)) { seen.current.add(e.seq); setEvents((v) => [...v, e]); } })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    if (job?.status === "awaiting_plan" && job.plan && editShots === null) {
      setEditShots(job.plan.shots.map((s) => ({ ...s })));
    }
    if (job && job.status !== "awaiting_plan" && editShots !== null) setEditShots(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [job?.status]);

  async function decide(action: "approve" | "reject") {
    if (!job) return;
    setActing(true); setErr(null);
    try {
      const body: any = { action };
      if (action === "approve" && job.plan && editShots) body.plan = { brief: job.plan.brief, shots: editShots };
      await api.videoPlanDecision(id, body);
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

  return (
    <div style={{ display: "flex", gap: 22, maxWidth: 1140, margin: "0 auto", padding: "1.5rem 1.25rem", alignItems: "flex-start" }}>
      {/* Left column — past videos */}
      <aside style={{ width: 250, flexShrink: 0, position: "sticky", top: 70 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <b style={{ fontSize: ".9rem" }}>Your videos</b>
          <Link to="/app/video" style={{ color: ACCENT, fontSize: ".85rem" }}>+ New</Link>
        </div>
        <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: 8 }}>
          {jobs.map((j) => {
            const current = j.id === id;
            return (
              <li key={j.id} style={{
                border: `1px solid ${current ? ACCENT : "#e5e5e5"}`, borderRadius: 8, padding: "0.5rem 0.6rem",
                background: current ? "#eef4fe" : "#fff",
              }}>
                <div style={{ fontFamily: "ui-monospace, monospace", fontSize: ".72rem", color: "#666" }}>{j.id.slice(0, 16)}</div>
                <div style={{ fontSize: ".8rem", color: "#444", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{j.style_brief ?? "—"}</div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 6 }}>
                  <span style={{ color: STATUS_COLOR[j.status] ?? "#666", fontWeight: 600, fontSize: ".72rem" }}>{j.status}</span>
                  <span style={{ display: "flex", gap: 6 }}>
                    <button onClick={() => navigate(`/app/video/${j.id}`)} disabled={current}
                      style={miniBtn(current)}>view</button>
                    <button onClick={() => del(j.id)} disabled={deleting === j.id}
                      style={{ ...miniBtn(false), color: "#c5221f", borderColor: "#e6c0c0" }}>
                      {deleting === j.id ? "…" : "delete"}
                    </button>
                  </span>
                </div>
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
            {/* Stage rail */}
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", margin: "1rem 0" }}>
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
              <span style={{ alignSelf: "center", color: failed ? "#c5221f" : "#666", fontSize: ".85rem", marginLeft: 6 }}>
                {job.status}{job.stage && !TERMINAL.has(job.status) ? ` · ${job.stage}` : ""}
                {job.progress?.shots_total ? ` · shot ${job.progress.shots_done}/${job.progress.shots_total}` : ""}
              </span>
            </div>

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
                <div style={{ display: "flex", gap: 12, marginTop: "1rem" }}>
                  <button disabled={acting} onClick={() => decide("approve")} style={{ background: ACCENT, color: "#fff", border: "none", borderRadius: 7, padding: "0.6rem 1.2rem", fontWeight: 600, cursor: "pointer" }}>
                    {acting ? "…" : "Approve & render"}
                  </button>
                  <button disabled={acting} onClick={() => decide("reject")} style={{ background: "#fff", color: "#c5221f", border: "1px solid #e0b4b4", borderRadius: 7, padding: "0.6rem 1.2rem", fontWeight: 600, cursor: "pointer" }}>
                    Reject
                  </button>
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
              </section>
            )}

            {/* Live event log */}
            <details style={{ marginTop: "1.2rem" }} open={!TERMINAL.has(job.status)}>
              <summary style={{ cursor: "pointer", color: "#666", fontSize: ".85rem" }}>Activity ({events.length})</summary>
              <ul style={{ listStyle: "none", padding: 0, margin: "0.6rem 0", fontSize: ".82rem", fontFamily: "ui-monospace, monospace" }}>
                {events.map((e) => (
                  <li key={e.seq} style={{ padding: "2px 0", color: "#555" }}>
                    <span style={{ color: ACCENT }}>{e.stage}</span>
                    {e.stage === "shot_written" && e.payload?.scene ? ` — ${e.payload.scene}` : ""}
                    {e.stage === "shot_done" && e.payload?.verdict ? ` — ${e.payload.verdict}` : ""}
                    {e.stage === "storyboard_ready" && e.payload?.beats ? ` — ${e.payload.beats} beats` : ""}
                  </li>
                ))}
              </ul>
            </details>
          </>
        )}
      </div>
    </div>
  );
}

const miniBtn = (disabled: boolean): React.CSSProperties => ({
  padding: "2px 8px", fontSize: ".72rem", fontWeight: 600, borderRadius: 5, border: "1px solid #ccc",
  background: "#fff", color: disabled ? "#aaa" : "#333", cursor: disabled ? "default" : "pointer",
});
const miniLabel: React.CSSProperties = { fontSize: ".75rem", fontWeight: 600, color: "#666", display: "block", margin: "6px 0 2px" };
const miniField: React.CSSProperties = { width: "100%", padding: "0.4rem", border: "1px solid #ddd", borderRadius: 5, font: "inherit", fontSize: ".85rem", resize: "vertical" };
