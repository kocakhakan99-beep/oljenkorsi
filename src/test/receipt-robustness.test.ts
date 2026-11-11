import { it, expect } from "vitest";
import { parseReceipt } from "../domain/receipts/parser";
import k from "./fixtures/receipt-example.json";
import jan from "./fixtures/receipt-jan.json";
import mar from "./fixtures/receipt-mar.json";
import korso from "./fixtures/receipt-smarket-korso.json";
import nov2 from "./fixtures/receipt-prisma-nov2.json";
import nov9 from "./fixtures/receipt-prisma-nov9.json";
import alepa from "./fixtures/receipt-alepa.json";
import koivukyla from "./fixtures/receipt-smarket-koivukyla.json";
import prismaPlain from "./fixtures/receipt-prisma-plain-7556.json";
import prismaCredit from "./fixtures/receipt-prisma-credit-4767.json";
import prismaPlain92 from "./fixtures/receipt-prisma-plain-9285.json";
import kmarketBasic from "./fixtures/receipt-kmarket-basic.json";

const receiptSignature = (draft: ReturnType<typeof parseReceipt>) => JSON.stringify([
  draft.chain, draft.merchant, draft.receiptId, draft.date, draft.total,
  draft.lines.map(line => [line.name.replace(/\s+/g, " "), line.net, line.gross, line.discount]),
]);

