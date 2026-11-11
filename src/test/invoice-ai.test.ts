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
    vi.stubGlobal('fetch', vi.fn().mockImplementation(() => Promise.resolve(new Response(JSON.stringify({ choices: [{ message: { content } }] })))));
    await expect(analyzeInvoice('test-key', 'teksti')).rejects.toThrow(/tyhjä|ymmärrettävässä muodossa|tunnistettavia/);
  }
});
it('retries one empty free-router response and accepts the next answer', async () => {
  const empty = new Response(JSON.stringify({ choices: [{ message: { content: null } }] }));
  const fetcher = vi.fn().mockResolvedValueOnce(empty).mockResolvedValueOnce(ok());
  vi.stubGlobal('fetch', fetcher);
  expect(await analyzeInvoice('test-key', 'teksti', 'worker')).toEqual({ name: 'Sähköyhtiö', amountCents: 4255, date: '2026-11-25' });
  expect(fetcher).toHaveBeenCalledTimes(2);
  expect(fetcher.mock.calls.map(([, options]) => JSON.parse(options.body).model)).toEqual(['openrouter/free', 'openrouter/free']);
});
it('does not retry a model refusal or expose its text', async () => {
  const fetcher = vi.fn().mockResolvedValue(new Response(JSON.stringify({ choices: [{ finish_reason: 'content_filter', message: { content: null, refusal: 'sensitive' } }] })));
  vi.stubGlobal('fetch', fetcher);
  await expect(analyzeInvoice('test-key', 'teksti')).rejects.toThrow('kieltäytyi');
  expect(fetcher).toHaveBeenCalledTimes(1);
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

it('maps batched invoice suggestions by id even when the model reorders them', async () => {
  const { analyzeInvoiceBatch } = await import('../services/invoice-ai');
  const fetcher = vi.fn().mockResolvedValue(new Response(JSON.stringify({ choices: [{ message: { content: JSON.stringify({ invoices: [
    { id: 1, name: 'B', amount_eur: 20, due_date: null },
    { id: 0, name: 'A', amount_eur: 10, due_date: null },
  ] }) } }] })));
  vi.stubGlobal('fetch', fetcher);
  const result = await analyzeInvoiceBatch('key', ['first', 'second'], 'worker');
  expect(result.map(i => i.name)).toEqual(['A', 'B']);
  expect(result.map(i => i.amountCents)).toEqual([1000, 2000]);
  expect(fetcher).toHaveBeenCalledTimes(1);
});
it('only accepts receipt categories and product identifiers from the input', async () => {
  const { categorizeReceipt } = await import('../services/invoice-ai');
  const fetcher = vi.fn().mockResolvedValue(new Response(JSON.stringify({ choices: [{ message: { content: JSON.stringify({ categories: [
    { id: 'a', category: 'Ruoka' }, { id: 'b', category: 'Invented' }, { id: 'unknown', category: 'Ruoka' },
  ] }) } }] })));
  vi.stubGlobal('fetch', fetcher);
  expect(await categorizeReceipt('key', [{ id: 'a', name: 'MAITO' }, { id: 'b', name: 'UNKNOWN' }], ['Ruoka'])).toEqual({ a: 'Ruoka' });
  const sent = JSON.parse(fetcher.mock.calls[0][1].body);
  expect(sent.model).toBe('openrouter/free');
  expect(JSON.parse(sent.messages[1].content)).toEqual({ products: [{ id: 'a', name: 'MAITO' }, { id: 'b', name: 'UNKNOWN' }], categories: ['Ruoka'] });
});

it('categorizes a whole receipt batch with one request and reuses identical names safely', async () => {
  const { categorizeReceiptBatch } = await import('../services/invoice-ai');
  const fetcher = vi.fn().mockResolvedValue(new Response(JSON.stringify({ choices: [{ message: { content: JSON.stringify({ categories: [{ id: 'product-0', category: 'Ruoka' }, { id: 'product-1', category: 'Invented' }] }) } }] })));
  vi.stubGlobal('fetch', fetcher);
  const result = await categorizeReceiptBatch('key', [
    { id: 'receipt1', products: [{ id: 'row1', name: 'MAITO' }, { id: 'row2', name: '???' }] },
    { id: 'receipt2', products: [{ id: 'row1', name: 'MAITO' }] },
  ], ['Ruoka']);
  expect(result).toEqual({ receipt1: { row1: 'Ruoka' }, receipt2: { row1: 'Ruoka' } });
  expect(fetcher).toHaveBeenCalledTimes(1);
  const input = JSON.parse(JSON.parse(fetcher.mock.calls[0][1].body).messages[1].content);
  expect(input.products).toHaveLength(2);
  expect(input.products.every((p: Record<string, unknown>) => Object.keys(p).sort().join(',') === 'id,name')).toBe(true);
});
it('does not send receipt batch requests after cancellation', async () => {
  const { categorizeReceiptBatch } = await import('../services/invoice-ai');
  const controller = new AbortController(); controller.abort();
  const fetcher = vi.fn(); vi.stubGlobal('fetch', fetcher);
  await expect(categorizeReceiptBatch('key', [{ id: '1', products: [{ id: '1', name: 'MAITO' }] }], ['Ruoka'], controller.signal)).rejects.toThrow();
  expect(fetcher).not.toHaveBeenCalled();
});
