import { describe, expect, it, vi } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import { CloudApi } from '../services/cloud-api';
import { familyBackup } from '../services/family-backup';
import { empty } from '../domain/model';

const userId = 'a0000000-0000-4000-8000-000000000001';
const householdId = 'a0000000-0000-4000-8000-000000000002';
const mutationId = 'a0000000-0000-4000-8000-000000000003';
const request = () => ({ revision: 2, mutationId, snapshot: familyBackup(empty()) });

function client(sessionUser = userId) {
  const invoke = vi.fn().mockResolvedValue({ data: { ok: true, revision: 3 }, error: null });
  const rpc = vi.fn();
  return { invoke, rpc, instance: { rpc, functions: { invoke }, auth: { getSession: vi.fn().mockResolvedValue({ data: { session: { user: { id: sessionUser }, access_token: 'test-token' } }, error: null }) } } as unknown as SupabaseClient };
}

describe('cloud API', () => {
  it('pins writes to the checked user session and household', async () => {
    const mock = client();
    const api = new CloudApi(mock.instance, userId);
    expect(await api.save(householdId, request())).toEqual({ ok: true, revision: 3 });
    expect(mock.invoke.mock.calls[0][1]).toMatchObject({ headers: { Authorization: 'Bearer test-token' }, body: { householdId, expectedRevision: 2, mutationId } });
  });

  it('does not send data if the active user has changed', async () => {
    const mock = client('a0000000-0000-4000-8000-000000000099');
    const api = new CloudApi(mock.instance, userId);
    expect(await api.save(householdId, request())).toEqual({ ok: false, reason: 'rejected' });
    expect(mock.invoke).not.toHaveBeenCalled();
  });

  it('treats a malformed success as uncertain and a revision conflict as terminal', async () => {
    const mock = client();
    const api = new CloudApi(mock.instance, userId);
    mock.invoke.mockResolvedValueOnce({ data: { ok: true }, error: null });
    await expect(api.save(householdId, request())).rejects.toThrow(/ei voitu varmistaa/);
    mock.invoke.mockResolvedValueOnce({ data: { ok: false, conflict: true }, error: null });
    expect(await api.save(householdId, request())).toEqual({ ok: false, reason: 'conflict' });
  });
});
