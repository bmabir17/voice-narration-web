import { Link } from "react-router";
import { DisclosureBadge } from "~/components/DisclosureBadge";

export function meta() {
  return [
    { title: "Bangla & South-Asian-English AI Audiobook Narration" },
    { name: "description", content: "Long-form AI narration for audiobooks, e-learning and video — authentic Bangla & South-Asian-English voices, flat volume-friendly pricing, ACX-ready output." },
    { "script:ld+json": {
        "@context": "https://schema.org", "@type": "SoftwareApplication",
        name: "Voice Narration", applicationCategory: "MultimediaApplication",
        offers: { "@type": "Offer", price: "22", priceCurrency: "USD" },
      } },
  ];
}

export default function Home() {
  return (
    <main style={{ maxWidth: 860, margin: "0 auto", padding: "3rem 1.25rem" }}>
      <h1 style={{ fontSize: "2.4rem", lineHeight: 1.15 }}>
        Long-form AI narration in authentic <em>Bangla</em> & South-Asian English
      </h1>
      <p style={{ fontSize: "1.15rem", color: "#444" }}>
        Turn a manuscript into ACX-ready audiobook, course, or video audio in minutes — voices the
        global players do poorly, at flat pricing per-character incumbents can't match.
      </p>
      <p><DisclosureBadge /></p>
      <div style={{ display: "flex", gap: "1rem", margin: "1.5rem 0" }}>
        <Link to="/login" style={btn(true)}>Start free</Link>
        <Link to="/demo" style={btn(false)}>Try the live demo</Link>
      </div>
      <h2>Why us</h2>
      <ul style={{ lineHeight: 1.8 }}>
        <li>Bangla + South-Asian-English voices, extensible to more languages.</li>
        <li>Flat "up to N hours" pricing — undercuts ElevenLabs/AuthorVoices at volume.</li>
        <li>Manuscript → chaptered, loudness-normalized, distribution-ready audio.</li>
        <li>Consent attestation + AI-disclosure + C2PA watermark built in.</li>
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
