import { useEffect, useState, useCallback, useRef } from 'react';
import { globalSocket, ConnectionState } from '../services/websocket';
import { api } from '../services/api';
import { useAppStore } from '../store/appStore';
import {
  isTranscriptPartialEvent,
  isTranscriptFinalEvent,
  isIslTranslationEvent,
  isSystemStatusEvent,
  isPipelineErrorEvent,
  WebSocketEvent,
} from '../types/events';

// Real backend session id — a random id is enough since this MVP has no
// multi-user session isolation on the backend (a single pipeline instance).
const SESSION_ID = `session-${Math.random().toString(36).slice(2, 10)}`;

export function useWebSocket() {
  const [connectionState, setConnectionState] = useState<ConnectionState>(globalSocket.getState());
  const connectedRef = useRef(false);

  const setTranscriptPartial = useAppStore((s) => s.setTranscriptPartial);
  const addTranscriptFinal = useAppStore((s) => s.addTranscriptFinal);
  const setIslCurrent = useAppStore((s) => s.setIslCurrent);
  const updateStatus = useAppStore((s) => s.updateStatus);
  const setPipelineState = useAppStore((s) => s.setPipelineState);

  useEffect(() => {
    // The real backend is an independent desktop process (per the "must
    // survive tab/window switching" requirement) — the WebSocket connects
    // once when the app mounts and stays connected regardless of which
    // page/component is visible; it is NOT torn down on component unmount.
    if (!connectedRef.current) {
      globalSocket.connect();
      connectedRef.current = true;
    }

    const unsubscribeState = globalSocket.onStateChange((newState) => {
      setConnectionState(newState);
    });

    const unsubscribeEvents = globalSocket.on('*', (event: WebSocketEvent) => {
      if (isTranscriptPartialEvent(event)) {
        setTranscriptPartial(event.data.partialText);
      } else if (isTranscriptFinalEvent(event)) {
        addTranscriptFinal({
          id: event.data.segmentId,
          speaker: event.data.speakerId,
          text: event.data.finalText,
          confidence: event.data.confidence,
          timestamp: event.timestamp,
        });
      } else if (isIslTranslationEvent(event)) {
        setIslCurrent({
          id: `isl-${event.timestamp}`,
          timestamp: event.timestamp,
          text: event.data.originalText,
          glossTokens: event.data.glossTokens,
          grammarNotes: event.data.grammarNotes,
          unknownWords: event.data.unknownWords,
          translationMethod: event.data.translationMethod,
        });
      } else if (isSystemStatusEvent(event)) {
        updateStatus({
          audioActive: event.data.audioActive,
          asrLatencyMs: event.data.asrLatencyMs,
          translatorLagMs: event.data.translatorLagMs,
          avatarFps: event.data.avatarFps,
          cpuUsagePct: event.data.cpuUsagePct,
        });
        // The real backend's PIPELINE_STATUS/SYSTEM_STATUS events are also
        // how we learn the pipeline actually reached "running" — flip
        // optimistic "starting" state to "running" once audio is confirmed active.
        if (event.data.audioActive) {
          setPipelineState('running');
        }
      } else if (isPipelineErrorEvent(event)) {
        setPipelineState('error', event.data.message);
      }
    });

    return () => {
      unsubscribeState();
      unsubscribeEvents();
      // Deliberately NOT calling globalSocket.disconnect() here — per the
      // "must not depend on component focus" requirement, the connection
      // (and the backend pipeline it reflects) outlives this component.
    };
  }, [setTranscriptPartial, addTranscriptFinal, setIslCurrent, updateStatus, setPipelineState]);

  const startSession = useCallback(async () => {
    const result = await api.startPipeline(SESSION_ID);
    if (!result.ok) {
      setPipelineState('error', result.error.message);
    }
    // Actual 'running' transition happens off the SYSTEM_STATUS event above,
    // once the backend confirms audio is really active — not optimistically here.
  }, [setPipelineState]);

  const stopSession = useCallback(async () => {
    const result = await api.stopPipeline(SESSION_ID);
    if (!result.ok) {
      setPipelineState('error', result.error.message);
      return;
    }
    setPipelineState('idle');
  }, [setPipelineState]);

  return {
    connectionState,
    startSession,
    stopSession,
  };
}
