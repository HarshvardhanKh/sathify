import React from 'react';
import { ComplexityLevel } from '../../../types/domain';
import { useAppStore } from '../../../store/appStore';
import { SlidersHorizontal } from 'lucide-react';

interface ComplexitySelectorProps {
  onComplexityChange?: (level: ComplexityLevel) => void;
}

export const ComplexitySelector: React.FC<ComplexitySelectorProps> = ({ onComplexityChange }) => {
  const complexity = useAppStore((s) => s.reader.complexity);
  const setComplexity = useAppStore((s) => s.setReaderComplexity);

  const options: { level: ComplexityLevel; label: string; desc: string }[] = [
    { level: 'original', label: 'Original', desc: 'Full academic text and formulas' },
    { level: 'simplified', label: 'Simplified', desc: 'Plain language with key terms explained' },
    { level: 'essential', label: 'Key points', desc: 'Bullet points and core takeaways' },
  ];

  return (
    <div
      role="region"
      aria-label="Text Complexity Simplification Level Selector"
      className="bg-surface-raised border border-border rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 shadow-xs"
    >
      <div className="flex items-center space-x-2">
        <SlidersHorizontal className="w-4 h-4 text-accent" aria-hidden="true" />
        <span className="text-xs font-bold text-text-primary uppercase tracking-wider">
          Reading Complexity Level:
        </span>
        <kbd className="px-1.5 py-0.5 text-[10px] font-mono border border-border bg-surface text-text-secondary rounded">
          Alt+C
        </kbd>
      </div>

      <div
        role="tablist"
        aria-label="Complexity Options"
        className="flex items-center space-x-1 bg-surface p-1 border border-border rounded-lg"
      >
        {options.map((opt) => {
          const isSelected = complexity === opt.level;
          return (
            <button
              key={opt.level}
              role="tab"
              aria-selected={isSelected}
              onClick={() => {
                setComplexity(opt.level);
                if (onComplexityChange) onComplexityChange(opt.level);
              }}
              title={opt.desc}
              className={`px-3 py-1.5 text-xs font-bold rounded-md transition-colors ${
                isSelected
                  ? 'bg-accent text-accent-fg shadow-xs'
                  : 'text-text-primary hover:bg-surface-raised'
              }`}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
};
