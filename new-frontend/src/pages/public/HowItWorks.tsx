import React from 'react';
import { ArrowRight } from 'lucide-react';

export const HowItWorks: React.FC = () => {
  const staticPipeline = [
    { step: '1. Content In', title: 'Upload Course File', desc: 'Accepts PDF textbooks, PPTX slides, Word docs, TXT notes, MP3 audio, or MP4 video lectures.' },
    { step: '2. Extraction', title: 'Multimodal Parsing', desc: 'Extracts semantic heading trees, tabular data, mathematical equations, and figure bounding boxes.' },
    { step: '3. Description & Simplification', title: 'AI Description Engine', desc: 'Generates extended diagram alt text, tactile notes, spoken math formulas, and 3 plain-language levels.' },
    { step: '4. Personalized Output', title: 'Accessible Student Surface', desc: 'Delivers formatted content tailored to your configured theme, font scale, dyslexia font, and TTS reader.' },
  ];

  const livePipeline = [
    { step: '1. System Audio', title: 'Audio Stream Capture', desc: 'Captures microphone or browser lecture audio stream in real-time.' },
    { step: '2. Speech Recognition', title: 'ASR Engine', desc: 'Converts spoken lecture speech into real-time word-by-word and sentence final transcripts.' },
    { step: '3. ISL Translation', title: 'ISL Gloss Engine', desc: 'Translates spoken sentences into Indian Sign Language spatial gloss grammar (~400ms lag).' },
    { step: '4. Captions & Avatar', title: '3D Gesture & Captions', desc: 'Renders synchronized ISL 3D avatar animations alongside accessible live captions.' },
  ];

  return (
    <div className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-16">
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <h1 className="text-4xl font-extrabold text-text-primary tracking-tight">
          System Architecture & Pipeline Flow
        </h1>
        <p className="text-base text-text-secondary leading-relaxed">
          Transparent, deterministic content transformation engineered for zero information loss.
        </p>
      </div>

      {/* Pipeline Path 1: Static Document & Media Pipeline */}
      <section aria-labelledby="static-pipeline-heading" className="bg-surface-raised border border-border rounded-2xl p-6 sm:p-8 space-y-6 shadow-sm">
        <div className="border-b border-border pb-4">
          <span className="px-3 py-1 text-xs font-bold rounded-full bg-saathi-navy text-white uppercase tracking-wider">
            Static Pipeline Path
          </span>
          <h2 id="static-pipeline-heading" className="text-2xl font-extrabold text-text-primary mt-2">
            Documents, Slides & Recorded Media Transformation
          </h2>
        </div>

        {/* Accessible SVG / Visual Diagram */}
        <div role="img" aria-label="Labelled flowchart diagram showing document transformation from upload to personalized accessible rendering." className="hidden lg:block py-4">
          <div className="flex items-center justify-between gap-4 text-center">
            {staticPipeline.map((node, i) => (
              <React.Fragment key={i}>
                <div className="flex-1 p-4 rounded-xl bg-surface border border-border space-y-2">
                  <div className="text-xs font-bold text-accent">{node.step}</div>
                  <div className="font-extrabold text-sm text-text-primary">{node.title}</div>
                  <div className="text-[11px] text-text-secondary">{node.desc}</div>
                </div>
                {i < staticPipeline.length - 1 && (
                  <ArrowRight className="w-6 h-6 text-accent shrink-0" aria-hidden="true" />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Screen Reader Semantic Text Equivalent */}
        <ol className="space-y-4 font-sans text-xs">
          {staticPipeline.map((node, i) => (
            <li key={i} className="p-4 rounded-xl bg-surface border border-border space-y-1">
              <span className="font-bold text-accent block">{node.step}: {node.title}</span>
              <p className="text-text-primary text-sm leading-relaxed">{node.desc}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* Pipeline Path 2: Live Classroom Stream Pipeline */}
      <section aria-labelledby="live-pipeline-heading" className="bg-surface-raised border border-border rounded-2xl p-6 sm:p-8 space-y-6 shadow-sm">
        <div className="border-b border-border pb-4">
          <span className="px-3 py-1 text-xs font-bold rounded-full bg-saathi-blue text-white uppercase tracking-wider">
            Live Stream Pipeline Path
          </span>
          <h2 id="live-pipeline-heading" className="text-2xl font-extrabold text-text-primary mt-2">
            Real-Time Lecture Speech & Indian Sign Language (ISL) Stream
          </h2>
        </div>

        {/* Screen Reader Semantic Text Equivalent */}
        <ol className="space-y-4 font-sans text-xs">
          {livePipeline.map((node, i) => (
            <li key={i} className="p-4 rounded-xl bg-surface border border-border space-y-1">
              <span className="font-bold text-saathi-azure block">{node.step}: {node.title}</span>
              <p className="text-text-primary text-sm leading-relaxed">{node.desc}</p>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
};