const cases = [
  { fixture: k, total: 3287, count: 15 }, { fixture: jan, total: 12146, count: 22 }, { fixture: mar, total: 7385, count: 27 },
  { fixture: korso, total: 2400, count: 9 }, { fixture: nov2, total: 2244, count: 9 },
  { fixture: nov9, total: 9285, count: 20 }, { fixture: alepa, total: 165, count: 2 }, { fixture: koivukyla, total: 1692, count: 6 },
  { fixture: prismaPlain, total: 7556, count: 22 }, { fixture: prismaCredit, total: 4767, count: 15 },
  { fixture: prismaPlain92, total: 9285, count: 20 },
];
it.each(cases)("parses receipt layouts: $total cents and $count lines", ({ fixture, total, count }) => {
  const d = parseReceipt(fixture.pages);
  expect(d.issues).toEqual([]); expect(d.total).toBe(total); expect(d.lines).toHaveLength(count);
  expect(d.lines.reduce((sum, l) => sum + l.net, 0)).toBe(total);
});
it("preserves quantities, normal-price discounts and conservative categorization", () => {
  const d = parseReceipt(nov2.pages);
  expect(d.lines.find(l => l.name.includes("MAISSISNACKS"))).toMatchObject({ net: 260, gross: 578, discount: 318, quantity: 2, unitPrice: 289 });
  const n = parseReceipt(nov9.pages);
  expect(n.lines.find(l => l.name.includes("HOUSUVAIPPA"))?.suggestedCategory).toBe("Lapset ja perhe");
  expect(n.lines.find(l => l.name.includes("RUKKASET"))?.suggestedCategory).toBe("Vaatteet");
  expect(n.lines.find(l => l.name.includes("PL-SETTI"))?.suggestedCategory).toBeNull();
  expect(parseReceipt(koivukyla.pages).lines.find(l => l.name.includes("POKE"))?.suggestedCategory).toBeNull();
});
it("survives 704 layout, decoration, Unicode-space and page-break variations with identical products", () => {
  for (const c of cases) for (let variant = 0; variant < 64; variant++) {
    const original = parseReceipt(c.fixture.pages);
    let lines = c.fixture.pages.flatMap(p => p.lines);
    if (variant & 1) lines = lines.map(l => /YHTEENSÄ/.test(l) ? `*** ${l.replace(/\*/g, "").trim()} ***` : l);
    if (variant & 2) lines = lines.map(l => l.replace(/ +/g, "\u202f\u00a0"));
    if (variant & 4) lines = lines.flatMap(l => l.trim() ? ["", l, ""] : [l]);
    if (variant & 8) lines = lines.map(l => l.replace(/KAMPANJA\s+-/, "KAMPANJA −"));
    if (variant & 16) lines = lines.flatMap(l => /K\d+\s+M\d+/.test(l) ? [l.replace(/\d{1,2}\.\d{1,2}\.20\d{2}/, ""), l.match(/\d{1,2}\.\d{1,2}\.20\d{2}/)?.[0] || ""] : [l]);
    const pages = variant & 32 ? [{ page: 1, lines: lines.slice(0, Math.ceil(lines.length / 2)) }, { page: 2, lines: lines.slice(Math.ceil(lines.length / 2)) }] : [{ page: 1, lines }];
    const d = parseReceipt(pages);
    expect(d.issues, `variant ${variant}, total ${c.total}`).toEqual([]);
    expect(d.total).toBe(c.total); expect(receiptSignature(d)).toBe(receiptSignature(original));
    expect(d.lines.map(l => [l.name.replace(/\s+/g, " "), l.net, l.gross, l.discount])).toEqual(original.lines.map(l => [l.name.replace(/\s+/g, " "), l.net, l.gross, l.discount]));
  }
});
it("rejects omitted products, changed prices and contradictory footer or payment totals", () => {
  for (const c of cases) {
    const lines = c.fixture.pages.flatMap(p => p.lines);
    const firstText = parseReceipt(c.fixture.pages).lines[0].source[0].text;
    const firstProduct = lines.findIndex(l => l.trimEnd() === firstText);
    const changed = lines.map((l, i) => i === firstProduct ? l.replace(/(\d+),(\d{2})(\s*\*?\s*)$/, (_, a, b, star) => `${Number(a)+1},${b}${star}`) : l);
    const payment = lines.findIndex(l => /^(?:(?:Debit|Credit)\s*\/\s*Veloitus|VISA\s+(?:Debit|Credit):)/i.test(l.trim()));
    const changedPayment = payment >= 0
      ? lines.map((l, i) => i === payment ? l.replace(/(\d+),(\d{2})(\s*EUR)?$/i, (_, a, b, eur) => `${Number(a)},${String((Number(b)+1)%100).padStart(2,'0')}${eur || ''}`) : l)
      : [...lines, `Debit/Veloitus ${((c.total + 1) / 100).toFixed(2).replace(".", ",")} EUR`];
    const variants = [
      lines.filter((_, i) => i !== firstProduct), changed,
      [...lines, `YHTEENSÄ 0,00 0,00 ${((c.total + 1) / 100).toFixed(2).replace(".", ",")}`],
      changedPayment,
    ];
    variants.forEach((corrupt, i) => expect(parseReceipt([{ page: 1, lines: corrupt }]).issues.some(issue => issue.blocking), `receipt ${c.total}, corruption ${i}`).toBe(true));
  }
});
it("recognizes safely wrapped S-group product names and prices, retaining both source rows", () => {
  const lines = ['*ALEPA ESIMERKKI*', 'K001 M000001/0001 9.11.2026 10:00', '*PITKÄ TUOTTEEN', 'NIMI 1,25 *', '*YHTEENSÄ 1,25 *'];
  const d = parseReceipt([{ page: 1, lines }]);
  expect(d.issues).toEqual([]); expect(d.lines[0]).toMatchObject({ name: 'PITKÄ TUOTTEEN NIMI', net: 125 }); expect(d.lines[0].source).toHaveLength(2);
});
it("blocks inconsistent quantity evidence even when the overall total still balances", () => {
  const pages = mar.pages.map(p => ({ ...p, lines: p.lines.map(l => l.replace('0,336 KG', '0,636 KG')) }));
  expect(parseReceipt(pages).issues.some(i => i.code === 'quantity-price' && i.blocking && i.source)).toBe(true);
});
it("shows unknown source rows and never drops a second receipt in the same PDF", () => {
  const lines = [...alepa.pages[0].lines]; const index = lines.findIndex(l => l.includes('COLA'));
  lines.splice(index, 0, '*MYSTEERIRIVI ??? *');
  expect(parseReceipt([{ page: 1, lines }]).issues.some(i => i.source?.text.includes('MYSTEERIRIVI'))).toBe(true);
  expect(parseReceipt([{ page: 1, lines: [...alepa.pages[0].lines, ...korso.pages[0].lines] }]).issues.some(i => i.code === 'multiple-receipts')).toBe(true);
});
it("parses a separately encoded copy with the same expense data", () => {
  const d = parseReceipt(korso.pages);
  const copy = parseReceipt(korso.pages.map(p => ({ ...p, lines: p.lines.map(l => l.replace(/ /g, '\u00a0')) })));
  expect(receiptSignature(copy)).toBe(receiptSignature(d));
});
it("recognizes the unstarred Prisma PDF as the same purchase as its starred copy", () => {
  expect(receiptSignature(parseReceipt(prismaPlain92.pages))).toBe(receiptSignature(parseReceipt(nov9.pages)));
});
it("parses an anonymized K-Market receipt with quantity evidence and VAT total", () => {
  const d = parseReceipt(kmarketBasic.pages);
  expect(d.chain).toBe("k");
  expect(d.issues).toEqual([]);
  expect(d.total).toBe(449);
  expect(d.lines).toHaveLength(2);
  expect(d.lines[1]).toMatchObject({ net: 121, quantity: 1, unitPrice: 121, unit: "kpl" });
  expect(d.lines.reduce((sum, line) => sum + line.net, 0)).toBe(d.total);
});
it("blocks the unstarred Prisma layout when either product-table boundary is missing", () => {
  const pages = structuredClone(prismaPlain.pages);
  const lines = pages[0].lines;
  const separators = lines.flatMap((line, index) => /^-{10,}$/.test(line.trim()) ? [index] : []);
  expect(separators).toHaveLength(2);
  lines.splice(separators[1], 1);
  const draft = parseReceipt(pages);
  expect(draft.lines).toEqual([]);
  expect(draft.issues.some(issue => issue.code === "structure" && issue.message.includes("rakennerajoista"))).toBe(true);
});

it("does not interpret an ALV column's decimal cents as a thousands prefix", () => {
  const pages = structuredClone(jan.pages); pages[0].lines.push('ALV VEROTON VERO VEROLLINEN', 'YHTEENSÄ 99,41 22,05 121,46', 'Debit/Veloitus 121,46 EUR');
  expect(parseReceipt(pages).issues).toEqual([]);
});

it("accepts a separately extracted header date and time without treating the time as a price", () => {
  const d = parseReceipt([{ page: 1, lines: ['ALEPA ESIMERKKI', 'K001 M000001/0001', '9.11.2026', '20.11', '*MAITO 1,00 *', '*YHTEENSÄ 1,00 *'] }]);
  expect(d.issues).toEqual([]); expect(d.date).toBe('2026-11-09'); expect(d.lines).toHaveLength(1);
});
it("blocks a missing campaign row even when paid item totals still match", () => {
  const pages = structuredClone(jan.pages); let removed = false;
  pages[0].lines = pages[0].lines.filter(l => { if (!removed && l.includes('KAMPANJA')) { removed = true; return false; } return true; });
  expect(parseReceipt(pages).issues.some(i => i.code === 'line-arithmetic' && i.blocking)).toBe(true);
});
