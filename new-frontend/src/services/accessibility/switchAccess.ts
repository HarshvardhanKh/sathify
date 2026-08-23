import { accessibilityActionBus } from './actionDispatcher';
import { AccessibilityAction } from '../../types/accessibility';

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), ' +
  'textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

function getFocusableElements(): HTMLElement[] {
  return Array.from(document.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
    (el) => el.offsetParent !== null // visible
  );
}

/**
 * Real, generic switch-access behavior — no simulated hardware. Applies a
 * default fallback for every AccessibilityAction (focus cycling for
 * NEXT/PREVIOUS, click() for ACTIVATE, browser back, window scroll) so
 * switch/voice input works everywhere immediately, even on pages with no
 * bespoke handler registered via accessibilityActionBus.
 */
export class SwitchAccessManager {
  private currentIndex = -1;
  private longPressTimer: number | null = null;
  private mode: 'off' | 'single-switch' | 'two-switch' = 'off';

  public setMode(mode: 'off' | 'single-switch' | 'two-switch'): void {
    this.mode = mode;
  }

  public getMode(): 'off' | 'single-switch' | 'two-switch' {
    return this.mode;
  }

  private focusNext(direction: 1 | -1): void {
    const elements = getFocusableElements();
    if (elements.length === 0) return;
    this.currentIndex = (this.currentIndex + direction + elements.length) % elements.length;
    elements[this.currentIndex]?.focus();
  }

  private activateCurrent(): void {
    const elements = getFocusableElements();
    const el = elements[this.currentIndex];
    el?.click();
  }

  public runDefaultBehavior(action: AccessibilityAction): void {
    switch (action) {
      case 'NEXT':
        this.focusNext(1);
        break;
      case 'PREVIOUS':
        this.focusNext(-1);
        break;
      case 'ACTIVATE':
        this.activateCurrent();
        break;
      case 'BACK':
        window.history.back();
        break;
      case 'SCROLL_UP':
        window.scrollBy({ top: -300, behavior: 'smooth' });
        break;
      case 'SCROLL_DOWN':
        window.scrollBy({ top: 300, behavior: 'smooth' });
        break;
      // PLAY_PAUSE / SAVE / SUBMIT have no safe generic default — pages
      // that care register their own handler via accessibilityActionBus.
    }
  }

  public dispatch(action: AccessibilityAction): void {
    this.runDefaultBehavior(action);
    accessibilityActionBus.dispatch(action);
  }

  /** Single-switch simulation: a short press cycles focus, a long press (>600ms) activates. */
  public handleSingleSwitchPress(): void {
    this.longPressTimer = window.setTimeout(() => {
      this.dispatch('ACTIVATE');
      this.longPressTimer = null;
    }, 600);
  }

  public handleSingleSwitchRelease(): void {
    if (this.longPressTimer !== null) {
      window.clearTimeout(this.longPressTimer);
      this.longPressTimer = null;
      this.dispatch('NEXT');
    }
    // if the timer already fired, ACTIVATE was already dispatched — do nothing more
  }

  /** Two-switch simulation: switch 1 = next, switch 2 = activate. */
  public handleTwoSwitchPrimary(): void {
    this.dispatch('NEXT');
  }

  public handleTwoSwitchSecondary(): void {
    this.dispatch('ACTIVATE');
  }
}

export const switchAccessManager = new SwitchAccessManager();
