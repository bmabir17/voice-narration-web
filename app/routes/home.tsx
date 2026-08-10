import { Link } from "react-router";
import { DisclosureBadge } from "~/components/DisclosureBadge";

export function meta() {
  return [
    { title: "Paste a story. Get a narrated movie. | Voice Narration" },
    { name: "description", content: "Type or paste any story and get a fully narrated, music-scored animated video in minutes — your voice or a library voice, in English, Hindi or Bangla. No editing skills, no filmmaking gear, no monthly minimums." },
    { "script:ld+json": {
        "@context": "https://schema.org", "@type": "SoftwareApplication",
        name: "Voice Narration", applicationCategory: "MultimediaApplication",
        offers: { "@type": "Offer", price: "22", priceCurrency: "USD" },
      } },
  ];
}

// ---------------------------------------------------------------- design tokens
const IVY = "#4f46e5";      // primary
const IVY_DARK = "#3730a3";
const SUN = "#f59e0b";      // accent
const JET = "#111827";      // near-black text
const BODY = "#4b5563";     // body text
const MIST = "#f4f6fb";     // soft section bg
const LINE = "#e5e7eb";

const SANS = `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;

const h2: React.CSSProperties = {
  fontFamily: SANS, fontWeight: 800, fontSize: "2rem", letterSpacing: "-.02em",
  color: JET, lineHeight: 1.2, margin: 0, textAlign: "center",
};
const sub: React.CSSProperties = {
  fontFamily: SANS, color: BODY, fontSize: "1.05rem", lineHeight: 1.6,
  maxWidth: 640, margin: "0.8rem auto 0", textAlign: "center",
};
const eyebrowStyle: React.CSSProperties = {
  fontFamily: SANS, textAlign: "center", color: IVY, fontWeight: 700,
  fontSize: ".8rem", textTransform: "uppercase", letterSpacing: ".14em", marginBottom: ".6rem",
};

const floatKey = `
@keyframes va-float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
@keyframes va-progress { 0%{width:0} 80%{width:82%} 100%{width:100%} }
@keyframes va-pulse { 0%,100%{opacity:1} 50%{opacity:.35} }
@media (prefers-reduced-motion: reduce){ .va-anim{animation:none !important} }
`;
const floatAnim: React.CSSProperties = { animation: "va-float 5s ease-in-out infinite" };

// Small inline SVG icons — stroke style, currentColor.
const Icon = ({ d, size = 20 }: { d: string; size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d={d} />
  </svg>
);
const i = {
  script: "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6M8 13h8M8 17h5",
  board: "M2 3h7v7H2zM15 3h7v7h-7zM2 14h7v7H2zM15 14h7v7h-7z",
  film: "M3 5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2zM6 8l4 2-4 2zM14 8l4 2-4 2zM6 15l4 2-4 2zM14 15l4 2-4 2z",
  mic: "M12 3a3 3 0 0 0-3 3v5a3 3 0 0 0 6 0V6a3 3 0 0 0-3-3zM19 11a7 7 0 0 1-14 0M12 18v3M8 21h8",
  star: "M12 2l2.9 6.3 6.9.7-5.2 4.6 1.5 6.8L12 17.3 5.9 20.4l1.5-6.8L2.2 9l6.9-.7z",
  face: "M14 2H6a2 2 0 0 0-2 2v16c0 1.1.9 2 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6M9 15c.8.7 1.9.9 3 .9s2.2-.2 3-.9M9 12.2h.01M15 12.2h.01",
  music: "M9 18V5l12-2v13M9 18a3 3 0 1 1-6 0 3 3 0 0 1 6 0zM21 16a3 3 0 1 1-6 0 3 3 0 0 1 6 0z",
  check: "M20 6L9 17l-5-5",
  arrow: "M5 12h14M13 6l6 6-6 6",
  lock: "M5 11h14a1 1 0 0 1 1 1v7a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-7a1 1 0 0 1 1-1zM8 11V7a4 4 0 1 1 8 0v4",
};

// A fake video-player mock with a "rendering now" feel. Used in the hero.
function PlayerMock() {
  return (
    <div style={{
      background: "#0b0e17", borderRadius: 18, boxShadow: "0 30px 80px rgba(17,24,39,.45)",
      overflow: "hidden", fontFamily: SANS, position: "relative",
    }}>
      {/* scene art (pure CSS) */}
      <div style={{ position: "relative", height: 260 }}>
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(160deg,#1e1b4b 0%,#4c1d95 45%,#7c3aed 70%,#f59e0b 100%)" }} />
        <div style={{ position: "absolute", left: "12%", bottom: 0, width: "42%", height: "62%",
          background: "linear-gradient(180deg,#312e81,#1e1b4b)", borderRadius: "60% 60% 0 0", opacity: .9 }} />
        <div style={{ position: "absolute", right: "10%", top: "16%", width: 90, height: 90,
          background: "#fcd34d", borderRadius: "50%", boxShadow: "0 0 60px rgba(252,211,77,.8)", opacity: .9 }} />
        {/* play button */}
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ width: 64, height: 64, borderRadius: "50%", background: "rgba(255,255,255,.92)",
            display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 8px 30px rgba(0,0,0,.4)", cursor: "pointer" }}>
            <svg width={26} height={26} viewBox="0 0 24 24" fill="#4f46e5"><path d="M7 4l13 8-13 8z" /></svg>
          </div>
        </div>
        {/* caption */}
        <div style={{ position: "absolute", left: 16, right: 16, bottom: 44, textAlign: "center" }}>
          <span style={{ background: "rgba(0,0,0,.55)", color: "#fff", padding: "3px 10px", borderRadius: 6,
            fontStyle: "italic", fontSize: ".72rem" }}>“And the little boat carried the lantern home.”</span>
        </div>
      </div>
      {/* fake transport */}
      <div style={{ padding: "0.9rem 1rem 1rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <svg width={14} height={14} viewBox="0 0 24 24" fill="#6b7280"><path d="M6 5h2v14H6zM16 5h2v14h-2z" /></svg>
          <div style={{ flex: 1, height: 5, borderRadius: 999, background: "#2a2f42", overflow: "hidden" }}>
            <span className="va-anim" style={{ display: "block", height: "100%", width: "72%",
              background: "linear-gradient(90deg,#7c3aed,#f59e0b)", animation: "va-progress 4s ease-in-out infinite" }} />
          </div>
          <svg width={14} height={14} viewBox="0 0 24 24" fill="#6b7280"><path d="M17 5v14l-10-7z" /></svg>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontFamily: SANS, fontSize: ".7rem", color: "#9ca3af", marginTop: 8 }}>
          <span>Your story · shot 8 / 14</span>
          <span style={{ color: "#f59e0b", fontWeight: 700 }}>rendering…</span>
        </div>
      </div>
    </div>
  );
}

// A storyboard strip visual: three scene cards with one "chosen" card highlighted.
function BoardMock() {
  const scenes = [
    { title: "The village", note: "wide dawn shot", hue: "linear-gradient(180deg,#f59e0b,#fbbf24)" },
    { title: "The boat", note: "close-up · push-in", hue: "linear-gradient(180deg,#4f46e5,#312e81)" },
    { title: "The lantern", note: "hero scene · 5B model", hue: "linear-gradient(180deg,#7c3aed,#a855f7)" },
  ];
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10, fontFamily: SANS }}>
      {scenes.map((s, idx) => (
        <div key={idx} style={{
          borderRadius: 12, overflow: "hidden", background: "#fff",
          border: idx === 2 ? "2px solid #f59e0b" : "1px solid #e5e7eb",
          boxShadow: idx === 2 ? "0 12px 30px rgba(245,158,11,.25)" : "0 4px 14px rgba(17,24,39,.06)",
        }}>
          <div style={{ height: 90, background: s.hue }} />
          <div style={{ padding: ".55rem .6rem" }}>
            <div style={{ fontWeight: 700, fontSize: ".72rem", color: JET }}>{s.title}</div>
            <div style={{ fontSize: ".64rem", color: BODY, marginTop: 2 }}>{s.note}</div>
            <div style={{ marginTop: 6, display: "flex", gap: 4 }}>
              {idx === 1 && <span style={{ fontSize: ".6rem", fontWeight: 700, color: "#b45309", background: "#fef3c7", borderRadius: 999, padding: "1px 7px" }}>push-in</span>}
              {idx === 2 && <span style={{ fontSize: ".6rem", fontWeight: 700, color: "#be185d", background: "#fce7f3", borderRadius: 999, padding: "1px 7px" }}>final cut</span>}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// Best-of-N mock: same scene rendered 3 ways with a judge verdict.
function CandidatesMock() {
  const shots = [
    { name: "Take 1", tone: "#93c5fd", verdict: "revise", color: "#d97706", bg: "#fef3c7" },
    { name: "Take 2", tone: "#c4b5fd", verdict: "pass ✔", color: "#059669", bg: "#d1fae5" },
    { name: "Take 3", tone: "#fca5a5", verdict: "pass ✔", color: "#059669", bg: "#d1fae5" },
  ];
  return (
    <div style={{ fontFamily: SANS }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10 }}>
        {shots.map((s, i) => (
          <div key={i} style={{ borderRadius: 12, overflow: "hidden", border: i === 2 ? "2px solid #059669" : "1px solid #e5e7eb", background: "#fff" }}>
            <div style={{ height: 84, background: `linear-gradient(180deg,${s.tone},#1e1b4b)` }} />
            <div style={{ padding: ".5rem .6rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontWeight: 700, fontSize: ".7rem", color: JET }}>{s.name}</span>
              <span style={{ fontSize: ".62rem", fontWeight: 700, color: s.color, background: s.bg, borderRadius: 999, padding: "1px 8px" }}>{s.verdict}</span>
            </div>
            <div style={{ padding: "0 .6rem .5rem", display: "flex", alignItems: "center", gap: 4 }}>
              {[3, 4, 5, 4].map((w, k) => (
                <span key={k} style={{ height: 4, width: w * 2, borderRadius: 999, background: i === 2 ? "#059669" : "#d1d5db" }} />
              ))}
              <span style={{ marginLeft: "auto", fontSize: ".58rem", color: i === 2 ? "#059669" : "#9ca3af", fontWeight: 700 }}>
                {i === 2 ? "chosen" : `adherence ${0.62 + i * 0.11}`}
              </span>
            </div>
          </div>
        ))}
      </div>
      <p style={{ fontSize: ".7rem", color: BODY, margin: ".7rem 0 0", textAlign: "center" }}>
        An AI director scores every take — only the best makes the final movie. Change your mind later? Re-pick any take.
      </p>
    </div>
  );
}

