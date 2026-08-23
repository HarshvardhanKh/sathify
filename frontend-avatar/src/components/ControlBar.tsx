interface ControlBarProps {
  running: boolean;
  onStart: (mode: "system_audio" | "mock") => void;
  onStop: () => void;
  onDemo: () => void;
  connected: boolean;
}

const bar: React.CSSProperties = {
  position: "absolute", bottom: 8, left: 8, right: 8,
  display: "flex", gap: 6, flexWrap: "wrap",
  fontFamily: "ui-monospace, Consolas, monospace", fontSize: 11,
};

const btn: React.CSSProperties = {
  background: "#2563eb", color: "white", border: "none", borderRadius: 6,
  padding: "4px 8px", cursor: "pointer", fontSize: 11,
};

export function ControlBar({ running, onStart, onStop, onDemo, connected }: ControlBarProps) {
  return (
    <div style={bar}>
      <button style={btn} onClick={() => onStart("system_audio")} disabled={running}>
        ▶ LIVE AUDIO
      </button>
      <button style={{ ...btn, background: "#dc2626" }} onClick={onStop} disabled={!running}>
        ■ STOP
      </button>
      <button style={{ ...btn, background: "#374151" }} onClick={onDemo}>
        🎬 DEMO
      </button>
      <span style={{ color: connected ? "#4ade80" : "#f87171", alignSelf: "center" }}>
        {connected ? "●" : "○"}
      </span>
    </div>
  );
}
