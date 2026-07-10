import { useState } from "react";
import { supabase } from "~/lib/supabase";

export function meta() { return [{ title: "Sign in — Voice Narration" }]; }

export default function Login() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    const redirectTo = `${window.location.origin}/auth/callback`;
    const { error } = await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: redirectTo } });
    if (error) setErr(error.message); else setSent(true);
  }

  return (
    <main style={{ maxWidth: 420, margin: "0 auto", padding: "4rem 1.25rem" }}>
      <h1>Sign in</h1>
      {sent ? (
        <p>Check your email for a magic link.</p>
      ) : (
        <form onSubmit={submit} style={{ display: "grid", gap: "0.8rem" }}>
          <input type="email" required placeholder="you@example.com" value={email}
                 onChange={(e) => setEmail(e.target.value)} style={{ padding: "0.6rem" }} />
          <button style={{ padding: "0.6rem 1.2rem" }}>Send magic link</button>
          {err && <p style={{ color: "crimson" }}>{err}</p>}
        </form>
      )}
    </main>
  );
}
