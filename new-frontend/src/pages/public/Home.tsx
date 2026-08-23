import React from 'react';
import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import {
  Sparkles,
  Eye,
  ArrowRight,
  ShieldCheck,
  Sliders,
  FileText,
  Volume2,
  Radio,
  BookOpen,
  Brain,
  Pointer,
} from 'lucide-react';

export const Home: React.FC = () => {
  const shouldReduceMotion = useReducedMotion();

  const animationVariant = shouldReduceMotion
    ? { initial: { opacity: 1, y: 0 }, animate: { opacity: 1, y: 0 } }
    : { initial: { opacity: 0, y: 8 }, animate: { opacity: 1, y: 0 } };

  const needsList = [
    { title: 'Low Vision', desc: 'Custom text scaling, high-contrast palette, and customizable font weights.', icon: Eye },
    { title: 'Blind / Screen Reader User', desc: 'Semantic HTML markup, spoken math formulas, and tactile diagram descriptions.', icon: Volume2 },
    { title: 'Deaf or Hard of Hearing', desc: 'Real-time Indian Sign Language (ISL) gloss captions and 3D avatar gestures.', icon: Radio },
    { title: 'Dyslexia', desc: 'Lexend dyslexia font stack, line height 1.8, and warm low-glare reading backgrounds.', icon: BookOpen },
    { title: 'Motor Difficulty', desc: 'Full keyboard navigation (100% Tab-reachable), Alt hotkeys, and voice dictation.', icon: Pointer },
    { title: 'Focus & Cognitive Load', desc: 'Text complexity simplification (Original, Simplified, Essential) and clean UI.', icon: Brain },
  ];

  return (
    <div className="space-y-20 py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Hero Section */}
      <motion.section
        initial={animationVariant.initial}
        whileInView={animationVariant.animate}
        viewport={{ once: true }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-saathi-navy via-saathi-blue to-saathi-ink text-white p-8 sm:p-14 shadow-2xl border border-saathi-azure/30"
      >
        <div className="relative z-10 max-w-3xl space-y-6">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-saathi-sky/20 border border-saathi-sky/40 text-saathi-sky text-xs font-bold uppercase tracking-wider">
            <ShieldCheck className="w-4 h-4" aria-hidden="true" />
            <span>WCAG 2.2 Level AA Build Standard</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-black tracking-tight leading-tight">
            Your course material, in the format you <span className="text-saathi-amber">actually learn from</span>.
          </h1>

          <p className="text-lg sm:text-xl text-saathi-mist font-medium leading-relaxed">
            SaathiFy automatically converts educational PDFs, slides, recorded lectures, and live classroom streams into accessible, personalized formats for students with visual, hearing, motor, or learning difficulties.
          </p>

          <div className="flex flex-wrap gap-4 pt-2">
            <Link
              to="/onboarding"
              className="px-6 py-3.5 rounded-xl font-bold bg-saathi-amber text-saathi-ink hover:bg-saathi-amber/90 transition-all shadow-lg flex items-center space-x-2 text-base"
            >
              <Sparkles className="w-5 h-5" aria-hidden="true" />
              <span>Configure Accessibility Profile</span>
            </Link>

            <Link
              to="/dashboard"
              className="px-6 py-3.5 rounded-xl font-bold border border-white/30 bg-white/10 hover:bg-white/20 transition-all flex items-center space-x-2 text-base"
            >
              <span>Launch Student Portal</span>
              <ArrowRight className="w-5 h-5" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </motion.section>

      {/* Four Capability Mock Frames */}
      <section aria-label="Core Multimodal Conversion Capabilities" className="space-y-12">
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <h2 className="text-3xl font-extrabold text-text-primary tracking-tight">
            Four Core Multimodal Capabilities
          </h2>
          <p className="text-sm text-text-secondary leading-relaxed">
            Real accessibility solutions engineered to eliminate barriers across all educational formats.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Capability 1: Accessible Conversion */}
          <motion.div
            initial={animationVariant.initial}
            whileInView={animationVariant.animate}
            viewport={{ once: true }}
            transition={{ duration: 0.2 }}
            className="bg-surface-raised border border-border rounded-2xl p-6 shadow-sm space-y-4 flex flex-col justify-between"
          >
            <div className="space-y-2">
              <div className="w-10 h-10 rounded-xl bg-saathi-navy text-white flex items-center justify-center font-bold">
                <FileText className="w-5 h-5" aria-hidden="true" />
              </div>
              <h3 className="text-xl font-bold text-text-primary">1. Document & Slide Conversion</h3>
              <p className="text-xs text-text-secondary leading-relaxed">
                Extracts semantic headings, math formulas, and complex tables from PDFs and PowerPoint decks into structured screen-reader markup.
              </p>
            </div>

            {/* UI Mock Frame */}
            <div className="bg-surface border border-border rounded-xl p-4 text-xs space-y-2 font-mono">
              <div className="text-accent font-bold"># Heading 1: Data Structures</div>
              <div className="text-text-primary">Paragraph: Stacks use Last-In First-Out (LIFO)...</div>
              <div className="p-2 bg-saathi-mist/30 rounded text-[11px] text-text-secondary">
                [Math Formula]: Spoken Math: "Total execution time equals instruction count times CPI"
              </div>
            </div>
          </motion.div>

          {/* Capability 2: Read-Aloud & Figure Descriptions */}
          <motion.div
            initial={animationVariant.initial}
            whileInView={animationVariant.animate}
            viewport={{ once: true }}
            transition={{ duration: 0.2, delay: 0.05 }}
            className="bg-surface-raised border border-border rounded-2xl p-6 shadow-sm space-y-4 flex flex-col justify-between"
          >
            <div className="space-y-2">
              <div className="w-10 h-10 rounded-xl bg-saathi-navy text-white flex items-center justify-center font-bold">
                <Volume2 className="w-5 h-5" aria-hidden="true" />
              </div>
              <h3 className="text-xl font-bold text-text-primary">2. Read-Aloud & Image Descriptions</h3>
              <p className="text-xs text-text-secondary leading-relaxed">
                Text-to-speech audio reader paired with extended architectural image descriptions and tabular data series breakdowns.
              </p>
            </div>

            {/* UI Mock Frame */}
            <div className="bg-surface border border-border rounded-xl p-4 text-xs space-y-2">
              <div className="flex items-center justify-between text-accent font-bold">
                <span>Figure 2.1: CPU Memory Hierarchy</span>
                <span className="px-1.5 py-0.5 rounded bg-saathi-navy text-white text-[10px]">DIAGRAM</span>
              </div>
              <p className="text-text-secondary italic text-[11px]">
                "Data moves from Register A (0.5ns latency) into the V-shaped Arithmetic Logic Unit..."
              </p>
            </div>
          </motion.div>

          {/* Capability 3: Live Captions with ISL */}
          <motion.div
            initial={animationVariant.initial}
            whileInView={animationVariant.animate}
            viewport={{ once: true }}
            transition={{ duration: 0.2, delay: 0.1 }}
            className="bg-surface-raised border border-border rounded-2xl p-6 shadow-sm space-y-4 flex flex-col justify-between"
          >
            <div className="space-y-2">
              <div className="w-10 h-10 rounded-xl bg-saathi-navy text-white flex items-center justify-center font-bold">
                <Radio className="w-5 h-5" aria-hidden="true" />
              </div>
              <h3 className="text-xl font-bold text-text-primary">3. Live Captions & 3D ISL Avatar</h3>
              <p className="text-xs text-text-secondary leading-relaxed">
                Streams live classroom speech into real-time Indian Sign Language (ISL) spatial gloss tokens and synchronized 3D gestures.
              </p>
            </div>

            {/* UI Mock Frame */}
            <div className="bg-surface border border-border rounded-xl p-4 text-xs space-y-2">
              <div className="text-xs font-bold text-text-primary">Prof. Roy: "Welcome to today's lecture on algorithms."</div>
              <div className="flex flex-wrap gap-1 pt-1">
                {['WELCOME', 'STUDENT', 'TODAY', 'LECTURE', 'ALGORITHM'].map((gt, i) => (
                  <span key={i} className="px-2 py-0.5 font-mono font-bold text-[10px] bg-saathi-navy text-white rounded">
                    {gt}
                  </span>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Capability 4: Simplified Learning Mode */}
          <motion.div
            initial={animationVariant.initial}
            whileInView={animationVariant.animate}
            viewport={{ once: true }}
            transition={{ duration: 0.2, delay: 0.15 }}
            className="bg-surface-raised border border-border rounded-2xl p-6 shadow-sm space-y-4 flex flex-col justify-between"
          >
            <div className="space-y-2">
              <div className="w-10 h-10 rounded-xl bg-saathi-navy text-white flex items-center justify-center font-bold">
                <Sliders className="w-5 h-5" aria-hidden="true" />
              </div>
              <h3 className="text-xl font-bold text-text-primary">4. Text Complexity Simplification</h3>
              <p className="text-xs text-text-secondary leading-relaxed">
                Transforms dense academic jargon into Original, Simplified plain language, or Essential bullet point takeaways.
              </p>
            </div>

            {/* UI Mock Frame */}
            <div className="bg-surface border border-border rounded-xl p-4 text-xs space-y-2">
              <div className="flex items-center space-x-1 font-bold text-accent">
                <span className="px-2 py-0.5 bg-accent text-accent-fg rounded text-[10px]">SIMPLIFIED</span>
              </div>
              <p className="text-text-primary font-medium text-[11px] leading-relaxed">
                "The CPU is the brain of the computer. It has tiny super-fast storage spots called registers."
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Built For 6 Needs Strip */}
      <section aria-label="Accessibility Profiles Served" className="space-y-8 border-t border-border pt-12">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <h2 className="text-3xl font-extrabold text-text-primary tracking-tight">
            Built for Your Specific Learning Need
          </h2>
          <p className="text-sm text-text-secondary">
            SaathiFy adapts layout, typography, controls, and audio to fit how you actually learn.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {needsList.map((need, idx) => {
            const Icon = need.icon;
            return (
              <motion.div
                key={idx}
                initial={animationVariant.initial}
                whileInView={animationVariant.animate}
                viewport={{ once: true }}
                transition={{ duration: 0.2, delay: idx * 0.03 }}
                className="bg-surface-raised border border-border p-5 rounded-2xl space-y-3 shadow-xs"
              >
                <div className="w-10 h-10 rounded-xl bg-saathi-navy/10 text-accent flex items-center justify-center font-bold">
                  <Icon className="w-5 h-5" aria-hidden="true" />
                </div>
                <h3 className="text-base font-bold text-text-primary">{need.title}</h3>
                <p className="text-xs text-text-secondary leading-relaxed">{need.desc}</p>
              </motion.div>
            );
          })}
        </div>
      </section>
    </div>
  );
};
