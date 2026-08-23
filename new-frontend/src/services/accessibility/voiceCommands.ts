import { SpeechToTextService } from '../speechToText';
import { switchAccessManager } from './switchAccess';
import { AccessibilityAction } from '../../types/accessibility';

const WAKE_WORD = /^saathi[,]?\s+/i;

// English + a few natural Hindi/Hinglish equivalents per command, per the
// master prompt's "reasonable Hindi/Hinglish equivalents where practical".
const COMMAND_TABLE: { pattern: RegExp; action: AccessibilityAction }[] = [
  { pattern: /^(scroll down|neeche|niche jao)/i, action: 'SCROLL_DOWN' },
  { pattern: /^(scroll up|upar|upar jao)/i, action: 'SCROLL_UP' },
  { pattern: /^(next|aage|aage badho)/i, action: 'NEXT' },
  { pattern: /^(previous|back|peeche|piche jao)/i, action: 'PREVIOUS' },
  { pattern: /^(read|padho)/i, action: 'PLAY_PAUSE' },
  { pattern: /^(stop|ruko)/i, action: 'PLAY_PAUSE' },
  { pattern: /^(note|likho)/i, action: 'SAVE' },
  { pattern: /^(submit|jama karo)/i, action: 'SUBMIT' },
];

export type VoiceCommandStatus = 'off' | 'listening' | 'unsupported';

/**
 * VoiceCommandManager — listens continuously (opt-in only) for "Saathi
 * <command>" and dispatches the matched AccessibilityAction through the
 * SAME dispatcher switch access uses, per the "converge on shared actions"
 * requirement. Built on the real SpeechToTextService (Web Speech API), not
 * simulated.
 */
export class VoiceCommandManager {
  private stt = new SpeechToTextService();
  private statusHandlers = new Set<(status: VoiceCommandStatus, lastHeard?: string) => void>();

  public static isSupported(): boolean {
    return SpeechToTextService.isSupported();
  }

  public onStatusChange(handler: (status: VoiceCommandStatus, lastHeard?: string) => void): () => void {
    this.statusHandlers.add(handler);
    return () => this.statusHandlers.delete(handler);
  }

  private setStatus(status: VoiceCommandStatus, lastHeard?: string) {
    this.statusHandlers.forEach((h) => h(status, lastHeard));
  }

  public start(): void {
    if (!VoiceCommandManager.isSupported()) {
      this.setStatus('unsupported');
      return;
    }
    this.stt.onResult(({ text, isFinal }) => {
      if (!isFinal) return;
      this.tryMatchCommand(text);
    });
    this.stt.start('en-US');
    this.setStatus('listening');
  }

  public stop(): void {
    this.stt.stop();
    this.setStatus('off');
  }

  private tryMatchCommand(rawText: string): void {
    const text = rawText.trim();
    const wakeMatch = WAKE_WORD.test(text);
    if (!wakeMatch) return;

    const command = text.replace(WAKE_WORD, '').trim();
    for (const { pattern, action } of COMMAND_TABLE) {
      if (pattern.test(command)) {
        this.setStatus('listening', text);
        switchAccessManager.dispatch(action);
        return;
      }
    }
    // Unknown command after the wake word — surface it for feedback rather than silently drop.
    this.setStatus('listening', `${text} (unrecognized command)`);
  }
}

export const voiceCommandManager = new VoiceCommandManager();
