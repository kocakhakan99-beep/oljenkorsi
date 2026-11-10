import { it, expect } from "vitest";
import collection from "../../examples/receipts/manifest.json";
import { parseReceipt } from "../domain/receipts/parser";

it("provides two independent fictional receipts for every recognized shop label", () => {
  expect(collection.fictional).toBe(true);
  expect(collection.receipts).toHaveLength(14);
  for (const shop of ['PRISMA', 'S-MARKET', 'ALEPA', 'SALE', 'K-Citymarket', 'K-Supermarket', 'K-Market']) expect(collection.receipts.filter(r => r.shop === shop)).toHaveLength(2);
  expect(new Set(collection.receipts.map(r => r.seed)).size).toBe(14);
});
it.each(collection.receipts)("parses the finished fictional PDF text $file with independently calculated totals", r => {
  const draft = parseReceipt(r.pages);
  expect(r.total).toBeGreaterThanOrEqual(5000); expect(r.total).toBeLessThanOrEqual(15000);
  expect(r.products.length).toBeGreaterThanOrEqual(25);
  expect(draft.issues).toEqual([]); expect(draft.total).toBe(r.total); expect(draft.chain).toBe(r.chain); expect(draft.date).toBe(r.date);
  expect(draft.lines).toHaveLength(r.products.length);
  expect(draft.lines.map(l => [l.name, l.gross, l.discount, l.net])).toEqual(r.products.map(p => [p.name, p.gross, p.discount, p.net]));
  expect(draft.lines.reduce((n, l) => n + l.net, 0)).toBe(r.total);
  for (let i = 0; i < r.products.length; i++) if (r.products[i].quantity !== 1 || r.products[i].unit === 'kg') expect(draft.lines[i]).toMatchObject({ quantity: r.products[i].quantity, unit: r.products[i].unit, unitPrice: r.products[i].unitPrice });
});
