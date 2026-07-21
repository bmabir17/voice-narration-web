import type { ReactNode } from "react";
import { Link } from "react-router";

// Shared shell for the legal pages (Terms, Privacy, Refunds): consistent width, hierarchy, spacing.
export function LegalPage({ title, updated, children }: { title: string; updated: string; children: ReactNode }) {
  return (
    <main className="legal" style={{ maxWidth: 760, margin: "0 auto", padding: "2.5rem 1.25rem 4rem", lineHeight: 1.65 }}>
      <style>{`
        .legal h2 { font-size: 1.15rem; margin: 2rem 0 .5rem; }
        .legal h3 { font-size: 1rem; margin: 1.3rem 0 .4rem; }
        .legal p, .legal li { color: #262626; font-size: .96rem; }
        .legal ul { padding-left: 1.2rem; }
        .legal li { margin: .3rem 0; }
        .legal a { color: #1858c7; }
        .legal code { background: #f2f4f7; padding: .05em .35em; border-radius: 4px; font-size: .9em; }
      `}</style>
      <p style={{ margin: 0 }}><Link to="/" style={{ color: "#666", textDecoration: "none" }}>← narration.me</Link></p>
      <h1 style={{ margin: ".5rem 0 .2rem" }}>{title}</h1>
      <p style={{ color: "#777", marginTop: 0, fontSize: ".88rem" }}>Last updated: {updated}</p>
      {children}
    </main>
  );
}
