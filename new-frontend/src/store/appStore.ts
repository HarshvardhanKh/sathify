import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { AccessibilityProfile, ComplexityLevel, Document, IslGloss, PipelineMetrics } from '../types/domain';

export type PipelineState = 'idle' | 'starting' | 'running' | 'stopping' | 'error';

export interface FinalTranscriptItem {
  id: string;
  speaker: string;
  text: string;
  confidence: number;
  timestamp: number;
}

export interface AppStoreState {
  // Slices
  profile: AccessibilityProfile;
  pipelineState: PipelineState;
  pipelineError: string | null;
  status: {
    audioActive: boolean;
    asrLatencyMs: number;
    translatorLagMs: number;
    avatarFps: number;
    cpuUsagePct: number;
  };
  transcript: {
    partial: string;
    finals: FinalTranscriptItem[];
  };
  isl: {
    current: IslGloss | null;
    history: IslGloss[];
  };
  library: Document[];
  reader: {
    activeDocumentId: string | null;
    activeBlockId: string | null;
    complexity: ComplexityLevel;
    isPlayingTts: boolean;
  };
  metrics: PipelineMetrics;

  // Actions
  setProfile: (profile: Partial<AccessibilityProfile>) => void;
  setTheme: (theme: AccessibilityProfile['theme']) => void;
  setFontScale: (scale: number) => void;
  toggleDyslexiaMode: () => void;
  toggleHighContrast: () => void;
  toggleTts: () => void;

  setPipelineState: (state: PipelineState, error?: string | null) => void;
  updateStatus: (status: Partial<AppStoreState['status']>) => void;

  setTranscriptPartial: (partial: string) => void;
  addTranscriptFinal: (item: FinalTranscriptItem) => void;
  clearTranscript: () => void;

  setIslCurrent: (gloss: IslGloss) => void;
  clearIslHistory: () => void;

  setLibrary: (docs: Document[]) => void;
  addDocumentToLibrary: (doc: Document) => void;

  setReaderDocumentId: (id: string | null) => void;
  setReaderActiveBlockId: (id: string | null) => void;
  setReaderComplexity: (level: ComplexityLevel) => void;
  setReaderTtsPlaying: (playing: boolean) => void;

  updateMetrics: (metrics: Partial<PipelineMetrics>) => void;
}

export const useAppStore = create<AppStoreState>()(
  subscribeWithSelector((set) => ({
    // Initial Profile State
    profile: {
      theme: 'default',
      fontScale: 1.0,
      dyslexiaMode: false,
      highContrast: false,
      ttsEnabled: true,
      ttsSpeed: 1.0,
      preferredCaptions: 'standard',
      screenReaderOptimized: false,
    },

    // Pipeline State
    pipelineState: 'idle',
    pipelineError: null,

    // Backend System Status
    status: {
      audioActive: false,
      asrLatencyMs: 42,
      translatorLagMs: 380,
      avatarFps: 60,
      cpuUsagePct: 18,
    },

    // Transcript (Partial + 200 Max Finals)
    transcript: {
      partial: '',
      finals: [],
    },

    // ISL Gloss Stream (Current + 50 Max History)
    isl: {
      current: null,
      history: [],
    },

    // Library Documents
    library: [],

    // Reader State
    reader: {
      activeDocumentId: null,
      activeBlockId: null,
      complexity: 'original',
      isPlayingTts: false,
    },

    // System Metrics
    metrics: {
      latencyMs: 45,
      cpuUsagePct: 14,
      activeStreams: 1,
      asrConfidence: 0.96,
      translateLagMs: 380,
    },

    // Actions
    setProfile: (newProfile) =>
      set((state) => ({ profile: { ...state.profile, ...newProfile } })),

    setTheme: (theme) => {
      document.documentElement.setAttribute('data-theme', theme);
      set((state) => ({ profile: { ...state.profile, theme } }));
    },

    setFontScale: (fontScale) => {
      document.documentElement.style.setProperty('--reading-scale', fontScale.toString());
      set((state) => ({ profile: { ...state.profile, fontScale } }));
    },

    toggleDyslexiaMode: () =>
      set((state) => {
        const next = !state.profile.dyslexiaMode;
        if (next) {
          document.body.classList.add('dyslexia-mode');
        } else {
          document.body.classList.remove('dyslexia-mode');
        }
        return { profile: { ...state.profile, dyslexiaMode: next } };
      }),

    toggleHighContrast: () =>
      set((state) => {
        const nextTheme = state.profile.theme === 'high-contrast' ? 'default' : 'high-contrast';
        document.documentElement.setAttribute('data-theme', nextTheme);
        return {
          profile: {
            ...state.profile,
            highContrast: !state.profile.highContrast,
            theme: nextTheme,
          },
        };
      }),

    toggleTts: () =>
      set((state) => ({
        profile: { ...state.profile, ttsEnabled: !state.profile.ttsEnabled },
      })),

    setPipelineState: (pipelineState, error = null) =>
      set({ pipelineState, pipelineError: error }),

    updateStatus: (newStatus) =>
      set((state) => ({ status: { ...state.status, ...newStatus } })),

    setTranscriptPartial: (partial) =>
      set((state) => ({
        transcript: { ...state.transcript, partial },
      })),

    addTranscriptFinal: (item) =>
      set((state) => {
        // Bound array at 200 items maximum
        const finals = [item, ...state.transcript.finals].slice(0, 200);
        return {
          transcript: {
            partial: '',
            finals,
          },
        };
      }),

    clearTranscript: () =>
      set({ transcript: { partial: '', finals: [] } }),

    setIslCurrent: (gloss) =>
      set((state) => {
        // Bound ISL history at 50 items maximum
        const history = [gloss, ...state.isl.history].slice(0, 50);
        return {
          isl: {
            current: gloss,
            history,
          },
        };
      }),

    clearIslHistory: () =>
      set({ isl: { current: null, history: [] } }),

    setLibrary: (docs) => set({ library: docs }),

    addDocumentToLibrary: (doc) =>
      set((state) => ({ library: [doc, ...state.library] })),

    setReaderDocumentId: (id) =>
      set((state) => ({ reader: { ...state.reader, activeDocumentId: id } })),

    setReaderActiveBlockId: (id) =>
      set((state) => ({ reader: { ...state.reader, activeBlockId: id } })),

    setReaderComplexity: (complexity) =>
      set((state) => ({ reader: { ...state.reader, complexity } })),

    setReaderTtsPlaying: (isPlayingTts) =>
      set((state) => ({ reader: { ...state.reader, isPlayingTts } })),

    updateMetrics: (newMetrics) =>
      set((state) => ({ metrics: { ...state.metrics, ...newMetrics } })),
  }))
);
