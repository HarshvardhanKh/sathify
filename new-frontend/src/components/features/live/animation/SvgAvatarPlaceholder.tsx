import React from 'react';

interface SvgAvatarPlaceholderProps {
  currentSign: string;
  isPlaying: boolean;
  isSkipping: boolean;
  queueDepth: number;
}

export const SvgAvatarPlaceholder: React.FC<SvgAvatarPlaceholderProps> = ({
  currentSign,
  isPlaying,
  isSkipping,
  queueDepth,
}) => {
  return (
    <div className="relative w-full aspect-video bg-gradient-to-b from-saathi-ink to-saathi-navy border border-border rounded-2xl flex flex-col items-center justify-center p-6 text-white overflow-hidden shadow-inner">
      
      {/* Draggable container region option for Electron preloads */}
      <div className="absolute top-2 left-2 flex items-center space-x-2 text-[10px] font-bold text-saathi-sky uppercase tracking-wider">
        <span className="w-2 h-2 rounded-full bg-saathi-sky animate-ping" />
        <span>Indian Sign Language (ISL) Pipeline</span>
      </div>

      {/* Skipping warning overlay */}
      {isSkipping && (
        <div 
          role="alert" 
          className="absolute top-8 inset-x-4 bg-danger/90 border border-white/20 p-2.5 rounded-lg text-center text-xs font-bold text-white shadow-lg animate-pulse"
        >
          Warning: Audio buffer backlog detected. Skipping ahead to remain synchronized with lecture stream.
        </div>
      )}

      {/* SVG Avatar Representation */}
      <svg
        viewBox="0 0 100 80"
        className="w-32 h-32 text-saathi-sky transition-transform duration-200"
        aria-hidden="true"
      >
        {/* Head */}
        <circle cx="50" cy="22" r="10" className="fill-saathi-navy stroke-current stroke-2" />
        {/* Face markers for expressions */}
        <path d="M 47 24 Q 50 27 53 24" className="stroke-current stroke-2 fill-none" />
        {/* Upper Torso */}
        <path
          d="M 25 65 Q 50 45 75 65"
          className="fill-saathi-navy stroke-current stroke-2"
        />
        {/* Active Hand Gesture Paths */}
        {isPlaying ? (
          <>
            <circle cx="28" cy="48" r="4" className="fill-saathi-amber animate-bounce" />
            <circle cx="72" cy="48" r="4" className="fill-saathi-amber animate-bounce" style={{ animationDelay: '100ms' }} />
          </>
        ) : (
          <>
            <circle cx="32" cy="58" r="4" className="fill-saathi-sky/40 stroke-current stroke-1" />
            <circle cx="68" cy="58" r="4" className="fill-saathi-sky/40 stroke-current stroke-1" />
          </>
        )}
      </svg>

      {/* Active Gloss Label with clean transparent backdrop overlay */}
      <div className="absolute bottom-4 inset-x-4 bg-black/75 border border-saathi-sky/30 backdrop-blur rounded-xl p-3 flex items-center justify-between">
        <div className="space-y-0.5">
          <span className="text-[10px] text-saathi-sky font-bold uppercase tracking-wider block">
            Current Active Sign
          </span>
          <span className="text-base font-mono font-black tracking-tight text-white block">
            {currentSign}
          </span>
        </div>

        <div className="text-right">
          <span className="text-[10px] text-text-secondary font-bold block">
            Queue Size
          </span>
          <span className="text-xs font-mono font-bold text-saathi-sky block">
            {queueDepth} pending
          </span>
        </div>
      </div>
    </div>
  );
};
export default SvgAvatarPlaceholder;