// Voice / language pills mock.
function VoiceMock() {
  const langs = ["English", "Hindi", "Bangla"];
  const voices = ["tara", "arjun", "meera", "your voice"];
  return (
    <div style={{ fontFamily: SANS }}>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
        <span style={{ fontSize: ".62rem", fontWeight: 700, color: BODY }}>Languages</span>
        {langs.map((l) => (
          <span key={l} style={{ fontSize: ".74rem", fontWeight: 700, color: JET, border: "1px solid #d1d5db", borderRadius: 999, padding: "4px 12px" }}>{l}</span>
        ))}
      </div>
      <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
        {voices.map((v, i) => (
          <div key={v} style={{ flex: 1, borderRadius: 12, border: "1px solid #e5e7eb", padding: ".6rem", background: "#fff", textAlign: "center" }}>
            <div style={{ width: 34, height: 34, borderRadius: "50%", margin: "0 auto", background: `linear-gradient(135deg,#4f46e5,${i === 3 ? "#f59e0b" : "#7c3aed"})`, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 800, fontSize: ".78rem" }}>
              {v === "your voice" ? "?" : v[0].toUpperCase()}
            </div>
            <div style={{ fontSize: ".66rem", fontWeight: 700, color: JET, marginTop: 6 }}>{v}</div>
          </div>
        ))}
      </div>
      <p style={{ fontSize: ".7rem", color: BODY, margin: ".7rem 0 0", textAlign: "center" }}>
        Clone any voice from a 30-second sample — or pick a library voice. Narration lands exactly on the right frame.
      </p>
    </div>
  );
}

