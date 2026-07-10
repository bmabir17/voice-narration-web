// Supabase client (PKCE). URL + anon key are public by design — RLS is the guard.
import { createClient } from "@supabase/supabase-js";

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY,
  { auth: { flowType: "pkce", persistSession: true, detectSessionInUrl: true } },
);

export async function currentSession() {
  const { data } = await supabase.auth.getSession();
  return data.session;
}
