import { describe, expect, it, vi } from 'vitest';
import { CloudSaveQueue, type SaveRequest, type SaveResult } from '../services/cloud-save-queue';

describe('cloud save queue', () => {
  it('serializes edits made while a save is in flight', async () => {
    let resolve!: (result: SaveResult) => void;
    const send = vi.fn<(request: SaveRequest<{ value: number }>) => Promise<SaveResult>>()
      .mockImplementationOnce(() => new Promise(r => { resolve = r; }))
      .mockResolvedValueOnce({ ok: true, revision: 3 });
    const status = vi.fn();
    const queue = new CloudSaveQueue(1, send, structuredClone, () => crypto.randomUUID(), status);
    queue.update({ value: 1 });
    const saving = queue.flush();
    queue.update({ value: 2 });
    await queue.flush();
    expect(send).toHaveBeenCalledTimes(1);
    resolve({ ok: true, revision: 2 });
    await saving;
    expect(send).toHaveBeenCalledTimes(2);
    expect(send.mock.calls[1][0]).toMatchObject({ revision: 2, snapshot: { value: 2 } });
    expect(status).toHaveBeenLastCalledWith('saved');
  });

  it('retries an uncertain write with identical data and stops on conflict', async () => {
    const send = vi.fn<(request: SaveRequest<{ value: number }>) => Promise<SaveResult>>()
      .mockRejectedValueOnce(new Error('response lost'))
      .mockResolvedValueOnce({ ok: false, reason: 'conflict' });
    const status = vi.fn();
    const queue = new CloudSaveQueue(4, send, structuredClone, () => 'mutation-1', status);
    const data = { value: 1 };
    queue.update(data);
    data.value = 99;
    await queue.flush();
    expect(status).toHaveBeenLastCalledWith('uncertain');
    queue.update({ value: 2 });
    await queue.flush();
    expect(send.mock.calls[1][0]).toEqual(send.mock.calls[0][0]);
    expect(send.mock.calls[1][0].snapshot).toEqual({ value: 1 });
    expect(status).toHaveBeenLastCalledWith('conflict');
    await queue.flush();
    expect(send).toHaveBeenCalledTimes(2);
  });
});
