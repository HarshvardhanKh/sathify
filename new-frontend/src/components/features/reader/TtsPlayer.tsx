import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useAppStore } from '../../../store/appStore';
import { Play, Pause, SkipBack, SkipForward, Gauge, Volume2, VolumeX } from 'lucide-react';
import { useAnnounce } from '../../../hooks/useAnnounce';

interface TtsPlayerProps {
  blockIds: string[];
}

export const TtsPlayer: React.FC<TtsPlayerProps> = ({ blockIds }) => {
  const isPlayingTts = useAppStore((s) => s.reader.isPlayingTts);
  const setReaderTtsPlaying = useAppStore((s) => s.setReaderTtsPlaying);
  const setReaderActiveBlockId = useAppStore((s) => s.setReaderActiveBlockId);
  const profile = useAppStore((s) => s.profile);
  const setProfile = useAppStore((s) => s.setProfile);

  const [currentBlockIndex, setCurrentBlockIndex] = useState(0);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [ttsSupported, setTtsSupported] = useState(true);
  const speakingRef = useRef(false);
  const { announce } = useAnnounce();

  // Check TTS support
  useEffect(() => {
    setTtsSupported('speechSynthesis' in window);
  }, []);

  // Get text content of a block by ID
  const getBlockText = useCallback((blockId: string): string => {
    const el = document.getElementById(blockId);
    return el?.textContent || '';
  }, []);

  // Speak a specific block
  const speakBlock = useCallback((index: number) => {
    if (!ttsSupported || index < 0 || index >= blockIds.length) return;

    const blockId = blockIds[index];
    if (!blockId) return;

    const text = getBlockText(blockId);
    if (!text.trim()) {
      // Skip empty blocks - auto advance
      if (index < blockIds.length - 1) {
        setTimeout(() => setCurrentBlockIndex(index + 1), 100);
      }
      return;
    }

    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = profile.ttsSpeed;
    utterance.lang = 'en-US';

    utterance.onstart = () => {
      setIsSpeaking(true);
      speakingRef.current = true;
      setReaderActiveBlockId(blockId);
      // Scroll block into view
      const el = document.getElementById(blockId);
      el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    };

    utterance.onend = () => {
      setIsSpeaking(false);
      speakingRef.current = false;
      // Auto-advance to next block if still in play mode
      if (index < blockIds.length - 1) {
        // Check if we're still supposed to be playing
        setTimeout(() => {
          const store = useAppStore.getState();
          if (store.reader.isPlayingTts) {
            setCurrentBlockIndex(index + 1);
          }
        }, 200);
      } else {
        // Reached end of document
        setReaderTtsPlaying(false);
        announce('Finished reading document', 'polite');
      }
    };

    utterance.onerror = (e) => {
      console.error('TTS error:', e);
      setIsSpeaking(false);
      speakingRef.current = false;
    };

    window.speechSynthesis.speak(utterance);
  }, [ttsSupported, blockIds, getBlockText, profile.ttsSpeed, setReaderActiveBlockId, setReaderTtsPlaying, announce]);

  // Start/stop based on isPlayingTts state
  useEffect(() => {
    if (isPlayingTts && ttsSupported) {
      announce('Reading document aloud', 'polite');
      speakBlock(currentBlockIndex);
    } else {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      speakingRef.current = false;
    }

    return () => {
      window.speechSynthesis.cancel();
    };
  }, [isPlayingTts, ttsSupported]);

  // When currentBlockIndex changes and we're playing, speak the new block
  useEffect(() => {
    const store = useAppStore.getState();
    if (store.reader.isPlayingTts && ttsSupported && !speakingRef.current) {
      speakBlock(currentBlockIndex);
    }
  }, [currentBlockIndex, ttsSupported, speakBlock]);

  const handlePlayPause = () => {
    if (isPlayingTts) {
      setReaderTtsPlaying(false);
      window.speechSynthesis.cancel();
      announce('Paused reading', 'polite');
    } else {
      setReaderTtsPlaying(true);
    }
  };

  const handleNext = () => {
    window.speechSynthesis.cancel();
    speakingRef.current = false;
    const nextIndex = Math.min(blockIds.length - 1, currentBlockIndex + 1);
    setCurrentBlockIndex(nextIndex);
    if (isPlayingTts) {
      setTimeout(() => speakBlock(nextIndex), 100);
    }
  };

  const handlePrev = () => {
    window.speechSynthesis.cancel();
    speakingRef.current = false;
    const prevIndex = Math.max(0, currentBlockIndex - 1);
    setCurrentBlockIndex(prevIndex);
    if (isPlayingTts) {
      setTimeout(() => speakBlock(prevIndex), 100);
    }
  };

  const handleSpeedChange = (speed: number) => {
    setProfile({ ttsSpeed: speed });
    announce(`Speech rate set to ${speed}x`, 'polite');
    // If currently speaking, restart with new speed
    if (isPlayingTts) {
      window.speechSynthesis.cancel();
      speakingRef.current = false;
      setTimeout(() => speakBlock(currentBlockIndex), 100);
    }
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT' || target.isContentEditable)) {
        return;
      }

      if (e.key === 'ArrowLeft') {
        if (e.shiftKey) {
          e.preventDefault();
          const newSpeed = Math.max(0.5, profile.ttsSpeed - 0.25);
          handleSpeedChange(newSpeed);
        } else {
          e.preventDefault();
          handlePrev();
        }
      } else if (e.key === 'ArrowRight') {
        if (e.shiftKey) {
          e.preventDefault();
          const newSpeed = Math.min(2.0, profile.ttsSpeed + 0.25);
          handleSpeedChange(newSpeed);
        } else {
          e.preventDefault();
          handleNext();
        }
      } else if (e.key === ' ' && !e.shiftKey) {
        e.preventDefault();
        handlePlayPause();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [profile.ttsSpeed, isPlayingTts, currentBlockIndex]);

  if (!ttsSupported) {
    return (
      <div className="sticky bottom-0 z-40 w-full bg-surface-raised/95 backdrop-blur border-t-2 border-danger p-3">
        <div className="max-w-5xl mx-auto flex items-center gap-2 text-xs text-danger">
          <VolumeX className="w-4 h-4" />
          <span>Text-to-Speech is not supported in this browser. Try Chrome or Edge.</span>
        </div>
      </div>
    );
  }

  return (
    <div
      role="region"
      aria-label="Text-to-Speech Reader"
      className="sticky bottom-0 z-40 w-full bg-surface-raised/95 backdrop-blur border-t-2 border-accent p-3 shadow-xl"
    >
      <div className="max-w-5xl mx-auto flex flex-wrap items-center justify-between gap-4 text-xs">
        {/* Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrev}
            disabled={currentBlockIndex === 0}
            aria-label="Previous section (Left Arrow)"
            className="p-2 rounded-lg border border-border bg-surface text-text-primary hover:bg-surface-raised disabled:opacity-50 focus-visible:ring-2"
          >
            <SkipBack className="w-4 h-4" />
          </button>

          <button
            onClick={handlePlayPause}
            aria-label={isPlayingTts ? 'Pause reading (Space)' : 'Start reading aloud (Space)'}
            className={`px-4 py-2 font-bold rounded-lg flex items-center gap-2 shadow-xs ${
              isPlayingTts
                ? 'bg-warning text-white'
                : 'bg-accent text-accent-fg hover:opacity-90'
            }`}
          >
            {isPlayingTts ? (
              <>
                <Pause className="w-4 h-4" />
                <span>Pause</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4" />
                <span>Read Aloud</span>
              </>
            )}
          </button>

          <button
            onClick={handleNext}
            disabled={currentBlockIndex >= blockIds.length - 1}
            aria-label="Next section (Right Arrow)"
            className="p-2 rounded-lg border border-border bg-surface text-text-primary hover:bg-surface-raised disabled:opacity-50 focus-visible:ring-2"
          >
            <SkipForward className="w-4 h-4" />
          </button>
        </div>

        {/* Progress */}
        <div className="flex-1 min-w-[150px] flex items-center gap-3">
          <Volume2 className="w-4 h-4 text-accent" />
          <div className="flex-1 h-2 bg-border rounded-full overflow-hidden">
            <div
              className="h-full bg-accent transition-all duration-300"
              style={{ width: `${((currentBlockIndex + 1) / Math.max(1, blockIds.length)) * 100}%` }}
            />
          </div>
          <span className="font-bold text-text-secondary whitespace-nowrap">
            {currentBlockIndex + 1} / {blockIds.length}
          </span>
        </div>

        {/* Speed */}
        <div className="flex items-center gap-2">
          <Gauge className="w-4 h-4 text-accent" />
          <span className="font-bold text-text-primary">Speed:</span>
          <select
            value={profile.ttsSpeed}
            onChange={(e) => handleSpeedChange(parseFloat(e.target.value))}
            className="bg-surface text-text-primary border border-border rounded px-2 py-1 font-bold focus-visible:ring-2"
          >
            <option value={0.75}>0.75x</option>
            <option value={1.0}>1.0x</option>
            <option value={1.25}>1.25x</option>
            <option value={1.5}>1.5x</option>
            <option value={2.0}>2.0x</option>
          </select>
        </div>

        {/* Status */}
        {isSpeaking && (
          <span className="px-2 py-1 bg-accent/20 text-accent rounded text-xs font-bold animate-pulse">
            Speaking...
          </span>
        )}
      </div>
    </div>
  );
};
