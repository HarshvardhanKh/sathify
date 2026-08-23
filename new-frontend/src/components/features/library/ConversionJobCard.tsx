import React, { useEffect, useRef } from 'react';
import { ConversionJob } from '../../../types/domain';
import { AlertCircle, RotateCcw, Cpu } from 'lucide-react';
import { useAnnounce } from '../../../hooks/useAnnounce';

interface ConversionJobCardProps {
  job: ConversionJob;
  onRetryStage?: (jobId: string, stageName: string) => void;
}

export const ConversionJobCard: React.FC<ConversionJobCardProps> = ({ job, onRetryStage }) => {
  const { announce } = useAnnounce();
  const lastAnnouncedPctRef = useRef<number>(0);

  // Polite Progress Announcements at 25%, 50%, 75%, 100% thresholds ONLY
  useEffect(() => {
    const pct = job.progressPct;
    const thresholds = [25, 50, 75, 100];
    const hitThreshold = thresholds.find((t) => pct >= t && lastAnnouncedPctRef.current < t);

    if (hitThreshold) {
      lastAnnouncedPctRef.current = hitThreshold;
      announce(
        `Conversion progress for ${job.documentId}: ${hitThreshold}% completed. Current step: ${job.currentStep}.`,
        'polite'
      );
    }
  }, [job.progressPct, job.currentStep, job.documentId, announce]);

  const stages = [
    { name: 'Extracting text', stepIndex: 1 },
    { name: 'Detecting figures', stepIndex: 2 },
    { name: 'Generating image descriptions', stepIndex: 3 },
    { name: 'Building audio', stepIndex: 4 },
    { name: 'Simplifying language', stepIndex: 5 },
  ];

  const getStageStatus = (stageIndex: number) => {
    const currentStepIndex = Math.floor((job.progressPct / 100) * stages.length) + 1;

    if (job.status === 'failed' && stageIndex === currentStepIndex) {
      return { label: 'Failed', color: 'text-danger bg-danger/10 border-danger' };
    }
    if (stageIndex < currentStepIndex || job.progressPct === 100) {
      return { label: 'Completed', color: 'text-success bg-success/10 border-success' };
    }
    if (stageIndex === currentStepIndex && job.status !== 'completed') {
      return { label: 'In Progress', color: 'text-accent bg-accent/10 border-accent font-bold animate-pulse' };
    }
    return { label: 'Pending', color: 'text-text-secondary bg-surface border-border' };
  };

  return (
    <div
      role="region"
      aria-label={`Conversion job tracking for document ${job.documentId}`}
      className="bg-surface-raised border border-border rounded-xl p-5 shadow-xs space-y-4"
    >
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-3">
        <div className="flex items-center space-x-2">
          <Cpu className="w-5 h-5 text-accent" aria-hidden="true" />
          <div>
            <h3 className="font-bold text-sm text-text-primary">Pipeline Conversion Job</h3>
            <span className="text-xs text-text-secondary">Job ID: {job.jobId}</span>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <span className="font-mono text-xs font-bold text-accent">{job.progressPct}%</span>
          <span
            className={`px-2 py-0.5 text-[11px] font-bold uppercase rounded border ${
              job.status === 'completed'
                ? 'bg-success/20 text-success border-success'
                : job.status === 'failed'
                ? 'bg-danger/20 text-danger border-danger'
                : 'bg-saathi-mist/40 text-text-primary border-border'
            }`}
          >
            {job.status}
          </span>
        </div>
      </div>

      {/* Progress Bar Visual */}
      <div
        role="progressbar"
        aria-valuenow={job.progressPct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Overall conversion pipeline progress"
        className="w-full h-2 bg-border rounded-full overflow-hidden"
      >
        <div
          className="h-full bg-accent transition-all duration-300"
          style={{ width: `${job.progressPct}%` }}
        />
      </div>

      {/* Stage Checklist */}
      <ol className="space-y-2 text-xs">
        {stages.map((stage, idx) => {
          const stageIndex = idx + 1;
          const status = getStageStatus(stageIndex);

          return (
            <li
              key={idx}
              className="p-2.5 rounded-lg border flex items-center justify-between bg-surface transition-colors"
            >
              <span className="font-semibold text-text-primary">
                {stageIndex}. {stage.name}
              </span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-mono border ${status.color}`}>
                {status.label}
              </span>
            </li>
          );
        })}
      </ol>

      {/* Failed Stage Recovery Action */}
      {job.status === 'failed' && (
        <div className="p-3 bg-danger/10 border border-danger rounded-lg flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center space-x-2 text-danger font-bold">
            <AlertCircle className="w-4 h-4" />
            <span>Failing Stage: {job.currentStep}</span>
          </div>

          {onRetryStage && (
            <button
              onClick={() => onRetryStage(job.jobId, job.currentStep)}
              className="px-3 py-1.5 font-bold rounded bg-danger text-white hover:opacity-90 flex items-center space-x-1 shadow-xs"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Retry Stage</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
};
