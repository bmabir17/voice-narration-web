import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import { supabase, currentSession } from "~/lib/supabase";

// Public top nav — shown on marketing/content pages (via routes/marketing.tsx), NOT on /app/* which
// has its own authed nav. Auth-aware: signed-out shows Sign in / Start free; signed-in shows a
// Dashboard link + Sign out. The session is checked client-side (pages are prerendered), so the
// static HTML renders the signed-out state and hydration swaps it if a session exists.
const NAV: React.CSSProperties = { color: "#333", textDecoration: "none", fontSize: ".92rem", fontWeight: 500 };
const CTA: React.CSSProperties = {
  color: "#fff", background: "#1a1a1a", textDecoration: "none", fontSize: ".9rem", fontWeight: 600,
  padding: "0.4rem 0.9rem", borderRadius: 7,
};
const LINKBTN: React.CSSProperties = {
  ...NAV, background: "none", border: "none", padding: 0, cursor: "pointer", font: "inherit",
};

export function Header() {
  const navigate = useNavigate();
  const [authed, setAuthed] = useState<boolean | null>(null); // null = unknown (SSR / first paint)

  useEffect(() => { currentSession().then((s) => setAuthed(!!s)); }, []);

  async function signOut() {
    await supabase.auth.signOut();
    setAuthed(false);
    navigate("/");
  }

  return (
    <header style={{ position: "sticky", top: 0, zIndex: 20, background: "rgba(255,255,255,0.88)",
                     backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)",
                     borderBottom: "1px solid #ececec" }}>
      <div style={{ maxWidth: 1040, margin: "0 auto", padding: "0.7rem 1.25rem", display: "flex",
                    alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
        <Link to="/" style={{ fontWeight: 700, fontSize: "1.08rem", textDecoration: "none", color: "#111",
                              letterSpacing: "-0.01em", marginRight: "auto" }}>
          narration<span style={{ color: "#1858c7" }}>.me</span>
        </Link>
        <nav style={{ display: "flex", gap: "1.1rem", alignItems: "center", flexWrap: "wrap" }}>
          <Link to="/demo" style={NAV}>Demo</Link>
          <Link to="/pricing" style={NAV}>Pricing</Link>
          <Link to="/docs" style={NAV}>Docs</Link>
          <Link to="/blog" style={NAV}>Blog</Link>
          {authed ? (
            <>
              <button onClick={signOut} style={LINKBTN}>Sign out</button>
              <Link to="/app/dashboard" style={CTA}>Dashboard</Link>
            </>
          ) : (
            <>
              <Link to="/login" style={NAV}>Sign in</Link>
              <Link to="/login" style={CTA}>Start free</Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
