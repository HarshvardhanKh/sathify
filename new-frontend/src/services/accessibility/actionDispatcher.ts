import { AccessibilityAction, AccessibilityActionHandler } from '../../types/accessibility';

/**
 * A single pub/sub point every input method (switch access, voice
 * commands, and any future hardware) dispatches through, and any
 * page/component can subscribe to for its own context-specific behavior
 * (e.g. the reader listening for PLAY_PAUSE to toggle TTS). Generic
 * fallback behavior (focus cycling, scrolling, browser back) lives in
 * switchAccess.ts and is always active as a safety net even when no
 * page-specific handler is registered.
 */
class AccessibilityActionBus {
  private handlers = new Set<AccessibilityActionHandler>();

  public subscribe(handler: AccessibilityActionHandler): () => void {
    this.handlers.add(handler);
    return () => this.handlers.delete(handler);
  }

  public dispatch(action: AccessibilityAction): void {
    this.handlers.forEach((h) => h(action));
  }
}

export const accessibilityActionBus = new AccessibilityActionBus();
