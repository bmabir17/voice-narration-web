// Typed fetch wrapper to the control-plane Edge Functions. Injects the Supabase session JWT and
// refreshes once on 401. Big uploads go straight to Storage (see uploadReferenceAudio), not here.
import { supabase, currentSession } from "./supabase";

const BASE = import.meta.env.VITE_API_BASE_URL; // e.g. https://<ref>.functions.supabase.co

async function authHeader(): Promise<Record<string, string>> {
  const session = await currentSession();
  return session ? { Authorization: `Bearer ${session.access_token}` } : {};
}

async function request<T>(path: string, init: RequestInit = {}, retry = true): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...(await authHeader()), ...(init.headers ?? {}) },
  });
  if (res.status === 401 && retry) {
    await supabase.auth.refreshSession();
    return request<T>(path, init, false);
  }
  if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error ?? `HTTP ${res.status}`);
  return res.json() as Promise<T>;
}

export interface SubmitJobInput {
  language: string;
  voice_id: string;
  text?: string;
  source_url?: string;
  priority_lane?: "bulk" | "deadline";
  output?: { format: "mp3" | "wav"; bitrate_kbps?: number; chaptering?: "acx" | "single" | "none" };
  idempotency_key?: string;
}

export const api = {
  submitJob: (input: SubmitJobInput) => request("/v1-jobs", { method: "POST", body: JSON.stringify(input) }),
  getJob: (id: string) => request(`/v1-jobs/${id}`),
  listJobs: (status?: string) => request(`/v1-jobs${status ? `?status=${status}` : ""}`),
  listVoices: () => request<{ voices: unknown[] }>("/v1-voices"),
  usage: () => request("/v1-usage"),

  // Voice clone: upload reference audio to Storage first, then register + attest consent.
  async cloneVoice(input: {
    voice_id: string; language: string; accent?: string;
    reference_audio_ref: string; reference_audio_sha256: string;
    consent_checkbox: boolean; consent_statement_version: string;
  }) {
    return request("/v1-voices", { method: "POST", body: JSON.stringify(input) });
  },
};

export async function uploadReferenceAudio(userId: string, voiceId: string, file: Blob): Promise<{ ref: string; sha256: string }> {
  const ref = `${userId}/${voiceId}/source.wav`;
  const { error } = await supabase.storage.from("reference-audio").upload(ref, file, { upsert: true });
  if (error) throw error;
  const buf = await file.arrayBuffer();
  const digest = await crypto.subtle.digest("SHA-256", buf);
  const sha256 = [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
  return { ref, sha256 };
}
