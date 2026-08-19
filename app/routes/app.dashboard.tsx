import { Fragment, useEffect, useState } from "react";
import { Link } from "react-router";
import { api, type VideoJobRow, type UsageResponse, jobLogline } from "~/lib/api";
import { supabase } from "~/lib/supabase";
import { DisclosureBadge } from "~/components/DisclosureBadge";
import { Tip } from "~/components/Tooltip";
import { GuidedTour, type TourStep } from "~/components/GuidedTour";
import { currentUserId, hasOnboarded, markOnboarded } from "~/lib/onboarding";

interface JobRow { id: string; status: string; voice_id: string; language: string;
  progress: { chapters_done: number; chapters_total: number }; created_at: string; }

interface Output { chapter: number; title: string | null; url: string; }

const STATUS_COLOR: Record<string, string> = {
  completed: "#137333", failed: "#c5221f",
  processing: "#1a73e8", assembling: "#1a73e8", queued: "#8a6d00",
};

const VIDEO_STATUS_COLOR: Record<string, string> = {
  completed: "#137333", failed: "#c5221f", cancelled: "#8a6d00", awaiting_plan: "#8a6d00",
  planning: "#1a73e8", rendering: "#1a73e8", assembling: "#1a73e8", qa: "#1a73e8",
  claimed: "#1a73e8", queued: "#8a6d00",
};

