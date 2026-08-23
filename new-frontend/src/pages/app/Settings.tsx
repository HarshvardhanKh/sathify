import React, { useState } from 'react';
import { useAppStore } from '../../store/appStore';
import { ThemeType } from '../../types/domain';
import { HOTKEY_DEFINITIONS } from '../../hooks/useGlobalHotkeys';
import { useAnnounce } from '../../hooks/useAnnounce';
import { useSwitchAccess } from '../../hooks/useSwitchAccess';
import { useVoiceCommands } from '../../hooks/useVoiceCommands';
import { api } from '../../services/api';
import {
  Sun,
  Volume2,
  Keyboard,
  Wifi,
  Download,
  RotateCcw,
  CheckCircle2,
  XCircle,
  MousePointerClick,
  Mic,
} from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const profile = useAppStore((s) => s.profile);
  const setProfile = useAppStore((s) => s.setProfile);
  const setTheme = useAppStore((s) => s.setTheme);
  const setFontScale = useAppStore((s) => s.setFontScale);
  const toggleDyslexiaMode = useAppStore((s) => s.toggleDyslexiaMode);
  const toggleHighContrast = useAppStore((s) => s.toggleHighContrast);

  const [wsUrl] = useState<string>('ws://localhost:8000/ws/live');
  const [apiBaseUrl] = useState<string>('http://localhost:8000/api');
  const [connectionStatus, setConnectionStatus] = useState<'unknown' | 'ok' | 'failed'>('unknown');

  const { announce } = useAnnounce();
  const { mode: switchAccessMode, setMode: setSwitchAccessMode } = useSwitchAccess();
  const { status: voiceStatus, lastHeard, enable: enableVoice, disable: disableVoice, isListening } = useVoiceCommands();

  const handleTestConnection = async () => {
    const result = await api.getStatus();
    if (result.ok) {
      setConnectionStatus('ok');
      announce('Backend connection test passed — real response received from FastAPI.', 'polite');
    } else {
      setConnectionStatus('failed');
      announce(`Backend connection test failed: ${result.error.message}`, 'assertive');
    }
  };

  const handleExportProfileJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(profile, null, 2));
    const dlAnchor = document.createElement('a');
    dlAnchor.setAttribute('href', dataStr);
    dlAnchor.setAttribute('download', 'saathify-profile.json');
    document.body.appendChild(dlAnchor);
    dlAnchor.click();
    dlAnchor.remove();
    announce('Accessibility profile exported as JSON file.', 'polite');
  };

  const handleResetProfile = () => {
    setTheme('default');
    setFontScale(1.0);
    setProfile({
      dyslexiaMode: false,
      highContrast: false,
      ttsEnabled: true,
      ttsSpeed: 1.0,
      preferredCaptions: 'standard',
    });
    announce('Accessibility settings reset to defaults.', 'polite');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 py-2">
      <div className="border-b border-border pb-4">
        <h1 className="text-3xl font-extrabold text-text-primary tracking-tight">
          Accessibility Settings & Configuration
        </h1>
        <p className="text-xs text-text-secondary">
          Every control applies immediately without saving. Changes persist automatically to your browser session.
        </p>
      </div>

      {/* SECTION 1 & 2: ACCESSIBILITY PROFILE & READING TYPOGRAPHY */}
      <fieldset className="bg-surface-raised border border-border rounded-xl p-6 space-y-5 shadow-xs">
        <legend className="px-2 font-extrabold text-base text-text-primary flex items-center space-x-2">
          <Sun className="w-5 h-5 text-accent" />
          <span>1. Accessibility & Reading Typography</span>
        </legend>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-sm">
          {/* Theme Selector */}
          <div className="space-y-1.5">
            <label htmlFor="theme-select-settings" className="font-bold text-text-primary block">
              Active Color Theme:
            </label>
            <select
              id="theme-select-settings"
              value={profile.theme}
              onChange={(e) => {
                setTheme(e.target.value as ThemeType);
                announce(`Color theme changed to ${e.target.value}.`, 'polite');
              }}
              aria-describedby="theme-help-text"
              className="w-full bg-surface text-text-primary border border-border rounded-lg p-2.5 font-semibold focus-visible:ring-2"
            >
              <option value="default">Default Light Theme (#FDFDFD)</option>
              <option value="dark">Saathi Dark Theme (#0A1633)</option>
              <option value="high-contrast">High Contrast Mode (7:1 Black/White)</option>
              <option value="warm-low-glare">Warm Low-Glare Cream (#FDFBF7)</option>
            </select>
            <p id="theme-help-text" className="text-xs text-text-secondary">
              Theme changes swap background and text contrast ratios instantly across all pages.
            </p>
          </div>

          {/* Reading Scale Slider */}
          <div className="space-y-1.5">
            <label htmlFor="scale-range-settings" className="font-bold text-text-primary flex justify-between">
              <span>Reading Font Scale:</span>
              <span className="font-mono text-accent">{Math.round(profile.fontScale * 100)}%</span>
            </label>
            <input
              id="scale-range-settings"
              type="range"
              min="1.0"
              max="1.6"
              step="0.05"
              value={profile.fontScale}
              onChange={(e) => {
                const val = parseFloat(e.target.value);
                setFontScale(val);
                announce(`Text font scale set to ${Math.round(val * 100)} percent.`, 'polite');
              }}
              aria-describedby="scale-help-text"
              className="w-full h-2 bg-border rounded-lg appearance-none cursor-pointer accent-accent"
            />
            <p id="scale-help-text" className="text-xs text-text-secondary">
              Scales reading text surface size seamlessly from 100% to 160%.
            </p>
          </div>
        </div>

        <div className="pt-2 flex flex-wrap gap-4">
          <button
            type="button"
            onClick={toggleDyslexiaMode}
            aria-pressed={profile.dyslexiaMode}
            className={`px-4 py-2 font-bold text-xs rounded-lg border transition-colors ${
              profile.dyslexiaMode
                ? 'bg-accent text-accent-fg border-accent'
                : 'bg-surface text-text-primary border-border hover:bg-surface-raised'
            }`}
          >
            Dyslexia Mode Font: {profile.dyslexiaMode ? 'ENABLED' : 'DISABLED'}
          </button>

          <button
            type="button"
            onClick={toggleHighContrast}
            aria-pressed={profile.highContrast}
            className={`px-4 py-2 font-bold text-xs rounded-lg border transition-colors ${
              profile.highContrast
                ? 'bg-accent text-accent-fg border-accent'
                : 'bg-surface text-text-primary border-border hover:bg-surface-raised'
            }`}
          >
            High Contrast Mode: {profile.highContrast ? 'ACTIVE' : 'INACTIVE'}
          </button>
        </div>

        {/* LIVE PREVIEW REGION */}
        <div
          role="region"
          aria-label="Live Settings Preview Region"
          className="p-4 rounded-xl border border-border bg-surface text-text-primary space-y-2 mt-4"
        >
          <span className="text-[11px] font-bold uppercase tracking-wider text-accent block border-b border-border pb-1">
            Live Reading Settings Preview Region
          </span>
          <p
            className={`text-sm leading-relaxed ${profile.dyslexiaMode ? 'dyslexia-mode' : ''}`}
            style={{ fontSize: `${profile.fontScale}rem` }}
          >
            This text updates immediately to reflect your active font scale, theme contrast, and dyslexia typography settings.
          </p>
        </div>
      </fieldset>

      {/* SECTION 3 & 4: AUDIO, CAPTIONS, ISL & AVATAR */}
      <fieldset className="bg-surface-raised border border-border rounded-xl p-6 space-y-5 shadow-xs">
        <legend className="px-2 font-extrabold text-base text-text-primary flex items-center space-x-2">
          <Volume2 className="w-5 h-5 text-accent" />
          <span>2. Audio Reader, Captions & Sign Language</span>
        </legend>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-sm">
          <div className="space-y-1.5">
            <label htmlFor="settings-caption-pref" className="font-bold text-text-primary block">
              Default Live Lecture Captions:
            </label>
            <select
              id="settings-caption-pref"
              value={profile.preferredCaptions}
              onChange={(e) => setProfile({ preferredCaptions: e.target.value as any })}
              className="w-full bg-surface text-text-primary border border-border rounded-lg p-2.5 font-semibold focus-visible:ring-2"
            >
              <option value="standard">Standard ASR Text Captions</option>
              <option value="isl">Indian Sign Language (ISL) Gloss</option>
              <option value="simplified">Simplified Plain Language Captions</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="settings-tts-rate" className="font-bold text-text-primary block">
              Speech Reader Rate Speed:
            </label>
            <select
              id="settings-tts-rate"
              value={profile.ttsSpeed}
              onChange={(e) => setProfile({ ttsSpeed: parseFloat(e.target.value) })}
              className="w-full bg-surface text-text-primary border border-border rounded-lg p-2.5 font-semibold focus-visible:ring-2"
            >
              <option value={0.75}>0.75x (Slower)</option>
              <option value={1.0}>1.0x (Standard)</option>
              <option value={1.25}>1.25x (Faster)</option>
              <option value={1.5}>1.5x (Fast Reader)</option>
            </select>
          </div>
        </div>
      </fieldset>

      {/* SECTION 5: KEYBOARD SHORTCUTS REFERENCE TABLE */}
      <fieldset className="bg-surface-raised border border-border rounded-xl p-6 space-y-4 shadow-xs">
        <legend className="px-2 font-extrabold text-base text-text-primary flex items-center space-x-2">
          <Keyboard className="w-5 h-5 text-accent" />
          <span>3. Keyboard Shortcuts Reference Table</span>
        </legend>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-surface border-b border-border text-text-secondary font-bold">
                <th scope="col" className="p-3">Shortcut Key</th>
                <th scope="col" className="p-3">Action Name</th>
                <th scope="col" className="p-3">Description</th>
                <th scope="col" className="p-3">Category</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {HOTKEY_DEFINITIONS.map((def, idx) => (
                <tr key={idx} className="hover:bg-surface/50">
                  <td className="p-3">
                    <kbd className="px-2 py-1 font-mono font-bold bg-surface border border-border rounded text-accent shadow-xs">
                      {def.keyCombo}
                    </kbd>
                  </td>
                  <td className="p-3 font-bold text-text-primary">{def.actionName}</td>
                  <td className="p-3 text-text-secondary">{def.description}</td>
                  <td className="p-3 font-semibold">{def.category}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </fieldset>

      {/* SECTION 6: BACKEND CONNECTION TEST */}
      <fieldset className="bg-surface-raised border border-border rounded-xl p-6 space-y-5 shadow-xs">
        <legend className="px-2 font-extrabold text-base text-text-primary flex items-center space-x-2">
          <Wifi className="w-5 h-5 text-accent" />
          <span>4. Backend Connection Settings</span>
        </legend>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="space-y-1">
            <label htmlFor="ws-url-input" className="font-bold text-text-primary block">
              WebSocket Server Endpoint:
            </label>
            <input
              id="ws-url-input"
              type="text"
              value={wsUrl}
              readOnly
              className="w-full p-2.5 rounded-lg border border-border bg-surface text-text-primary font-mono focus-visible:ring-2"
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="api-url-input" className="font-bold text-text-primary block">
              REST API Base Endpoint:
            </label>
            <input
              id="api-url-input"
              type="text"
              value={apiBaseUrl}
              readOnly
              className="w-full p-2.5 rounded-lg border border-border bg-surface text-text-primary font-mono focus-visible:ring-2"
            />
          </div>
        </div>

        <div className="pt-2 flex items-center justify-between">
          <div
            className={`flex items-center space-x-2 text-xs font-bold ${
              connectionStatus === 'ok' ? 'text-success' : connectionStatus === 'failed' ? 'text-danger' : 'text-text-secondary'
            }`}
          >
            {connectionStatus === 'ok' ? (
              <CheckCircle2 className="w-4 h-4" />
            ) : connectionStatus === 'failed' ? (
              <XCircle className="w-4 h-4" />
            ) : (
              <Wifi className="w-4 h-4" />
            )}
            <span>
              Connection State:{' '}
              {connectionStatus === 'ok' ? 'CONNECTED (real backend)' : connectionStatus === 'failed' ? 'FAILED' : 'UNTESTED'}
            </span>
          </div>

          <button
            type="button"
            onClick={handleTestConnection}
            className="px-4 py-2 font-bold text-xs rounded-lg bg-accent text-accent-fg hover:opacity-90 flex items-center space-x-1.5 shadow-xs"
          >
            <Wifi className="w-3.5 h-3.5" />
            <span>Test Backend Connection</span>
          </button>
        </div>
      </fieldset>

      {/* SECTION 6b: SWITCH ACCESS & VOICE COMMANDS */}
      <fieldset className="bg-surface-raised border border-border rounded-xl p-6 space-y-5 shadow-xs">
        <legend className="px-2 font-extrabold text-base text-text-primary flex items-center space-x-2">
          <MousePointerClick className="w-5 h-5 text-accent" />
          <span>4b. Switch Access &amp; Voice Commands</span>
        </legend>

        <div className="space-y-2">
          <p className="font-bold text-sm text-text-primary">Switch Access Mode</p>
          <p className="text-xs text-text-secondary">
            Keyboard-simulated (no physical switch hardware required). Single-switch: hold Space to Activate, tap to
            move to Next. Two-switch: press "1" for Next, "2" to Activate.
          </p>
          <div className="flex items-center rounded-lg border border-border overflow-hidden w-fit text-xs">
            {(['off', 'single-switch', 'two-switch'] as const).map((m) => (
              <button
                key={m}
                onClick={() => setSwitchAccessMode(m)}
                aria-pressed={switchAccessMode === m}
                className={`px-3 py-2 font-bold ${switchAccessMode === m ? 'bg-accent text-accent-fg' : 'bg-surface text-text-primary'}`}
              >
                {m === 'off' ? 'Off' : m === 'single-switch' ? 'Single Switch' : 'Two Switch'}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2 pt-3 border-t border-border">
          <p className="font-bold text-sm text-text-primary flex items-center gap-1.5">
            <Mic className="w-4 h-4 text-accent" /> Voice Commands (opt-in)
          </p>
          <p className="text-xs text-text-secondary">
            Say "Saathi next", "Saathi scroll down", "Saathi read", etc. Status:{' '}
            <strong className={isListening ? 'text-success' : 'text-text-secondary'}>{voiceStatus.toUpperCase()}</strong>
            {lastHeard && <span className="italic"> — last heard: "{lastHeard}"</span>}
          </p>
          <button
            onClick={isListening ? disableVoice : enableVoice}
            disabled={voiceStatus === 'unsupported'}
            aria-pressed={isListening}
            className={`px-4 py-2 font-bold text-xs rounded-lg flex items-center gap-1.5 shadow-xs disabled:opacity-50 ${
              isListening ? 'bg-danger text-white' : 'bg-accent text-accent-fg'
            }`}
          >
            <Mic className="w-3.5 h-3.5" />
            <span>{isListening ? 'Disable Voice Commands' : 'Enable Voice Commands'}</span>
          </button>
        </div>
      </fieldset>

      {/* SECTION 7: DATA EXPORT & RESET */}
      <fieldset className="bg-surface-raised border border-border rounded-xl p-6 space-y-4 shadow-xs">
        <legend className="px-2 font-extrabold text-base text-text-primary flex items-center space-x-2">
          <Download className="w-5 h-5 text-accent" />
          <span>5. Data Export & Profile Management</span>
        </legend>

        <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
          <button
            type="button"
            onClick={handleExportProfileJson}
            className="px-4 py-2.5 font-bold text-xs rounded-lg border border-border bg-surface text-text-primary hover:bg-surface-raised flex items-center space-x-2 focus-visible:ring-2"
          >
            <Download className="w-4 h-4 text-accent" />
            <span>Export Profile as JSON</span>
          </button>

          <button
            type="button"
            onClick={handleResetProfile}
            className="px-4 py-2.5 font-bold text-xs rounded-lg border border-danger/40 bg-danger/10 text-danger hover:bg-danger/20 flex items-center space-x-2 focus-visible:ring-2"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Reset All Settings to Defaults</span>
          </button>
        </div>
      </fieldset>
    </div>
  );
};
