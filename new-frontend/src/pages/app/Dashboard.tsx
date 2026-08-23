import React from 'react';
import { Link } from 'react-router-dom';
import { useAppStore } from '../../store/appStore';
import { DocumentGrid } from '../../components/features/library/DocumentGrid';
import { StatusIndicator } from '../../components/features/live/StatusIndicator';
import { Radio, Sparkles, BookOpen, ArrowRight, FileText } from 'lucide-react';

export const Dashboard: React.FC = () => {
  const library = useAppStore((s) => s.library);
  const activeDocument = library[0];

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-saathi-navy to-saathi-blue text-white rounded-2xl p-6 sm:p-8 shadow-md flex flex-wrap items-center justify-between gap-6">
        <div className="space-y-2 max-w-xl">
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-white/10 text-xs font-bold text-saathi-sky uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            <span>SaathiFy Accessible Student Portal</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight">Welcome to Your Portal</h1>
          <p className="text-saathi-mist text-sm font-medium leading-relaxed">
            Your course material, converted into accessible text, audio, and sign language formats adapted for you.
          </p>
        </div>
      </div>

      {/* Two Action Cards: Resume Reading & Start Live Session */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Resume Reading Card */}
        {activeDocument && (
          <div className="bg-surface-raised border border-border rounded-2xl p-6 shadow-xs flex flex-col justify-between space-y-4">
            <div className="space-y-2">
              <span className="px-2.5 py-1 text-[11px] font-bold uppercase rounded bg-accent/10 text-accent border border-accent/20">
                Resume Reading
              </span>
              <h2 className="text-xl font-bold text-text-primary line-clamp-1">{activeDocument.title}</h2>
              <p className="text-xs text-text-secondary line-clamp-2">{activeDocument.summary}</p>
            </div>

            <div className="pt-2">
              <Link
                to={`/read/${activeDocument.id}`}
                className="w-full py-3 font-bold text-xs rounded-xl bg-accent text-accent-fg hover:opacity-90 flex items-center justify-center space-x-2 shadow-xs"
              >
                <BookOpen className="w-4 h-4" />
                <span>Resume Reading Reader</span>
              </Link>
            </div>
          </div>
        )}

        {/* Start Live Session Card */}
        <div className="bg-surface-raised border border-border rounded-2xl p-6 shadow-xs flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <span className="px-2.5 py-1 text-[11px] font-bold uppercase rounded bg-saathi-navy text-white">
              Live Classroom Session
            </span>
            <h2 className="text-xl font-bold text-text-primary">Live ISL & Captions Studio</h2>
            <p className="text-xs text-text-secondary">
              Connect your microphone or lecture audio stream for real-time speech recognition and 3D Indian Sign Language (ISL) gestures.
            </p>
          </div>

          <div className="pt-2">
            <Link
              to="/live"
              className="w-full py-3 font-bold text-xs rounded-xl bg-saathi-amber text-saathi-ink hover:bg-saathi-amber/90 flex items-center justify-center space-x-2 shadow-xs"
            >
              <Radio className="w-4 h-4" />
              <span>Launch Live ISL Studio</span>
            </Link>
          </div>
        </div>
      </div>

      {/* System Telemetry Status */}
      <StatusIndicator />

      {/* Recent Course Materials */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <FileText className="w-5 h-5 text-accent" />
            <h2 className="text-xl font-bold text-text-primary">Recent Converted Course Materials</h2>
          </div>

          <Link to="/library" className="text-xs font-bold text-accent hover:underline flex items-center space-x-1">
            <span>View All Library Documents</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <DocumentGrid documents={library} />
      </section>
    </div>
  );
};
