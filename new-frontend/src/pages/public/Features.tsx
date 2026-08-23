import React, { useState } from 'react';
import { Type, SlidersHorizontal, Calculator, UserCheck } from 'lucide-react';

export const Features: React.FC = () => {
  // Demo 1: Text-size & Dyslexia preview state
  const [demoScale, setDemoScale] = useState(1.2);
  const [demoDyslexia, setDemoDyslexia] = useState(false);

  // Demo 2: Before / After Simplification toggle
  const [simplificationLevel, setSimplificationLevel] = useState<'original' | 'simplified' | 'essential'>('original');

  const originalParagraph =
    "The Central Processing Unit executes arithmetic instructions via the Arithmetic Logic Unit (ALU) while leveraging multi-tiered register files and cache hierarchies to minimize instruction cycle latency.";

  const simplifiedParagraph =
    "The CPU is the computer's brain. It does math using the ALU and stores tiny data pieces in fast registers so it doesn't have to wait.";

  const essentialParagraph =
    "• CPU = Computer brain\n• ALU = Math executor\n• Registers = Super fast memory";

  return (
    <div className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-16">
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <h1 className="text-4xl font-extrabold text-text-primary tracking-tight">
          Interactive Capability Demonstrations
        </h1>
        <p className="text-base text-text-secondary leading-relaxed">
          Test real accessibility conversions directly on this page before configuring your student profile.
        </p>
      </div>

      {/* Demo 1: Live Text Scale & Dyslexia Typography Sandbox */}
      <section aria-label="Typography & Reading Scale Sandbox" className="bg-surface-raised border border-border rounded-2xl p-6 sm:p-8 space-y-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-accent text-accent-fg">
              <Type className="w-5 h-5" aria-hidden="true" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-text-primary">1. Typography & Text Scaling Sandbox</h2>
              <p className="text-xs text-text-secondary">Test custom font sizes and dyslexia font stack on live text</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-xs font-semibold">
            {/* Slider */}
            <div className="flex items-center space-x-2">
              <label htmlFor="demo-scale-slider" className="text-text-primary">Text Scale ({Math.round(demoScale * 100)}%):</label>
              <input
                id="demo-scale-slider"
                type="range"
                min="1.0"
                max="1.6"
                step="0.05"
                value={demoScale}
                onChange={(e) => setDemoScale(parseFloat(e.target.value))}
                className="w-28 h-2 bg-border rounded-lg appearance-none cursor-pointer accent-accent"
              />
            </div>

            {/* Dyslexia Toggle */}
            <button
              onClick={() => setDemoDyslexia(!demoDyslexia)}
              aria-pressed={demoDyslexia}
              className={`px-3 py-1.5 font-bold rounded-lg border transition-colors ${
                demoDyslexia
                  ? 'bg-accent text-accent-fg border-accent'
                  : 'bg-surface text-text-primary border-border hover:bg-surface-raised'
              }`}
            >
              Dyslexia Mode: {demoDyslexia ? 'ON' : 'OFF'}
            </button>
          </div>
        </div>

        {/* Live Preview Box */}
        <div
          className={`p-6 rounded-xl border border-border bg-surface text-text-primary transition-all ${
            demoDyslexia ? 'dyslexia-mode' : ''
          }`}
          style={{ fontSize: `${demoScale}rem`, lineHeight: demoDyslexia ? 1.8 : 1.6 }}
        >
          <p>
            This interactive paragraph demonstrates how SaathiFy dynamically scales reading text and adjusts letter spacing, line height, and font stack for students with visual strain or dyslexia.
          </p>
        </div>
      </section>

      {/* Demo 2: Before / After Text Simplification Toggle */}
      <section aria-label="Text Simplification Level Sandbox" className="bg-surface-raised border border-border rounded-2xl p-6 sm:p-8 space-y-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-accent text-accent-fg">
              <SlidersHorizontal className="w-5 h-5" aria-hidden="true" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-text-primary">2. Plain Language Complexity Simplification</h2>
              <p className="text-xs text-text-secondary">Compare complex academic text against simplified and essential versions</p>
            </div>
          </div>

          <div role="tablist" aria-label="Simplification Level Selector" className="flex items-center space-x-1 bg-surface p-1 border border-border rounded-xl">
            {(['original', 'simplified', 'essential'] as const).map((lvl) => (
              <button
                key={lvl}
                role="tab"
                aria-selected={simplificationLevel === lvl}
                onClick={() => setSimplificationLevel(lvl)}
                className={`px-3 py-1.5 text-xs font-bold capitalize rounded-lg transition-colors ${
                  simplificationLevel === lvl
                    ? 'bg-accent text-accent-fg shadow-xs'
                    : 'text-text-primary hover:bg-surface-raised'
                }`}
              >
                {lvl}
              </button>
            ))}
          </div>
        </div>

        <div className="p-6 rounded-xl border border-border bg-surface text-text-primary text-sm leading-relaxed whitespace-pre-line font-sans">
          {simplificationLevel === 'original' && (
            <div>
              <span className="font-bold text-xs uppercase tracking-wider text-saathi-navy block mb-2">Original Academic Passage:</span>
              <p className="italic text-text-secondary">{originalParagraph}</p>
            </div>
          )}

          {simplificationLevel === 'simplified' && (
            <div>
              <span className="font-bold text-xs uppercase tracking-wider text-accent block mb-2">Simplified Plain Language:</span>
              <p className="font-semibold text-text-primary">{simplifiedParagraph}</p>
            </div>
          )}

          {simplificationLevel === 'essential' && (
            <div>
              <span className="font-bold text-xs uppercase tracking-wider text-success block mb-2">Essential Bullet Points:</span>
              <p className="font-bold text-text-primary font-mono">{essentialParagraph}</p>
            </div>
          )}
        </div>
      </section>

      {/* Demo 3: Spoken Math & ISL Gloss Previews */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <section className="bg-surface-raised border border-border rounded-2xl p-6 space-y-4 shadow-sm">
          <div className="flex items-center space-x-2 text-accent">
            <Calculator className="w-5 h-5" />
            <h3 className="text-lg font-bold text-text-primary">3. Spoken Math Reader</h3>
          </div>
          <p className="text-xs text-text-secondary">
            Screen reader software reads equations as natural English speech instead of unreadable LaTeX.
          </p>
          <div className="p-4 bg-surface border border-border rounded-xl font-mono text-sm space-y-2">
            <div className="text-text-primary font-bold">T = I × CPI × Clock_Period</div>
            <div className="text-xs text-accent italic">
              <strong>Audio Output:</strong> "Total time equals instruction count times cycles per instruction times clock period."
            </div>
          </div>
        </section>

        <section className="bg-surface-raised border border-border rounded-2xl p-6 space-y-4 shadow-sm">
          <div className="flex items-center space-x-2 text-accent">
            <UserCheck className="w-5 h-5" />
            <h3 className="text-lg font-bold text-text-primary">4. ISL Sign Gloss Translator</h3>
          </div>
          <p className="text-xs text-text-secondary">
            Converts English sentences into Indian Sign Language spatial gloss grammar sequences.
          </p>
          <div className="p-4 bg-surface border border-border rounded-xl space-y-2">
            <div className="text-xs text-text-secondary font-medium">English: "The professor is explaining linear regression."</div>
            <div className="flex flex-wrap gap-1.5 pt-1">
              {['TEACHER', 'LINEAR', 'REGRESSION', 'MATH', 'EXPLAIN'].map((gt, i) => (
                <span key={i} className="px-2.5 py-1 text-xs font-mono font-bold rounded bg-saathi-navy text-white">
                  {gt}
                </span>
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};
