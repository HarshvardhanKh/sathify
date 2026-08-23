import React from 'react';
import { useAppStore } from '../../../store/appStore';
import { Activity, Cpu, Gauge, Zap } from 'lucide-react';

export const StatusIndicator: React.FC = () => {
  const status = useAppStore((s) => s.status);
  const pipelineState = useAppStore((s) => s.pipelineState);

  const getStatusBadge = () => {
    switch (pipelineState) {
      case 'running':
        return { label: 'LIVE PIPELINE ACTIVE', color: 'bg-success text-white' };
      case 'starting':
        return { label: 'CONNECTING...', color: 'bg-warning text-white' };
      case 'stopping':
        return { label: 'STOPPING...', color: 'bg-text-secondary text-white' };
      case 'error':
        return { label: 'PIPELINE ERROR', color: 'bg-danger text-white' };
      default:
        return { label: 'PIPELINE IDLE', color: 'bg-saathi-mist text-text-primary' };
    }
  };

  const badge = getStatusBadge();

  return (
    <div
      role="region"
      aria-label="Live Pipeline Telemetry Status"
      className="bg-surface-raised border border-border rounded-xl p-4 shadow-sm space-y-3"
    >
      <div className="flex items-center justify-between border-b border-border pb-3">
        <div className="flex items-center space-x-2">
          <Activity className="w-5 h-5 text-accent animate-pulse" aria-hidden="true" />
          <h2 className="font-bold text-sm text-text-primary">System Performance Telemetry</h2>
        </div>
        <span className={`px-2.5 py-1 text-[11px] font-bold tracking-wider rounded-full shadow-xs ${badge.color}`}>
          {badge.label}
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div className="p-2.5 rounded-lg bg-surface border border-border flex flex-col justify-between">
          <span className="text-text-secondary flex items-center space-x-1">
            <Zap className="w-3.5 h-3.5 text-accent" aria-hidden="true" />
            <span>ASR Latency</span>
          </span>
          <span className="text-base font-black text-text-primary mt-1">{status.asrLatencyMs} ms</span>
        </div>

        <div className="p-2.5 rounded-lg bg-surface border border-border flex flex-col justify-between">
          <span className="text-text-secondary flex items-center space-x-1">
            <Gauge className="w-3.5 h-3.5 text-accent" aria-hidden="true" />
            <span>ISL Translation Lag</span>
          </span>
          <span className="text-base font-black text-text-primary mt-1">{status.translatorLagMs} ms</span>
        </div>

        <div className="p-2.5 rounded-lg bg-surface border border-border flex flex-col justify-between">
          <span className="text-text-secondary flex items-center space-x-1">
            <Activity className="w-3.5 h-3.5 text-success" aria-hidden="true" />
            <span>Avatar Animation</span>
          </span>
          <span className="text-base font-black text-text-primary mt-1">{status.avatarFps} FPS</span>
        </div>

        <div className="p-2.5 rounded-lg bg-surface border border-border flex flex-col justify-between">
          <span className="text-text-secondary flex items-center space-x-1">
            <Cpu className="w-3.5 h-3.5 text-warning" aria-hidden="true" />
            <span>Worker CPU Load</span>
          </span>
          <span className="text-base font-black text-text-primary mt-1">{status.cpuUsagePct}%</span>
        </div>
      </div>
    </div>
  );
};