function expiryShort(iso: string | null): { label: string; soon: boolean } | null {
  if (!iso) return null;
  const days = Math.ceil((new Date(iso).getTime() - Date.now()) / 86_400_000);
  if (days <= 0) return { label: "expired", soon: true };
  return { label: new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" }), soon: days <= 7 };
}

function UsageBar({ label, used, limit, suffix, accent, warn }: {
  label: string; used: number; limit: number; suffix: string; accent: string; warn: string;
}) {
  const pct = limit > 0 ? Math.min(100, Math.round((used / limit) * 100)) : 0;
  const over = limit > 0 && used >= limit;
  const color = over ? warn : accent;
  return (
    <div style={{ flex: 1, minWidth: 220 }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: ".85rem", marginBottom: 4 }}>
        <span style={{ fontWeight: 600, color: "#333" }}>{label}</span>
        <span style={{ color: over ? warn : "#555" }}>
          {used}/{limit} {suffix}{limit > 0 ? ` (${pct}%)` : ""}
        </span>
      </div>
      <div style={{ height: 10, borderRadius: 6, background: "#ececec", overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${pct}%`, background: color, borderRadius: 6, transition: "width .3s ease" }} />
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [jobs, setJobs] = useState<JobRow[]>([]);
  const [videos, setVideos] = useState<VideoJobRow[]>([]);
  const [usage, setUsage] = useState<UsageResponse | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const [outputs, setOutputs] = useState<Record<string, { format: string; items: Output[] }>>({});
  const [loadingId, setLoadingId] = useState<string | null>(null);
  // First-login guided tour
  const [tourOpen, setTourOpen] = useState(false);

  useEffect(() => {
    // A brand-new user (first session on this browser) gets the guided tour once.
    currentUserId().then((uid) => {
      if (uid && !hasOnboarded(uid)) setTourOpen(true);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    api.listJobs().then((r: any) => setJobs(r.jobs)).catch(() => {});
    api.listVideoJobs().then((r) => setVideos(r.jobs)).catch(() => {});
    api.usage().then(setUsage).catch(() => {});
    // Realtime: refresh on any change to this user's jobs (no polling). Requires public.jobs to be
    // in the supabase_realtime publication — see migration 0006_realtime_jobs.sql.
    const ch = supabase.channel("jobs")
      .on("postgres_changes", { event: "*", schema: "public", table: "jobs" },
          () => api.listJobs().then((r: any) => setJobs(r.jobs)).catch(() => {}))
      .on("postgres_changes", { event: "*", schema: "public", table: "video_jobs" }, (p: any) => {
        // Patch the local list in place from each change payload (video_jobs is REPLICA IDENTITY
        // FULL), matching the pattern used on the video page.
        if (p.eventType === "DELETE") { const oid = p.old?.id; if (oid) setVideos((v) => v.filter((j) => j.id !== oid)); return; }
        const r = p.new;
        const row: VideoJobRow = { id: r.id, status: r.status, stage: r.stage ?? null, progress: r.progress,
          style_brief: r.style_brief ?? null, created_at: r.created_at, expires_at: r.expires_at ?? null,
          plan: r.plan ?? null };
        setVideos((v) => v.some((j) => j.id === row.id) ? v.map((j) => (j.id === row.id ? { ...j, ...row } : j)) : [row, ...v]);
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  async function toggle(job: JobRow) {
    if (job.status !== "completed") return;
    if (openId === job.id) { setOpenId(null); return; }
    setOpenId(job.id);
    if (!outputs[job.id]) {
      setLoadingId(job.id);
      try {
        const r: any = await api.getJob(job.id);
        setOutputs((o) => ({ ...o, [job.id]: { format: r.format ?? "mp3", items: r.outputs ?? [] } }));
      } catch {
        setOutputs((o) => ({ ...o, [job.id]: { format: "mp3", items: [] } }));
      } finally { setLoadingId(null); }
    }
  }

  return (
    <main style={{ maxWidth: 900, margin: "0 auto", padding: "2rem 1.25rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <h1>Dashboard <DisclosureBadge /></h1>
        <button onClick={() => setTourOpen(true)} style={{ border: "1px solid #d1d5db", background: "#fff", borderRadius: 7, padding: "0.35rem 0.8rem", cursor: "pointer", fontSize: ".82rem", color: "#374151" }}>Replay tutorial</button>
      </div>

      <GuidedTour
        open={tourOpen}
        onClose={() => { setTourOpen(false); }}
        onFinish={() => { currentUserId().then((uid) => { if (uid) markOnboarded(uid); }).catch(() => {}); }}
        steps={[
          {
            title: "Welcome to your dashboard",
            body: <>This is your home base. It shows your <b>usage for the month</b>, plus every <b>video</b> and <b>voice narration</b> job you've started. Let's walk through what each part does.</>,
          },
          {
            title: "Your monthly usage",
            body: <>The bars at the top track how much of your plan you've used this month — <b>narration minutes</b> and <b>videos rendered</b>. When a bar fills up, upgrade to keep going.</>,
            target: "dash-usage",
          },
          {
            title: "Start a new video",
            body: <>Hit <b>+ New video</b> to turn a story manuscript into a narrated, subtitled video. You'll pick a style, voice and shots before it renders on our GPU.</>,
            target: "dash-new-video",
          },
          {
            title: "Your video jobs",
            body: <>Every video you've created appears here. Watch the <b>status</b> (queued → planning → rendering → done) and <b>shot count</b> update live. Click <b>open →</b> to see the video detail page.</>,
            target: "dash-videos",
          },
          {
            title: "Your voice jobs",
            body: <>Audio narrations show up here. Click a <b>completed</b> job to expand it and play or download each chapter. Jobs expire — download before they're cleaned up.</>,
            target: "dash-voices",
          },
          {
            title: "You're all set",
            body: <>You can replay this tour anytime from the <b>Replay tutorial</b> button, or hover any <b>?</b> icon for a quick reminder. Have fun!</>,
          },
        ]}
      />

      {/* Usage this period */}
      {usage && (
        <div id="dash-usage" style={{ border: "1px solid #e5e5e5", borderRadius: 10, padding: "1rem 1.2rem", marginBottom: "1.5rem", background: "#fafafa" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <span style={{ fontSize: ".9rem", fontWeight: 600, color: "#333" }}>Usage · {usage.period}
              <Tip title="Monthly usage">These bars show how much of your plan you've used this month. When a bar fills up, you've hit your limit for now.</Tip>
            </span>
            <span style={{ fontSize: ".8rem", color: "#777" }}>
              {usage.tier} tier{usage.current_period_end ? ` · renews ${new Date(usage.current_period_end).toLocaleDateString()}` : ""}
              {usage.cancel_at ? ` · cancels ${new Date(usage.cancel_at).toLocaleDateString()}` : ""}
            </span>
          </div>
          <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
            <UsageBar label="Narration minutes" used={usage.minutes_used} limit={usage.minutes_limit}
              suffix="min" accent="#1858c7" warn="#c5221f" />
            <UsageBar label="Render videos" used={usage.videos_used} limit={usage.videos_limit}
              suffix="video" accent="#0d7a3d" warn="#c5221f" />
          </div>
          {usage.minutes_limit > 0 && usage.minutes_used >= usage.minutes_limit && (
            <div style={{ marginTop: 10, fontSize: ".85rem", color: "#c5221f" }}>
              You've reached your {usage.tier} plan's limit this period.{" "}
              <Link to="/pricing" style={{ color: "#c5221f", textDecoration: "underline" }}>Upgrade</Link> for more.
            </div>
          )}
        </div>
      )}

      {/* Video jobs */}
      <div id="dash-videos" style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", margin: "0 0 .4rem" }}>
        <h2 style={{ margin: 0 }}>Video jobs
          <Tip title="Video jobs">These are the videos you've made from your stories. The status updates on its own as the video is being made. Videos are kept for about a month, so be sure to download yours before then.</Tip>
        </h2>
        <Link to="/app/video" id="dash-new-video" style={{
          background: "#1858c7", color: "#fff", padding: "0.45rem 1rem", borderRadius: 8,
          fontSize: ".85rem", fontWeight: 600, textDecoration: "none",
        }}>+ New video</Link>
      </div>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead><tr style={{ textAlign: "left", borderBottom: "1px solid #ddd" }}>
          <th>Topic</th><th>Style</th><th>Status</th><th>Shots</th><th>Expires</th><th></th></tr></thead>
        <tbody>
          {videos.map((j) => {
            const ex = expiryShort(j.expires_at);
            return (
              <tr key={j.id} style={{ borderBottom: "1px solid #f0f0f0" }}>
                <td>
                  <div title={j.id} style={{ fontWeight: 500, color: "#222" }}>
                    {jobLogline(j) ?? <em style={{ color: "#999" }}>…</em>}
                  </div>
                  <code style={{ fontSize: 11, color: "#999" }}>{j.id.slice(0, 14)}</code>
                </td>
                <td style={{ color: "#666" }}>{j.style_brief ?? "—"}</td>
                <td><span style={{ color: VIDEO_STATUS_COLOR[j.status] ?? "#666", fontWeight: 500 }}>{j.status}</span></td>
                <td>{j.progress?.shots_done ?? 0}/{j.progress?.shots_total ?? 0}</td>
                <td title={j.expires_at ?? ""} style={{ color: ex?.soon ? "#c5221f" : "#999", fontSize: 13 }}>
                  {ex?.label ?? "—"}
                </td>
                <td><Link to={`/app/video/${j.id}`} style={{ color: "#1858c7" }}>open →</Link></td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {videos.length === 0 && <p style={{ color: "#666" }}>No video jobs yet.</p>}

      {/* Voice jobs */}
      <h2 id="dash-voices" style={{ margin: "1.5rem 0 .4rem" }}>Voice jobs
        <Tip title="Voice jobs">These are the audio narrations you've made from your stories. Click a finished one to listen to it or download the files. Audio is kept for a while, so grab yours before it's cleaned up.</Tip>
      </h2>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead><tr style={{ textAlign: "left", borderBottom: "1px solid #ddd" }}>
          <th>Job</th><th>Voice</th><th>Status</th><th>Progress</th><th></th></tr></thead>
        <tbody>
          {jobs.map((j) => {
            const done = j.status === "completed";
            const isOpen = openId === j.id;
            const out = outputs[j.id];
            return (
              <Fragment key={j.id}>
                <tr onClick={() => toggle(j)}
                    style={{ borderBottom: "1px solid #f0f0f0", cursor: done ? "pointer" : "default" }}>
                  <td><code>{j.id.slice(0, 12)}</code></td>
                  <td>{j.voice_id}</td>
                  <td><span style={{ color: STATUS_COLOR[j.status] ?? "#666", fontWeight: 500 }}>{j.status}</span></td>
                  <td>{j.progress.chapters_done}/{j.progress.chapters_total}</td>
                  <td style={{ color: "#1a73e8" }}>{done ? (isOpen ? "▾ hide" : "▸ play") : ""}</td>
                </tr>
                {isOpen && (
                  <tr>
                    <td colSpan={5} style={{ padding: "0.5rem 0.25rem 1rem" }}>
                      {loadingId === j.id && <span style={{ color: "#666" }}>Loading audio…</span>}
                      {out?.items.map((o) => (
                        <div key={o.chapter} style={{ display: "flex", alignItems: "center", gap: 10, margin: "0.4rem 0" }}>
                          <span style={{ minWidth: 120, color: "#555" }}>{o.title || `Chapter ${o.chapter + 1}`}</span>
                          <audio controls preload="none" src={o.url} style={{ height: 34 }} />
                          <a href={`${o.url}&download=${encodeURIComponent(`${j.id.slice(0, 12)}-ch${o.chapter + 1}.${out.format}`)}`}>
                            Download
                          </a>
                        </div>
                      ))}
                      {out && out.items.length === 0 && loadingId !== j.id &&
                        <span style={{ color: "#666" }}>No audio found for this job.</span>}
                    </td>
                  </tr>
                )}
              </Fragment>
            );
          })}
        </tbody>
      </table>
      {jobs.length === 0 && <p style={{ color: "#666" }}>No jobs yet.</p>}
    </main>
  );
}