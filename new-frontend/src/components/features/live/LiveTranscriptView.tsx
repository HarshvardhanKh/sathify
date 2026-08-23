import React, { useRef, useEffect } from 'react';
import { useAppStore } from '../../../store/appStore';
import { useWebSocket } from '../../../hooks/useWebSocket';
import { Play, Square, Trash2, Copy, Mic } from 'lucide-react';

export const LiveTranscriptView: React.FC = () => {
  const partial = useAppStore((s) => s.transcript.partial);
  const finals = useAppStore((s) => s.transcript.finals);
  const clearTranscript = useAppStore((s) => s.clearTranscript);
  const pipelineState = useAppStore((s) => s.pipelineState);

  const { startSession, stopSession } = useWebSocket();
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [partial, finals]);

  const handleCopyText = () => {
    const fullText = finals.map((f) => f.text).join('\n');
    navigator.clipboard.writeText(fullText);
  };

  const isRunning = pipelineState === 'running';

  return (
    <div
      role="region"
      aria-label="Live Automatic Speech Recognition Transcript"
      className="bg-surface-raised border border-border rounded-xl p-5 shadow-sm flex flex-col h-full space-y-4"
    >
      {/* Header & Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3">
        <div className="flex items-center space-x-2">
          <div className="p-1.5 rounded-md bg-saathi-navy text-white">
            <Mic className="w-5 h-5" aria-hidden="true" />
          </div>
          <div>
            <h2 className="font-bold text-base text-text-primary">Live Lecture Transcript</h2>
            <p className="text-xs text-text-secondary">Word-by-word ASR feed with speaker diarization</p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={isRunning ? stopSession : startSession}
            aria-label={isRunning ? 'Stop live lecture stream (Alt+S)' : 'Start live lecture stream (Alt+S)'}
            className={`px-4 py-2 font-bold text-sm rounded-lg flex items-center space-x-2 shadow-xs transition-colors ${
              isRunning
                ? 'bg-danger text-white hover:bg-danger/90'
                : 'bg-accent text-accent-fg hover:opacity-90'
            }`}
          >
            {isRunning ? (
              <>
                <Square className="w-4 h-4 fill-current" aria-hidden="true" />
                <span>Stop Stream</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-current" aria-hidden="true" />
                <span>Start Stream</span>
              </>
            )}
          </button>

          <button
            onClick={handleCopyText}
            disabled={finals.length === 0}
            aria-label="Copy transcript text to clipboard"
            className="p-2 border border-border rounded-lg bg-surface text-text-primary hover:bg-surface-raised disabled:opacity-40 focus-visible:ring-2"
            title="Copy Full Transcript"
          >
            <Copy className="w-4 h-4" aria-hidden="true" />
          </button>

          <button
            onClick={clearTranscript}
            disabled={finals.length === 0 && !partial}
            aria-label="Clear all transcript entries"
            className="p-2 border border-border rounded-lg bg-surface text-text-primary hover:bg-surface-raised disabled:opacity-40 focus-visible:ring-2"
            title="Clear Transcript"
          >
            <Trash2 className="w-4 h-4 text-danger" aria-hidden="true" />
          </button>
        </div>
      </div>

      {/* Transcript Scrolling Display */}
      <div
        tabIndex={0}
        aria-label="Transcript output area. Use arrow keys to scroll through spoken text."
        className="flex-1 overflow-y-auto bg-surface border border-border rounded-lg p-4 space-y-3 font-sans text-sm min-h-[300px] focus-visible:ring-2"
      >
        {finals.length === 0 && !partial && (
          <div className="h-full flex flex-col items-center justify-center text-center text-text-secondary py-12 space-y-2">
            <Mic className="w-10 h-10 text-border" aria-hidden="true" />
            <p className="font-semibold text-base">Lecture Audio Stream Inactive</p>
            <p className="text-xs max-w-sm">
              Click <strong className="text-text-primary">Start Stream</strong> or press <kbd className="px-1 font-mono border border-border rounded">Alt+S</kbd> to begin receiving real-time lecture transcription and ISL translation.
            </p>
          </div>
        )}

        {/* Committed Sentence Finals */}
        {finals.slice().reverse().map((item) => (
          <div key={item.id} className="p-3 rounded-lg bg-surface-raised/60 border border-border/60 space-y-1">
            <div className="flex items-center justify-between text-xs text-text-secondary">
              <span className="font-bold text-accent">{item.speaker}</span>
              <span className="font-mono text-[10px]">
                {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </span>
            </div>
            <p className="text-text-primary font-medium leading-relaxed">{item.text}</p>
          </div>
        ))}

        {/* Real-time Partial Word Stream */}
        {partial && (
          <div className="p-3 rounded-lg bg-saathi-mist/20 border border-saathi-azure/40 space-y-1 animate-pulse">
            <div className="text-xs font-bold text-saathi-azure flex items-center space-x-1">
              <span>Streaming...</span>
            </div>
            <p className="text-text-primary font-semibold leading-relaxed">{partial}</p>
          </div>
        )}

        <div ref={bottomRef} />
      </div>
    </div>
  );
};
