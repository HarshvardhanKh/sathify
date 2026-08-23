import React, { useState } from 'react';
import { ImageDescription } from '../../../types/domain';
import { Eye, ChevronDown, ChevronUp, Table, FileText, AlertTriangle, Check, ShieldCheck } from 'lucide-react';
import { useAnnounce } from '../../../hooks/useAnnounce';

interface FigureBlockProps {
  id: string;
  src: string;
  description: ImageDescription;
}

export const FigureBlock: React.FC<FigureBlockProps> = ({ id, src, description }) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [reported, setReported] = useState(false);
  const { announce } = useAnnounce();

  const handleReport = () => {
    setReported(true);
    announce('Thank you. Bad description report submitted to accessibility review team.', 'polite');
  };

  return (
    <figure
      id={id}
      role="group"
      aria-label={`Accessible Figure: ${description.shortAlt}`}
      className="bg-surface-raised border border-border rounded-xl p-5 my-6 shadow-xs space-y-4"
    >
      {/* Image Render */}
      <div className="relative overflow-hidden rounded-lg border border-border bg-black/5 max-h-96 flex items-center justify-center">
        <img
          src={src}
          alt={description.shortAlt}
          className="max-h-96 object-contain rounded-lg"
        />
        <span className="absolute top-2 right-2 px-2.5 py-1 text-[11px] font-extrabold uppercase tracking-wider rounded bg-saathi-navy text-white shadow-md">
          {description.figureType}
        </span>
      </div>

      <figcaption className="space-y-4 text-xs">
        {/* Short Alt & Toggle Header */}
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border pb-3">
          <div className="space-y-1">
            <span className="font-extrabold text-text-primary text-sm block">
              Short Description (Screen Reader Alt Text):
            </span>
            <p className="text-text-secondary font-medium leading-relaxed">
              {description.shortAlt}
            </p>
          </div>

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            aria-expanded={isExpanded}
            aria-controls={`figure-details-${description.id}`}
            className="px-3.5 py-2 font-bold rounded-lg border border-border bg-surface text-text-primary hover:bg-surface-raised flex items-center space-x-1.5 shrink-0 focus-visible:ring-2"
          >
            <Eye className="w-4 h-4 text-accent" aria-hidden="true" />
            <span>{isExpanded ? 'Collapse Figure Panel' : 'Describe This Figure'}</span>
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>

        {/* Expandable Detailed Figure Panel */}
        {isExpanded && (
          <div
            id={`figure-details-${description.id}`}
            className="p-4 bg-surface border border-border rounded-xl space-y-4 text-text-primary"
          >
            {/* Provenance Line */}
            <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-text-secondary border-b border-border pb-2">
              <span className="flex items-center space-x-1.5 font-semibold text-saathi-navy">
                <ShieldCheck className="w-4 h-4 text-accent" aria-hidden="true" />
                <span>Description generated automatically by SaathiFy Vision Pipeline</span>
              </span>

              <button
                onClick={handleReport}
                disabled={reported}
                className="font-bold text-danger hover:underline flex items-center space-x-1 disabled:opacity-50"
              >
                {reported ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-success" />
                    <span className="text-success">Report Submitted</span>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>Report a bad description</span>
                  </>
                )}
              </button>
            </div>

            {/* Long-Form Text Description */}
            <div className="space-y-1">
              <span className="font-bold text-accent text-xs block flex items-center space-x-1">
                <FileText className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Extended Architectural & Visual Analysis:</span>
              </span>
              <p className="leading-relaxed text-sm text-text-primary font-sans">
                {description.longDescription}
              </p>
            </div>

            {/* FIRST-CLASS DATA TABLE FOR CHARTS & GRAPHS */}
            {description.dataSeries && description.dataSeries.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-border">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-text-primary text-xs flex items-center space-x-1.5">
                    <Table className="w-4 h-4 text-accent" aria-hidden="true" />
                    <span>Underlying Chart Data Points (Screen Reader Accessible Table):</span>
                  </span>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-saathi-mist/40 text-text-primary">
                    FIRST-CLASS DATA TABLE
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table
                    aria-label={`Tabular data representation for chart figure ${description.shortAlt}`}
                    className="w-full text-left border-collapse border border-border rounded-lg text-xs"
                  >
                    <thead>
                      <tr className="bg-surface-raised border-b border-border text-text-primary font-bold">
                        <th scope="col" className="p-2.5">Data Parameter / Category</th>
                        <th scope="col" className="p-2.5">Value / Measurement</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60">
                      {description.dataSeries.map((item, idx) => (
                        <tr key={idx} className="hover:bg-surface-raised/40">
                          <th scope="row" className="p-2.5 font-semibold text-text-primary">{item.label}</th>
                          <td className="p-2.5 font-mono font-extrabold text-accent">{item.value}</td>
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
