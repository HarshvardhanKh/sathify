import React from 'react';
import { useAppStore } from '../../../store/appStore';
import { HelpCircle, Sparkles } from 'lucide-react';

interface IslGlossStripProps {
  currentSignIndex?: number;
}

export const IslGlossStrip: React.FC<IslGlossStripProps> = ({ currentSignIndex = 0 }) => {
  const currentIsl = useAppStore((s) => s.isl.current);

  if (!currentIsl) {
    return (
      <div className="bg-surface-raised border border-border rounded-xl p-5 text-center text-xs text-text-secondary italic">
        Awaiting live Indian Sign Language stream translation...
      </div>
    );
  }

  const { glossTokens, unknownWords = [], translationMethod = 'Direct Mapping Dictionary' } = currentIsl;

  return (
    <div
      role="region"
      aria-label="Indian Sign Language spatial gloss grammar sequence"
      className="bg-surface-raised border border-border rounded-xl p-5 shadow-xs space-y-4"
    >
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-3">
        <div className="flex items-center space-x-2 text-accent font-extrabold text-xs">
          <Sparkles className="w-4 h-4" />
          <span>ISL Grammatical Gloss Strip (Subject-Object-Verb)</span>
        </div>

        {/* Provenance Label */}
        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-saathi-navy/10 text-saathi-navy border border-saathi-navy/20">
          Method: {translationMethod}
        </span>
      </div>

      {/* Ordered List of Sign Chips */}
      <ol className="flex flex-wrap items-center gap-2" aria-label="Sign gloss ordered list">
        {glossTokens.map((token, idx) => {
          const isCurrent = idx === currentSignIndex;
          const isPlayed = idx < currentSignIndex;
          const isUnknown = unknownWords.includes(token);

          if (isUnknown) {
            return (
              <li key={idx}>
                <span
                  title="Fingerspelling fallback used"
                  className="px-2.5 py-1.5 text-xs font-mono font-extrabold rounded-lg border-2 border-dashed border-warning bg-warning/5 text-warning flex items-center space-x-1"
                >
                  <HelpCircle className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>{token} (Fingerspelled)</span>
                </span>
              </li>
            );
          }

          return (
            <li key={idx}>
              <span
                className={`px-3 py-1.5 text-xs font-mono font-black rounded-lg border transition-all ${
                  isCurrent
                    ? 'bg-accent text-accent-fg border-accent ring-2 ring-accent scale-105 shadow-md'
                    : isPlayed
                    ? 'bg-saathi-mist/30 text-text-secondary border-border/40 opacity-55'
                    : 'bg-surface text-text-primary border-border hover:border-accent'
                }`}
              >
                {token}
              </span>
            </li>
          );
        })}
      </ol>

      {unknownWords.length > 0 && (
        <div className="text-[10px] font-semibold text-warning-text flex items-center space-x-1">
          <HelpCircle className="w-3.5 h-3.5" aria-hidden="true" />
          <span>Notice: Direct signs were unavailable for highlighted terms. Hand fingerspelling fallback applied.</span>
        </div>
      )}
    </div>
  );
};
export default IslGlossStrip;
