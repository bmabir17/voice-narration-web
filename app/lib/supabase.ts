// Supabase client (PKCE). URL + anon key are public by design — RLS is the guard.
//
// Lazily constructed: `createClient` spins up a Realtime client whose WebSocket resolution throws
// under Node < 22 (no global WebSocket). Since we prerender the marketing pages in Node at build
// time (ssr:false + prerender), constructing the client at import scope would crash the build. The
// Proxy defers construction until the first property access, which only happens in the browser.
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let _client: SupabaseClient | null = null;
function client(): SupabaseClient {
  if (!_client) {
    _client = createClient(
      import.meta.env.VITE_SUPABASE_URL,
      import.meta.env.VITE_SUPABASE_ANON_KEY,
      { auth: { flowType: "pkce", persistSession: true, detectSessionInUrl: true } },
    );
  }
  return _client;
}

export const supabase = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    const value = client()[prop as keyof SupabaseClient];
    return typeof value === "function" ? value.bind(client()) : value;
  },
});

export async function currentSession() {
  const { data } = await supabase.auth.getSession();
  return data.session;
}
