import { useParams, Link } from "react-router";
import { solutionPages } from "~/content/solutions/seo-matrix";
import { T, SANS, eyebrowStyle, ctaPrimary, ctaGhost, Icon, ICON, SectionEyebrow, SectionTitle } from "~/lib/marketing";
import { DisclosureBadge } from "~/components/DisclosureBadge";

export function meta({ params }: { params: { slug: string } }) {
  const page = solutionPages().find((p) => p.slug === params.slug);
  if (!page) return [{ title: "Solutions — Voice Narration" }];
  return [
    { title: page.title },
    { name: "description", content: page.intent },
    { "script:ld+json": { "@context": "https://schema.org", "@type": "Service", name: page.title, description: page.intent } },
  ];
}

// Plain-language "what you actually get" for each page, with a call to action and cross-links.
export default function SolutionPage() {
  const { slug } = useParams();
  const page = solutionPages().find((p) => p.slug === slug);
  const all = solutionPages();
  if (!page) return <main style={{ padding: "3rem 1.25rem" }}><h1>Not found</h1></main>;

  const meta = page.format ?? page.standalone!;
  const siblings = all.filter((p) => p !== page).slice(0, 4);

  return (
    <main style={{ fontFamily: SANS, background: "#fff", color: T.jet }}>
      <section style={{ padding: "4rem 1.25rem 2rem", background: "linear-gradient(180deg,#fafbff,#fff)" }}>
        <div style={{ maxWidth: 820, margin: "0 auto", textAlign: "center" }}>
          <SectionEyebrow>{page.format ? `${page.h1} — done well` : "Made for your next project"}</SectionEyebrow>
          <h1 style={{ fontWeight: 800, fontSize: "2.4rem", letterSpacing: "-.03em", lineHeight: 1.12, margin: 0 }}>
            {page.h1}
          </h1>
          <p style={subPage(page.intent)}>{page.intent}</p>
        </div>
      </section>

      <section style={{ padding: "1.5rem 1.25rem" }}>
        <div style={{ maxWidth: 860, margin: "0 auto" }}>
          {/* What you get */}
          <div style={{ borderRadius: 18, border: `1px solid ${T.line}`, background: "#fff", padding: "1.8rem", boxShadow: "0 16px 40px rgba(17,24,39,.06)" }}>
            <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: ".4rem" }}>
              <span style={{ color: T.ivy, display: "inline-flex" }}><Icon d={ICON[meta.icon as keyof typeof ICON] ?? ICON.star} size={26} /></span>
              <h2 style={{ fontFamily: SANS, fontWeight: 800, fontSize: "1.3rem", color: T.jet, margin: 0 }}>{meta.share}</h2>
            </div>
            <p style={{ fontFamily: SANS, color: T.body, fontSize: "1.02rem", lineHeight: 1.7, margin: ".6rem 0 0" }}>{meta.body}</p>
            <ul style={{ listStyle: "none", padding: 0, margin: "1.2rem 0 0", fontFamily: SANS }}>
              {meta.points.map((pt) => (
                <li key={pt} style={{ display: "flex", alignItems: "flex-start", gap: 10, fontSize: ".98rem", color: T.jet, marginBottom: ".6rem" }}>
                  <span style={{ marginTop: 3, color: T.ok, display: "inline-flex" }}><Icon d={ICON.check} size={17} /></span>{pt}
                </li>
              ))}
            </ul>
            <div style={{ marginTop: "1.6rem", display: "flex", gap: "0.9rem", flexWrap: "wrap", alignItems: "center" }}>
              <Link to="/login" style={ctaPrimary}>Start free — make it today <Icon d={ICON.arrow} size={18} /></Link>
              <Link to="/demo" style={ctaGhost}>Hear a voice first</Link>
            </div>
            <p style={{ marginTop: "1rem", fontFamily: SANS, fontSize: ".8rem", color: "#9ca3af" }}>
              <DisclosureBadge /> · no credit card · flat pricing — see <Link to="/pricing" style={{ color: T.ivy, fontWeight: 600 }}>what’s included</Link>
            </p>
          </div>

          {/* Cross-links */}
          <div style={{ marginTop: "2.5rem" }}>
            <SectionTitle>Related solutions</SectionTitle>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: "0.9rem", marginTop: "1.2rem" }}>
              {siblings.map((p) => {
                const m = p.format ?? p.standalone!;
                return (
                  <Link key={p.slug} to={`/solutions/${p.slug}`} style={{ textDecoration: "none", color: "inherit", border: `1px solid ${T.line}`, borderRadius: 14, padding: "1rem 1.1rem", background: "#fff", transition: "box-shadow .15s ease" }}>
                    <span style={{ color: T.ivy, display: "inline-flex" }}><Icon d={ICON[m.icon as keyof typeof ICON] ?? ICON.star} size={22} /></span>
                    <div style={{ fontWeight: 800, fontSize: ".95rem", color: T.jet, marginTop: ".5rem", fontFamily: SANS }}>{p.h1}</div>
                    <div style={{ fontSize: ".82rem", color: T.body, marginTop: ".25rem", lineHeight: 1.5, fontFamily: SANS }}>{m.share}</div>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

function subPage(text: string): React.CSSProperties {
  return { fontFamily: SANS, color: T.body, fontSize: "1.08rem", lineHeight: 1.6, maxWidth: 620, margin: "1rem auto 0" };
}