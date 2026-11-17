import { afterEach, describe, expect, it, vi } from 'vitest';
import { empty } from '../domain/model';
import { CloudSession } from '../services/cloud-session';
import type { CloudApi, CloudHousehold, LoadedHousehold } from '../services/cloud-api';

const personal: CloudHousehold = { id: 'a0000000-0000-4000-8000-000000000001', name: 'Oma', kind: 'personal', revision: 0 };
const shared: CloudHousehold = { id: 'a0000000-0000-4000-8000-000000000002', name: 'Perhe', kind: 'shared', revision: 3 };
function mockApi() {
  return {
    ensurePersonal: vi.fn().mockResolvedValue(personal.id),
    list: vi.fn().mockResolvedValue([personal, shared]),
    load: vi.fn().mockImplementation(async (id: string): Promise<LoadedHousehold> => ({ ...(id === shared.id ? shared : personal), state: id === shared.id ? empty() : null, integrity: id === shared.id ? 'verified' : 'empty' })),
    save: vi.fn().mockResolvedValue({ ok: true, revision: 4 }),
  };
}
afterEach(() => vi.useRealTimers());

describe('cloud session', () => {
  it('reloads the requested accessible household instead of the default shared one', async () => {
    const api = mockApi();
    const session = new CloudSession(api as unknown as CloudApi, vi.fn(), vi.fn(), vi.fn());
    await session.start(empty(), personal.id);
    expect(session.getActiveId()).toBe(personal.id);
    expect(api.load).toHaveBeenCalledWith(personal.id);
    session.dispose();
  });

  it('previews the cloud copy without applying it or discarding local work', async () => {
    const api = mockApi();
    const onLoad = vi.fn();
    const session = new CloudSession(api as unknown as CloudApi, onLoad, vi.fn(), vi.fn());
    await session.start(empty());
    const local = structuredClone(onLoad.mock.calls[0][0]);
    local.budgets['2026-11'] = { Ruoka: 10000 };
    session.update(local);
    const remote = { ...shared, revision: 4, state: empty(), integrity: 'verified' as const };
    api.load.mockResolvedValueOnce(remote);
    expect(await session.previewLatest()).toEqual(remote);
    expect(onLoad).toHaveBeenCalledTimes(1);
    expect(session.getStatus()).toBe('dirty');
    await expect(session.open(personal.id, local)).rejects.toThrow(/keskeneräiset/);
    session.dispose();
  });

  it('rejects a preview response after the session is disposed', async () => {
    const api = mockApi();
    const session = new CloudSession(api as unknown as CloudApi, vi.fn(), vi.fn(), vi.fn());
    await session.start(empty());
    let resolve!: (value: LoadedHousehold) => void;
    api.load.mockImplementationOnce(() => new Promise(r => { resolve = r; }));
    const pending = session.previewLatest();
    session.dispose();
    resolve({ ...shared, state: empty(), integrity: 'verified' });
    await expect(pending).rejects.toThrow(/vaihtui/);
  });
  it('loads the existing family first and saves only a genuine data change', async () => {
    vi.useFakeTimers();
    const api = mockApi();
    const onLoad = vi.fn();
    const status = vi.fn();
    const session = new CloudSession(api as unknown as CloudApi, onLoad, status, vi.fn(), () => 'a0000000-0000-4000-8000-000000000003');
    await session.start(empty());
    expect(session.getActiveId()).toBe(shared.id);
    expect(status).toHaveBeenLastCalledWith('saved');
    const loaded = onLoad.mock.calls[0][0];
    const displayOnly = structuredClone(loaded);
    displayOnly.settings.theme = 'blue';
    session.update(displayOnly);
    await vi.advanceTimersByTimeAsync(1000);
    expect(api.save).not.toHaveBeenCalled();
    const changed = structuredClone(displayOnly);
    changed.budgets['2026-11'] = { Ruoka: 10000 };
    session.update(changed);
    expect(status).toHaveBeenLastCalledWith('dirty');
    await vi.advanceTimersByTimeAsync(800);
    expect(api.save).toHaveBeenCalledTimes(1);
    expect(status).toHaveBeenLastCalledWith('saved');
    session.dispose();
  });

  it('blocks switching while unsaved and ignores stale load responses after disposal', async () => {
    const api = mockApi();
    const onLoad = vi.fn();
    const session = new CloudSession(api as unknown as CloudApi, onLoad, vi.fn(), vi.fn());
    await session.start(empty());
    const changed = structuredClone(onLoad.mock.calls[0][0]);
    changed.budgets['2026-11'] = { Ruoka: 10000 };
    session.update(changed);
    await expect(session.open(personal.id, changed)).rejects.toThrow(/keskeneräiset/);
    session.dispose();

    let resolve!: (value: LoadedHousehold) => void;
    api.load.mockImplementationOnce(() => new Promise(r => { resolve = r; }));
    const laterLoad = vi.fn();
    const next = new CloudSession(api as unknown as CloudApi, laterLoad, vi.fn(), vi.fn());
    const loading = next.open(personal.id, empty());
    next.dispose();
    resolve({ ...personal, state: null, integrity: 'empty' });
    await loading;
    expect(laterLoad).not.toHaveBeenCalled();
  });

  it('does not load or save unverifiable legacy data automatically', async () => {
    const api = mockApi();
    api.load.mockResolvedValueOnce({ ...shared, state: empty(), integrity: 'unverified-legacy' });
    const onLoad = vi.fn();
    const status = vi.fn();
    const session = new CloudSession(api as unknown as CloudApi, onLoad, status, vi.fn());
    await session.start(empty());
    expect(status).toHaveBeenLastCalledWith('legacy-review');
    expect(onLoad).not.toHaveBeenCalled();
    session.update(empty());
    await session.saveNow();
    expect(api.save).not.toHaveBeenCalled();
    session.dispose();
  });

  it('loads legacy data only after explicit confirmation of the same revision', async () => {
    const api = mockApi();
    api.load.mockResolvedValueOnce({ ...shared, state: empty(), integrity: 'unverified-legacy' });
    api.load.mockResolvedValueOnce({ ...shared, revision: 4, state: empty(), integrity: 'unverified-legacy' });
    api.load.mockResolvedValueOnce({ ...shared, revision: 4, state: empty(), integrity: 'unverified-legacy' });
    const onLoad = vi.fn();
    const session = new CloudSession(api as unknown as CloudApi, onLoad, vi.fn(), vi.fn());
    await session.start(empty());
    expect(session.getStatus()).toBe('legacy-review');
    await session.acceptLegacy(empty());
    expect(session.getStatus()).toBe('legacy-review');
    expect(onLoad).not.toHaveBeenCalled();
    await session.acceptLegacy(empty());
    expect(onLoad).toHaveBeenCalledTimes(1);
    expect(session.getStatus()).toBe('saved');
    expect(api.save).not.toHaveBeenCalled();
    session.dispose();
  });

  it('does not replace a reviewed legacy version with a different newly saved revision', async () => {
    const api = mockApi();
    api.load.mockResolvedValueOnce({ ...shared, state: empty(), integrity: 'unverified-legacy' });
    api.load.mockResolvedValueOnce({ ...shared, revision: 4, state: empty(), integrity: 'verified' });
    const onLoad = vi.fn();
    const session = new CloudSession(api as unknown as CloudApi, onLoad, vi.fn(), vi.fn());
    await session.start(empty());
    await session.acceptLegacy(empty());
    expect(session.getStatus()).toBe('error');
    expect(onLoad).not.toHaveBeenCalled();
    session.dispose();
  });

  it('never enables writes after a failed load or a failed state application', async () => {
    const api = mockApi();
    api.load.mockRejectedValueOnce(new Error('network error'));
    const onLoad = vi.fn();
    const session = new CloudSession(api as unknown as CloudApi, onLoad, vi.fn(), vi.fn());
    await session.start(empty());
    expect(session.getStatus()).toBe('error');
    expect(onLoad).not.toHaveBeenCalled();
    session.update(empty());
    await session.saveNow();
    expect(api.save).not.toHaveBeenCalled();
    session.dispose();

    const failingApply = new CloudSession(api as unknown as CloudApi, () => { throw new Error('apply failed'); }, vi.fn(), vi.fn());
    await failingApply.start(empty());
    expect(failingApply.getStatus()).toBe('error');
    failingApply.update(empty());
    await failingApply.saveNow();
    expect(api.save).not.toHaveBeenCalled();
    failingApply.dispose();
  });

  it('rejects an empty document with a nonzero revision', async () => {
    const api = mockApi();
    api.load.mockResolvedValueOnce({ ...shared, state: null, integrity: 'empty' });
    const onLoad = vi.fn();
    const session = new CloudSession(api as unknown as CloudApi, onLoad, vi.fn(), vi.fn());
    await session.start(empty());
    expect(session.getStatus()).toBe('error');
    expect(onLoad).not.toHaveBeenCalled();
    session.dispose();
  });

  it('announces a newer remote revision without replacing the visible state', async () => {
    const api = mockApi();
    const onLoad = vi.fn();
    const session = new CloudSession(api as unknown as CloudApi, onLoad, vi.fn(), vi.fn());
    await session.start(empty());
    api.list.mockResolvedValueOnce([personal, { ...shared, revision: 4 }]);
    await session.refreshHouseholds();
    expect(session.getStatus()).toBe('remote-change');
    expect(onLoad).toHaveBeenCalledTimes(1);
    session.dispose();
  });
});
