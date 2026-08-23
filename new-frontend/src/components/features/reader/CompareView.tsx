import React from 'react';
import { ContentBlock } from '../../../types/domain';
import { SlidersHorizontal } from 'lucide-react';

interface CompareViewProps {
  blocks: ContentBlock[];
  activeBlockId: string | null;
  onBlockSelect: (id: string) => void;
}

export const CompareView: React.FC<CompareViewProps> = ({
  blocks,
  activeBlockId,
  onBlockSelect,
}) => {
  return (
    <div
      role="region"
      aria-label="Side-by-Side Original and Simplified Text Comparison View"
      className="space-y-4"
    >
      <div className="flex items-center justify-between border-b border-border pb-3">
        <div className="flex items-center space-x-2 text-accent font-extrabold text-sm">
          <SlidersHorizontal className="w-4 h-4" />
          <span>Side-by-Side Text Comparison View (≥1024px)</span>
        </div>
        <span className="text-xs font-semibold text-text-secondary">
          Scroll synced by block ID
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Original Text */}
        <div className="bg-surface border border-border rounded-xl p-5 space-y-4 shadow-xs">
          <div className="font-extrabold text-xs uppercase tracking-wider text-saathi-navy border-b border-border pb-2 flex items-center justify-between">
            <span>Original Academic Source</span>
            <span className="text-text-secondary text-[10px]">FULL DETAIL</span>
          </div>

          <div className="space-y-4">
            {blocks.map((b) => {
              if (b.kind === 'paragraph') {
                const isActive = activeBlockId === b.id;
                return (
                  <p
                    key={b.id}
                    id={`orig-${b.id}`}
                    onClick={() => onBlockSelect(b.id)}
                    className={`reading-surface text-text-primary p-3 rounded-lg leading-relaxed cursor-pointer transition-colors ${
                      isActive ? 'bg-saathi-mist/40 border border-saathi-azure' : 'hover:bg-surface-raised/40'
                    }`}
                  >
                    {b.text}
                  </p>
                );
              }
              if (b.kind === 'heading') {
                return (
                  <h3 key={b.id} className="font-bold text-text-primary text-base">
                    {b.text}
                  </h3>
                );
              }
              return null;
            })}
          </div>
        </div>

        {/* Right Column: Simplified Plain Language */}
        <div className="bg-surface border border-border rounded-xl p-5 space-y-4 shadow-xs">
          <div className="font-extrabold text-xs uppercase tracking-wider text-accent border-b border-border pb-2 flex items-center justify-between">
            <span>Simplified Plain Language</span>
            <span className="text-accent text-[10px]">MODIFIED BLOCK</span>
          </div>

          <div className="space-y-4">
            {blocks.map((b) => {
              if (b.kind === 'paragraph') {
                const isActive = activeBlockId === b.id;
                const simplifiedText = b.simplifiedText || b.text;
                return (
                  <p
                    key={b.id}
                    id={`simp-${b.id}`}
                    onClick={() => onBlockSelect(b.id)}
                    className={`reading-surface text-text-primary p-3 rounded-lg leading-relaxed cursor-pointer font-semibold transition-colors ${
                      isActive ? 'bg-saathi-mist/40 border border-saathi-azure' : 'bg-accent/5 hover:bg-accent/10'
                    }`}
                  >
                    {simplifiedText}
                  </p>
                );
              }
              if (b.kind === 'heading') {
                return (
                  <h3 key={b.id} className="font-bold text-text-primary text-base">
                    {b.text}
                  </h3>
                );
              }
              return null;
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
