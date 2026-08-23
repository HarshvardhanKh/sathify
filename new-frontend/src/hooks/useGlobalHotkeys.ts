import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store/appStore';
import { useWebSocket } from './useWebSocket';

export interface HotkeyDefinition {
  keyCombo: string;
  actionName: string;
  description: string;
  category: 'Navigation' | 'Playback' | 'Session' | 'Accessibility';
}

export const HOTKEY_DEFINITIONS: HotkeyDefinition[] = [
  { keyCombo: 'Alt + 1', actionName: 'Go to Dashboard', description: 'Jump to student dashboard overview', category: 'Navigation' },
  { keyCombo: 'Alt + 2', actionName: 'Go to Library', description: 'Jump to converted documents library', category: 'Navigation' },
  { keyCombo: 'Alt + 3', actionName: 'Go to Live Lecture', description: 'Jump to live ISL transcription studio', category: 'Navigation' },
  { keyCombo: 'Alt + 4', actionName: 'Go to Voice Dictate', description: 'Jump to voice dictation studio', category: 'Navigation' },
  { keyCombo: 'Alt + 5', actionName: 'Go to Settings', description: 'Jump to accessibility settings', category: 'Navigation' },
  { keyCombo: 'Space', actionName: 'Play / Pause TTS', description: 'Toggle Text-to-Speech playback when reader focused', category: 'Playback' },
  { keyCombo: 'Alt + S', actionName: 'Start / Stop Live Session', description: 'Toggle live lecture transcription stream', category: 'Session' },
  { keyCombo: 'Alt + C', actionName: 'Cycle Complexity', description: 'Switch between Original, Simplified, and Essential text', category: 'Accessibility' },
  { keyCombo: 'Alt + T', actionName: 'Cycle Theme', description: 'Cycle Default, Dark, High-Contrast, and Warm Low-Glare', category: 'Accessibility' },
  { keyCombo: 'Shift + ?', actionName: 'Keyboard Shortcuts Sheet', description: 'Open accessible hotkeys overview dialog', category: 'Accessibility' },
];

export function useGlobalHotkeys() {
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const profile = useAppStore((s) => s.profile);
  const setTheme = useAppStore((s) => s.setTheme);
  const readerComplexity = useAppStore((s) => s.reader.complexity);
  const setReaderComplexity = useAppStore((s) => s.setReaderComplexity);
  const isPlayingTts = useAppStore((s) => s.reader.isPlayingTts);
  const setReaderTtsPlaying = useAppStore((s) => s.setReaderTtsPlaying);
  const pipelineState = useAppStore((s) => s.pipelineState);
  const setPipelineState = useAppStore((s) => s.setPipelineState);
  const { startSession, stopSession } = useWebSocket();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Suppress if focus is in text input
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable)
      ) {
        return;
      }

      // Alt + 1..5 Section Jump
      if (e.altKey && !e.ctrlKey && !e.shiftKey) {
        if (e.key === '1') {
          e.preventDefault();
          navigate('/dashboard');
          return;
        }
        if (e.key === '2') {
          e.preventDefault();
          navigate('/library');
          return;
        }
        if (e.key === '3') {
          e.preventDefault();
          navigate('/live');
          return;
        }
        if (e.key === '4') {
          e.preventDefault();
          navigate('/dictate');
          return;
        }
        if (e.key === '5') {
          e.preventDefault();
          navigate('/settings');
          return;
        }
        // Alt + S Live Session toggle
        if (e.key.toLowerCase() === 's') {
          e.preventDefault();
          if (pipelineState === 'running') {
            setPipelineState('stopping');
            stopSession();
          } else {
            setPipelineState('starting');
            startSession();
          }
          return;
        }
        // Alt + C Cycle Complexity
        if (e.key.toLowerCase() === 'c') {
          e.preventDefault();
          const levels: ('original' | 'simplified' | 'essential')[] = ['original', 'simplified', 'essential'];
          const currentIdx = levels.indexOf(readerComplexity);
          const nextIdx = (currentIdx + 1) % levels.length;
          const nextLevel = levels[nextIdx] ?? 'original';
          setReaderComplexity(nextLevel);
          return;
        }
        // Alt + T Cycle Theme
        if (e.key.toLowerCase() === 't') {
          e.preventDefault();
          const themes: ('default' | 'dark' | 'high-contrast' | 'warm-low-glare')[] = [
            'default',
            'dark',
            'high-contrast',
            'warm-low-glare',
          ];
          const currentIdx = themes.indexOf(profile.theme);
          const nextIdx = (currentIdx + 1) % themes.length;
          const nextTheme = themes[nextIdx] ?? 'default';
          setTheme(nextTheme);
          return;
        }
      }

      // Space key for TTS Play/Pause (if active reader region or container is focused)
      if (e.code === 'Space' && (target?.id === 'document-reader-container' || target?.closest('#document-reader-container'))) {
        e.preventDefault();
        setReaderTtsPlaying(!isPlayingTts);
        return;
      }

      // ? Key for Shortcut Modal
      if (e.key === '?' || (e.shiftKey && e.key === '/')) {
        e.preventDefault();
        setIsModalOpen((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    navigate,
    profile.theme,
    readerComplexity,
    isPlayingTts,
    pipelineState,
    setTheme,
    setReaderComplexity,
    setReaderTtsPlaying,
    setPipelineState,
    startSession,
    stopSession,
  ]);

  return {
    isModalOpen,
    closeModal: () => setIsModalOpen(false),
    openModal: () => setIsModalOpen(true),
    hotkeys: HOTKEY_DEFINITIONS,
  };
}
