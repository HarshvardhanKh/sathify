import { MotionQueue } from './MotionQueue';

export type ControllerUpdateCallback = (currentSign: string, isPlaying: boolean, queueDepth: number, isSkipping: boolean) => void;

export class AvatarController {
  private queue: MotionQueue;
  private currentSign: string = 'IDLE';
  private isPlaying: boolean = false;
  private updateCallback: ControllerUpdateCallback | null = null;
  private activeTimer: number | null = null;

  constructor(capacity: number = 30, onOverflow?: () => void) {
    this.queue = new MotionQueue({
      capacity,
      onOverflow: () => {
        if (onOverflow) onOverflow();
        this.notifyUpdate();
      },
    });
  }

  public registerCallback(cb: ControllerUpdateCallback): void {
    this.updateCallback = cb;
    this.notifyUpdate();
  }

  public addSign(token: string, durationMs: number): void {
    this.queue.enqueue({ token, durationMs });
    this.notifyUpdate();
    if (!this.isPlaying) {
      this.playNext();
    }
  }

  public clear(): void {
    this.queue.clear();
    this.currentSign = 'IDLE';
    this.isPlaying = false;
    if (this.activeTimer) {
      clearTimeout(this.activeTimer);
      this.activeTimer = null;
    }
    this.notifyUpdate();
  }

  private playNext(): void {
    const nextItem = this.queue.dequeue();
    if (!nextItem) {
      this.currentSign = 'IDLE';
      this.isPlaying = false;
      this.notifyUpdate();
      return;
    }

    this.isPlaying = true;
    this.currentSign = nextItem.token;
    this.notifyUpdate();

    // Use requestAnimationFrame for scheduling updates safely in sync with UI ticks
    const startTime = performance.now();
    const tick = () => {
      const elapsed = performance.now() - startTime;
      if (elapsed >= nextItem.durationMs) {
        this.playNext();
      } else {
        this.activeTimer = window.requestAnimationFrame(tick);
      }
    };
    this.activeTimer = window.requestAnimationFrame(tick);
  }

  private notifyUpdate(): void {
    if (this.updateCallback) {
      this.updateCallback(
        this.currentSign,
        this.isPlaying,
        this.queue.getLength(),
        this.queue.getIsSkipping()
      );
    }
  }
}
