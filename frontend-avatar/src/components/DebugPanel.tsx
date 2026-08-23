import type { AudioDebugInfo, AvatarState, PipelineStatus } from "../types";

interface DebugPanelProps {
  status: PipelineStatus | null;
  audioDebug: AudioDebugInfo | null;
  transcript: string;
  gloss: string[];
  currentSign: string;
  avatarState: AvatarState;
  queueLength: number;
  latencyMs: { transcript?: number; translation?: number; total?: number };
}

const box: React.CSSProperties = {
  position: "absolute", top: 8, left: 8, maxWidth: 280,
  background: "rgba(15,17,21,0.85)", color: "#e6e6e6",
  fontFamily: "ui-monospace, Consolas, monospace", fontSize: 11,
  padding: "8px 10px", borderRadius: 8, lineHeight: 1.5,
  pointerEvents: "none",
};

export function DebugPanel(props: DebugPanelProps) {
  const { status, audioDebug, transcript, gloss, currentSign, avatarState, queueLength, latencyMs } = props;
  return (
    <div style={box}>
      <div>🎤 {status?.audio ?? "idle"} | ASR: {status?.asr ?? "idle"}</div>
      {audioDebug?.name && <div>Device: {audioDebug.backend}/{audioDebug.name}</div>}
      {audioDebug?.current_rms !== undefined && (
        <div>RMS: {audioDebug.current_rms.toFixed(3)} Peak: {audioDebug.current_peak?.toFixed(3)}</div>
      )}
      <div>Transcript: {transcript || "(none)"}</div>
      <div>Gloss: {gloss.join(" ") || "(none)"}</div>
      <div>Sign: {currentSign || "(idle)"}</div>
      <div>Avatar: {avatarState} | Queue: {queueLength}</div>
      <div>
        Latency — ASR: {latencyMs.transcript?.toFixed(0) ?? "-"}ms
        {" "}Translate: {latencyMs.translation?.toFixed(0) ?? "-"}ms
        {" "}Total: {latencyMs.total?.toFixed(0) ?? "-"}ms
      </div>
    </div>
  );
}
