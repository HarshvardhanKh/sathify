import React, { useState, useEffect } from 'react';
import { Document, ContentBlock } from '../../../types/domain';
import { ComplexitySelector } from './ComplexitySelector';
import { FigureBlock } from './FigureBlock';
import { EquationBlock } from './EquationBlock';
import { ReadingRuler } from './ReadingRuler';
import { CompareView } from './CompareView';
import { useAppStore } from '../../../store/appStore';
import { Play, Pause, FileSpreadsheet, Sparkles, Layers } from 'lucide-react';
import { useAnnounce } from '../../../hooks/useAnnounce';

interface DocumentReaderProps {
  doc: Document;
}

export const DocumentReader: React.FC<DocumentReaderProps> = ({ doc }) => {
  const complexity = useAppStore((s) => s.reader.complexity);
  const isPlayingTts = useAppStore((s) => s.reader.isPlayingTts);
  const setReaderTtsPlaying = useAppStore((s) => s.setReaderTtsPlaying);
  const activeBlockId = useAppStore((s) => s.reader.activeBlockId);
  const setReaderActiveBlockId = useAppStore((s) => s.setReaderActiveBlockId);

  const [isCompareView, setIsCompareView] = useState<boolean>(false);
  const [selectedTerm, setSelectedTerm] = useState<string | null>(null);
  const [isSimplifying, setIsSimplifying] = useState<boolean>(false);

  const { announce } = useAnnounce();

  // Load persisted complexity per document ID on mount/id change
  useEffect(() => {
    try {
      const saved = localStorage.getItem(`saathify_complexity_${doc.id}`);
      if (saved) {
        useAppStore.getState().setReaderComplexity(saved as any);
      } else {
        useAppStore.getState().setReaderComplexity('original');
      }
    } catch {
      // Ignore
    }
  }, [doc.id]);

  // Key terms preserved from original to ensure examined vocabulary is never silently deleted
  const keyTerms = [
    { word: 'ALU (Arithmetic Logic Unit)', def: 'The central digital circuit inside a CPU that performs arithmetic additions and boolean logic.' },
    { word: 'Register File', def: 'High-speed 32-bit or 64-bit storage locations directly accessible by CPU instructions.' },
    { word: 'Cache Latency', def: 'The delay time (in nanoseconds) required to retrieve data from L1/L2 cache memory.' },
  ];

  const handleComplexityChange = (newLevel: 'original' | 'simplified' | 'essential') => {
    // Preserve scroll position anchored on current active block ID
    const currentId = activeBlockId || doc.blocks[0]?.id;
    
    // Persist document complexity level
    try {
      localStorage.setItem(`saathify_complexity_${doc.id}`, newLevel);
    } catch {
      // Ignore
    }

    // Simulate backend simplification latency with block skeletons
    setIsSimplifying(true);
    setTimeout(() => {
      setIsSimplifying(false);
      useAppStore.getState().setReaderComplexity(newLevel);

      const levelText =
        newLevel === 'simplified'
          ? 'Simplified version, 340 words, reading level Grade 8.'
          : newLevel === 'essential'
          ? 'Key points summary, 120 words.'
          : 'Original full academic text restored.';

      announce(levelText, 'polite');

      if (currentId) {
        setTimeout(() => {
          const el = window.document.getElementById(currentId);
          if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
          }
        }, 50);
      }
    }, 850);
  };

  const renderBlock = (block: ContentBlock) => {
    const isActive = activeBlockId === block.id;

    switch (block.kind) {
      case 'heading': {
        const headingClass = `font-extrabold text-text-primary mt-6 mb-3 tracking-tight outline-none cursor-pointer rounded p-1 ${
          block.level === 1 ? 'text-2xl border-b border-border pb-2' : 'text-xl'
        } ${isActive ? 'ring-2 ring-accent bg-accent/5' : ''}`;
        const props = {
          key: block.id,
          id: block.id,
          tabIndex: 0,
          onClick: () => setReaderActiveBlockId(block.id),
          className: headingClass,
        };
        if (block.level === 1) return <h1 {...props}>{block.text}</h1>;
        if (block.level === 2) return <h2 {...props}>{block.text}</h2>;
        if (block.level === 3) return <h3 {...props}>{block.text}</h3>;
        return <h4 {...props}>{block.text}</h4>;
      }

      case 'paragraph': {
        let textToShow = block.text;
        if (!isSimplifying) {
          if (complexity === 'simplified' && block.simplifiedText) {
            textToShow = block.simplifiedText;
          } else if (complexity === 'essential' && block.essentialText) {
            textToShow = block.essentialText;
          }
        }

        return (
          <div key={block.id} className="relative">
            <p
              id={block.id}
              tabIndex={0}
              onClick={() => setReaderActiveBlockId(block.id)}
              className={`reading-surface text-text-primary mb-4 leading-relaxed cursor-pointer rounded-lg p-2.5 transition-colors max-w-[66ch] ${
                isActive ? 'bg-saathi-mist/40 border border-saathi-azure ring-2 ring-accent tts-active' : 'hover:bg-surface-raised/50'
              }`}
            >
              {textToShow}
            </p>
            {isSimplifying && (
              <div 
                aria-label="Simplifying content in background"
                className="space-y-2 animate-pulse mb-4 p-2.5 max-w-[66ch] border border-dashed border-accent/30 rounded-lg"
              >
                <div className="h-3.5 bg-saathi-mist rounded w-5/6"></div>
                <div className="h-3.5 bg-saathi-mist rounded w-2/3"></div>
              </div>
            )}
          </div>
        );
      }

      case 'image': {
        return (
          <FigureBlock
            key={block.id}
            id={block.id}
            src={block.src}
            description={block.description}
          />
        );
      }

      case 'equation': {
        return (
          <EquationBlock
            key={block.id}
            id={block.id}
            latex={block.latex}
            spokenMathText={block.spokenMathText}
          />
        );
      }

      case 'table': {
        return (
          <div key={block.id} id={block.id} tabIndex={0} className="my-5 overflow-x-auto">
            {block.caption && (
              <div className="text-xs font-bold text-text-primary mb-2 flex items-center space-x-1.5">
                <FileSpreadsheet className="w-4 h-4 text-accent" aria-hidden="true" />
                <span>{block.caption}</span>
              </div>
            )}
            <table className="w-full text-left border-collapse border border-border rounded-lg text-sm">
              <thead>
                <tr className="bg-surface-raised border-b border-border text-text-primary font-bold">
                  {block.headers.map((h, i) => (
                    <th key={i} scope="col" className="p-3 font-bold">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {block.rows.map((row, rIdx) => (
                  <tr key={rIdx} className="hover:bg-surface-raised/40">
                    {row.map((cell, cIdx) => (
                      <td key={cIdx} className="p-3 text-text-primary">{cell}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      }

      case 'list': {
        const ListTag = block.ordered ? 'ol' : 'ul';
        return (
          <ListTag
            key={block.id}
            id={block.id}
            tabIndex={0}
            className={`my-4 space-y-2 pl-6 text-text-primary max-w-[66ch] ${
              block.ordered ? 'list-decimal' : 'list-disc'
            }`}
          >
            {block.items.map((item, i) => (
              <li key={i} className="leading-relaxed">{item}</li>
            ))}
          </ListTag>
        );
      }
    }
  };

  return (
    <div className="space-y-6">
      <ReadingRuler enabled={false} />

      {/* Reader Control Header */}
      <div className="bg-surface-raised border border-border rounded-xl p-5 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-4">
          <div>
            <span className="text-xs font-extrabold uppercase tracking-wider text-accent block mb-1">
              Subject: {doc.subject} • {doc.originalFormat.toUpperCase()}
            </span>
            <h1 className="text-2xl font-extrabold text-text-primary tracking-tight">
              {doc.title}
            </h1>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={() => setIsCompareView(!isCompareView)}
              className="hidden lg:flex px-4 py-2 font-bold text-xs rounded-lg border border-border bg-surface text-text-primary hover:bg-surface-raised items-center space-x-1.5 focus-visible:ring-2"
            >
              <Layers className="w-4 h-4 text-accent" />
              <span>{isCompareView ? 'Exit Compare View' : 'Side-by-Side Compare'}</span>
            </button>

            <button
              onClick={() => setReaderTtsPlaying(!isPlayingTts)}
              aria-label={isPlayingTts ? 'Pause Text-to-Speech audio' : 'Play Text-to-Speech audio'}
              className={`px-5 py-2.5 font-bold text-sm rounded-lg flex items-center space-x-2 shadow-xs transition-colors ${
                isPlayingTts
                  ? 'bg-warning text-white'
                  : 'bg-accent text-accent-fg hover:opacity-90'
              }`}
            >
              {isPlayingTts ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
              <span>{isPlayingTts ? 'Pause TTS' : 'Read Aloud (TTS)'}</span>
            </button>
          </div>
        </div>

        <ComplexitySelector onComplexityChange={handleComplexityChange} />

        {/* Key-Terms Vocabulary Strip */}
        <div
          role="region"
          aria-label="Preserved Academic Key Terms & Exam Vocabulary"
          className="p-3 bg-surface border border-border rounded-xl space-y-2 text-xs"
        >
          <span className="font-bold text-text-primary uppercase tracking-wider text-[11px] block flex items-center space-x-1">
            <Sparkles className="w-3.5 h-3.5 text-accent" />
            <span>Preserved Exam Vocabulary Terms (Focus or Tap for Definition):</span>
          </span>
          <div className="flex flex-wrap gap-2">
            {keyTerms.map((term, i) => (
              <button
                key={i}
                onClick={() => setSelectedTerm(selectedTerm === term.word ? null : term.word)}
                aria-expanded={selectedTerm === term.word}
                className="px-2.5 py-1 font-mono font-bold rounded bg-saathi-navy text-white hover:bg-saathi-blue transition-colors shadow-xs"
              >
                {term.word}
              </button>
            ))}
          </div>

          {selectedTerm && (
            <div className="p-2.5 rounded bg-saathi-mist/40 border border-saathi-azure text-text-primary font-sans text-xs">
              <strong>{selectedTerm}:</strong>{' '}
              {keyTerms.find((t) => t.word === selectedTerm)?.def}
            </div>
          )}
        </div>
      </div>

      {/* Main Reading Surface */}
      {isCompareView ? (
        <CompareView
          blocks={doc.blocks}
          activeBlockId={activeBlockId}
          onBlockSelect={(id) => setReaderActiveBlockId(id)}
        />
      ) : (
        <article
          id="document-reader-container"
          tabIndex={0}
          aria-label={`Document content reading column for ${doc.title}. Max width 66 characters per line for optimal reading ergonomics.`}
          className="bg-surface border border-border rounded-xl p-6 sm:p-10 shadow-sm focus-visible:ring-2"
        >
          {doc.blocks.map(renderBlock)}
        </article>
      )}
    </div>
  );
};
