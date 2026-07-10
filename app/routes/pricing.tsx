export function meta() {
  return [
    { title: "Pricing — Voice Narration" },
    { name: "description", content: "Flat, volume-friendly plans for long-form AI narration. Free tier, Creator, Pro, and Volume/API." },
  ];
}

const TIERS = [
  { name: "Free", price: "$0", blurb: "~15 min/mo, watermarked, non-commercial." },
  { name: "Creator", price: "$19–29", blurb: "~2–3 hrs + commercial rights + 1 custom voice." },
  { name: "Pro", price: "$49–99", blurb: "~10–20 hrs + multiple voices + API access." },
  { name: "Volume / API", price: "$149+", blurb: "Flat 'up to N hours' tiers for high volume." },
];

export default function Pricing() {
  return (
    <main style={{ maxWidth: 860, margin: "0 auto", padding: "3rem 1.25rem" }}>
      <h1>Pricing</h1>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: "1rem" }}>
        {TIERS.map((t) => (
          <div key={t.name} style={{ border: "1px solid #ddd", borderRadius: 10, padding: "1.2rem" }}>
            <h3 style={{ margin: 0 }}>{t.name}</h3>
            <p style={{ fontSize: "1.4rem", fontWeight: 700, margin: "0.4rem 0" }}>{t.price}</p>
            <p style={{ color: "#555" }}>{t.blurb}</p>
          </div>
        ))}
      </div>
    </main>
  );
}
