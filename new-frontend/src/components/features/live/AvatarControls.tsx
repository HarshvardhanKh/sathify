import React, { useState } from 'react';
import { Monitor, Eye, EyeOff, Layers, Sliders, LayoutGrid } from 'lucide-react';
import { useAnnounce } from '../../../hooks/useAnnounce';

export const AvatarControls: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [alwaysOnTop, setAlwaysOnTop] = useState(false);
  const [opacity, setOpacity] = useState(1.0);
  const [width, setWidth] = useState(400);
  const [height, setHeight] = useState(300);

  const { announce } = useAnnounce();

  const isElectron = typeof window !== 'undefined' && 'electron' in window;

  const toggleOpen = () => {
    if (!isElectron) {
      announce('Desktop app integration is only available in Electron desktop mode. Running in browser simulation.', 'polite');
      setIsOpen(!isOpen);
      return;
    }

    if (isOpen) {
      window.electron?.avatar.close();
      setIsOpen(false);
      announce('Desktop avatar overlay window hidden.', 'polite');
    } else {
      window.electron?.avatar.open();
      setIsOpen(true);
      announce('Desktop avatar overlay window opened.', 'polite');
    }
  };

  const handleAlwaysOnTopChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const checked = e.target.checked;
    setAlwaysOnTop(checked);
    if (isElectron) {
      window.electron?.avatar.setAlwaysOnTop(checked);
    }
    announce(`Avatar always on top set to ${checked ? 'enabled' : 'disabled'}.`, 'polite');
  };

  const handleOpacityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setOpacity(val);
    if (isElectron) {
      window.electron?.avatar.setOpacity(val);
    }
  };

  const handleSizeChange = (newWidth: number, newHeight: number) => {
    setWidth(newWidth);
    setHeight(newHeight);
    if (isElectron) {
      window.electron?.avatar.setSize(newWidth, newHeight);
    }
    announce(`Avatar window size configured to ${newWidth} by ${newHeight} pixels.`, 'polite');
  };

  return (
    <fieldset className="bg-surface-raised border border-border rounded-xl p-5 space-y-4 shadow-xs">
      <legend className="px-2 font-extrabold text-base text-text-primary flex items-center space-x-2">
        <Monitor className="w-5 h-5 text-accent" aria-hidden="true" />
        <span>Indian Sign Language (ISL) Avatar Controls</span>
      </legend>

      <div className="space-y-4 text-xs font-sans">
        <div className="flex items-center justify-between">
          <span className="font-bold text-text-primary">Desktop App Overlay Status:</span>
          <span className="px-2 py-0.5 rounded bg-saathi-navy/10 text-saathi-navy font-mono font-bold">
            {isElectron ? 'ELECTRON ACTIVE' : 'BROWSER SIMULATION'}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="font-bold text-text-primary">Window Dimensions:</span>
          <span className="font-mono text-text-secondary">
            {width}x{height}px
          </span>
        </div>

        {/* Toggle Window */}
        <button
          onClick={toggleOpen}
          aria-pressed={isOpen}
          className={`w-full py-2.5 font-bold rounded-lg border transition-colors flex items-center justify-center space-x-2 ${
            isOpen
              ? 'bg-accent text-accent-fg border-accent'
              : 'bg-surface text-text-primary border-border hover:bg-surface-raised'
          }`}
        >
          {isOpen ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          <span>{isOpen ? 'Hide Desktop Avatar window' : 'Open Desktop Avatar window'}</span>
        </button>

        {/* Always on top */}
        <div className="flex items-center justify-between border-t border-border pt-3">
          <label htmlFor="always-on-top-check" className="font-bold text-text-primary flex items-center space-x-1.5">
            <Layers className="w-4 h-4 text-accent" />
            <span>Always on Top:</span>
          </label>
          <input
            id="always-on-top-check"
            type="checkbox"
            checked={alwaysOnTop}
            onChange={handleAlwaysOnTopChange}
            className="w-4 h-4 accent-accent rounded"
          />
        </div>

        {/* Opacity slider */}
        <div className="space-y-2 border-t border-border pt-3">
          <label htmlFor="avatar-opacity-range" className="font-bold text-text-primary flex justify-between">
            <span className="flex items-center space-x-1.5">
              <Sliders className="w-4 h-4 text-accent" />
              <span>Window Opacity:</span>
            </span>
            <span className="font-mono text-accent">{Math.round(opacity * 100)}%</span>
          </label>
          <input
            id="avatar-opacity-range"
            type="range"
            min="0.2"
            max="1.0"
            step="0.1"
            value={opacity}
            onChange={handleOpacityChange}
            className="w-full h-2 bg-border rounded-lg appearance-none cursor-pointer accent-accent"
          />
        </div>

        {/* Sizes presets */}
        <div className="space-y-2 border-t border-border pt-3">
          <span className="font-bold text-text-primary flex items-center space-x-1.5 mb-2">
            <LayoutGrid className="w-4 h-4 text-accent" />
            <span>Window Presets:</span>
          </span>
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => handleSizeChange(300, 220)}
              className="py-1.5 rounded border border-border bg-surface text-text-primary hover:bg-surface-raised font-semibold"
            >
              Small
            </button>
            <button
              onClick={() => handleSizeChange(400, 300)}
              className="py-1.5 rounded border border-border bg-surface text-text-primary hover:bg-surface-raised font-semibold"
            >
              Medium
            </button>
            <button
              onClick={() => handleSizeChange(500, 380)}
              className="py-1.5 rounded border border-border bg-surface text-text-primary hover:bg-surface-raised font-semibold"
            >
              Large
            </button>
          </div>
        </div>
      </div>
    </fieldset>
  );
};
export default AvatarControls;
