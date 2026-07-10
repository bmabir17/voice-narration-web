export function meta() {
  return [{ title: "Blog — Voice Narration" },
          { name: "description", content: "Guides on AI audiobook narration, Bangla TTS, and self-publishing audio." }];
}

// Posts are MDX files under app/content/blog/*.mdx; a build step adds each /blog/:slug to the
// prerender list. This index lists them. Ship ~2/week (business plan §F).
export default function BlogIndex() {
  return (
    <main style={{ maxWidth: 820, margin: "0 auto", padding: "3rem 1.25rem" }}>
      <h1>Blog</h1>
      <p style={{ color: "#666" }}>Guides on AI narration, Bangla TTS, and publishing audio at scale.</p>
    </main>
  );
}
