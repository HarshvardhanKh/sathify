// Discriminated union of inbound WebSocket events for SaathiFy pipeline

export type EventType =
  | 'TRANSCRIPT_PARTIAL'
  | 'TRANSCRIPT_FINAL'
  | 'ISL_TRANSLATION'
  | 'AVATAR_MOTION'
  | 'SYSTEM_STATUS'
  | 'PIPELINE_ERROR'
  | 'CONVERSION_PROGRESS'
  | 'CONVERSION_COMPLETE'
  | 'TTS_BOUNDARY';

export interface TranscriptPartialData {
  speakerId: string;
  partialText: string;
  confidence: number;
}

export interface TranscriptFinalData {
  segmentId: string;
  speakerId: string;
  finalText: string;
  startTime: number;
  endTime: number;
  confidence: number;
}

export interface IslTranslationData {
  segmentId: string;
  originalText: string;
  glossTokens: string[];
  grammarNotes?: string;
  unknownWords?: string[];
  translationMethod?: string;
}

export interface AvatarMotionData {
  glossToken: string;
  boneTransformUrl: string;
  durationMs: number;
}

export interface SystemStatusData {
  audioActive: boolean;
  asrLatencyMs: number;
  translatorLagMs: number;
  avatarFps: number;
  cpuUsagePct: number;
}

export interface PipelineErrorData {
  code: string;
  message: string;
  retryable: boolean;
}

export interface ConversionProgressData {
  jobId: string;
  documentId: string;
  progressPct: number;
  currentStep: string;
}

export interface ConversionCompleteData {
  jobId: string;
  documentId: string;
  summary: string;
  blocksCount: number;
}

export interface TtsBoundaryData {
  charIndex: number;
  charLength: number;
  word: string;
}

// Individual Event Types
export interface TranscriptPartialEvent {
  type: 'TRANSCRIPT_PARTIAL';
  timestamp: number;
  data: TranscriptPartialData;
}

export interface TranscriptFinalEvent {
  type: 'TRANSCRIPT_FINAL';
  timestamp: number;
  data: TranscriptFinalData;
}

export interface IslTranslationEvent {
  type: 'ISL_TRANSLATION';
  timestamp: number;
  data: IslTranslationData;
}

export interface AvatarMotionEvent {
  type: 'AVATAR_MOTION';
  timestamp: number;
  data: AvatarMotionData;
}

export interface SystemStatusEvent {
  type: 'SYSTEM_STATUS';
  timestamp: number;
  data: SystemStatusData;
}

export interface PipelineErrorEvent {
  type: 'PIPELINE_ERROR';
  timestamp: number;
  data: PipelineErrorData;
}

export interface ConversionProgressEvent {
  type: 'CONVERSION_PROGRESS';
  timestamp: number;
  data: ConversionProgressData;
}

export interface ConversionCompleteEvent {
  type: 'CONVERSION_COMPLETE';
  timestamp: number;
  data: ConversionCompleteData;
}

export interface TtsBoundaryEvent {
  type: 'TTS_BOUNDARY';
  timestamp: number;
  data: TtsBoundaryData;
}

// Global Discriminated Union
export type WebSocketEvent =
  | TranscriptPartialEvent
  | TranscriptFinalEvent
  | IslTranslationEvent
  | AvatarMotionEvent
  | SystemStatusEvent
  | PipelineErrorEvent
  | ConversionProgressEvent
  | ConversionCompleteEvent
  | TtsBoundaryEvent;

// Type Guards per Event Type
export function isTranscriptPartialEvent(event: WebSocketEvent): event is TranscriptPartialEvent {
  return event.type === 'TRANSCRIPT_PARTIAL';
}

export function isTranscriptFinalEvent(event: WebSocketEvent): event is TranscriptFinalEvent {
  return event.type === 'TRANSCRIPT_FINAL';
}

export function isIslTranslationEvent(event: WebSocketEvent): event is IslTranslationEvent {
  return event.type === 'ISL_TRANSLATION';
}

export function isAvatarMotionEvent(event: WebSocketEvent): event is AvatarMotionEvent {
  return event.type === 'AVATAR_MOTION';
}

export function isSystemStatusEvent(event: WebSocketEvent): event is SystemStatusEvent {
  return event.type === 'SYSTEM_STATUS';
}

export function isPipelineErrorEvent(event: WebSocketEvent): event is PipelineErrorEvent {
  return event.type === 'PIPELINE_ERROR';
}

export function isConversionProgressEvent(event: WebSocketEvent): event is ConversionProgressEvent {
  return event.type === 'CONVERSION_PROGRESS';
}

export function isConversionCompleteEvent(event: WebSocketEvent): event is ConversionCompleteEvent {
  return event.type === 'CONVERSION_COMPLETE';
}

export function isTtsBoundaryEvent(event: WebSocketEvent): event is TtsBoundaryEvent {
  return event.type === 'TTS_BOUNDARY';
}

/**
 * Exhaustive check helper. Ensures TypeScript breaks the build if a new backend event type is added
 * without handling it in switch statements or exhaustive mappings.
 */
export function assertNever(x: never): never {
  throw new Error(`Unhandled backend event type encountered: ${JSON.stringify(x)}`);
}
