// Domain entities and data structures for SaathiFy platform

export type ThemeType = 'default' | 'dark' | 'high-contrast' | 'warm-low-glare';

export type ComplexityLevel = 'original' | 'simplified' | 'essential';

export interface AccessibilityProfile {
  theme: ThemeType;
  fontScale: number; // 1.0 to 1.6
  dyslexiaMode: boolean;
  highContrast: boolean;
  ttsEnabled: boolean;
  ttsSpeed: number; // 0.5 to 2.0
  preferredCaptions: 'isl' | 'standard' | 'simplified';
  screenReaderOptimized: boolean;
}

export interface DataSeriesItem {
  label: string;
  value: string | number;
}

export interface ImageDescription {
  id: string;
  shortAlt: string;
  longDescription: string;
  figureType: 'graph' | 'diagram' | 'chart' | 'photo' | 'illustration';
  dataSeries?: DataSeriesItem[];
  tactileFriendlyNotes?: string;
}

// Discriminated union for document content blocks
export type ContentBlock =
  | { kind: 'paragraph'; id: string; text: string; simplifiedText?: string; essentialText?: string }
  | { kind: 'heading'; id: string; level: 1 | 2 | 3 | 4; text: string }
  | { kind: 'image'; id: string; src: string; description: ImageDescription }
  | { kind: 'table'; id: string; headers: string[]; rows: string[][]; caption?: string }
  | { kind: 'equation'; id: string; latex: string; spokenMathText: string }
  | { kind: 'list'; id: string; ordered: boolean; items: string[] };

export interface Document {
  id: string;
  title: string;
  originalFormat: 'pdf' | 'pptx' | 'docx' | 'mp4' | 'mp3' | 'notes';
  createdAt: string;
  pageCount: number;
  status: 'raw' | 'processing' | 'ready' | 'error';
  complexityLevel: ComplexityLevel;
  subject: string;
  summary: string;
  blocks: ContentBlock[];
  audioUrl?: string;
}

export interface ConversionJob {
  jobId: string;
  documentId: string;
  progressPct: number;
  currentStep: string;
  status: 'queued' | 'converting' | 'completed' | 'failed';
  error?: string;
  estimatedTimeRemainingSec: number;
}

export interface IslGloss {
  id: string;
  timestamp: number;
  text: string;
  glossTokens: string[];
  grammarNotes?: string;
  avatarAnimationUrl?: string;
  unknownWords?: string[];
  translationMethod?: string;
}

export interface CaptionCue {
  id: string;
  startTime: number;
  endTime: number;
  text: string;
  speakerId?: string;
}

export interface PipelineMetrics {
  latencyMs: number;
  cpuUsagePct: number;
  activeStreams: number;
  asrConfidence: number;
  translateLagMs: number;
}
