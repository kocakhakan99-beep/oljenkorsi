/** A request is immutable: an uncertain retry must use the same mutation ID and payload. */
export type SaveRequest<T> = Readonly<{ revision: number; mutationId: string; snapshot: T }>;
export type SaveResult = { ok: true; revision: number } | { ok: false; reason: 'conflict' | 'rejected' };
export type QueueStatus = 'saved' | 'dirty' | 'saving' | 'uncertain' | 'conflict' | 'rejected';

/** Serializes writes for one user and household. The caller owns debounce and persistence. */
export class CloudSaveQueue<T> {
  private revision: number;
  private nextVersion = 0;
  private savedVersion = 0;
  private pending: { version: number; snapshot: T } | null = null;
  private current: { version: number; request: SaveRequest<T> } | null = null;
  private inFlight = false;
  private disposed = false;
  private status: QueueStatus = 'saved';

  constructor(
    initialRevision: number,
    private readonly send: (request: SaveRequest<T>) => Promise<SaveResult>,
    private readonly snapshot: (value: T) => T,
    private readonly createId: () => string,
    private readonly onStatus: (status: QueueStatus) => void,
  ) { this.revision = initialRevision; }

  update(value: T): void {
    if (this.disposed) return;
    this.pending = { version: ++this.nextVersion, snapshot: this.snapshot(value) };
    if (this.status === 'saved') this.setStatus('dirty');
  }

  getStatus(): QueueStatus { return this.status; }
  getRevision(): number { return this.revision; }

  /** Retry after a network failure reuses the same request and mutation ID. */
  async flush(): Promise<void> {
    if (this.disposed || this.inFlight || this.status === 'conflict' || this.status === 'rejected') return;
    if (!this.current && this.pending) {
      this.current = { version: this.pending.version, request: { revision: this.revision, mutationId: this.createId(), snapshot: this.pending.snapshot } };
      this.pending = null;
    }
    if (!this.current) return;
    const writing = this.current;
    this.inFlight = true;
    this.setStatus('saving');
    try {
      const result = await this.send(writing.request);
      if (this.disposed) return;
      if (!result.ok) { this.setStatus(result.reason); return; }
      this.revision = result.revision;
      this.savedVersion = writing.version;
      this.current = null;
      this.setStatus(this.pending || this.savedVersion !== this.nextVersion ? 'dirty' : 'saved');
    } catch {
      if (!this.disposed) this.setStatus('uncertain');
    } finally {
      this.inFlight = false;
    }
    if (!this.disposed && this.status === 'dirty') await this.flush();
  }

  dispose(): void { this.disposed = true; this.pending = null; this.current = null; }
  private setStatus(status: QueueStatus): void { this.status = status; this.onStatus(status); }
}
