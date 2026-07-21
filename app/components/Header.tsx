import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import { supabase, currentSession } from "~/lib/supabase";
import { NavShell, navCta, navLink, navLinkBtn } from "./NavBar";

// Public top nav — shown on marketing/content pages (via routes/marketing.tsx). Auth-aware:
// signed-out shows Sign in / Start free; signed-in shows Sign out + a Dashboard link. The session is
// checked client-side (pages are prerendered), so the static HTML renders the signed-out state and
// hydration swaps it if a session exists.
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
    <NavShell>
      <Link to="/demo" style={navLink}>Demo</Link>
      <Link to="/pricing" style={navLink}>Pricing</Link>
      <Link to="/docs" style={navLink}>Docs</Link>
      <Link to="/blog" style={navLink}>Blog</Link>
      {authed ? (
        <>
          <button onClick={signOut} style={navLinkBtn}>Sign out</button>
          <Link to="/app/dashboard" style={navCta}>Dashboard</Link>
        </>
      ) : (
        <>
          <Link to="/login" style={navLink}>Sign in</Link>
          <Link to="/login" style={navCta}>Start free</Link>
        </>
      )}
    </NavShell>
  );
}
