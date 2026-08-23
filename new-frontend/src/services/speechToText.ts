/**
 * SpeechToTextService — thin wrapper around the browser's native
 * SpeechRecognition API (Web Speech API). Real, not simulated: Chrome/Edge/
 * Brave support `webkitSpeechRecognition` natively, no backend round-trip
 * needed for live dictation. Falls back to a clear "not supported" signal
 * on browsers without it (e.g. Firefox) rather than silently doing nothing.
 */

export type SpeechToTextStatus = 'idle' | 'listening' | 'paused' | 'error' | 'unsupported';

export interface SpeechToTextResult {
  text: string;
  isFinal: boolean;
}

type ResultHandler = (result: SpeechToTextResult) => void;
type StatusHandler = (status: SpeechToTextStatus, error?: string) => void;

function getRecognitionCtor(): (new () => SpeechRecognition) | null {
  const w = window as any;
  return w.SpeechRecognition || w.webkitSpeechRecognition || null;
}

export class SpeechToTextService {
  private recognition: SpeechRecognition | null = null;
  private status: SpeechToTextStatus = 'idle';
  private resultHandlers = new Set<ResultHandler>();
  private statusHandlers = new Set<StatusHandler>();
  private wasStoppedManually = false;

  public static isSupported(): boolean {
    return getRecognitionCtor() !== null;
  }

  public onResult(handler: ResultHandler): () => void {
    this.resultHandlers.add(handler);
    return () => this.resultHandlers.delete(handler);
  }

  public onStatusChange(handler: StatusHandler): () => void {
    this.statusHandlers.add(handler);
    return () => this.statusHandlers.delete(handler);
  }

  private setStatus(status: SpeechToTextStatus, error?: string) {
    this.status = status;
    this.statusHandlers.forEach((h) => h(status, error));
  }

  public getStatus(): SpeechToTextStatus {
    return this.status;
  }

  public start(language: 'en-US' | 'hi-IN' = 'en-US'): void {
    const Ctor = getRecognitionCtor();
    if (!Ctor) {
      this.setStatus('unsupported', 'SpeechRecognition is not supported in this browser.');
      return;
    }

    this.wasStoppedManually = false;
    const recognition = new Ctor();
    recognition.lang = language;
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (!result) continue;
        const text = result[0]?.transcript ?? '';
        this.resultHandlers.forEach((h) => h({ text, isFinal: result.isFinal }));
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      if (event.error === 'no-speech' || event.error === 'aborted') return; // benign, keep listening
      this.setStatus('error', `Microphone error: ${event.error}`);
    };

    recognition.onend = () => {
      // Chrome auto-stops SpeechRecognition after silence; restart unless
      // the user explicitly stopped/paused it.
      if (!this.wasStoppedManually && this.status === 'listening') {
        try {
          recognition.start();
        } catch {
          // already starting/started — ignore
        }
      }
    };

    try {
      recognition.start();
      this.recognition = recognition;
      this.setStatus('listening');
    } catch (e) {
      this.setStatus('error', e instanceof Error ? e.message : 'Failed to start microphone');
    }
  }

  public pause(): void {
    this.wasStoppedManually = true;
    this.recognition?.stop();
    this.setStatus('paused');
  }

  public resume(language: 'en-US' | 'hi-IN' = 'en-US'): void {
    this.start(language);
  }

  public stop(): void {
    this.wasStoppedManually = true;
    this.recognition?.stop();
    this.recognition = null;
    this.setStatus('idle');
  }
}
