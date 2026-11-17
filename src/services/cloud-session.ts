import { empty, type State } from '../domain/model';
import { canonicalJson, familyBackup } from './family-backup';
import { sharedCloudState, withLocalDisplaySettings } from './cloud-state';
import { AutoSaveScheduler } from './auto-save-scheduler';
import { CloudSaveQueue, type QueueStatus } from './cloud-save-queue';
import type { CloudApi, CloudHousehold, CloudSnapshot } from './cloud-api';

type Api = Pick<CloudApi, 'list' | 'ensurePersonal' | 'load' | 'save'>;
export type CloudSessionStatus = QueueStatus | 'loading' | 'empty' | 'error' | 'legacy-review' | 'remote-change';

/** Owns one signed-in user's active household; never overwrites an unacknowledged edit. */
export class CloudSession {
  private generation = 0;
  private closed = false;
  private queue: CloudSaveQueue<CloudSnapshot> | null = null;
  private scheduler: AutoSaveScheduler<CloudSnapshot> | null = null;
  private abort: AbortController | null = null;
  private lastQueued = '';
  private activeId: string | null = null;
  private legacyReview: { id: string; revision: number } | null = null;
  private status: CloudSessionStatus = 'loading';

  constructor(
    private readonly api: Api,
    private readonly onLoad: (state: State, household: CloudHousehold) => void,
    private readonly onStatus: (status: CloudSessionStatus) => void,
    private readonly onHouseholds: (items: CloudHousehold[]) => void,
    private readonly makeId: () => string = () => crypto.randomUUID(),
  ) {}

  getStatus(): CloudSessionStatus { return this.status; }
  getActiveId(): string | null { return this.activeId; }

  async start(local: State): Promise<void> {
    if (this.closed) return;
    if (this.queue) throw new Error('Sulje nykyinen tallennusistunto ennen uuden käynnistämistä.');
    const generation = ++this.generation;
    this.setStatus('loading');
    try {
      const personalId = await this.api.ensurePersonal();
      if (!this.isCurrent(generation)) return;
      const items = await this.api.list();
      if (!this.isCurrent(generation)) return;
      const selected = items.find(item => item.kind === 'shared') ?? items.find(item => item.id === personalId);
      if (!selected) throw new Error('Omaa taloutta ei löytynyt.');
      this.onHouseholds(items);
      await this.open(selected.id, local);
    } catch {
      if (this.isCurrent(generation)) this.setStatus('error');
    }
  }

  async open(id: string, local: State): Promise<void> {
    this.legacyReview = null;
    await this.openInternal(id, local);
  }

  /** The caller must ask for explicit confirmation before calling this method. */
  async acceptLegacy(local: State): Promise<void> {
    const review = this.legacyReview;
    if (!review) throw new Error('Tarkistettavaa vanhaa taloutta ei ole.');
    await this.openInternal(review.id, local, review.revision);
  }

  private async openInternal(id: string, local: State, approvedLegacyRevision?: number): Promise<void> {
    if (this.closed) return;
    if (this.queue && this.queue.getStatus() !== 'saved') throw new Error('Vie tai tallenna keskeneräiset muutokset ennen talouden vaihtamista.');
    const generation = ++this.generation;
    this.abort?.abort();
    this.scheduler?.dispose();
    this.queue = null;
    this.scheduler = null;
    this.activeId = null;
    this.setStatus('loading');
    try {
      const loaded = await this.api.load(id);
      if (!this.isCurrent(generation)) return;
      if (approvedLegacyRevision !== undefined && approvedLegacyRevision !== loaded.revision && loaded.integrity !== 'unverified-legacy') {
        this.legacyReview = null;
        this.setStatus('error');
        return;
      }
      if (loaded.integrity === 'unverified-legacy' && approvedLegacyRevision !== loaded.revision) {
        this.legacyReview = { id, revision: loaded.revision };
        this.setStatus('legacy-review');
        return;
      }
      if (loaded.integrity === 'empty' && loaded.revision !== 0) throw new Error('Tyhjän talouden revisio on virheellinen.');
      const state = withLocalDisplaySettings(loaded.state ?? empty(), local);
      const fingerprint = canonicalJson(sharedCloudState(state));
      this.onLoad(state, loaded);
      if (!this.isCurrent(generation)) return;
      this.lastQueued = fingerprint;
      const abort = new AbortController();
      this.abort = abort;
      const queue = new CloudSaveQueue<CloudSnapshot>(loaded.revision,
        request => this.api.save(id, request, abort.signal),
        value => structuredClone(value), this.makeId,
        status => { if (this.isCurrent(generation)) this.setStatus(status); });
      this.queue = queue;
      this.scheduler = new AutoSaveScheduler(queue);
      this.activeId = id;
      this.legacyReview = null;
      this.setStatus(loaded.integrity === 'empty' ? 'empty' : 'saved');
    } catch {
      if (this.isCurrent(generation)) this.setStatus('error');
    }
  }

  update(state: State): void {
    if (this.closed || !this.scheduler || !this.queue) return;
    const shared = sharedCloudState(state);
    const fingerprint = canonicalJson(shared);
    if (fingerprint === this.lastQueued) return;
    this.lastQueued = fingerprint;
    this.scheduler.update(familyBackup(shared));
  }

  async saveNow(): Promise<void> { await this.scheduler?.flush(); }
  async refreshHouseholds(): Promise<void> {
    const generation = this.generation;
    const items = await this.api.list();
    if (!this.isCurrent(generation)) return;
    this.onHouseholds(items);
    if (this.activeId && !items.some(item => item.id === this.activeId)) this.setStatus('rejected');
    else if (this.activeId && this.queue?.getStatus() === 'saved' && items.some(item => item.id === this.activeId && item.revision > this.queue!.getRevision())) this.setStatus('remote-change');
  }
  dispose(): void {
    this.closed = true;
    this.generation++;
    this.abort?.abort();
    this.scheduler?.dispose();
    this.activeId = null;
    this.legacyReview = null;
  }

  private isCurrent(generation: number): boolean { return !this.closed && this.generation === generation; }
  private setStatus(status: CloudSessionStatus): void { this.status = status; this.onStatus(status); }
}
