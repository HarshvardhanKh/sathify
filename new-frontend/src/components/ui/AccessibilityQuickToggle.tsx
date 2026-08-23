import React from 'react';
import { useAppStore } from '../../store/appStore';
import { ThemeType } from '../../types/domain';
import {
  Sun,
  Contrast,
  Volume2,
  VolumeX,
  Type,
  HelpCircle,
  Eye,
} from 'lucide-react';

interface AccessibilityQuickToggleProps {
  onOpenHotkeys?: () => void;
}

export const AccessibilityQuickToggle: React.FC<AccessibilityQuickToggleProps> = ({
  onOpenHotkeys,
}) => {
  const profile = useAppStore((s) => s.profile);
  const setTheme = useAppStore((s) => s.setTheme);
  const setFontScale = useAppStore((s) => s.setFontScale);
  const toggleDyslexiaMode = useAppStore((s) => s.toggleDyslexiaMode);
  const toggleHighContrast = useAppStore((s) => s.toggleHighContrast);
  const toggleTts = useAppStore((s) => s.toggleTts);

  const handleThemeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setTheme(e.target.value as ThemeType);
  };

  const handleScaleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setFontScale(val);
  };

  return (
    <nav
      id="quick-a11y-controls"
      aria-label="Global Accessibility Quick Controls"
      className="w-full bg-surface-raised border-b border-border px-4 py-2 flex flex-wrap items-center justify-between gap-3 text-xs shadow-sm"
    >
      <div className="flex items-center space-x-2">
        <span className="font-bold text-text-primary uppercase tracking-wider flex items-center space-x-1.5">
          <Eye className="w-4 h-4 text-accent" aria-hidden="true" />
          <span>A11y Quick Controls</span>
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        {/* Font Scale Control */}
        <div className="flex items-center space-x-2">
          <label htmlFor="font-scale-range" className="font-semibold text-text-primary flex items-center space-x-1">
            <Type className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Text Size:</span>
            <span className="font-mono text-accent">{Math.round(profile.fontScale * 100)}%</span>
          </label>
          <input
            id="font-scale-range"
            type="range"
            min="1.0"
            max="1.6"
            step="0.05"
            value={profile.fontScale}
            onChange={handleScaleChange}
            aria-valuemin={100}
            aria-valuemax={160}
            aria-valuenow={Math.round(profile.fontScale * 100)}
            aria-label="Adjust reading surface text scale from 100% to 160%"
            className="w-24 h-1.5 bg-border rounded-lg appearance-none cursor-pointer accent-accent focus-visible:ring-2"
          />
        </div>

        {/* Theme Selector */}
        <div className="flex items-center space-x-1.5">
          <label htmlFor="theme-select-top" className="font-semibold text-text-primary flex items-center space-x-1">
            <Sun className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Theme:</span>
          </label>
          <select
            id="theme-select-top"
            value={profile.theme}
            onChange={handleThemeChange}
            aria-label="Select color theme"
            className="bg-surface text-text-primary border border-border rounded px-2 py-1 font-semibold focus-visible:ring-2"
          >
            <option value="default">Default Light</option>
            <option value="dark">Saathi Dark</option>
            <option value="high-contrast">High Contrast (7:1)</option>
            <option value="warm-low-glare">Warm Low-Glare</option>
          </select>
        </div>

        {/* Dyslexia Mode Toggle */}
        <button
          onClick={toggleDyslexiaMode}
          aria-pressed={profile.dyslexiaMode}
          aria-label="Toggle dyslexia-friendly font and line spacing"
          className={`px-2.5 py-1 font-semibold rounded border transition-colors flex items-center space-x-1 ${
            profile.dyslexiaMode
              ? 'bg-accent text-accent-fg border-accent'
              : 'bg-surface text-text-primary border-border hover:bg-surface-raised'
          }`}
        >
          <span>Dyslexia Mode</span>
        </button>

        {/* High Contrast Toggle */}
        <button
          onClick={toggleHighContrast}
          aria-pressed={profile.highContrast}
          aria-label="Toggle pure high contrast mode"
          className={`p-1.5 font-semibold rounded border transition-colors flex items-center space-x-1 ${
            profile.highContrast
              ? 'bg-accent text-accent-fg border-accent'
              : 'bg-surface text-text-primary border-border hover:bg-surface-raised'
          }`}
          title="Toggle High Contrast"
        >
          <Contrast className="w-4 h-4" aria-hidden="true" />
          <span className="hidden sm:inline">High Contrast</span>
        </button>

        {/* TTS Master Toggle */}
        <button
          onClick={toggleTts}
          aria-pressed={profile.ttsEnabled}
          aria-label={profile.ttsEnabled ? 'Disable Text-to-Speech audio' : 'Enable Text-to-Speech audio'}
          className={`px-2.5 py-1 font-semibold rounded border transition-colors flex items-center space-x-1 ${
            profile.ttsEnabled
              ? 'bg-accent text-accent-fg border-accent'
              : 'bg-surface text-text-primary border-border hover:bg-surface-raised'
          }`}
        >
          {profile.ttsEnabled ? (
            <Volume2 className="w-3.5 h-3.5" aria-hidden="true" />
          ) : (
            <VolumeX className="w-3.5 h-3.5" aria-hidden="true" />
          )}
          <span>TTS {profile.ttsEnabled ? 'ON' : 'OFF'}</span>
        </button>

        {/* Keyboard Shortcuts Button */}
        {onOpenHotkeys && (
          <button
            onClick={onOpenHotkeys}
            aria-label="Open keyboard shortcuts sheet"
            className="p-1.5 font-semibold rounded border border-border bg-surface text-text-primary hover:bg-surface-raised flex items-center space-x-1"
            title="Keyboard Shortcuts (?)"
          >
            <HelpCircle className="w-4 h-4 text-accent" aria-hidden="true" />
            <span className="hidden md:inline">Shortcuts</span>
            <kbd className="hidden lg:inline-block px-1 text-[10px] bg-surface-raised border border-border rounded font-mono">?</kbd>
          </button>
        )}
      </div>
    </nav>
  );
};
