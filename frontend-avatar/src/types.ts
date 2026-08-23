// Mirrors the backend's Pydantic models (app/models/motion.py, app/core/events.py).
// The frontend has NO translation intelligence — it only renders what the
// backend already decided.

export type PipelineEventType =
  | "PIPELINE_STATUS" | "INPUT_RECEIVED" | "ASR_PARTIAL" | "ASR_FINAL"
  | "TRANSCRIPT_UPDATED" | "CONTEXT_READY" | "LANGUAGE_DETECTED" | "TEXT_NORMALIZED"
  | "ISL_TRANSLATION" | "SIGN_RESOLVED" | "MOTION_SEQUENCE" | "AVATAR_SEQUENCE_READY"
  | "PIPELINE_ERROR" | "PIPELINE_METRICS"
  | "TRANSCRIPT_PARTIAL" | "TRANSCRIPT_FINAL" | "SYSTEM_STATUS" | "ERROR";

export interface PipelineEvent<T = any> {
  event_id: string;
  type: PipelineEventType;
  timestamp: number;
  data: T;
}

export type AvatarExpression = "NEUTRAL" | "HAPPY" | "QUESTION" | "NEGATION";

export type AvatarState = "IDLE" | "RECEIVING_SEQUENCE" | "QUEUED" | "PLAYING_SIGN" | "RETURN_TO_IDLE";

export interface MotionItem {
  type: "sign" | "fingerspell";
  sign_id: string | null;
  animation_id: string | null;
  characters: string[];
  duration_ms: number;
}

export interface MotionSequence {
  sequence_id: string;
  source_text: string;
  translation: string[];
  items: MotionItem[];
  expression: AvatarExpression;
}

export interface PoseData {
  right_hand: [number, number, number];
  left_hand: [number, number, number] | null;
  hold_ms: number;
}

export type AnimationLibraryData = Record<string, PoseData>;

export interface PipelineStatus {
  audio: string;
  asr: string;
  translator: string;
  running: boolean;
  stream_mode: string | null;
  asr_device: string | null;
  last_transcript: string;
}

export interface AudioDebugInfo {
  backend?: string;
  name?: string;
  sample_rate?: number;
  channels?: number;
  window_seconds?: number;
  overlap_seconds?: number;
  current_rms?: number;
  current_peak?: number;
  audio_active?: boolean;
  buffered_seconds?: number;
  pending_seconds?: number;
  dropped_stale_windows?: number;
  dropped_silent_windows?: number;
}
