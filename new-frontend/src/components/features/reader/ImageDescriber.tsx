import React, { useState } from 'react';
import { ImageDescription } from '../../../types/domain';
import { Eye, ChevronDown, ChevronUp, Table, FileText } from 'lucide-react';

interface ImageDescriberProps {
  src: string;
  description: ImageDescription;
}

export const ImageDescriber: React.FC<ImageDescriberProps> = ({ src, description }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <figure
      role="group"
      aria-label={`Accessible Diagram: ${description.shortAlt}`}
      className="bg-surface-raised border border-border rounded-xl p-4 my-4 shadow-xs space-y-3"
    >
      <div className="relative overflow-hidden rounded-lg border border-border bg-black/5 max-h-96 flex items-center justify-center">
        <img
          src={src}
          alt={description.shortAlt}
          className="max-h-96 object-contain rounded-lg"
        />
        <span className="absolute top-2 right-2 px-2.5 py-1 text-[11px] font-bold uppercase rounded bg-saathi-navy text-white shadow-md">
          {description.figureType}
        </span>
      </div>

      <figcaption className="space-y-3 text-xs">
        <div className="flex items-start justify-between gap-3">
          <div>
            <span className="font-bold text-text-primary block text-sm mb-1">
              Short Description (Alt):
            </span>
            <p className="text-text-secondary font-medium leading-relaxed">
              {description.shortAlt}
            </p>
          </div>

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            aria-expanded={isExpanded}
            aria-controls={`long-desc-${description.id}`}
            className="px-3 py-1.5 font-bold rounded-lg border border-border bg-surface text-text-primary hover:bg-surface-raised flex items-center space-x-1 shrink-0 focus-visible:ring-2"
          >
            <Eye className="w-4 h-4 text-accent" aria-hidden="true" />
            <span>{isExpanded ? 'Hide Long Description' : 'View Long Description'}</span>
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>

        {isExpanded && (
          <div
            id={`long-desc-${description.id}`}
            className="p-3 bg-surface border border-border rounded-lg space-y-3 mt-2 text-text-primary"
          >
            <div>
              <span className="font-bold text-accent block mb-1 flex items-center space-x-1">
                <FileText className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Extended Architectural & Diagram Analysis:</span>
              </span>
              <p className="leading-relaxed text-sm">{description.longDescription}</p>
            </div>

            {description.tactileFriendlyNotes && (
              <div className="p-2.5 rounded bg-saathi-mist/30 border border-saathi-mist text-text-primary">
                <span className="font-bold block text-[11px] uppercase tracking-wider text-saathi-navy mb-0.5">
                  Tactile & Low-Vision Embosser Notes:
                </span>
                <p>{description.tactileFriendlyNotes}</p>
              </div>
            )}

            {description.dataSeries && description.dataSeries.length > 0 && (
              <div>
                <span className="font-bold text-text-primary block mb-1 flex items-center space-x-1">
                  <Table className="w-3.5 h-3.5 text-accent" aria-hidden="true" />
                  <span>Tabular Figure Data Breakdown:</span>
                </span>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse border border-border rounded text-xs">
                    <thead>
                      <tr className="bg-surface-raised border-b border-border text-text-secondary">
                        <th className="p-2 font-semibold">Data Parameter / Metric</th>
                        <th className="p-2 font-semibold">Value</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60">
                      {description.dataSeries.map((item, idx) => (
                        <tr key={idx} className="hover:bg-surface-raised/40">
                          <td className="p-2 font-medium text-text-primary">{item.label}</td>
                          <td className="p-2 font-mono font-bold text-accent">{item.value}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </figcaption>
    </figure>
  );
};
