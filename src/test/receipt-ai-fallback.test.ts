import { expect, it } from 'vitest';
import { verifyAIReceipt, receiptSourceLines } from '../domain/receipts/ai-fallback';
import { parseReceipt } from '../domain/receipts/parser';
import { prepareReceiptImport } from '../domain/receipts/import';
import { empty } from '../domain/model';

const pages = [{ page: 1, lines: ['TESTIKAUPPA', '12.11.2026 12:30', 'MAITO 2,50', 'LEIPÄ 3,00', 'YHTEENSÄ 5,50'] }];
const proposal = () => ({ merchant: 'TESTIKAUPPA', merchant_source: 'p1-l1', date: '2026-11-12', date_source: 'p1-l2', total_cents: 550, total_source: 'p1-l5', products: [{ name: 'MAITO', net_cents: 250, source: 'p1-l3' }, { name: 'LEIPÄ', net_cents: 300, source: 'p1-l4' }] });
it('accepts a source-cited, balanced generic receipt and imports the verified cents', () => {
  expect(parseReceipt(pages).issues[0].code).toBe('unsupported');
  const draft = verifyAIReceipt(pages, proposal());
  expect(draft).toMatchObject({ parserVersion: 'receipt-ai-1', chain: 'generic', date: '2026-11-12', total: 550 });
  const result = prepareReceiptImport(empty(), draft, { 'p1-l3': 'Ruoka', 'p1-l4': 'Ruoka' }, { checked: true });
  expect(result.expenses.map(e => e.amount)).toEqual([550]);
  expect(receiptSourceLines(pages)[2].source.text).toBe('MAITO 2,50');
});
it('rejects fabricated rows, changed amounts, duplicate references and excluded sources', () => {
  const altered = proposal(); altered.products[0].net_cents = 251;
  expect(() => verifyAIReceipt(pages, altered)).toThrow();
  const fakeName = proposal(); fakeName.products[0].name = 'KAHVI';
  expect(() => verifyAIReceipt(pages, fakeName)).toThrow();
  const duplicate = proposal(); duplicate.products[1].source = duplicate.products[0].source;
  expect(() => verifyAIReceipt(pages, duplicate)).toThrow();
  expect(() => verifyAIReceipt(pages, proposal(), new Set(['p1-l1', 'p1-l2', 'p1-l3', 'p1-l5']))).toThrow();
  const badDate = proposal(); badDate.date = '2026-11-13';
  expect(() => verifyAIReceipt(pages, badDate)).toThrow();
});
it('blocks omitted priced rows, ambiguous discounts and contradictory total evidence', () => {
  const omitted = structuredClone(pages); omitted[0].lines.splice(3, 0, 'TUOTE 1,00');
  const value = proposal(); value.total_source = 'p1-l6'; value.products[1].source = 'p1-l5';
  expect(() => verifyAIReceipt(omitted, value)).toThrow();
  const discount = structuredClone(pages); discount[0].lines.splice(3, 0, 'ALENNUS -1,00');
  expect(() => verifyAIReceipt(discount, value)).toThrow();
  const conflict = structuredClone(pages); conflict[0].lines.push('YHTEENSÄ 8,00');
  expect(() => verifyAIReceipt(conflict, proposal())).toThrow();
  const repeated = structuredClone(pages); repeated[0].lines.push('YHTEENSÄ 5,50');
  expect(() => verifyAIReceipt(repeated, proposal())).toThrow();
  const trailingDiscount = structuredClone(pages); trailingDiscount[0].lines.splice(3, 0, 'ETU 1,00-');
  expect(() => verifyAIReceipt(trailingDiscount, value)).toThrow();
});
