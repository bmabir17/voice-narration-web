export function meta() {
  return [{ title: "Docs & FAQ — Voice Narration" },
          { name: "description", content: "API docs, format guides, and FAQ for AI voice narration." }];
}

// Docs/FAQ are authored as MDX under app/content/docs and rendered here; prerendered so they rank
// and deflect support tickets. This shell links the sections.
export default function Docs() {
  return (
    <main style={{ maxWidth: 820, margin: "0 auto", padding: "3rem 1.25rem" }}>
      <h1>Documentation</h1>
      <ul style={{ lineHeight: 1.9 }}>
        <li>Getting started — submit your first narration job</li>
        <li>API reference — <code>POST /v1/jobs</code>, status polling, API keys</li>
        <li>Output formats — MP3 192 kbps, WAV 44.1 kHz, ACX chaptering</li>
        <li>Voice cloning & consent policy</li>
        <li>FAQ — quotas, retention, "processed within N hours" SLA</li>
      </ul>
    </main>
  );
}
