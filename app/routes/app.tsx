import { useEffect, useState } from "react";
import { Link, Outlet, useNavigate } from "react-router";
import { supabase, currentSession } from "~/lib/supabase";

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
      <nav style={{ display: "flex", gap: "1rem", padding: "0.9rem 1.25rem", borderBottom: "1px solid #eee" }}>
        <Link to="/app/dashboard">Dashboard</Link>
        <Link to="/app/narrate">New narration</Link>
        <Link to="/app/voices">My voices</Link>
        <Link to="/app/voices/new">Add voice</Link>
        <Link to="/app/billing">Billing</Link>
        <Link to="/app/admin">Admin</Link>
        <button style={{ marginLeft: "auto" }} onClick={() => supabase.auth.signOut().then(() => navigate("/"))}>
          Sign out
        </button>
      </nav>
      <Outlet />
    </div>
  );
}
