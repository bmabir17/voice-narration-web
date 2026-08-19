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

export interface UsageResponse {
  period: string;
  tier: string;
  subscription_status: string;
  current_period_end: string | null;
  cancel_at: string | null;
  minutes_used: number;
  minutes_limit: number;
  jobs_count: number;
  videos_used: number;
  videos_limit: number;
  api_access: boolean;
  max_custom_voices: number;
}

export interface DemoVoice {
  voice_id: string;
  language: string;
  accent: string | null;
}

export interface AdminUser {
  id: string;
  email: string | null;
  plan_tier: string;
  subscription_status: string;
  current_period_end: string | null;
  mor_subscription_id: string | null;
  created_at: string;
}

export interface AdminOverview {
  generated_at: string;
  worker_and_queue: {
    home_alive: boolean | null;
    failover_state: string | null;
    total_depth: number;
    depth_by_lane: Record<string, number>;
    oldest_age_ms: Record<string, number>;
    snapshot_age_sec: number | null;
  };
  jobs: {
    recent: Array<{
      id: string; status: string; voice_id: string; language: string; created_at: string;
      user_id: string | null; email: string | null;
    }>;
    counts: { queued: number; processing: number; completed: number; failed: number };
  };
  video_jobs: {
    recent: Array<{
      id: string; status: string; stage: string | null; language: string; created_at: string;
      user_id: string | null; email: string | null;
    }>;
    counts: { queued: number; processing: number; completed: number; failed: number };
  };
  billing: {
    total_users: number;
    by_plan: Record<string, number>;
    by_subscription_status: Record<string, number>;
    minutes_this_period: number;
    period: string;
  };
  redis_estimate: {
    note: string;
    per_day: Record<string, number>;
    per_day_total: number;
    per_month: number;
    free_tier_month: number;
    pct_of_free_tier: number;
  };
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

// --- Video (manuscript → narrated video) -------------------------------------------------------
export interface VideoOpts {
  candidates?: number; crossfade?: number; shots?: number | null; music?: boolean;
  keyframes?: boolean; continuity?: boolean; mode?: "deterministic" | "agentic";
  planner_model?: string | null; remote_llm?: boolean; video_model?: string | null;
  quality?: boolean; causvid_strength?: number; auto_approve?: boolean;
}
export interface SubmitVideoInput {
  manuscript: string; style_brief?: string | null; aspect?: string; fps?: number; language?: string;
  voice_id?: string | null; voice_ref?: string | null; voice_consent?: boolean;
  character_ids?: string[]; character_refs?: string[]; face_consent?: boolean;
  opts?: VideoOpts; idempotency_key?: string;
}
export interface VideoJobRow {
  id: string; status: string; stage: string | null;
  progress: { shots_done: number; shots_total: number };
  style_brief: string | null; created_at: string; expires_at: string | null;
  plan: { brief: { logline?: string | null } | null } | null;
}
// Human-readable topic of a video job: the planner's logline once available, else the style brief.
export function jobLogline(j: Pick<VideoJobRow, "plan" | "style_brief">): string | null {
  return j.plan?.brief?.logline ?? j.style_brief ?? null;
}
export interface FaceRow {
  id: string; name: string; image_ref: string; consent: boolean; created_at: string;
}
export interface CandidateInfo {
  seed: number; shot_key: string; score: number; verdict: string;
  prompt_adherence: number; artifacts: number; motion_ok: boolean;
}
export interface RenderStateShot {
  index: number; scene: string; chosen_seed: number | null; candidates: CandidateInfo[];
  visual_prompt?: string; motion?: string; negative_prompt?: string;
}
export interface RenderStateCloud { shots: RenderStateShot[]; }
export interface VideoJobDetail {
  job_id: string; status: string; stage: string | null;
  progress: { shots_done: number; shots_total: number };
  plan: { brief: any; shots: any[] } | null;
  manuscript: string | null; style_brief: string | null;
  qa: { ok: boolean; checks: Record<string, boolean>; notes: string[] } | null;
  error: string | null; duration_s: number | null; render_seconds: number | null; ai_disclosure: string;
  video_url: string | null; created_at: string; updated_at: string | null; expires_at: string | null;
  render_state: RenderStateCloud | null;
}

export const api = {
  submitJob: (input: SubmitJobInput) => request("/v1-jobs", { method: "POST", body: JSON.stringify(input) }),
  submitVideoJob: (input: SubmitVideoInput) =>
    request<{ job_id: string; status: string }>("/v1-video-jobs", { method: "POST", body: JSON.stringify(input) }),
  getVideoJob: (id: string) => request<VideoJobDetail>(`/v1-video-jobs/${id}`),
  listVideoJobs: () => request<{ jobs: VideoJobRow[] }>("/v1-video-jobs"),
  videoPlanDecision: (id: string, body: { action: "approve" | "reject" | "regenerate"; plan?: any }) =>
    request<{ ok: boolean; action: string }>(`/v1-video-jobs/${id}/plan`, { method: "POST", body: JSON.stringify(body) }),
  // Post-run candidate edits (GPU-bound, run on the home box).
  regenerateShot: (id: string, shot_index: number, opts?: {
    count?: number; visual_prompt?: string; motion?: string; negative_prompt?: string;
    quality?: boolean; causvid_strength?: number;
  }) => request<{ ok: boolean; edit_id: string }>(`/v1-video-jobs/${id}/regenerate`, {
    method: "POST", body: JSON.stringify({ shot_index, ...(opts ?? {}) }),
  }),
  reassembleVideo: (id: string, selections: Record<number, number>) =>
    request<{ ok: boolean; edit_id: string }>(`/v1-video-jobs/${id}/reassemble`, { method: "POST", body: JSON.stringify({ selections }) }),
  deleteVideoJob: (id: string) => request<{ ok: boolean }>(`/v1-video-jobs/${id}`, { method: "DELETE" }),
  // Saved-face library (cast reusable across video jobs).
  listFaces: () => request<{ faces: FaceRow[] }>("/v1-faces"),
  registerFace: (input: { id: string; name: string; image_ref: string; consent_checkbox: boolean; consent_statement_version: string }) =>
    request<{ id: string; status: string }>("/v1-faces", { method: "POST", body: JSON.stringify(input) }),
  deleteFace: (id: string) => request<{ deleted: string }>(`/v1-faces/${id}`, { method: "DELETE" }),
  getJob: (id: string) => request(`/v1-jobs/${id}`),
  listJobs: (status?: string) => request(`/v1-jobs${status ? `?status=${status}` : ""}`),
  listVoices: () => request<{ voices: unknown[] }>("/v1-voices"),
  deleteVoice: (id: string) => request(`/v1-voices/${id}`, { method: "DELETE" }),
  usage: () => request<UsageResponse>("/v1-usage"),

  // Billing (server-side Paddle Billing). checkout → hosted checkout URL; portal → manage/cancel URL.
  checkout: (tier: string) =>
    request<{ url: string }>("/v1-billing/checkout", { method: "POST", body: JSON.stringify({ tier }) }),
  billingPortal: () => request<{ url: string }>("/v1-billing/portal"),

  // Admin overview (operators only; server-gated by ADMIN_USER_IDS). Reads Postgres — no Redis cost.
  admin: () => request<AdminOverview>("/v1-admin"),
  // Cheap admin-gate probe (same allowlist): 200 {admin:true} for operators, 403 for everyone else.
  adminCheck: () => request<{ admin: true }>("/v1-admin/me"),

  // Admin: user + subscription management (same allowlist gate).
  adminUsers: {
    list: (q?: string) =>
      request<{ users: AdminUser[]; total: number }>(`/v1-admin/users${q ? `?q=${encodeURIComponent(q)}` : ""}`),
    create: (input: { email: string; plan_tier?: string }) =>
      request<{ id: string; email: string }>("/v1-admin/users", { method: "POST", body: JSON.stringify(input) }),
    update: (id: string, patch: {
      plan_tier?: string; subscription_status?: string; current_period_end?: string | null; reset_usage?: boolean;
    }) => request(`/v1-admin/users/${id}`, { method: "PATCH", body: JSON.stringify(patch) }),
    remove: (id: string) => request(`/v1-admin/users/${id}`, { method: "DELETE" }),
  },

  // Support tickets — user-facing
  support: {
    list: (status?: string) =>
      request<{ tickets: SupportTicket[]; total: number }>(`/support-tickets${status ? `?status=${status}` : ""}`),
    create: (input: { subject: string; message: string; attachments?: Array<{ file_ref: string; file_name: string; content_type: string; size_bytes: number }> }) =>
      request<SupportTicket>("/support-tickets", { method: "POST", body: JSON.stringify(input) }),
    get: (id: string) => request<SupportTicket>(`/support-tickets/${id}`),
    update: (id: string, patch: { message?: string }) =>
      request<SupportTicket>(`/support-tickets/${id}`, { method: "PATCH", body: JSON.stringify(patch) }),
  },

  // Support tickets — admin-facing
  adminSupport: {
    list: (params?: { status?: string; q?: string; limit?: number; offset?: number }) => {
      const qs = new URLSearchParams();
      if (params?.status) qs.set("status", params.status);
      if (params?.q) qs.set("q", params.q);
      if (params?.limit) qs.set("limit", String(params.limit));
      if (params?.offset) qs.set("offset", String(params.offset));
      return request<{ tickets: SupportTicket[]; total: number }>(`/support-tickets/admin${qs.toString() ? "?" + qs.toString() : ""}`);
    },
    get: (id: string) => request<SupportTicket>(`/support-tickets/admin/${id}`),
    update: (id: string, patch: { status?: "resolved" | "closed" }) =>
      request<SupportTicket>(`/support-tickets/admin/${id}`, { method: "PATCH", body: JSON.stringify(patch) }),
  },

  // Public demo playground (no auth) — gated by Turnstile + per-IP rate limits server-side.
  demoPresets: () => request<{ voices: DemoVoice[] }>("/v1-demo"),
  demoSubmit: (input: { text: string; voice_id: string; turnstile_token: string }) =>
    request<{ job_id: string; status: string }>("/v1-demo", { method: "POST", body: JSON.stringify(input) }),
  demoResult: (jobId: string) =>
    request<{ job_id: string; status: string; url?: string | null }>(`/v1-demo?job=${encodeURIComponent(jobId)}`),

  // Voice clone: upload reference audio to Storage first, then register + attest consent.
  async cloneVoice(input: {
    voice_id: string; language: string; accent?: string;
    reference_audio_ref: string; reference_audio_sha256: string;
    consent_checkbox: boolean; consent_statement_version: string;
  }) {
    return request("/v1-voices", { method: "POST", body: JSON.stringify(input) });
  },
};

// Upload an ad-hoc cast face straight to the private character-refs bucket (RLS-scoped by user_id
// prefix); returns the storage key to pass as character_refs in a video job.
export async function uploadFaceImage(userId: string, file: File): Promise<{ ref: string }> {
  const ext = (file.name.split(".").pop() || "png").toLowerCase().replace(/[^a-z0-9]/g, "") || "png";
  const ref = `${userId}/face_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const { error } = await supabase.storage.from("character-refs").upload(ref, file, { upsert: true });
  if (error) throw error;
  return { ref };
}

// The likeness-consent statement version the v1-faces endpoint expects at registration.
export const FACE_CONSENT_VERSION = "face-v1";

// Upload a saved cast face to the private character-refs bucket under {userId}/{id}.<ext>; returns the
// generated id + storage key to register with api.registerFace. The id is later passed as a video job's
// character_ids entry.
export async function uploadCharacterFace(userId: string, file: File): Promise<{ id: string; ref: string }> {
  const ext = (file.name.split(".").pop() || "png").toLowerCase().replace(/[^a-z0-9]/g, "") || "png";
  const id = `face_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
  const ref = `${userId}/${id}.${ext}`;
  const { error } = await supabase.storage.from("character-refs").upload(ref, file, { upsert: true });
  if (error) throw error;
  return { id, ref };
}

// Upload a one-off narration voice sample for a single video job (not saved to the voice library).
// Lands in the private reference-audio bucket under the user's prefix; returns the storage key to pass
// as a video job's voice_ref (with voice_consent).
export async function uploadVideoVoice(userId: string, file: File): Promise<{ ref: string }> {
  const ext = (file.name.split(".").pop() || "wav").toLowerCase().replace(/[^a-z0-9]/g, "") || "wav";
  const ref = `${userId}/adhoc_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const { error } = await supabase.storage.from("reference-audio").upload(ref, file, { upsert: true });
  if (error) throw error;
  return { ref };
}

// Upload a support-ticket attachment (image/video) to the private support-attachments bucket under
// the owner's prefix. The ref is later passed to api.support.create; the server records it in
// support_attachments and retention-sweep deletes the object 1 month after the ticket is closed.
export async function uploadSupportAttachment(userId: string, file: File): Promise<{ ref: string }> {
  const ext = (file.name.split(".").pop() || "bin").toLowerCase().replace(/[^a-z0-9]/g, "") || "bin";
  const ref = `${userId}/att_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const { error } = await supabase.storage.from("support-attachments").upload(ref, file, { upsert: true });
  if (error) throw error;
  return { ref };
}

export interface SupportReply {
  id: string;
  ticket_id: string;
  sender: "user" | "admin";
  message: string;
  created_at: string;
}

export interface SupportAttachment {
  id: string;
  ticket_id: string;
  user_id: string;
  file_ref: string;
  file_name: string;
  content_type: string;
  size_bytes: number;
  created_at: string;
  url?: string | null;
}

export interface SupportTicket {
  id: string;
  user_id: string;
  email: string;
  subject: string;
  message: string;
  status: string;
  admin_read_at: string | null;
  created_at: string;
  updated_at: string;
  plan_tier?: string;
  replies?: SupportReply[];
  attachments?: SupportAttachment[];
}

export async function uploadReferenceAudio(userId: string, voiceId: string, file: Blob): Promise<{ ref: string; sha256: string }> {
  const ref = `${userId}/${voiceId}/source.wav`;
  const { error } = await supabase.storage.from("reference-audio").upload(ref, file, { upsert: true });
  if (error) throw error;
  const buf = await file.arrayBuffer();
  const digest = await crypto.subtle.digest("SHA-256", buf);
  const sha256 = [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
  return { ref, sha256 };
}
