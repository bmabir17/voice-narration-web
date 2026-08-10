import { Link } from "react-router";
import { DisclosureBadge } from "~/components/DisclosureBadge";

export function meta() {
  return [
    { title: "Manuscript → Narrated Video & Audiobooks | Voice Narration" },
    { name: "description", content: "Turn a manuscript into a fully narrated, music-scored animated video in minutes — AI director, scene-by-scene storyboard, best-of-N candidates, character faces, voice cloning in English/Hindi/Bangla. Also ACX-ready audiobooks." },
    { "script:ld+json": {
        "@context": "https://schema.org", "@type": "SoftwareApplication",
        name: "Voice Narration", applicationCategory: "MultimediaApplication",
        offers: { "@type": "Offer", price: "22", priceCurrency: "USD" },
      } },
  ];
}

const ACCENT = "#1a73e8";
const card: React.CSSProperties = {
  border: "1px solid #e5e5e5", borderRadius: 10, padding: "1.1rem 1.2rem", background: "#fff",
};
const chip: React.CSSProperties = {
  display: "inline-block", fontSize: ".78rem", fontWeight: 600, color: ACCENT,
  border: `1px solid ${ACCENT}`, borderRadius: 999, padding: "2px 10px", marginRight: 6, marginBottom: 6,
};

export default function Home() {
  return (
    <main style={{ maxWidth: 1080, margin: "0 auto", padding: "3rem 1.25rem" }}>
      <h1 style={{ fontSize: "2.4rem", lineHeight: 1.15 }}>
        Turn any manuscript into a fully narrated, <em>music-scored video</em> in minutes
      </h1>
      <p style={{ fontSize: "1.15rem", color: "#444", maxWidth: 720 }}>
        Paste a story — from a 2-line idea to a 30-scene epic. An AI director plans every shot, renders
        best-of-N candidates with an AI video judge, and assembles a movie with narration, subtitles and
        an original score. Also ACX-ready audiobooks in Bangla & South-Asian English.
      </p>
      <p><DisclosureBadge /></p>
      <div style={{ display: "flex", gap: "1rem", margin: "1.5rem 0", flexWrap: "wrap" }}>
        <Link to="/login" style={btn(true)}>Start free</Link>
        <Link to="/demo" style={btn(false)}>Try the live demo</Link>
        <Link to="/pricing" style={btn(false)}>Pricing</Link>
      </div>

      <h2 style={{ marginTop: "3rem" }}>An AI director, behind the lens</h2>
      <div style={{ display: "grid", gap: 14, gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", marginTop: "1rem" }}>
        <div style={card}>
          <b>Storyboard planner</b>
          <p style={{ fontSize: ".9rem", color: "#555", margin: ".4rem 0 0" }}>
            Reads your manuscript and breaks it into a scene-by-scene storyboard with a creative brief
            (logline, tone, visual style, palette, pacing). No shot caps — long stories scale naturally.
          </p>
        </div>
        <div style={card}>
          <b>Best-of-N candidate generation</b>
          <p style={{ fontSize: ".9rem", color: "#555", margin: ".4rem 0 0" }}>
            Every scene is rendered multiple ways (composition & camera-motion variants) and an AI video
            judge scores each against the prompt — only the best take is kept.
          </p>
        </div>
        <div style={card}>
          <b>Narration-locked timing</b>
          <p style={{ fontSize: ".9rem", color: "#555", margin: ".4rem 0 0" }}>
            Shots are sized to the voiceover, so the spoken word always lands on the right frame —
            in English, Hindi or Bangla, voiced in your own cloned voice or a library voice.
          </p>
        </div>
        <div style={card}>
          <b>Character & face consistency</b>
          <p style={{ fontSize: ".9rem", color: "#555", margin: ".4rem 0 0" }}>
            Cast real faces from a single reference photo. The system keeps identity frame after frame
            and tags only the shots where characters actually appear.
          </p>
        </div>
        <div style={card}>
          <b>Art-directed keyframes & continuity</b>
          <p style={{ fontSize: ".9rem", color: "#555", margin: ".4rem 0 0" }}>
            Compose every opening frame, or chain shots that open on the previous shot's last frame so
            scenes flow together like a real cut.
          </p>
        </div>
        <div style={card}>
          <b>Cinematic soundtrack & polish</b>
          <p style={{ fontSize: ".9rem", color: "#555", margin: ".4rem 0 0" }}>
            An original instrumental bed is generated and sized to your video, auto-ducked under the
            narration, with crossfades, Ken Burns holds, and burned subtitles.
          </p>
        </div>
      </div>

      <h2 style={{ marginTop: "3rem" }}>Review before you burn a single GPU second</h2>
      <div style={card}>
        <p style={{ fontSize: ".95rem", color: "#333", margin: 0 }}>
          Approve, edit or re-roll the shot plan before rendering. After the cut finished, browse the
          candidate gallery per shot, regenerate more takes with editable prompt/motion/negative, then{" "}
          <b>re-assemble without re-narrating</b>.
        </p>
      </div>

      <h2 style={{ marginTop: "3rem" }}>Open, capable stack</h2>
      <div style={{ marginTop: "1rem" }}>
        <span style={chip}>WAN 2.1/2.2</span>
        <span style={chip}>LTX-2.3 22B audio-video</span>
        <span style={chip}>CausVid motion distillation</span>
        <span style={chip}>Qwen-Image keyframes</span>
        <span style={chip}>ACE-Step music</span>
        <span style={chip}>Orpheus & Chatterbox TTS</span>
        <span style={chip}>ReActor face swap</span>
        <span style={chip}>quality / fast-distill dials</span>
      </div>
      <ul style={{ lineHeight: 1.8, marginTop: "1rem" }}>
        <li>Voice cloning + narration in English, Hindi &amp; Bangla.</li>
        <li>Human-in-the-loop plan review, candidates, regenerate &amp; re-assemble.</li>
        <li>Flat "up to N hours" pricing — undercuts incumbents at volume.</li>
        <li>AI-quality-assurance gate: every video verified readable, audible, on-duration &amp; intelligible.</li>
        <li>Consent attestation + AI-disclosure built in.</li>
      </ul>
    </main>
  );
}

function btn(primary: boolean): React.CSSProperties {
  return {
    padding: "0.7rem 1.3rem", borderRadius: 8, textDecoration: "none", fontWeight: 600,
    background: primary ? "#1a1a1a" : "transparent", color: primary ? "#fff" : "#1a1a1a",
    border: primary ? "none" : "1px solid #1a1a1a",
  };
}