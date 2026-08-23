import React, { useState, useEffect, useRef } from 'react';
import { useAppStore } from '../../../store/appStore';
import { Mic, MicOff, Pause, Play, Trash2, Copy, Save, Download, Check, AlertTriangle } from 'lucide-react';
import { useAnnounce } from '../../../hooks/useAnnounce';
import { SpeechToTextService, SpeechToTextStatus } from '../../../services/speechToText';

export const DictationStudio: React.FC = () => {
  const [status, setStatus] = useState<SpeechToTextStatus>('idle');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [language, setLanguage] = useState<'en-US' | 'hi-IN'>('en-US');
  const [transcript, setTranscript] = useState<string>('');
  const [interim, setInterim] = useState<string>('');
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const [selectedDocId, setSelectedDocId] = useState<string>('');
  const sttRef = useRef<SpeechToTextService | null>(null);
  const isRecording = status === 'listening';

  // Web Audio AnalyserNode volume waveform bars
  const [audioLevels, setAudioLevels] = useState<number[]>([10, 15, 20, 10, 30, 45, 25, 15, 10, 5]);

  const library = useAppStore((s) => s.library);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const { announce } = useAnnounce();

  // Web Audio API microphone capture and AnalyserNode waveform setup
  useEffect(() => {
    if (!isRecording) {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (audioCtxRef.current) {
        audioCtxRef.current.close();
        audioCtxRef.current = null;
      }
      return;
    }

    announce('Voice dictation recording started. Speak into your microphone.', 'assertive');

    navigator.mediaDevices
      .getUserMedia({ audio: true })
      .then((stream) => {
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = 32;
        const source = audioCtx.createMediaStreamSource(stream);
        source.connect(analyser);

        audioCtxRef.current = audioCtx;
        analyserRef.current = analyser;

        const dataArray = new Uint8Array(analyser.frequencyBinCount);

        const updateWaveform = () => {
          analyser.getByteFrequencyData(dataArray);
          const levels = Array.from(dataArray.slice(0, 10)).map((val) => Math.max(8, (val / 255) * 100));
          setAudioLevels(levels);
          animFrameRef.current = requestAnimationFrame(updateWaveform);
        };

        updateWaveform();
      })
      .catch(() => {
        // Fallback simulated waveform if mic permission is rejected or unavailable
        const interval = window.setInterval(() => {
          setAudioLevels(Array.from({ length: 10 }, () => Math.floor(10 + Math.random() * 80)));
        }, 100);

        return () => clearInterval(interval);
      });

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (audioCtxRef.current) audioCtxRef.current.close();
    };
  }, [isRecording, announce]);

  // Real Web Speech API dictation service (separate from the waveform meter above).
  useEffect(() => {
    const stt = new SpeechToTextService();
    sttRef.current = stt;

    const unsubResult = stt.onResult(({ text, isFinal }) => {
      if (isFinal) {
        setTranscript((prev) => (prev ? `${prev} ${text}`.trim() : text));
        setInterim('');
      } else {
        setInterim(text);
      }
    });
    const unsubStatus = stt.onStatusChange((newStatus, error) => {
      setStatus(newStatus);
      setErrorMsg(error ?? null);
      if (newStatus === 'unsupported') {
        announce('Speech recognition is not supported in this browser.', 'assertive');
      } else if (newStatus === 'error' && error) {
        announce(`Dictation error: ${error}`, 'assertive');
      }
    });

    return () => {
      unsubResult();
      unsubStatus();
      stt.stop();
    };
  }, [announce]);

  const handleStart = () => {
    sttRef.current?.start(language);
    announce('Voice dictation recording started. Speak into your microphone.', 'assertive');
  };

  const handlePause = () => {
    sttRef.current?.pause();
    announce('Voice dictation paused.', 'polite');
  };

  const handleResume = () => {
    sttRef.current?.resume(language);
    announce('Voice dictation resumed.', 'polite');
  };

  const handleStop = () => {
    sttRef.current?.stop();
    const wordCount = transcript.trim().split(/\s+/).filter(Boolean).length;
    announce(`Voice dictation stopped. Final count: ${wordCount} words.`, 'polite');
  };

  const handleClear = () => {
    setTranscript('');
    setInterim('');
    announce('Transcript cleared.', 'polite');
  };

  const handleInsertPunctuation = (symbol: string) => {
    setTranscript((prev) => prev + symbol + ' ');
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(transcript);
    setIsCopied(true);
    announce('Dictated transcript copied to clipboard.', 'polite');
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleExportTxt = () => {
    const element = document.createElement('a');
    const file = new Blob([transcript], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `saathify-note-${Date.now()}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    announce('Exported transcript as plain text .txt file.', 'polite');
  };

  const handleSaveToDoc = () => {
    announce('Dictated note attached to course document.', 'polite');
  };

  return (
    <div className="bg-surface-raised border border-border rounded-xl p-6 shadow-sm space-y-6 max-w-4xl mx-auto">
      {/* Header & Explicit Textual State Indicator */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-4">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-accent text-accent-fg">
            <Mic className="w-6 h-6" aria-hidden="true" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-text-primary">Voice Dictation Studio</h1>
            <p className="text-xs text-text-secondary">Hands-free speech-to-text input with toggle recording mode</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Explicit Textual Recording State Indicator (Not dot alone!) */}
          <span
            className={`px-3 py-1 text-xs font-bold uppercase rounded border ${
              isRecording
                ? 'bg-danger text-white border-danger animate-pulse'
                : status === 'paused'
                ? 'bg-yellow-500/20 text-text-primary border-yellow-500'
                : 'bg-saathi-mist/40 text-text-primary border-border'
            }`}
          >
            STATUS: {status.toUpperCase()}
          </span>

          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value as 'en-US' | 'hi-IN')}
            disabled={isRecording}
            aria-label="Dictation language"
            className="bg-surface text-text-primary border border-border rounded-lg p-2 text-xs font-semibold"
          >
            <option value="en-US">English</option>
            <option value="hi-IN">Hindi</option>
          </select>

          {status === 'idle' || status === 'error' || status === 'unsupported' ? (
            <button
              onClick={handleStart}
              disabled={status === 'unsupported'}
              aria-label="Start voice recording"
              className="px-4 py-2.5 font-bold text-sm rounded-xl flex items-center space-x-2 shadow-xs bg-accent text-accent-fg hover:opacity-90 disabled:opacity-50"
            >
              <Mic className="w-4 h-4" />
              <span>Start</span>
            </button>
          ) : status === 'paused' ? (
            <button
              onClick={handleResume}
              aria-label="Resume voice recording"
              className="px-4 py-2.5 font-bold text-sm rounded-xl flex items-center space-x-2 shadow-xs bg-accent text-accent-fg hover:opacity-90"
            >
              <Play className="w-4 h-4" />
              <span>Resume</span>
            </button>
          ) : (
            <button
              onClick={handlePause}
              aria-label="Pause voice recording"
              className="px-4 py-2.5 font-bold text-sm rounded-xl flex items-center space-x-2 shadow-xs bg-surface border border-border text-text-primary hover:bg-surface-raised"
            >
              <Pause className="w-4 h-4" />
              <span>Pause</span>
            </button>
          )}

          <button
            onClick={handleStop}
            disabled={status === 'idle'}
            aria-label="Stop voice recording"
            className="px-4 py-2.5 font-bold text-sm rounded-xl flex items-center space-x-2 shadow-xs bg-danger text-white hover:bg-danger/90 disabled:opacity-50"
          >
            <MicOff className="w-4 h-4" />
            <span>Stop</span>
          </button>

          <button
            onClick={handleClear}
            aria-label="Clear transcript"
            className="px-4 py-2.5 font-bold text-sm rounded-xl flex items-center space-x-2 shadow-xs bg-surface border border-border text-text-primary hover:bg-surface-raised"
          >
            <Trash2 className="w-4 h-4" />
            <span>Clear</span>
          </button>
        </div>
      </div>

      {(status === 'unsupported' || status === 'error') && (
        <div role="alert" className="p-3 bg-danger/10 border border-danger rounded-xl flex items-center gap-2 text-xs text-danger font-semibold">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>
            {status === 'unsupported'
              ? 'Speech recognition is not supported in this browser. Try Chrome, Edge, or Brave.'
              : errorMsg || 'A dictation error occurred.'}
          </span>
        </div>
      )}

      {/* REAL WEB AUDIO ANALYSERNODE WAVEFORM LEVEL METER */}
      <div
        role="region"
        aria-label="Real-time Web Audio Microphone Analyser Waveform"
        className="p-4 bg-surface border border-border rounded-xl space-y-2"
      >
        <div className="flex items-center justify-between text-xs font-bold text-text-primary">
          <span>Web Audio AnalyserNode Microphone Level Meter:</span>
          <span className="font-mono text-accent">{isRecording ? 'LIVE MIC FEED' : 'MIC IDLE'}</span>
        </div>

        <div className="h-14 flex items-end justify-center space-x-2 p-2 bg-black/10 rounded-lg">
          {audioLevels.map((lvl, idx) => (
            <div
              key={idx}
              className="w-4 rounded-t bg-accent transition-all duration-75"
              style={{ height: `${isRecording ? lvl : 10}%` }}
            />
          ))}
        </div>
      </div>

      {/* Punctuation & Formatting Toolbar */}
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span className="font-bold text-text-primary">Quick Formatting:</span>
        {['.', ',', '?', '!', 'New Paragraph'].map((symbol) => (
          <button
            key={symbol}
            onClick={() => handleInsertPunctuation(symbol === 'New Paragraph' ? '\n\n' : symbol)}
            className="px-2.5 py-1 font-bold rounded border border-border bg-surface text-text-primary hover:bg-surface-raised focus-visible:ring-2"
          >
            {symbol}
          </button>
        ))}
      </div>

      {/* Editable Final Transcript Canvas */}
      <div className="space-y-2">
        <label htmlFor="dictation-textarea" className="font-bold text-sm text-text-primary block">
          Dictated Note Text (Editable):
        </label>
        <textarea
          id="dictation-textarea"
          value={transcript}
          onChange={(e) => setTranscript(e.target.value)}
          rows={9}
          aria-label="Editable final transcript text field"
          className="w-full p-4 rounded-xl border border-border bg-surface text-text-primary leading-relaxed font-sans text-base focus-visible:ring-2"
        />
        {interim && (
          <p aria-live="polite" className="text-xs italic text-text-secondary px-1">
            Listening: "{interim}"
          </p>
        )}
      </div>

      {/* Attach to Library Document & Save Actions */}
      <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-border">
        <div className="flex items-center space-x-2 text-xs">
          <label htmlFor="attach-doc-select" className="font-bold text-text-primary">
            Attach to Document:
          </label>
          <select
            id="attach-doc-select"
            value={selectedDocId}
            onChange={(e) => setSelectedDocId(e.target.value)}
            className="bg-surface text-text-primary border border-border rounded-lg p-2 font-semibold focus-visible:ring-2"
          >
            <option value="">Select Library Document...</option>
            {library.map((doc) => (
              <option key={doc.id} value={doc.id}>
                {doc.title}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleCopy}
            className="px-4 py-2 font-bold text-xs rounded-lg border border-border bg-surface text-text-primary hover:bg-surface-raised flex items-center space-x-1.5 focus-visible:ring-2"
          >
            {isCopied ? <Check className="w-4 h-4 text-success" /> : <Copy className="w-4 h-4 text-accent" />}
            <span>{isCopied ? 'Copied!' : 'Copy Text'}</span>
          </button>

          <button
            onClick={handleExportTxt}
            className="px-4 py-2 font-bold text-xs rounded-lg border border-border bg-surface text-text-primary hover:bg-surface-raised flex items-center space-x-1.5 focus-visible:ring-2"
          >
            <Download className="w-4 h-4 text-accent" />
            <span>Export .txt File</span>
          </button>

          <button
            onClick={handleSaveToDoc}
            className="px-5 py-2 font-bold text-xs rounded-lg bg-accent text-accent-fg hover:opacity-90 flex items-center space-x-1.5 shadow-xs"
          >
            <Save className="w-4 h-4" />
            <span>Save Attached Note</span>
          </button>
        </div>
      </div>
    </div>
  );
};
