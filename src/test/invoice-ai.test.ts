import { afterEach, expect, it, vi } from 'vitest';
import { analyzeInvoice, invoiceModels } from '../services/invoice-ai';

afterEach(() => vi.unstubAllGlobals());
const ok = () => new Response(JSON.stringify({ choices: [{ message: { content: JSON.stringify({ name: 'Sähköyhtiö', amount_eur: 42.55, due_date: '2026-11-25' }) } }] }), { status: 200 });
it('requests the free Nemotron model and validates an invoice suggestion', async () => {
  const fetcher = vi.fn().mockResolvedValue(ok());
  vi.stubGlobal('fetch', fetcher);
  expect(await analyzeInvoice('test-key', 'Maksettava 42,55')).toEqual({ name: 'Sähköyhtiö', amountCents: 4255, date: '2026-11-25' });
  const [url, options] = fetcher.mock.calls[0];
  expect(url).toBe('https://openrouter.ai/api/v1/chat/completions');
  expect(JSON.parse(options.body).model).toBe('nvidia/nemotron-3-ultra-550b-a55b:free');
  expect(JSON.parse(options.body)).not.toHaveProperty('response_format');
});
it('falls back only to the free router if Nemotron is unavailable', async () => {
  const fetcher = vi.fn().mockResolvedValueOnce(new Response('', { status: 404 })).mockResolvedValueOnce(ok());
  vi.stubGlobal('fetch', fetcher);
  await analyzeInvoice('test-key', 'teksti');
  expect(fetcher.mock.calls.map(([, options]) => JSON.parse(options.body).model)).toEqual([...invoiceModels]);
});
it('sends only free model identifiers to the selected Worker', async () => {
  const fetcher = vi.fn().mockResolvedValue(ok());
  vi.stubGlobal('fetch', fetcher);
  await analyzeInvoice('worker-test-key', 'teksti', 'worker');
  const [url, options] = fetcher.mock.calls[0];
  expect(url).toBe('https://api-worker.kocakhakan99.workers.dev/chat');
  expect(JSON.parse(options.body).model).toBe(invoiceModels[0]);
  expect(options.headers.Authorization).toBe('Bearer worker-test-key');
});
it('leaves invalid dates empty and rejects malformed responses without leaking secrets', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({ choices: [{ message: { content: '{"name":null,"amount_eur":null,"due_date":"2026-02-30"}' } }] }), { status: 200 })));
  expect(await analyzeInvoice('test-key', 'teksti')).toEqual({ name: '', amountCents: null, date: '' });
  vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('secret test-key')));
  await expect(analyzeInvoice('test-key', 'teksti')).rejects.toThrow('Analyysi epäonnistui');
});
it('explains free-tier and key failures without exposing the provider response', async () => {
  const fetcher = vi.fn().mockResolvedValueOnce(new Response('', { status: 429 })).mockResolvedValueOnce(new Response('sensitive provider text', { status: 429 }));
  vi.stubGlobal('fetch', fetcher);
  await expect(analyzeInvoice('test-key', 'teksti')).rejects.toThrow('käyttöraja');
  const denied = vi.fn().mockResolvedValue(new Response('test-key', { status: 401 }));
  vi.stubGlobal('fetch', denied);
  await expect(analyzeInvoice('test-key', 'teksti')).rejects.toThrow('API-avain');
  expect(denied).toHaveBeenCalledTimes(1);
  vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('test-key')));
  await expect(analyzeInvoice('test-key', 'teksti')).rejects.toThrow('CORS-asetukset');
});
