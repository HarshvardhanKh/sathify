import React, { useRef, useEffect, useState } from 'react';
import { useAppStore } from '../../../store/appStore';
import { ArrowDown, MessageSquare } from 'lucide-react';

export const LiveCaptionView: React.FC = () => {
  const partial = useAppStore((s) => s.transcript.partial);
  const finals = useAppStore((s) => s.transcript.finals);
  const profile = useAppStore((s) => s.profile);

  const containerRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const [userScrolledUp, setUserScrolledUp] = useState<boolean>(false);

  // Auto scroll logic
  useEffect(() => {
    if (!userScrolledUp) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [partial, finals, userScrolledUp]);

  const handleScroll = () => {
    const el = containerRef.current;
    if (!el) return;
    // Check if scrolled away from bottom by more than 40px
    const isAtBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 40;
    setUserScrolledUp(!isAtBottom);
  };

  const handleJumpToLive = () => {
    setUserScrolledUp(false);
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div
      role="region"
      aria-label="Real-time lecture caption feed"
      className="bg-surface-raised border border-border rounded-xl p-5 shadow-xs flex flex-col h-[400px] relative overflow-hidden"
    >
      <div className="flex items-center space-x-2 border-b border-border pb-3 mb-3">
        <MessageSquare className="w-5 h-5 text-accent" aria-hidden="true" />
        <h2 className="text-sm font-extrabold text-text-primary uppercase tracking-wider">
          Live Lecture Captions
        </h2>
      </div>

      {/* Captions Output Window */}
      <div
        ref={containerRef}
        onScroll={handleScroll}
        tabIndex={0}
        aria-label="Captions transcript history. Use arrow keys to scroll."
        className="flex-1 overflow-y-auto bg-surface border border-border rounded-lg p-4 space-y-3 focus-visible:ring-2"
        style={{
          maxHeight: '100%',
        }}
      >
        {/* SEMANTIC ACCESSIBLE HISTORY (ARIA-LIVE FOR FINALS ONLY) */}
        <div
          id="accessible-finals-container"
          role="status"
          aria-live="polite"
          aria-atomic="false"
          className="space-y-3 font-sans"
        >
          {finals.map((item) => (
            <div
              key={item.id}
              className="p-3 rounded-lg bg-surface-raised border border-border/40 font-bold leading-relaxed text-text-primary"
              style={{
                fontSize: profile.fontScale === 1 ? '14px' : `${profile.fontScale * 14}px`,
              }}
            >
              {item.text}
            </div>
          ))}
        </div>

        {/* IN-FLIGHT PARTIAL STREAM (ARIA-HIDDEN TO PREVENT STUTTERING) */}
        {partial && (
          <div
            aria-hidden="true"
            className="p-3 rounded-lg bg-saathi-mist/20 border border-saathi-azure/40 font-bold leading-relaxed text-text-primary/70 italic flex items-center space-x-1"
            style={{
              fontSize: profile.fontScale === 1 ? '14px' : `${profile.fontScale * 14}px`,
            }}
          >
            <span>{partial}</span>
            <span className="w-1.5 h-4 bg-accent animate-pulse inline-block" />
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Sticky Jump to Live Pill */}
      {userScrolledUp && (
        <button
          onClick={handleJumpToLive}
          className="absolute bottom-6 left-1/2 -translate-x-1/2 px-4 py-2 bg-accent text-accent-fg text-xs font-bold rounded-full shadow-lg border border-white/20 flex items-center space-x-1.5 hover:opacity-95"
        >
          <ArrowDown className="w-3.5 h-3.5" />
          <span>Jump to live captions</span>
        </button>
      )}
    </div>
  );
};
export default LiveCaptionView;
