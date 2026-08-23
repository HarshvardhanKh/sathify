import { useEffect, useRef, useState } from "react";
import type { PipelineEvent } from "../types";

const RECONNECT_DELAY_MS = 1500;

function wsUrl(): string {
  const proto = location.protocol === "https:" ? "wss" : "ws";
  // In dev (vite on 5174) this hits the proxy configured in vite.config.ts;
  // in production (served by FastAPI itself) location.host already IS the backend.
  return `${proto}://${location.host}/ws/live`;
}

export function usePipelineWebSocket(onEvent: (evt: PipelineEvent) => void) {
  const [connected, setConnected] = useState(false);
  const onEventRef = useRef(onEvent);
  onEventRef.current = onEvent;

  useEffect(() => {
    let ws: WebSocket | null = null;
    let closedByUs = false;
    let reconnectTimer: number | undefined;

    function connect() {
      ws = new WebSocket(wsUrl());
      ws.onopen = () => setConnected(true);
      ws.onclose = () => {
        setConnected(false);
        if (!closedByUs) {
          reconnectTimer = window.setTimeout(connect, RECONNECT_DELAY_MS);
        }
      };
      ws.onerror = () => ws?.close();
      ws.onmessage = (msg) => {
        try {
          const evt = JSON.parse(msg.data) as PipelineEvent;
          onEventRef.current(evt);
        } catch (e) {
          console.error("Failed to parse WS event", e);
        }
      };
    }

    connect();
    return () => {
      closedByUs = true;
      if (reconnectTimer) window.clearTimeout(reconnectTimer);
      ws?.close();
    };
  }, []);

  return { connected };
}
