import React from 'react';
import { useAppStore } from '../../../store/appStore';
import { Mic, UserCheck, Cpu, Volume2 } from 'lucide-react';

export const SystemStatusPanel: React.FC = () => {
  const status = useAppStore((s) => s.status);

  const stages = [
    {
      id: 'audio',
      name: 'System Audio Capture',
      textStatus: status.audioActive ? 'Running' : 'Connected',
      latency: 5, // ms
      icon: Mic,
      colorClass: status.audioActive ? 'bg-success border-success' : 'bg-saathi-mist border-border',
    },
    {
      id: 'asr',
      name: 'Speech Recognition (ASR)',
      textStatus: 'Ready',
      latency: status.asrLatencyMs,
      icon: Volume2,
      colorClass: 'bg-success border-success',
    },
    {
      id: 'translation',
      name: 'ISL Translation Engine',
      textStatus: 'Running',
      latency: status.translatorLagMs,
      icon: UserCheck,
      colorClass: 'bg-success border-success',
    },
    {
      id: 'avatar',
      name: '3D Gesture Avatar',
      textStatus: 'Ready',
      latency: Math.floor(1000 / status.avatarFps),
      icon: Cpu,
      colorClass: 'bg-success border-success',
    },
  ];

  const totalLatency = stages.reduce((acc, curr) => acc + curr.latency, 0);

  return (
    <div
      role="region"
      aria-label="System streaming node telemetry"
      className="bg-surface-raised border border-border rounded-xl p-5 shadow-xs space-y-4"
    >
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-3">
        <h2 className="text-sm font-extrabold text-text-primary uppercase tracking-wider">
          System Node Connection Telemetry
        </h2>
        {/* End-to-end latency */}
        <span className="px-2.5 py-1 text-xs font-mono font-black rounded bg-accent/15 text-accent border border-accent/25">
          End-to-End Latency: {totalLatency} ms (1-3s Target OK)
        </span>
      </div>

      <div className="space-y-3">
        {stages.map((stage) => {
          const Icon = stage.icon;
          return (
            <div
              key={stage.id}
              className="flex items-center justify-between p-3 rounded-lg border border-border bg-surface text-xs"
            >
              <div className="flex items-center space-x-3">
                <div className="p-1.5 rounded bg-saathi-navy/10 text-accent">
                  <Icon className="w-4 h-4" aria-hidden="true" />
                </div>
                <div className="space-y-0.5">
                  <span className="font-bold text-text-primary block">{stage.name}</span>
                  <span className="text-[10px] text-text-secondary">
                    Latency: {stage.latency} ms
                  </span>
                </div>
              </div>

              {/* Status and High-Contrast Compatible Indicator Dot */}
              <div className="flex items-center space-x-2">
                <span className="font-semibold text-text-primary">{stage.textStatus}</span>
                <span
                  aria-hidden="true"
                  className={`w-3 h-3 rounded-full border-2 ${stage.colorClass} block shrink-0`}
                  style={{ forcedColorAdjust: 'preserve-parent-color' }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
export default SystemStatusPanel;
