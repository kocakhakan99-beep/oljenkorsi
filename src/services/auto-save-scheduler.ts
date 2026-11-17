import type { CloudSaveQueue } from './cloud-save-queue';

/** Schedules one household's queue; no data is persisted in browser storage. */
export class AutoSaveScheduler<T> {
  private debounce: ReturnType<typeof setTimeout> | null = null;
  private deadline: ReturnType<typeof setTimeout> | null = null;
  private retry: ReturnType<typeof setTimeout> | null = null;
  private retryAttempt = 0;
  private disposed = false;

  constructor(
    private readonly queue: CloudSaveQueue<T>,
    private readonly debounceMs = 800,
    private readonly maxWaitMs = 3000,
    private readonly random = Math.random,
  ) {}

  update(snapshot: T): void {
    if (this.disposed) return;
    this.queue.update(snapshot);
    if (this.debounce) clearTimeout(this.debounce);
    this.debounce = setTimeout(() => { void this.flush(); }, this.debounceMs);
    if (!this.deadline) this.deadline = setTimeout(() => { void this.flush(); }, this.maxWaitMs);
  }

  async flush(): Promise<void> {
    if (this.disposed) return;
    this.clearTimers();
    await this.queue.flush();
    if (this.disposed) return;
    if (this.queue.getStatus() === 'uncertain') {
      const delays = [1000, 2000, 5000, 10000, 30000];
      const baseDelay = delays[Math.min(this.retryAttempt++, delays.length - 1)];
      const delay = Math.round(baseDelay * (0.75 + this.random() * 0.25));
      this.retry = setTimeout(() => { this.retry = null; void this.flush(); }, delay);
    } else if (this.queue.getStatus() === 'saved') {
      this.retryAttempt = 0;
    }
  }

  dispose(): void {
    this.disposed = true;
    this.clearTimers();
    this.queue.dispose();
  }

  private clearTimers(): void {
    if (this.debounce) clearTimeout(this.debounce);
    if (this.deadline) clearTimeout(this.deadline);
    if (this.retry) clearTimeout(this.retry);
    this.debounce = this.deadline = this.retry = null;
  }
}