// Face/scene consistency mock.
function FaceMock() {
  const rows = [
    { label: "Frame 1", e: 118 },
    { label: "Frame 2", e: 118 },
    { label: "Frame 3", e: 118 },
  ];
  return (
    <div style={{ fontFamily: SANS, textAlign: "center" }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10 }}>
        {rows.map((r, i) => (
          <div key={i}>
            <div style={{ borderRadius: 12, overflow: "hidden", border: "1px solid #e5e7eb", position: "relative", background: "#0f172a" }}>
              <div style={{ height: 96, background: `linear-gradient(180deg,${i % 2 ? "#0ea5e9" : "#f59e0b"},#312e81)` }} />
              <div style={{ position: "absolute", left: "50%", top: "34%", width: 34, height: 34, transform: "translate(-50%,-50%)", borderRadius: "50%", background: "#fde68a", opacity: .9 }} />
              <div style={{ position: "absolute", left: "50%", bottom: 6, transform: "translateX(-50%)", background: "#1f2937", width: 30, height: 20, borderRadius: 6, opacity: .9 }} />
            </div>
            <div style={{ fontSize: ".62rem", color: BODY, marginTop: 5, fontWeight: 600 }}>{r.label}</div>
          </div>
        ))}
      </div>
      <p style={{ fontSize: ".7rem", color: BODY, margin: ".7rem 0 0" }}>
        Same face, same palette, scene after scene — no character drift.
      </p>
    </div>
  );
}

