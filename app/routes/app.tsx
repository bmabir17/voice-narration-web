import { useEffect, useState } from "react";
import { Link, Outlet, useNavigate } from "react-router";
import { supabase, currentSession } from "~/lib/supabase";
import { NavShell, navCta, navLink, navLinkBtn } from "~/components/NavBar";

// Authed layout + client-side route guard (the app routes are non-indexed; the 404.html SPA
// fallback serves them). Server RLS is the real security boundary.
export default function AppLayout() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    currentSession().then((s) => {
      if (!s) navigate("/login", { replace: true });
      else setReady(true);
    });
  }, [navigate]);

  if (!ready) return <main style={{ padding: "3rem" }}><p>Loading…</p></main>;
  return (
    <div>
      <NavShell>
        <Link to="/app/dashboard" style={navLink}>Dashboard</Link>
        <Link to="/app/voices" style={navLink}>My voices</Link>
        <Link to="/app/voices/new" style={navLink}>Add voice</Link>
        <Link to="/app/billing" style={navLink}>Billing</Link>
        <Link to="/app/admin" style={navLink}>Admin</Link>
        <button onClick={() => supabase.auth.signOut().then(() => navigate("/"))} style={navLinkBtn}>
          Sign out
        </button>
        <Link to="/app/narrate" style={navCta}>New narration</Link>
      </NavShell>
      <Outlet />
    </div>
  );
}
