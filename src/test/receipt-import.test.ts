import { expect, it, vi } from "vitest";
import { empty, entry } from "../domain/model";
import { budgetSummary, occurrenceSum } from "../domain/calculations";
import { parseReceipt } from "../domain/receipts/parser";
import { prepareReceiptImport, receiptMatches } from "../domain/receipts/import";
import { backup, checksum, restore, validate } from "../services/validation";
import { LocalStorageProvider } from "../data/storage";
import fixture from "./fixtures/receipt-example.json";
const draft = () => parseReceipt(fixture.pages);
const cats = () => Object.fromEntries(draft().lines.map(l => [l.id, l.suggestedCategory || "Muu meno"]));
it("imports receipt totals as ordinary expenses without retaining receipt details", () => {
  const s = empty(); s.settings.month = "2026-11"; s.budgets["2026-04"] = { Ruoka: 50000 }; s.coverage.expenseMonths = ["2026-04", "2026-03"];
  const next = validate(prepareReceiptImport(s, draft(), cats(), { checked: true }));
  expect(next.expenses.reduce((n, e) => n + e.amount, 0)).toBe(3287);
  expect(next.expenses.every(e => e.date === "2026-04-05" && e.recurrence === "once")).toBe(true);
  expect("receiptImports" in next).toBe(false);
  expect(next.expenses.every(e => e.description === "")).toBe(true);
  expect(backup(next)).not.toContain("receiptImports");
  expect(backup(next)).not.toContain("HOUSUVAIPPA");
  expect(next.budgets).toEqual(s.budgets); expect(next.coverage.expenseMonths).toEqual(["2026-03"]);
  expect(budgetSummary(next, "2026-04").budgetedActual).toBeGreaterThan(0);
  expect(s.expenses).toEqual([]);
});
it("removes old receipt archives and imported product descriptions when migrating local data", () => {
  const next = prepareReceiptImport(empty(), draft(), cats(), { checked: true });
  const legacyData = {
    ...next,
    receiptImports: [{ draft: { merchant: "PRIVATE RECEIPT DETAILS" }, sourceHash: "private" }],
    expenses: next.expenses.map(e => ({ ...e, description: `Kuittituonti 00000000-0000-4000-8000-000000000000. PRIVATE PRODUCT ${e.id}` })),
  };
  const legacyText = JSON.stringify({ format: "Taloussuunnittelu", schemaVersion: 1, checksum: checksum(JSON.stringify(legacyData)), data: legacyData });
  const restored = restore(legacyText);
  expect("receiptImports" in restored).toBe(false);
  expect(restored.expenses.every(e => e.description === "")).toBe(true);
  const values = new Map<string, string>([["taloussuunnittelu.v1", legacyText]]);
  vi.stubGlobal("localStorage", {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => { values.set(key, value); },
    removeItem: (key: string) => { values.delete(key); },
  });
  try {
    const provider = new LocalStorageProvider();
    const loaded = provider.get();
    const saved = JSON.parse(values.get(provider.key)!);
    expect("receiptImports" in loaded).toBe(false);
    expect(saved.data).not.toHaveProperty("receiptImports");
    expect(saved.data.expenses.every((e: { description: string }) => e.description === "")).toBe(true);
    expect(values.get(provider.key)).not.toContain("PRIVATE RECEIPT DETAILS");
    expect(values.get(provider.key)).not.toContain("PRIVATE PRODUCT");
  } finally {
    vi.unstubAllGlobals();
  }
});
it("requires classification, confirmation and exact sum, never partially mutating state", () => {
  const s = empty();
  expect(() => prepareReceiptImport(s, draft(), {}, { checked: true })).toThrow("kategoria");
  expect(() => prepareReceiptImport(s, draft(), cats(), { checked: false })).toThrow("Tarkista");
  const broken = draft(); broken.total!++;
  expect(() => prepareReceiptImport(s, broken, cats(), { checked: true })).toThrow("täsmää");
  expect(s.expenses).toHaveLength(0);
});
it("replaces an existing one-off payment rather than doubling it", () => {
  const s = empty(); const e = entry({ name: "Korttiostos", amount: 3287, date: "2026-04-05", category: "Ruoka" }); s.expenses = [e];
  expect(receiptMatches(s, draft())).toHaveLength(1);
  expect(() => prepareReceiptImport(s, draft(), cats(), { checked: true })).toThrow("Samalle päivälle");
  const next = prepareReceiptImport(s, draft(), cats(), { checked: true, replaceEntryId: e.id });
  expect(next.expenses.some(x => x.id === e.id)).toBe(false);
  expect(next.expenses.reduce((n, e) => n + e.amount, 0)).toBe(3287);
});
it("replaces only a matching recurring occurrence, preserving the rest of the series", () => {
  const s = empty(), e = entry({ name: "Kuukausimaksu", amount: 3287, date: "2026-01-05", category: "Ruoka", recurrence: "monthly" }); s.expenses = [e];
  const next = prepareReceiptImport(s, draft(), cats(), { checked: true, replaceEntryId: e.id });
  const series = next.expenses.find(x => x.id === e.id)!;
  expect(occurrenceSum(series, "2026-04")).toBe(0); expect(occurrenceSum(series, "2026-05")).toBe(3287);
  expect(next.expenses.reduce((n, e) => n + occurrenceSum(e, "2026-04"), 0)).toBe(3287);
});
it("requires explicit removal of manual category actuals, while leaving budgets intact", () => {
  const s = empty(); s.budgetActuals["2026-04"] = { Ruoka: 12345, Vesi: 990 }; s.budgets["2026-04"] = { Ruoka: 50000 };
  expect(() => prepareReceiptImport(s, draft(), cats(), { checked: true })).toThrow("käsin");
  const next = prepareReceiptImport(s, draft(), cats(), { checked: true, clearActuals: true });
  expect(next.budgetActuals["2026-04"]).toEqual({ Vesi: 990 }); expect(next.budgets).toEqual(s.budgets);
});
it("honours occurrence overrides and clears an explicitly approved manual total in a replaced category", () => {
  const s = empty(); const e = entry({ name: "Korttiostos", amount: 3287, date: "2026-01-05", category: "Muu meno", recurrence: "monthly", status: "skipped", occurrenceStatuses: { "2026-04-05": "actual" } });
  s.expenses = [e]; s.budgetActuals["2026-04"] = { "Muu meno": 3287 };
  expect(receiptMatches(s, draft())).toHaveLength(1);
  expect(() => prepareReceiptImport(s, draft(), cats(), { checked: true, replaceEntryId: e.id })).toThrow("käsin");
  const next = prepareReceiptImport(s, draft(), cats(), { checked: true, replaceEntryId: e.id, clearActuals: true });
  expect(next.budgetActuals["2026-04"]).toEqual({});
  expect(next.expenses.reduce((n, e) => n + occurrenceSum(e, "2026-04"), 0)).toBe(3287);
});
