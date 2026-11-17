import { FunctionsHttpError, type SupabaseClient } from '@supabase/supabase-js';
import { familyBackup, restoreFamilyBackup } from './family-backup';
import { validateCloudWrite } from './cloud-validation';
import type { State } from '../domain/model';
import type { SaveRequest, SaveResult } from './cloud-save-queue';

export type CloudHousehold = { id: string; name: string; kind: 'personal' | 'shared'; revision: number };
export type LoadedHousehold = CloudHousehold & { state: State | null; integrity: 'verified' | 'unverified-legacy' | 'empty' };
export type CloudSnapshot = ReturnType<typeof familyBackup>;
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function household(value: unknown): CloudHousehold {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Virheellinen talouden vastaus.');
  const item = value as Record<string, unknown>;
  if (typeof item.id !== 'string' || !uuid.test(item.id) || typeof item.name !== 'string' ||
      (item.kind !== 'personal' && item.kind !== 'shared') ||
      typeof item.revision !== 'number' || !Number.isSafeInteger(item.revision) || item.revision < 0)
    throw new Error('Virheellinen talouden vastaus.');
  return { id: item.id, name: item.name, kind: item.kind, revision: item.revision };
}

/** Each instance is bound to one authenticated user and one household. */
export class CloudApi {
  constructor(private readonly client: SupabaseClient, readonly userId: string) {}

  async list(): Promise<CloudHousehold[]> {
    const { data, error } = await this.client.rpc('cloud_list_households');
    if (error) throw error;
    if (!Array.isArray(data)) throw new Error('Talouksien haku epäonnistui.');
    return data.map(household);
  }

  async ensurePersonal(): Promise<string> {
    const { data, error } = await this.client.rpc('cloud_ensure_personal');
    if (error) throw error;
    if (typeof data !== 'string' || !uuid.test(data)) throw new Error('Oman talouden luonti epäonnistui.');
    return data;
  }

  async load(id: string): Promise<LoadedHousehold> {
    if (!uuid.test(id)) throw new Error('Virheellinen talouden tunniste.');
    const { data, error } = await this.client.rpc('cloud_get_household', { p_household_id: id });
    if (error) throw error;
    const meta = household(data);
    if (meta.id !== id) throw new Error('Väärä talous palautettiin.');
    const raw = (data as Record<string, unknown>).state;
    if (raw === null) return { ...meta, state: null, integrity: 'empty' };
    const restored = restoreFamilyBackup(raw);
    return { ...meta, ...restored };
  }

  async save(id: string, request: SaveRequest<CloudSnapshot>, signal?: AbortSignal): Promise<SaveResult> {
    if (!uuid.test(id) || !uuid.test(request.mutationId) || !Number.isSafeInteger(request.revision) || request.revision < 0)
      return { ok: false, reason: 'rejected' };
    try { validateCloudWrite(request.snapshot); } catch { return { ok: false, reason: 'rejected' }; }
    const { data: { session }, error: sessionError } = await this.client.auth.getSession();
    if (sessionError || !session || session.user.id !== this.userId || signal?.aborted)
      return { ok: false, reason: 'rejected' };
    // Pin this request to the checked session, even if another account signs in meanwhile.
    const { data, error } = await this.client.functions.invoke('cloud-save', {
      headers: { Authorization: `Bearer ${session.access_token}` }, signal,
      body: { householdId: id, expectedRevision: request.revision, mutationId: request.mutationId, snapshot: request.snapshot },
    });
    if (error) {
      if (error instanceof FunctionsHttpError && [400, 401, 403, 405, 413].includes(error.context.status))
        return { ok: false, reason: 'rejected' };
      throw error; // The server may already have committed; retry the same mutation ID.
    }
    if (data && data.ok === false && data.conflict === true) return { ok: false, reason: 'conflict' };
    if (!data || data.ok !== true || typeof data.revision !== 'number' ||
        !Number.isSafeInteger(data.revision) || data.revision <= request.revision)
      throw new Error('Tallennusvastauksen tilaa ei voitu varmistaa.');
    return { ok: true, revision: data.revision };
  }
}
