import { useParams, Link } from "react-router";
import { solutionPages } from "~/content/solutions/seo-matrix";

export function meta({ params }: { params: { slug: string } }) {
  const page = solutionPages().find((p) => p.slug === params.slug);
  if (!page) return [{ title: "Solutions — Voice Narration" }];
  return [
    { title: page.title },
    { name: "description", content: page.intent },
    { "script:ld+json": { "@context": "https://schema.org", "@type": "Service", name: page.title, description: page.intent } },
  ];
}

export default function SolutionPage() {
  const { slug } = useParams();
  const page = solutionPages().find((p) => p.slug === slug);
  if (!page) return <main style={{ padding: "3rem 1.25rem" }}><h1>Not found</h1></main>;
  return (
    <main style={{ maxWidth: 780, margin: "0 auto", padding: "3rem 1.25rem" }}>
      <h1>{page.h1}</h1>
      <p style={{ fontSize: "1.1rem", color: "#444" }}>{page.intent}</p>
      <Link to="/login" style={{ fontWeight: 600 }}>Start free →</Link>
    </main>
  );
}
