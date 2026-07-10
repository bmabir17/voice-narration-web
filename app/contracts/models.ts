// GENERATED FROM contracts/schemas/models.json — DO NOT EDIT. Run: make contracts
import * as z from "zod";


export const ChapterStatusSchema = z.enum([
    "done",
    "failed",
    "pending",
    "synthesizing",
]);
export type ChapterStatus = z.infer<typeof ChapterStatusSchema>;

// Trust + reliability tier of the worker. Determines which queue lanes it may claim.

export const WorkerClassSchema = z.enum([
    "home",
    "runpod-secure",
    "salad-consumer",
    "salad-dc",
]);
export type WorkerClass = z.infer<typeof WorkerClassSchema>;

// Commercial-safe TTS engine that the router resolves a voice to.

export const ModelSchema = z.enum([
    "chatterbox-indic",
    "chatterbox-ml",
    "kokoro-82m",
    "orpheus-3b",
    "qwen3-tts",
]);
export type Model = z.infer<typeof ModelSchema>;

// acx = one file per chapter, <=120 min, EBU R128; single = one continuous file; none = no
// chaptering.

export const ChapteringSchema = z.enum([
    "acx",
    "none",
    "single",
]);
export type Chaptering = z.infer<typeof ChapteringSchema>;


export const OutputFormatSchema = z.enum([
    "m4b",
    "mp3",
    "wav",
]);
export type OutputFormat = z.infer<typeof OutputFormatSchema>;

// bulk = best-effort spillover-eligible; deadline = guaranteed-pickup (gated by paid tier).

export const PriorityLaneSchema = z.enum([
    "bulk",
    "deadline",
]);
export type PriorityLane = z.infer<typeof PriorityLaneSchema>;

// public = preset/shipped voices; biometric = customer-uploaded reference audio (never runs
// on anonymous consumer nodes).

export const SensitivitySchema = z.enum([
    "biometric",
    "public",
]);
export type Sensitivity = z.infer<typeof SensitivitySchema>;

// Lifecycle of a narration job.

export const JobStatusSchema = z.enum([
    "assembling",
    "cancelled",
    "claimed",
    "completed",
    "failed",
    "processing",
    "queued",
]);
export type JobStatus = z.infer<typeof JobStatusSchema>;


export const VoiceSourceSchema = z.enum([
    "cloned",
    "preset",
    "shipped",
]);
export type VoiceSource = z.infer<typeof VoiceSourceSchema>;

export const ConsentRecordSchema = z.object({
    "checkbox_value": z.boolean(),
    "consent_statement_version": z.string(),
    "created_at": z.coerce.date(),
    "id": z.string(),
    "ip_address": z.string(),
    "reference_audio_sha256": z.union([z.null(), z.string()]).optional(),
    "user_agent": z.string(),
    "user_id": z.string(),
    "voice_id": z.string(),
});
export type ConsentRecord = z.infer<typeof ConsentRecordSchema>;

export const ChapterSchema = z.object({
    "audio_ref": z.union([z.null(), z.string()]).optional(),
    "index": z.number(),
    "status": ChapterStatusSchema.optional(),
    "title": z.union([z.null(), z.string()]).optional(),
});
export type Chapter = z.infer<typeof ChapterSchema>;

export const LeaseSchema = z.object({
    "expires_at": z.coerce.date(),
    "worker_class": WorkerClassSchema,
    "worker_id": z.string(),
});
export type Lease = z.infer<typeof LeaseSchema>;

export const OutputSpecSchema = z.object({
    "bitrate_kbps": z.number().optional(),
    "chaptering": ChapteringSchema.optional(),
    "format": OutputFormatSchema.optional(),
    "loudness_i": z.number().optional(),
    "loudness_lra": z.number().optional(),
    "loudness_tp": z.number().optional(),
    "sample_rate": z.number().optional(),
});
export type OutputSpec = z.infer<typeof OutputSpecSchema>;

export const ProgressSchema = z.object({
    "chapters_done": z.number().optional(),
    "chapters_total": z.number().optional(),
});
export type Progress = z.infer<typeof ProgressSchema>;

export const RoutingSchema = z.object({
    "consumer_eligible": z.boolean(),
    "requires_datacenter": z.boolean(),
});
export type Routing = z.infer<typeof RoutingSchema>;

export const SubmitJobRequestSchema = z.object({
    "idempotency_key": z.union([z.null(), z.string()]).optional(),
    "language": z.string(),
    "output": OutputSpecSchema.optional(),
    "priority_lane": PriorityLaneSchema.optional(),
    "source_url": z.union([z.null(), z.string()]).optional(),
    "text": z.union([z.null(), z.string()]).optional(),
    "voice_id": z.string(),
});
export type SubmitJobRequest = z.infer<typeof SubmitJobRequestSchema>;

export const VoiceSchema = z.object({
    "accent": z.union([z.null(), z.string()]).optional(),
    "created_at": z.union([z.coerce.date(), z.null()]).optional(),
    "default_params": z.record(z.string(), z.any()).optional(),
    "is_custom": z.boolean().optional(),
    "language": z.string(),
    "license": z.string(),
    "model": ModelSchema,
    "model_target": z.string().optional(),
    "pronunciation_dict_ref": z.union([z.null(), z.string()]).optional(),
    "reference_audio_ref": z.union([z.null(), z.string()]).optional(),
    "sensitivity": SensitivitySchema.optional(),
    "source": VoiceSourceSchema,
    "status": z.string().optional(),
    "user_id": z.union([z.null(), z.string()]).optional(),
    "voice_id": z.string(),
    "weights_ref": z.union([z.null(), z.string()]).optional(),
});
export type Voice = z.infer<typeof VoiceSchema>;

export const JobSchema = z.object({
    "api_key_id": z.union([z.null(), z.string()]).optional(),
    "chapters": z.array(ChapterSchema).optional(),
    "created_at": z.coerce.date(),
    "enqueued_at": z.union([z.coerce.date(), z.null()]).optional(),
    "error": z.union([z.null(), z.string()]).optional(),
    "estimated_minutes": z.union([z.number(), z.null()]).optional(),
    "expires_at": z.union([z.coerce.date(), z.null()]).optional(),
    "id": z.string(),
    "idempotency_key": z.union([z.null(), z.string()]).optional(),
    "language": z.string(),
    "lease": z.union([LeaseSchema, z.null()]).optional(),
    "model": ModelSchema,
    "model_target": z.string().optional(),
    "output": OutputSpecSchema,
    "priority_lane": PriorityLaneSchema.optional(),
    "progress": ProgressSchema,
    "routing": RoutingSchema,
    "sensitivity": SensitivitySchema.optional(),
    "source_ref": z.union([z.null(), z.string()]).optional(),
    "status": JobStatusSchema.optional(),
    "text": z.union([z.null(), z.string()]).optional(),
    "updated_at": z.union([z.coerce.date(), z.null()]).optional(),
    "user_id": z.string(),
    "voice_id": z.string(),
});
export type Job = z.infer<typeof JobSchema>;

export const ModelsSchema = z.object({
    "consent_record": ConsentRecordSchema.optional(),
    "job": JobSchema.optional(),
    "submit_job_request": SubmitJobRequestSchema.optional(),
    "voice": VoiceSchema.optional(),
});
export type Models = z.infer<typeof ModelsSchema>;
