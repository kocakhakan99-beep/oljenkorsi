import { afterEach, expect, it, vi } from 'vitest';
import { analyzeInvoice } from '../services/invoice-ai';

afterEach(() => vi.unstubAllGlobals());
it('requests the free route and validates an invoice suggestion', async () => {
  const fetcher = vi.fn().mockResolvedValue(new Response(JSON.stringify({ choices: [{ message: { content: JSON.stringify({ name: 'Sähköyhtiö', amount_eur: 42.55, due_date: '2026-11-25' }) } }] }), { status: 200 }));
  vi.stubGlobal('fetch', fetcher);
  expect(await analyzeInvoice('test-key', 'Maksettava 42,55')).toEqual({ name: 'Sähköyhtiö', amountCents: 4255, date: '2026-11-25' });
  const [url, options] = fetcher.mock.calls[0];
  expect(url).toBe('https://openrouter.ai/api/v1/chat/completions');
  expect(JSON.parse(options.body).model).toBe('openrouter/free');
});
it('leaves invalid dates empty and rejects malformed responses without leaking secrets', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({ choices: [{ message: { content: '{"name":null,"amount_eur":null,"due_date":"2026-02-30"}' } }] }), { status: 200 })));
  expect(await analyzeInvoice('test-key', 'teksti')).toEqual({ name: '', amountCents: null, date: '' });
  vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('secret test-key')));
  await expect(analyzeInvoice('test-key', 'teksti')).rejects.toThrow('Analyysi epäonnistui');
});
