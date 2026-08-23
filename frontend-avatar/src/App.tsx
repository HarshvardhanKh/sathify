import { useCallback, useRef, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { PerspectiveCamera } from "@react-three/drei";
import { Avatar } from "./avatar/Avatar";
import { useAnimationLibrary } from "./avatar/useAnimationLibrary";
import { useAnimationQueue } from "./avatar/AnimationQueue";
import { usePipelineWebSocket } from "./ws/useWebSocket";
import { DebugPanel } from "./components/DebugPanel";
import { ControlBar } from "./components/ControlBar";
import type { AudioDebugInfo, MotionSequence, PipelineEvent, PipelineStatus } from "./types";

/** Deterministic demo sentence (Phase 21) — works without any live audio,
 * exercising the exact same downstream pipeline / WebSocket events. */
const DEMO_TEXT = "Hello everyone, today we are going to learn about artificial intelligence.";

export default function App() {
  const { library } = useAnimationLibrary();
  const { enqueueSequence, state, currentPose, currentLabel, queueLength, expression } = useAnimationQueue(library);

  const [status, setStatus] = useState<PipelineStatus | null>(null);
  const [audioDebug, setAudioDebug] = useState<AudioDebugInfo | null>(null);
  const [transcript, setTranscript] = useState("");
  const [gloss, setGloss] = useState<string[]>([]);
  const [debugVisible, setDebugVisible] = useState(true);
  const latencyRef = useRef<{ transcript?: number; translation?: number; total?: number }>({});
  const [, forceRender] = useState(0);

  const handleEvent = useCallback((evt: PipelineEvent) => {
    switch (evt.type) {
      case "PIPELINE_STATUS":
        setStatus(evt.data as PipelineStatus);
        break;
      case "TRANSCRIPT_UPDATED":
      case "TRANSCRIPT_FINAL":
        setTranscript(evt.data.text ?? "");
        break;
      case "ISL_TRANSLATION":
        setGloss(evt.data.gloss_sequence ?? []);
        break;
      case "MOTION_SEQUENCE":
        // AVATAR_SEQUENCE_READY carries the identical payload — only enqueue
        // once to avoid double-playing every segment.
        enqueueSequence(evt.data as MotionSequence);
        break;
      case "PIPELINE_METRICS": {
        const lastMs = evt.data.last_run_ms ?? {};
        latencyRef.current = { transcript: lastMs.asr, translation: lastMs.translation, total: lastMs.total };
        forceRender((n) => n + 1);
        break;
      }
      case "PIPELINE_ERROR":
        console.error("[PIPELINE_ERROR]", evt.data);
        break;
      default:
        break;
    }
  }, [enqueueSequence]);

  const { connected } = usePipelineWebSocket(handleEvent);

  // Poll the audio debug endpoint while a stream is running (Phase 12).
  const pollAudioDebug = useCallback(() => {
    fetch("/api/debug/audio").then((r) => r.json()).then(setAudioDebug).catch(() => {});
  }, []);

  const onStart = useCallback((mode: "system_audio" | "mock") => {
    fetch("/api/pipeline/start", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mode }),
    }).then(() => {
      const interval = setInterval(pollAudioDebug, 1000);
      (window as any).__audioDebugInterval = interval;
    });
  }, [pollAudioDebug]);

  const onStop = useCallback(() => {
    fetch("/api/pipeline/stop", { method: "POST" });
    if ((window as any).__audioDebugInterval) clearInterval((window as any).__audioDebugInterval);
    setAudioDebug(null);
  }, []);

  const onDemo = useCallback(() => {
    fetch("/api/text/process", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: DEMO_TEXT, language: "auto" }),
    });
  }, []);

  return (
    <div style={{ width: "100vw", height: "100vh", position: "relative", background: "#0f1115" }}>
      <Canvas onDoubleClick={() => setDebugVisible((v) => !v)}>
        <PerspectiveCamera makeDefault position={[0, 0.3, 2.1]} fov={38} />
        <ambientLight intensity={0.7} />
        <directionalLight position={[1, 2, 2]} intensity={0.8} />
        <Avatar pose={currentPose} expression={expression} />
      </Canvas>

      {debugVisible && (
        <DebugPanel
          status={status}
          audioDebug={audioDebug}
          transcript={transcript}
          gloss={gloss}
          currentSign={currentLabel}
          avatarState={state}
          queueLength={queueLength}
          latencyMs={latencyRef.current}
        />
      )}

      <ControlBar
        running={!!status?.running}
        onStart={onStart}
        onStop={onStop}
        onDemo={onDemo}
        connected={connected}
      />
    </div>
  );
}
