import { Fragment, useEffect, useState } from "react";
import { api } from "~/lib/api";
import { supabase } from "~/lib/supabase";
import { DisclosureBadge } from "~/components/DisclosureBadge";

interface JobRow { id: string; status: string; voice_id: string; language: string;
  progress: { chapters_done: number; chapters_total: number }; created_at: string; }

interface Output { chapter: number; title: string | null; url: string; }

const STATUS_COLOR: Record<string, string> = {
  completed: "#137333", failed: "#c5221f",
  processing: "#1a73e8", assembling: "#1a73e8", queued: "#8a6d00",
};

export default function Dashboard() {
  const [jobs, setJobs] = useState<JobRow[]>([]);
  const [usage, setUsage] = useState<any>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const [outputs, setOutputs] = useState<Record<string, { format: string; items: Output[] }>>({});
  const [loadingId, setLoadingId] = useState<string | null>(null);

  useEffect(() => {
    api.listJobs().then((r: any) => setJobs(r.jobs)).catch(() => {});
    api.usage().then(setUsage).catch(() => {});
    // Realtime: refresh on any change to this user's jobs (no polling). Requires public.jobs to be
    // in the supabase_realtime publication — see migration 0006_realtime_jobs.sql.
    const ch = supabase.channel("jobs")
      .on("postgres_changes", { event: "*", schema: "public", table: "jobs" },
          () => api.listJobs().then((r: any) => setJobs(r.jobs)).catch(() => {}))
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
      <h1>Dashboard <DisclosureBadge /></h1>
      {usage && (
        <p>Usage: {usage.minutes_used}/{usage.minutes_limit} min this period ({usage.tier}).</p>
      )}
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
