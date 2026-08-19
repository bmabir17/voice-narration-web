// First-login onboarding + per-page tutorial state, persisted in localStorage keyed by user id.
// A user who signs in on a fresh browser gets the guided tour; replays never auto-trigger again.
import { supabase } from "~/lib/supabase";

const KEY = "va_onboarding_v1";

function map(): Record<string, boolean> {
  try { return JSON.parse(localStorage.getItem(KEY) || "{}"); } catch { return {}; }
}
function write(m: Record<string, boolean>) {
  try { localStorage.setItem(KEY, JSON.stringify(m)); } catch { /* private mode: ignore */ }
}

export async function currentUserId(): Promise<string | null> {
  const { data } = await supabase.auth.getUser();
  return data.user?.id ?? null;
}

// "Onboarded" = the dashboard tour was seen (started) for this user.
export function hasOnboarded(userId: string): boolean {
  return map()[userId] === true;
}
export function markOnboarded(userId: string): void {
  write({ ...map(), [userId]: true });
}