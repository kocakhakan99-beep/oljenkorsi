import { z } from 'zod';
import { validDate } from '../calculations';
import type { ReceiptTextPage } from './parser';
import { receiptDraftSchema, type ReceiptDraft, type ReceiptSource } from './schema';

const proposalSchema = z.object({
  merchant: z.string().min(2).max(200), merchant_source: z.string().max(80),
  date: z.string().max(10), date_source: z.string().max(80),
  total_cents: z.number().int().positive().max(10000000000), total_source: z.string().max(80),
  products: z.array(z.object({ name: z.string().min(1).max(300), net_cents: z.number().int().nonnegative().max(10000000000), source: z.string().max(80) })).min(1).max(2000),
});
const amountAtEnd = /(?:^|\s)(\d+(?:[.,]\d{2}))\s*(?:€|EUR)?\s*\*?\s*$/i;
function cents(text: string) { const match = amountAtEnd.exec(text); return match ? Math.round(Number(match[1].replace(',', '.')) * 100) : null; }
function matchesDate(text: string, date: string) {
  if (!validDate(date)) return false;
  const [year, month, day] = date.split('-').map(Number);
  return [...text.matchAll(/\b(\d{1,2})[./-](\d{1,2})[./-](20\d{2})\b/g)].some(m => +m[1] === day && +m[2] === month && +m[3] === year)
    || text.includes(date);
}
export function receiptSourceLines(pages: ReceiptTextPage[]): { id: string; text: string; source: ReceiptSource }[] {
  return pages.flatMap(page => page.lines.map((text, index) => ({ id: `p${page.page}-l${index + 1}`, text: text.normalize('NFKC').trim(), source: { page: page.page, line: index + 1, text: text.normalize('NFKC').trim() } })));
}
/** A model proposal is only a set of pointers, never evidence by itself. */
export function verifyAIReceipt(pages: ReceiptTextPage[], value: unknown, sentIds?: ReadonlySet<string>): ReceiptDraft {
  const parsed = proposalSchema.safeParse(value);
  if (!parsed.success) throw Error('AI ei pystynyt jäsentämään kuittia. Kirjaa ostos tarvittaessa käsin.');
  const candidate = parsed.data;
  if (sentIds && [candidate.merchant_source, candidate.date_source, candidate.total_source, ...candidate.products.map(p => p.source)].some(id => !sentIds.has(id))) throw Error('AI viittasi tuntemattomaan lähderiviin.');
  const sources = receiptSourceLines(pages), byId = new Map(sources.map(line => [line.id, line]));
  const merchantLine = byId.get(candidate.merchant_source), dateLine = byId.get(candidate.date_source), totalLine = byId.get(candidate.total_source);
  const fail = () => { throw Error('Kuitin tietoja ei voitu varmistaa lähderiveistä ja loppusummasta. Kirjaa ostos tarvittaessa käsin.'); };
  if (!merchantLine || !merchantLine.text.toLocaleLowerCase('fi-FI').includes(candidate.merchant.toLocaleLowerCase('fi-FI')) || !dateLine || !matchesDate(dateLine.text, candidate.date) || !totalLine || !/^(?:\*\s*)?(?:YHTEENSÄ|YHTEENSA|YHTEENSÄÄN|MAKSETTAVA|SUMMA|TOTAL|AMOUNT DUE)(?:\s|:|$)/iu.test(totalLine.text) || cents(totalLine.text) !== candidate.total_cents) return fail();
  const totalIndex = sources.findIndex(line => line.id === candidate.total_source);
  const ids = new Set<string>();
  const lines = candidate.products.map(product => {
    const row = byId.get(product.source), index = sources.findIndex(line => line.id === product.source);
    if (!row || ids.has(product.source) || index >= totalIndex || cents(row.text) !== product.net_cents || !row.text.toLocaleLowerCase('fi-FI').includes(product.name.toLocaleLowerCase('fi-FI')) || /^(?:\*\s*)?(?:ALV|VERO|KORTTI|VISA|DEBIT|CREDIT|YHTEENSÄ|SUMMA|TOTAL|KÄTEINEN|CHANGE|MAKSU|BONUS|SÄÄSTÖ)(?:\s|:|$)/iu.test(row.text)) return fail();
    ids.add(product.source);
    const kind = /pantti/i.test(product.name) ? 'deposit' as const : /kassi/i.test(product.name) ? 'bag' as const : 'product' as const;
    return { id: product.source, name: product.name.trim(), quantity: null, unit: null, gross: product.net_cents, discount: 0, net: product.net_cents, kind, suggestedCategory: kind === 'deposit' ? 'Päivittäistavara' : null, source: [row.source] };
  });
  const indices = candidate.products.map(p => sources.findIndex(line => line.id === p.source));
  const productArea = sources.slice(Math.min(...indices), totalIndex);
  // Discount and refund layouts require store-specific allocation; never guess them.
  if (productArea.some(line => /(?:alennus|discount|kampanja|plussa-etu|palautus|refund|tasaerä|norm\.)/iu.test(line.text) || /(?:^|\s)-\s*\d+[,.]\d{2}|\d+[,.]\d{2}\s*-\s*(?:€|EUR)?\s*\*?$/i.test(line.text))) return fail();
  // Any other priced row inside the proposed product area is unresolved.
  if (productArea.some(line => cents(line.text) !== null && !ids.has(line.id))) return fail();
  if (lines.reduce((sum, line) => sum + line.net, 0) !== candidate.total_cents) return fail();
  for (const line of sources.slice(totalIndex + 1)) {
    if (/^(?:\*\s*)?(?:YHTEENSÄ|YHTEENSA|TOTAL)(?:\s|:|$)/iu.test(line.text)) {
      // A second total might be a second receipt, even when amounts match.
      if (cents(line.text) !== null) return fail();
    }
  }
  const fingerprintText = sources.map(line => line.text).join('\n');
  let hash = 14695981039346656037n;
  for (let i = 0; i < fingerprintText.length; i++) hash = BigInt.asUintN(64, (hash ^ BigInt(fingerprintText.charCodeAt(i))) * 1099511628211n);
  return receiptDraftSchema.parse({ parserVersion: 'receipt-ai-1', chain: 'generic', merchant: candidate.merchant.trim(), date: candidate.date, receiptId: `ai-${hash.toString(16)}-${fingerprintText.length}`, currency: 'EUR', total: candidate.total_cents, lines, issues: [] });
}
