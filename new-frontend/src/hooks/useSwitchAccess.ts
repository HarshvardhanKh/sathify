import { useEffect, useState, useCallback } from 'react';
import { switchAccessManager } from '../services/accessibility/switchAccess';

export type SwitchAccessMode = 'off' | 'single-switch' | 'two-switch';

/**
 * Wires real keyboard events to switch-access simulation so the feature is
 * demonstrable without physical assistive hardware, per the master
 * prompt's explicit "keyboard simulation must work even if real hardware
 * is unavailable" requirement. Default bindings:
 *   single-switch: Spacebar (press = start timer, release = NEXT unless
 *                  held >600ms, which fires ACTIVATE)
 *   two-switch: "1" = NEXT (switch 1), "2" = ACTIVATE (switch 2)
 */
export function useSwitchAccess() {
  const [mode, setModeState] = useState<SwitchAccessMode>('off');

  const setMode = useCallback((next: SwitchAccessMode) => {
    switchAccessManager.setMode(next);
    setModeState(next);
  }, []);

  useEffect(() => {
    if (mode === 'off') return;

    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) return;

      if (mode === 'single-switch' && e.code === 'Space' && !e.repeat) {
        e.preventDefault();
        switchAccessManager.handleSingleSwitchPress();
      } else if (mode === 'two-switch') {
        if (e.key === '1') {
          e.preventDefault();
          switchAccessManager.handleTwoSwitchPrimary();
        } else if (e.key === '2') {
          e.preventDefault();
          switchAccessManager.handleTwoSwitchSecondary();
        }
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      if (mode === 'single-switch' && e.code === 'Space') {
        e.preventDefault();
        switchAccessManager.handleSingleSwitchRelease();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, [mode]);

  return { mode, setMode };
}
