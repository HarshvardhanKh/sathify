import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../../store/appStore';
import { ThemeType } from '../../types/domain';
import { useAnnounce } from '../../hooks/useAnnounce';
import {
  Eye,
  Volume2,
  Radio,
  BookOpen,
  Pointer,
  Brain,
  Check,
  ArrowRight,
  ArrowLeft,
  Play,
  Sparkles,
} from 'lucide-react';

export type NeedCategory =
  | 'low-vision'
  | 'blind'
  | 'deaf'
  | 'dyslexia'
  | 'motor'
  | 'focus';

interface NeedCardDefinition {
  id: NeedCategory;
  title: string;
  desc: string;
  plainLanguageOutcome: string;
  icon: React.ElementType;
}

const NEED_CARDS: NeedCardDefinition[] = [
  {
    id: 'low-vision',
    title: 'Low Vision',
    desc: 'Difficulty reading small font sizes or low contrast text.',
    plainLanguageOutcome: 'We will enlarge reading text to 130% and highlight focus rings.',
    icon: Eye,
  },
  {
    id: 'blind',
    title: 'Blind / Screen Reader User',
    desc: 'Navigating primarily via screen reader or keyboard speech feedback.',
    plainLanguageOutcome: 'We will read pages aloud automatically, expand image descriptions, and turn off animations.',
    icon: Volume2,
  },
  {
    id: 'deaf',
    title: 'Deaf or Hard of Hearing',
    desc: 'Relying on captions or sign language visual translation.',
    plainLanguageOutcome: 'We will enable live lecture captions and pin the Indian Sign Language 3D avatar panel.',
    icon: Radio,
  },
  {
    id: 'dyslexia',
    title: 'Dyslexia',
    desc: 'Visual strain or letter crowding when reading standard typography.',
    plainLanguageOutcome: 'We will enable the Lexend dyslexia font stack, line spacing 1.8, and warm low-glare cream theme.',
    icon: BookOpen,
  },
  {
    id: 'motor',
    title: 'Motor Difficulty',
    desc: 'Difficulty with fine mouse control or precise clicking targets.',
    plainLanguageOutcome: 'We will enlarge interactive controls to minimum 44×44px hitboxes and enable voice dictation.',
    icon: Pointer,
  },
  {
    id: 'focus',
    title: 'Focus & Cognitive Load',
    desc: 'Overwhelmed by dense academic jargon or cluttered layouts.',
    plainLanguageOutcome: 'We will simplify academic passages into plain language and bullet point essential summaries.',
    icon: Brain,
  },
];

const LOCAL_STORAGE_KEY = 'saathify_onboarding_wizard_v1';