// A "how it works" step card with a small visual.
function Step({ n, title, text }: { n: number; title: string; text: string }) {
  return (
    <div style={{ borderRadius: 16, padding: "1.4rem", background: "#fff", border: "1px solid #e5e7eb", textAlign: "center", boxShadow: "0 10px 30px rgba(17,24,39,.05)" }}>
      <div style={{
        width: 44, height: 44, margin: "0 auto .9rem", borderRadius: "50%", background: "#eef2ff",
        color: IVY, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.1rem", fontWeight: 800, fontFamily: SANS,
      }}>{n}</div>
      <div style={{ fontWeight: 800, fontSize: "1rem", color: JET, fontFamily: SANS }}>{title}</div>
      <p style={{ fontSize: ".88rem", color: BODY, lineHeight: 1.6, margin: ".5rem 0 0", fontFamily: SANS }}>{text}</p>
    </div>
  );
}

// Feature split row: visual + explainer.
function Split({ flip, icon, title, body, list, children }: {
  flip?: boolean; icon: string; title: string; body: string; list: string[]; children: React.ReactNode;
}) {
  const order = flip ? "row-reverse" : "row";
  return (
    <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 40, flexDirection: order as any }}>
      <div style={{ flex: "1 1 300px", minWidth: 0 }}>{children}</div>
      <div style={{ flex: "1 1 320px", minWidth: 0 }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 10, marginBottom: ".7rem" }}>
          <span style={{ color: IVY, display: "inline-flex" }}><Icon d={icon} size={26} /></span>
          <h3 style={{ fontFamily: SANS, fontWeight: 800, fontSize: "1.35rem", color: JET, margin: 0 }}>{title}</h3>
        </div>
        <p style={{ fontFamily: SANS, color: BODY, fontSize: "1rem", lineHeight: 1.65, margin: 0 }}>{body}</p>
        <ul style={{ listStyle: "none", padding: 0, margin: ".9rem 0 0", fontFamily: SANS }}>
          {list.map((l) => (
            <li key={l} style={{ display: "flex", alignItems: "flex-start", gap: 9, fontSize: ".92rem", color: JET, marginBottom: ".55rem" }}>
              <span style={{ color: "#059669", marginTop: 2, display: "inline-flex" }}><Icon d={i.check} size={17} /></span>
              <span>{l}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function Faq({ q, a }: { q: string; a: string }) {
  return (
    <details style={{ border: "1px solid #e5e7eb", borderRadius: 12, background: "#fff", padding: "1rem 1.2rem", fontFamily: SANS }}>
      <summary style={{ cursor: "pointer", fontWeight: 700, color: JET, fontSize: ".98rem", listStyle: "none", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        {q}
        <span style={{ color: "#9ca3af", fontSize: "1.1rem", lineHeight: 1 }}>+</span>
      </summary>
      <p style={{ fontSize: ".92rem", color: BODY, lineHeight: 1.65, margin: ".7rem 0 0" }}>{a}</p>
    </details>
  );
}

export default function Home() {
  return (
    <main style={{ fontFamily: SANS, background: "#fff", color: JET }}>
      <style>{floatKey}</style>

      {/* ---------------------------------------------------------- HERO */}
      <section style={{
        background: "radial-gradient(1100px 600px at 70% -10%, #eef2ff 0%, rgba(255,255,255,0) 60%), linear-gradient(180deg,#fafbff 0%,#fff 100%)",
        padding: "4.5rem 1.25rem 4rem",
      }}>
        <div style={{ maxWidth: 1120, margin: "0 auto 0 auto", display: "flex", flexWrap: "wrap", gap: 48, alignItems: "center" }}>
          <div style={{ flex: "1 1 420px", minWidth: 0 }}>
            <p style={eyebrowStyle}><span style={{ color: SUN }}>★</span> Manuscript → narrated video</p>
            <h1 style={{ fontWeight: 800, fontSize: "2.9rem", letterSpacing: "-.03em", lineHeight: 1.08, margin: 0 }}>
              Paste a story.
              <br />
              Get a <span style={{ background: "linear-gradient(90deg,#4f46e5,#7c3aed)", WebkitBackgroundClip: "text", color: "transparent" }}>narrated movie.</span>
            </h1>
            <p style={{ fontSize: "1.15rem", color: BODY, lineHeight: 1.65, margin: "1.1rem 0 0", maxWidth: 560 }}>
              No cameras. No editing software. No voice acting. Type any story and our AI director scripts
              every scene, speaks the narration in your voice, and scores a soundtrack to match — then hands
              you a finished, shareable video in minutes.
            </p>
            <div style={{ display: "flex", gap: "0.9rem", margin: "1.8rem 0 0", flexWrap: "wrap", alignItems: "center" }}>
              <Link to="/login" style={{
                background: IVY, color: "#fff", padding: ".85rem 1.6rem", borderRadius: 12, textDecoration: "none",
                fontWeight: 800, fontSize: "1rem", boxShadow: "0 10px 24px rgba(79,70,229,.35)", display: "inline-flex", alignItems: "center", gap: 9,
              }}>
                Start creating — it’s free <Icon d={i.arrow} size={18} />
              </Link>
              <Link to="/demo" style={{
                background: "#fff", color: JET, padding: ".85rem 1.6rem", borderRadius: 12, textDecoration: "none",
                fontWeight: 700, fontSize: "1rem", border: "1.5px solid #d1d5db",
              }}>Watch a sample story</Link>
            </div>
            <div style={{ display: "flex", gap: 20, flexWrap: "wrap", marginTop: "2rem", fontFamily: SANS }}>
              {[
                ["3 min", "from text to movie"],
                ["30+ scenes", "no shot limit"],
                ["3 languages", "en · hi · bn"],
                ["0 skills", "your voice or ours"],
              ].map(([v, l]) => (
                <div key={l}>
                  <div style={{ fontWeight: 800, fontSize: "1.2rem", color: JET }}>{v}</div>
                  <div style={{ fontSize: ".76rem", color: BODY }}>{l}</div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ flex: "1 1 440px", minWidth: 0, ...floatAnim }} className="va-anim">
            <PlayerMock />
          </div>
        </div>
        <p style={{ fontSize: ".78rem", color: "#9ca3af", textAlign: "center", margin: "2.2rem 0 0" }}>
          <DisclosureBadge /> · rendered by Voice Narration from a one-paragraph manuscript · “The Lantern Boat”
        </p>
      </section>

      {/* -------------------------------------------------- HOW IT WORKS */}
      <section style={{ padding: "3.5rem 1.25rem", background: MIST }}>
        <div style={{ maxWidth: 1000, margin: "0 auto" }}>
          <p style={eyebrowStyle}>How it works</p>
          <h2 style={h2}>Three steps. Zero film school.</h2>
          <p style={sub}>You write the words. We handle the directing, acting, and editing — like a production team in your pocket.</p>
          <div style={{ display: "grid", gap: 16, gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))", marginTop: "2rem" }}>
            <Step n={1} title="Paste your story" text="Any length — a poem, a bedtime story, a chapter, a product explainer. Type it or paste it." />
            <Step n={2} title="Approve the shot plan" text="See exactly how the story will be told before any heavy lifting — tweak scenes or re-roll the whole plan." />
            <Step n={3} title="Watch your movie" text="Minutes later you get a narrated, subtitled, music-scored video. Reroll any scene and re-assemble until it’s perfect." />
          </div>
        </div>
      </section>

      {/* -------------------------------------------------- FEATURES */}
      <section style={{ padding: "3.5rem 1.25rem" }}>
        <div style={{ maxWidth: 1080, margin: "0 auto", display: "grid", gap: "3.4rem" }}>
          <Split icon={i.board} title="An AI director plans every scene"
            body="Before a frame is rendered, an AI director reads your story and builds a shot-by-shot plan — where the camera sits, how the scene moves, what the light feels like. You see and approve it first, so you’re never surprised by the result."
            list={["Scene-by-scene storyboard you can read and edit", "1-paragraph ideas scale to 30+ scene films", "Each shot knows what happened in the shot before"]}>
            <BoardMock />
          </Split>

          <Split flip icon={i.film} title="Every scene gets its best take, automatically"
            body="Great shots are hard to get on the first try. So the AI renders each scene several ways — different angles, different motion, different moods — scores every take, and keeps the winner. No re-shoots, ever."
            list={["Composition & camera-motion variants per scene", "An AI judge scores focus, motion and prompt match", "Re-pick any take later — no re-narration needed"]}>
            <CandidatesMock />
          </Split>

          <Split icon={i.mic} title="Narration in your voice — or a library voice"
            body="Bring a 30-second clip of your own voice and every shot is narrated in it. No sample? Pick from our library and choose English, Hindi or Bangla. Timing is locked to the voiceover, so the words always land on the right frame."
            list={["Clone any voice from a 30-second sample", "English, Hindi and Bangla narration", "Subtitles burned in — readable on any device"]}>
            <VoiceMock />
          </Split>

          <Split flip icon={i.face} title="Cast real faces into your story"
            body="Want the hero to look familiar? Upload one reference photo and that face stays consistent through every scene — no character drift, no uncanny swaps."
            list={["Characters tagged only where they appear", "Identity held frame after frame", "Works with illustrated, cinematic and real styles"]}>
            <FaceMock />
          </Split>

          <Split icon={i.music} title="A soundtrack that fits the mood"
            body="A composer writes an original instrumental bed sized to your video and shaped by your story’s tone — mysterious, warm, epic. It’s mixed low and intelligently ducked so your narration always stays crisp."
            list={["Original score generated per video — no copyright risk", "Music ducks automatically under the narration", "Crossfades, fades and Ken Burns polish included"]}>
            <div style={{ fontFamily: SANS, borderRadius: 16, background: "linear-gradient(135deg,#312e81,#7c3aed)", padding: "1.1rem 1.2rem", color: "#fff" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: ".72rem", color: "#c7d2fe", fontWeight: 600 }}>
                <span>ace-step theme · “warm dawn”</span><span>0:58 · stereo</span>
              </div>
              {[28, 42, 30, 52, 61, 45, 33, 70, 55].map((h, k) => (
                <span key={k} style={{ display: "inline-block", width: 4, marginRight: 4, borderRadius: 999, height: h * (36 / 70), verticalAlign: "bottom", background: "#f59e0b" }} />
              ))}
              <div style={{ marginTop: 10, fontSize: ".7rem", color: "#c7d2fe", fontWeight: 600 }}>
                narration ▮▮▮▮▮▮▮ <span style={{ color: "#f59e0b" }}>music</span> (auto-ducked 8:1)
              </div>
            </div>
          </Split>

          <Split icon={i.lock} title="A finished, verified, tamper-labeled video"
            body="When your movie is done, an automated quality check confirms the video plays, the audio is clear, every spoken line matches the script, and scenes stay consistent — before you ever see it."
            list={["Automated quality gate before delivery", "AI-generated disclosure included", "Reroll one scene or the whole film — and keep the rest"]}>
            <div style={{ fontFamily: SANS, borderRadius: 12, border: "1px solid #e5e7eb", background: "#fff", padding: "1rem 1.2rem" }}>
              {[
                ["Video readable", true],
                ["Audio clear & loud enough", true],
                ["Narration matches script", true],
                ["Scenes consistent (faces, palette)", true],
              ].map(([label, ok]) => (
                <div key={label as string} style={{ display: "flex", alignItems: "center", gap: 10, padding: "6px 0" }}>
                  <span style={{ width: 22, height: 22, borderRadius: "50%", background: "#d1fae5", color: "#059669", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: ".72rem", fontWeight: 800 }}>✓</span>
                  <span style={{ fontSize: ".9rem", color: JET, fontWeight: 600 }}>{label}</span>
                </div>
              ))}
              <p style={{ fontSize: ".72rem", color: BODY, margin: ".6rem 0 0", borderTop: "1px dashed #e5e7eb", paddingTop: ".6rem" }}>
                Passed all 4 checks · 2m 14s · “The Lantern Boat · v3”
              </p>
            </div>
          </Split>
        </div>
      </section>

      {/* -------------------------------------------------- WHO IT'S FOR */}
      <section style={{ padding: "3.5rem 1.25rem", background: MIST }}>
        <div style={{ maxWidth: 1040, margin: "0 auto" }}>
          <p style={eyebrowStyle}>Made for storytellers, not engineers</p>
          <h2 style={h2}>Who we build this for</h2>
          <div style={{ display: "grid", gap: 16, gridTemplateColumns: "repeat(auto-fit,minmax(230px,1fr))", marginTop: "2rem" }}>
            {[
              { icon: i.star, t: "Storytellers & authors", d: "Turn your written tales into narrated animated videos your readers will share." },
              { icon: i.mic, t: "Educators & teachers", d: "Give every lesson a voice and a movie — in your own language and accent." },
              { icon: i.film, t: "Creators & marketers", d: "Explainer videos and brand stories from a paragraph — no production crew." },
              { icon: i.face, t: "Families & gifting", d: "A personal message, a favourite fairy tale — narrated in grandma’s own voice." },
            ].map((c) => (
              <div key={c.t} style={{ borderRadius: 14, padding: "1.3rem", background: "#fff", border: "1px solid #e5e7eb" }}>
                <span style={{ color: IVY, display: "inline-flex" }}><Icon d={c.icon} size={24} /></span>
                <div style={{ fontWeight: 800, fontSize: "1rem", color: JET, marginTop: ".6rem", fontFamily: SANS }}>{c.t}</div>
                <p style={{ fontSize: ".88rem", color: BODY, lineHeight: 1.6, margin: ".4rem 0 0", fontFamily: SANS }}>{c.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* -------------------------------------------------- FAQ */}
      <section style={{ padding: "3.5rem 1.25rem" }}>
        <div style={{ maxWidth: 720, margin: "0 auto" }}>
          <p style={eyebrowStyle}>Questions, answered plainly</p>
          <h2 style={h2}>Good questions</h2>
          <div style={{ display: "grid", gap: 12, marginTop: "1.8rem" }}>
            <Faq q="Do I need any video or editing experience?" a="None. You paste your text, approve the plan, and we do everything else. If you want more control, you can edit each scene’s description or re-roll any take — it’s all plain language, no tools to learn." />
            <Faq q="Can it really use my voice?" a="Yes. Upload a short, quiet 30-second clip of you speaking and the narrator will sound like you. Otherwise choose a library voice — in English, Hindi or Bangla." />
            <Faq q="How long does it take?" a="A short story typically renders in a few minutes. Longer films — 20+ scenes — take longer but run in the background, and you’ll watch the shots arrive one by one." />
            <Faq q="What do I get when it’s done?" a="A polished MP4: picture, narration, subtitles and an original music score, plus an automated quality check. Download it and post it anywhere." />
            <Faq q="Is there a shot limit?" a="No. Short poems and 30-scene epics both work — the plan grows to fit your story, and you’ll approve it before anything expensive renders." />
            <Faq q="Is the content identifiable as AI-generated?" a="Yes — transparency is built in. Every video carries an AI-generated disclosure, and voice/face use requires your consent before anything is rendered." />
          </div>
        </div>
      </section>

      {/* -------------------------------------------------- FINAL CTA */}
      <section style={{ padding: "3.5rem 1.25rem 5rem" }}>
        <div style={{
          maxWidth: 860, margin: "0 auto", textAlign: "center", borderRadius: 24, padding: "3rem 1.5rem",
          background: "linear-gradient(135deg,#3730a3,#7c3aed 55%,#9333ea)", color: "#fff",
        }}>
          <h2 style={{ fontFamily: SANS, fontWeight: 800, fontSize: "2.2rem", letterSpacing: "-.02em", margin: 0, color: "#fff" }}>
            Your next story could be a movie.
          </h2>
          <p style={{ fontFamily: SANS, fontSize: "1.05rem", color: "#e0e7ff", lineHeight: 1.6, maxWidth: 520, margin: ".9rem auto 0" }}>
            Start free — no credit card, no downloads, no learning curve. Write something, and watch it come to life.
          </p>
          <Link to="/login" style={{
            display: "inline-flex", alignItems: "center", gap: 9, marginTop: "1.6rem", background: SUN, color: "#111827",
            padding: ".9rem 1.7rem", borderRadius: 12, textDecoration: "none", fontWeight: 800, fontSize: "1.05rem",
            boxShadow: "0 12px 30px rgba(0,0,0,.25)",
          }}>
            Start creating free <Icon d={i.arrow} size={18} />
          </Link>
          <p style={{ fontFamily: SANS, fontSize: ".78rem", color: "#c7d2fe", marginTop: "1.2rem" }}>
            Flat pricing · voice &amp; face consent built in · AI-generated disclosure included
          </p>
        </div>
      </section>
    </main>
  );
}