import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { PerspectiveCamera } from '@react-three/drei';
import { Avatar } from '../../avatar/Avatar';
import { useAnimationLibrary } from '../../avatar/useAnimationLibrary';
import { useAnimationQueue } from '../../avatar/AnimationQueue';
import type { MotionSequence } from '../../avatar/types';
import { Radio, Play, Square, Wifi, WifiOff, Volume2, Subtitles } from 'lucide-react';
import { useAnnounce } from '../../hooks/useAnnounce';

const DEMO_TEXT = 'Hello everyone, today we are going to learn about artificial intelligence.';

export const LiveSession: React.FC = () => {
  const { library, loaded } = useAnimationLibrary();
  const { enqueueSequence, state, currentPose, currentLabel, queueLength, expression } = useAnimationQueue(library);

  const [connected, setConnected] = useState(false);
  const [running, setRunning] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [gloss, setGloss] = useState<string[]>([]);
  const [latency, setLatency] = useState<{ asr?: number; total?: number }>({});
  const wsRef = useRef<WebSocket | null>(null);
  const { announce } = useAnnounce();

  // WebSocket connection to real backend
  useEffect(() => {
    let ws: WebSocket | null = null;
    let reconnectTimer: number | undefined;
    let closedByUs = false;

    function connect() {
      ws = new WebSocket('ws://localhost:8000/ws/live');
      ws.onopen = () => {
        setConnected(true);
        announce('Connected to ISL backend', 'polite');
      };
      ws.onclose = () => {
        setConnected(false);
        if (!closedByUs) {
          reconnectTimer = window.setTimeout(connect, 2000);
        }
      };
      ws.onerror = () => ws?.close();
      ws.onmessage = (msg) => {
        try {
          const evt = JSON.parse(msg.data);
          handleEvent(evt);
        } catch {
          // ignore malformed
        }
      };
      wsRef.current = ws;
    }

    connect();
    return () => {
      closedByUs = true;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      ws?.close();
    };
  }, [announce]);

  const handleEvent = useCallback(
    (evt: { type: string; data: any }) => {
      switch (evt.type) {
        case 'PIPELINE_STATUS':
        case 'SYSTEM_STATUS':
          if (evt.data.running !== undefined) setRunning(evt.data.running);
          if (evt.data.audioActive !== undefined) setRunning(evt.data.audioActive);
          break;
        case 'TRANSCRIPT_UPDATED':
        case 'TRANSCRIPT_FINAL':
        case 'TRANSCRIPT_PARTIAL':
          setTranscript(evt.data.text ?? evt.data.finalText ?? evt.data.partialText ?? '');
          break;
        case 'ISL_TRANSLATION':
          setGloss(evt.data.gloss_sequence ?? evt.data.glossTokens ?? []);
          break;
        case 'MOTION_SEQUENCE':
          enqueueSequence(evt.data as MotionSequence);
          break;
        case 'PIPELINE_METRICS':
          setLatency({ asr: evt.data.last_run_ms?.asr, total: evt.data.last_run_ms?.total });
          break;
      }
    },
    [enqueueSequence]
  );

  const handleStart = async () => {
    announce('Starting live ISL translation...', 'assertive');
    await fetch('http://localhost:8000/api/pipeline/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mode: 'system_audio' }),
    });
  };

  const handleStop = async () => {
    announce('Stopping live ISL translation', 'polite');
    await fetch('http://localhost:8000/api/pipeline/stop', { method: 'POST' });
    setRunning(false);
  };

  const handleDemo = async () => {
    announce('Playing demo sentence', 'polite');
    await fetch('http://localhost:8000/api/text/process', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: DEMO_TEXT, language: 'auto' }),
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-accent text-accent-fg">
            <Radio className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-text-primary">Live ISL Avatar</h1>
            <p className="text-xs text-text-secondary">Real-time speech to Indian Sign Language translation</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span
            className={`px-3 py-1.5 text-xs font-bold rounded-lg flex items-center gap-1.5 ${
              connected ? 'bg-success/20 text-success' : 'bg-danger/20 text-danger'
            }`}
          >
            {connected ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
            {connected ? 'Connected' : 'Disconnected'}
          </span>
        </div>
      </div>

      {/* Main content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Avatar Canvas */}
        <div className="lg:col-span-2 bg-gradient-to-b from-slate-900 to-slate-800 rounded-2xl overflow-hidden border border-border shadow-lg aspect-video relative">
          {loaded ? (
            <Canvas>
              <PerspectiveCamera makeDefault position={[0, 0.3, 2.1]} fov={38} />
              <ambientLight intensity={0.7} />
              <directionalLight position={[1, 2, 2]} intensity={0.8} />
              <Avatar pose={currentPose} expression={expression} />
            </Canvas>
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-white/60">Loading avatar...</div>
          )}

          {/* Current sign label overlay */}
          {currentLabel && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 bg-black/70 rounded-lg text-white font-bold text-lg">
              {currentLabel}
            </div>
          )}

          {/* Status overlay */}
          <div className="absolute top-4 left-4 flex items-center gap-2">
            <span
              className={`px-2 py-1 text-xs font-bold rounded ${
                running ? 'bg-red-500 text-white animate-pulse' : 'bg-gray-700 text-gray-300'
              }`}
            >
              {running ? 'LIVE' : 'IDLE'}
            </span>
            {state === 'PLAYING_SIGN' && <span className="px-2 py-1 text-xs bg-accent text-accent-fg rounded">Signing</span>}
            {queueLength > 0 && <span className="px-2 py-1 text-xs bg-blue-600 text-white rounded">Queue: {queueLength}</span>}
          </div>
        </div>

        {/* Controls & Info Panel */}
        <div className="space-y-4">
          {/* Controls */}
          <div className="bg-surface-raised border border-border rounded-xl p-4 space-y-3">
            <h2 className="text-sm font-bold text-text-primary flex items-center gap-2">
              <Volume2 className="w-4 h-4 text-accent" /> Audio Source Controls
            </h2>

            <div className="flex flex-col gap-2">
              {!running ? (
                <button
                  onClick={handleStart}
                  disabled={!connected}
                  className="w-full px-4 py-3 font-bold text-sm rounded-xl bg-accent text-accent-fg hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <Play className="w-4 h-4" /> Start Live Capture
                </button>
              ) : (
                <button
                  onClick={handleStop}
                  className="w-full px-4 py-3 font-bold text-sm rounded-xl bg-danger text-white hover:bg-danger/90 flex items-center justify-center gap-2"
                >
                  <Square className="w-4 h-4" /> Stop Capture
                </button>
              )}

              <button
                onClick={handleDemo}
                disabled={!connected}
                className="w-full px-4 py-2.5 font-bold text-xs rounded-xl border border-border bg-surface text-text-primary hover:bg-surface-raised disabled:opacity-50"
              >
                Demo Sentence
              </button>
            </div>

            <p className="text-xs text-text-secondary">
              Captures Windows system audio (WASAPI loopback) — any video, meeting, or lecture playing on your computer will be
              transcribed and translated to ISL.
            </p>
          </div>

          {/* Transcript */}
          <div className="bg-surface-raised border border-border rounded-xl p-4 space-y-2">
            <h2 className="text-sm font-bold text-text-primary flex items-center gap-2">
              <Subtitles className="w-4 h-4 text-accent" /> Live Transcript
            </h2>
            <div className="min-h-[80px] p-3 bg-surface border border-border rounded-lg text-sm text-text-primary">
              {transcript || <span className="text-text-secondary italic">Waiting for speech...</span>}
            </div>
          </div>

          {/* ISL Gloss */}
          <div className="bg-surface-raised border border-border rounded-xl p-4 space-y-2">
            <h2 className="text-sm font-bold text-text-primary">ISL Gloss Tokens</h2>
            <div className="flex flex-wrap gap-1.5">
              {gloss.length > 0 ? (
                gloss.map((g, i) => (
                  <span key={i} className="px-2 py-1 text-xs font-mono bg-accent/20 text-accent border border-accent/30 rounded">
                    {g}
                  </span>
                ))
              ) : (
                <span className="text-xs text-text-secondary italic">No translation yet</span>
              )}
            </div>
          </div>

          {/* Latency */}
          {(latency.asr || latency.total) && (
            <div className="text-xs text-text-secondary flex gap-4">
              {latency.asr && <span>ASR: {latency.asr.toFixed(0)}ms</span>}
              {latency.total && <span>Total: {latency.total.toFixed(0)}ms</span>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LiveSession;