export const Onboarding: React.FC = () => {
  const [currentStep, setCurrentStep] = useState<number>(1);

  // Step 1: Selected Needs
  const [selectedNeeds, setSelectedNeeds] = useState<NeedCategory[]>([]);

  // Step 2: Reading Preferences
  const [readingScale, setReadingScale] = useState<number>(1.0);
  const [theme, setTheme] = useState<ThemeType>('default');
  const [dyslexiaMode, setDyslexiaMode] = useState<boolean>(false);
  const [lineSpacing, setLineSpacing] = useState<number>(1.6);

  // Step 3: Audio, Captions & ISL
  const [ttsSpeed, setTtsSpeed] = useState<number>(1.0);
  const [autoReadOnOpen, setAutoReadOnOpen] = useState<boolean>(false);
  const [captionSize, setCaptionSize] = useState<'normal' | 'large'>('normal');
  const [islPanelDefault, setIslPanelDefault] = useState<'hidden' | 'side-panel' | 'separate-window'>('side-panel');
  const [isPlayingVoiceTest, setIsPlayingVoiceTest] = useState<boolean>(false);

  const setProfile = useAppStore((s) => s.setProfile);
  const setStoreTheme = useAppStore((s) => s.setTheme);
  const setStoreFontScale = useAppStore((s) => s.setFontScale);

  const navigate = useNavigate();
  const { announce } = useAnnounce();

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.currentStep) setCurrentStep(parsed.currentStep);
        if (parsed.selectedNeeds) setSelectedNeeds(parsed.selectedNeeds);
        if (parsed.readingScale) setReadingScale(parsed.readingScale);
        if (parsed.theme) setTheme(parsed.theme);
        if (parsed.dyslexiaMode !== undefined) setDyslexiaMode(parsed.dyslexiaMode);
        if (parsed.lineSpacing) setLineSpacing(parsed.lineSpacing);
        if (parsed.ttsSpeed) setTtsSpeed(parsed.ttsSpeed);
        if (parsed.autoReadOnOpen !== undefined) setAutoReadOnOpen(parsed.autoReadOnOpen);
        if (parsed.captionSize) setCaptionSize(parsed.captionSize);
        if (parsed.islPanelDefault) setIslPanelDefault(parsed.islPanelDefault);
      }
    } catch {
      // Ignore localStorage errors
    }
  }, []);

  // Save state to localStorage on update
  useEffect(() => {
    try {
      const stateToSave = {
        currentStep,
        selectedNeeds,
        readingScale,
        theme,
        dyslexiaMode,
        lineSpacing,
        ttsSpeed,
        autoReadOnOpen,
        captionSize,
        islPanelDefault,
      };
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(stateToSave));
    } catch {
      // Ignore
    }
  }, [
    currentStep,
    selectedNeeds,
    readingScale,
    theme,
    dyslexiaMode,
    lineSpacing,
    ttsSpeed,
    autoReadOnOpen,
    captionSize,
    islPanelDefault,
  ]);

  // Toggle Need & Pre-configure downstream defaults
  const toggleNeed = (needId: NeedCategory) => {
    let nextNeeds: NeedCategory[];
    if (selectedNeeds.includes(needId)) {
      nextNeeds = selectedNeeds.filter((n) => n !== needId);
    } else {
      nextNeeds = [...selectedNeeds, needId];
    }
    setSelectedNeeds(nextNeeds);

    // Downstream default pre-configurations
    if (needId === 'deaf') {
      setIslPanelDefault('side-panel');
      setCaptionSize('large');
    }
    if (needId === 'dyslexia') {
      setTheme('warm-low-glare');
      setDyslexiaMode(true);
      setLineSpacing(1.8);
    }
    if (needId === 'blind') {
      setAutoReadOnOpen(true);
      setReadingScale(1.3);
    }
    if (needId === 'low-vision') {
      setTheme('high-contrast');
      setReadingScale(1.3);
    }
  };

  const handleNextStep = (e: React.FormEvent) => {
    e.preventDefault();
    const next = Math.min(4, currentStep + 1);
    setCurrentStep(next);
    announce(`Wizard Step ${next} of 4 loaded.`, 'polite');
  };

  const handlePrevStep = () => {
    const prev = Math.max(1, currentStep - 1);
    setCurrentStep(prev);
    announce(`Returned to Wizard Step ${prev} of 4.`, 'polite');
  };

  const handleCompleteWizard = () => {
    // Apply configurations to Zustand store
    setStoreTheme(theme);
    setStoreFontScale(readingScale);
    setProfile({
      dyslexiaMode,
      ttsEnabled: autoReadOnOpen,
      ttsSpeed,
      preferredCaptions: selectedNeeds.includes('deaf') ? 'isl' : 'standard',
    });

    announce('Accessibility profile saved! Launching student portal.', 'assertive');
    localStorage.removeItem(LOCAL_STORAGE_KEY);
    navigate('/dashboard');
  };

  const handleVoiceTest = () => {
    setIsPlayingVoiceTest(true);
    announce('Voice test sample: SaathiFy reads your educational content aloud with clarity.', 'polite');
    setTimeout(() => setIsPlayingVoiceTest(false), 2500);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 py-4">
      {/* Wizard Header & ARIA Step Progress */}
      <header className="space-y-4 border-b border-border pb-6">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-accent uppercase tracking-wider block">
              Step {currentStep} of 4
            </span>
            <h1 className="text-3xl font-extrabold text-text-primary tracking-tight">
              Accessibility Profile Setup Wizard
            </h1>
          </div>

          <button
            onClick={handleCompleteWizard}
            className="px-3 py-1.5 text-xs font-semibold border border-border rounded-lg bg-surface text-text-secondary hover:text-text-primary"
          >
            Skip Wizard
          </button>
        </div>

        {/* Step Indicator */}
        <nav aria-label="Wizard Steps Progress" className="flex items-center space-x-2">
          {['Needs', 'Reading', 'Audio & Captions', 'Summary'].map((stepLabel, idx) => {
            const stepNum = idx + 1;
            const isCurrent = currentStep === stepNum;
            const isCompleted = currentStep > stepNum;

            return (
              <div
                key={stepNum}
                aria-current={isCurrent ? 'step' : undefined}
                className={`flex-1 py-2 px-3 rounded-lg border text-xs font-bold transition-all flex items-center justify-between ${
                  isCurrent
                    ? 'border-accent bg-accent text-accent-fg shadow-xs'
                    : isCompleted
                    ? 'border-success bg-success/10 text-success'
                    : 'border-border bg-surface text-text-secondary'
                }`}
              >
                <span className="truncate">{stepNum}. {stepLabel}</span>
                {isCompleted && <Check className="w-3.5 h-3.5" />}
              </div>
            );
          })}
        </nav>
      </header>

      {/* STEP 1: NEEDS MULTI-SELECT CARDS */}
      {currentStep === 1 && (
        <form onSubmit={handleNextStep} className="space-y-6">
          <fieldset className="space-y-4">
            <legend className="text-lg font-bold text-text-primary mb-2">
              Select any learning needs that apply to you (Select all that apply, or skip):
            </legend>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {NEED_CARDS.map((card) => {
                const isSelected = selectedNeeds.includes(card.id);
                const Icon = card.icon;

                return (
                  <button
                    key={card.id}
                    type="button"
                    onClick={() => toggleNeed(card.id)}
                    aria-pressed={isSelected}
                    className={`p-5 rounded-2xl border text-left transition-all flex flex-col justify-between space-y-3 focus-visible:ring-2 ${
                      isSelected
                        ? 'border-accent bg-accent/10 shadow-md ring-2 ring-accent'
                        : 'border-border bg-surface-raised hover:bg-surface'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="w-10 h-10 rounded-xl bg-saathi-navy text-white flex items-center justify-center font-bold">
                        <Icon className="w-5 h-5" aria-hidden="true" />
                      </div>
                      <div
                        className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                          isSelected ? 'border-accent bg-accent text-accent-fg' : 'border-border'
                        }`}
                      >
                        {isSelected && <Check className="w-4 h-4" />}
                      </div>
                    </div>

                    <div>
                      <h2 className="font-extrabold text-base text-text-primary">{card.title}</h2>
                      <p className="text-xs text-text-secondary mt-1">{card.desc}</p>
                    </div>

                    <div className="p-2.5 rounded-lg bg-surface border border-border text-[11px] font-semibold text-accent leading-relaxed">
                      <strong>Outcome:</strong> {card.plainLanguageOutcome}
                    </div>
                  </button>
                );
              })}
            </div>
          </fieldset>

          <div className="flex justify-end pt-4">
            <button
              type="submit"
              className="px-6 py-3 font-bold text-sm rounded-xl bg-accent text-accent-fg hover:opacity-90 flex items-center space-x-2 shadow-sm"
            >
              <span>Continue to Reading Setup</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      )}

      {/* STEP 2: READING & LIVE PREVIEW PANE */}
      {currentStep === 2 && (
        <form onSubmit={handleNextStep} className="space-y-6">
          <fieldset className="space-y-6">
            <legend className="text-lg font-bold text-text-primary">
              Configure Reading Scale & Typography
            </legend>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Controls Column */}
              <div className="bg-surface-raised border border-border rounded-xl p-5 space-y-4 shadow-xs">
                {/* Scale */}
                <div className="space-y-2">
                  <label htmlFor="wizard-scale-range" className="text-xs font-bold text-text-primary flex justify-between">
                    <span>Reading Font Scale:</span>
                    <span className="font-mono text-accent">{Math.round(readingScale * 100)}%</span>
                  </label>
                  <input
                    id="wizard-scale-range"
                    type="range"
                    min="1.0"
                    max="1.6"
                    step="0.05"
                    value={readingScale}
                    onChange={(e) => setReadingScale(parseFloat(e.target.value))}
                    className="w-full h-2 bg-border rounded-lg appearance-none cursor-pointer accent-accent"
                  />
                </div>

                {/* Theme */}
                <div className="space-y-2">
                  <label htmlFor="wizard-theme-select" className="text-xs font-bold text-text-primary block">
                    Color Theme:
                  </label>
                  <select
                    id="wizard-theme-select"
                    value={theme}
                    onChange={(e) => setTheme(e.target.value as ThemeType)}
                    className="w-full bg-surface text-text-primary border border-border rounded-lg p-2 text-xs font-semibold focus-visible:ring-2"
                  >
                    <option value="default">Default Light Theme</option>
                    <option value="dark">Saathi Dark Theme</option>
                    <option value="high-contrast">High Contrast Mode (7:1)</option>
                    <option value="warm-low-glare">Warm Low-Glare Cream</option>
                  </select>
                </div>

                {/* Dyslexia Toggle */}
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => setDyslexiaMode(!dyslexiaMode)}
                    aria-pressed={dyslexiaMode}
                    className={`w-full py-2 px-3 font-bold text-xs rounded-lg border transition-colors ${
                      dyslexiaMode
                        ? 'bg-accent text-accent-fg border-accent'
                        : 'bg-surface text-text-primary border-border'
                    }`}
                  >
                    Dyslexia Font Stack: {dyslexiaMode ? 'ENABLED' : 'DISABLED'}
                  </button>
                </div>
              </div>

              {/* LIVE PREVIEW PANE */}
              <div className="bg-surface border border-border rounded-xl p-5 shadow-xs space-y-3">
                <div className="text-xs font-bold uppercase tracking-wider text-accent border-b border-border pb-2">
                  Live Reading Surface Preview
                </div>

                <div
                  className={`space-y-3 ${dyslexiaMode ? 'dyslexia-mode' : ''}`}
                  style={{ fontSize: `${readingScale}rem`, lineHeight: dyslexiaMode ? 1.8 : lineSpacing }}
                >
                  <h3 className="font-extrabold text-text-primary text-base">
                    1. Binary Search Trees & Memory
                  </h3>
                  <p className="text-text-primary leading-relaxed">
                    Binary search trees maintain sorted keys in hierarchical node positions to allow fast logarithmic searching.
                  </p>
                  <div className="p-3 bg-surface-raised border border-border rounded-lg text-xs space-y-1">
                    <span className="font-bold text-accent block">[Figure 1.1 Diagram Alt]:</span>
                    <span className="text-text-secondary font-medium">
                      Root node (value 50) branches into left child (25) and right child (75).
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </fieldset>

          <div className="flex justify-between pt-4">
            <button
              type="button"
              onClick={handlePrevStep}
              className="px-5 py-2.5 font-bold text-xs rounded-xl border border-border bg-surface text-text-primary hover:bg-surface-raised flex items-center space-x-1"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>

            <button
              type="submit"
              className="px-6 py-2.5 font-bold text-xs rounded-xl bg-accent text-accent-fg hover:opacity-90 flex items-center space-x-1"
            >
              <span>Continue to Audio & Captions</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      )}

      {/* STEP 3: AUDIO, CAPTIONS & ISL */}
      {currentStep === 3 && (
        <form onSubmit={handleNextStep} className="space-y-6">
          <fieldset className="space-y-6">
            <legend className="text-lg font-bold text-text-primary">
              Configure Audio Reader, Captions & Sign Language
            </legend>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
              {/* TTS Speed & Voice Preview */}
              <div className="bg-surface-raised border border-border rounded-xl p-5 space-y-4">
                <h3 className="font-bold text-sm text-text-primary border-b border-border pb-2">
                  Speech Rate & Auto-Read
                </h3>

                <div className="space-y-2">
                  <label htmlFor="wizard-tts-speed" className="font-bold text-text-primary flex justify-between">
                    <span>Speech Rate Speed:</span>
                    <span className="font-mono text-accent">{ttsSpeed}x</span>
                  </label>
                  <input
                    id="wizard-tts-speed"
                    type="range"
                    min="0.5"
                    max="2.0"
                    step="0.25"
                    value={ttsSpeed}
                    onChange={(e) => setTtsSpeed(parseFloat(e.target.value))}
                    className="w-full h-2 bg-border rounded-lg appearance-none cursor-pointer accent-accent"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleVoiceTest}
                  disabled={isPlayingVoiceTest}
                  className="w-full py-2.5 font-bold rounded-lg bg-accent text-accent-fg hover:opacity-90 flex items-center justify-center space-x-2"
                >
                  <Play className="w-4 h-4" />
                  <span>{isPlayingVoiceTest ? 'Playing Voice Test...' : 'Preview Voice Reader'}</span>
                </button>

                <div className="flex items-center space-x-2 pt-2">
                  <input
                    id="auto-read-check"
                    type="checkbox"
                    checked={autoReadOnOpen}
                    onChange={(e) => setAutoReadOnOpen(e.target.checked)}
                    className="w-4 h-4 accent-accent rounded"
                  />
                  <label htmlFor="auto-read-check" className="font-semibold text-text-primary">
                    Auto-read documents aloud upon opening
                  </label>
                </div>
              </div>

              {/* Captions & ISL Panel Default */}
              <div className="bg-surface-raised border border-border rounded-xl p-5 space-y-4">
                <h3 className="font-bold text-sm text-text-primary border-b border-border pb-2">
                  Captions & Indian Sign Language
                </h3>

                <div className="space-y-2">
                  <label htmlFor="wizard-caption-size" className="font-bold text-text-primary block">
                    Live Stream Caption Size:
                  </label>
                  <select
                    id="wizard-caption-size"
                    value={captionSize}
                    onChange={(e) => setCaptionSize(e.target.value as any)}
                    className="w-full bg-surface border border-border rounded-lg p-2 font-semibold text-text-primary"
                  >
                    <option value="normal">Standard Caption Text</option>
                    <option value="large">Enlarged High-Visibility Captions</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label htmlFor="wizard-isl-default" className="font-bold text-text-primary block">
                    ISL 3D Avatar Panel Default State:
                  </label>
                  <select
                    id="wizard-isl-default"
                    value={islPanelDefault}
                    onChange={(e) => setIslPanelDefault(e.target.value as any)}
                    className="w-full bg-surface border border-border rounded-lg p-2 font-semibold text-text-primary"
                  >
                    <option value="side-panel">Pinned Side Panel (Recommended)</option>
                    <option value="hidden">Hidden by Default</option>
                    <option value="separate-window">Popout Separate Window</option>
                  </select>
                </div>
              </div>
            </div>
          </fieldset>

          <div className="flex justify-between pt-4">
            <button
              type="button"
              onClick={handlePrevStep}
              className="px-5 py-2.5 font-bold text-xs rounded-xl border border-border bg-surface text-text-primary hover:bg-surface-raised flex items-center space-x-1"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>

            <button
              type="submit"
              className="px-6 py-2.5 font-bold text-xs rounded-xl bg-accent text-accent-fg hover:opacity-90 flex items-center space-x-1"
            >
              <span>View Profile Summary</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      )}

      {/* STEP 4: SUMMARY & SAVE */}
      {currentStep === 4 && (
        <div className="space-y-6">
          <div className="bg-surface-raised border border-border rounded-2xl p-6 sm:p-8 space-y-6 shadow-sm">
            <div className="border-b border-border pb-4">
              <span className="text-xs font-bold text-success uppercase tracking-wider block mb-1">
                Profile Configuration Ready
              </span>
              <h2 className="text-2xl font-extrabold text-text-primary">
                Plain-Language Profile Recap
              </h2>
            </div>

            <div className="space-y-4 text-sm font-sans">
              <div className="p-4 rounded-xl bg-surface border border-border space-y-2">
                <span className="font-bold text-accent block text-xs uppercase tracking-wider">
                  Selected Accessibility Needs:
                </span>
                <p className="text-text-primary font-semibold">
                  {selectedNeeds.length > 0
                    ? selectedNeeds.map((n) => NEED_CARDS.find((c) => c.id === n)?.title).join(' • ')
                    : 'Standard Accessible Defaults'}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="p-3 rounded-lg bg-surface border border-border">
                  <strong className="block text-text-primary">Color Theme:</strong>
                  <span className="text-text-secondary capitalize">{theme}</span>
                </div>
                <div className="p-3 rounded-lg bg-surface border border-border">
                  <strong className="block text-text-primary">Text Scale:</strong>
                  <span className="text-text-secondary font-mono">{Math.round(readingScale * 100)}%</span>
                </div>
                <div className="p-3 rounded-lg bg-surface border border-border">
                  <strong className="block text-text-primary">Dyslexia Typography:</strong>
                  <span className="text-text-secondary">{dyslexiaMode ? 'Enabled' : 'Disabled'}</span>
                </div>
                <div className="p-3 rounded-lg bg-surface border border-border">
                  <strong className="block text-text-primary">ISL Sign Panel:</strong>
                  <span className="text-text-secondary capitalize">{islPanelDefault.replace('-', ' ')}</span>
                </div>
              </div>

              <p className="text-xs text-text-secondary italic">
                You can change any of these settings later anytime in the <strong>A11y Settings</strong> menu.
              </p>
            </div>
          </div>

          <div className="flex justify-between pt-2">
            <button
              type="button"
              onClick={handlePrevStep}
              className="px-5 py-2.5 font-bold text-xs rounded-xl border border-border bg-surface text-text-primary hover:bg-surface-raised flex items-center space-x-1"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>

            <button
              onClick={handleCompleteWizard}
              className="px-8 py-3.5 font-bold text-sm rounded-xl bg-accent text-accent-fg hover:opacity-90 flex items-center space-x-2 shadow-md"
            >
              <Sparkles className="w-5 h-5" />
              <span>Save & Launch Student Portal</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
