import { afterEach, describe, expect, it, vi } from 'vitest';
import { AutoSaveScheduler } from '../services/auto-save-scheduler';
import { CloudSaveQueue } from '../services/cloud-save-queue';

afterEach(() => vi.useRealTimers());

describe('automatic save scheduling', () => {
  it('coalesces changes and flushes within the maximum wait', async () => {
    vi.useFakeTimers();
    const send = vi.fn().mockResolvedValue({ ok: true, revision: 2 });
    const queue = new CloudSaveQueue(1, send, structuredClone, () => 'id', () => {});
    const scheduler = new AutoSaveScheduler(queue, 800, 3000);
    for (let value = 0; value < 5; value++) {
      scheduler.update({ value });
      await vi.advanceTimersByTimeAsync(600);
    }
    expect(send).toHaveBeenCalledTimes(1);
    expect(send.mock.calls[0][0].snapshot).toEqual({ value: 4 });
    scheduler.dispose();
  });

  it('does not send pending data after the household is disposed', async () => {
    vi.useFakeTimers();
    const send = vi.fn().mockResolvedValue({ ok: true, revision: 2 });
    const queue = new CloudSaveQueue(1, send, structuredClone, () => 'id', () => {});
    const scheduler = new AutoSaveScheduler(queue);
    scheduler.update({ value: 1 });
    scheduler.dispose();
    await vi.advanceTimersByTimeAsync(5000);
    expect(send).not.toHaveBeenCalled();
  });

  it('retries an uncertain response with the same mutation ID and snapshot', async () => {
    vi.useFakeTimers();
    const send = vi.fn().mockRejectedValueOnce(new Error('connection lost'))
      .mockResolvedValueOnce({ ok: true, revision: 2 });
    const statuses = vi.fn();
    const queue = new CloudSaveQueue(1, send, structuredClone, () => 'stable-id', statuses);
    const scheduler = new AutoSaveScheduler(queue, 800, 3000, () => 0.5);
    scheduler.update({ value: 1 });
    await vi.advanceTimersByTimeAsync(800);
    expect(statuses).toHaveBeenLastCalledWith('uncertain');
    await vi.advanceTimersByTimeAsync(874);
    expect(send).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(1);
    expect(send).toHaveBeenCalledTimes(2);
    expect(send.mock.calls[0][0]).toEqual(send.mock.calls[1][0]);
    expect(statuses).toHaveBeenLastCalledWith('saved');
    scheduler.dispose();
  });
});
