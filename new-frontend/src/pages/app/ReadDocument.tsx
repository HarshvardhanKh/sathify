import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAppStore } from '../../store/appStore';
import { DocumentReader } from '../../components/features/reader/DocumentReader';
import { TtsPlayer } from '../../components/features/reader/TtsPlayer';
import { NotesPanel } from '../../components/features/reader/NotesPanel';
import { ArrowLeft, List, FileText, ChevronRight, BookOpen } from 'lucide-react';
import { useAnnounce } from '../../hooks/useAnnounce';

export const ReadDocument: React.FC = () => {
  const { documentId } = useParams<{ documentId: string }>();
  const library = useAppStore((s) => s.library);
  const setReaderActiveBlockId = useAppStore((s) => s.setReaderActiveBlockId);
  const activeBlockId = useAppStore((s) => s.reader.activeBlockId);

  const [outlineOpen, setOutlineOpen] = useState(true);
  const { announce } = useAnnounce();

  const document = library.find((d) => d.id === documentId) || library[0];

  if (!document) {
    return (
      <div className="py-12 text-center space-y-4">
        <FileText className="w-12 h-12 text-border mx-auto" />
        <h1 className="text-xl font-bold text-text-primary">Document Not Found</h1>
        <Link to="/library" className="text-sm font-bold text-accent hover:underline">
          Return to Library
        </Link>
      </div>
    );
  }

  // Extract headings for Left Outline Drawer
  const headings = document.blocks.filter((b) => b.kind === 'heading') as Array<{
    kind: 'heading';
    id: string;
    level: 1 | 2 | 3 | 4;
    text: string;
  }>;

  const allBlockIds = document.blocks.map((b) => b.id);

  const handleHeadingClick = (id: string, text: string) => {
    setReaderActiveBlockId(id);
    announce(`Navigated to section heading: ${text}`, 'polite');
    const el = window.document.getElementById(id);
    if (el) {
      el.focus();
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="relative min-h-screen flex flex-col justify-between">
      <div className="space-y-4 max-w-7xl mx-auto w-full px-2">
        {/* Navigation Back Header */}
        <div className="flex items-center justify-between border-b border-border pb-3">
          <Link
            to="/library"
            className="inline-flex items-center space-x-1.5 text-xs font-bold text-text-secondary hover:text-text-primary p-1 focus-visible:ring-2 rounded"
          >
            <ArrowLeft className="w-4 h-4 text-accent" />
            <span>Back to Document Library</span>
          </Link>

          <button
            onClick={() => setOutlineOpen(!outlineOpen)}
            aria-expanded={outlineOpen}
            className="px-3 py-1.5 text-xs font-bold rounded-lg border border-border bg-surface text-text-primary hover:bg-surface-raised flex items-center space-x-1.5 focus-visible:ring-2"
          >
            <List className="w-4 h-4 text-accent" />
            <span>{outlineOpen ? 'Hide Outline Drawer' : 'Show Outline Drawer'}</span>
          </button>
        </div>

        {/* THREE-ZONE LAYOUT */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start pb-20">
          {/* ZONE 1: Left Headings Outline Drawer */}
          {outlineOpen && (
            <aside
              aria-label="Document Headings Navigation Outline"
              className="lg:col-span-3 bg-surface-raised border border-border rounded-xl p-4 shadow-xs space-y-3 sticky top-20 max-h-[80vh] overflow-y-auto"
            >
              <div className="flex items-center space-x-2 border-b border-border pb-2">
                <BookOpen className="w-4 h-4 text-accent" />
                <h2 className="font-extrabold text-xs uppercase tracking-wider text-text-primary">
                  Document Headings Tree
                </h2>
              </div>

              <nav aria-label="Headings Table of Contents" className="space-y-1">
                {headings.map((h) => {
                  const isActive = activeBlockId === h.id;
                  return (
                    <button
                      key={h.id}
                      onClick={() => handleHeadingClick(h.id, h.text)}
                      className={`w-full text-left p-2 rounded-lg text-xs font-semibold transition-colors flex items-center justify-between group focus-visible:ring-2 ${
                        isActive
                          ? 'bg-accent text-accent-fg font-extrabold shadow-xs'
                          : 'text-text-primary hover:bg-surface'
                      } ${h.level === 2 ? 'pl-4' : h.level === 3 ? 'pl-6' : ''}`}
                    >
                      <span className="truncate">{h.text}</span>
                      <ChevronRight className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-accent-fg' : 'text-text-secondary'}`} />
                    </button>
                  );
                })}

                {headings.length === 0 && (
                  <p className="text-xs text-text-secondary italic">No structured headings found.</p>
                )}
              </nav>
            </aside>
          )}

          {/* ZONE 2: Center Main Reading Column (Max 66ch) */}
          <div className={outlineOpen ? 'lg:col-span-6' : 'lg:col-span-8'}>
            <DocumentReader doc={document} />
          </div>

          {/* ZONE 3: Right Utility Panel (Notes & Highlights) */}
          <aside
            aria-label="Notes & Figure Utility Panel"
            className={outlineOpen ? 'lg:col-span-3 space-y-6 sticky top-20' : 'lg:col-span-4 space-y-6 sticky top-20'}
          >
            <NotesPanel activeBlockId={activeBlockId} />
          </aside>
        </div>
      </div>

      {/* Sticky Bottom TTS Player */}
      <TtsPlayer blockIds={allBlockIds} />
    </div>
  );
};
