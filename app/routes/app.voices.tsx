import { useEffect, useState } from "react";
import { Link } from "react-router";
import { api } from "~/lib/api";

interface Voice {
  voice_id: string; language: string; accent: string | null; model: string; source: string;
}

export default function MyVoices() {
  const [voices, setVoices] = useState<Voice[] | null>(null); // null = loading
  const [busyId, setBusyId] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  function load() {
    api.listVoices()
      .then((r: any) => setVoices((r.voices as Voice[]).filter((v) => v.source === "cloned")))
      .catch((e: any) => { setErr(e.message); setVoices([]); });
  }
  useEffect(load, []);

  async function remove(v: Voice) {
    if (!confirm(`Delete voice "${v.voice_id}"? This also removes its reference audio and can't be undone.`)) return;
    setBusyId(v.voice_id); setErr(null);
    try {
      await api.deleteVoice(v.voice_id);
      setVoices((vs) => (vs ?? []).filter((x) => x.voice_id !== v.voice_id));
    } catch (e: any) { setErr(e.message); } finally { setBusyId(null); }
  }

  return (
    <main style={{ maxWidth: 720, margin: "0 auto", padding: "2rem 1.25rem" }}>
      <h1>My voices</h1>
      <p><Link to="/app/voices/new">+ Add a voice</Link></p>
      {err && <p style={{ color: "crimson" }}>{err}</p>}
      {voices === null ? (
        <p style={{ color: "#666" }}>Loading…</p>
      ) : voices.length === 0 ? (
        <p style={{ color: "#666" }}>You haven't added any voices yet.</p>
      ) : (
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead><tr style={{ textAlign: "left", borderBottom: "1px solid #ddd" }}>
            <th>Voice</th><th>Language</th><th>Model</th><th></th></tr></thead>
          <tbody>
            {voices.map((v) => (
              <tr key={v.voice_id} style={{ borderBottom: "1px solid #f0f0f0" }}>
                <td><code>{v.voice_id}</code></td>
                <td>{v.language}{v.accent ? ` (${v.accent})` : ""}</td>
                <td>{v.model}</td>
                <td style={{ textAlign: "right" }}>
                  <button type="button" onClick={() => remove(v)} disabled={busyId === v.voice_id}
                          style={{ color: "crimson", padding: "0.35rem 0.8rem", cursor: "pointer" }}>
                    {busyId === v.voice_id ? "Deleting…" : "Delete"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </main>
  );
}
