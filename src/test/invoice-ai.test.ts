import { afterEach, expect, it, vi } from 'vitest';
import { analyzeInvoice, invoiceModel } from '../services/invoice-ai';

afterEach(() => { vi.unstubAllGlobals(); vi.useRealTimers(); });
const ok = () => new Response(JSON.stringify({ choices: [{ message: { content: JSON.stringify({ name: 'Sähköyhtiö', amount_eur: 42.55, due_date: '2026-11-25' }) } }] }), { status: 200 });
it('requests the free router directly and validates an invoice suggestion', async () => {
  const fetcher = vi.fn().mockResolvedValue(ok());
  vi.stubGlobal('fetch', fetcher);
  expect(await analyzeInvoice('test-key', 'Maksettava 42,55')).toEqual({ name: 'Sähköyhtiö', amountCents: 4255, date: '2026-11-25' });
  const [url, options] = fetcher.mock.calls[0];
  expect(url).toBe('https://openrouter.ai/api/v1/chat/completions');
  expect(JSON.parse(options.body).model).toBe('openrouter/free');
  expect(fetcher).toHaveBeenCalledTimes(1);
});
it('reads a JSON object surrounded by prose and a decimal comma', async () => {
  const content = 'Tässä tiedot: ```json\n{"name":"Sähköyhtiö","amount_eur":"42,55","due_date":"2026-11-25"}\n```';
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({ choices: [{ message: { content } }] }))));
  expect(await analyzeInvoice('test-key', 'teksti')).toEqual({ name: 'Sähköyhtiö', amountCents: 4255, date: '2026-11-25' });
});
it('reports empty or unrecognized model output without revealing it', async () => {
  for (const content of [null, 'salainen teksti', '{}']) {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({ choices: [{ message: { content } }] }))));
    await expect(analyzeInvoice('test-key', 'teksti')).rejects.toThrow(/tyhjä|ymmärrettävässä muodossa|tunnistettavia/);
  }
});
it('sends only free model identifiers to the selected Worker', async () => {
  const fetcher = vi.fn().mockResolvedValue(ok());
  vi.stubGlobal('fetch', fetcher);
  await analyzeInvoice('Bearer worker-test-key', 'teksti', 'worker');
  const [url, options] = fetcher.mock.calls[0];
  expect(url).toBe('https://api-worker.kocakhakan99.workers.dev/chat');
  expect(JSON.parse(options.body).model).toBe(invoiceModel);
  expect(options.headers.Authorization).toBe('Bearer worker-test-key');
});
it('leaves invalid dates empty and rejects malformed responses without leaking secrets', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({ choices: [{ message: { content: '{"name":null,"amount_eur":null,"due_date":"2026-02-30"}' } }] }), { status: 200 })));
  expect(await analyzeInvoice('test-key', 'teksti')).toEqual({ name: '', amountCents: null, date: '' });
  vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('secret test-key')));
  await expect(analyzeInvoice('test-key', 'teksti')).rejects.toThrow('Analyysi epäonnistui');
});
it('explains free-tier and key failures without exposing the provider response', async () => {
  const fetcher = vi.fn().mockResolvedValue(new Response('sensitive provider text', { status: 429 }));
  vi.stubGlobal('fetch', fetcher);
  await expect(analyzeInvoice('test-key', 'teksti')).rejects.toThrow('käyttöraja');
  const denied = vi.fn().mockResolvedValue(new Response('test-key', { status: 401 }));
  vi.stubGlobal('fetch', denied);
  await expect(analyzeInvoice('test-key', 'teksti')).rejects.toThrow('API-avain');
  expect(denied).toHaveBeenCalledTimes(1);
  vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('test-key')));
  await expect(analyzeInvoice('test-key', 'teksti')).rejects.toThrow('CORS-asetukset');
});

it('requires an API key for either provider before sending any request', async () => {
  const fetcher = vi.fn(); vi.stubGlobal('fetch', fetcher);
  await expect(analyzeInvoice('', 'teksti', 'openrouter')).rejects.toThrow('API-avain');
  await expect(analyzeInvoice('', 'teksti', 'worker')).rejects.toThrow('API-avain');
  expect(fetcher).not.toHaveBeenCalled();
});

it('explains that a Worker 401 may come from either Worker or OpenRouter credentials', async () => {
  const fetcher = vi.fn().mockResolvedValue(new Response('{\"error\":\"Unauthorized\"}', { status: 401 }));
  vi.stubGlobal('fetch', fetcher);
  await expect(analyzeInvoice('worker-test-key', 'teksti', 'worker')).rejects.toThrow('APP_API_KEY');
  await expect(analyzeInvoice('worker-test-key', 'teksti', 'worker')).rejects.toThrow('OpenRouter-avain');
});
