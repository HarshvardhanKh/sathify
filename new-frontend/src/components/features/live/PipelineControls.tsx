import React from 'react';
import { useAppStore } from '../../../store/appStore';
import { useWebSocket } from '../../../hooks/useWebSocket';
import { Play, Square, RefreshCw } from 'lucide-react';

export const PipelineControls: React.FC = () => {
  const pipelineState = useAppStore((s) => s.pipelineState);
  const setPipelineState = useAppStore((s) => s.setPipelineState);
  const { startSession, stopSession } = useWebSocket();

  const handleStart = () => {
    // Optimistic transition
    setPipelineState('starting');
    try {
      startSession();
    } catch (e) {
      setPipelineState('error', 'Failed to connect to local streaming capture driver.');
    }
  };

  const handleStop = () => {
    setPipelineState('stopping');
    setTimeout(() => {
      stopSession();
    }, 400);
  };

  const handleRestart = () => {
    handleStop();
    setTimeout(() => {
      handleStart();
    }, 800);
  };

  const isIdle = pipelineState === 'idle';
  const isStarting = pipelineState === 'starting';
  const isRunning = pipelineState === 'running';
  const isStopping = pipelineState === 'stopping';

  return (
    <div
      role="region"
      aria-label="Live stream audio capture pipeline controls"
      className="bg-surface-raised border border-border rounded-xl p-5 shadow-xs flex flex-wrap items-center justify-between gap-4"
    >
      <div className="space-y-1">
        <h2 className="text-sm font-extrabold text-text-primary">
          Live stream transcription engine
        </h2>
        <p id="pipeline-status-desc" className="text-xs text-text-secondary">
          Controls the microphone capturing and WebSocket translation pipeline. Current state:{' '}
          <strong className="text-accent uppercase">{pipelineState}</strong>
        </p>
      </div>

      <div className="flex items-center space-x-3 text-xs">
        {/* Start Button */}
        <button
          onClick={handleStart}
          disabled={isRunning || isStarting || isStopping}
          aria-describedby={!isIdle ? 'pipeline-status-desc' : undefined}
          className="px-4 py-2.5 font-bold rounded-lg bg-accent text-accent-fg hover:opacity-90 disabled:opacity-50 transition-opacity flex items-center space-x-2 shadow-xs"
        >
          <Play className="w-4 h-4 fill-current" aria-hidden="true" />
          <span>Start Captioning</span>
        </button>

        {/* Stop Button */}
        <button
          onClick={handleStop}
          disabled={isIdle || isStarting || isStopping}
          aria-describedby={isIdle ? 'pipeline-status-desc' : undefined}
          className="px-4 py-2.5 font-bold rounded-lg bg-danger text-white hover:opacity-90 disabled:opacity-50 transition-opacity flex items-center space-x-2 shadow-xs"
        >
          <Square className="w-4 h-4 fill-current" aria-hidden="true" />
          <span>Stop Stream</span>
        </button>

        {/* Restart Button */}
        <button
          onClick={handleRestart}
          disabled={isStarting || isStopping}
          aria-describedby={isStarting || isStopping ? 'pipeline-status-desc' : undefined}
          className="px-4 py-2.5 font-bold rounded-lg border border-border bg-surface text-text-primary hover:bg-surface-raised disabled:opacity-50 transition-opacity flex items-center space-x-2"
        >
          <RefreshCw className="w-4 h-4" aria-hidden="true" />
          <span>Restart Pipeline</span>
        </button>
      </div>
    </div>
  );
};
