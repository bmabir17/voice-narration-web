import { Link } from "react-router";
import { solutionPages, type SolutionPage } from "~/content/solutions/seo-matrix";
import { T, SANS, eyebrowStyle, subStyle, ctaPrimary, ctaGhost, Icon, ICON, SectionEyebrow, SectionTitle, chip } from "~/lib/marketing";
import { DisclosureBadge } from "~/components/DisclosureBadge";

export function meta() {
  return [
    { title: "Solutions — Voice Narration" },
    { name: "description", content: "Turn words into work people love: audiobooks, e-learning, narrated videos, podcasts and storybook movies — in Bangla, South-Asian English, Hindi. Start free." },
    { "script:ld+json": { "@context": "https://schema.org", "@type": "CollectionPage", name: "Voice Narration solutions", description: "Types of narrated content you can create" } },
  ];
}

const CATEGORIES = [
  {
    icon: ICON.book, title: "Audiobooks",
    body: "Publish-ready chapters read in a consistent, human-sounding voice — loudness and ACX specs automated.",
    slug: "acx-ready-ai-narration",
  },
  {
    icon: ICON.film, title: "Narrated videos",
    body: "Paste a story and get a scene-by-scene animated video — AI director, narrator, music and subtitles included.",
    slug: "south-asian-english-faceless-video",
  },
  {
    icon: ICON.grad, title: "E-learning & courses",
    body: "Warm, clear course audio in your own accent and language — or a lesson that becomes a narrated video.",
    slug: "south-asian-english-elearning",
  },
  {
    icon: ICON.rocket, title: "Faceless channels",
    body: "Run a faceless YouTube or social channel without showing your face — scripts, visuals and voices, automated.",
    slug: "bangla-faceless-video",
  },
  {
    icon: ICON.megaphone, title: "Podcasts",
    body: "Episodes scripted, voiced, edited and leveled to broadcast-ready audio you can host straight away.",
    slug: "south-asian-english-podcast",
  },
  {
    icon: ICON.star, title: "Storybook movies",
    body: "Turn children’s stories into gentle, narrated animated videos families love — bedtime ready.",
    slug: "storybook-video",
  },
];

export default function Solutions() {
  const all = solutionPages();

  return (
    <main style={{ fontFamily: SANS, background: "#fff", color: T.jet }}>
      <section style={{
        padding: "4.5rem 1.25rem 3rem",
        background: "radial-gradient(900px 420px at 80% -10%, #eef2ff 0%, rgba(255,255,255,0) 60%), linear-gradient(180deg,#fafbff,#fff)",
      }}>
        <div style={{ maxWidth: 900, margin: "0 auto", textAlign: "center" }}>
          <SectionEyebrow>Solutions</SectionEyebrow>
          <h1 style={{ fontWeight: 800, fontSize: "2.7rem", letterSpacing: "-.03em", lineHeight: 1.1, margin: 0 }}>
            Words you write,
            <br /> mastered the way you need them.
          </h1>
          <p style={subStyle}>
            One service, every flavour of narrated content — audiobooks, courses, faceless videos, podcasts
            and storybook movies. Paste text, pick a voice, press go. <DisclosureBadge />
          </p>
          <div style={{ marginTop: "1.6rem", display: "flex", gap: "0.9rem", justifyContent: "center", flexWrap: "wrap" }}>
            <Link to="/login" style={ctaPrimary}>Start free <Icon d={ICON.arrow} size={18} /></Link>
            <Link to="/demo" style={ctaGhost}>Hear a voice</Link>
          </div>
        </div>
      </section>

      {/* category cards */}
      <section style={{ padding: "1.5rem 1.25rem 3rem" }}>
        <div style={{ maxWidth: 1040, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: "1.1rem" }}>
          {CATEGORIES.map((c) => (
            <Link key={c.title} to={`/solutions/${c.slug}`} style={{
              textDecoration: "none", color: "inherit", border: `1px solid ${T.line}`, borderRadius: 18,
              padding: "1.4rem 1.4rem", background: "#fff", boxShadow: "0 8px 24px rgba(17,24,39,.05)",
            }}>
              <span style={{ color: T.ivy, display: "inline-flex" }}><Icon d={c.icon} size={28} /></span>
              <div style={{ fontWeight: 800, fontSize: "1.15rem", color: T.jet, marginTop: ".7rem", fontFamily: SANS }}>{c.title}</div>
              <p style={{ fontSize: ".92rem", color: T.body, lineHeight: 1.6, margin: ".45rem 0 0", fontFamily: SANS }}>{c.body}</p>
              <div style={{ marginTop: "1rem", color: T.ivy, fontWeight: 700, fontSize: ".9rem", fontFamily: SANS }}>
                Explore →
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* full solution map */}
      <section style={{ padding: "3rem 1.25rem", background: T.mist }}>
        <div style={{ maxWidth: 1040, margin: "0 auto" }}>
          <SectionTitle>Every pairing, ready to start</SectionTitle>
          <p style={subStyle}>All 13 solution pages are wired to the same honest pipeline — these are just different ways to say “make it narrated.”</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10, justifyContent: "center", marginTop: "1.6rem" }}>
            {all.map((p: SolutionPage) => (
              <Link key={p.slug} to={`/solutions/${p.slug}`} style={{ textDecoration: "none" }}>
                <span style={chip}>{p.h1}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section style={{ padding: "3.5rem 1.25rem" }}>
        <div style={{ maxWidth: 860, margin: "0 auto", textAlign: "center", borderRadius: 22, padding: "2.8rem 1.5rem", background: "linear-gradient(135deg,#3730a3,#7c3aed)" }}>
          <h2 style={{ fontFamily: SANS, fontWeight: 800, fontSize: "1.9rem", color: "#fff", margin: 0 }}>Not sure where to start?</h2>
          <p style={{ fontFamily: SANS, fontSize: "1.02rem", color: "#e0e7ff", lineHeight: 1.6, maxWidth: 480, margin: ".8rem auto 0" }}>
            The free plan lets you try narration and a full video. Your first story is on us.
          </p>
          <Link to="/login" style={{ ...ctaPrimary, marginTop: "1.5rem", display: "inline-flex" }}>Start creating free <Icon d={ICON.arrow} size={18} /></Link>
        </div>
      </section>
    </main>
  );
}