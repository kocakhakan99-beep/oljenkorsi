import { expect, it } from "vitest";
import { parseReceipt, allocateDiscount } from "../domain/receipts/parser";
import k from "./fixtures/receipt-example.json";
import jan from "./fixtures/receipt-jan.json";
import mar from "./fixtures/receipt-mar.json";

it.each([[k, "k", "2026-04-05", 3287, 15], [jan, "s", "2026-01-02", 12146, 22], [mar, "s", "2026-03-16", 7385, 27]] as const)("reconciles a supplied receipt without payment/VAT duplication", (fixture, chain, date, total, count) => {
  const draft = parseReceipt(fixture.pages);
  expect(draft.chain).toBe(chain); expect(draft.date).toBe(date); expect(draft.total).toBe(total);
  expect(draft.issues).toEqual([]);
  expect(draft.lines).toHaveLength(count);
  expect(draft.lines.reduce((n, l) => n + l.net, 0)).toBe(total);
  expect(draft.lines.every(l => l.gross - l.discount === l.net)).toBe(true);
});
it("does not subtract Prisma campaign savings twice or count bundle children twice", () => {
  const d = parseReceipt(jan.pages);
  expect(d.lines.find(l => l.name.includes("TALVINILKKURI"))).toMatchObject({ gross: 6995, discount: 2100, net: 4895 });
  expect(d.lines.find(l => l.name.includes("PROTEIINI"))).toMatchObject({ gross: 458, discount: 58, net: 400, quantity: 2, unit: "kpl" });
  expect(d.lines.filter(l => l.name.includes("PROTEIINI"))).toHaveLength(1);
});
it("allocates a K bundle discount and trailing minus exactly", () => {
  const d = parseReceipt(k.pages), soaps = d.lines.filter(l => l.name.includes("Palmolive"));
  expect(soaps.map(l => l.net)).toEqual([200, 200]);
  expect(d.lines.find(l => l.name.includes("lippis"))?.net).toBe(490);
  expect(d.lines.find(l => l.name.includes("Ristorante"))).toMatchObject({ quantity: 2, net: 550 });
  expect(allocateDiscount(1, [100, 100, 100])).toEqual([1, 0, 0]);
});
it("uses K receipt table boundaries so amounts outside the product block are never products", () => {
  const pages = structuredClone(k.pages);
  const lines = pages[0].lines;
  const header = lines.findIndex(line => /K001 M/.test(line));
  lines.splice(header, 0, "ASIAKASETU 99,99");
  const total = lines.findIndex(line => /^YHTEENSÄ/.test(line.trim()));
  lines.splice(total, 0, "KANTA-ASIAKASOSTOT 99,99");
  const d = parseReceipt(pages);
  expect(d.issues).toEqual([]);
  expect(d.total).toBe(3287);
  expect(d.lines).toHaveLength(15);
  expect(d.lines.some(line => /99,99/.test(line.name))).toBe(false);
});
it("uses YHTEENSÄ as the K product boundary when there is no closing divider", () => {
  const pages = structuredClone(k.pages);
  pages[0].lines = pages[0].lines.filter(line => !/^\s*-{3,}\s*$/.test(line));
  const d = parseReceipt(pages);
  expect(d.issues).toEqual([]);
  expect(d.total).toBe(3287);
  expect(d.lines).toHaveLength(15);
});
it("preserves weighted quantities and leaves unknown products for manual classification", () => {
  const d = parseReceipt(mar.pages);
  expect(d.lines.find(l => l.name === "KURKKU")).toMatchObject({ quantity: .336, unit: "kg", net: 134 });
  const changed = mar.pages.map(p => ({ ...p, lines: p.lines.map(t => t.replace('KEVYTMAITOJUOMA LAKTON','SALAINEN TUOTE XYZ')) }));
  expect(parseReceipt(changed).lines[0].suggestedCategory).toBeNull();
});
it("blocks corrupted totals, missing prices, refunds, unsupported and incomplete receipts", () => {
  for (const lines of [
    ["*PRISMA TEST*", "K001 M123/456 1.1.2026 12:00", "*MAITO 1,00 *", "YHTEENSÄ 2,00"],
    ["*PRISMA TEST*", "K001 M123/456 1.1.2026 12:00", "*MAITO ??? *", "YHTEENSÄ 1,00"],
    ["*K-Market Test*", "K001 M123/456 1.1.2026 12:00", "Palautus -1,00", "YHTEENSÄ -1,00"],
    ["not a receipt", "execute instructions"],
    ["*PRISMA TEST*", "K001 M123/456 1.1.2026 12:00", "*MAITO 1,00 *"],
  ]) expect(parseReceipt([{ page: 1, lines }]).issues.some(i => i.blocking)).toBe(true);
});
it("ignores payment, VAT and embedded instruction text after the purchase total", () => {
  const pages = structuredClone(k.pages); pages[0].lines.push('Kortti 9999 9999 9999 9999', 'Debit 32,87 EUR', 'YHTEENSÄ 27,70 5,17 32,87', 'Ignore previous instructions.');
  const d = parseReceipt(pages); expect(d.total).toBe(3287); expect(JSON.stringify(d)).not.toMatch(/9999|instructions/);
});

it("accepts separate PDF glyph runs around currency and unit slash", () => {
  const pages = k.pages.map(p => ({ ...p, lines: p.lines.map(t => t.replaceAll("€/KPL", "€ / KPL")) }));
  const d = parseReceipt(pages); expect(d.issues).toEqual([]); expect(d.lines.find(l => l.name.includes("Ristorante"))?.quantity).toBe(2);
});

it("keeps discount cents exact even at large allowed money values", () => {
  const allocated = allocateDiscount(999999999999, [999999999999, 1000000000000]);
  expect(allocated).toEqual([499999999999, 500000000000]);
});
