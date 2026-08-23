import React from 'react';
import { useAppStore } from '../../../store/appStore';
import { UserCheck, History } from 'lucide-react';

export const IslAvatarView: React.FC = () => {
  const currentIsl = useAppStore((s) => s.isl.current);
  const islHistory = useAppStore((s) => s.isl.history);

  return (
    <div
      role="region"
      aria-label="Indian Sign Language (ISL) Avatar Visualizer"
      className="bg-surface-raised border border-border rounded-xl p-5 shadow-sm flex flex-col h-full space-y-4"
    >
      <div className="flex items-center justify-between border-b border-border pb-3">
        <div className="flex items-center space-x-2">
          <div className="p-1.5 rounded-md bg-accent text-accent-fg">
            <UserCheck className="w-5 h-5" aria-hidden="true" />
          </div>
          <div>
            <h2 className="font-bold text-base text-text-primary">3D ISL Sign Language Avatar</h2>
            <p className="text-xs text-text-secondary">Real-time Indian Sign Language spatial gloss generator</p>
          </div>
        </div>
        <span className="px-2 py-1 text-[11px] font-bold rounded bg-saathi-mist/40 text-text-primary">
          ISL Grammar Standard
        </span>
      </div>

      {/* Visual Avatar Canvas Simulation */}
      <div className="relative w-full aspect-video bg-gradient-to-b from-saathi-ink/90 to-saathi-navy rounded-xl border border-border overflow-hidden flex flex-col items-center justify-center p-6 text-white shadow-inner">
        {/* Animated Avatar Silhouette Graphics */}
        <div className="relative flex flex-col items-center justify-center">
          {/* Head & Face Expression Indicator */}
          <div className="w-20 h-20 rounded-full border-4 border-saathi-sky/60 bg-saathi-navy flex items-center justify-center shadow-lg mb-3">
            <div className="w-12 h-12 rounded-full border-2 border-saathi-sky flex items-center justify-center">
              <span className="text-2xl animate-pulse" aria-hidden="true">😊</span>
            </div>
          </div>
          {/* Spatial Hand Gesture Trails */}
          <div className="flex space-x-12">
            <div className="w-8 h-8 rounded-full bg-saathi-amber/90 border-2 border-white animate-bounce shadow-md flex items-center justify-center text-xs font-black">
              L
            </div>
            <div className="w-8 h-8 rounded-full bg-saathi-amber/90 border-2 border-white animate-bounce shadow-md flex items-center justify-center text-xs font-black" style={{ animationDelay: '150ms' }}>
              R
            </div>
          </div>
        </div>

        {/* Current Active Gloss Overlay */}
        <div className="absolute bottom-3 inset-x-3 bg-black/80 backdrop-blur-md rounded-lg p-3 border border-saathi-sky/30">
          <div className="text-[10px] uppercase tracking-wider font-bold text-saathi-sky mb-1 flex items-center justify-between">
            <span>Active ISL Gloss Sequence</span>
            <span className="text-saathi-amber-text">Spatial Alignment OK</span>
          </div>

          {currentIsl ? (
            <div className="flex flex-wrap gap-1.5">
              {currentIsl.glossTokens.map((token, idx) => (
                <span
                  key={idx}
                  className="px-2 py-1 text-xs font-mono font-black rounded bg-saathi-blue text-white shadow-sm border border-saathi-azure"
                >
                  {token}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-xs italic text-gray-300">
              Awaiting speech stream input... ISL avatar will render gloss signs automatically.
            </p>
          )}
        </div>
      </div>

      {/* Screen Reader Accessible Gloss Transcript */}
      <div className="sr-only" aria-live="polite">
        {currentIsl ? `Current ISL Gloss sequence: ${currentIsl.glossTokens.join(' ')}` : 'No active ISL gloss.'}
      </div>

      {/* Gloss History Logs */}
      <div className="flex-1 flex flex-col min-h-0 pt-2 border-t border-border">
        <div className="flex items-center space-x-2 text-xs font-bold text-text-primary mb-2">
          <History className="w-4 h-4 text-accent" aria-hidden="true" />
          <span>Recent ISL Gloss Sentences ({islHistory.length})</span>
        </div>

        <div className="flex-1 overflow-y-auto space-y-2 pr-1">
          {islHistory.slice(0, 10).map((gloss) => (
            <div key={gloss.id} className="p-2.5 rounded-lg bg-surface border border-border text-xs space-y-1">
              <div className="text-[11px] font-medium text-text-secondary line-clamp-1">{gloss.text}</div>
              <div className="flex flex-wrap gap-1">
                {gloss.glossTokens.map((gt, i) => (
                  <span key={i} className="px-1.5 py-0.5 text-[10px] font-mono font-bold bg-saathi-mist/40 text-text-primary rounded">
                    {gt}
                  </span>
                ))}
              </div>
            </div>
          ))}
          {islHistory.length === 0 && (
            <p className="text-xs text-text-secondary italic py-4 text-center">
              ISL gloss sentence history will populate as the lecture progresses.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
