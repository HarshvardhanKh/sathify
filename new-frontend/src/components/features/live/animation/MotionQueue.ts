export interface QueueItem {
  token: string;
  durationMs: number;
}

export interface MotionQueueOptions {
  capacity?: number;
  onOverflow?: () => void;
}

export class MotionQueue {
  private queue: QueueItem[] = [];
  private capacity: number;
  private onOverflow?: () => void;
  private isSkipping: boolean = false;

  constructor(options: MotionQueueOptions = {}) {
    this.capacity = options.capacity ?? 30;
    this.onOverflow = options.onOverflow;
  }

  public enqueue(item: QueueItem): void {
    if (this.queue.length >= this.capacity) {
      this.isSkipping = true;
      // Drop oldest 5 items to clear backlog
      this.queue = this.queue.slice(5);
      if (this.onOverflow) {
        this.onOverflow();
      }
    }
    this.queue.push(item);
  }

  public dequeue(): QueueItem | undefined {
    if (this.queue.length === 0) {
      this.isSkipping = false;
    }
    return this.queue.shift();
  }

  public clear(): void {
    this.queue = [];
    this.isSkipping = false;
  }

  public getLength(): number {
    return this.queue.length;
  }

  public getIsSkipping(): boolean {
    return this.isSkipping;
  }
}
