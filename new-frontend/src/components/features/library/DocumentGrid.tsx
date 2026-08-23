import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { Document } from '../../../types/domain';
import { useAppStore } from '../../../store/appStore';
import { MOCK_DOCUMENTS } from '../../../mocks/mockServer';
import {
  BookOpen,
  Search,
  Filter,
  FileText,
  Clock,
  Volume2,
  Sliders,
  Eye,
  UserCheck,
  Plus,
} from 'lucide-react';

interface DocumentGridProps {
  documents: Document[];
  onUploadClick?: () => void;
}

export const DocumentGrid: React.FC<DocumentGridProps> = ({ documents, onUploadClick }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('all');
  const addDocumentToLibrary = useAppStore((s) => s.addDocumentToLibrary);
  const shouldReduceMotion = useReducedMotion();

  const subjects = Array.from(new Set(documents.map((d) => d.subject)));

  const filteredDocs = documents.filter((doc) => {
    const matchesSearch =
      doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.summary.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSubject = selectedSubject === 'all' || doc.subject === selectedSubject;
    return matchesSearch && matchesSubject;
  });

  const handleAddSampleDoc = () => {
    const sample = MOCK_DOCUMENTS[0];
    if (sample) {
      addDocumentToLibrary({ ...sample, id: `sample-${Date.now()}` });
    }
  };

  const containerVariant = shouldReduceMotion
    ? { initial: {}, animate: {} }
    : {
        initial: { opacity: 0 },
        animate: {
          opacity: 1,
          transition: { staggerChildren: 0.03 },
        },
      };

  const cardVariant = shouldReduceMotion
    ? { initial: { opacity: 1, y: 0 }, animate: { opacity: 1, y: 0 } }
    : {
        initial: { opacity: 0, y: 4 },
        animate: { opacity: 1, y: 0, transition: { duration: 0.15 } },
      };

  return (
    <div className="space-y-6">
      {/* Search & Filter Header */}
      <div className="bg-surface-raised border border-border rounded-xl p-4 flex flex-wrap items-center justify-between gap-4 shadow-xs">
        <div className="flex-1 min-w-[240px] relative">
          <label htmlFor="doc-search" className="sr-only">
            Search documents by title or keyword
          </label>
          <Search className="w-4 h-4 text-text-secondary absolute left-3 top-3" aria-hidden="true" />
          <input
            id="doc-search"
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search documents by title or topic..."
            className="w-full pl-9 pr-4 py-2 border border-border rounded-lg bg-surface text-text-primary text-sm focus-visible:ring-2"
          />
        </div>

        <div className="flex items-center space-x-2">
          <label htmlFor="subject-filter" className="text-xs font-bold text-text-primary flex items-center space-x-1">
            <Filter className="w-3.5 h-3.5 text-accent" aria-hidden="true" />
            <span>Subject:</span>
          </label>
          <select
            id="subject-filter"
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
            aria-label="Filter documents by subject area"
            className="bg-surface text-text-primary border border-border rounded-lg px-3 py-2 text-sm font-semibold focus-visible:ring-2"
          >
            <option value="all">All Subjects ({documents.length})</option>
            {subjects.map((subj) => (
              <option key={subj} value={subj}>
                {subj}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Cards Staggered Grid */}
      <motion.div
        variants={containerVariant}
        initial="initial"
        animate="animate"
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
      >
        {filteredDocs.map((doc) => (
          <motion.article
            key={doc.id}
            variants={cardVariant}
            className="bg-surface-raised border border-border rounded-xl p-5 shadow-xs flex flex-col justify-between hover:border-accent transition-all group"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="px-2.5 py-1 font-bold rounded bg-saathi-mist/40 text-text-primary uppercase tracking-wider">
                  {doc.subject}
                </span>
                <span className="px-2 py-0.5 font-mono font-bold text-[10px] rounded border border-border bg-surface uppercase">
                  {doc.originalFormat}
                </span>
              </div>

              <h2 className="text-lg font-bold text-text-primary group-hover:text-accent transition-colors line-clamp-2">
                <Link to={`/read/${doc.id}`} className="focus-visible:ring-2 rounded">
                  {doc.title}
                </Link>
              </h2>

              <p className="text-xs text-text-secondary line-clamp-2 leading-relaxed">
                {doc.summary}
              </p>

              {/* Format Availability Badges */}
              <div className="pt-2 flex flex-wrap gap-1">
                <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-accent/10 text-accent border border-accent/20 flex items-center space-x-1">
                  <Volume2 className="w-3 h-3" />
                  <span>Audio TTS</span>
                </span>
                <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-success/10 text-success border border-success/20 flex items-center space-x-1">
                  <Sliders className="w-3 h-3" />
                  <span>Simplified</span>
                </span>
                <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-saathi-navy/10 text-saathi-navy border border-saathi-navy/20 flex items-center space-x-1">
                  <Eye className="w-3 h-3" />
                  <span>Described Figures</span>
                </span>
                <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-saathi-blue/10 text-saathi-blue border border-saathi-blue/20 flex items-center space-x-1">
                  <UserCheck className="w-3 h-3" />
                  <span>ISL Signs</span>
                </span>
              </div>
            </div>

            <div className="pt-4 mt-4 border-t border-border flex items-center justify-between text-xs text-text-secondary">
              <span className="flex items-center space-x-1">
                <Clock className="w-3.5 h-3.5 text-accent" aria-hidden="true" />
                <span>{doc.pageCount} Pages</span>
              </span>

              <Link
                to={`/read/${doc.id}`}
                className="font-bold text-accent group-hover:underline flex items-center space-x-1"
              >
                <span>Open Reader</span>
                <BookOpen className="w-4 h-4" aria-hidden="true" />
              </Link>
            </div>
          </motion.article>
        ))}

        {/* Empty State Invitation */}
        {filteredDocs.length === 0 && (
          <div className="col-span-full py-12 text-center text-text-secondary bg-surface border border-border rounded-xl p-8 space-y-4">
            <FileText className="w-12 h-12 text-border mx-auto" aria-hidden="true" />
            <div className="space-y-1">
              <p className="text-lg font-extrabold text-text-primary">No Course Materials Yet</p>
              <p className="text-xs max-w-sm mx-auto">
                Upload your first PDF, slide deck, or lecture note, or load a sample computer architecture document to test the platform.
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              {onUploadClick && (
                <button
                  onClick={onUploadClick}
                  className="px-5 py-2.5 font-bold text-xs rounded-xl bg-accent text-accent-fg hover:opacity-90 flex items-center space-x-1.5 shadow-xs"
                >
                  <Plus className="w-4 h-4" />
                  <span>Upload Course Material</span>
                </button>
              )}

              <button
                onClick={handleAddSampleDoc}
                className="px-5 py-2.5 font-bold text-xs rounded-xl border border-border bg-surface-raised text-text-primary hover:bg-surface flex items-center space-x-1.5"
              >
                <BookOpen className="w-4 h-4 text-accent" />
                <span>Load Sample Computer Architecture Doc</span>
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};
