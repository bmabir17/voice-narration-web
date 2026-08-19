import { useEffect, useState } from "react";
import { api, uploadCharacterFace, FACE_CONSENT_VERSION, type FaceRow } from "~/lib/api";
import { supabase } from "~/lib/supabase";
import { Tip } from "~/components/Tooltip";

const ACCENT = "#1a73e8";

// Saved cast faces reusable across video jobs (character_ids). Biometric likeness → consent captured
// here at registration; the video form just picks from this library (no per-job consent re-attestation).
export default function MyFaces() {
  const [faces, setFaces] = useState<FaceRow[] | null>(null); // null = loading
  const [thumbs, setThumbs] = useState<Record<string, string>>({});
  const [busyId, setBusyId] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  // add form
  const [file, setFile] = useState<File | null>(null);
  const [name, setName] = useState("");
  const [consent, setConsent] = useState(false);
  const [adding, setAdding] = useState(false);

  function load() {
    api.listFaces().then((r) => setFaces(r.faces)).catch((e: any) => { setErr(e.message); setFaces([]); });
  }
  useEffect(load, []);

  // Mint signed thumbnail URLs (storage RLS lets a user sign their own objects).
  useEffect(() => {
    (async () => {
      const add: Record<string, string> = {};
      for (const f of faces ?? []) {
        if (thumbs[f.id]) continue;
        const { data } = await supabase.storage.from("character-refs").createSignedUrl(f.image_ref, 3600);
        if (data?.signedUrl) add[f.id] = data.signedUrl;
      }
      if (Object.keys(add).length) setThumbs((t) => ({ ...t, ...add }));
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [faces]);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    if (!file || !consent || !name.trim()) return;
    setAdding(true); setErr(null);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { id, ref } = await uploadCharacterFace(user!.id, file);
      await api.registerFace({ id, name: name.trim(), image_ref: ref, consent_checkbox: true, consent_statement_version: FACE_CONSENT_VERSION });
      setFile(null); setName(""); setConsent(false);
      (e.target as HTMLFormElement).reset();
      load();
    } catch (e: any) { setErr(e.message); } finally { setAdding(false); }
  }

  async function remove(f: FaceRow) {
    if (!confirm(`Delete cast face "${f.name}"? This removes the image and can't be undone.`)) return;
    setBusyId(f.id); setErr(null);
    try {
      await api.deleteFace(f.id);
      setFaces((v) => (v ?? []).filter((x) => x.id !== f.id));
    } catch (e: any) { setErr(e.message); } finally { setBusyId(null); }
  }

  return (
    <main style={{ maxWidth: 760, margin: "0 auto", padding: "2rem 1.25rem" }}>
      <h1>My cast
        <Tip title="My cast">Save a person's face once and reuse it in all your videos — the same person will appear in every scene. Only add people you have the right to use, and confirm when asked.</Tip>
      </h1>
      <p style={{ color: "#666", marginTop: 0 }}>Save people's faces once and reuse them across videos — the planner casts them into shots and a face-swap places them in the frame.</p>
      {err && <p style={{ color: "#c5221f" }}>{err}</p>}

      {/* Add a face */}
      <form onSubmit={add} style={{ border: "1px solid #e5e5e5", borderRadius: 10, padding: "1rem", margin: "1rem 0", display: "grid", gap: "0.7rem" }}>
        <b style={{ fontSize: ".95rem" }}>Add a face</b>
        <div style={{ display: "flex", gap: "0.8rem", flexWrap: "wrap", alignItems: "center" }}>
          <input placeholder="Name (e.g. Elias)" value={name} onChange={(e) => setName(e.target.value)} required
            style={{ padding: "0.5rem", border: "1px solid #ccc", borderRadius: 6, font: "inherit", flex: 1, minWidth: 160 }} />
          <input type="file" accept="image/*" required onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
        </div>
        <label style={{ display: "flex", gap: 8, alignItems: "flex-start", fontSize: ".85rem", color: "#333" }}>
          <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
          <span>I have the right to use this person's likeness. Generated video is AI-synthesized and labeled.</span>
        </label>
        <div>
          <button disabled={adding || !file || !consent || !name.trim()}
            style={{ background: ACCENT, color: "#fff", border: "none", borderRadius: 7, padding: "0.55rem 1.1rem", fontWeight: 600, cursor: "pointer", opacity: adding ? 0.6 : 1 }}>
            {adding ? "Saving…" : "Save face"}
          </button>
        </div>
      </form>

      {/* Library */}
      {faces === null ? <p style={{ color: "#666" }}>Loading…</p>
        : faces.length === 0 ? <p style={{ color: "#666" }}>No saved faces yet.</p>
        : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: 14 }}>
            {faces.map((f) => (
              <div key={f.id} style={{ border: "1px solid #e5e5e5", borderRadius: 10, padding: ".6rem", background: "#fafafa" }}>
                <div style={{ aspectRatio: "1", borderRadius: 8, overflow: "hidden", background: "#eee", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {thumbs[f.id]
                    ? <img src={thumbs[f.id]} alt={f.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    : <span style={{ color: "#aaa", fontSize: ".8rem" }}>…</span>}
                </div>
                <div style={{ fontWeight: 600, fontSize: ".9rem", marginTop: 6, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{f.name}</div>
                <button type="button" onClick={() => remove(f)} disabled={busyId === f.id}
                  style={{ marginTop: 6, width: "100%", padding: "0.3rem", fontSize: ".78rem", color: "#c5221f", border: "1px solid #e6c0c0", borderRadius: 6, background: "#fff", cursor: "pointer" }}>
                  {busyId === f.id ? "Deleting…" : "Delete"}
                </button>
              </div>
            ))}
          </div>
        )}
    </main>
  );
}
