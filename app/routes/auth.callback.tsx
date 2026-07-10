import { useEffect } from "react";
import { useNavigate } from "react-router";
import { supabase } from "~/lib/supabase";

// PKCE completes here (detectSessionInUrl handles the exchange), then redirect into the app.
export default function AuthCallback() {
  const navigate = useNavigate();
  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      if (session) navigate("/app/dashboard", { replace: true });
    });
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate("/app/dashboard", { replace: true });
    });
    return () => sub.subscription.unsubscribe();
  }, [navigate]);
  return <main style={{ padding: "4rem 1.25rem" }}><p>Signing you in…</p></main>;
}
