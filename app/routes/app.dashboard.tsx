import { useEffect, useState } from "react";
import { api } from "~/lib/api";
import { supabase } from "~/lib/supabase";
import { DisclosureBadge } from "~/components/DisclosureBadge";

interface JobRow { id: string; status: string; voice_id: string; language: string;
  progress: { chapters_done: number; chapters_total: number }; created_at: string; }

export default function Dashboard() {
  const [jobs, setJobs] = useState<JobRow[]>([]);
  const [usage, setUsage] = useState<any>(null);

  useEffect(() => {
    api.listJobs().then((r: any) => setJobs(r.jobs)).catch(() => {});
    api.usage().then(setUsage).catch(() => {});
    // Realtime: refresh on any change to this user's jobs (no polling).
    const ch = supabase.channel("jobs")
      .on("postgres_changes", { event: "*", schema: "public", table: "jobs" },
          () => api.listJobs().then((r: any) => setJobs(r.jobs)).catch(() => {}))
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  return (
    <main style={{ maxWidth: 900, margin: "0 auto", padding: "2rem 1.25rem" }}>
      <h1>Dashboard <DisclosureBadge /></h1>
      {usage && (
        <p>Usage: {usage.minutes_used}/{usage.minutes_limit} min this period ({usage.tier}).</p>
      )}
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead><tr style={{ textAlign: "left", borderBottom: "1px solid #ddd" }}>
          <th>Job</th><th>Voice</th><th>Status</th><th>Progress</th></tr></thead>
        <tbody>
          {jobs.map((j) => (
            <tr key={j.id} style={{ borderBottom: "1px solid #f0f0f0" }}>
              <td><code>{j.id.slice(0, 12)}</code></td>
              <td>{j.voice_id}</td>
              <td>{j.status}</td>
              <td>{j.progress.chapters_done}/{j.progress.chapters_total}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {jobs.length === 0 && <p style={{ color: "#666" }}>No jobs yet.</p>}
    </main>
  );
}
